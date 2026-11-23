import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { EventEmitter } from "node:events";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { after, before, describe, it } from "node:test";
import {
  createMeasurementConnection,
  runMeasurementLifecycle,
  waitForBrowserExit,
} from "../scripts/measure-local-performance.mjs";
import { requireBrowserEgressIsolationAcknowledgement } from "./browser-egress-isolation.mjs";

const require = createRequire(new URL("../package.json", import.meta.url));
const v8ToIstanbul = require("v8-to-istanbul");
const { encode } = require("@jridgewell/sourcemap-codec");
const sourcePath = fileURLToPath(
  new URL("../scripts/measure-local-performance.mjs", import.meta.url)
);
const source = await readFile(sourcePath, "utf8");
const edgePath =
  process.env.EDGE_PATH ?? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

function embeddedScript(name) {
  const match = new RegExp(`const ${name} = \`([\\s\\S]*?)\`;`).exec(source);
  assert.ok(match, `missing ${name} browser script`);
  const codeOffset = match.index + match[0].indexOf("`") + 1;
  const code = match[1];
  assert.equal(source.slice(codeOffset, codeOffset + code.length), code);
  return { code, codeOffset };
}

function createExactSourceMap(code, codeOffset, sourceURL) {
  const sourceLineStarts = [0];
  for (let offset = 0; offset < source.length; offset++) {
    if (source[offset] === "\n") sourceLineStarts.push(offset + 1);
  }

  function sourcePosition(offset) {
    let low = 0;
    let high = sourceLineStarts.length;
    while (low + 1 < high) {
      const middle = (low + high) >> 1;
      if (sourceLineStarts[middle] <= offset) low = middle;
      else high = middle;
    }
    return [low, offset - sourceLineStarts[low]];
  }

  const mappings = [];
  let codeLineOffset = 0;
  for (const line of code.split("\n")) {
    const segments = [];
    for (let column = 0; column <= line.length; column++) {
      const [originalLine, originalColumn] = sourcePosition(codeOffset + codeLineOffset + column);
      segments.push([column, 0, originalLine, originalColumn]);
    }
    mappings.push(segments);
    codeLineOffset += line.length + 1;
  }

  return {
    version: 3,
    file: sourceURL,
    sources: [pathToFileURL(sourcePath).href],
    sourcesContent: [source],
    names: [],
    mappings: encode(mappings),
  };
}

function createBrowserArguments(profile) {
  return [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-sync",
    "--disable-extensions",
    "--disable-quic",
    "--proxy-server=127.0.0.1:9",
    "--host-resolver-rules=MAP * ~NOTFOUND",
    `--user-data-dir=${profile}`,
    "--remote-debugging-pipe",
    "about:blank",
  ];
}

function assertBrowserArguments(args) {
  for (const flag of [
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-sync",
    "--disable-extensions",
    "--disable-quic",
    "--proxy-server=127.0.0.1:9",
  ]) {
    assert.ok(args.includes(flag), `missing browser argument: ${flag}`);
  }
  assert.ok(
    args.includes("--host-resolver-rules=MAP * ~NOTFOUND"),
    "missing host resolver restriction argument"
  );
  assert.equal(args.at(-1), "about:blank", "the browser must not navigate to a site");
}

async function failOfflineBrowserStartup(error, child, profile, cleanupOptions) {
  return runMeasurementLifecycle(
    async () => {
      throw error;
    },
    { browser: child, profile },
    cleanupOptions
  );
}

