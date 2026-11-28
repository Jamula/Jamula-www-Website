import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { EventEmitter } from "node:events";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { get } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  discoverRoutes,
  installClsObserver,
  parseCliArgs,
  readClsAndLandmarks,
  runVerification,
  startDistServer,
  verifyKernelNetworkNone,
} from "../scripts/verify-wcag-cls.mjs";

function fetchLocal(url) {
  return new Promise((resolveResponse, rejectResponse) => {
    get(url, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () =>
        resolveResponse({
          status: res.statusCode,
          contentType: res.headers["content-type"],
          body: Buffer.concat(chunks).toString("utf8"),
        })
      );
    }).on("error", rejectResponse);
  });
}

function pageHtml(title) {
  return [
    "<!doctype html>",
    `<html lang="en"><head><title>${title}</title></head><body>`,
    "<header>Header</header>",
    '<main id="main-content">Main</main>',
    "<footer>",
    '<section id="analytics-consent" hidden>',
    '<button id="analytics-reject" type="button">Reject analytics</button>',
    "</section>",
    "</footer>",
    "</body></html>",
  ].join("");
}

async function createFakeDist() {
  const root = await mkdtemp(path.join(tmpdir(), "jamula-wcag-dist-"));
  await mkdir(path.join(root, "privacy"), { recursive: true });
  await mkdir(path.join(root, "tech", "note"), { recursive: true });
  await writeFile(path.join(root, "index.html"), pageHtml("Home"));
  await writeFile(path.join(root, "privacy", "index.html"), pageHtml("Privacy"));
  await writeFile(path.join(root, "tech", "index.html"), pageHtml("Tech"));
  await writeFile(path.join(root, "tech", "note", "index.html"), pageHtml("Note"));
  await writeFile(path.join(root, "404.html"), pageHtml("404"));
  await writeFile(path.join(root, "style.css"), "html { scrollbar-gutter: stable; }");
  await writeFile(path.join(root, "asset.bin"), "binary");
  return root;
}

test("installClsObserver and readClsAndLandmarks compute windowed CLS and landmark rects", () => {
  const observers = [];
  class FakeObserver {
    constructor(callback) {
      this.callback = callback;
      observers.push(this);
    }
    observe(options) {
      this.options = options;
    }
  }
  const win = {
    getComputedStyle: () => ({ scrollbarGutter: "stable" }),
  };
  installClsObserver(win, FakeObserver);
  assert.equal(observers.length, 1);
  assert.deepEqual(observers[0].options, { type: "layout-shift", buffered: true });

  observers[0].callback({
    getEntries: () => [
      { startTime: 100, value: 0.04, hadRecentInput: false },
      { startTime: 300, value: 0.5, hadRecentInput: true },
      { startTime: 500, value: 0.03, hadRecentInput: false },
      { startTime: 2000, value: 0.02, hadRecentInput: false },
    ],
  });

  const rects = {
    header: { x: 12, width: 960 },
    "main#main-content": { x: 12, width: 960 },
    footer: { x: 12, width: 960 },
  };
  const doc = {
    documentElement: {},
    querySelector: (selector) =>
      rects[selector] ? { getBoundingClientRect: () => rects[selector] } : null,
  };

  const snapshot = readClsAndLandmarks(doc, win);
  assert.equal(Number(snapshot.cls.toFixed(2)), 0.07);
  assert.equal(snapshot.scrollbarGutter, "stable");
  assert.deepEqual(snapshot.landmarks.header, { x: 12, width: 960 });

  const missingDoc = { documentElement: {}, querySelector: () => null };
  const emptySnapshot = readClsAndLandmarks(missingDoc, {
    getComputedStyle: () => ({ scrollbarGutter: "auto" }),
  });
  assert.equal(emptySnapshot.cls, 0);
  assert.equal(emptySnapshot.landmarks.main, null);
});

