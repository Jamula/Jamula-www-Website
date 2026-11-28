import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const EXPECTED_SECURITY_HEADERS = Object.freeze({
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
});

export function assertDeploymentConfig(configPath) {
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const csp = config.globalHeaders?.["Content-Security-Policy"];
  if (typeof csp !== "string" || csp.length === 0) {
    throw new Error("Built Static Web Apps configuration has no CSP.");
  }
  if (config.responseOverrides?.["404"]?.statusCode !== 404) {
    throw new Error(
      "Built Static Web Apps configuration is missing the 404 response override.",
    );
  }
  if (config.mimeTypes?.[".txt"] !== "text/plain") {
    throw new Error(
      "Built Static Web Apps configuration is missing the .txt MIME mapping.",
    );
  }
  for (const [name, expected] of Object.entries(EXPECTED_SECURITY_HEADERS)) {
    if (config.globalHeaders[name] !== expected) {
      throw new Error(
        `Built Static Web Apps configuration has unexpected ${name} header.`,
      );
    }
  }
  return config;
}

export function assertLiveSecurityHeaders(configPath, headers) {
  const config = assertDeploymentConfig(configPath);
  if (
    headers["content-security-policy"] !==
    config.globalHeaders["Content-Security-Policy"]
  ) {
    throw new Error(
      "Live Content-Security-Policy does not match the built configuration.",
    );
  }
  for (const [name, expected] of Object.entries(EXPECTED_SECURITY_HEADERS)) {
    if (headers[name.toLowerCase()] !== expected) {
      throw new Error(`Unexpected ${name} header.`);
    }
  }
  const hsts = headers["strict-transport-security"];
  if (typeof hsts !== "string" || hsts.trim().length === 0) {
    throw new Error("Strict-Transport-Security was not enforced.");
  }
}

export function assertConfiguredCsp(configPath, headersPath) {
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const expected = config.globalHeaders?.["Content-Security-Policy"];
  if (typeof expected !== "string" || expected.length === 0) {
    throw new Error("Built Static Web Apps configuration has no CSP.");
  }

  const responseBlocks = fs
    .readFileSync(headersPath, "utf8")
    .trim()
    .split(/\r?\n\r?\n/);
  const finalResponse = responseBlocks
    .reverse()
    .find((block) => /^HTTP\/\S+\s+\d{3}\b/m.test(block));
  if (!finalResponse) {
    throw new Error("Live response has no HTTP header block.");
  }

  const actual = finalResponse
    .split(/\r?\n/)
    .filter((line) => /^content-security-policy\s*:/i.test(line))
    .map((line) => line.slice(line.indexOf(":") + 1).trim());
  if (actual.length !== 1 || actual[0] !== expected) {
    throw new Error(
      "Live Content-Security-Policy does not match the built configuration.",
    );
  }
}

if (import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    if (process.argv.length === 3) {
      assertDeploymentConfig(process.argv[2]);
    } else if (process.argv.length === 4) {
      assertConfiguredCsp(process.argv[2], process.argv[3]);
    } else {
      throw new Error(
        "Usage: verify-swa-csp.mjs <staticwebapp.config.json> [curl-headers]",
      );
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
