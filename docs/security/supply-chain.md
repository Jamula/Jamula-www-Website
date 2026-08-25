# Software Supply-Chain and CI/CD Requirements

**Status:** Proposed controls and future tests; no SLSA level, SBOM completeness, provenance, or production pipeline is claimed

**Context:** Refs #3; child #7

**Owner:** Quality & Reliability Engineering

**Required review:** Platform, Security, Legal/licensing, Fact Checker; Cyrus approves release and risk gates

**Reviewed sources through:** 2026-08-24

## Evidence boundary and objectives

This document contains `documented research` and `future implementation test` requirements. A workflow file, scanner badge, generated SBOM, signature or vendor statement is not proof of end-to-end integrity. Release evidence must bind reviewed source, isolated build, dependencies, artifact digest, SBOM, provenance, approvals and the exact deployment.

Objectives:

1. Only reviewed, protected `main` source can produce a production release.
2. Untrusted pull-request code cannot obtain production secrets, write privileges or privileged caches.
3. Builds resolve approved, locked inputs from expected namespaces and produce an inventoried immutable artifact.
4. The deployed digest is the verified digest that passed release gates; environments do not rebuild it.
5. A compromised dependency/action/credential/artifact can be identified, blocked, revoked and rolled back.

## Pinned framework targets

| Framework/format | Pin / target | Decision |
|---|---|---|
| NIST SSDF | **SP 800-218 v1.1, February 2022** | Process baseline for Prepare the Organization, Protect Software, Produce Well-Secured Software and Respond to Vulnerabilities |
| SLSA | **v1.2** | Proposed initial target: Build Track **L2** provenance for releasable artifacts; evaluate an L3-capable hardened builder before Phase 3. No level is claimed until all requirements and verification pass. |
| SBOM | **CycloneDX 1.7 JSON** | Proposed canonical release SBOM because the official model covers components, dependencies, services, vulnerabilities and formulation. Tool support/licensing and completeness require a finalist spike. If blocked, record `needs investigation`; do not silently downgrade or claim completeness. |
| ASVS | **5.0.0** | `v5.0.0-15.2.4` anchors expected repository/transitive-dependency and dependency-confusion verification |
| OWASP Web Top 10 | **2025** | A03 Software Supply Chain Failures and A08 Software or Data Integrity Failures awareness crosswalk |

Pins are verified 2026-08-24 and rechecked before implementation. Adoption is not certification.

## Main-only release flow

1. **Change:** short-lived issue branch/worktree; no production deployment. Required reviews and status checks run on the PR.
2. **Untrusted validation:** use a read-only token and no production/environment secrets. Avoid privileged `pull_request_target` or equivalent with checkout/execution of PR-controlled content.
3. **Integrate:** protected `main` is the sole persistent integration and production CI/CD source. Require review, passing checks, no force push/direct bypass and verified commit identity according to the approved repository policy.
4. **Build once:** isolated ephemeral runner checks out the exact protected `main` commit, restores only verified non-privileged cache content, installs from lockfile, builds/tests and emits immutable artifact, SBOM and provenance.
5. **Verify:** independently verify artifact digest, provenance subject/source/workflow/builder, SBOM schema/completeness, policy results and release approvals. Fail closed.
6. **Promote:** protected production environment uses OIDC/federated short-lived identity and deploys the already verified digest; it does not rebuild source. Approval is bound to exact PR head/release artifact SHA.
7. **Record:** store release manifest, dependency/action/tool versions, SBOM, provenance, test summary, approvals, deployment target/time/actor and rollback digest.
8. **Rollback:** promote a previously verified compatible artifact or forward-fix through `main`; never deploy an ad hoc workstation build.

Documentation-only changes must not trigger production deployment. Preview environments are isolated, synthetic/no-production-data by default, have no production credentials, expire automatically and cannot be promoted as production artifacts unless rebuilt from protected `main`.

## Required controls

