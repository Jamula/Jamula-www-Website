# License and Provenance Inventory

**Status:** Initial engineering inventory; qualified legal review pending.
Squad-generated and adapted assets are present in the current tree as well as
repository history; preserve their stated attribution and license notices.

| Path | Origin | Terms | Local treatment |
|---|---|---|---|
| `LICENSE` | Jamula repository | Apache-2.0 | Governs Jamula-authored code unless excluded |
| Project-authored `.github/skills/{architecture-options-and-adrs,cloud-hosting-and-cost-evaluation,cms-and-turnkey-platform-evaluation,content-multimedia-social-publishing,jamula-operating-principles,jamula-product-context,legal-compliance-research,oauth-storage-connectors,payments-and-billing-evaluation,privacy-data-governance,secure-customer-portal,source-and-claim-verification,web-experience-accessibility-seo}/` | Jamula, Inc. | Apache-2.0 | Original project guidance |
| `scripts/`, technical `docs/` outside reserved paths, root technical governance | Jamula, Inc. | Apache-2.0 | See `LICENSE_SCOPE.md` |
| `.squad/`, `.github/agents/squad.agent.md`, `.github/workflows/squad-*.yml`, `.github/workflows/sync-squad-labels.yml`, `.mcp.json`, `.gitattributes`, `.vscode/settings.json` | `@bradygaster/squad-cli` 1.1.0 plus Jamula configuration; current package pin in `.mcp.json` | MIT | Current generated/adapted integration; preserve upstream notices and Jamula-specific provenance. See `THIRD_PARTY_NOTICES.md` |
| Earlier Squad integration files and templates | `@bradygaster/squad-cli` 0.12.0, tag commit `54f699f252e826b385b1d406a611a14a5fba14d6` | MIT | Removed from the current integration in PR #79; retained in repository history only |
| `.squad/agents/{Rai,fact-checker,ralph,scribe}/` and other project-specific `.squad/` files | Squad-generated and Jamula-modified | MIT | Current team/configuration files; project-specific changes do not replace upstream license terms |
| `.squad/agents/{data,spock,uhura,seven}/charter.md` | Adapted from `msitarzewski/agency-agents` as identified in each file header | MIT | Preserve the in-file source attribution; qualified license review pending |
| `.squad/agents/{jean-luc-picard,jadzia-dax,nyota-uhura,geordi-la-forge,seven-of-nine,miles-obrien,sarek}/` | Jamula-authored from Squad charter format | MIT | Historical development charters removed from the current tree; no trademark license granted |
| `.github/skills/cloud-solution-architect/` | `microsoft/skills` revision `6a2bf7b76bb2f3a24ebe18c95d6fce9ca6417326` | MIT | Unmodified vendored skill; preserve notice |
| `docs/company/` | Jamula, Inc. | All rights reserved | Provisional business philosophy/values content |
| `docs/content/` | Jamula, customers, and approved sources | All rights reserved unless marked | Ownership remains with each rights holder; source/rights register required |
| Future `content/`, `public/brand/`, `public/media/` | Jamula, customers, and approved sources | All rights reserved unless marked | Asset-level provenance required |
| Fictional-character codenames in internal Squad configuration | Respective rights holders | No license asserted | Used only as internal coordination labels; no right to use them publicly or imply affiliation is asserted |

Previously granted rights are preserved. Unknown provenance blocks merge until resolved. This inventory is an engineering map and not a legal conclusion.
