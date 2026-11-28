# License and Provenance Inventory

**Status:** Initial engineering inventory; qualified legal review pending.
Squad-generated and adapted assets have been retired from the active tree and
remain in repository history only; preserve their stated attribution and license
notices if referencing historical commits.

| Path | Origin | Terms | Local treatment |
|---|---|---|---|
| `LICENSE` | Jamula repository | Apache-2.0 | Governs Jamula-authored code and technical docs unless excluded in `LICENSE_SCOPE.md` |
| Project-authored `.github/skills/{architecture-options-and-adrs,cloud-hosting-and-cost-evaluation,cms-and-turnkey-platform-evaluation,content-multimedia-social-publishing,jamula-operating-principles,jamula-product-context,legal-compliance-research,oauth-storage-connectors,payments-and-billing-evaluation,privacy-data-governance,secure-customer-portal,source-and-claim-verification,web-experience-accessibility-seo}/` | Jamula, Inc. | Apache-2.0 | Original project guidance |
| `www/` source/scripts/tests (excluding reserved brand/editorial copy), `scripts/`, `.github/scripts/`, Jamula-authored `.github/workflows/`, technical `docs/` outside reserved paths, and root technical governance | Jamula, Inc. | Apache-2.0 | See `LICENSE_SCOPE.md` |
| `www/package.json` and `www/package-lock.json` third-party npm packages, plus `scripts/mcp/JamulaMcp.csproj` NuGet references (`ModelContextProtocol.AspNetCore` `2.4.0` and `Microsoft.Extensions.AI.Abstractions` `11.0.0`, both MIT) | Upstream open-source authors | Respective upstream open-source licenses (MIT for MCP C# SDK and `Microsoft.Extensions.AI.Abstractions`) | Website build, static-generation, offline test, and `.NET 11` read-only MCP dependencies; `.NET 11` utilities under `scripts/{validation,monitor,mbr}/` use the .NET Base Class Library with zero third-party NuGet packages |
| Historical Squad integration files (`.squad/`, `.github/agents/squad.agent.md`, Squad-generated `.github/skills/*`, `.github/workflows/squad-*.yml`, `.github/workflows/sync-squad-labels.yml`, `.mcp.json`, `.gitattributes`, `.vscode/settings.json`) | `@bradygaster/squad-cli` `0.12.0` (removed in PR [#79](https://github.com/Jamula/Jamula-www-Website/pull/79)), `1.1.0` (PRs [#82](https://github.com/Jamula/Jamula-www-Website/pull/82) and [#77](https://github.com/Jamula/Jamula-www-Website/pull/77)), and `2.0.0` (PR [#174](https://github.com/Jamula/Jamula-www-Website/pull/174)) plus Jamula adaptations and `msitarzewski/agency-agents` charter adaptations | MIT | Retired from the active tree; retained in repository history only. See `THIRD_PARTY_NOTICES.md` |
| `.github/skills/cloud-solution-architect/` | `microsoft/skills` revision `6a2bf7b76bb2f3a24ebe18c95d6fce9ca6417326` | MIT | Unmodified vendored skill; preserve notice |
| `docs/company/` | Jamula, Inc. | All rights reserved | Provisional business philosophy/values content |
| `docs/content/` | Jamula, customers, and approved sources | All rights reserved unless marked | Ownership remains with each rights holder; source/rights register required |
| Future `content/`, `public/brand/`, `public/media/` | Jamula, customers, and approved sources | All rights reserved unless marked | Asset-level provenance required |
| Fictional-character codenames in historical Squad configuration | Respective rights holders | No license asserted | Retained in repository history only; no right to use them publicly or imply affiliation is asserted |

Previously granted rights are preserved. Unknown provenance blocks merge until resolved. This inventory is an engineering map and not a legal conclusion.
