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

async function createFakeDist() {
  const root = await mkdtemp(path.join(tmpdir(), "jamula-wcag-dist-"));
  await mkdir(path.join(root, "privacy"), { recursive: true });
  await mkdir(path.join(root, "tech", "note"), { recursive: true });
  await writeFile(path.join(root, "index.html"), "<!doctype html><title>Home</title>");
  await writeFile(
    path.join(root, "privacy", "index.html"),
    "<!doctype html><title>Privacy</title>"
  );
  await writeFile(path.join(root, "tech", "index.html"), "<!doctype html><title>Tech</title>");
  await writeFile(
    path.join(root, "tech", "note", "index.html"),
    "<!doctype html><title>Note</title>"
  );
  await writeFile(path.join(root, "404.html"), "<!doctype html><title>404</title>");
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
  lightViolations = [],
  darkViolations = [],
  beforeEval,
  afterEval,
  rejectVisible = true,
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
  let clickedReject = 0;

  const launchBrowser = async () => ({
    async newContext() {
      const requestListeners = [];
      let currentScheme = "light";
      return {
        on(event, handler) {
          if (event === "request") requestListeners.push(handler);
        },
        async addInitScript() {},
        async newPage() {
          let evalCount = 0;
          return {
            async emulateMedia({ colorScheme }) {
              currentScheme = colorScheme;
            },
            async goto(url) {
              for (const handler of requestListeners) {
                handler({ url: () => url });
                if (emitExternalRequest) {
                  handler({ url: () => "https://evil.example/Font.woff2" });
                }
              }
            },
            locator() {
              return {
                isVisible: async () => rejectVisible,
                click: async () => {
                  clickedReject++;
                },
              };
            },
            async evaluate() {
              evalCount++;
              return evalCount === 1
                ? (beforeEval ?? defaultSnapshot)
                : (afterEval ?? defaultSnapshot);
            },
            async close() {},
            currentScheme: () => currentScheme,
          };
        },
        async close() {},
      };
    },
    async close() {},
  });

  const createAxeBuilder = (page) => ({
    withTags(tags) {
      assert.ok(tags.includes("wcag22aa"));
      return {
        analyze: async () => ({
          violations: page.currentScheme() === "dark" ? darkViolations : lightViolations,
        }),
      };
    },
  });

  return { launchBrowser, createAxeBuilder, getClickedReject: () => clickedReject };
}

test("runVerification passes clean WCAG/CLS/landmarks and rejects violations, shifts, and external egress", async () => {
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
    assert.ok(clean.getClickedReject() > 0);
    assert.equal(logs.length, 1);

    const hiddenConsent = createFakePlaywright({ rejectVisible: false });
    await runVerification({
      distRoot: dist,
      launchBrowser: hiddenConsent.launchBrowser,
      createAxeBuilder: hiddenConsent.createAxeBuilder,
      log: () => {},
    });
    assert.equal(hiddenConsent.getClickedReject(), 0);

    for (const [scenario, options, expectedPattern] of [
      [
        "light WCAG failure",
        { lightViolations: [{ id: "color-contrast" }] },
        /light.*WCAG 2\.2 AA violations/,
      ],
      [
        "dark WCAG failure",
        { darkViolations: [{ id: "link-name" }] },
        /dark.*WCAG 2\.2 AA violations/,
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
