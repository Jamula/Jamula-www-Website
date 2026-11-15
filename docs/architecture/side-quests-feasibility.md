# Side-quests feasibility assessment

**Evidence date:** 2026-11-15
**Status:** Documented research and local mechanism evidence; no platform or inference provider selected; independent review pending
**Scope:** Issue #108, the approved Enable side-quests milestone
**Constraint:** No new paid services, plan upgrades, cloud provisioning, public
deployment, or production changes

This assessment records dated first-party documentation and bounded local
mechanism checks against the approved requirements. It is not a platform
decision, a live account inventory, a public-deployment verification, or proof
of a Jamula account/provider entitlement. Local checks do not prove public
routing or production readiness. The current repository documents two Free
Azure Static Web Apps serving the four approved hostnames from the same website
artifact; production behavior must continue to follow that approved
configuration.

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

A local .NET in-process routing/replacement experiment was run with no external
network or cloud resources. On 2026-11-15 it passed ten checks for basic path
dispatch, query/path preservation, unknown-section rejection, and replacing
only the Finance host while the other section hosts remain available. A
separate offline artifact/process experiment is described below. Neither
experiment tests a public Azure routing mechanism or substitutes for a
separately authorized public deployment experiment.

The offline [artifact/process experiment](../../scripts/spikes/sidequest-artifacts/README.md)
is local release-mechanism evidence requiring independent Data review, not an
approved hosting topology or a collective deployment of the public website.
On 2026-11-15, its default command passed 24 checks and its explicit collective
command passed 7 checks on a clean rerun. The first collective invocation
reported all seven checks passing but exited unsuccessfully while deleting a
temporary `Gateway.dll`; the cause was not established. The rerun exited
successfully. This result is retained as a teardown caveat, not hidden or
attributed to a specific cause. Production hosting, identity and AI blockers
remain unchanged; no provider is chosen or remote deployment performed.

## Candidate comparison

| Candidate | Documented capabilities | Fit to hard requirements | Disposition |
|---|---|---|---|
| Existing two Free Static Web Apps | Directly serve the four approved hostnames; host static content; provide managed Azure Functions APIs on all plans | Current production workflow builds one artifact and deploys it to both apps. The documented API path is `/api`; tenant-specific Entra restriction and independent page releases are not established. | Preserve as the current public-site boundary. It is not evidence that private .NET sections or AI are feasible. |
| Free Static Web Apps with managed Functions APIs | API endpoints are integrated without managing a separate Functions resource; API requests use `/api`; only one backend API type is configured per environment; API requests have a 45-second maximum duration | May support a bounded API mechanism, but documentation does not establish routing arbitrary page paths to separately deployed page apps. Free-plan preconfigured Entra permits any Microsoft account. | Candidate for future bounded API testing only; does not satisfy this milestone's complete topology/authentication requirements. |
| Static Web Apps Standard linked to App Service | ASP.NET Core is supported by App Service. A linked app proxies the same `/api/...` path. App Service integration and bring-your-own API integration require the Standard plan. | Requires a plan upgrade/new paid service, which is prohibited. It still provides `/api` proxying, not independent page routing for the three section paths. Pull-request environments cannot link a bring-your-own backend. | Not eligible under the current no-paid constraint; not selected. |
| Local .NET reverse proxy with three section hosts | The in-process loopback spike passed 10 checks for `/admin`, `/finance`, and `/tech` dispatch, path/query handling, request-target edge cases, and Finance replacement. A separate offline fixture passed 24 checks for independently published artifacts, separate OS processes, Finance-only replacement, failure isolation, and cleanup; an explicit collective run passed 7 checks on rerun after one teardown failure. | Demonstrates local ASP.NET Core routing and local artifact/process replacement only. It does not demonstrate a public hosting provider, public TLS/DNS, a production route, tenant identity, private data isolation, or inference entitlement. | Mechanism evidence only. No public host is assumed, provisioned, priced, or selected; production feasibility remains blocked. Independent Data review of the artifact/process experiment is pending. |
| Separate section hosts or alternate public hostnames | Could be researched as a different hosting shape | The approved scope requires the four existing hostnames and paths; alternate hosts or host-level routing changes are not authorized. Cost, domain, identity, and operational evidence are also absent. | Not evaluated as an approved option; requires a product/hosting constraint change before consideration. |
| Local or hosted model inference | Local inference is a possible research category; hosted inference may have free quotas or paid usage | No production compute allocation, provider entitlement, commercial-use determination, quality/latency evidence, retention terms, hard quota enforcement, or no-bill-overflow proof is recorded. | No live provider selected. Do not use developer Copilot access or test fakes as a production inference entitlement. |
| Cloudflare (tentative research candidate only) | Cloudflare publishes Workers AI pricing and Cloudflare One Zero Trust plan and seat-management documentation | Published free-tier quotas and seat limits do not establish suitable always-on compute, commercial/model rights, Jamula account entitlement, or end-to-end tenant, guest, routing, normalization, and evidence-retention controls. | Research note only; does not resolve or weaken any Azure Free Static Web Apps blocker above. No architecture or deployment choice is approved. |

