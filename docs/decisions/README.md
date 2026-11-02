# Proposed Architecture Decisions

## Decision state

The August 2026 ADR set is a historical proposal package. Its pending review,
issue, PR, and exact-SHA workflow is not current: PR #10 merged. The repository
now contains a static Astro site and two-Azure-Static-Web-Apps deployment
configuration; see [the current deployment record](../architecture/two-free-static-apps.md).
The historical ADRs are not a live implementation inventory or authority to
migrate the site.

No ADR in this set records approval of its proposed durable architecture.
Blazor/build-time HTML articles have been discussed as a future direction, not
implemented or authorized. The prior platform arithmetic remains withdrawn;
dated market and cost findings below are not current quotes or a current
comparison.

[`RWL-2026-08-25.3`](../cost/reference-workloads.md) is the proposed controlling
workload dictionary. It is not approved, forecast evidence, a vendor bill, or a
capacity promise.

## Proposed ADRs

| ADR | Scope | Current disposition |
|---|---|---|
| [ADR-001](adr-001-rendering-and-content.md) | Rendering and content | Current runtime is Astro; historical proposal for a durable framework/CMS decision |
| [ADR-002](adr-002-hosting-dns-email-cicd.md) | Hosting, DNS, email and CI/CD | Current two-SWA topology is documented separately; broader proposed controls are not all verified |
| [ADR-003](adr-003-customer-platform-phases.md) | Customer-platform phases | Proposed boundaries; no CRM/scheduler/identity/connector/AI/payment vendor selected |
| [ADR-004](adr-004-privacy-security-reliability.md) | Privacy, security and reliability | Proposed controls; professional gates and future tests pending |
| [ADR-005](adr-005-cost-portability-and-lock-in.md) | Cost, portability and lock-in | Proposed method using RWL .3; no score or TCO decision |
| [ADR-006](adr-006-repository-content-and-legal-gates.md) | Repository, content and legal gates | Proposed controls; no public/founder/legal approval |

## Acceptance rule

Acceptance requires:

1. final independent Fact Checker/Work monitor and Responsible AI reviewer re-reviews of the exact revision;
2. required domain and qualified-professional dispositions;
3. committed per-artifact Git blob OIDs and the full PR head commit SHA;
4. issue comments and explicit child closure against that head;
5. a draft PR retaining all unresolved gates; and
6. Cyrus approval of the exact head.

See the [approval register](approvals.md). A raw filesystem SHA-256 is not a
portable approval identifier, and a later material commit invalidates prior
approval.
