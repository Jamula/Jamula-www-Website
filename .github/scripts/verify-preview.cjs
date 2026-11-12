const fs = require("node:fs");
const path = require("node:path");
const https = require("node:https");

const RETRY_DELAYS = [2000, 4000, 8000, 16000, 30000];
const TRANSIENT_STATUS = new Set([429, 500, 502, 503, 504]);
const TRANSIENT_CODES = new Set([
  "ETIMEDOUT",
  "ECONNRESET",
  "ECONNREFUSED",
  "EAI_AGAIN",
]);
const BODY_LIMIT = 5 * 1024 * 1024;

function requestPreview(url, expectedStatus = 200) {
  let timer;
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      response.on("error", reject);
      if (response.statusCode !== expectedStatus) {
        resolve({
          status: response.statusCode,
          headers: response.headers,
          body: Buffer.alloc(0),
        });
        response.destroy();
        return;
      }
      const chunks = [];
      let size = 0;
      response.on("data", (chunk) => {
        size += chunk.length;
        if (size > BODY_LIMIT) {
          const error = new Error("Preview response exceeds the size limit.");
          error.code = "RESPONSE_TOO_LARGE";
          response.destroy(error);
          return;
        }
        chunks.push(chunk);
      });
      response.on("end", () => {
        resolve({
          status: response.statusCode,
          headers: response.headers,
          body: Buffer.concat(chunks),
        });
      });
    });
    timer = setTimeout(() => {
      const error = new Error("Preview request timed out.");
      error.code = "ETIMEDOUT";
      request.destroy(error);
    }, 20000);
    request.on("error", reject);
  }).finally(() => clearTimeout(timer));
}

async function fetchPreview(url, options = {}) {
  const request = options.request ?? requestPreview;
  const sleep =
    options.sleep ??
    ((delay) => new Promise((resolve) => setTimeout(resolve, delay)));
  const log = options.log ?? console.error;
  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt += 1) {
    try {
      const response = await request(url, options.expectedStatus ?? 200);
      if (TRANSIENT_STATUS.has(response.status)) {
        const error = new Error(`HTTP ${response.status}`);
        error.status = response.status;
        throw error;
      }
      return response;
    } catch (error) {
      const transient =
        error.status !== undefined
          ? TRANSIENT_STATUS.has(error.status)
          : TRANSIENT_CODES.has(error.code);
      log(
        `Preview request ${url} attempt ${attempt + 1} failed: ${error.message}`,
      );
      if (!transient || attempt === RETRY_DELAYS.length) {
        throw error;
      }
      const delay = RETRY_DELAYS[attempt];
      log(`Retrying in ${delay / 1000} seconds.`);
      await sleep(delay);
    }
  }
}

async function verifyPreview(url, options = {}) {
  if (
    !/^https:\/\/ashy-beach-033c7d01e-[1-9][0-9]*\.7\.azurestaticapps\.net\/?(?![\s\S])/.test(
      url,
    )
  ) {
    throw new Error("Only an isolated Jamula PR preview URL may be verified.");
  }
  const base = url.replace(/\/$/, "");
  const home = await fetchPreview(`${base}/`, options);
  if (home.status !== 200) {
    throw new Error("The preview home page did not return 200.");
  }
  if (
    !/<title>[^<]*Jamula/i.test(
      new TextDecoder("utf-8", { fatal: true }).decode(home.body),
    )
  ) {
    throw new Error("The preview home page has an unexpected title.");
  }
  const config = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "../../www/public/staticwebapp.config.json"),
      "utf8",
    ),
  );
  for (const [name, value] of Object.entries(config.globalHeaders)) {
    if (home.headers[name.toLowerCase()] !== value) {
      throw new Error(`The preview has an unexpected ${name} header.`);
    }
  }
  if (!home.headers["strict-transport-security"]) {
    throw new Error("The preview does not enforce HSTS.");
  }
  if (
    !String(home.headers["x-robots-tag"] ?? "")
      .toLowerCase()
      .includes("none")
  ) {
    throw new Error("The preview does not enforce X-Robots-Tag: none.");
  }
  const robots = await fetchPreview(`${base}/robots.txt`, options);
  if (robots.status !== 200) {
    throw new Error("The preview robots.txt did not return 200.");
  }
  if (
    String(robots.headers["content-type"] ?? "")
      .split(";")[0]
      .trim()
      .toLowerCase() !== "text/plain"
  ) {
    throw new Error("The preview robots.txt MIME type is not text/plain.");
  }
  const missing = await fetchPreview(`${base}/__jamula_missing_route__`, {
    ...options,
    expectedStatus: 404,
  });
  if (missing.status !== 404) {
    throw new Error("The preview missing route did not return 404.");
  }
  if (!missing.body.includes(Buffer.from("Page not found"))) {
    throw new Error("The preview does not serve the expected 404 page.");
  }
}

module.exports = { verifyPreview, fetchPreview, requestPreview, RETRY_DELAYS };

if (require.main === module) {
  if (process.argv.length !== 3) {
    console.error("Usage: node verify-preview.cjs HTTPS_PREVIEW_URL");
    process.exitCode = 1;
  } else {
    verifyPreview(process.argv[2]).then(
      () =>
        console.log(
          "Live preview headers, noindex, robots MIME type, and 404 response verified.",
        ),
      (error) => {
        console.error(error.message);
        process.exitCode = 1;
      },
    );
  }
}
