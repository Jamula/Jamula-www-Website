# Repository License Scope

Copyright 2026 Jamula, Inc.

This repository contains Jamula-authored software, third-party material, and business content with different terms.

## Apache-2.0

Unless a path is identified below or carries its own notice, Jamula-authored source code, build/deployment scripts, `.NET` and Node.js utilities (`www/`, `scripts/`, `.github/scripts/`, Jamula-authored workflows and skills), configuration, tests, and technical engineering documentation are licensed under the root [Apache License 2.0](LICENSE).

## Third-party material

Third-party files remain under their original licenses. See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) and [`docs/legal/license-inventory.md`](docs/legal/license-inventory.md).

- Squad-generated or adapted integration files (currently pinned at `@bradygaster/squad-cli@2.0.0` in `.mcp.json`, including Squad templates, workflows, agent definitions, and Squad-originated skills under `.squad/` and `.github/`) remain under their original MIT terms; earlier `0.12.0` and `1.1.0` states are retained in repository history. See `THIRD_PARTY_NOTICES.md` for current paths and source history.
- `.github/skills/cloud-solution-architect/` remains subject to Microsoft's MIT license.
- Website npm packages in `www/package.json` / `www/package-lock.json` are governed by their respective upstream open-source licenses; `.NET 10` utilities under `scripts/` use the .NET Base Class Library with no third-party NuGet packages.

## Reserved Jamula content

The following are not licensed under Apache-2.0 unless a file explicitly says otherwise:

- Jamula names, logos, trademarks, service marks, and brand assets;
- marketing copy, service descriptions, case studies, testimonials, customer materials, photographs, illustrations, audio, and video;
- `docs/company/operating-principles.md`;
- `docs/company/public-values-draft.md`;
- `docs/content/`;
- future `content/`, `public/brand/`, and `public/media/` paths.

Jamula, Inc. retains rights it owns in reserved content. Customers and third parties retain their respective rights; inclusion in this repository does not transfer ownership to Jamula.

## Previously granted rights

This scope statement does not revoke rights already granted for material in earlier commits. Provenance and prior-license treatment must be reviewed before moving or relicensing existing files.

## Contributions

Contributions are governed by `CONTRIBUTING.md`. No contribution grants rights to Jamula trademarks or third-party marks. External contributions are not merged until the inbound contribution policy receives qualified review.

This document is an engineering licensing boundary, not legal advice. Final wording remains subject to qualified legal review.
