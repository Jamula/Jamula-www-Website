import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { EventEmitter } from "node:events";
import { mkdtemp, mkdir, rm, stat, writeFile } from "node:fs/promises";
import { createServer, get } from "node:http";
import { tmpdir } from "node:os";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { PassThrough, Writable } from "node:stream";
import test from "node:test";
import {
  cleanupMeasurementResources,
  createMeasurementConnection,
  listenMeasurementServer,
  navigateMeasurementPage,
  runMeasurement,
  runMeasurementLifecycle,
} from "../scripts/measure-local-performance.mjs";
import {
  browserEgressIsolationAcknowledgement,
  requireBrowserEgressIsolationAcknowledgement,
} from "./browser-egress-isolation.mjs";

test("BrowserEgressIsolation_RequiresExplicitAcknowledgement", () => {
  assert.throws(
    () => requireBrowserEgressIsolationAcknowledgement({}),
    /independently enforced external egress isolation is required.*acknowledgment does not verify or create isolation/
  );
  assert.doesNotThrow(() =>
    requireBrowserEgressIsolationAcknowledgement({
      [browserEgressIsolationAcknowledgement]: "1",
    })
  );
});

test("BrowserEgressIsolation_StopsBrowserEntrypointsBeforeBuildOrLaunch", async () => {
  const edgeDirectory = await mkdtemp(join(tmpdir(), "jamula-edge-gate-"));
  const edgePath = join(edgeDirectory, "edge-does-not-exist.exe");
  const env = { ...process.env, EDGE_PATH: edgePath };
  delete env[browserEgressIsolationAcknowledgement];
  delete env.NODE_TEST_CONTEXT;
  try {
    for (const entrypoint of [
      "./measure-local-performance.browser.mjs",
      "./404-layout.browser.mjs",
    ]) {
      const result = spawnSync(
        process.execPath,
        ["--test", fileURLToPath(new URL(entrypoint, import.meta.url))],
        { encoding: "utf8", env, timeout: 10000 }
      );
      const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;

      assert.equal(result.status, 1, `${entrypoint}: ${output}`);
      assert.match(output, /independently enforced external egress isolation is required/);
      assert.ok(
        !output.includes(edgePath),
        `${entrypoint} must not check or launch an Edge executable before the gate`
      );
    }
  } finally {
    await rm(edgeDirectory, { recursive: true, force: true });
  }
});

function requestLocal(url) {
  return new Promise((resolveResponse, reject) => {
    get(url, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () =>
        resolveResponse({
          status: response.statusCode,
          type: response.headers["content-type"],
          body: Buffer.concat(chunks).toString(),
        })
      );
      response.on("error", reject);
    }).on("error", reject);
  });
}

function fakeMeasurementBrowser({
  runtimeEvaluation = {
    result: {
      value: {
        lcp: 12,
        fcp: 10,
        cls: 0,
        ttfb: 8,
        shifts: [],
        resources: [{ name: "http://127.0.0.1/app.js", transferSize: 24 }],
        documentTransfer: 128,
      },
    },
  },
} = {}) {
  const child = childProcessStub();
  const output = new PassThrough();
  const calls = [];
  let context = 0;
  let requestCheck;
  const respond = (message) => output.write(`${JSON.stringify(message)}\0`);
  const input = new Writable({
    write(chunk, encoding, callback) {
      const message = JSON.parse(chunk.toString().slice(0, -1));
      calls.push(message);
      if (message.method === "Target.createBrowserContext") context++;
      const results = {
        "Browser.getVersion": { product: "FakeBrowser", protocolVersion: "1.3" },
        "Target.createBrowserContext": { browserContextId: `context-${context}` },
        "Target.createTarget": { targetId: "target" },
        "Target.attachToTarget": { sessionId: `session-${context}` },
        "Runtime.evaluate": runtimeEvaluation,
      };
      if (message.method === "Page.navigate" && !requestCheck) {
        const base = new URL(message.params.url).origin;
        requestCheck = Promise.all(
          [
            "/",
            "/privacy/",
            "/404.html",
            "/app.js",
            "/style.css",
            "/image.png",
            "/data.bin",
            "/missing",
          ].map((path) => requestLocal(`${base}${path}`))
        );
        respond({
          sessionId: message.sessionId,
          method: "Fetch.requestPaused",
          params: { request: { url: `${base}/app.js` }, requestId: "local" },
        });
        respond({
          sessionId: message.sessionId,
          method: "Fetch.requestPaused",
          params: { request: { url: "https://example.invalid/" }, requestId: "external" },
        });
      }
      queueMicrotask(() => {
        respond({ id: message.id, result: results[message.method] ?? {} });
        if (message.method === "Page.navigate") {
          respond({ sessionId: message.sessionId, method: "Page.loadEventFired", params: {} });
        }
      });
      callback();
    },
  });
  child.stderr = { resume() {} };
  child.stdio = [null, null, child.stderr, input, output];
  child.kill = () => {
    child.killCalls++;
    queueMicrotask(() => {
      child.exitCode = 0;
      child.emit("exit", 0);
    });
    return true;
  };
  return {
    child,
    calls,
    requests: () => requestCheck,
    dispose: () => {
      input.destroy();
      output.destroy();
    },
  };
}

