import { createServer } from "node:http";
import { readdir, readFile } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";

export const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
export const COLOR_SCHEMES = ["light", "dark"];
export const MAX_CLS = 0.1;
export const REQUIRED_ROUTES = ["/", "/privacy/", "/tech/", "/404.html"];
export const VIEWPORTS = [
  {
    name: "desktop",
    width: 1365,
    height: 768,
    isMobile: false,
    hasTouch: false,
    deviceScaleFactor: 1,
  },
  { name: "mobile", width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
];

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

export function installClsObserver(win = globalThis, Observer = globalThis.PerformanceObserver) {
  win.__jamulaShifts = [];
  const observer = new Observer((list) => {
    for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput) {
        win.__jamulaShifts.push({ time: entry.startTime, value: entry.value });
      }
    }
  });
  observer.observe({ type: "layout-shift", buffered: true });
  win.__jamulaShiftObserver = observer;
}

export function waitForLayoutShiftFrame(win = globalThis) {
  return new Promise((resolve) => {
    win.requestAnimationFrame(() => {
      win.requestAnimationFrame(() => resolve());
    });
  });
}

export function readClsAndLandmarks(doc = globalThis.document, win = globalThis) {
  for (const entry of win.__jamulaShiftObserver?.takeRecords?.() ?? []) {
    if (!entry.hadRecentInput) {
      win.__jamulaShifts.push({ time: entry.startTime, value: entry.value });
    }
  }

  let cls = 0;
  let windowSum = 0;
  let windowStart = 0;
  let previousTime = 0;
  for (const { time, value } of win.__jamulaShifts ?? []) {
    if (windowSum === 0 || time - previousTime >= 1000 || time - windowStart >= 5000) {
      windowStart = time;
      windowSum = 0;
    }
    windowSum += value;
    previousTime = time;
    if (windowSum > cls) cls = windowSum;
  }

  const measure = (selector) => {
    const element = doc.querySelector(selector);
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    return { x: rect.x, width: rect.width };
  };

  return {
    cls,
    scrollbarGutter: win.getComputedStyle(doc.documentElement).scrollbarGutter,
    landmarks: {
      header: measure("header"),
      main: measure("main#main-content"),
      footer: measure("footer"),
    },
  };
}

export async function verifyKernelNetworkNone({
  networkInterfaces = os.networkInterfaces,
  connect = net.createConnection,
} = {}) {
  for (const [name, entries] of Object.entries(networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (!entry.internal) {
        throw new Error(
          `External network interface detected (${name}: ${entry.address}); run inside docker --network=none.`
        );
      }
    }
  }

  await new Promise((resolveProbe, rejectProbe) => {
    const socket = connect({ host: "192.0.2.1", port: 443 });
    let settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      error ? rejectProbe(error) : resolveProbe();
    };
    socket.setTimeout(500, () =>
      finish(
        new Error(
          "External network probe timed out instead of failing immediately with ENETUNREACH."
        )
      )
    );
    socket.once("connect", () =>
      finish(new Error("External TCP connection unexpectedly succeeded; network is not isolated."))
    );
    socket.once("error", (error) => {
      if (error?.code === "ENETUNREACH") {
        finish();
        return;
      }
      const code = error?.code ?? "missing-code";
      const message = error?.message ?? String(error);
      finish(
        new Error(
          `External network probe failed with unexpected error (${code}: ${message}); expected ENETUNREACH.`
        )
      );
    });
  });
}

export async function discoverRoutes(distRoot) {
  const resolvedRoot = path.resolve(distRoot);
  const routes = [];

  async function walk(currentDir) {
    const entries = await readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".html")) {
        const rel = path.relative(resolvedRoot, fullPath).replaceAll("\\", "/");
        if (rel === "index.html") {
          routes.push("/");
        } else if (rel.endsWith("/index.html")) {
          routes.push(`/${rel.slice(0, -"index.html".length)}`);
        } else {
          routes.push(`/${rel}`);
        }
      }
    }
  }

  await walk(resolvedRoot);
  routes.sort();
  for (const requiredRoute of REQUIRED_ROUTES) {
    if (!routes.includes(requiredRoute)) {
      throw new Error(`Built dist directory is missing required route: ${requiredRoute}`);
    }
  }
  return routes;
}

export async function startDistServer(distRoot) {
  const resolvedRoot = path.resolve(distRoot);
  const server = createServer(async (req, res) => {
    const pathname = decodeURIComponent(new URL(req.url ?? "/", "http://127.0.0.1").pathname);
    const relativeTarget = pathname.endsWith("/")
      ? `${pathname.slice(1)}index.html`
      : pathname.slice(1);
    const candidate = path.resolve(resolvedRoot, relativeTarget);
    const rel = path.relative(resolvedRoot, candidate);
    if (rel === ".." || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) {
      res.writeHead(403).end("Forbidden");
      return;
    }

    try {
      const bytes = await readFile(candidate);
      const ext = path.extname(candidate).toLowerCase();
      const status = pathname === "/404.html" ? 404 : 200;
      res
        .writeHead(status, {
          "content-type": MIME_TYPES[ext] ?? "application/octet-stream",
          "content-length": bytes.length,
          "cache-control": "no-store",
        })
        .end(bytes);
    } catch {
      res.writeHead(404).end("Not Found");
    }
  });

  await new Promise((resolveListen, rejectListen) => {
    server.once("error", rejectListen);
    server.listen(0, "127.0.0.1", resolveListen);
  });

  return {
    origin: `http://127.0.0.1:${server.address().port}`,
    close: () =>
      new Promise((resolveClose, rejectClose) =>
        server.close((error) => (error ? rejectClose(error) : resolveClose()))
      ),
  };
}

