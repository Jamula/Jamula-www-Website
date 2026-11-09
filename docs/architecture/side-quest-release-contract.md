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

## Release identities

Each independently versioned component must publish an immutable artifact and
a machine-readable descriptor. The descriptor identifies the component and
its immutable component artifact version, source revision, artifact digest,
build run, contract dependencies, configuration schema, and health-check
contract. The component version identifies that component artifact; it is not
the website's release tag or website release version tracked separately by
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
  "contracts": {
    "content": ">=1.0.0 <2.0.0",
    "identityPolicy": ">=1.0.0 <2.0.0"
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
or unsupported schema version, missing required field, or unknown field fails
closed before activation.

`version` uses `MAJOR.MINOR.PATCH` with non-negative decimal integers and no
leading zeroes (except `0`); production descriptors do not use prerelease or
build-metadata suffixes. A component version is never reused for different
artifact bytes. The `sha256` field is the lowercase 64-hex digest of the exact
artifact. A consumer must resolve the exact artifact digest and verify the
source revision and contract versions before activation. A tag, mutable
download URL, branch name, or successful build alone is not artifact identity.
Configuration references may identify a secret by name and version, but may
not embed its value.

Compatibility values use the same `MAJOR.MINOR.PATCH` form. A declared
compatibility expression is either one exact comparator, such as `=1.2.3`, or
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
4. The artifact digest, source revision, test evidence, and intended target are
   recorded together.
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
included component to an exact version, source revision, and artifact digest.
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
      "contracts": {
        "content": ">=1.0.0 <2.0.0"
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
      }
    }
  ]
}
```

`schemaVersion` is a required integer and must be `1`. All shown fields are
required and non-null; `components` must contain at least one uniquely named
component, and `recoverySet` must pin the complete previously validated
compatible set. Unknown fields are rejected, and a missing, malformed, or
unsupported schema version fails closed. A future schema is usable only after
the release path explicitly supports it.

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
version, source revision, and digest; every required health check passes; and
the complete active set satisfies the declared compatibility contract. A
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

Independent and collective releases for the same target and active set share
one logical exclusive release lease. Every mechanism that can change that
active set must honor the same lease, fencing-token, and generation protocol.
The lease serializes the whole activation and active-set update; a release
must not bypass it by using a different workflow or by labelling itself
independent or collective. Lease acquisition is followed by reading the
active-set generation (a monotonically changing
version of the active set). The release validates its pins and compatibility
against that generation while holding the lease. The lease must remain valid
through activation and the final active-set update; if it expires, the
operation stops and reacquires the lease before continuing.

Every lease holder receives a monotonically increasing fencing token. The
activation boundary must reject writes from an expired holder or any holder
with a token older than the newest issued token. Immediately before activation
and again before recording the new active set, the release path revalidates
that the lease and fencing token are current, the active-set generation has
not changed, and all pinned artifacts remain compatible with the exact set
that will be active. The active-set update must be conditional on the
generation it validated. If the generation changed, the release must not
activate using stale validation: it stops, reloads the active set, and repeats
validation under a current lease. These are contract requirements, not a
selection of a particular lock service, deployment topology, or atomic
deployment implementation.

Before activation, the release path must verify:

- The descriptor schema is supported and required fields are present.
- The manifest schema is supported, required fields are present, and unknown
  fields or unsupported compatibility syntax are rejected.
- The source revision and artifact digest match the reviewed release record.
- No version or digest is duplicated or ambiguously resolved.
- Every producer-consumer contract version satisfies the consumer's declared
  compatibility expression for the proposed active set.
- Required configuration schema and secret references are available without
  exposing secret values.
- The component's authorization, health, and rollback checks are defined for
  its target.
- The release holds the current exclusive lease and fencing token, and the
  active-set generation is unchanged at both activation and active-set commit.

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
success criteria. A manifest remains `in_progress` while any required
component is unresolved, unhealthy, or not at its exact pin. This rule also
applies to an independent release, whose single component is its complete set
of pins. The record includes the immutable artifact digest and sanitized
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
4. If the active-set generation changed, compatibility is uncertain, or health
   cannot be restored, stop the stale activation and use an authorized
   recovery release that pins every artifact in a previously validated
   compatible set. Do not assume rollback is atomic or that a prior mutable
   tag still points to the same bytes.
5. Verify that every artifact pinned by the recovery manifest—not merely one
   healthy component—is active at its exact pin, all required health checks
   pass, and the complete active set is compatible. Record recovery of the
   failed attempted deployment as `recovered`, not success. A recovery release
   is successful only under the same all-pinned-artifacts rule as any other
   deployment. Verify every affected route and identity boundary before
   closing the incident record.

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
- One-component release with unaffected components remaining unchanged.
- A collective manifest with multiple pinned artifacts and a compatibility
  failure before activation.
- Partial failure after one component is healthy, visible status retention,
  safe retry behavior, stale lease fencing, active-set generation changes,
  and recovery to a previously validated compatible set without recording
  the attempted deployment as successful.
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
