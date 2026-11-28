# M05 accelerator foundations

This is an offline, unreleased foundation for [#189](https://github.com/Jamula/Jamula-www-Website/issues/189), not a deployable service. It defines exact Entra app-role policies and denies requests that use the default or fallback policy. No role implies another role. A role is accepted only when exactly one authenticated identity carries that role; a principal with multiple authenticated identities is denied.

Run the offline policy tests with the .NET 11 SDK:

```powershell
dotnet run --project accelerator\Authorization.Tests\JamulaAccelerator.Authorization.Tests.csproj --configuration Release
dotnet run --project accelerator\Telemetry.Tests\JamulaAccelerator.Telemetry.Tests.csproj --configuration Release
```

The telemetry helper emits only a fixed completion-event span name, fixed outcome labels, caller-supplied duration, and counts. Spans represent recording, not operation duration; the duration metric represents the caller's measurement. Root spans intentionally do not inherit request baggage or trace state and therefore do not preserve distributed parentage. It does not configure an OpenTelemetry exporter or sanitize telemetry emitted by the host, dependencies, request handlers, or other instrumentation. Listener failures propagate to the caller; the helper does not execute or wrap business operations. If a metric listener and then an activity-stop listener both throw, the activity-stop exception takes precedence. Do not call the helper from an operation's `finally` block: integration must isolate and report instrumentation failures without masking results or exceptions before production use. End-to-end content suppression remains an integration and review gate.

These policies do not authenticate tokens, resolve membership or tenant context, or authorize individual resources. Do not expose customer endpoints or treat these checks as a complete authorization boundary. The Aspire topology, Microsoft.Identity.Web single-tenant validation, immutable server-resolved context, object authorization, end-to-end content-suppressed telemetry, client-owned Azure deployment, and integration tests remain outstanding in #189. The connector/RAG work in #188 and the independent review and exact-SHA human release gate in #194 also remain open.
