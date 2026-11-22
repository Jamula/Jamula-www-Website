const fs = require("node:fs");
const { execFileSync } = require("node:child_process");

function api(endpoint, body, jq, run = execFileSync) {
  const command = ["api", "--method", "POST", endpoint, "--input", "-"];
  if (jq) command.push("--jq", jq);
  return run("gh", command, {
    input: JSON.stringify(body),
    encoding: "utf8",
    stdio: ["pipe", "pipe", "inherit"],
  }).trim();
}

function execute(
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
  } else {
    throw new Error("Unknown deployment command");
  }
}

if (require.main === module) execute(process.argv[2], process.argv.slice(3));
module.exports = { api, execute };