function assertLandmarksStable(route, viewportName, before, after) {
  if (!String(before.scrollbarGutter).includes("stable")) {
    throw new Error(
      `${viewportName} ${route}: expected html scrollbar-gutter to include 'stable'.`
    );
  }
  for (const name of ["header", "main", "footer"]) {
    const first = before.landmarks[name];
    const second = after.landmarks[name];
    if (!first || !second || first.width <= 0 || second.width <= 0) {
      throw new Error(`${viewportName} ${route}: missing or zero-width <${name}> landmark.`);
    }
    if (Math.abs(first.x - second.x) > 0.5 || Math.abs(first.width - second.width) > 0.5) {
      throw new Error(
        `${viewportName} ${route}: <${name}> landmark shifted across consent state (${JSON.stringify(first)} -> ${JSON.stringify(second)}).`
      );
    }
  }
}

function assertClsWithinBudget(route, viewportName, snapshot) {
  if (snapshot.cls > MAX_CLS) {
    throw new Error(`${viewportName} ${route}: CLS ${snapshot.cls} exceeds maximum ${MAX_CLS}.`);
  }
}

async function auditColorSchemes(page, createAxeBuilder, viewportName, route, stateLabel) {
  for (const colorScheme of COLOR_SCHEMES) {
    await page.emulateMedia({ colorScheme });
    const axe = await createAxeBuilder(page).withTags(WCAG_TAGS).analyze();
    if (axe.violations.length > 0) {
      throw new Error(
        `${viewportName} ${route} (${colorScheme}, ${stateLabel}) WCAG 2.2 AA violations: ${JSON.stringify(axe.violations)}`
      );
    }
  }
}

export async function runVerification({
  distRoot = path.resolve("dist"),
  requireNetworkNone = false,
  launchBrowser = () => chromium.launch({ headless: true }),
  createAxeBuilder = (page) => new AxeBuilder({ page }),
  networkDeps,
  log = console.log,
} = {}) {
  if (requireNetworkNone) {
    await verifyKernelNetworkNone(networkDeps);
  }

  const routes = await discoverRoutes(distRoot);
  const server = await startDistServer(distRoot);
  let browser;
  const externalRequests = [];
  const results = [];

  try {
    browser = await launchBrowser();
    for (const viewport of VIEWPORTS) {
      for (const route of routes) {
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          isMobile: viewport.isMobile,
          hasTouch: viewport.hasTouch,
          deviceScaleFactor: viewport.deviceScaleFactor,
          colorScheme: "light",
        });
        try {
          context.on("request", (request) => {
            const url = request.url();
            if (!url.startsWith(`${server.origin}/`)) {
              externalRequests.push(url);
            }
          });
          await context.addInitScript(installClsObserver);

          const page = await context.newPage();
          try {
            await page.emulateMedia({ colorScheme: "light" });
            await page.goto(`${server.origin}${route}`, { waitUntil: "load" });

            const consentPanel = page.locator("#analytics-consent");
            const rejectButton = page.locator("#analytics-reject");
            if (!(await consentPanel.isVisible()) || !(await rejectButton.isVisible())) {
              throw new Error(
                `${viewport.name} ${route}: expected #analytics-consent and #analytics-reject to be visible before dismissal.`
              );
            }

            await auditColorSchemes(
              page,
              createAxeBuilder,
              viewport.name,
              route,
              "consent-visible"
            );

            await page.emulateMedia({ colorScheme: "light" });
            const before = await page.evaluate(readClsAndLandmarks);
            await rejectButton.click();
            if (await consentPanel.isVisible()) {
              throw new Error(
                `${viewport.name} ${route}: expected #analytics-consent to be hidden after dismissal.`
              );
            }
            const after = await page.evaluate(readClsAndLandmarks);

            assertLandmarksStable(route, viewport.name, before, after);
            assertClsWithinBudget(route, viewport.name, after);

            await auditColorSchemes(
              page,
              createAxeBuilder,
              viewport.name,
              route,
              "consent-dismissed"
            );

            await page.evaluate(waitForLayoutShiftFrame);
            const finalSnapshot = await page.evaluate(readClsAndLandmarks);

            assertLandmarksStable(route, viewport.name, before, finalSnapshot);
            assertClsWithinBudget(route, viewport.name, finalSnapshot);

            results.push({
              viewport: viewport.name,
              route,
              cls: finalSnapshot.cls,
              wcagLightViolations: 0,
              wcagDarkViolations: 0,
            });
          } finally {
            await page.close();
          }
        } finally {
          await context.close();
        }
      }
    }

    if (externalRequests.length > 0) {
      throw new Error(`Unexpected non-loopback browser requests: ${externalRequests.join(", ")}`);
    }

    const summary = {
      networkNoneVerified: requireNetworkNone,
      routesVerified: routes,
      checks: results.length,
      maxObservedCls: Math.max(0, ...results.map((entry) => entry.cls)),
      externalRequests: 0,
    };
    log(JSON.stringify(summary));
    return summary;
  } finally {
    await browser?.close();
    await server.close();
  }
}

export function parseCliArgs(argv) {
  let distRoot = path.resolve("dist");
  let requireNetworkNone = false;
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--require-network-none") {
      requireNetworkNone = true;
    } else if (arg === "--dist" && argv[index + 1]) {
      distRoot = path.resolve(argv[++index]);
    } else {
      throw new Error(
        "Usage: node scripts/verify-wcag-cls.mjs [--dist <dir>] [--require-network-none]"
      );
    }
  }
  return { distRoot, requireNetworkNone };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const options = parseCliArgs(process.argv.slice(2));
    await runVerification(options);
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
