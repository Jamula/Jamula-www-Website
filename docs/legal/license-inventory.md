# License and Provenance Inventory

**Status:** Initial engineering inventory; qualified legal review pending. Squad
framework entries below describe historical provenance; those operational assets
have been removed from the current tree.

| Path | Origin | Terms | Local treatment |
|---|---|---|---|
| `LICENSE` | Jamula repository | Apache-2.0 | Governs Jamula-authored code unless excluded |
| Project-authored `.github/skills/{architecture-options-and-adrs,cloud-hosting-and-cost-evaluation,cms-and-turnkey-platform-evaluation,content-multimedia-social-publishing,jamula-operating-principles,jamula-product-context,legal-compliance-research,oauth-storage-connectors,payments-and-billing-evaluation,privacy-data-governance,secure-customer-portal,source-and-claim-verification,web-experience-accessibility-seo}/` | Jamula, Inc. | Apache-2.0 | Original project guidance |
| `scripts/`, technical `docs/` outside reserved paths, root technical governance | Jamula, Inc. | Apache-2.0 | See `LICENSE_SCOPE.md` |
| `.github/agents/squad.agent.md`, generic Squad-installed `.github/skills/`, `.github/workflows/squad-*.yml`, `.github/workflows/sync-squad-labels.yml`, `.github/copilot-instructions.md` | `@bradygaster/squad-cli` 0.12.0, tag commit `54f699f252e826b385b1d406a611a14a5fba14d6` | MIT | Historical files removed from the current tree; prior modification categories are recorded in `THIRD_PARTY_NOTICES.md` |
| `.squad/templates/` | `@bradygaster/squad-cli` 0.12.0 | MIT | Historical templates removed from the current tree |
| `.squad/agents/{Rai,fact-checker,ralph,scribe}/`, `.squad/{team.md,routing.md,ceremonies.md,casting/}`, `.mcp.json`, `.gitattributes`, `.vscode/settings.json` | Squad-generated and Jamula-modified | MIT | Historical configuration removed from the current tree |
| `.squad/agents/{jean-luc-picard,jadzia-dax,nyota-uhura,geordi-la-forge,seven-of-nine,miles-obrien,sarek}/` | Jamula-authored from Squad charter format | MIT | Historical development charters removed from the current tree; no trademark license granted |
| `.github/skills/cloud-solution-architect/` | `microsoft/skills` revision `6a2bf7b76bb2f3a24ebe18c95d6fce9ca6417326` | MIT | Unmodified vendored skill; preserve notice |
| `docs/company/` | Jamula, Inc. | All rights reserved | Provisional business philosophy/values content |
| `docs/content/` | Jamula, customers, and approved sources | All rights reserved unless marked | Ownership remains with each rights holder; source/rights register required |
| Future `content/`, `public/brand/`, `public/media/` | Jamula, customers, and approved sources | All rights reserved unless marked | Asset-level provenance required |
| Star Trek character names in former internal development configuration | Respective rights holders | No license asserted | Configuration removed from the current tree; no trademark license is asserted |

Previously granted rights are preserved. Unknown provenance blocks merge until resolved. This inventory is an engineering map and not a legal conclusion.
