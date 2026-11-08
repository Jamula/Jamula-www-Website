const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const https = require("node:https");
const { EventEmitter } = require("node:events");
const { spawnSync } = require("node:child_process");
const { test } = require("node:test");
const {
  verifyPreview,
  fetchPreview,
  requestPreview,
  RETRY_DELAYS,
} = require("./verify-preview.cjs");

const URL = "https://ashy-beach-033c7d01e-74.7.azurestaticapps.net";

function fixture() {
  const config = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "../../www/public/staticwebapp.config.json"),
      "utf8",
    ),
  );
  const headers = Object.fromEntries(
    Object.entries(config.globalHeaders).map(([name, value]) => [
      name.toLowerCase(),
      value,
    ]),
  );
  headers["strict-transport-security"] ??= "max-age=31536000";
  headers["x-robots-tag"] = "none";
  const responses = [
    { status: 200, headers, body: Buffer.from("<title>Jamula</title>") },
    {
      status: 200,
      headers: { "content-type": "text/plain; charset=utf-8" },
      body: Buffer.alloc(0),
    },
    { status: 404, headers: {}, body: Buffer.from("Page not found") },
  ];
  const calls = [];
  const delays = [];
  const logs = [];
  const options = {
    request: async (url) => {
      calls.push(url);
      assert.ok(responses.length > 0, "Unexpected extra request");
      const response = responses.shift();
      if (response instanceof Error) throw response;
      return response;
    },
    sleep: async (delay) => {
      delays.push(delay);
    },
    log: (message) => {
      logs.push(message);
    },
  };
  return { responses, calls, delays, logs, options };
}

test("verifies the live preview contract without retries", async () => {
  const f = fixture();
  await verifyPreview(URL, f.options);
  assert.deepEqual(f.calls, [
    `${URL}/`,
    `${URL}/robots.txt`,
    `${URL}/__jamula_missing_route__`,
  ]);
  assert.deepEqual(f.delays, []);
});

test("rejects unsafe preview URLs before any request", async () => {
  for (const url of [
    "https://ashy-beach-033c7d01e.7.azurestaticapps.net",
    "https://jamula.net",
    URL.replace("https:", "http:"),
    `${URL}?redirect=elsewhere`,
    `${URL}#fragment`,
    `${URL}.evil.example`,
    `${URL}:443`,
    `${URL}\n`,
    `${URL}\r\n`,
    URL.replace("-74.", "-0."),
  ]) {
    const f = fixture();
    await assert.rejects(verifyPreview(url, f.options), /Only an isolated/);
    assert.deepEqual(f.calls, []);
    assert.deepEqual(f.delays, []);
  }
});

test("retries selected transient failures on each probe without restarting others", async () => {
  const failures = [
    ...["ETIMEDOUT", "ECONNRESET", "ECONNREFUSED", "EAI_AGAIN"].map(
      (code) => () => Object.assign(new Error(code), { code }),
    ),
    ...[429, 500, 502, 503, 504].map((status) => () => ({
      status,
      headers: {},
      body: Buffer.alloc(0),
    })),
  ];
  for (const failure of failures) {
    for (let probe = 0; probe < 3; probe += 1) {
      const f = fixture();
      f.responses.splice(probe, 0, failure());
      await verifyPreview(URL, f.options);
      assert.equal(f.calls.length, 4);
      assert.equal(f.calls[probe], f.calls[probe + 1]);
      assert.deepEqual(f.delays, [2000]);
      assert.match(f.logs[0], /attempt 1 failed/);
    }
  }
});

test("exhausts retries with exact bounded exponential backoff on every probe", async () => {
  for (let probe = 0; probe < 3; probe += 1) {
    const f = fixture();
    f.responses.splice(
      probe,
      0,
      ...Array.from({ length: 6 }, () =>
        Object.assign(new Error("timeout"), { code: "ETIMEDOUT" }),
      ),
    );
    await assert.rejects(verifyPreview(URL, f.options), /timeout/);
    assert.equal(f.calls.length, probe + 6);
    assert.deepEqual(f.delays, [2000, 4000, 8000, 16000, 30000]);
    assert.equal(
      RETRY_DELAYS.reduce((sum, delay) => sum + delay, 0),
      60000,
    );
    assert.match(f.logs.at(-1), /attempt 6 failed/);
  }
});

test("never retries permanent network and certificate errors", async () => {
  for (const code of [
    "ENOTFOUND",
    "CERT_HAS_EXPIRED",
    "DEPTH_ZERO_SELF_SIGNED_CERT",
    "RESPONSE_TOO_LARGE",
    undefined,
  ]) {
    for (let probe = 0; probe < 3; probe += 1) {
      const f = fixture();
      const error = Object.assign(new Error("permanent"), { code });
      f.responses.splice(probe, 0, error);
      await assert.rejects(
        verifyPreview(URL, f.options),
        (caught) => caught === error,
      );
      assert.equal(f.calls.length, probe + 1);
      assert.deepEqual(f.delays, []);
    }
  }
});

