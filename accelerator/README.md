# M05 accelerator authorization foundation

This is an offline, unreleased foundation for [#189](https://github.com/Jamula/Jamula-www-Website/issues/189), not a deployable service. It defines exact Entra app-role policies and denies requests that use the default or fallback policy. No role implies another role. A role is accepted only from an authenticated identity carrying that role.

Run the offline policy tests with the .NET 11 SDK:

```powershell
dotnet run --project accelerator\Authorization.Tests\JamulaAccelerator.Authorization.Tests.csproj --configuration Release
```

These policies do not authenticate tokens, resolve membership or tenant context, or authorize individual resources. Do not expose customer endpoints or treat these checks as a complete authorization boundary. The Aspire topology, Microsoft.Identity.Web single-tenant validation, immutable server-resolved context, object authorization, content-suppressed telemetry, client-owned Azure deployment, and integration tests remain outstanding in #189. The connector/RAG work in #188 and the independent review and exact-SHA human release gate in #194 also remain open.
