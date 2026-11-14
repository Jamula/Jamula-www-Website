// Local diagnostic only: no field vitals, throttling, or interaction measurement.
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_BROWSER_EXIT_TIMEOUT_MS = 5000;

export function listenMeasurementServer(server, port = 0) {
  return new Promise((resolveListen, rejectListen) => {
    let completed = false;
    const finish = (error) => {
      if (completed) return;
      completed = true;
      server.removeListener("error", onError);
      server.removeListener("listening", onListening);
      error ? rejectListen(error) : resolveListen();
    };
    const onError = (error) => finish(error);
    const onListening = () => finish();

    server.once("error", onError);
    server.once("listening", onListening);
    try {
      server.listen(port, "127.0.0.1");
    } catch (error) {
      finish(error);
    }
  });
}

function browserHasExited(browser) {
  return (
    (browser.exitCode !== null && browser.exitCode !== undefined) ||
    (browser.signalCode !== null && browser.signalCode !== undefined)
  );
}

export function waitForBrowserExit(
  browser,
  timeoutMs = DEFAULT_BROWSER_EXIT_TIMEOUT_MS,
  { scheduleTimeout = setTimeout, cancelTimeout = clearTimeout } = {}
) {
  if (browserHasExited(browser)) return Promise.resolve(true);

  return new Promise((resolveExit, rejectExit) => {
    let timer;
    const finish = (error) => {
      browser.removeListener("exit", onExit);
      if (timer !== undefined) cancelTimeout(timer);
      error ? rejectExit(error) : resolveExit(true);
    };
    const onExit = () => finish();

    browser.once("exit", onExit);
    timer = scheduleTimeout(() => {
      if (browserHasExited(browser)) finish();
      else finish(new Error(`Browser child exit was not confirmed within ${timeoutMs} ms.`));
    }, timeoutMs);
    if (browserHasExited(browser)) finish();
  });
}

function closeMeasurementServer(
  server,
  timeoutMs,
  { scheduleTimeout = setTimeout, cancelTimeout = clearTimeout } = {}
) {
  return new Promise((resolveClose, rejectClose) => {
    let timer;
    let completed = false;
    const finish = (error) => {
      if (completed) return;
      completed = true;
      if (timer !== undefined) cancelTimeout(timer);
      error ? rejectClose(error) : resolveClose();
    };

    timer = scheduleTimeout(() => {
      if (completed) return;
      let destroyError;
      try {
        server.closeAllConnections?.();
      } catch (error) {
        destroyError = error;
      }
      finish(
        new Error(`Local measurement server close was not confirmed within ${timeoutMs} ms.`, {
          cause: destroyError,
        })
      );
    }, timeoutMs);

    try {
      server.close((error) =>
        finish(
          error ? new Error("Local measurement server close failed.", { cause: error }) : undefined
        )
      );
    } catch (error) {
      finish(new Error("Local measurement server close failed.", { cause: error }));
    }
  });
}

export async function cleanupMeasurementResources(
  { browser, server, profile },
  { exitTimeoutMs = DEFAULT_BROWSER_EXIT_TIMEOUT_MS, removeProfile = rm, ...timers } = {}
) {
  const errors = [];
  let browserExited = !browser || browserHasExited(browser);

  if (browser && !browserExited) {
    let killReturnedFalse = false;
    try {
      killReturnedFalse = !browser.kill();
    } catch (error) {
      errors.push(new Error("Browser child kill() failed.", { cause: error }));
    }

    try {
      await waitForBrowserExit(browser, exitTimeoutMs, timers);
      browserExited = true;
    } catch (error) {
      browserExited = browserHasExited(browser);
      if (killReturnedFalse && !browserExited) {
        errors.push(new Error("Browser child kill() returned false before exit was confirmed."));
      }
      errors.push(error);
    }
  }

  if (server?.listening) {
    try {
      await closeMeasurementServer(server, exitTimeoutMs, timers);
    } catch (error) {
      errors.push(error);
    }
  }

  if (profile && browserExited) {
    try {
      await removeProfile(profile, { recursive: true, force: true });
    } catch (error) {
      errors.push(new Error("Browser profile cleanup failed.", { cause: error }));
    }
  } else if (profile) {
    errors.push(
      new Error(
        `Browser profile retained because exit for the specific child process was not confirmed: ${profile}`
      )
    );
  }

  return errors;
}

export async function runMeasurementLifecycle(operation, resources = {}, cleanupOptions = {}) {
  let result;
  let operationalError;
  try {
    result = await operation(resources);
  } catch (error) {
    operationalError = error;
  }

  const cleanupErrors = await cleanupMeasurementResources(resources, cleanupOptions);
  if (operationalError && cleanupErrors.length) {
    throw new AggregateError(
      [operationalError, ...cleanupErrors],
      "Measurement failed and one or more cleanup actions also failed.",
      { cause: operationalError }
    );
  }
  if (operationalError) throw operationalError;
  if (cleanupErrors.length) {
    throw new AggregateError(cleanupErrors, "One or more measurement cleanup actions failed.", {
      cause: cleanupErrors[0],
    });
  }
  return result;
}