async function startBrowser() {
  await access(edgePath);
  const profile = await mkdtemp(join(tmpdir(), "jamula-performance-browser-prototype-"));
  const args = createBrowserArguments(profile);
  assertBrowserArguments(args);

  let child;
  try {
    child = spawn(edgePath, args, {
      stdio: ["ignore", "ignore", "pipe", "pipe", "pipe"],
    });
    const { send } = createMeasurementConnection(child);
    const browser = await send("Browser.getVersion");
    const { targetId } = await send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await send("Target.attachToTarget", {
      targetId,
      flatten: true,
    });
    for (const method of ["Runtime.enable", "Debugger.enable", "Profiler.enable"]) {
      await send(method, {}, sessionId);
    }
    await send("Profiler.startPreciseCoverage", { callCount: true, detailed: true }, sessionId);

    return {
      browser: browser.product,
      child,
      send,
      sessionId,
      async evaluate(expression) {
        const response = await send(
          "Runtime.evaluate",
          { expression, returnByValue: true },
          sessionId
        );
        assert.equal(
          response.exceptionDetails,
          undefined,
          JSON.stringify(response.exceptionDetails)
        );
        return response.result?.value;
      },
      async execute(name, expression) {
        const sourceURL = `${pathToFileURL(sourcePath).href}?prototype=${encodeURIComponent(name)}`;
        const compiled = await send(
          "Runtime.compileScript",
          { expression, sourceURL, persistScript: true },
          sessionId
        );
        assert.ok(compiled.scriptId, JSON.stringify(compiled));
        const debugSource = await send(
          "Debugger.getScriptSource",
          { scriptId: compiled.scriptId },
          sessionId
        );
        assert.equal(debugSource.scriptSource, expression);

        const execution = await send(
          "Runtime.runScript",
          { scriptId: compiled.scriptId, returnByValue: true },
          sessionId
        );
        const preciseCoverage = await send("Profiler.takePreciseCoverage", {}, sessionId);
        const coverage = preciseCoverage.result.find((entry) => entry.url === sourceURL);
        assert.ok(coverage, `no real-browser coverage for ${sourceURL}`);
        return {
          value: execution.result?.value,
          exceptionDetails: execution.exceptionDetails,
          coverage,
          sourceURL,
        };
      },
      async close() {
        if (!child.exitCode && !child.signalCode) child.kill();
        await waitForBrowserExit(child, 5000);
        await rm(profile, { recursive: true, force: true });
      },
    };
  } catch (error) {
    await failOfflineBrowserStartup(error, child, profile);
  }
}

it("OfflineBrowserCleanup_RetainsProfileAndReportsTimeoutWithStartupFailure", async () => {
  const child = new EventEmitter();
  child.exitCode = null;
  child.signalCode = null;
  let killed = false;
  child.kill = () => {
    killed = true;
    return true;
  };
  const startupError = new Error("browser startup failed");
  let removed = false;

  await assert.rejects(
    failOfflineBrowserStartup(startupError, child, "profile-in-use", {
      exitTimeoutMs: 1,
      scheduleTimeout: (callback) => {
        queueMicrotask(callback);
        return 1;
      },
      cancelTimeout: () => {},
      removeProfile: async () => {
        removed = true;
      },
    }),
    (error) => {
      assert.ok(error instanceof AggregateError);
      assert.equal(error.cause, startupError);
      assert.equal(error.errors[0], startupError);
      assert.match(error.errors[1].message, /exit was not confirmed/);
      assert.match(error.errors[2].message, /profile retained.*profile-in-use/i);
      return true;
    }
  );
  assert.equal(killed, true);
  assert.equal(removed, false);
});

it("OfflineBrowserCleanup_RemovesProfileAfterExitAndPreservesStartupError", async () => {
  const child = new EventEmitter();
  child.exitCode = null;
  child.signalCode = null;
  child.kill = () => {
    queueMicrotask(() => {
      child.exitCode = 0;
      child.emit("exit", 0, null);
    });
    return true;
  };
  const startupError = new Error("browser startup failed");
  const removed = [];
  await assert.rejects(
    failOfflineBrowserStartup(startupError, child, "exited-profile", {
      removeProfile: async (...args) => removed.push(args),
    }),
    (error) => error === startupError
  );
  assert.deepEqual(removed, [["exited-profile", { recursive: true, force: true }]]);
});

it("OfflineBrowserCleanup_ReportsProfileRemovalFailureWithStartupFailure", async () => {
  const startupError = new Error("browser startup failed");
  const removalError = new Error("profile removal failed");
  await assert.rejects(
    failOfflineBrowserStartup(startupError, undefined, "unused-profile", {
      removeProfile: async () => {
        throw removalError;
      },
    }),
    (error) => {
      assert.ok(error instanceof AggregateError);
      assert.equal(error.cause, startupError);
      assert.equal(error.errors[0], startupError);
      assert.equal(error.errors[1].cause, removalError);
      return true;
    }
  );
});