for (const scenario of [
  {
    name: "MeasurementRun_CollectsAllSamplesAndBlocksExternalRequests",
  },
  {
    name: "MeasurementRun_RelativeRootServesFiles",
    rootStyle: "relative",
  },
  {
    name: "MeasurementRun_TrailingSeparatorRootServesFiles",
    rootStyle: "trailing-separator",
  },
  {
    name: "MeasurementRun_MissingMetricsFailsAndCleansUp",
    error: true,
    runtimeEvaluation: { result: { value: {} } },
  },
  {
    name: "MeasurementRun_MissingFcpWithOtherMetricsFailsAndCleansUp",
    error: true,
    expectedDetail: /"fcp":null/,
    runtimeEvaluation: {
      result: { value: { lcp: 12, fcp: null, cls: 0 } },
    },
  },
  {
    name: "MeasurementRun_ExceptionDetailsWithValidMetricsFailsAndCleansUp",
    error: true,
    expectedDetail: /exceptionDetails/,
    runtimeEvaluation: {
      result: { value: { lcp: 12, fcp: 10, cls: 0 } },
      exceptionDetails: {
        text: "Uncaught",
        exception: { description: "fixture evaluation error" },
      },
    },
  },
]) {
  test(scenario.name, { timeout: 5000 }, async () => {
    const directory = await mkdtemp(join(tmpdir(), "jamula-performance-test-"));
    const root = join(directory, "dist");
    const measurementRoot =
      scenario.rootStyle === "relative"
        ? relative(process.cwd(), root)
        : scenario.rootStyle === "trailing-separator"
          ? `${root}${sep}`
          : root;
    const profile = join(directory, "profile");
    const fake = fakeMeasurementBrowser({
      runtimeEvaluation: scenario.runtimeEvaluation,
    });
    const logs = [];
    let pauses = 0;
    try {
      await mkdir(join(root, "privacy"), { recursive: true });
      await mkdir(profile);
      for (const [file, body] of [
        ["index.html", "home"],
        ["privacy/index.html", "privacy"],
        ["404.html", "not found page"],
        ["app.js", "script"],
        ["style.css", "style"],
        ["image.png", "png"],
        ["data.bin", "data"],
      ])
        await writeFile(join(root, file), body);
      const run = runMeasurement({
        root: measurementRoot,
        createProfile: async () => profile,
        spawnBrowser: (executable, args, options) => {
          assert.ok(executable);
          assert.ok(args.includes("--remote-debugging-pipe"));
          assert.ok(args.includes("--proxy-server=127.0.0.1:9"));
          assert.deepEqual(options.stdio, ["ignore", "ignore", "pipe", "pipe", "pipe"]);
          return fake.child;
        },
        delay: async (milliseconds) => {
          assert.equal(milliseconds, 3000);
          pauses++;
          await fake.requests();
        },
        log: (line) => logs.push(JSON.parse(line)),
      });
      if (scenario.error) {
        await assert.rejects(run, (error) => {
          assert.match(error.message, /Missing measurements/);
          if (scenario.expectedDetail) assert.match(error.message, scenario.expectedDetail);
          return true;
        });
      } else await run;
      const responses = await fake.requests();
      assert.deepEqual(
        responses.map(({ status, type, body }) => [status, type, body]),
        [
          [200, "text/html; charset=utf-8", "home"],
          [200, "text/html; charset=utf-8", "privacy"],
          [200, "text/html; charset=utf-8", "not found page"],
          [200, "text/javascript", "script"],
          [200, "text/css", "style"],
          [200, "image/png", "png"],
          [200, "application/octet-stream", "data"],
          [404, undefined, ""],
        ]
      );
      assert.equal(logs[0].browser, "FakeBrowser");
      assert.equal(fake.child.killCalls, 1);
      await assert.rejects(stat(profile), { code: "ENOENT" });
      assert.deepEqual(
        fake.calls
          .filter((call) => call.method.startsWith("Fetch.") && call.method !== "Fetch.enable")
          .map((call) => [call.method, call.params.requestId]),
        [
          ["Fetch.continueRequest", "local"],
          ["Fetch.failRequest", "external"],
        ]
      );
      if (!scenario.error) {
        assert.equal(pauses, 30);
        assert.equal(logs.length, 31);
        assert.equal(logs[1].externalRequests, 1);
        assert.deepEqual(
          {
            lcp: logs[1].lcp,
            fcp: logs[1].fcp,
            cls: logs[1].cls,
            ttfb: logs[1].ttfb,
            shifts: logs[1].shifts,
            resources: logs[1].resources,
            documentTransfer: logs[1].documentTransfer,
          },
          {
            lcp: 12,
            fcp: 10,
            cls: 0,
            ttfb: 8,
            shifts: [],
            resources: [{ name: "http://127.0.0.1/app.js", transferSize: 24 }],
            documentTransfer: 128,
          }
        );
        assert.deepEqual(
          logs.slice(1).map(({ device, route, run }) => [device, route, run]),
          ["desktop", "mobile"].flatMap((device) =>
            ["/", "/privacy/", "/404.html"].flatMap((route) =>
              [1, 2, 3, 4, 5].map((run) => [device, route, run])
            )
          )
        );
        assert.equal(
          fake.calls.filter((call) => call.method === "Target.disposeBrowserContext").length,
          30
        );
      }
    } finally {
      fake.dispose();
      await rm(directory, { recursive: true, force: true });
    }
  });
}

