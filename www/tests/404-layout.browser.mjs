// Opt-in local browser regression: node --test www\tests\404-layout.browser.mjs
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdtemp, readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  createMeasurementConnection,
  listenMeasurementServer,
  navigateMeasurementPage,
  runMeasurementLifecycle,
} from "../scripts/measure-local-performance.mjs";
import { requireBrowserEgressIsolationAcknowledgement } from "./browser-egress-isolation.mjs";

const siteRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(siteRoot, "dist");
const probeUrl = "http://probe.invalid/blocked-by-local-regression";
const geometry = `(() => ({
  clientWidth: document.documentElement.clientWidth,
  innerWidth: window.innerWidth,
  scrollbarWidth: window.innerWidth - document.documentElement.clientWidth,
  scrollHeight: document.documentElement.scrollHeight,
  viewportHeight: window.innerHeight,
  verticalOverflow: document.documentElement.scrollHeight > window.innerHeight,
  scrollbarGutter: getComputedStyle(document.documentElement).scrollbarGutter,
  panelHidden: document.querySelector("#analytics-consent").hidden,
  positions: [".site-header__inner", ".not-found", ".site-footer__inner", ".analytics"].map(selector => {
    const r = document.querySelector(selector).getBoundingClientRect();
    return {selector, x: r.x, y: r.y, width: r.width};
  })
}))()`;

function waitForMainFrameExecutionContext(eventHandlers, sessionId, frameId, url) {
  const contextKey = `${sessionId}:Runtime.executionContextCreated`;
  const commitKey = `${sessionId}:Page.frameNavigated`;
  let timer;
  let cancelWait;
  const ready = new Promise((resolveReady, rejectReady) => {
    let committed = false;
    let contextId;
    const cleanup = () => {
      clearTimeout(timer);
      eventHandlers.delete(contextKey);
      eventHandlers.delete(commitKey);
    };
    const resolveWhenReady = () => {
      if (!committed || contextId === undefined) return;
      cleanup();
      resolveReady(contextId);
    };
    eventHandlers.set(contextKey, ({ context }) => {
      if (context.auxData?.frameId !== frameId || !context.auxData?.isDefault) return;
      contextId = context.id;
      resolveWhenReady();
    });
    eventHandlers.set(commitKey, ({ frame }) => {
      if (frame.id !== frameId || frame.url !== url) return;
      committed = true;
      resolveWhenReady();
    });
    cancelWait = cleanup;
    timer = setTimeout(() => {
      cleanup();
      rejectReady(new Error("404 document commit or main-frame execution context timeout"));
    }, 5000);
  });
  return { ready, cancel: () => cancelWait?.() };
}

test("404 document readiness waits for the matching commit and default context", async () => {
  for (const contextFirst of [false, true]) {
    const handlers = new Map();
    const { ready, cancel } = waitForMainFrameExecutionContext(
      handlers,
      "session",
      "main",
      "http://localhost/404.html"
    );
    let settled = false;
    ready.then(
      () => {
        settled = true;
      },
      () => {}
    );
    const commit = (frame) => handlers.get("session:Page.frameNavigated")({ frame });
    const context = (id, frameId, isDefault) =>
      handlers.get("session:Runtime.executionContextCreated")({
        context: { id, auxData: { frameId, isDefault } },
      });
    commit({ id: "child", url: "http://localhost/404.html" });
    commit({ id: "main", url: "about:blank" });
    context(1, "child", true);
    context(2, "main", false);
    if (contextFirst) context(3, "main", true);
    else commit({ id: "main", url: "http://localhost/404.html" });
    await Promise.resolve();
    assert.equal(settled, false);
    if (contextFirst) commit({ id: "main", url: "http://localhost/404.html" });
    else context(3, "main", true);
    assert.equal(await ready, 3);
    assert.equal(handlers.size, 0);
    cancel();
  }
});

test("404 document readiness cancellation removes its event handlers", () => {
  const handlers = new Map();
  const { cancel } = waitForMainFrameExecutionContext(handlers, "session", "main", "url");
  assert.equal(handlers.size, 2);
  cancel();
  assert.equal(handlers.size, 0);
});

function buildFreshSite() {
  const command = process.platform === "win32" ? "npm.cmd run build" : "npm run build";
  const result = spawnSync(command, {
    cwd: siteRoot,
    env: { ...process.env, ASTRO_TELEMETRY_DISABLED: "1" },
    encoding: "utf8",
    shell: true,
  });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `Fresh site build failed.\n${result.stdout}\n${result.stderr}`);
}

