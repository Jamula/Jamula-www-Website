import fs from "node:fs";
import path from "node:path";
import childProcess from "node:child_process";
import { pathToFileURL } from "node:url";
import { metadata, verifyMetadata } from "./release.mjs";
import { requestPreview } from "./verify-preview.mjs";
import { assertLiveSecurityHeaders } from "./verify-swa-csp.mjs";

export const PRODUCTION_URLS = {
  net: "https://ashy-beach-033c7d01e.7.azurestaticapps.net",
  com: "https://red-cliff-0ee064a1e.2.azurestaticapps.net",
};

const READINESS_ATTEMPTS = 18;
const READINESS_DELAY_MS = 10000;

export function api(endpoint, body, jq, run = childProcess.execFileSync) {
  const command = ["api", "--method", "POST", endpoint, "--input", "-"];
  if (jq) command.push("--jq", jq);
  return run("gh", command, {
    input: JSON.stringify(body),
    encoding: "utf8",
    stdio: ["pipe", "pipe", "inherit"],
  }).trim();
}

export function execute(
  action,
  args,
  env = process.env,
  request = api,
  append = fs.appendFileSync,
) {
  const {
    GITHUB_REPOSITORY: repo,
    DEPLOYMENT_SHA: sha,
    RELEASE_VERSION: version,
    GITHUB_RUN_ID: run,
    RELEASE_ATTEMPT: attempt,
    CHANGE_TYPE: classification,
    DEPLOYMENT_APP: app,
    GITHUB_SERVER_URL: server,
  } = env;
  const base = `repos/${repo}/deployments`;
  if (action === "start") {
    if (
      !/^[0-9a-f]{40}$/.test(sha) ||
      !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version) ||
      !/^[1-9]\d*$/.test(run) ||
      !/^[1-9]\d*$/.test(attempt) ||
      !["material", "fix"].includes(classification) ||
      !["net", "com"].includes(app)
    )
      throw new Error("Invalid production deployment identity");
    const id = request(
      base,
      {
        ref: sha,
        auto_merge: false,
        required_contexts: [],
        environment: `production-${app}`,
        production_environment: true,
        description: `Jamula ${app} deployment for v${version}`,
        payload: {
          release_tag: `v${version}`,
          release_url: `${server}/${repo}/releases/tag/v${version}`,
          deployed_sha: sha,
          run_id: run,
          build_attempt: attempt,
          change_type: classification,
        },
      },
      ".id",
    );
    if (!/^[1-9]\d*$/.test(id)) throw new Error("Invalid deployment ID");
    append(env.GITHUB_OUTPUT, `id=${id}\n`);
    request(`${base}/${id}/statuses`, {
      state: "in_progress",
      log_url: `${server}/${repo}/actions/runs/${run}`,
      auto_inactive: false,
    });
  } else if (action === "status") {
    const [id, state, url] = args;
    if (!/^[1-9]\d*$/.test(id) || !["success", "failure"].includes(state))
      throw new Error("Invalid deployment status");
    const body = {
      state,
      log_url: `${server}/${repo}/actions/runs/${run}`,
      auto_inactive: false,
    };
    if (state === "success") body.environment_url = url;
    request(`${base}/${id}/statuses`, body);
  } else if (action === "finish") {
    const state = env.VERIFY_OUTCOME === "success" ? "success" : "failure";
    execute(
      "status",
      [env.DEPLOYMENT_ID, state, env.DEPLOYED_URL],
      env,
      request,
      append,
    );
  } else {
    throw new Error("Unknown deployment command");
  }
}

