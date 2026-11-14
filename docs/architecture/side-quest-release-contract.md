# Side-Quest Component Release Contract

**Status:** Proposal for #111; not an approved hosting topology or live deployment design
**Scope:** Version identity, compatibility, independent releases, collective
manifests, and partial-failure recovery for future side-quest components

This contract defines release semantics only. It does not claim that the
current website host can route independently deployed components, that public
TLS endpoints exist for them, or that a production release mechanism has been
implemented. Hosting, routing, identity, inference, and operational entitlement
remain separate feasibility and approval gates. No new paid service, automatic
billable overflow, or provider-specific deployment mechanism is authorized by
this proposal.

The offline [artifact/process experiment](../../scripts/spikes/sidequest-artifacts/README.md)
exercises one-section publishing by default and an explicit all-sections local
demonstration. Its separately built versioned directories and byte snapshots
are mechanism evidence only; they do **not** implement this production contract's
descriptors, reviewed-source binding, compatibility/fencing or authorized release
controls. Independent Data review is still required.

## Release identities

Each independently versioned component must publish an immutable artifact and
a machine-readable descriptor. The descriptor identifies the component and
its immutable component artifact version, source revision, artifact digest,
build run, provided and consumed contracts, configuration schema, and
health-check contract. The release record pins the digest of the exact
descriptor alongside the artifact digest. The reviewed build evidence must
bind that descriptor digest to the artifact digest and source revision; an
unbound or mismatched descriptor fails closed. The component version identifies
that component artifact; it is not the website's release tag or website release version tracked separately by
issue #104. A website tag does not identify, retag, or make mutable a
component artifact. The exact artifact bytes are identified by their digest.
Secrets and secret values must never be included.

```json
{
  "schemaVersion": 1,
  "component": "example-section",
  "version": "0.1.0",
  "sourceRevision": "<full-git-sha>",
  "artifact": {
    "name": "example-section-0.1.0",
    "sha256": "<64-lowercase-hex>"
  },
  "build": {
    "workflow": "<trusted-workflow-id>",
    "runId": "<immutable-run-id>"
  },
  "provides": {
    "section-api": "1.0.0"
  },
  "contracts": {
    "content": {
      "producer": "content-service",
      "range": ">=1.0.0 <2.0.0"
    }
  },
  "configurationSchema": "1",
  "healthCheck": "/health/ready"
}
```

The descriptor is a proposed shape, not a file already emitted by the current
workflows. `schemaVersion` is required and must be the integer `1` for this
contract. For schema version 1, all example fields above are required and
non-null; unknown fields are rejected rather than silently ignored. A future
schema must use an explicitly supported schema version. An absent, malformed,
or unsupported schema version, missing required field, unknown field, or
duplicate JSON object key fails closed before activation.

`version` uses `MAJOR.MINOR.PATCH` with non-negative decimal integers and no
leading zeroes (except `0`); production descriptors do not use prerelease or
build-metadata suffixes. A component version is never reused for different
artifact or descriptor bytes. The `sha256` field is the lowercase 64-hex digest
of the exact artifact. A consumer must resolve the exact artifact digest and
verify the source revision and contract versions before activation. A tag,
mutable download URL, branch name, or successful build alone is not artifact identity.
Configuration references may identify a secret by name and version, but may
not embed its value.

`provides` maps each contract identifier to its exact produced version;
`contracts` maps each consumed contract identifier to a `producer` component
name and a compatibility `range`. Both maps are required, and may be empty
when the component provides or consumes no contracts respectively. Identifiers
and producer names are non-empty, case-sensitive strings. Each dependency
object requires exactly `producer` and `range`. A provided version uses the same
`MAJOR.MINOR.PATCH` format as the component version, but is independent of it.
Resolve the named producer uniquely in the proposed active set and read the
named contract's exact version from its verified, artifact-bound descriptor.
Missing or ambiguous producers, absent contract identifiers, or conflicting
descriptor bindings fail closed.

A declared compatibility expression is either one exact comparator, such as
`=1.2.3`, or
one lower-inclusive and upper-exclusive interval separated by exactly one
ASCII space, such as `>=1.2.0 <2.0.0`. Comparisons use numeric
major/minor/patch ordering. Wildcards, caret and tilde shorthand, commas,
disjunctions, prerelease versions, and other syntax are invalid and fail
closed. Every consumed contract must be declared using this syntax; a
producer's contract version must satisfy the consumer's expression.

