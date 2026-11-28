# Current architecture and trust boundaries

**Status:** Current source topology and proposed future boundaries, as of 2026-11-28. This is not a deployment inventory, provider selection, or approval. See [current delivery roadmap](../roadmap/current-roadmap.md) for gates and [two free Static Web Apps](two-free-static-apps.md) for the approved site topology.

## Component and data flow

```mermaid
flowchart LR
  subgraph SOURCE["Protected GitHub main"]
    W["Astro static site"]
    T["Technical Markdown"]
    V["Validation and coverage"]
    M[".NET monitor and MBR"]
    C["Local MCP"]
    F["Offline accelerator foundations"]
    T --> W
    T --> C
    V --> W
    V --> C
    V --> F
  end
  W --> ART["Reviewed static release artifact"]
  ART --> NET["Azure SWA .net"]
  ART --> COM["Azure SWA .com"]
  NET --> VIS["Public visitors"]
  COM --> VIS
  M --> NET
  M --> COM
  C --> L["Loopback MCP client; caller model"]
  W -.-> G["GA4 only with consent and separate activation"]
  F -.-> CL["Future client-owned Entra and Aspire deployment"]
```

The site has no deployed server CMS or customer portal. The two-site hosting configuration is implemented in source; the latest monitor reported all four homepage origins returning 404. M03 is loopback-only, and the client accelerator lacks an integrated host and live authentication. The dashed paths are conditional or future.

## Publication boundary (proposed, #207)

```mermaid
flowchart TD
  D["Private drafts outside public repository"] --> REV["Editorial / claims / owner review"]
  REV --> MAN["Approved manifest and digest"]
  MAN --> BUILD["Fail-closed build validation"]
  BUILD --> P["Astro public pages and sitemap"]
  BUILD --> TXT["llms.txt and llms-full.txt"]
  BUILD --> MCP["Read-only public corpus"]
  REVOKE["Withdrawal or changed digest"] --> MAN
  MCP --> CALL["Caller-funded model"]
```

Today Astro and MCP load technical Markdown without a shared explicit approval manifest. Do not represent the diagram as an implemented security control. Never commit private content to this public repository.

## Preview versus production

```mermaid
flowchart TD
  PR["PR build: no deployment secrets"] --> ZIP["Artifact and digest"]
  ZIP --> TRUST["Trusted main workflow validates PR identity and archive"]
  TRUST --> PRE["Numbered isolated preview"]
  PRE --> CLEAN["Verify and close preview (#206)"]
  MAIN["Protected main reviewed SHA"] --> GATE["Explicit owner preflight authorization"]
  GATE --> IMM["Single immutable production artifact"]
  IMM --> A["Deploy .net app"]
  IMM --> B["Deploy .com app"]
  A --> BOTH{"Both apps and four hosts verified?"}
  B --> BOTH
  BOTH -->|Yes| REL["Publish release record and observe"]
  BOTH -->|No| HOLD["No successful release tag; escalate"]
  HOLD --> REC["Authorized recovery per #205"]
  REC --> BOTH
```

Recovery, partial-failure behavior and Azure cleanup require exact-artifact rehearsal and live evidence. No automated rollback or production operation is implied. Production dispatch is separately authorized; never promote a PR preview.

## Future client-owned accelerator boundary (M05)

```mermaid
flowchart LR
  subgraph CLIENT["Client-owned subscription and tenant (planned)"]
    ID["Entra token validation"]
    AUTH["Server-owned membership and resource ACL"]
    APP["Aspire application"]
    RET["Read-only connector retrieval"]
    MODEL["Client-selected model"]
    TEL["Content-suppressed telemetry"]
    ID --> AUTH --> APP --> RET
    RET --> MODEL
    APP --> TEL
  end
  USER["Client user"] --> ID
  JAM["Jamula source / handoff"] -.-> APP
```

No Jamula-hosted customer data, multi-tenant custody, production credentials or client inference spend is introduced by the offline foundations. The actual host, token validation, revocation, ACL enforcement, connector integration, and telemetry exporter are unimplemented or unverified gates.

## Infrastructure boundary

Existing parent DNS, mail and registrar are independent trust boundaries; delegated app-subdomain DNS is a separate proposed decision. No delegation, provider choice, paid resources or DNS modifications are authorized. SoftwareFactory is workflow orchestration, not cloud-resource or DNS ownership.