export function createMeasurementConnection(
  browser,
  { scheduleTimeout = setTimeout, cancelTimeout = clearTimeout } = {}
) {
  let id = 0;
  let buffer = "";
  const pending = new Map();
  const eventHandlers = new Map();
  let browserFailure;
  function failBrowser(error) {
    browserFailure ??= error;
    for (const callback of pending.values()) {
      cancelTimeout(callback.timer);
      callback.reject(browserFailure);
    }
    pending.clear();
  }
  browser.on("error", failBrowser);
  browser.on("exit", (code) => {
    failBrowser(new Error(`Browser exited: ${code}`));
  });
  browser.stdio[3].on("error", failBrowser);
  browser.stdio[4].on("error", failBrowser);
  browser.stderr.resume();
  browser.stdio[4].setEncoding("utf8");
  browser.stdio[4].on("data", (chunk) => {
    buffer += chunk;
    let end;
    while ((end = buffer.indexOf("\0")) !== -1) {
      const message = JSON.parse(buffer.slice(0, end));
      buffer = buffer.slice(end + 1);
      if (message.id) {
        const callback = pending.get(message.id);
        if (callback) {
          pending.delete(message.id);
          cancelTimeout(callback.timer);
          message.error
            ? callback.reject(new Error(JSON.stringify(message.error)))
            : callback.resolve(message.result);
        }
      } else {
        eventHandlers.get(`${message.sessionId}:${message.method}`)?.(message.params);
      }
    }
  });
  function send(method, params = {}, sessionId) {
    return new Promise((resolveSend, reject) => {
      if (browserFailure) return reject(browserFailure);
      const requestId = ++id;
      const timer = scheduleTimeout(() => {
        pending.delete(requestId);
        reject(new Error(`CDP timeout: ${method}`));
      }, 15000);
      pending.set(requestId, { resolve: resolveSend, reject, timer });
      try {
        browser.stdio[3].write(`${JSON.stringify({ id: requestId, method, params, sessionId })}\0`);
      } catch (error) {
        failBrowser(error);
      }
    });
  }
  return { send, eventHandlers };
}

export async function navigateMeasurementPage(
  send,
  eventHandlers,
  sessionId,
  url,
  { scheduleTimeout = setTimeout, cancelTimeout = clearTimeout } = {}
) {
  const eventKey = `${sessionId}:Page.loadEventFired`;
  let timer;
  const cancelLoad = () => {
    cancelTimeout(timer);
    eventHandlers.delete(eventKey);
  };
  const loaded = new Promise((resolveLoaded, reject) => {
    timer = scheduleTimeout(() => {
      cancelLoad();
      reject(new Error("Page load timeout"));
    }, 15000);
    eventHandlers.set(eventKey, () => {
      cancelLoad();
      resolveLoaded();
    });
  });
  // Loading can time out while the navigation command is still pending.
  loaded.catch(() => {});
  try {
    const navigation = await send("Page.navigate", { url }, sessionId);
    if (navigation.errorText) throw new Error(navigation.errorText);
    await loaded;
  } finally {
    cancelLoad();
  }
}

