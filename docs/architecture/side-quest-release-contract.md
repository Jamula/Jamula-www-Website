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
version, source revision, artifact digest, build run, contract dependencies,
configuration schema, and health-check contract. Secrets and secret values
must never be included.

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
    "content": "1.x",
    "identityPolicy": "1.x"
  },
  "configurationSchema": "1",
  "healthCheck": "/health/ready"
}
```

The descriptor is a proposed shape, not a file already emitted by the current
workflows. A consumer must resolve the exact artifact digest and verify the
source revision and contract versions before activation. A tag, mutable
download URL, branch name, or successful build alone is not artifact identity.
Configuration references may identify a secret by name and version, but may
not embed its value.

## Default independent release

The default release unit is one component. A release changes that component's
immutable artifact and descriptor only after:

1. The source revision is reviewed and merged to protected `main`.
2. Its focused behavior, security, accessibility, and performance checks pass.
3. Its declared contracts are compatible with every currently active consumer.
4. The artifact digest, source revision, test evidence, and intended target are
   recorded together.
5. The authorized release path confirms the target is eligible and the current
   active set remains compatible.

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
It also records the reason, required deployment order, compatibility ranges,
configuration schema versions, expected health checks, and the previously
active compatible set used for recovery.

The manifest is an explicit exception to the one-component default; it does not
relabel several independent releases as one mutable version. A partial rollout
must remain visible as a partially applied manifest. It must not be reported
as fully successful until every pinned component passes its health checks and
the complete active set satisfies the declared compatibility contract.

No automatic promotion across preview and production is allowed. A collective
manifest does not bypass protected `main`, review, authorization, privacy,
security, or cost gates.

## Compatibility and activation

Each component declares the versions of its consumed APIs, content schemas,
identity policy, and shared configuration that it supports. Compatibility is
checked against the exact active set, not just the latest published version.
The release record captures the validator and contract versions used for that
decision.

Before activation, the release path must verify:

- The descriptor schema is supported and required fields are present.
- The source revision and artifact digest match the reviewed release record.
- No version or digest is duplicated or ambiguously resolved.
- All producer-consumer contract ranges intersect for the proposed active set.
- Required configuration schema and secret references are available without
  exposing secret values.
- The component's authorization, health, and rollback checks are defined for
  its target.

Unknown, missing, or contradictory compatibility data fails closed. A model or
MCP tool version is not a substitute for user authorization or content access
policy. A release cannot weaken authorization by changing only a descriptor.

## Partial failure, retry, and recovery

Independent releases and collective releases record per-component states:
`planned`, `validated`, `activating`, `healthy`, `failed`, or `recovered`.
The manifest-level state remains `partial` while any component is not healthy
or recovered. The record includes the immutable artifact digest and sanitized
failure reason; it excludes credentials, prompts, private content, and
unnecessary identities.

On failure:

1. Stop further ordered activation when a required dependency or health check
   fails.
2. Preserve the observed per-component state; never convert a timeout or lost
   response into success.
3. Determine whether the exact artifact is active before retrying. Retry only
   an idempotent operation against the same verified artifact and unchanged
   compatibility set.
4. If the set is incompatible or health cannot be restored, use an authorized
   recovery release that pins a previously validated compatible set. Do not
   assume rollback is atomic or that a prior mutable tag still points to the
   same bytes.
5. Verify the recovered set and every affected route, identity boundary, and
   health check before closing the incident record.

Recovery must not promote a PR preview, rewrite a published version, expose
private content, or perform an unapproved DNS change. Where the platform cannot
restore the prior compatible set safely, keep the affected feature unavailable
and escalate rather than claiming recovery.

## Required acceptance evidence

Before this contract can govern a live release, tests and operational evidence
must demonstrate:

- Descriptor schema validation, digest mismatch rejection, unknown fields, and
  missing identity fields.
- One-component release with unaffected components remaining unchanged.
- A collective manifest with multiple pinned artifacts and a compatibility
  failure before activation.
- Partial failure after one component is healthy, visible status retention,
  safe retry behavior, and recovery to a previously validated compatible set.
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
