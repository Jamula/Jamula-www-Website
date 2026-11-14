# Local side-quest routing mechanism spike

Run from the repository root with a .NET 10 SDK:

```powershell
dotnet run --project scripts\spikes\sidequest-routing\SidequestRouting.csproj --configuration Release
```

The executable starts four loopback-only ASP.NET Core hosts on ephemeral
`127.0.0.1` ports: one path router and three independent in-process section
hosts. It checks `/admin`, `/finance`, and `/tech` dispatch with path/query
preservation, replaces only the Finance host with a new version, and confirms
the other two hosts remain unchanged. It creates no Azure resources, listens
only on loopback, and makes no external network requests.

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
independent-default and explicit collective checks do not replace these seven
checks or clear the production feasibility gate.
