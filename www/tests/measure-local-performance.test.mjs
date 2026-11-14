import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import test from "node:test";
import {
  cleanupMeasurementResources,
  runMeasurementLifecycle,
} from "../scripts/measure-local-performance.mjs";

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
  assert.match(
    errors.map((error) => error.message).join("\n"),
    /kill\(\) returned false[\s\S]*exit was not confirmed within 53 ms[\s\S]*profile retained/
  );
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
