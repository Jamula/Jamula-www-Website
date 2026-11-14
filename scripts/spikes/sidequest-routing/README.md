# Local side-quest routing mechanism spike

Run from the repository root with a .NET 10 SDK:

```powershell
dotnet run --project scripts\spikes\sidequest-routing\SidequestRouting.csproj --configuration Release
```

The executable starts four loopback-only ASP.NET Core hosts on ephemeral
`127.0.0.1` ports: one path router and three independent in-process section
hosts. It checks `/admin`, `/finance`, and `/tech` dispatch with path/query
preservation, replaces only the Finance host with a new version, confirms the
other two hosts remain unchanged, verifies encoded delimiters and dot segments
over raw HTTP requests, and rejects network-path request targets. It creates no
Azure resources, listens only on loopback, and makes no external network
requests.
Both local HTTP clients bypass configured proxies so the loopback-only boundary
does not depend on the machine's proxy environment.
The gateway selects the section from the original origin-form request target
because Kestrel's parsed path can normalize dot segments. It validates that
target before constructing the upstream `Uri` with path/query canonicalization
disabled; the raw-wire checks avoid letting the test client's own `Uri`
normalize the cases under test.

This is a **local mechanism experiment only**. It demonstrates basic ASP.NET
Core path dispatch and host replacement; it does not demonstrate separate OS
processes, independently built/deployed artifacts, Azure Static Web Apps
routing, public TLS/DNS, Entra tenant restriction, private storage/caching,
preview isolation, MCP transport, inference, production quotas, availability,
cost, or a supported deployment topology. Passing this fixture does not clear
the feasibility gate in
[`docs/architecture/side-quests-feasibility.md`](../../../docs/architecture/side-quests-feasibility.md).

For separate local published artifacts and OS processes, see the additional
[`sidequest-artifacts` experiment](../sidequest-artifacts/README.md). Its
independent-default and explicit collective checks do not replace these ten
checks or clear the production feasibility gate.