for (const { name, cleanupFails } of [
  {
    name: "MeasurementStartup_BindErrorRemovesProfileAndPreservesOriginalError",
    cleanupFails: false,
  },
  { name: "MeasurementStartup_BindAndCleanupErrorsPreserveOriginalCause", cleanupFails: true },
]) {
  test(name, { timeout: 5000 }, async () => {
    const occupied = createServer();
    const server = createServer();
    const listeningListeners = server.listeners("listening");
    const resources = { server };
    const cleanupError = new Error("profile cleanup reporting failed");
    let startupError;
    let reachedMeasurement = false;
    let removedProfile;
    const observeError = (error) => {
      startupError = error;
    };
    server.on("error", observeError);

    try {
      await listenMeasurementServer(occupied);
      const port = occupied.address().port;
      await assert.rejects(
        runMeasurementLifecycle(
          async (created) => {
            created.profile = await mkdtemp(resolve(".performance-startup-test-"));
            await listenMeasurementServer(server, port);
            reachedMeasurement = true;
          },
          resources,
          {
            removeProfile: async (profile, options) => {
              assert.deepEqual(options, { recursive: true, force: true });
              await rm(profile, options);
              removedProfile = profile;
              if (cleanupFails) throw cleanupError;
            },
          }
        ),
        (error) => {
          assert.equal(startupError.code, "EADDRINUSE");
          assert.equal(startupError.address, "127.0.0.1");
          assert.equal(startupError.port, port);
          if (cleanupFails) {
            assert.ok(error instanceof AggregateError);
            assert.equal(error.cause, startupError);
            assert.equal(error.errors.length, 2);
            assert.equal(error.errors[0], startupError);
            assert.equal(error.errors[1].cause, cleanupError);
          } else {
            assert.equal(error, startupError);
          }
          return true;
        }
      );

      assert.equal(reachedMeasurement, false);
      assert.equal(removedProfile, resources.profile);
      await assert.rejects(stat(resources.profile), { code: "ENOENT" });
      assert.equal(server.listening, false);
      assert.equal(server.address(), null);
      assert.equal(occupied.listening, true);
      assert.deepEqual(server.listeners("listening"), listeningListeners);
      assert.deepEqual(server.listeners("error"), [observeError]);

      // A failed bind owns no listening socket; the same server remains reusable.
      await listenMeasurementServer(server);
      assert.equal(server.listening, true);
    } finally {
      await cleanupMeasurementResources({ server, profile: resources.profile });
      await cleanupMeasurementResources({ server: occupied });
      server.removeListener("error", observeError);
    }
  });
}