#### Cloudflare research note (tentative; not an architecture decision)

Cloudflare’s Workers AI documentation currently lists 10,000 Neurons per day
for the Free Workers allocation, resetting at 00:00 UTC; operations fail after
limits are exceeded, and some models require paid billing. This quota does not
prove suitability, commercial-use entitlement, or that Jamula’s account can use
the service. Cloudflare’s Zero Trust Free plan lists up to 50 users and up to
24 hours of standard log retention, so evidence-retention needs assessment.
The seat limit is not a revocation control: at the limit additional logins are
blocked, but removing a user does not itself prevent access; revoking sessions
ends active sessions, while policies or the IdP must prevent future logins.

Existing always-on compute availability, commercial/model terms,
tenant/guest policy enforcement, path normalization end-to-end, log retention
adequacy, approved DNS/route changes, and applicable account entitlement remain
unverified. These are research leads, not verified Jamula capabilities. The
existing Azure Free-tier blockers and no-new-paid-services constraint remain
unchanged. No deployment or architecture choice is authorized.

The Azure Standard/App Service alternative is the required comparison against
the current Free mechanism. Its documented technical limits and cost-plan
requirement are sufficient to reject it under the current constraint; they do
not justify upgrading or procuring it.

## Issue #108 evidence status

| Requirement | Narrow evidence verified | Unresolved blocker |
|---|---|---|
| Routing and independent deployment | Static Web Apps API integration is limited to `/api`; local synthetic backends passed separate-artifact/process and replacement checks. | No compliant public route for independent `/admin`, `/finance`, or `/tech` page deployments was demonstrated. |
| Hosts, TLS, and previews | Repository documents the approved four-host Static Web Apps configuration and isolated preview policy; Microsoft documents automatically renewing SSL certificates on Free and Standard plans. | No live check of all four HTTPS hosts, same-host HTTP upgrades, preview isolation, or public backend behavior was performed for this issue. |
| Tenant identity, private data, and caching | Microsoft documents that the preconfigured Entra provider permits any Microsoft account and tenant restriction requires a custom provider; custom provider registrations are listed on Standard. | No Jamula tenant/guest membership, explicit roles, revocation, protected assets/search, private storage, or cache isolation was demonstrated. |
| AI inference | Cloudflare publishes a Free Workers AI allocation of 10,000 Neurons/day; excess operations fail on Free, while Workers Paid bills above the allocation. | No Jamula account eligibility, model/commercial terms, secure data handling, quality, latency, availability, hard request/token caps, no-bill-overflow control, kill switch, or portable inference adapter was verified. |
| Monitoring and storage | Cloudflare publishes up to 24 hours of standard Cloudflare One log retention on Free and a 50-user limit. | This does not establish suitable inference monitoring/audit retention or a zero-cost private-content store; no Jamula account configuration, retention adequacy, recovery, or cost was verified. |
| Cost and quota | Published Free/Standard plan distinctions and Cloudflare AI quota/pricing are recorded above. | A Free label is not proof of Jamula commercial eligibility or zero-spend operation. No live entitlement/overage inventory or region-specific Standard price was captured; no monthly, annual, or three-year cost forecast is decision-grade without an exact candidate and workload. |

