# Two Free Azure Static Web Apps

Cyrus approved two Free apps to serve all four hostnames directly, without
cross-host redirects. This is the approved configuration; verify live DNS, TLS,
and response behavior independently before claiming operational success.

| App                 | Hostnames                  | Azure hostname                             |
| ------------------- | -------------------------- | ------------------------------------------ |
| swa-jamula-web-prod | jamula.net, www.jamula.net | ashy-beach-033c7d01e.7.azurestaticapps.net |
| swa-jamula-com-prod | jamula.com, www.jamula.com | red-cliff-0ee064a1e.2.azurestaticapps.net  |

The production workflow builds one artifact and deploys it to both apps. Pull request previews remain on the original .net app only. Deployment jobs use the `swa-deployment` GitHub environment, restricted to the `main` branch. The .net token is environment secret `SWA_NET_DEPLOYMENT_TOKEN`; the .com token is `SWA_COM_DEPLOYMENT_TOKEN`. Never commit their values.

PR builds in `azure-static-web-apps.yml` do not deploy or consume deployment secrets, including for Dependabot. Production jobs in that workflow require both a `push` event and the main-only deployment environment; a PR cannot unlock that environment by editing a job condition. `azure-static-web-apps-preview.yml` runs from the default branch after a successful build and uses the same restricted environment. It resolves the current same-repository PR, checks the workflow identity and head SHA, verifies the artifact's GitHub SHA-256 digest, rejects unsafe archive entries, and requires `staticwebapp.config.json` to match the trusted default branch. It never installs dependencies or executes PR scripts. A trusted PR event passed to the pinned Azure action selects the numbered PR environment; the returned URL must match that environment before live verification. Closed PRs and PRs with no remaining deployable changes remove their previews through this same trusted workflow.

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

Rollback: revert the companion deployment job to stop updates to the second app; retain the original .net app and the main-only secret boundary. Remove only the explicitly added .com web records if undoing .com hosting. Remove the new app and its deployment secret only after deciding to retire it. Do not reset the entire DNS zone or restore deployment tokens as repository secrets.