test("verifyKernelNetworkNone accepts loopback-only and rejects external interfaces or sockets", async () => {
  const makeSocket = (mode) => () => {
    const socket = new EventEmitter();
    socket.destroyed = false;
    socket.destroy = () => {
      socket.destroyed = true;
    };
    socket.setTimeout = (_ms, callback) => {
      if (mode === "timeout") queueMicrotask(callback);
    };
    queueMicrotask(() => {
      if (mode === "error")
        socket.emit("error", Object.assign(new Error("unreachable"), { code: "ENETUNREACH" }));
      if (mode === "connect") socket.emit("connect");
    });
    return socket;
  };

  await verifyKernelNetworkNone({
    networkInterfaces: () => ({ lo: [{ address: "127.0.0.1", internal: true }], empty: undefined }),
    connect: makeSocket("error"),
  });

  await assert.rejects(
    verifyKernelNetworkNone({
      networkInterfaces: () => ({
        lo: [{ address: "127.0.0.1", internal: true }],
        eth0: [{ address: "10.0.0.4", internal: false }],
      }),
      connect: makeSocket("error"),
    }),
    /External network interface detected/
  );

  await assert.rejects(
    verifyKernelNetworkNone({
      networkInterfaces: () => ({ lo: [{ address: "127.0.0.1", internal: true }] }),
      connect: makeSocket("connect"),
    }),
    /External TCP connection unexpectedly succeeded/
  );

  await assert.rejects(
    verifyKernelNetworkNone({
      networkInterfaces: () => ({ lo: [{ address: "127.0.0.1", internal: true }] }),
      connect: makeSocket("timeout"),
    }),
    /timed out instead of failing immediately/
  );
});

test("discoverRoutes and startDistServer serve static routes and block path traversal", async () => {
  const dist = await createFakeDist();
  try {
    const routes = await discoverRoutes(dist);
    assert.deepEqual(routes, ["/", "/404.html", "/privacy/", "/tech/", "/tech/note/"]);

    const incomplete = await mkdtemp(path.join(tmpdir(), "jamula-wcag-incomplete-"));
    try {
      await writeFile(path.join(incomplete, "index.html"), "home");
      await assert.rejects(discoverRoutes(incomplete), /missing required route/);
    } finally {
      await rm(incomplete, { recursive: true, force: true });
    }

    const server = await startDistServer(dist);
    try {
      const home = await fetchLocal(`${server.origin}/`);
      assert.equal(home.status, 200);
      assert.equal(home.contentType, "text/html; charset=utf-8");

      const notFoundPage = await fetchLocal(`${server.origin}/404.html`);
      assert.equal(notFoundPage.status, 404);

      const bin = await fetchLocal(`${server.origin}/asset.bin`);
      assert.equal(bin.status, 200);
      assert.equal(bin.contentType, "application/octet-stream");

      const missing = await fetchLocal(`${server.origin}/missing.html`);
      assert.equal(missing.status, 404);

      const escaped = await fetchLocal(`${server.origin}/%2e%2e%2fpackage.json`);
      assert.equal(escaped.status, 403);
    } finally {
      await server.close();
    }
  } finally {
    await rm(dist, { recursive: true, force: true });
  }
});

