# Side-quests feasibility assessment

**Evidence date:** 2026-11-08
**Status:** Documented research; no platform or inference provider selected
**Scope:** Issue #108, the approved Enable side-quests milestone
**Constraint:** No new paid services, plan upgrades, provisioning, deployment, or
production changes

This assessment records current first-party documentation against the approved
requirements. It is not a platform decision, a live account inventory, a
production verification, or proof that a mechanism experiment has passed. The
current repository documents two Free Azure Static Web Apps serving the four
approved hostnames from the same website artifact; production behavior must
continue to follow that approved configuration.

## Result

The current Free Static Web Apps configuration does not document a supported
way to route `/admin`, `/finance`, or `/tech` to independently deployed ASP.NET
Core page applications. Its managed APIs are available on all plans, but use
the `/api` prefix. Linking a separately deployed App Service as an API requires
the Standard plan and still proxies only `/api`. These documented mechanisms do
not meet the requested independent page deployments under the existing host
paths and no-new-paid-services constraint.

The preconfigured Microsoft Entra provider also does not meet the tenant
boundary: Microsoft documents that it allows any Microsoft account. Restricting
sign-in to a specific Entra tenant requires a custom provider; the plan
comparison lists custom provider registrations and custom-role assignment as
Standard-plan features. No tenant-specific identity configuration or approved
guest/role policy is present in this repository.

No existing inference-provider entitlement, production compute allocation,
quota, pricing/overflow guard, or tested operational kill switch is evidenced
here. Therefore a live AI assistant and private MCP actions remain blocked.
This is an absence of verified evidence for this project, not a claim that no
free inference or alternative hosting arrangement exists anywhere.

A local .NET routing/replacement experiment was run with no external network or
cloud resources. It verifies basic path dispatch, query/path preservation,
unknown-section rejection, and replacing only the Finance host while the other
section hosts remain available. It does **not** deploy independent artifacts or
test any public Azure routing mechanism. The issue's cloud/deployment
experiment is not authorized by this task, so official documentation and the
local spike are not substituted for that evidence.

## Candidate comparison

| Candidate | Documented capabilities | Fit to hard requirements | Disposition |
|---|---|---|---|
| Existing two Free Static Web Apps | Directly serve the four approved hostnames; host static content; provide managed Azure Functions APIs on all plans | Current production workflow builds one artifact and deploys it to both apps. The documented API path is `/api`; tenant-specific Entra restriction and independent page releases are not established. | Preserve as the current public-site boundary. It is not evidence that private .NET sections or AI are feasible. |
| Free Static Web Apps with managed Functions APIs | API endpoints are integrated without managing a separate Functions resource; API requests use `/api`; only one backend API type is configured per environment; API requests have a 45-second maximum duration | May support a bounded API mechanism, but documentation does not establish routing arbitrary page paths to separately deployed page apps. Free-plan preconfigured Entra permits any Microsoft account. | Candidate for future bounded API testing only; does not satisfy this milestone's complete topology/authentication requirements. |
| Static Web Apps Standard linked to App Service | ASP.NET Core is supported by App Service. A linked app proxies the same `/api/...` path. App Service integration and bring-your-own API integration require the Standard plan. | Requires a plan upgrade/new paid service, which is prohibited. It still provides `/api` proxying, not independent page routing for the three section paths. Pull-request environments cannot link a bring-your-own backend. | Not eligible under the current no-paid constraint; not selected. |
| Local .NET reverse proxy with three section hosts | The loopback spike routes `/admin`, `/finance`, and `/tech`; a section host can be restarted with a new version while the other two remain unchanged. The command passed seven deterministic checks. | Demonstrates only local ASP.NET Core routing and host-replacement mechanics. It does not demonstrate separate OS processes, independently built/deployed artifacts, or public hosting. A public TLS-capable proxy host, approved identity, and inference boundary are unavailable or unverified. | Mechanism evidence only. No public host is assumed, provisioned, priced, or selected; production feasibility remains blocked. |
| Separate section hosts or alternate public hostnames | Could be researched as a different hosting shape | The approved scope requires the four existing hostnames and paths; alternate hosts or host-level routing changes are not authorized. Cost, domain, identity, and operational evidence are also absent. | Not evaluated as an approved option; requires a product/hosting constraint change before consideration. |
| Local or hosted model inference | Local inference is a possible research category; hosted inference may have free quotas or paid usage | No production compute allocation, provider entitlement, commercial-use determination, quality/latency evidence, retention terms, hard quota enforcement, or no-bill-overflow proof is recorded. | No live provider selected. Do not use developer Copilot access or test fakes as a production inference entitlement. |