async function withMetricsFixture(browser, fixture, operation) {
  await browser.evaluate(`(() => {
    const names = ["getEntriesByType", "getEntriesByName"];
    globalThis.__measureBrowserRestore = {
      methods: Object.fromEntries(names.map(name => [
        name,
        Object.getOwnPropertyDescriptor(performance, name)
      ])),
      measurement: Object.getOwnPropertyDescriptor(window, "__measurement")
    };
    const fixture = ${JSON.stringify(fixture)};
    Object.defineProperty(performance, "getEntriesByType", {
      configurable: true,
      value: name => fixture.entriesByType[name] ?? []
    });
    Object.defineProperty(performance, "getEntriesByName", {
      configurable: true,
      value: name => fixture.entriesByName[name] ?? []
    });
    window.__measurement = { lcp: fixture.lcp, shifts: fixture.shifts };
  })()`);

  try {
    return await operation();
  } finally {
    await browser.evaluate(`(() => {
      const saved = globalThis.__measureBrowserRestore;
      for (const name of ["getEntriesByType", "getEntriesByName"]) {
        const descriptor = saved.methods[name];
        if (descriptor) Object.defineProperty(performance, name, descriptor);
        else delete performance[name];
      }
      if (saved.measurement) {
        Object.defineProperty(window, "__measurement", saved.measurement);
      } else {
        delete window.__measurement;
      }
      delete globalThis.__measureBrowserRestore;
    })()`);
  }
}

