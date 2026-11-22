// Opt-in local browser regression: node --test www\tests\404-layout.browser.mjs
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
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

const dist = resolve(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const geometry = `(() => ({
  width: document.documentElement.getBoundingClientRect().width,
  height: document.documentElement.scrollHeight,
  panelHidden: document.querySelector("#analytics-consent").hidden,
  positions: [".site-header__inner", ".not-found", ".site-footer__inner", ".analytics"].map(selector => {
    const r = document.querySelector(selector).getBoundingClientRect();
    return {selector, x: r.x, y: r.y, width: r.width};
  })
}))()`;

test("404 stays anchored when delayed consent initialization introduces overflow", async (t) => {
  const resources = {};
  await runMeasurementLifecycle(async () => {
    const server = createServer(async (req, res) => {
      const url = new URL(req.url, "http://127.0.0.1");
      const file = resolve(dist, `.${sep}${decodeURIComponent(url.pathname)}`);
      if (!file.startsWith(`${dist}${sep}`)) return res.writeHead(403).end();
      try {
        const bytes = await readFile(file);
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
    t.diagnostic(JSON.stringify(await send("Browser.getVersion")));
    for (const [device, width, height, deviceScaleFactor, mobile] of [
      ["desktop", 1365, 768, 1, false],
      ["mobile", 390, 844, 2.6, true],
    ]) {
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
      let heldRequest;
      eventHandlers.set(`${sessionId}:Fetch.requestPaused`, (event) => {
        const local = event.request.url.startsWith(`${origin}/`);
        if (!local) externalRequests.push(event.request.url);
        if (local && new URL(event.request.url).pathname === "/analytics-consent.js") {
          heldRequest = event.requestId;
          return;
        }
        send(
          local ? "Fetch.continueRequest" : "Fetch.failRequest",
          local
            ? { requestId: event.requestId }
            : { requestId: event.requestId, errorReason: "BlockedByClient" },
          sessionId
        ).catch((error) => requestErrors.push(error));
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
          for (const e of list.getEntries()) if (!e.hadRecentInput)
            window.__shifts.push({value: e.value, sources: e.sources.map(s => ({
              node: s.node?.className, before: s.previousRect.toJSON(), after: s.currentRect.toJSON()
            }))});
        }).observe({type: "layout-shift", buffered: true});`,
        },
        sessionId
      );
      const evaluate = async (expression, contextId) => {
        const result = await send(
          "Runtime.evaluate",
          { expression, returnByValue: true, awaitPromise: true, contextId },
          sessionId
        );
        assert.equal(result.exceptionDetails, undefined, JSON.stringify(result.exceptionDetails));
        return result.result.value;
      };
      const destinationContext = new Promise((resolveContext, rejectContext) => {
        const contexts = new Map();
        let destinationFrameId;
        const events = [
          "Page.frameNavigated",
          "Runtime.executionContextCreated",
          "Runtime.executionContextDestroyed",
          "Runtime.executionContextsCleared",
        ];
        const cleanup = () => {
          clearTimeout(timeout);
          for (const event of events) eventHandlers.delete(`${sessionId}:${event}`);
        };
        const check = () => {
          for (const [id, frameId] of contexts) {
            if (frameId === destinationFrameId) {
              cleanup();
              resolveContext(id);
              return;
            }
          }
        };
        const timeout = setTimeout(() => {
          cleanup();
          rejectContext(new Error("No default execution context for 404 page"));
        }, 5000);
        eventHandlers.set(`${sessionId}:Page.frameNavigated`, ({ frame }) => {
          if (!frame.parentId && frame.url === `${origin}/404.html`) {
            destinationFrameId = frame.id;
            check();
          }
        });
        eventHandlers.set(`${sessionId}:Runtime.executionContextCreated`, ({ context }) => {
          if (context.auxData?.isDefault && context.auxData.frameId) {
            contexts.set(context.id, context.auxData.frameId);
            check();
          }
        });
        eventHandlers.set(
          `${sessionId}:Runtime.executionContextDestroyed`,
          ({ executionContextId }) => {
            contexts.delete(executionContextId);
          }
        );
        eventHandlers.set(`${sessionId}:Runtime.executionContextsCleared`, () => contexts.clear());
      });
      const loaded = navigateMeasurementPage(send, eventHandlers, sessionId, `${origin}/404.html`);
      loaded.catch(() => {});
      try {
        const contextId = await destinationContext;
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
        assert.ok(heldRequest, "Consent module must be held until initial paint");
        const before = await evaluate(geometry);
        assert.equal(before.panelHidden, true);
        await send("Fetch.continueRequest", { requestId: heldRequest }, sessionId);
        heldRequest = undefined;
        await loaded;
        await new Promise((resolveWait) => setTimeout(resolveWait, 3000));
        const after = await evaluate(geometry);
        const shifts = await evaluate("window.__shifts");
        t.diagnostic(JSON.stringify({ device, before, after, shifts, externalRequests }));
        assert.equal(after.panelHidden, false);
        assert.ok(after.height > height, "Consent should cause vertical overflow");
        assert.deepEqual(after.positions, before.positions, "Visible landmarks must not move");
        assert.equal(after.width, before.width, "Scrollbar must not change the content width");
        assert.ok(
          shifts.reduce((sum, shift) => sum + shift.value, 0) <= 0.1,
          `Local delayed-initialization CLS exceeded 0.1: ${JSON.stringify(shifts)}`
        );
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
        const noScriptOrStorage = await evaluate(`({
          storage: localStorage.length,
          externalScripts: [...document.scripts].filter(s => s.src && new URL(s.src).origin !== location.origin).length,
          expanded: document.querySelector("#analytics-preferences").getAttribute("aria-expanded")
        })`);
        assert.deepEqual(noScriptOrStorage, { storage: 0, externalScripts: 0, expanded: "true" });
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
        assert.deepEqual(externalRequests, []);
        assert.deepEqual(requestErrors, []);
      } finally {
        // Settle a pending load before disposing the context on assertion failure.
        if (heldRequest)
          await send("Fetch.continueRequest", { requestId: heldRequest }, sessionId).catch(
            (error) => requestErrors.push(error)
          );
        await loaded;
        eventHandlers.delete(`${sessionId}:Fetch.requestPaused`);
        await send("Target.disposeBrowserContext", { browserContextId });
      }
    }
  }, resources);
});