The Azure Standard/App Service alternative is the required comparison against
the current Free mechanism. Its documented technical limits and cost-plan
requirement are sufficient to reject it under the current constraint; they do
not justify upgrading or procuring it.

### Local mechanism experiment

The local spike at
[`scripts/spikes/sidequest-routing`](../../scripts/spikes/sidequest-routing/README.md)
ran with:

```powershell
dotnet run --project scripts\spikes\sidequest-routing\SidequestRouting.csproj --configuration Release
```

Result: **7 local routing and replacement checks passed**. It confirms the
local proxy can dispatch the three paths, preserve the request path/query,
reject an unknown section, and route to a replaced Finance host without
restarting the Admin or Tech hosts. This is the complete evidence class of the
experiment: local mechanism only. It does not satisfy the deployment portion of
the issue's experiment acceptance criterion, because all hosts run inside one
process and no independent artifacts, deployment, Azure route, TLS, identity,
private storage/cache, inference, or production quota was exercised.

The unresolved alternative is a self-managed .NET proxy/local-app architecture.
The local experiment proves it is technically possible to write basic routing
code; it does not establish that a zero-spend, publicly reachable, TLS-capable
host with independent backend deployments and approved production controls is
available. No such host was identified or assumed.

## Work status and boundaries

| Work | Status | Evidence or blocker |
|---|---|---|
| #108 hosting and AI feasibility | **Partially evidenced; still blocked** | A local routing/host-replacement mechanism spike passed, but independent artifact deployment and public routing remain unproven. No compliant tenant-specific authentication design is verified on the current Free configuration. No live inference entitlement or no-paid-overflow design is verified. |
| #111 release contracts | **Blocked for section topology** | Do not define independent page artifacts or collective release orchestration as implementable until a compliant routing/identity boundary is approved. |
| #112 shared section shell | **Deferred for deployed sections** | Existing Astro tokens and styles can inform a future shell, but a shared visual concept is not proof of independently served sections. |
| #113 Admin and #114 private content | **Blocked** | No secure server-side tenant/guest identity, authorization, private content storage, or private caching boundary is established. Do not place private content in the public static artifact. |
| #115 telemetry | **Architecture only** | Existing public analytics is optional and consent-gated; AI/provider telemetry is not implemented. Do not mix private operational events into marketing analytics. |
| #116 public AI/MCP and #117 private AI/MCP | **Live AI blocked** | No production inference boundary or verified entitlement; private MCP additionally depends on tenant authorization. MCP SDK authorization filters require explicit server wiring and do not provide identity authorization by tool annotation alone. |
| #118 deployments | **Blocked for side-quest components** | Existing deployment remains the current static-site flow. Do not replace it with a coupled or paid topology and call that independent deployment. |
| #109 quality baseline, #110 Python tooling, #119 statistics ceremony | **Independent work may proceed** | Continue without changing the hosting or AI gates. |

## Security and protocol notes

- Authentication must validate a Jamula-tenant issuer and intended audience,
  require explicit membership/role authorization, and fail closed. Authentication
  alone is not authorization. Guest invitation does not grant an application
  role.
- Static route restrictions do not secure a private API, asset, search index,
  cache, or model retrieval path by themselves.
- Any later MCP server must authenticate and authorize every request and tool
  invocation server-side. The C# SDK documents explicit ASP.NET authentication,
  authorization, and `AddAuthorizationFilters()` wiring; this is implementation
  guidance, not evidence that Jamula has an MCP server or provider.