test("MeasurementStartup_ListeningWinsAndLifecycleClosesServer", { timeout: 5000 }, async () => {
  const server = createServer();
  const listeningListeners = server.listeners("listening");
  const resources = { server };
  let closeEvents = 0;
  server.on("close", () => closeEvents++);
  try {
    const result = await runMeasurementLifecycle(async (created) => {
      created.profile = await mkdtemp(resolve(".performance-startup-test-"));
      await listenMeasurementServer(server);
      assert.equal(server.listening, true);
      assert.equal(server.address().address, "127.0.0.1");
      assert.equal(server.listenerCount("error"), 0);
      assert.deepEqual(server.listeners("listening"), listeningListeners);
      return "started";
    }, resources);

    assert.equal(result, "started");
    assert.equal(closeEvents, 1);
    assert.equal(server.listening, false);
    assert.equal(server.address(), null);
    await assert.rejects(stat(resources.profile), { code: "ENOENT" });
  } finally {
    await cleanupMeasurementResources(resources);
  }
});

test(
  "MeasurementStartup_SynchronousListenErrorRemovesListenersAndProfile",
  { timeout: 5000 },
  async () => {
    const server = createServer();
    const listeningListeners = server.listeners("listening");
    const resources = { server };
    let startupError;
    try {
      await assert.rejects(
        runMeasurementLifecycle(async (created) => {
          created.profile = await mkdtemp(resolve(".performance-startup-test-"));
          try {
            await listenMeasurementServer(server, -1);
          } catch (error) {
            startupError = error;
            throw error;
          }
        }, resources),
        (error) => {
          assert.equal(error, startupError);
          assert.equal(error.code, "ERR_SOCKET_BAD_PORT");
          return true;
        }
      );
      assert.equal(server.listening, false);
      assert.equal(server.address(), null);
      assert.equal(server.listenerCount("error"), 0);
      assert.deepEqual(server.listeners("listening"), listeningListeners);
      await assert.rejects(stat(resources.profile), { code: "ENOENT" });
    } finally {
      await cleanupMeasurementResources(resources);
    }
  }
);

function childProcessStub() {
  const child = new EventEmitter();
  child.exitCode = null;
  child.signalCode = null;
  child.killCalls = 0;
  child.kill = () => {
    child.killCalls++;
    return true;
  };
  return child;
}

function serverStub(actions, { closeError } = {}) {
  return {
    listening: true,
    close(callback) {
      actions.push("server.close");
      this.listening = false;
      callback(closeError);
    },
  };
}

function immediateDeadline(expectedMs) {
  return {
    scheduleTimeout(callback, milliseconds) {
      assert.equal(milliseconds, expectedMs);
      queueMicrotask(callback);
      return { milliseconds };
    },
    cancelTimeout() {},
  };
}

function deferredDeadline(expectedMs) {
  return {
    scheduleTimeout(callback, milliseconds) {
      assert.equal(milliseconds, expectedMs);
      return { callback, milliseconds };
    },
    cancelTimeout() {},
  };
}

function controlledMeasurementDeadline() {
  const active = new Set();
  return {
    active,
    scheduleTimeout(callback, milliseconds) {
      assert.equal(milliseconds, 15000);
      const timer = { callback };
      active.add(timer);
      return timer;
    },
    cancelTimeout(timer) {
      active.delete(timer);
    },
  };
}

for (const { name, failureMode } of [
  { name: "MeasurementPipe_WriteEpipeRejectsRequestsAndCleansResources", failureMode: "write" },
  { name: "MeasurementPipe_ReadErrorRejectsRequestsAndCleansResources", failureMode: "read" },
  {
    name: "MeasurementPipe_SynchronousWriteErrorClearsRequestAndCleansResources",
    failureMode: "throw",
  },
]) {
  test(name, { timeout: 5000 }, async () => {
    const actions = [];
    const child = childProcessStub();
    const pipeError = Object.assign(new Error("debugging pipe failed"), { code: "EPIPE" });
    const input = new Writable({
      write(chunk, encoding, callback) {
        if (failureMode === "write") queueMicrotask(() => callback(pipeError));
        else callback();
      },
    });
    const output = new PassThrough();
    child.stderr = { resume() {} };
    child.stdio = [null, null, child.stderr, input, output];
    child.kill = () => {
      child.killCalls++;
      actions.push("browser.kill");
      setImmediate(() => {
        child.exitCode = 0;
        actions.push("browser.exit");
        child.emit("exit", 0, null);
      });
      return true;
    };
    if (failureMode === "throw")
      input.write = () => {
        throw pipeError;
      };
    const timers = controlledMeasurementDeadline();
    const { send } = createMeasurementConnection(child, timers);

    try {
      await assert.rejects(
        runMeasurementLifecycle(
          async () => {
            const requests = Promise.all([send("Browser.getVersion"), send("Page.enable")]);
            if (failureMode === "read") queueMicrotask(() => output.destroy(pipeError));
            await requests;
          },
          { browser: child, server: serverStub(actions), profile: "pipe-failure-profile" },
          {
            exitTimeoutMs: 41,
            ...deferredDeadline(41),
            removeProfile: async (profile) => {
              assert.equal(profile, "pipe-failure-profile");
              actions.push("profile.remove");
            },
          }
        ),
        (error) => error === pipeError
      );
      assert.equal(child.killCalls, 1);
      assert.deepEqual(actions, ["browser.kill", "browser.exit", "server.close", "profile.remove"]);
      assert.equal(timers.active.size, 0);
      await assert.rejects(send("Browser.getVersion"), (error) => error === pipeError);
      assert.equal(timers.active.size, 0);
    } finally {
      input.destroy();
      output.destroy();
    }
  });
}