## Default independent release

The default release unit is one component. A release changes that component's
immutable artifact and descriptor only after:

1. The source revision is reviewed and merged to protected `main`.
2. Its focused behavior, security, accessibility, and performance checks pass.
3. Its declared contracts are compatible with every currently active consumer.
4. The descriptor digest, artifact digest, source revision, test evidence, and
   intended target are recorded together.
5. The authorized release path confirms the target is eligible and the current
   active set remains compatible under the concurrency and fencing rules
   below.

Changing a shared contract does not silently convert the default into a
collective deployment. It requires consumer compatibility evidence and either
a backward-compatible staged change or an explicitly approved collective
manifest. Independent release does not mean that a route can be independently
served on the current host; that routing mechanism remains unproven.

Pull requests validate their proposed source and may use isolated previews.
Preview artifacts and URLs are not production inputs, are not promoted by DNS,
and must not receive production secrets. Production release input is the exact
reviewed `main` revision and its verified immutable artifact. Existing
workflow-specific protections still require live configuration verification;
this contract does not prove that repository, environment, or host settings
currently enforce them.

## Ad-hoc collective release

An operator may request a collective release for a specific compatibility or
recovery reason. It must use a reviewed, immutable manifest that pins every
included component to an exact version, source revision, artifact digest, and
descriptor digest.
The manifest has this required version 1 shape:

```json
{
  "schemaVersion": 1,
  "releaseId": "<immutable-manifest-id>",
  "target": "<release-target>",
  "reason": "<reviewed-purpose>",
  "components": [
    {
      "component": "example-section",
      "version": "0.1.0",
      "sourceRevision": "<full-git-sha>",
      "artifact": {
        "name": "example-section-0.1.0",
        "sha256": "<64-lowercase-hex>"
      },
      "descriptorSha256": "<64-lowercase-hex>",
      "provides": {
        "section-api": "1.0.0"
      },
      "contracts": {
        "content": {
          "producer": "content-service",
          "range": ">=1.0.0 <2.0.0"
        }
      },
      "configurationSchema": "1",
      "healthCheck": "/health/ready",
      "deploymentOrder": 1
    }
  ],
  "recoverySet": [
    {
      "component": "example-section",
      "version": "0.1.0",
      "sourceRevision": "<full-git-sha>",
      "artifact": {
        "name": "example-section-0.1.0",
        "sha256": "<64-lowercase-hex>"
      },
      "descriptorSha256": "<64-lowercase-hex>"
    }
  ]
}
```

`schemaVersion` is a required integer and must be `1`. All shown fields are
required and non-null; `components` must contain at least one uniquely named
component, and `recoverySet` must pin the complete previously validated
compatible set with unique component names. Each `descriptorSha256` is the
lowercase 64-hex digest of the exact descriptor bytes. Verify that digest and
the descriptor's artifact binding for each deployment and recovery pin; the
manifest's `provides`, `contracts`, configuration schema, and health check
must match the pinned descriptor. Unknown fields and duplicate JSON object keys
are rejected, and a missing, malformed, or unsupported schema version fails
closed. A future schema is usable only after
the release path explicitly supports it.
The illustrative manifest assumes `content-service` is already in the active
set with a compatible provided `content` contract; the placeholder pins are
not deployable evidence.

The manifest also records the reason, required deployment order, compatibility
expressions using the syntax above, configuration schema versions, expected
health checks, the intended target, and the previously active compatible set
used for recovery. The manifest's pins are immutable: changing any pin or
required field creates a new reviewed manifest, not an in-place edit.
Each component's `version` follows the descriptor version format, and
`deploymentOrder` is a positive integer unique within the manifest.

The manifest is an explicit exception to the one-component default; it does not
relabel several independent releases as one mutable version. A partial rollout
must remain visible as a partially applied manifest. A deployment is successful
only when every component pinned by its manifest is active at the exact pinned
version, source revision, artifact digest, and descriptor digest; every
required health check passes; and the complete active set satisfies the
declared compatibility contract. A
subset of healthy components, an unknown activation outcome, or a healthy but
incompatible active set is not success.

No automatic promotion across preview and production is allowed. A collective
manifest does not bypass protected `main`, review, authorization, privacy,
security, or cost gates.

## Compatibility and activation

Each component declares the versions of its consumed APIs, content schemas,
identity policy, and shared configuration that it supports. Compatibility is
checked against the exact active set, not just the latest published version.
The release record captures the validator and contract versions used for that
decision.