export async function runMeasurement() {
  const resources = {};
  return runMeasurementLifecycle(async () => {
    const root = resolve("dist");
    const profile = await mkdtemp(resolve(".performance-profile-"));
    resources.profile = profile;
    const server = createServer(async (req, res) => {
      const pathname = new URL(req.url, "http://127.0.0.1").pathname;
      const relative =
        pathname === "/404.html"
          ? "404.html"
          : pathname.endsWith("/")
            ? `${pathname}index.html`
            : pathname;
      const file = resolve(root, `.${sep}${relative.replace(/^\/+/, "")}`);
      if (!file.startsWith(`${root}${sep}`)) {
        res.writeHead(403).end();
        return;
      }
      try {
        const bytes = await readFile(file);
        const type = file.endsWith(".html")
          ? "text/html; charset=utf-8"
          : file.endsWith(".js")
            ? "text/javascript"
            : file.endsWith(".css")
              ? "text/css"
              : file.endsWith(".png")
                ? "image/png"
                : "application/octet-stream";
        res
          .writeHead(200, {
            "content-type": type,
            "content-length": bytes.length,
            "cache-control": "no-store",
          })
          .end(bytes);
      } catch {
        res.writeHead(404).end();
      }
    });
    resources.server = server;
    await listenMeasurementServer(server);
    const port = server.address().port;
    const edge =
      process.env.EDGE_PATH || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
    const browser = spawn(
      edge,
      [
        "--headless=new",
        "--disable-gpu",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-background-networking",
        "--disable-component-update",
        "--disable-sync",
        "--disable-features=msEdgeSidebarV2,msEdgeDiscover,OptimizationHints",
        "--proxy-server=127.0.0.1:9",
        "--proxy-bypass-list=127.0.0.1",
        "--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1",
        `--user-data-dir=${profile}`,
        "--remote-debugging-pipe",
        "about:blank",
      ],
      { stdio: ["ignore", "ignore", "pipe", "pipe", "pipe"] }
    );
    resources.browser = browser;

    const { send, eventHandlers } = createMeasurementConnection(browser);
    const instrumentation = `(() => {
  const state = window.__measurement = { lcp: null, shifts: [] };
  new PerformanceObserver(list => {
    for (const entry of list.getEntries()) state.lcp = entry.startTime;
  }).observe({ type: "largest-contentful-paint", buffered: true });
  new PerformanceObserver(list => {
    for (const entry of list.getEntries()) if (!entry.hadRecentInput) state.shifts.push({
      time: entry.startTime, value: entry.value,
      sources: entry.sources.map(source => source.node?.outerHTML?.slice(0, 200) ?? null)
    });
  }).observe({ type: "layout-shift", buffered: true });
})()`;
    const extraction = `(() => {
  const nav = performance.getEntriesByType("navigation")[0];
  const paint = performance.getEntriesByName("first-contentful-paint")[0];
  let max = 0, sum = 0, start = 0, last = 0;
  for (const {time, value} of window.__measurement.shifts) {
    if (!sum || time - last >= 1000 || time - start >= 5000) { start = time; sum = 0; }
    sum += value; last = time; max = Math.max(max, sum);
  }
  return { lcp: window.__measurement.lcp, fcp: paint?.startTime ?? null, shifts: window.__measurement.shifts,
    ttfb: nav?.responseStart ?? null, cls: max,
    resources: performance.getEntriesByType("resource").map(x => ({name: x.name, transferSize: x.transferSize})),
    documentTransfer: nav?.transferSize ?? null };
})()`;
    const version = await send("Browser.getVersion");
    console.log(
      JSON.stringify({
        browser: version.product,
        protocol: version.protocolVersion,
        node: process.version,
        server: `127.0.0.1:${port}`,
      })
    );
    for (const [device, width, height, scale, mobile] of [
      ["desktop", 1365, 768, 1, false],
      ["mobile", 390, 844, 2.6, true],
    ]) {
      for (const route of ["/", "/privacy/", "/404.html"]) {
        for (let run = 1; run <= 5; run++) {
          const { browserContextId } = await send("Target.createBrowserContext", {
            disposeOnDetach: true,
          });
          const { targetId } = await send("Target.createTarget", {
            url: "about:blank",
            browserContextId,
          });
          const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
          let externalRequests = 0;
          eventHandlers.set(`${sessionId}:Fetch.requestPaused`, (event) => {
            const local = event.request.url.startsWith(`http://127.0.0.1:${port}/`);
            if (!local) externalRequests++;
            send(
              local ? "Fetch.continueRequest" : "Fetch.failRequest",
              local
                ? { requestId: event.requestId }
                : { requestId: event.requestId, errorReason: "BlockedByClient" },
              sessionId
            ).catch(() => {});
          });
          await send("Page.enable", {}, sessionId);
          await send("Runtime.enable", {}, sessionId);
          await send("Network.enable", {}, sessionId);
          await send("Network.setCacheDisabled", { cacheDisabled: true }, sessionId);
          await send("Network.setBypassServiceWorker", { bypass: true }, sessionId);
          await send("Fetch.enable", { patterns: [{ urlPattern: "*" }] }, sessionId);
          await send(
            "Emulation.setDeviceMetricsOverride",
            { width, height, deviceScaleFactor: scale, mobile },
            sessionId
          );
          await send(
            "Page.addScriptToEvaluateOnNewDocument",
            { source: instrumentation },
            sessionId
          );
          await navigateMeasurementPage(
            send,
            eventHandlers,
            sessionId,
            `http://127.0.0.1:${port}${route}`
          );
          await new Promise((r) => setTimeout(r, 3000));
          const result = await send(
            "Runtime.evaluate",
            { expression: extraction, returnByValue: true },
            sessionId
          );
          if (
            result.exceptionDetails ||
            result.result.value?.lcp == null ||
            result.result.value?.fcp == null
          )
            throw new Error(`Missing measurements: ${JSON.stringify(result)}`);
          console.log(
            JSON.stringify({ device, route, run, externalRequests, ...result.result.value })
          );
          eventHandlers.delete(`${sessionId}:Fetch.requestPaused`);
          await send("Target.disposeBrowserContext", { browserContextId });
        }
      }
    }
  }, resources);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  runMeasurement().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