test("404 layout is stable across delayed consent and the desktop scrollbar transition", async (t) => {
  requireBrowserEgressIsolationAcknowledgement();
  buildFreshSite();

  const resources = {};
  await runMeasurementLifecycle(async () => {
    const server = createServer(async (req, res) => {
      const url = new URL(req.url, "http://127.0.0.1");
      const file = resolve(dist, `.${sep}${decodeURIComponent(url.pathname)}`);
      if (!file.startsWith(`${dist}${sep}`)) return res.writeHead(403).end();
      try {
        let bytes = await readFile(file);
        if (url.searchParams.has("without-gutter")) {
          const html = bytes.toString("utf8");
          const headEnd = html.indexOf("</head>");
          if (headEnd < 0) return res.writeHead(500).end("Missing document head");
          bytes = Buffer.from(
            `${html.slice(0, headEnd)}<style>html { scrollbar-gutter: auto !important; }</style>${html.slice(headEnd)}`
          );
        }
        const type = file.endsWith(".html")
          ? "text/html"
          : file.endsWith(".css")
            ? "text/css"
            : file.endsWith(".js")
              ? "text/javascript"
              : "application/octet-stream";
        res.writeHead(200, { "content-type": type, "cache-control": "no-store" }).end(bytes);
      } catch (error) {
        res.writeHead(error.code === "ENOENT" ? 404 : 500).end(String(error));
      }
    });
    resources.server = server;
    await listenMeasurementServer(server);
    const origin = `http://127.0.0.1:${server.address().port}`;
    resources.profile = await mkdtemp(join(tmpdir(), "jamula-404-regression-"));
    const browser = spawn(
      process.env.EDGE_PATH || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
      [
        "--headless=new",
        "--disable-gpu",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-background-networking",
        "--disable-component-update",
        "--disable-sync",
        "--disable-quic",
        "--disable-features=msEdgeSidebarV2,msEdgeDiscover,OptimizationHints",
        "--enable-automation",
        "--proxy-server=127.0.0.1:9",
        "--proxy-bypass-list=127.0.0.1",
        "--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1",
        `--user-data-dir=${resources.profile}`,
        "--remote-debugging-pipe",
        "about:blank",
      ],
      { stdio: ["ignore", "ignore", "pipe", "pipe", "pipe"] }
    );
    resources.browser = browser;
    const { send, eventHandlers } = createMeasurementConnection(browser);
    const version = await send("Browser.getVersion");
    const { arguments: browserArguments } = await send("Browser.getBrowserCommandLine");
    for (const requiredArgument of [
      "--proxy-server=127.0.0.1:9",
      "--proxy-bypass-list=127.0.0.1",
      "--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1",
    ]) {
      assert.ok(
        browserArguments.includes(requiredArgument),
        `Browser network restriction is missing: ${requiredArgument}`
      );
    }
    t.diagnostic(JSON.stringify({ browser: version.product, node: process.version }));

    async function verifyInterceptionBeforeNavigation() {
      const { browserContextId } = await send("Target.createBrowserContext", {
        disposeOnDetach: true,
      });
      const { targetId } = await send("Target.createTarget", {
        url: "about:blank",
        browserContextId,
      });
      const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
      const externalRequests = [];
      const requestErrors = [];
      const requestTasks = [];
      eventHandlers.set(`${sessionId}:Fetch.requestPaused`, (event) => {
        externalRequests.push(event.request.url);
        requestTasks.push(
          send(
            "Fetch.failRequest",
            { requestId: event.requestId, errorReason: "BlockedByClient" },
            sessionId
          ).catch((error) => requestErrors.push(error))
        );
      });
      try {
        await send("Page.enable", {}, sessionId);
        await send("Runtime.enable", {}, sessionId);
        await send("Fetch.enable", { patterns: [{ urlPattern: "*" }] }, sessionId);
        const result = await send(
          "Runtime.evaluate",
          {
            expression: `fetch("${probeUrl}").then(() => false, () => true)`,
            returnByValue: true,
            awaitPromise: true,
          },
          sessionId
        );
        assert.equal(result.exceptionDetails, undefined, JSON.stringify(result.exceptionDetails));
        assert.equal(result.result.value, true, "The synthetic non-local request must be blocked");
        await Promise.all(requestTasks);
        assert.deepEqual(externalRequests, [probeUrl], "CDP must intercept the synthetic probe");
        assert.deepEqual(requestErrors, []);
      } finally {
        eventHandlers.delete(`${sessionId}:Fetch.requestPaused`);
        await send("Target.disposeBrowserContext", { browserContextId });
      }
    }

    await verifyInterceptionBeforeNavigation();

    async function runScenario({
      device,
      width,
      height,
      deviceScaleFactor,
      mobile,
      withoutGutter,
    }) {
      const { browserContextId } = await send("Target.createBrowserContext", {
        disposeOnDetach: true,
      });
      const { targetId } = await send("Target.createTarget", {
        url: "about:blank",
        browserContextId,
      });
      const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
      const externalRequests = [];
      const requestErrors = [];
      const requestTasks = [];
      let heldConsentRequest;
      eventHandlers.set(`${sessionId}:Fetch.requestPaused`, (event) => {
        const local = event.request.url.startsWith(`${origin}/`);
        if (!local) externalRequests.push(event.request.url);
        if (local && new URL(event.request.url).pathname === "/analytics-consent.js") {
          heldConsentRequest = event.requestId;
          return;
        }
        requestTasks.push(
          send(
            local ? "Fetch.continueRequest" : "Fetch.failRequest",
            local
              ? { requestId: event.requestId }
              : { requestId: event.requestId, errorReason: "BlockedByClient" },
            sessionId
          ).catch((error) => requestErrors.push(error))
        );
      });
      await send("Page.enable", {}, sessionId);
      await send("Runtime.enable", {}, sessionId);
      await send("Network.enable", {}, sessionId);
      await send("Network.setCacheDisabled", { cacheDisabled: true }, sessionId);
      await send("Network.setBypassServiceWorker", { bypass: true }, sessionId);
      await send("Fetch.enable", { patterns: [{ urlPattern: "*" }] }, sessionId);
      await send(
        "Emulation.setDeviceMetricsOverride",
        { width, height, deviceScaleFactor, mobile },
        sessionId
      );
      await send(
        "Page.addScriptToEvaluateOnNewDocument",
        {
          source: `
            window.__shifts = [];
            new PerformanceObserver(list => {
              for (const entry of list.getEntries()) if (!entry.hadRecentInput)
                window.__shifts.push(entry.value);
            }).observe({type: "layout-shift", buffered: true});`,
        },
        sessionId
      );
      const evaluate = async (expression, contextId) => {
        const result = await send(
          "Runtime.evaluate",
          {
            expression,
            returnByValue: true,
            awaitPromise: true,
            ...(contextId === undefined ? {} : { contextId }),
          },
          sessionId
        );
        assert.equal(result.exceptionDetails, undefined, JSON.stringify(result.exceptionDetails));
        return result.result.value;
      };
      const route = `/404.html${withoutGutter ? "?without-gutter=1" : ""}`;
      const pageUrl = `${origin}${route}`;
      const { frameTree } = await send("Page.getFrameTree", {}, sessionId);
      const mainFrameContext = waitForMainFrameExecutionContext(
        eventHandlers,
        sessionId,
        frameTree.frame.id,
        pageUrl
      );
      const loaded = navigateMeasurementPage(send, eventHandlers, sessionId, pageUrl);
      loaded.catch(() => {});
      try {
        const contextId = await mainFrameContext.ready;
        await evaluate(
          `new Promise((resolve, reject) => {
          const deadline = performance.now() + 5000;
          const check = () => {
            if (document.querySelector(".analytics") && performance.getEntriesByName("first-contentful-paint").length)
              resolve(true);
            else if (performance.now() > deadline) reject(new Error("No initial 404 paint"));
            else requestAnimationFrame(check);
          };
          requestAnimationFrame(check);
        })`,
          contextId
        );
        assert.ok(heldConsentRequest, "Consent module must be held until initial paint");
        const before = await evaluate(geometry);
        assert.equal(before.panelHidden, true);
        if (device === "desktop")
          assert.equal(
            before.verticalOverflow,
            false,
            "The desktop page must start without overflow"
          );
        assert.equal(
          before.scrollbarGutter,
          withoutGutter ? "auto" : "stable",
          "The test scenario must use its intended gutter rule"
        );
        await send("Fetch.continueRequest", { requestId: heldConsentRequest }, sessionId);
        heldConsentRequest = undefined;
        await loaded;
        await evaluate(
          "document.fonts.ready.then(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))"
        );
        const after = await evaluate(geometry);
        const shifts = await evaluate("window.__shifts");
        t.diagnostic(JSON.stringify({ device, withoutGutter, before, after, shifts }));
        assert.equal(after.panelHidden, false);
        assert.ok(after.verticalOverflow, "Delayed consent must introduce vertical overflow");
        if (device === "desktop") {
          assert.equal(before.scrollbarWidth, 0, "Desktop scenario must start without a scrollbar");
          assert.ok(
            after.scrollbarWidth > 0,
            "Untested: this environment did not produce the classic desktop scrollbar transition"
          );
        }
        if (device === "desktop" && withoutGutter) {
          assert.ok(
            Math.abs(after.positions[0].x - before.positions[0].x) > 0,
            "Negative control must move the centered header when the scrollbar appears"
          );
          assert.ok(
            shifts.reduce((sum, value) => sum + value, 0) > 0.1,
            `Negative control did not reproduce the layout shift: ${JSON.stringify(shifts)}`
          );
        } else {
          assert.deepEqual(after.positions, before.positions, "Visible landmarks must not move");
          if (device === "desktop") {
            assert.ok(
              shifts.reduce((sum, value) => sum + value, 0) <= 0.1,
              `Local delayed-initialization CLS exceeded 0.1: ${JSON.stringify(shifts)}`
            );
          }
        }

        const { nodes } = await send("Accessibility.getFullAXTree", {}, sessionId);
        const exposed = nodes.filter((node) => !node.ignored);
        for (const role of ["banner", "navigation", "main", "contentinfo"])
          assert.ok(
            exposed.some((node) => node.role?.value === role),
            `Missing ${role}`
          );
        assert.ok(
          exposed.some(
            (node) => node.role?.value === "heading" && node.name?.value === "Page not found"
          )
        );
        assert.ok(
          exposed.some(
            (node) => node.role?.value === "link" && node.name?.value === "Return to the home page"
          )
        );
        assert.ok(
          exposed.some(
            (node) => node.role?.value === "region" && node.name?.value === "Your analytics choice"
          )
        );
        assert.deepEqual(
          await evaluate(`({
            storage: localStorage.length,
            externalScripts: [...document.scripts].filter(s => s.src && new URL(s.src).origin !== location.origin).length,
            expanded: document.querySelector("#analytics-preferences").getAttribute("aria-expanded")
          })`),
          { storage: 0, externalScripts: 0, expanded: "true" }
        );
        await send(
          "Input.dispatchKeyEvent",
          { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 },
          sessionId
        );
        await send(
          "Input.dispatchKeyEvent",
          { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 },
          sessionId
        );
        assert.equal(
          await evaluate('document.activeElement?.getAttribute("href")'),
          "#main-content"
        );
        await send(
          "Input.dispatchKeyEvent",
          { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 },
          sessionId
        );
        await send(
          "Input.dispatchKeyEvent",
          { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 },
          sessionId
        );
        assert.equal(await evaluate("document.activeElement?.id"), "main-content");
        await Promise.all(requestTasks);
        assert.deepEqual(externalRequests, []);
        assert.deepEqual(requestErrors, []);
      } finally {
        mainFrameContext.cancel();
        if (heldConsentRequest)
          await send("Fetch.continueRequest", { requestId: heldConsentRequest }, sessionId);
        await loaded.catch((error) => requestErrors.push(error));
        eventHandlers.delete(`${sessionId}:Fetch.requestPaused`);
        await send("Target.disposeBrowserContext", { browserContextId });
      }
    }

    await runScenario({
      device: "desktop",
      width: 1365,
      height: 768,
      deviceScaleFactor: 1,
      mobile: false,
      withoutGutter: true,
    });
    await runScenario({
      device: "desktop",
      width: 1365,
      height: 768,
      deviceScaleFactor: 1,
      mobile: false,
      withoutGutter: false,
    });
    await runScenario({
      device: "mobile",
      width: 390,
      height: 844,
      deviceScaleFactor: 2.6,
      mobile: true,
      withoutGutter: false,
    });
  }, resources);
});