These are evidence gaps, not proof that no alternative could meet the
requirements. The affected topology, private-content, telemetry, AI, and
deployment work remains blocked until the missing conditions are proven without
weakening the approved constraints.

### Local mechanism experiment

The local spike at
[`scripts/spikes/sidequest-routing`](../../scripts/spikes/sidequest-routing/README.md)
ran with:

```powershell
dotnet run --project scripts\spikes\sidequest-routing\SidequestRouting.csproj --configuration Release
```

Result on 2026-11-15: **10 local routing and replacement checks passed**. It confirms the
local proxy can dispatch the three paths, preserve the request path/query,
reject an unknown section, and route to a replaced Finance host without
restarting the Admin or Tech hosts. The section hosts in this spike run
in-process. This is local mechanism evidence only; it does not demonstrate
independently published artifacts, a public Azure route, TLS, identity, private
storage/cache, inference, or production quota.

### Offline independent artifact/process experiment

The separate fixture at
[`scripts/spikes/sidequest-artifacts`](../../scripts/spikes/sidequest-artifacts/README.md)
publishes each synthetic .NET section and gateway to separate local release
directories, runs them in distinct loopback-only OS processes, and replaces
Finance without restarting Admin, Tech, or the gateway.

On 2026-11-15:

- Tested source revision: `ebead8956fe728566944817c0ebedc49574e3c4a` (the same commit as `origin/main` at the time); .NET SDK `10.0.404` and installed .NET / ASP.NET Core runtime `10.0.15`.
- `dotnet run --project scripts\spikes\sidequest-artifacts\Checks\Checks.csproj --configuration Release` — **24 local checks passed**.
- `dotnet run --project scripts\spikes\sidequest-artifacts\Checks\Checks.csproj --configuration Release -- --collective` — **7 local checks passed on rerun**. The first invocation printed seven passing checks, then exited nonzero when fixture cleanup could not delete a temporary `Gateway.dll`; the reason was not determined.

These are synthetic local artifacts, not deployed Admin, Finance, or Tech
applications. The fixture establishes an independent local build/publish/start/
probe/stop mechanism and Finance-only replacement. It does not deploy the public
Astro site, test Azure or any other public router, establish public TLS/DNS,
tenant-restricted auth, private storage/cache, inference, quota enforcement, or
zero-spend production operation. The independent Data review remains pending.

The unresolved alternative is a self-managed .NET proxy/local-app architecture.
The local experiment proves it is technically possible to write basic routing
code; it does not establish that a zero-spend, publicly reachable, TLS-capable
host with independent backend deployments and approved production controls is
available. No such host was identified or assumed.

## Work status and boundaries

| Work | Status | Evidence or blocker |
|---|---|---|
| #108 hosting and AI feasibility | **Partially evidenced; still blocked** | Local independent artifacts/processes and replacement are demonstrated, but public independent artifact deployment and public routing remain unproven. No compliant tenant-specific authentication design is verified on the current Free configuration. No live inference entitlement or no-paid-overflow design is verified. |
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

“Verified” applies only to the narrow documentation claim; it is not evidence
that a Jamula resource is configured, commercially eligible, or that a public
mechanism passed a test. Each row gives the source's published update date when
available and its latest retrieval date. Core Static Web Apps and Cloudflare
claims were refreshed on 2026-11-15; other source rows retain their earlier
retrieval dates.

