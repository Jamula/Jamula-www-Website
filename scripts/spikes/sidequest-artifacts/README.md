# Offline side-quest artifact/process experiment

**Local mechanism evidence only; independent Data review required.**
No production topology, hosting provider, public deployment, private/production
authentication or AI implementation is selected or authorized.

This is separate from `..\sidequest-routing`: the original seven in-process
checks are unchanged. Admin, Finance, Tech and the gateway now have separate
.NET 10 framework-only projects and publish directories. The three section
projects link one deliberately tiny probe implementation; they have no runtime
dependency on one another or the source checkout. Responses identify the
compiled component/version, OS process, path and query. These are synthetic
probes, not functional Admin, Finance or Tech applications.

## Default: release one component

From the repository root, with an installed .NET 10 SDK/runtime and PowerShell 7:

```powershell
pwsh -NoProfile -File scripts\spikes\sidequest-artifacts\Publish-Local.ps1 -Section Finance -Version 2.0.0
```

`-Section` is required unless the explicit `-All` switch is supplied. The
publisher invokes only that project's Release publish, removes every NuGet feed
using `offline.nuget.config`, disables auditing and build servers, and produces
a framework-dependent DLL plus its runtime files under this spike's ignored
`artifacts\releases\<unique-id>\<component>\<version>` directory. No package or
SDK download is supported. A missing locally installed framework is a blocker,
not permission to access a feed. Existing version directories are rejected.
This is publisher-enforced write-once output, not tamper-proof storage.

## Demonstration and focused checks

```powershell
$env:DOTNET_CLI_TELEMETRY_OPTOUT = '1'
$env:DOTNET_CLI_WORKLOAD_UPDATE_NOTIFY_DISABLE = 'true'
dotnet run --project scripts\spikes\sidequest-artifacts\Checks\Checks.csproj --configuration Release
```

For only the five focused cleanup regressions (no publishing or hosting), run:

```powershell
dotnet run --project scripts\spikes\sidequest-artifacts\Checks\Checks.csproj --configuration Release -- --cleanup
```

These checks inject ordered cleanup failures deterministically and use one
owned sleeping .NET child (the checks assembly's internal `--cleanup-child`
mode, bounded to 60 seconds) to verify that successful startup cleanup rethrows
the original callback exception and terminates the child. This focused command
requires only the existing .NET SDK/runtime, not PowerShell.

The fixture separately publishes each project, launches each published DLL in
its own OS process from its release directory, and starts a fourth routing
process. All hosts bind `127.0.0.1:0`; the OS allocates distinct ports. Readiness
is bounded and actual HTTP probes must identify the expected compiled version
and exact child PID. Finance v1 is stopped, its failed route returns a bounded
502, and Admin/Tech continue serving with unchanged PIDs. Only Finance v2 is
published and started; an atomic local routing-file replacement switches that
route to the new port. SHA-256 snapshots verify all old release files remain
unchanged, the Finance binaries differ, and no other v2 release exists. The old
Finance artifact is then run alongside the new one to distinguish them.
Coverage of the published hosts is collected separately with
`dotnet-coverage`; see `scripts\coverage\README.md` for the fresh-report
command and linked-source identity checks.

The router supports GET probes only; unknown/case-mismatched sections return
404 without dispatch, other methods return 405, an unavailable upstream returns
502, and invalid/missing local routing configuration returns 503. Only literal
HTTP `127.0.0.1` root endpoints are accepted; proxies and redirects are disabled.
There is no configuration or request logging. Child environments allow only
OS/runtime path variables, not session credentials or service settings.

## Explicit ad-hoc collective mechanism

```powershell
pwsh -NoProfile -File scripts\spikes\sidequest-artifacts\Publish-Local.ps1 -All -Version 1.0.0
$env:DOTNET_CLI_TELEMETRY_OPTOUT = '1'
$env:DOTNET_CLI_WORKLOAD_UPDATE_NOTIFY_DISABLE = 'true'
dotnet run --project scripts\spikes\sidequest-artifacts\Checks\Checks.csproj --configuration Release -- --collective
```

The second command is a **bounded collective build/deploy/probe/stop
demonstration**, not a persistent server launcher. It invokes the same `-All`
publisher into a unique directory and activates the exact four-project set in
fixed Admin, Finance, Tech, gateway order. All artifacts are checked for
existence before starting any host. The collective check proves direct and
routed responses from all three sections with distinct processes/ports; cleanup
proves every owned child exited and its loopback listener disappeared.
Collective publishing is sequential, not atomic: a build failure can leave
partial unused artifacts. Partial process starts are bounded and owned by
`finally` cleanup, not a production rollback coordinator.

Normal completion and managed failures kill only specifically owned process
trees and wait up to 10 seconds per shutdown/drain. Startup readiness allows
15 seconds; each publisher allows 120 seconds; upstream requests allow 2 seconds
and test requests 5 seconds. A deterministic readiness-timeout test verifies
that the specific failing child exits while existing hosts remain usable.
Run directories are deleted after checks. Externally killing the test runner,
OS crashes, PID/port interference from unrelated software and untrusted local
actors are outside the cleanup/availability guarantee. Do not run simultaneous
publishes against the same project: build intermediates are shared even though
release roots and listening ports are isolated.