describe("real-browser coverage prototype", { timeout: 60000 }, () => {
  let browser;

  before(async () => {
    requireBrowserEgressIsolationAcknowledgement();
    browser = await startBrowser();
    assert.match(browser.browser, /^Edg\//);
  });

  after(async () => {
    await browser?.close();
  });

  it("MeasurementBrowserPrototype_ExecutesInstrumentationInRealEdge", async () => {
    const previous = await browser.evaluate(`(() => {
        globalThis.__measureObserverRestore =
          Object.getOwnPropertyDescriptor(globalThis, "PerformanceObserver");
        globalThis.__measureObservers = [];
        globalThis.PerformanceObserver = class {
          constructor(callback) {
            this.callback = callback;
            globalThis.__measureObservers.push(this);
          }
          observe(options) {
            this.options = options;
          }
        };
        return true;
      })()`);
    assert.equal(previous, true);

    try {
      const { code } = embeddedScript("instrumentation");
      const execution = await browser.execute("instrumentation", code);
      assert.equal(execution.exceptionDetails, undefined);
      const state = await browser.evaluate(`(() => {
          const observers = globalThis.__measureObservers;
          observers[0].callback({ getEntries: () => [
            { startTime: 19 },
            { startTime: 31 }
          ] });
          observers[1].callback({ getEntries: () => [
            {
              hadRecentInput: true,
              startTime: 40,
              value: 0.9,
              sources: []
            },
            {
              hadRecentInput: false,
              startTime: 51,
              value: 0.125,
              sources: [
                { node: { outerHTML: "x".repeat(205) } },
                { node: null },
                { node: {} }
              ]
            }
          ] });
          return {
            state: window.__measurement,
            options: observers.map(observer => observer.options)
          };
        })()`);
      assert.equal(state.state.lcp, 31);
      assert.deepEqual(state.state.shifts, [
        {
          time: 51,
          value: 0.125,
          sources: ["x".repeat(200), null, null],
        },
      ]);
      assert.deepEqual(state.options, [
        { type: "largest-contentful-paint", buffered: true },
        { type: "layout-shift", buffered: true },
      ]);
    } finally {
      await browser.evaluate(`(() => {
          const descriptor = globalThis.__measureObserverRestore;
          if (descriptor) Object.defineProperty(globalThis, "PerformanceObserver", descriptor);
          else delete globalThis.PerformanceObserver;
          delete globalThis.__measureObserverRestore;
          delete globalThis.__measureObservers;
        })()`);
    }
  });

  it("MeasurementBrowserPrototype_HandlesMissingAndPresentFcp", async () => {
    const { code } = embeddedScript("extraction");
    await withMetricsFixture(
      browser,
      {
        lcp: 62,
        shifts: [],
        entriesByType: { navigation: [], resource: [] },
        entriesByName: {},
      },
      async () => {
        const missing = await browser.execute("fcp-missing", code);
        assert.equal(missing.exceptionDetails, undefined);
        assert.deepEqual(missing.value, {
          lcp: 62,
          fcp: null,
          shifts: [],
          ttfb: null,
          cls: 0,
          resources: [],
          documentTransfer: null,
        });
      }
    );

    await withMetricsFixture(
      browser,
      {
        lcp: 73,
        shifts: [],
        entriesByType: {
          navigation: [{ responseStart: 31, transferSize: 2048 }],
          resource: [{ name: "http://127.0.0.1/app.js", transferSize: 24 }],
        },
        entriesByName: { "first-contentful-paint": [{ startTime: 47.5 }] },
      },
      async () => {
        const present = await browser.execute("fcp-present", code);
        assert.equal(present.exceptionDetails, undefined);
        assert.deepEqual(present.value, {
          lcp: 73,
          fcp: 47.5,
          shifts: [],
          ttfb: 31,
          cls: 0,
          resources: [{ name: "http://127.0.0.1/app.js", transferSize: 24 }],
          documentTransfer: 2048,
        });
      }
    );
  });

  it("MeasurementBrowserPrototype_ReportsActualExtractionExceptions", async () => {
    const { code } = embeddedScript("extraction");
    await withMetricsFixture(
      browser,
      {
        lcp: 0,
        shifts: [],
        entriesByType: { navigation: [], resource: [] },
        entriesByName: {},
      },
      async () => {
        await browser.evaluate("delete window.__measurement");
        const execution = await browser.execute("exception", code);
        assert.ok(execution.exceptionDetails);
        assert.match(execution.exceptionDetails.text, /Uncaught/);
        assert.match(execution.exceptionDetails.exception.description, /shifts/);
      }
    );
  });

  it("MeasurementBrowserPrototype_UsesExactClsWindowBoundariesAndMutationControl", async () => {
    const { code } = embeddedScript("extraction");
    const measure = async (name, shifts, script = code) =>
      withMetricsFixture(
        browser,
        {
          lcp: 0,
          shifts,
          entriesByType: { navigation: [], resource: [] },
          entriesByName: {},
        },
        async () => {
          const execution = await browser.execute(name, script);
          assert.equal(execution.exceptionDetails, undefined);
          return execution.value.cls;
        }
      );

    assert.equal(
      await measure("cls-gap-below-boundary", [
        { time: 100, value: 0.125 },
        { time: 1099, value: 0.25 },
      ]),
      0.375
    );
    assert.equal(
      await measure("cls-gap-at-boundary", [
        { time: 100, value: 0.125 },
        { time: 1100, value: 0.25 },
      ]),
      0.25
    );

    const fiveSecondShifts = Array.from({ length: 11 }, (_, index) => ({
      time: 100 + index * 500,
      value: 0.125,
    }));
    const expected = await measure("cls-window-at-five-seconds", fiveSecondShifts);
    assert.equal(expected, 1.25);

    const mutation = code.replace("time - start >= 5000", "false");
    assert.notEqual(mutation, code, "the five-second window mutation must apply");
    assert.equal(
      await measure("cls-five-second-window-mutated", fiveSecondShifts, mutation),
      1.375
    );
  });

  it("MeasurementBrowserPrototype_MapsRealV8RangesButRejectsUnmappedDenominator", async () => {
    const { code, codeOffset } = embeddedScript("extraction");
    await withMetricsFixture(
      browser,
      {
        lcp: 0,
        shifts: Array.from({ length: 11 }, (_, index) => ({
          time: 100 + index * 500,
          value: 0.125,
        })),
        entriesByType: { navigation: [], resource: [] },
        entriesByName: {},
      },
      async () => {
        const execution = await browser.execute("coverage-map", code);
        assert.equal(execution.exceptionDetails, undefined);

        const converter = v8ToIstanbul(sourcePath, 0, {
          source: code,
          sourceMap: {
            sourcemap: createExactSourceMap(code, codeOffset, execution.sourceURL),
          },
        });
        await converter.load();
        converter.applyCoverage(execution.coverage.functions);
        const report = converter.toIstanbul()[sourcePath];
        assert.ok(report, "browser coverage must resolve to the original source path");

        const firstEmbeddedLine = source.slice(0, codeOffset).split(/\r\n|\n|\r/).length;
        const lastEmbeddedLine = firstEmbeddedLine + code.split(/\r\n|\n|\r/).length - 1;
        const branchLines = Object.values(report.branchMap).map((branch) => branch.line);
        assert.ok(branchLines.length > 0, "V8 must expose executable block ranges");
        assert.ok(
          branchLines.every((line) => line >= firstEmbeddedLine && line <= lastEmbeddedLine),
          "branch locations must map only to the evaluated string's source lines"
        );

        assert.equal(report.statementMap["0"].start.line, 1);
        assert.equal(
          report.s["0"],
          1,
          "v8-to-istanbul seeds source lines outside the mapped script as covered"
        );
      }
    );
  });
});
