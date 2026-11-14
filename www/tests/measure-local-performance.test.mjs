import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { PassThrough, Writable } from "node:stream";
import test from "node:test";
import {
  cleanupMeasurementResources,
  createMeasurementConnection,
  listenMeasurementServer,
  navigateMeasurementPage,
  runMeasurementLifecycle,
} from "../scripts/measure-local-performance.mjs";

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