Independent and collective releases for the same target/environment share
one logical exclusive release lease and one monotonically increasing
fencing-token sequence. The lease key identifies only that stable
target/environment; it must not include the active-set generation, component,
manifest, workflow, or release-attempt identity. Changing the active set must
neither create a new lease namespace nor reset the fencing-token sequence.
Every mechanism that can change that target's active set must honor the same
lease, fencing-token, and generation protocol.
The lease serializes the whole activation and active-set update; a release
must not bypass it by using a different workflow or by labelling itself
independent or collective. Lease acquisition is followed by reading the
active-set generation (a monotonically changing
version of the active set). The release validates its pins and compatibility
against that generation while holding the lease. The lease must remain valid
through activation and the final active-set update; if it expires, the
operation stops. Reacquisition issues a newer token from the same sequence
and requires a fresh read, validation, and plan before any further write.

Every lease holder receives a monotonically increasing fencing token. The
activation boundary must reject writes from an expired holder or any holder
with a token older than the newest issued token. Immediately before activation
and again before recording the new active set, the release path revalidates
that the lease and fencing token are current, the observed state matches the
generation and component identities expected by its current plan, and all
pinned artifacts remain compatible with the exact set that will be active.
Generation is comparison data, never a lease key.
Each mutation, including the final active-set update, requires a fenced
compare-and-set against that expected state and current lease. The record
identifies the attempt and token responsible for each mutation and its
resulting state/generation. After its own successful mutation, the attempt
advances its expected state to that recorded result; it cannot continue using
its initial generation or attribute another attempt's writes to itself.

A pre-write mismatch requires stopping, reloading, revalidating, and replanning
under a current lease, or failing safely without a write. A generation change
alone does not authorize rollback of a valid concurrent release. If this
attempt has already mutated or activated artifacts, reconcile those owned
changes with the exact observed state before deciding whether compatible
completion is possible or authorized recovery is necessary. These are
contract requirements, not a selection of a particular lock service,
deployment topology, or atomic deployment implementation.

Before activation, the release path must verify:

- The descriptor schema is supported and required fields are present.
- The manifest schema is supported, required fields are present, and unknown
  fields or unsupported compatibility syntax are rejected.
- The source revision and descriptor and artifact digests match the reviewed
  release record and their verified binding.
- Component names are unique within each active, deployment, or recovery set.
  Each `(component, version)` resolves unambiguously to its immutable artifact
  and descriptor; conflicting bindings fail closed. Different components may
  use the same version or digest, and a deployment and recovery set may pin
  the same artifact.
- Every producer-consumer contract version satisfies the consumer's declared
  compatibility expression for the proposed active set.
- Required configuration schema and secret references are available without
  exposing secret values.
- The component's authorization, health, and rollback checks are defined for
  its target.
- The release holds the current target/environment lease and fencing token,
  and each activation and active-set commit uses a fenced compare-and-set
  against its validated expected state/generation.

Unknown, missing, or contradictory compatibility data fails closed. A model or
MCP tool version is not a substitute for user authorization or content access
policy. A release cannot weaken authorization by changing only a descriptor.

## Partial failure, retry, and recovery

Independent releases and collective releases record per-component states:
`planned`, `validated`, `activating`, `healthy`, `failed`, or `recovered`.
The release-attempt state is `planned`, `in_progress`, `succeeded`, `failed`,
`recovered`, or `cancelled`; only `succeeded` is a success terminal state.
`failed`, `recovered`, and `cancelled` are distinct non-success terminal
states. In particular, restoring a prior healthy set makes the attempted
deployment `recovered`, not `succeeded`; a separate recovery release may be
reported as successful only if it independently meets the all-pinned-artifacts
success criteria. A manifest remains `in_progress` while activation or
reconciliation is ongoing. An unresolved, unhealthy, or off-pin component
precludes `succeeded` but does not prevent a `failed`, `recovered`, or
`cancelled` terminal state when the attempt has stopped. This rule also applies
to an independent release, whose single component is its complete set of pins.
The record includes the immutable artifact digest and sanitized
failure reason; it excludes credentials, prompts, private content, and
unnecessary identities.

On failure:

1. Stop further ordered activation when a required dependency or health check
   fails.
2. Preserve the observed per-component state; never convert a timeout or lost
   response into success.