test("MeasurementPipe_ResponseResolvesRequestAndClearsDeadline", async () => {
  const child = childProcessStub();
  const input = new PassThrough();
  const output = new PassThrough();
  child.stderr = { resume() {} };
  child.stdio = [null, null, child.stderr, input, output];
  const timers = controlledMeasurementDeadline();
  const { send } = createMeasurementConnection(child, timers);
  try {
    const response = send("Page.enable", {}, "session");
    assert.equal(
      input.read().toString(),
      '{"id":1,"method":"Page.enable","params":{},"sessionId":"session"}\0'
    );
    output.write('{"id":1,"result":{"enabled":true}}');
    assert.equal(timers.active.size, 1);
    output.write("\0");
    assert.deepEqual(await response, { enabled: true });
    assert.equal(timers.active.size, 0);
  } finally {
    input.destroy();
    output.destroy();
  }
});

test("MeasurementPipe_EventDispatchesSplitFramedEventToSessionHandler", () => {
  const child = childProcessStub();
  const input = new PassThrough();
  const output = new PassThrough();
  child.stderr = { resume() {} };
  child.stdio = [null, null, child.stderr, input, output];
  const { eventHandlers } = createMeasurementConnection(child);
  const received = [];
  eventHandlers.set("session-7:Page.loadEventFired", (params) => received.push(params));

  try {
    const event =
      '{"sessionId":"session-7","method":"Page.loadEventFired","params":{"frameId":"frame-7"}}\0';
    output.write(event.slice(0, 37));
    assert.deepEqual(received, []);
    output.write(event.slice(37));

    assert.deepEqual(received, [{ frameId: "frame-7" }]);
  } finally {
    input.destroy();
    output.destroy();
  }
});

test("MeasurementPipe_ProtocolErrorRejectsRequestAndClearsDeadline", async () => {
  const child = childProcessStub();
  const input = new PassThrough();
  const output = new PassThrough();
  child.stderr = { resume() {} };
  child.stdio = [null, null, child.stderr, input, output];
  const timers = controlledMeasurementDeadline();
  const { send } = createMeasurementConnection(child, timers);
  try {
    const response = send("Page.enable");
    assert.equal(input.read().toString(), '{"id":1,"method":"Page.enable","params":{}}\0');
    assert.equal(timers.active.size, 1);
    output.write('{"id":1,"error":{"code":-32000,"message":"Cannot enable"}}\0');

    await assert.rejects(response, {
      message: '{"code":-32000,"message":"Cannot enable"}',
    });
    assert.equal(timers.active.size, 0);
  } finally {
    input.destroy();
    output.destroy();
  }
});

test("MeasurementPipe_RequestDeadlineRejectsAndIgnoresLateResponse", async () => {
  const child = childProcessStub();
  const input = new PassThrough();
  const output = new PassThrough();
  child.stderr = { resume() {} };
  child.stdio = [null, null, child.stderr, input, output];
  const timers = controlledMeasurementDeadline();
  const { send } = createMeasurementConnection(child, timers);
  try {
    const request = send("Page.enable");
    const [timer] = timers.active;
    timer.callback();
    timers.active.delete(timer);
    await assert.rejects(request, { message: "CDP timeout: Page.enable" });
    output.write('{"id":1,"result":{}}\0');
    assert.equal(timers.active.size, 0);
  } finally {
    input.destroy();
    output.destroy();
  }
});