Cleanup attempts termination, bounded exit/drain waits and handle disposal even
when an earlier step fails. Failures retain their original exception objects in
attempt order. If startup and cleanup both fail, the aggregate contains the
startup error first and the cleanup error second; successful cleanup rethrows
the original startup error unchanged. Fixture cleanup also attempts every child,
client disposal and release deletion, retaining deletion errors after any
earlier failures rather than replacing them.

## Exact check inventory

The default command must exit 0 with **24 passed, 0 skipped, 0 failed**. The
collective command must exit 0 with **7 passed, 0 skipped, 0 failed**. The focused
`--cleanup` command must exit 0 with **5 passed, 0 skipped, 0 failed**. Names are
static, unique report metadata, never interpolated request data. This console
fixture follows the existing spike convention; it does not emit a TRX/JUnit
result report or enforce an in-run coverage threshold. The coverage gate
consumes the separate `dotnet-coverage` report described in
`scripts\coverage\README.md`.

| Requirement | Evidence |
| --- | --- |
| Child cleanup failures retain their original exception details | `CleanupFailureDetailsAreRetained` |
| Release deletion errors follow earlier child cleanup errors | `ReleaseDeletionFailureRetainsEarlierCleanupFailures` |
| Termination failure still attempts bounded waits, drains and disposal | `TerminationFailureStillWaitsDrainsAndDisposes` |
| Startup and cleanup errors retain identity and order | `StartupAndCleanupFailuresRetainOriginalIdentityAndOrder` |
| Successful startup cleanup preserves the original exception and stops its child | `SuccessfulStartupCleanupRethrowsOriginalException` |
| Independent builds/releases | `IndependentPublishesDoNotBuildOtherSections` |
| Separate processes/ports and runnable artifacts | `IndependentArtifactsRunInDistinctProcessesAndPorts` |
| Direct section roots, nested paths and encoded/repeated/empty query values | `AllSectionsPreserveNestedPathAndEncodedQuery` |
| No unknown/case-mismatched dispatch | `UnknownSectionDoesNotDispatchToAnyHost` |
| Finance failure plus available, unchanged Admin/Tech | `FinanceFailureIsBoundedAndOtherHostsRemainUnchanged` |
| Finance-only new bytes; old and other artifacts unchanged | `FinanceOnlyReleaseChangesBytesAndPreservesOtherArtifacts` |
| New Finance response with untouched Admin/Tech/gateway processes and files | `FinanceReplacementServesNewArtifactWithoutRestartingOtherHosts` |
| Old and new Finance artifacts remain distinguishable/runnable | `OldFinanceArtifactRemainsRunnableAndIdentifiesOldVersion` |
| Missing artifact never starts a process | `MissingArtifactFailsBeforeProcessStart` |
| Reject release reuse without mutation | `ReleaseDirectoryReuseFailsWithoutChangingArtifactBytes` |
| Reject unknown release selection without mutation | `InvalidReleaseSelectionFailsWithoutCreatingArtifacts` |
| Invalid routing fails closed and recovers | `MalformedRoutingFileFailsClosedAndRecovers` |
| Missing Finance route isolates failure | `MissingFinanceRouteIsIsolatedFromOtherSections` |
| No non-loopback upstream dispatch | `NonLoopbackUpstreamIsRejectedBeforeDispatch` |
| Unsupported method does not dispatch | `UnsupportedMethodIsRejectedWithoutUpstreamDispatch` |
| Failed gateway startup leaves existing hosts available | `GatewayStartupFailureIsBoundedAndLeavesSectionsAvailable` |
| Readiness timeout specifically kills its child | `ReadinessTimeoutKillsOnlyTheOwnedChild` |
| Collective preflight rejects an incomplete set before process start | `MissingCollectiveArtifactRejectsSetBeforeStartingAnyHost` |
| No remaining owned children/listeners | `AllOwnedChildrenExitAndReleaseLoopbackPorts` (both modes) |
| Ad-hoc exact collective set | `CollectivePublishesAndDeploysExactAllSectionSet` (`--collective`) |

## Limitations

This demonstrates the requested independent-default/collective-ad-hoc semantics
**only for an offline local fixture**. It does not implement the proposed
production release descriptor, source/descriptor binding, contract compatibility,
signatures, concurrency fencing, authorized activation, HA, zero-downtime
replacement, long-lived deployment control, secret handling or rollback policy.
Local configuration is trusted test input, not a private-service security
boundary. There is intentionally a Finance outage between stop and replacement.
Public-site collective deployment is not demonstrated: this set contains only
the three synthetic sections and their local gateway, not the existing Astro
website or approved hostname deployment.

Hosting/routing feasibility, identity, private storage/cache/preview controls,
MCP, inference, public TLS/DNS, quotas/cost and operational entitlement remain
blocked as documented in `docs\architecture\side-quests-feasibility.md`.
No cloud, public/paid service, GitHub write, remote network call, push, PR or
mutable Squad-state update is part of these commands. An independent Data
review is required before this implementation is accepted; no review is claimed.
