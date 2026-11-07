# Two Free Azure Static Web Apps

Cyrus approved two Free apps to serve all four hostnames directly, without
cross-host redirects. This is the approved configuration; verify live DNS, TLS,
and response behavior independently before claiming operational success.

| App                 | Hostnames                  | Azure hostname                             |
| ------------------- | -------------------------- | ------------------------------------------ |
| swa-jamula-web-prod | jamula.net, www.jamula.net | ashy-beach-033c7d01e.7.azurestaticapps.net |
| swa-jamula-com-prod | jamula.com, www.jamula.com | red-cliff-0ee064a1e.2.azurestaticapps.net  |

The production workflow builds one artifact and deploys it to both apps. Pull request previews remain on the original .net app only. Deployment jobs use the `swa-deployment` GitHub environment, restricted to the `main` branch. The .net token is environment secret `SWA_NET_DEPLOYMENT_TOKEN`; the .com token is `SWA_COM_DEPLOYMENT_TOKEN`. Never commit their values.

PR builds in `azure-static-web-apps.yml` do not deploy or consume deployment secrets, including for Dependabot. Production jobs require a `workflow_dispatch` event on `refs/heads/main`, latest-main SHA checks, and the main-only deployment environment; pushes do not deploy; a PR cannot unlock that environment by editing a job condition. `azure-static-web-apps-preview.yml` runs from the default branch after a successful build and uses the same restricted environment. It resolves the current same-repository PR, checks the workflow identity and head SHA, verifies the artifact's GitHub SHA-256 digest, rejects unsafe archive entries, and requires `staticwebapp.config.json` to match the trusted default branch. It never installs dependencies or executes PR scripts. A trusted PR event passed to the pinned Azure action selects the numbered PR environment; the returned URL must match that environment before live verification. Closed PRs and PRs with no remaining deployable changes remove their previews through this same trusted workflow.

## Release operations

Only an authorized operator should dispatch the workflow on current `main`:

```sh
gh workflow run azure-static-web-apps.yml --ref main --repo Jamula/Jamula-www-Website
# For a non-default increment, add -f bump=minor or -f bump=major.
```

The first release is `v0.1.0` regardless of bump choice; later releases
increment the highest published stable `vMAJOR.MINOR.PATCH` tag (patch by
default). Published GitHub releases and matching tags are the durable release
history. `www/package.json` and its lockfile stay at the development baseline,
not the latest release version; no bot pushes to protected main. Malformed,
orphaned, draft, prerelease, duplicate, or pre-baseline version history fails
closed and requires investigation. Non-version tags are ignored. Releasing the
same SHA as the latest release is rejected.

The event SHA must still be current main at selection, before each deployment,
and before publication. One build of that SHA produces an immutable artifact,
including `release.json` with version, revision, run ID and build attempt.
Both apps deploy that artifact and verify this identity and the existing live
security/configuration checks. Publication rechecks both live identities and
history, atomically creates the tag at the selected SHA, then creates the GitHub
Release only after both deployment jobs succeed. Runs share the production
concurrency group; GitHub may replace a pending run, so check the specific run
status rather than treating dispatch as success. Non-main dispatches fail.

The repository must allow the workflow's `GITHUB_TOKEN` contents-write
permission to create tags and releases; the write grant is limited to the
publication job. Configure tag rules to reserve release tags for the authorized
release process without blocking that token, and maintain the existing branch
and environment protections. Verify actual settings and secrets; this document
is not evidence that they are configured. Other release writers and Azure
operators must be coordinated with this pipeline: its concurrency group cannot
serialize external changes. Main checks are point-in-time, not a transaction
locking the branch; avoid merging during release and inspect the run if main
moves. A move during publication can leave a published release with a failed
run; inspect the tag, release and live metadata before any recovery.

Azure deployments to the two apps are not atomic. A failure may leave one app
updated and the other unchanged, even though no release is published. Inspect
both jobs, both live `/release.json` files and all four hostnames. Fix the
cause and rerun failed jobs only while the original SHA is still current and
history is unchanged; publication rechecks both identities. Alternatively,
dispatch a new release on current main after reviewing the partial state. If
publication created a tag but failed to create the GitHub Release, history
intentionally blocks retries: an authorized maintainer must investigate the tag,
its SHA, deployments and any release first, and reconcile the orphaned tag
under repository protections before retrying. Never infer success from a dispatch
or a single HTTP 200; inspect both deployments and the published release. A
failed release does not automatically roll back either app.

Cyrus selected this existing-app boundary for issue #32: no new preview app.
`SWA_NET_DEPLOYMENT_TOKEN` remains app-scoped, not preview-only. The protection
is the main-only GitHub environment, default-branch workflow, and
static-artifact boundary, not a narrower Azure token. A separate preview app is
required if preview-only credentials become mandatory. Missing secrets fail
explicitly rather than turning deployment failures into passing checks.
Configuration changes need to reach the default branch before they can be
previewed. Issue #32 is now closed; that closure does not independently prove
the current GitHub secret configuration or successful end-to-end live preview
and cleanup behavior.

**Required secret configuration:** `swa-deployment` must allow only `main`.
The .net and .com tokens belong in environment secrets
`SWA_NET_DEPLOYMENT_TOKEN` and `SWA_COM_DEPLOYMENT_TOKEN`. Remove any
repository-level copies of
`AZURE_STATIC_WEB_APPS_API_TOKEN_SWA_JAMULA_WEB_PROD` and
`AZURE_STATIC_WEB_APPS_API_TOKEN_SWA_JAMULA_COM_PROD`; repository-level copies
can be available to same-repository PR workflows even when the YAML does not
reference them. Use only environment secrets, never repository copies of the
new names. A workflow condition alone is not a credential boundary. This
document records the required configuration, not the current secret state;
verify repository settings before asserting migration completion.

Validate the boundary with `node --test .github/scripts/swa-preview.test.cjs`
and `python -m unittest discover -s scripts -p test_preview_artifact.py`.
These tests do not establish live deployment or cleanup behavior. For that,
inspect successful Actions runs for the exact default-branch workflow revision
and verify the numbered preview URL, noindex/security headers, artifact digest,
and cleanup. This configuration does not promote a preview, alter DNS, or
authorize a merge.

Leave the Azure default-domain redirect unset on both apps. HTTP should redirect to HTTPS on the same hostname. Azure provisions and renews certificates after custom-domain validation. Keep existing jamula.net canonical HTML tags for search indexing; these do not redirect visitors.

Microsoft 365 remains the authoritative DNS host. Preserve nameservers, MX,
SPF, DKIM, autodiscover, and other mail/service records. Add only Azure
ownership TXT and web A/CNAME records. Retrieve the current `.com` app's
`stableInboundIP` property from the exact Azure resource before changing any
apex A record; do not copy an old value from planning documents. Use the
generated hostname for the www CNAME. An apex A record serves a single Azure
region rather than providing alias-based global distribution.

Verify all four HTTPS URLs return 200 without cross-host redirects, valid TLS certificates, and matching site content. Verify each HTTP URL redirects to the same hostname over HTTPS. Recheck MX/SPF/DKIM after DNS changes.

Recovery requires an explicitly authorized release of a corrective change on main to both apps; there is no automated rollback or preview promotion. Do not remove apps, change DNS, or restore deployment tokens as repository secrets as part of routine release recovery.