| Source | Publisher | Applicable scope | Claim and disposition |
|---|---|---|---|
| [Azure Static Web Apps hosting plans](https://learn.microsoft.com/azure/static-web-apps/plans) | Microsoft Learn | Free and Standard plan feature matrix; updated 2026-01-23; retrieved 2026-11-15 | Free is described for personal projects; Standard for production. The table lists preconfigured authentication on Free, custom registrations on Standard, and custom-role assignment with a function only on Standard. **Verified documentation; commercial terms and Jamula eligibility are not inferred.** |
| [Overview of API support in Azure Static Web Apps](https://learn.microsoft.com/azure/static-web-apps/apis-overview) | Microsoft Learn | Managed and bring-your-own APIs; updated 2026-03-25; retrieved 2026-11-15 | Managed Functions APIs are available on all plans; bring-your-own APIs require Standard. The API prefix is `/api`, only one backend type is configured per app environment, API route rules support redirects and role protection, only HTTP is supported, and maximum API duration is 45 seconds. **Verified documentation.** |
| [API support with Azure App Service](https://learn.microsoft.com/azure/static-web-apps/apis-app-service) | Microsoft Learn | ASP.NET Core hosting behind Static Web Apps; updated 2026-03-25; retrieved 2026-11-15 | An App Service linked as an API is proxied only for routes beginning `/api`; the same path is forwarded. This integration requires Standard. Backend integration is not supported on SWA pull-request environments. **Verified documentation.** |
| [Authenticate and authorize Static Web Apps](https://learn.microsoft.com/azure/static-web-apps/authentication-authorization) | Microsoft Learn | Built-in and custom authentication; updated 2026-01-23; retrieved 2026-11-15 | The preconfigured Entra provider allows any Microsoft account; restricting sign-in to one Entra tenant requires a custom provider. The plans table lists custom provider registrations on Standard. **Verified documentation; no Jamula identity configuration is inferred.** |
| [.NET releases and support](https://learn.microsoft.com/dotnet/core/releases-and-support) | Microsoft Learn | Runtime selection for new .NET tooling; retrieved 2026-11-08 | .NET 10 is LTS and supported until November 2028. **Verified documentation; use the current serviced SDK/runtime when implementing.** |
| [C# SDK authorization filters](https://github.com/modelcontextprotocol/csharp-sdk/blob/main/docs/concepts/filters.md) and [identity propagation](https://github.com/modelcontextprotocol/csharp-sdk/blob/main/docs/concepts/identity/identity.md) | Model Context Protocol C# SDK repository | Future authenticated Streamable HTTP MCP implementation; retrieved 2026-11-08 | ASP.NET authentication identity propagates through the MCP request pipeline; authorization attributes require explicit `AddAuthorizationFilters()` configuration. **Verified SDK guidance; not Jamula implementation evidence.** |
| [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/) | Cloudflare Developers | Workers AI free allocation and model billing; updated 2026-11-12; retrieved 2026-11-15 | Free allocation is 10,000 Neurons/day, resetting at 00:00 UTC; exceeding limits causes further operations to fail on Free. Workers Paid bills above the free allocation at $0.011/1,000 Neurons; some models require a paid billing method. **Verified published pricing only; Jamula account eligibility, commercial/model rights, and billing configuration are not inferred.** |
| [Cloudflare SASE / Zero Trust pricing](https://www.cloudflare.com/plans/sase-zero-trust.md) | Cloudflare | Cloudflare One Free plan; retrieved 2026-11-15 | Free plan lists up to 50 users and up to 24 hours standard log retention. **Verified published plan details; evidence-retention adequacy and Jamula account applicability remain unverified.** |
| [Seat management](https://developers.cloudflare.com/cloudflare-one/team-and-resources/users/seat-management/) | Cloudflare Developers | Cloudflare One seats and access revocation; updated 2026-05-01; retrieved 2026-11-15 | At the seat limit, additional users attempting to log in are blocked. Removing a user does not itself prevent access; revocation terminates active sessions, but policies or the IdP must prevent future logins. **Verified documentation; not evidence of Jamula tenant/guest policy enforcement.** |

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
   independent backend artifacts against a selected public routing mechanism.
   Record source and artifact revisions, exact plan/runtime, sanitized
   requests/results, cost, teardown, and limitations. The local artifact
   experiment demonstrates only local routing and artifact replacement; it
   does not establish a public route or production readiness. Such an
   experiment remains outside the current no-provisioning/no-public-deployment
   authorization.

No user/product constraint has been relaxed to clear these gates.