3. Determine whether the exact artifact is active before retrying. Retry only
   an idempotent operation against the same verified artifact and unchanged
   compatibility set, while holding a current lease and fencing token.
4. If the expected generation/state differs before this attempt has written,
   reload, revalidate, and replan under the current lease or fail safely
   without rollback. If this attempt has already mutated or activated
   artifacts, reconcile its mutation records with the observed state.
   Recovery is appropriate only when those owned changes cannot safely
   complete with compatible observed state. Use a separately authorized
   recovery release with exact artifact pins; do not assume rollback is
   atomic or that a prior mutable tag still points to the same bytes.
5. Verify that every artifact and descriptor pinned by the recovery
   manifest—not merely one healthy component—is active at its exact pin, all
   required health checks pass, and the complete active set is compatible.
   Record recovery of the failed attempted deployment as `recovered`, not
   success. A recovery release
   is successful only under the same all-pinned-artifacts rule as any other
   deployment. Verify every affected route and identity boundary before
   closing the incident record.

Recovery uses the same target/environment lease and fencing-token sequence as
ordinary releases. A stale or expired holder must never undo a successor's
writes, even if it was the original failing attempt. A recovery owner must
hold a current lease, establish ownership of the affected mutations from the
attempt records, and validate a recovery plan against the exact observed
state. An unknown activation outcome or unverified ownership requires
read-only reconciliation or escalation, not speculative rollback. Every
recovery write uses a fenced compare-and-set against the state
and ownership it validated. If a successor has changed an affected artifact,
the old recovery plan is invalid: stop and reload rather than overwrite it.
Reinstating the entire previous set is allowed only when the observed state
still matches the failed attempt's owned mutation plan and the complete
recovery set is compatible. If successor-owned changes must be included in
a repair, that requires a new reviewed, authorized release plan; it is not
rollback authority inherited from the failed attempt.

Recovery must not promote a PR preview, rewrite a published version, expose
private content, or perform an unapproved DNS change. Where the platform cannot
restore the prior compatible set safely, keep the affected feature unavailable
and escalate rather than claiming recovery.

## Required acceptance evidence

Before this contract can govern a live release, tests and operational evidence
must demonstrate:

- Descriptor schema validation, digest mismatch rejection, unknown fields, and
  missing identity fields.
- Manifest schema validation, unknown schema and field rejection, and exact
  compatibility-expression parsing.
- Artifact-bound descriptor verification, exact producer resolution, missing
  or ambiguous producer rejection, and provided-version compatibility checks
  for independent and collective releases.
- Shared versions or artifact digests across distinct components and pins
  repeated across deployment and recovery sets are accepted; conflicting
  bindings for the same `(component, version)` are rejected.
- One-component release with unaffected components remaining unchanged.
- A collective manifest with multiple pinned artifacts and a compatibility
  failure before activation.
- Partial failure after one component is healthy, visible status retention,
  safe retry behavior, stale lease fencing, active-set generation changes,
  and recovery to a previously validated compatible set without recording
  the attempted deployment as successful.
- Ongoing reconciliation stays `in_progress`; stopped unhealthy or off-pin
  attempts may be `failed` or `cancelled`, but never `succeeded`. A restored
  healthy recovery set permits `recovered` even when the attempted pins are
  no longer active.
- An independent attempt and a collective attempt for the same
  target/environment use the same lease key and token sequence across
  generation changes. For example, generation 10 with token 41 and generation
  11 with token 42 retain the same target lease key; token 41 cannot write or
  recover after token 42 is issued. These are synthetic test values, not
  observed runtime state.
- A pre-write generation mismatch reloads/revalidates/replans or fails without
  recovery writes; an owned partial activation can complete only after
  compatible-state reconciliation or enter authorized recovery.
- Recovery compare-and-set rejects a changed expected state or mutation
  ownership, including successor writes; reacquiring a lease does not confer
  authority to restore a stale recovery set.
- Stale source revision, mutable artifact reference, incompatible schema, and
  unavailable health or policy checks fail closed.
- Protected-main production provenance and PR-preview isolation, including no
  production secrets in previews.
- Accessibility, security, privacy, and performance gates for the exact
  artifact intended for activation.
- Cost caps, quota behavior, kill switch, and a verified no-billable-overflow
  degraded mode for any future service boundary.

Until those checks and the separate hosting, routing, identity, inference, and
cost gates are satisfied, this document remains a proposal. It approves no
provider, plan, public endpoint, production deployment, or paid service.
