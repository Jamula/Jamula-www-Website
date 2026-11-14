// Local diagnostic only: no field vitals, throttling, or interaction measurement.
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join, resolve, sep } from "node:path";

const root = resolve("dist");
const profile = await mkdtemp(resolve(".performance-profile-"));
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
await new Promise((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
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

let id = 0;
let buffer = "";
const pending = new Map();
const eventHandlers = new Map();
let browserFailure;
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
        clearTimeout(callback.timer);
        message.error
          ? callback.reject(new Error(JSON.stringify(message.error)))
          : callback.resolve(message.result);
      }
    } else {
      eventHandlers.get(`${message.sessionId}:${message.method}`)?.(message.params);
    }
  }
});
function failBrowser(error) {
  browserFailure = error;
  for (const callback of pending.values()) {
    clearTimeout(callback.timer);
    callback.reject(error);
  }
  pending.clear();
}
browser.on("error", failBrowser);
browser.on("exit", (code) => {
  failBrowser(new Error(`Browser exited: ${code}`));
});
function send(method, params = {}, sessionId) {
  return new Promise((resolveSend, reject) => {
    if (browserFailure) return reject(browserFailure);
    const requestId = ++id;
    const timer = setTimeout(() => {
      pending.delete(requestId);
      reject(new Error(`CDP timeout: ${method}`));
    }, 15000);
    pending.set(requestId, { resolve: resolveSend, reject, timer });
    browser.stdio[3].write(`${JSON.stringify({ id: requestId, method, params, sessionId })}\0`);
  });
}
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
try {
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
        await send("Page.addScriptToEvaluateOnNewDocument", { source: instrumentation }, sessionId);
        const loaded = new Promise((resolveLoaded, reject) => {
          const timer = setTimeout(() => reject(new Error("Page load timeout")), 15000);
          eventHandlers.set(`${sessionId}:Page.loadEventFired`, () => {
            clearTimeout(timer);
            resolveLoaded();
          });
        });
        const navigation = await send(
          "Page.navigate",
          { url: `http://127.0.0.1:${port}${route}` },
          sessionId
        );
        if (navigation.errorText) throw new Error(navigation.errorText);
        await loaded;
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
        eventHandlers.delete(`${sessionId}:Page.loadEventFired`);
        await send("Target.disposeBrowserContext", { browserContextId });
      }
    }
  }
} finally {
  if (browser.exitCode === null && browser.signalCode === null && !browserFailure) {
    const exited = new Promise((resolveExit) => browser.once("exit", resolveExit));
    browser.kill();
    await exited;
  }
  await new Promise((resolveClose) => server.close(resolveClose));
  await rm(profile, { recursive: true, force: true });
}