- A public MCP endpoint over a managed `/api` backend is not proven by these
  documents to satisfy external-client transport, tenant isolation, quotas, or
  service availability. It remains untested.
- Deterministic fakes are for tests only and must not be reported as a live
  assistant, MCP endpoint, or inference mechanism.

## Official-source register

Sources below were retrieved from first-party documentation on 2026-11-08.
“Verified” applies only to the narrow documentation claim; it is not evidence
that a Jamula resource is configured or that the mechanism passed a test.

| Source | Publisher | Applicable scope | Claim and disposition |
|---|---|---|---|
| [Azure Static Web Apps hosting plans](https://learn.microsoft.com/azure/static-web-apps/plans) | Microsoft Learn | Free and Standard plan feature matrix | Free is described for personal projects; Standard for production. The table lists preconfigured authentication on Free, custom registrations on Standard, and custom-role assignment with a function only on Standard. **Verified documentation; commercial terms are not inferred.** |
| [Overview of API support in Azure Static Web Apps](https://learn.microsoft.com/azure/static-web-apps/apis-overview) | Microsoft Learn | Managed and bring-your-own APIs | Managed Functions APIs are available on all plans; bring-your-own APIs require Standard. The API prefix is `/api`, only one backend type is configured per app environment, API route rules support redirects and role protection, only HTTP is supported, and maximum API duration is 45 seconds. **Verified documentation.** |
| [API support with Azure App Service](https://learn.microsoft.com/azure/static-web-apps/apis-app-service) | Microsoft Learn | ASP.NET Core hosting behind Static Web Apps | An App Service linked as an API is proxied only for routes beginning `/api`; the same path is forwarded. This integration requires Standard. Backend integration is not supported on SWA pull-request environments. **Verified documentation.** |
| [Authenticate and authorize Static Web Apps](https://learn.microsoft.com/azure/static-web-apps/authentication-authorization) | Microsoft Learn | Built-in and custom authentication | The preconfigured Entra provider allows any Microsoft account; restricting to one Entra tenant requires a custom provider. **Verified documentation.** |
| [.NET releases and support](https://learn.microsoft.com/dotnet/core/releases-and-support) | Microsoft Learn | Runtime selection for new .NET tooling | .NET 10 is LTS and supported until November 2028. **Verified documentation; use the current serviced SDK/runtime when implementing.** |
| [C# SDK authorization filters](https://github.com/modelcontextprotocol/csharp-sdk/blob/main/docs/concepts/filters.md) and [identity propagation](https://github.com/modelcontextprotocol/csharp-sdk/blob/main/docs/concepts/identity/identity.md) | Model Context Protocol C# SDK repository | Future authenticated Streamable HTTP MCP implementation | ASP.NET authentication identity propagates through the MCP request pipeline; authorization attributes require explicit `AddAuthorizationFilters()` configuration. **Verified SDK guidance; not Jamula implementation evidence.** |

## Evidence required to unblock

Before any topology-dependent implementation can be represented as complete:

1. A Cyrus-approved candidate must demonstrate the four approved hosts, HTTPS,
   same-host HTTP upgrade, approved paths, independent section artifacts,
   protected private routes/APIs/assets/search/caches, preview isolation, and a
   compatible ad-hoc collective-release model.
2. The candidate must meet the hard no-new-paid-services constraint with
   verified commercial terms and quotas. No silent plan upgrade or paid
   overage is acceptable.
3. Entra tenant/guest membership, explicit application roles, revocation,
   private-content isolation, and audit behavior must be tested end to end.
4. A production-intended inference provider or local compute boundary must have
   verified terms/entitlements, quality and latency evidence, data handling,
   hard request/token ceilings, billing-overflow prevention, monitoring, and
   an exercised kill switch.
5. A separately authorized isolated deployment experiment must verify
   independent backend artifacts and the selected public routing mechanism.
   Record source and artifact revisions, exact plan/runtime, sanitized
   requests/results, cost, teardown, and limitations. The existing local spike
   does not meet this deployment requirement or prove production readiness.

No user/product constraint has been relaxed to clear these gates.
