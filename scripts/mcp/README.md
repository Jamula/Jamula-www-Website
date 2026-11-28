# Jamula read-only MCP server for the public corpus (`.NET 11`)

A local Model Context Protocol (`MCP`) server and vendor-neutral
`Microsoft.Extensions.AI` (`IChatClient`) seam targeting `.NET 11` (`net11.0`).

## Scope and cost boundary

`JamulaMcp` binds strictly to `127.0.0.1`, rejects unexpected `Host`,
`Origin`, and `Sec-Fetch-Site` headers with `403 Forbidden` before endpoint
dispatch, and serves read-only, path-confined tools over
Jamula's intended public corpus (`www/src/content/tech/*.md` plus baseline
company overview) with content-suppressed `.NET 11` OpenTelemetry (`ActivitySource`
and `Meter`) instrumentation. This is a local endpoint, not a publicly hosted
service; public hosting and a hard zero-spend boundary have not been qualified.
See the [current hosting assessment](../../docs/architecture/side-quests-feasibility.md).

The server loads every Markdown file in the tech directory; it has no draft or
owner-approval filter. Inclusion in the local corpus does not approve publication.
Its registered tools are:

- `get_jamula_overview` — baseline capabilities, canonical URLs, and inquiry path.
- `list_tech_notes` — technical notes loaded from `www/src/content/tech/`.
- `search_public_corpus` — deterministic ranked keyword search with bounded
  excerpts and canonical citation URLs.

Modern MCP requests must include `MCP-Protocol-Version`; requests that identify
themselves as modern without it, or carry mismatched version metadata, are
rejected. Legacy and headerless requests remain supported, with a 1 MiB
request-body limit. Duplicate keys directly in their `params` or `_meta`
objects are rejected with a JSON-RPC invalid-request error. This local limit
is not a general request, public traffic, or spend control.

The registered tools make no model calls. An MCP client may bring its own model
and incur inference charges; hosting, network, telemetry, and other infrastructure
may also incur costs. No total-cost or free-operation guarantee is implied.

If server-side inference is later authorized (for example inside a client's
own Azure tenant in `M05`), `GroundedAdvisor` demonstrates the separate vendor-neutral
`Microsoft.Extensions.AI.IChatClient` pattern: ungrounded questions short-circuit
without calling the model, and grounded responses record content-free
`gen_ai.client.token.usage` counters without logging prompts or completions.
`GroundedAdvisor` is not exposed as an MCP tool.

## Run or verify offline

```powershell
dotnet run --project scripts\mcp\JamulaMcp.csproj --configuration Release -- --port 5180
dotnet run --project scripts\mcp\JamulaMcp.csproj --configuration Release -- --verify-corpus www\src\content\tech
dotnet run --project scripts\mcp\tests\JamulaMcp.Tests.csproj --configuration Release
```