function createFakePlaywright({
  violationsFor = () => [],
  beforeEval,
  afterEval,
  consentVisibleOnLoad,
  rejectVisibleOnLoad,
  hideConsentOnReject = true,
  emitExternalRequest = false,
} = {}) {
  const defaultSnapshot = {
    cls: 0,
    scrollbarGutter: "stable",
    landmarks: {
      header: { x: 16, width: 960 },
      main: { x: 16, width: 960 },
      footer: { x: 16, width: 960 },
    },
  };
  let contextsCreated = 0;
  let contextsClosed = 0;
  let clickedReject = 0;
  const audits = [];

  const launchBrowser = async () => ({
    async newContext(contextOptions) {
      contextsCreated++;
      const requestListeners = [];
      const localStorage = new Map();
      let currentScheme = contextOptions.colorScheme ?? "light";
      return {
        on(event, handler) {
          if (event === "request") requestListeners.push(handler);
        },
        async addInitScript() {},
        async newPage() {
          let evalCount = 0;
          let currentRoute = "";
          let panelVisible = false;
          let rejectVisible = false;
          return {
            async emulateMedia({ colorScheme }) {
              currentScheme = colorScheme;
            },
            async goto(url) {
              currentRoute = new URL(url).pathname;
              for (const handler of requestListeners) {
                handler({ url: () => url });
                if (emitExternalRequest) {
                  handler({ url: () => "https://evil.example/Font.woff2" });
                }
              }
              const response = await fetchLocal(url);
              const unsettledInContext = !localStorage.has("jamula.analytics-consent");
              panelVisible =
                consentVisibleOnLoad ??
                (unsettledInContext && response.body.includes('id="analytics-consent"'));
              rejectVisible =
                rejectVisibleOnLoad ??
                (panelVisible && response.body.includes('id="analytics-reject"'));
            },
            locator(selector) {
              if (selector === "#analytics-consent") {
                return {
                  isVisible: async () => panelVisible,
                };
              }
              if (selector === "#analytics-reject") {
                return {
                  isVisible: async () => panelVisible && rejectVisible,
                  click: async () => {
                    assert.equal(panelVisible && rejectVisible, true);
                    clickedReject++;
                    localStorage.set("jamula.analytics-consent", "rejected");
                    if (hideConsentOnReject) {
                      panelVisible = false;
                    }
                  },
                };
              }
              throw new Error(`Unexpected locator selector: ${selector}`);
            },
            async evaluate() {
              evalCount++;
              return evalCount === 1
                ? (beforeEval ?? defaultSnapshot)
                : (afterEval ?? defaultSnapshot);
            },
            async close() {},
            currentScheme: () => currentScheme,
            currentRoute: () => currentRoute,
            currentViewportWidth: () => contextOptions.viewport.width,
            isPanelVisible: () => panelVisible,
          };
        },
        async close() {
          contextsClosed++;
        },
      };
    },
    async close() {},
  });

  const createAxeBuilder = (page) => ({
    withTags(tags) {
      assert.ok(tags.includes("wcag22aa"));
      return {
        analyze: async () => {
          const audit = {
            viewportWidth: page.currentViewportWidth(),
            route: page.currentRoute(),
            colorScheme: page.currentScheme(),
            panelVisible: page.isPanelVisible(),
          };
          audits.push(audit);
          return {
            violations: violationsFor(audit),
          };
        },
      };
    },
  });

  return {
    launchBrowser,
    createAxeBuilder,
    getContextsCreated: () => contextsCreated,
    getContextsClosed: () => contextsClosed,
    getClickedReject: () => clickedReject,
    getAudits: () => audits,
  };
}

