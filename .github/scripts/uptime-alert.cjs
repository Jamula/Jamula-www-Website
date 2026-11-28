const title = "Scheduled hostname monitor failure";
const marker = "<!-- jamula-uptime-monitor-alert -->";

async function escalate(github, repo, runUrl) {
  const issues = await github.paginate(github.rest.issues.listForRepo, {
    ...repo,
    state: "open",
    per_page: 100,
  });
  const existing = issues.find(
    (issue) =>
      !issue.pull_request &&
      issue.title === title &&
      issue.user?.login === "github-actions[bot]" &&
      issue.body?.includes(marker),
  );
  if (existing) return existing;

  const { data } = await github.rest.issues.create({
    ...repo,
    title,
    body: `${marker}
The scheduled hostname monitor failed: ${runUrl}

Inspect the run logs and investigate DNS, HTTPS, site content, and monitor setup failures as applicable. See #183 for the launch and production-release gates. Do not deploy without separate authorization.

After remediation, run the monitor again and close this issue only when the failure is resolved. Further scheduled failures will reuse this open alert; closing it while failures persist allows a new alert to be created.`,
  });
  return data;
}

module.exports = { escalate };