test("never retries redirects, authentication errors, or deterministic HTTP statuses", async () => {
  for (const status of [
    201, 301, 302, 307, 308, 400, 401, 403, 404, 409, 501,
  ]) {
    const f = fixture();
    f.responses[0].status = status;
    await assert.rejects(verifyPreview(URL, f.options), /did not return 200/);
    assert.equal(f.calls.length, 1);
    assert.deepEqual(f.delays, []);
  }
});

test("never retries deterministic content and security failures", async () => {
  const mutations = [
    [
      (f) => {
        f.responses[0].body = Buffer.from("<title>Other</title>");
      },
      /unexpected title/,
      1,
    ],
    [
      (f) => {
        f.responses[0].headers["x-frame-options"] = "SAMEORIGIN";
      },
      /X-Frame-Options/,
      1,
    ],
    [
      (f) => {
        delete f.responses[0].headers["strict-transport-security"];
      },
      /Strict-Transport-Security|HSTS/,
      1,
    ],
    [
      (f) => {
        delete f.responses[0].headers["x-robots-tag"];
      },
      /X-Robots-Tag/,
      1,
    ],
    [
      (f) => {
        f.responses[1].headers["content-type"] = "text/html";
      },
      /MIME type/,
      2,
    ],
    [
      (f) => {
        f.responses[1].status = 201;
      },
      /did not return 200/,
      2,
    ],
    [
      (f) => {
        f.responses[2].status = 200;
      },
      /did not return 404/,
      3,
    ],
    [
      (f) => {
        f.responses[2].body = Buffer.from("Wrong");
      },
      /expected 404 page/,
      3,
    ],
  ];
  for (const [mutate, message, calls] of mutations) {
    const f = fixture();
    mutate(f);
    await assert.rejects(verifyPreview(URL, f.options), message);
    assert.equal(f.calls.length, calls);
    assert.deepEqual(f.delays, []);
  }
});

test("transient statuses return the eventual successful response", async () => {
  const f = fixture();
  f.responses.unshift({ status: 503, headers: {}, body: Buffer.alloc(0) });
  const response = await fetchPreview(`${URL}/`, f.options);
  assert.equal(response.status, 200);
  assert.equal(response.body.toString(), "<title>Jamula</title>");
  assert.deepEqual(f.delays, [2000]);
});

test("HTTP transport returns redirects without following their location", async (t) => {
  const calls = [];
  t.mock.method(https, "get", (url, callback) => {
    calls.push(url);
    const request = new EventEmitter();
    queueMicrotask(() => {
      const response = new EventEmitter();
      response.statusCode = 302;
      response.headers = { location: "https://evil.example" };
      callback(response);
      response.emit("end");
    });
    return request;
  });
  const response = await requestPreview(`${URL}/`);
  assert.equal(response.status, 302);
  assert.deepEqual(calls, [`${URL}/`]);
});

test("HTTP transport rejects an oversized body without a retryable error", async (t) => {
  t.mock.method(https, "get", (url, callback) => {
    const request = new EventEmitter();
    queueMicrotask(() => {
      const response = new EventEmitter();
      response.destroy = (error) => response.emit("error", error);
      callback(response);
      response.emit("data", Buffer.alloc(5 * 1024 * 1024 + 1));
    });
    return request;
  });
  await assert.rejects(requestPreview(`${URL}/`), {
    code: "RESPONSE_TOO_LARGE",
  });
});

test("HTTP transport propagates interrupted response reads", async (t) => {
  const error = Object.assign(new Error("read reset"), { code: "ECONNRESET" });
  t.mock.method(https, "get", (url, callback) => {
    const request = new EventEmitter();
    queueMicrotask(() => {
      const response = new EventEmitter();
      callback(response);
      response.emit("error", error);
    });
    return request;
  });
  await assert.rejects(requestPreview(`${URL}/`), (caught) => caught === error);
});

test("HTTP transport enforces the exact connection and response deadline", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let destroyed = false;
  t.mock.method(https, "get", () => {
    const request = new EventEmitter();
    request.destroy = (error) => {
      destroyed = true;
      request.emit("error", error);
    };
    return request;
  });
  const pending = requestPreview(`${URL}/`);
  t.mock.timers.tick(19999);
  assert.equal(destroyed, false);
  t.mock.timers.tick(1);
  assert.equal(destroyed, true);
  await assert.rejects(pending, { code: "ETIMEDOUT" });
});

test("CLI rejects missing arguments and production URLs with a failing exit", () => {
  for (const arguments_ of [
    [],
    ["https://ashy-beach-033c7d01e.7.azurestaticapps.net"],
  ]) {
    const result = spawnSync(
      process.execPath,
      [path.join(__dirname, "verify-preview.cjs"), ...arguments_],
      { encoding: "utf8" },
    );
    assert.ifError(result.error);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Usage:|Only an isolated/);
    assert.equal(result.stdout, "");
  }
});