for (const { name, navigationFailure } of [
  {
    name: "MeasurementLoad_NavigationRejectionCancelsDeadlineAndListener",
    navigationFailure: "reject",
  },
  {
    name: "MeasurementLoad_NavigationErrorTextCancelsDeadlineAndListener",
    navigationFailure: "errorText",
  },
]) {
  test(name, async () => {
    const eventHandlers = new Map();
    const timers = controlledMeasurementDeadline();
    const navigationError = new Error("navigation failed");
    await assert.rejects(
      navigateMeasurementPage(
        async () => {
          assert.equal(eventHandlers.has("session:Page.loadEventFired"), true);
          assert.equal(timers.active.size, 1);
          if (navigationFailure === "reject") throw navigationError;
          return { errorText: navigationError.message };
        },
        eventHandlers,
        "session",
        "http://127.0.0.1/",
        timers
      ),
      (error) =>
        navigationFailure === "reject"
          ? error === navigationError
          : error.message === navigationError.message
    );
    assert.equal(timers.active.size, 0);
    assert.equal(eventHandlers.has("session:Page.loadEventFired"), false);
  });
}

for (const { name, navigationPending } of [
  {
    name: "MeasurementLoad_TimeoutBeforeNavigationSettlesIsObservedAndCleaned",
    navigationPending: true,
  },
  {
    name: "MeasurementLoad_TimeoutAfterNavigationSettlesIsBoundedAndCleaned",
    navigationPending: false,
  },
]) {
  test(name, { timeout: 5000 }, async () => {
    const eventHandlers = new Map();
    const timers = controlledMeasurementDeadline();
    let resolveNavigation;
    const navigation = new Promise((resolveResponse) => {
      resolveNavigation = resolveResponse;
    });
    const loading = navigateMeasurementPage(
      () => navigation,
      eventHandlers,
      "session",
      "http://127.0.0.1/",
      timers
    );
    const rejection = assert.rejects(loading, { message: "Page load timeout" });
    if (!navigationPending) {
      resolveNavigation({});
      await new Promise((resolveTurn) => setImmediate(resolveTurn));
    }
    const [timer] = timers.active;
    timer.callback();
    // Give Node a full turn to detect an unobserved rejection before navigation resolves.
    await new Promise((resolveTurn) => setImmediate(resolveTurn));
    assert.equal(timers.active.size, 0);
    assert.equal(eventHandlers.has("session:Page.loadEventFired"), false);
    if (navigationPending) resolveNavigation({});
    await rejection;
  });
}

test("MeasurementLoad_LoadEventBeforeNavigationResponseSucceedsAndCleansWait", async () => {
  const eventHandlers = new Map();
  const timers = controlledMeasurementDeadline();
  await navigateMeasurementPage(
    async (method, params, sessionId) => {
      assert.equal(method, "Page.navigate");
      assert.deepEqual(params, { url: "http://127.0.0.1/" });
      assert.equal(sessionId, "session");
      eventHandlers.get("session:Page.loadEventFired")();
      return {};
    },
    eventHandlers,
    "session",
    "http://127.0.0.1/",
    timers
  );
  assert.equal(timers.active.size, 0);
  assert.equal(eventHandlers.has("session:Page.loadEventFired"), false);
});

test("MeasurementLifecycle_DelayedChildExitPrecedesServerAndProfileCleanup", async () => {
  const actions = [];
  const child = childProcessStub();
  child.kill = () => {
    child.killCalls++;
    actions.push("browser.kill");
    setImmediate(() => {
      actions.push("browser.exit");
      child.exitCode = 0;
      child.emit("exit", 0, null);
    });
    return true;
  };
  const resources = {};

  const result = await runMeasurementLifecycle(
    async (created) => {
      created.browser = child;
      created.server = serverStub(actions);
      created.profile = "profile-for-exited-child";
      return "measurement complete";
    },
    resources,
    {
      exitTimeoutMs: 41,
      ...deferredDeadline(41),
      removeProfile: async (profile, options) => {
        assert.equal(profile, "profile-for-exited-child");
        assert.deepEqual(options, { recursive: true, force: true });
        actions.push("profile.remove");
      },
    }
  );

  assert.equal(result, "measurement complete");
  assert.equal(child.killCalls, 1);
  assert.deepEqual(actions, ["browser.kill", "browser.exit", "server.close", "profile.remove"]);
});

