const fs = require("node:fs");

function assertConfiguredCsp(configPath, headersPath) {
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

if (require.main === module) {
  try {
    if (process.argv.length !== 4) {
      throw new Error(
        "Usage: verify-swa-csp.cjs <staticwebapp.config.json> <curl-headers>",
      );
    }
    assertConfiguredCsp(process.argv[2], process.argv[3]);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { assertConfiguredCsp };