export async function verifyProductionSite(env = process.env, options = {}) {
  const expectedOrigin = PRODUCTION_URLS[env.DEPLOYMENT_APP];
  if (!expectedOrigin) {
    throw new Error("Invalid production deployment app.");
  }
  const rawUrl = String(env.DEPLOYED_URL ?? "");
  const base = rawUrl.replace(/\/$/, "");
  if (base !== expectedOrigin) {
    throw new Error("The deployment action returned an unexpected URL.");
  }

  const expectedMetadata = metadata(
    env.RELEASE_VERSION,
    env.DEPLOYMENT_SHA,
    env.GITHUB_RUN_ID,
    env.RELEASE_ATTEMPT,
  );
  const configPath = options.configPath ?? "www/dist/staticwebapp.config.json";
  const request = options.request ?? requestPreview;
  const sleep =
    options.sleep ??
    ((delay) => new Promise((resolve) => setTimeout(resolve, delay)));
  const append = options.append ?? fs.appendFileSync;

  let ready = false;
  for (let attempt = 1; attempt <= READINESS_ATTEMPTS; attempt += 1) {
    try {
      const response = await request(`${base}/`, 200);
      if (response.status === 200) {
        ready = true;
        break;
      }
    } catch {
      // Retry readiness until attempts are exhausted.
    }
    if (attempt < READINESS_ATTEMPTS) {
      await sleep(READINESS_DELAY_MS);
    }
  }
  if (!ready) {
    throw new Error("The deployed home page did not become ready.");
  }

  const metadataUrl = `${base}/release.json?run=${env.GITHUB_RUN_ID}-${env.RELEASE_ATTEMPT}`;
  let metadataVerified = false;
  for (let attempt = 1; attempt <= READINESS_ATTEMPTS; attempt += 1) {
    try {
      const response = await request(metadataUrl, 200, {
        "Cache-Control": "no-cache",
      });
      if (response.status === 200) {
        const parsed = JSON.parse(
          new TextDecoder("utf-8", { fatal: true }).decode(response.body),
        );
        verifyMetadata(parsed, expectedMetadata);
        metadataVerified = true;
        break;
      }
    } catch {
      // Retry until the live CDN serves the newly stamped release.json.
    }
    if (attempt < READINESS_ATTEMPTS) {
      await sleep(READINESS_DELAY_MS);
    }
  }
  if (!metadataVerified) {
    throw new Error(
      "Live release metadata did not match the deployed artifact.",
    );
  }

  const home = await request(`${base}/`, 200, { "Cache-Control": "no-cache" });
  if (home.status !== 200) {
    throw new Error("The deployed home page did not return 200.");
  }
  const homeHtml = new TextDecoder("utf-8", { fatal: true }).decode(home.body);
  if (!/<title>[^<]*Jamula/i.test(homeHtml)) {
    throw new Error("The deployed home page has an unexpected title.");
  }
  assertLiveSecurityHeaders(configPath, home.headers);

  const robots = await request(`${base}/robots.txt`, 200);
  if (robots.status !== 200) {
    throw new Error("The deployed robots.txt did not return 200.");
  }
  const robotsMime = String(robots.headers["content-type"] ?? "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  if (robotsMime !== "text/plain") {
    throw new Error("Unexpected robots.txt Content-Type.");
  }

  const missing = await request(`${base}/__jamula_missing_route__`, 404);
  if (missing.status !== 404) {
    throw new Error("The deployed missing route did not return 404.");
  }
  const missingHtml = new TextDecoder("utf-8", { fatal: true }).decode(
    missing.body,
  );
  if (!/Page not found/i.test(missingHtml)) {
    throw new Error("The deployed site did not serve the expected 404 page.");
  }

  const summary = [
    "### Verified Azure deployment",
    `- Release: \`v${env.RELEASE_VERSION}\``,
    `- Revision: \`${env.DEPLOYMENT_SHA}\``,
    `- Artifact digest: \`${env.ARTIFACT_DIGEST}\``,
    `- URL: ${rawUrl}`,
    "- Configuration: CSP, framing, MIME, referrer, permissions, 404 response",
    "- Azure platform: TLS/HSTS",
    "",
  ].join("\n");
  append(env.GITHUB_STEP_SUMMARY, summary);
}

if (import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const action = process.argv[2];
  if (action === "verify") {
    verifyProductionSite().catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
  } else {
    execute(action, process.argv.slice(3));
  }
}