test("MeasurementLifecycle_FalseKillFollowedByExitSucceeds", async () => {
  const actions = [];
  const child = childProcessStub();
  child.kill = () => {
    child.killCalls++;
    actions.push("browser.kill");
    queueMicrotask(() => {
      actions.push("browser.exit");
      child.signalCode = "SIGTERM";
      child.emit("exit", null, "SIGTERM");
    });
    return false;
  };

  const result = await runMeasurementLifecycle(
    async () => "measurement complete",
    { browser: child, server: serverStub(actions), profile: "exited-profile" },
    {
      exitTimeoutMs: 43,
      ...deferredDeadline(43),
      removeProfile: async (profile, options) => {
        assert.equal(profile, "exited-profile");
        assert.deepEqual(options, { recursive: true, force: true });
        actions.push("profile.remove");
      },
    }
  );

  assert.equal(result, "measurement complete");
  assert.equal(child.killCalls, 1);
  assert.equal(child.listenerCount("exit"), 0);
  assert.deepEqual(actions, ["browser.kill", "browser.exit", "server.close", "profile.remove"]);
});

test("MeasurementLifecycle_FalseKillExitStatusAtDeadlineSucceeds", async () => {
  const actions = [];
  const child = childProcessStub();
  child.kill = () => {
    child.killCalls++;
    queueMicrotask(() => {
      child.exitCode = 0;
      actions.push("browser.exited");
    });
    return false;
  };

  const errors = await cleanupMeasurementResources(
    { browser: child, server: serverStub(actions), profile: "exited-profile" },
    {
      exitTimeoutMs: 47,
      ...immediateDeadline(47),
      removeProfile: async (profile) => {
        assert.equal(profile, "exited-profile");
        actions.push("profile.remove");
      },
    }
  );

  assert.deepEqual(errors, []);
  assert.equal(child.killCalls, 1);
  assert.equal(child.listenerCount("exit"), 0);
  assert.deepEqual(actions, ["browser.exited", "server.close", "profile.remove"]);
});

test("MeasurementLifecycle_FailedKillAndUnconfirmedExitRetainProfile", async () => {
  const actions = [];
  const child = childProcessStub();
  child.kill = () => {
    child.killCalls++;
    actions.push("browser.kill");
    return false;
  };

  const errors = await cleanupMeasurementResources(
    {
      browser: child,
      server: serverStub(actions),
      profile: "profile-still-in-use",
    },
    {
      exitTimeoutMs: 53,
      ...immediateDeadline(53),
      removeProfile: async () => actions.push("profile.remove"),
    }
  );

  assert.equal(child.killCalls, 1);
  assert.deepEqual(actions, ["browser.kill", "server.close"]);
  assert.equal(child.exitCode, null);
  assert.equal(child.signalCode, null);
  assert.equal(child.listenerCount("exit"), 0);
  assert.equal(errors.length, 3);
  assert.match(errors[0].message, /kill\(\) returned false/);
  assert.match(errors[1].message, /exit was not confirmed within 53 ms/);
  assert.match(errors[2].message, /profile retained.*profile-still-in-use/i);
});

test("MeasurementLifecycle_KillExceptionAndConfirmedExitPreserveErrors", async () => {
  const actions = [];
  const child = childProcessStub();
  const killError = new Error("kill failed");
  const operationalError = new Error("measurement failed");
  child.kill = () => {
    child.killCalls++;
    actions.push("browser.kill");
    queueMicrotask(() => {
      actions.push("browser.exit");
      child.exitCode = 0;
      child.emit("exit", 0, null);
    });
    throw killError;
  };

  await assert.rejects(
    runMeasurementLifecycle(
      async () => {
        throw operationalError;
      },
      { browser: child, server: serverStub(actions), profile: "exited-profile" },
      {
        exitTimeoutMs: 59,
        ...deferredDeadline(59),
        removeProfile: async (profile) => {
          assert.equal(profile, "exited-profile");
          actions.push("profile.remove");
        },
      }
    ),
    (error) => {
      assert.ok(error instanceof AggregateError);
      assert.equal(error.cause, operationalError);
      assert.equal(error.errors.length, 2);
      assert.equal(error.errors[0], operationalError);
      assert.match(error.errors[1].message, /kill\(\) failed/);
      assert.equal(error.errors[1].cause, killError);
      return true;
    }
  );

  assert.equal(child.killCalls, 1);
  assert.equal(child.listenerCount("exit"), 0);
  assert.deepEqual(actions, ["browser.kill", "browser.exit", "server.close", "profile.remove"]);
});

