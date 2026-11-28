# Third-party Notices

## Squad CLI integration (historical provenance — retired from active tree)

Squad-generated and Jamula-configured integration files have been retired from
the active repository tree. Repository history retains earlier states introduced
at `@bradygaster/squad-cli@0.12.0` (tag commit
`54f699f252e826b385b1d406a611a14a5fba14d6`, removed in
[#79](https://github.com/Jamula/Jamula-www-Website/pull/79)), reintroduced and
updated to `@bradygaster/squad-cli@1.1.0` in
[#82](https://github.com/Jamula/Jamula-www-Website/pull/82) and
[#77](https://github.com/Jamula/Jamula-www-Website/pull/77), and upgraded to
`@bradygaster/squad-cli@2.0.0` in
[#174](https://github.com/Jamula/Jamula-www-Website/pull/174) (cleaned in
[#175](https://github.com/Jamula/Jamula-www-Website/pull/175)). Historical paths
in Git history include `.squad/`, `.github/agents/squad.agent.md`,
Squad-generated skill directories under `.github/skills/`,
`.github/workflows/squad-*.yml`, `.github/workflows/sync-squad-labels.yml`,
`.mcp.json`, `.gitattributes`, and `.vscode/settings.json`.

The Squad source project is https://github.com/bradygaster/squad and its
generated material is distributed under MIT. Historical charter files in Git
history also separately identify `msitarzewski/agency-agents` (MIT) in their
file headers. Preserve upstream notices and attribution if copying or
redistributing historical Squad files from earlier commits.

MIT License

Copyright (c) 2026 Brady Gaster and contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Microsoft Cloud Solution Architect skill

- Source: https://github.com/microsoft/skills
- Revision: `6a2bf7b76bb2f3a24ebe18c95d6fce9ca6417326`
- Source path: `.github/skills/cloud-solution-architect/`
- Redistributed path: `.github/skills/cloud-solution-architect/`
- License: MIT
- Local modifications: none

MIT License

Copyright (c) Microsoft Corporation.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## ModelContextProtocol C# SDK and Microsoft.Extensions.AI NuGet references

`scripts/mcp/JamulaMcp.csproj` references NuGet packages restored at build time
(not vendored into Git source):

- `ModelContextProtocol.AspNetCore` `2.4.0` (`https://github.com/modelcontextprotocol/csharp-sdk`, MIT License)
- `Microsoft.Extensions.AI.Abstractions` `11.0.1` (`https://github.com/dotnet/extensions`, MIT License)

## Playwright and axe-core test-only npm devDependencies

`www/package.json` references test-only npm `devDependencies` installed at CI
validation time and never bundled or shipped in `www/dist`:

- `playwright` / `playwright-core` `1.65.1` (`https://github.com/microsoft/playwright`, Apache-2.0)
- `@axe-core/playwright` `4.14.0` and `axe-core` (`https://github.com/dequelabs/axe-core-npm` and `https://github.com/dequelabs/axe-core`, MPL-2.0; used unmodified in CI accessibility verification)