test("runVerification audits both themes before and after consent dismissal in fresh per-route contexts", async () => {
  const dist = await createFakeDist();
  try {
    const logs = [];
    const clean = createFakePlaywright();
    const summary = await runVerification({
      distRoot: dist,
      requireNetworkNone: true,
      launchBrowser: clean.launchBrowser,
      createAxeBuilder: clean.createAxeBuilder,
      networkDeps: {
        networkInterfaces: () => ({ lo: [{ address: "127.0.0.1", internal: true }] }),
        connect: () => {
          const s = new EventEmitter();
          s.destroy = () => {};
          s.setTimeout = () => {};
          queueMicrotask(() => s.emit("error", new Error("ENETUNREACH")));
          return s;
        },
      },
      log: (line) => logs.push(JSON.parse(line)),
    });
    assert.equal(summary.checks, 10);
    assert.equal(summary.externalRequests, 0);
    assert.equal(clean.getContextsCreated(), 10);
    assert.equal(clean.getContextsClosed(), 10);
    assert.equal(clean.getClickedReject(), 10);
    assert.equal(logs.length, 1);

    const audits = clean.getAudits();
    assert.equal(audits.length, 40);
    for (let index = 0; index < audits.length; index += 4) {
      const routeAudits = audits.slice(index, index + 4);
      assert.deepEqual(
        routeAudits.map(({ colorScheme, panelVisible }) => ({ colorScheme, panelVisible })),
        [
          { colorScheme: "light", panelVisible: true },
          { colorScheme: "dark", panelVisible: true },
          { colorScheme: "light", panelVisible: false },
          { colorScheme: "dark", panelVisible: false },
        ]
      );
    }

    for (const [scenario, options, expectedPattern] of [
      [
        "hidden consent panel before dismissal",
        { consentVisibleOnLoad: false },
        /expected #analytics-consent and #analytics-reject to be visible before dismissal/,
      ],
      [
        "hidden reject button before dismissal",
        { rejectVisibleOnLoad: false },
        /expected #analytics-consent and #analytics-reject to be visible before dismissal/,
      ],
      [
        "consent panel still visible after dismissal",
        { hideConsentOnReject: false },
        /expected #analytics-consent to be hidden after dismissal/,
      ],
      [
        "light WCAG failure while consent panel is visible",
        {
          violationsFor: ({ colorScheme, panelVisible }) =>
            colorScheme === "light" && panelVisible ? [{ id: "color-contrast" }] : [],
        },
        /\(light, consent-visible\) WCAG 2\.2 AA violations/,
      ],
      [
        "dark WCAG failure while consent panel is visible",
        {
          violationsFor: ({ colorScheme, panelVisible }) =>
            colorScheme === "dark" && panelVisible ? [{ id: "color-contrast" }] : [],
        },
        /\(dark, consent-visible\) WCAG 2\.2 AA violations/,
      ],
      [
        "light WCAG failure after consent dismissal",
        {
          violationsFor: ({ colorScheme, panelVisible }) =>
            colorScheme === "light" && !panelVisible ? [{ id: "aria-valid-attr-value" }] : [],
        },
        /\(light, consent-dismissed\) WCAG 2\.2 AA violations/,
      ],
      [
        "dark WCAG failure after consent dismissal",
        {
          violationsFor: ({ colorScheme, panelVisible }) =>
            colorScheme === "dark" && !panelVisible ? [{ id: "link-name" }] : [],
        },
        /\(dark, consent-dismissed\) WCAG 2\.2 AA violations/,
      ],
      [
        "CLS budget exceeded",
        {
          afterEval: {
            cls: 0.15,
            scrollbarGutter: "stable",
            landmarks: {
              header: { x: 16, width: 960 },
              main: { x: 16, width: 960 },
              footer: { x: 16, width: 960 },
            },
          },
        },
        /CLS 0\.15 exceeds maximum 0\.1/,
      ],
      [
        "missing scrollbar-gutter",
        {
          beforeEval: {
            cls: 0,
            scrollbarGutter: "auto",
            landmarks: {
              header: { x: 16, width: 960 },
              main: { x: 16, width: 960 },
              footer: { x: 16, width: 960 },
            },
          },
        },
        /scrollbar-gutter/,
      ],
      [
        "missing landmark",
        {
          beforeEval: {
            cls: 0,
            scrollbarGutter: "stable",
            landmarks: { header: null, main: { x: 16, width: 960 }, footer: { x: 16, width: 960 } },
          },
        },
        /missing or zero-width <header>/,
      ],
      [
        "landmark shift",
        {
          afterEval: {
            cls: 0,
            scrollbarGutter: "stable",
            landmarks: {
              header: { x: 24, width: 960 },
              main: { x: 16, width: 960 },
              footer: { x: 16, width: 960 },
            },
          },
        },
        /<header> landmark shifted/,
      ],
      [
        "external egress",
        { emitExternalRequest: true },
        /Unexpected non-loopback browser requests/,
      ],
    ]) {
      const fake = createFakePlaywright(options);
      await assert.rejects(
        runVerification({
          distRoot: dist,
          launchBrowser: fake.launchBrowser,
          createAxeBuilder: fake.createAxeBuilder,
          log: () => {},
        }),
        expectedPattern,
        scenario
      );
    }
  } finally {
    await rm(dist, { recursive: true, force: true });
  }
});

test("parseCliArgs parses flags and CLI exits non-zero on invalid flags", () => {
  const parsed = parseCliArgs(["--dist", "custom-dist", "--require-network-none"]);
  assert.equal(parsed.distRoot, path.resolve("custom-dist"));
  assert.equal(parsed.requireNetworkNone, true);
  assert.throws(() => parseCliArgs(["--unknown"]), /Usage: node scripts\/verify-wcag-cls\.mjs/);

  const cliPath = fileURLToPath(new URL("../scripts/verify-wcag-cls.mjs", import.meta.url));
  const badRun = spawnSync(process.execPath, [cliPath, "--invalid"], { encoding: "utf8" });
  assert.equal(badRun.status, 1);
  assert.match(badRun.stderr, /Usage: node scripts\/verify-wcag-cls\.mjs/);
});