test("MeasurementLifecycle_KillExceptionAndUnconfirmedExitRetainProfile", async () => {
  const actions = [];
  const child = childProcessStub();
  const killError = new Error("kill failed");
  child.kill = () => {
    child.killCalls++;
    actions.push("browser.kill");
    throw killError;
  };

  const errors = await cleanupMeasurementResources(
    { browser: child, server: serverStub(actions), profile: "profile-still-in-use" },
    {
      exitTimeoutMs: 61,
      ...immediateDeadline(61),
      removeProfile: async () => actions.push("profile.remove"),
    }
  );

  assert.equal(child.killCalls, 1);
  assert.equal(child.listenerCount("exit"), 0);
  assert.deepEqual(actions, ["browser.kill", "server.close"]);
  assert.equal(errors.length, 3);
  assert.match(errors[0].message, /kill\(\) failed/);
  assert.equal(errors[0].cause, killError);
  assert.match(errors[1].message, /exit was not confirmed within 61 ms/);
  assert.match(errors[2].message, /profile retained.*profile-still-in-use/i);
});

test("MeasurementLifecycle_UnconfirmedExitAfterSuccessfulKillIsBounded", async () => {
  const actions = [];
  const child = childProcessStub();

  const errors = await cleanupMeasurementResources(
    {
      browser: child,
      server: serverStub(actions),
      profile: "profile-still-in-use",
    },
    {
      exitTimeoutMs: 67,
      ...immediateDeadline(67),
      removeProfile: async () => actions.push("profile.remove"),
    }
  );

  assert.equal(child.killCalls, 1);
  assert.deepEqual(actions, ["server.close"]);
  assert.equal(child.exitCode, null);
  assert.equal(child.signalCode, null);
  assert.match(
    errors.map((error) => error.message).join("\n"),
    /exit was not confirmed within 67 ms[\s\S]*profile retained/
  );
});

test("MeasurementLifecycle_ServerCloseDeadlineDestroysOwnedConnectionsAndContinues", async () => {
  const actions = [];
  const child = childProcessStub();
  child.exitCode = 0;
  const server = {
    listening: true,
    close() {
      actions.push("server.close");
    },
    closeAllConnections() {
      actions.push("server.closeAllConnections");
    },
  };

  const errors = await cleanupMeasurementResources(
    { browser: child, server, profile: "profile-for-exited-child" },
    {
      exitTimeoutMs: 71,
      ...immediateDeadline(71),
      removeProfile: async () => actions.push("profile.remove"),
    }
  );

  assert.deepEqual(actions, ["server.close", "server.closeAllConnections", "profile.remove"]);
  assert.match(
    errors.map((error) => error.message).join("\n"),
    /server close was not confirmed within 71 ms/
  );
});

test("MeasurementLifecycle_SynchronousServerCloseFailureIsReported", async () => {
  const closeError = new Error("close failed");
  await assert.rejects(
    runMeasurementLifecycle(async () => "completed", {
      server: {
        listening: true,
        close() {
          throw closeError;
        },
      },
    }),
    (error) => {
      assert.ok(error instanceof AggregateError);
      assert.equal(error.errors.length, 1);
      assert.match(error.errors[0].message, /server close failed/i);
      assert.equal(error.cause, error.errors[0]);
      assert.equal(error.errors[0].cause, closeError);
      return true;
    }
  );
});

test("MeasurementLifecycle_DestroyConnectionsFailureIsPreserved", async () => {
  const destroyError = new Error("destroy failed");
  const errors = await cleanupMeasurementResources(
    {
      server: {
        listening: true,
        close() {},
        closeAllConnections() {
          throw destroyError;
        },
      },
    },
    { exitTimeoutMs: 73, ...immediateDeadline(73) }
  );
  assert.equal(errors.length, 1);
  assert.match(errors[0].message, /server close was not confirmed within 73 ms/i);
  assert.equal(errors[0].cause, destroyError);
});

test("MeasurementLifecycle_PreservesOperationalErrorAndAttemptsRemainingCleanup", async () => {
  const actions = [];
  const operationalError = new Error("CDP operation failed");
  const closeError = new Error("server close failed");
  const resources = {};

  await assert.rejects(
    runMeasurementLifecycle(
      async (created) => {
        const child = childProcessStub();
        child.exitCode = 0;
        created.browser = child;
        created.server = serverStub(actions, { closeError });
        created.profile = "profile-for-exited-child";
        throw operationalError;
      },
      resources,
      {
        removeProfile: async () => actions.push("profile.remove"),
      }
    ),
    (error) => {
      assert.ok(error instanceof AggregateError);
      assert.equal(error.cause, operationalError);
      assert.equal(error.errors[0], operationalError);
      assert.match(error.errors[1].message, /server close failed/);
      return true;
    }
  );

  assert.deepEqual(actions, ["server.close", "profile.remove"]);
});