| ID | Requirement | Future executable gate |
|---|---|---|
| SC-01 Repository protection | Branch rules, least privilege, CODEOWNERS/review for workflows/security/dependency files, verified required checks and auditable bypass | Attempt direct/force push, self-approval, required-check bypass and unreviewed workflow change; all fail or create an approved emergency record |
| SC-02 Workflow permissions | Top-level default read-only; job grants only required permissions; production OIDC scoped to repository/ref/workflow/environment/audience | Policy test rejects wildcard/write grants and long-lived cloud secret; wrong branch/workflow/audience cannot obtain role |
| SC-03 Untrusted input | PR/fork code never runs with privileged token/secrets or shares privileged mutable cache | Malicious PR attempts context/script injection, secret read, cache poison and artifact overwrite; no access/effect |
| SC-04 Immutable actions/tools | Third-party actions/build images/tools are allowlisted, license/provenance reviewed and pinned to full immutable commit/digest with monitored update path | Static policy rejects tags/branches/unapproved sources; resolved SHA/digest matches inventory |
| SC-05 Dependency resolution | Lockfiles mandatory; frozen install; expected registries/namespaces; no dependency confusion; scripts/network minimized | Clean-room install rejects lock drift, unknown registry, shadowed private package and undeclared dependency |
| SC-06 Dependency change review | Automated update PRs are reviewed; manifest/lockfile diff, license, maintainer/provenance, vulnerability and transitive changes visible | Fixture update produces review report; suspicious ownership/namespace/script/new binary blocks |
| SC-07 Isolated reproducible build | Ephemeral clean runner, controlled network, no workstation state; deterministic where feasible; timestamps/randomness documented | Two clean builds compare exact digest or approved normalized diff; unexplained difference fails |
| SC-08 Secret prevention | Pre-commit/PR/history/artifact/log scanning; synthetic canaries; immediate revoke/rotate process | Seed approved fake patterns/transforms; scanner blocks before merge/release and response exercise meets SLO |
| SC-09 Code/security analysis | Stack-appropriate lint/unit/integration, SAST, dependency, IaC/container, license/notice and malicious-package checks | Known safe test fixtures are detected; scanner failure is visible and blocks according to severity policy |
| SC-10 SBOM | CycloneDX 1.7 JSON per artifact, direct/transitive build/runtime components, versions, hashes, licenses/suppliers where available and completeness declaration | Schema validates; graph reconciles to lock/build image/artifact scan; missing direct/runtime component fails; SBOM digest binds to artifact |
| SC-11 Provenance/attestation | Signed/identity-bound SLSA v1.2 provenance from build service with source commit, builder, workflow/materials and artifact subject digest | Independent verifier rejects changed artifact, source, workflow or issuer; accepted policy is recorded |
| SC-12 Artifact integrity | Immutable repository/registry, digest addressing, retention and restricted delete; deployment verifies before use | Tag substitution and corrupted download are rejected; unauthorized delete/overwrite fails and alerts |
| SC-13 Environment protection | Separate preview/test/production identities/data; required production approval; concurrency/rollback controls | Non-main and unapproved actor cannot deploy; concurrent stale release cannot overwrite newer approved release |
| SC-14 Release manifest | Exact source SHA, artifact/SBOM/provenance digests, checks, risks, approvals, target and rollback captured | Deployment missing any binding is denied; record supports trace from runtime digest to reviewed source |
| SC-15 Vulnerability response | Inventory supports impact search; severity/exploitability/exposure triage; patch/mitigation/rollback and disclosure ownership | Tabletop finds all affected releases/tenants from component; emergency update follows protected, reviewable path |
| SC-16 Credential revocation | Inventory workflow, signing, registry and cloud credentials; rotate/revoke without losing trusted history | Semiannual compromise drill revokes credential, blocks old identity, rebuilds/attests and validates unaffected artifacts |
| SC-17 Build/runner hardening | Current ephemeral images; no persistence; egress and artifact upload constrained; runner logs redacted | Persistence/metadata/egress attempts fail; runner destroyed; secret canary absent from log/artifact |
| SC-18 Vendor/source continuity | Critical source/build/registry export, mirror/escrow decision, outage mode and ownership documented | Annual outage/exit exercise rebuilds or produces a blocked packet with cost, owner and phase impact |

## SBOM and vulnerability policy

The SBOM travels with the artifact and is itself hashed/attested. It identifies the application, build image/runtime base, direct/transitive packages, bundled client code and relevant generated assets. Services and SaaS that cannot appear as software components remain in the architecture/subprocessor inventory.

Before release:

- Block known exploited or critical vulnerabilities with a credible reachable path unless remediated. High findings require exposure/exploitability review and no unresolved High release risk.
- A scanner's absence from its database is not evidence of safety. Record database timestamp, ecosystem coverage and unsupported components.
- False positives require component/version/path evidence and expiry; suppression is reviewed and scoped, never global.
- Generate VEX only when the selected format/tool and review policy are approved; `not affected` needs technical justification and expiry.
- License and notice checks support, but do not replace, Sarek/qualified legal review. Unknown/incompatible licensing blocks distribution.
- On new high-impact advisory, triage inventory within 4 hours for Critical/known exploited and 1 business day for High; containment/patch SLO is set by exposure and incident severity, not CVSS alone.

## Dependency and action intake

New or materially changed component/action review records purpose, owner, exact source/version/SHA/digest, publisher/maintainer, transitive graph, install scripts/binaries/network behavior, release/signing/provenance, vulnerability history, update cadence, license/notices, alternatives, data/secret access, cost, exit path and approval. Prefer standard-library or existing approved capability when it materially reduces risk and maintenance.

Private package names are reserved in every consulted public registry or resolution is configured so public fallback is impossible. Namespace and registry rules are tested, not assumed. Package manager lifecycle scripts are disabled by default where feasible and explicitly reviewed where required.

## Emergency changes

An emergency does not permit workstation-to-production deployment. Use the smallest reviewed change through protected `main`, independent approver, full artifact/SBOM/provenance binding and staged rollback. If a narrowly time-bounded branch-protection bypass is unavoidable, executive and security approval, reason, exact actor/time/scope, compensating checks, alert and post-event review are mandatory. Restore protection immediately and rotate exposed credentials. Missing evidence remains a risk, not proof.

## Exercises, measures, and gates

| Exercise/measure | Cadence | Pass condition |
|---|---:|---|
| Malicious PR/workflow/cache scenario | Before Phase 1; semiannual | No secret/write/environment access; privileged cache/artifact unchanged |
| Dependency confusion and compromised update | Before Phase 1; quarterly | Resolution stays approved; suspicious update blocks with actionable evidence |
| Artifact/SBOM/provenance tamper | Every RC | Independent verifier rejects any changed subject/source/material |
| CI/cloud credential compromise | Semiannual | Credential revoked within SEV-0/1 SLO; old identity fails; trusted rebuild and rollback work |
| Vulnerable-component impact search | Quarterly | All affected release digests found within 30 minutes; owner/action recorded |
| Clean rebuild/vendor outage | Quarterly/annual | Approved artifact rebuilt from protected source or formal blocked packet |

Phase 1 requires SC-01 through SC-18 as applicable, with no open Critical/High. Later phases add stricter CODEOWNER review for identity/tenant/connector/AI/payment policy and an L3-capable builder evaluation before Phase 3. Any control unavailable on a turnkey platform is a scored platform risk, not silently omitted.

Risk acceptance follows `control-test-matrix.md`: exact control/artifact, evidence/counterevidence, exposure, compensation, owner, remediation and maximum 90-day expiry, approved by Cyrus plus Platform/Security. Critical/High supply-chain release risk is not acceptable.

## Official sources

Verified 2026-08-24:

- NIST, **SP 800-218, Secure Software Development Framework (SSDF) Version 1.1**, February 2022: <https://csrc.nist.gov/pubs/sp/800/218/final>.
- SLSA, **Specification v1.2**, build/source tracks and provenance: <https://slsa.dev/spec/v1.2/>.
- CycloneDX, **Specification overview**, including versioned media type for 1.7 and component/dependency/formulation model: <https://cyclonedx.org/specification/overview/>.
- GitHub Docs, **Secure use reference**, least-privilege tokens and risks of privileged workflows with untrusted code: <https://docs.github.com/en/actions/reference/security/secure-use>.
- GitHub Docs, **Using artifact attestations**, build provenance and SBOM attestations: <https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations>.
- OWASP, **ASVS 5.0.0**: <https://github.com/OWASP/ASVS/tree/v5.0.0>.
- OWASP, **Top 10:2025**: <https://owasp.org/Top10/2025/>.

Tool examples in official documentation may use mutable action tags. Jamula's proposed policy requires review and full immutable commit/digest pinning; no example is copied as an approved configuration.
