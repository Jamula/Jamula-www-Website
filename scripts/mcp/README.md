# Jamula Read-Only Public MCP Server (`.NET 11`)

Zero-inference-cost Model Context Protocol (`MCP`) server and vendor-neutral
`Microsoft.Extensions.AI` (`IChatClient`) seam targeting `.NET 11` (`net11.0`).

## Why caller-brings-model MCP eliminates inference spend

External MCP clients (GitHub Copilot, Claude, Cursor) supply their own LLM
tokens. `JamulaMcp` serves strictly read-only, path-confined tools over
Jamula's approved public corpus (`www/src/content/tech/*.md` plus baseline
company overview) with content-suppressed `.NET 11` OpenTelemetry (`ActivitySource`
and `Meter`) instrumentation:

- `get_jamula_overview` — baseline capabilities, canonical URLs, and inquiry path.
- `list_tech_notes` — published technical notes from `www/src/content/tech/`.
- `search_public_corpus` — deterministic ranked keyword search with bounded
  excerpts and canonical citation URLs.

When server-side inference is later authorized (for example inside a client's
own Azure tenant in `M05`), `GroundedAdvisor` demonstrates the vendor-neutral
`Microsoft.Extensions.AI.IChatClient` pattern: ungrounded questions short-circuit
without calling the model, and grounded responses record content-free
`gen_ai.client.token.usage` counters without logging prompts or completions.

## Run or verify offline

```powershell
dotnet run --project scripts\mcp\JamulaMcp.csproj --configuration Release -- --port 5180
dotnet run --project scripts\mcp\JamulaMcp.csproj --configuration Release -- --verify-corpus www\src\content\tech
dotnet run --project scripts\mcp\tests\JamulaMcp.Tests.csproj --configuration Release
```
