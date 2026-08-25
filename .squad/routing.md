# Work Routing

## Routing Table

<!-- route:jean-luc-picard=architecture,adr,scope,priority,strategy,cost,roadmap -->
<!-- route:jadzia-dax=design,ux,ui,accessibility,seo,layout,brand,responsive -->
<!-- route:nyota-uhura=content,copy,social,multimedia,video,audio,linkedin,medium,whatsapp,case study,founder -->
<!-- route:geordi-la-forge=framework,hosting,deploy,ci,dns,wordpress,wix,webflow,cloud,api,backend -->
<!-- route:seven-of-nine=auth,authentication,identity,privacy,data,crm,onedrive,google drive,box,oauth,ai,portal,storage -->
<!-- route:miles-obrien=test,security,reliability,performance,incident,backup,restore,quality -->
<!-- route:sarek=legal,license,trademark,contract,tax,compliance,terms,insurance,regulator -->

| Work Type | Author | Required reviewers |
|-----------|--------|--------------------|
| Product scope, priorities, ADR synthesis, cost tradeoffs | Jean-Luc Picard | Fact Checker; relevant domain owner; Cyrus for gates |
| UX, brand, information architecture, accessibility, SEO | Jadzia Dax | Miles O'Brien; Nyota Uhura |
| Editorial, multimedia, social, case studies, public copy | Nyota Uhura | Jadzia Dax; Sarek; Rai; Fact Checker |
| Framework, Wix/WordPress, hosting, CI/CD, DNS, observability | Geordi La Forge | Miles O'Brien; Fact Checker |
| Identity, CRM data, privacy, portal, storage connectors, AI | Seven of Nine | Miles O'Brien; Sarek; Rai |
| Threat modeling, testing, performance, reliability, release readiness | Miles O'Brien | Relevant author; Fact Checker |
| Washington/federal/global legal issue spotting, IP, contracts, licensing | Sarek | Fact Checker; qualified professional when gated |
| Session logging and decision consolidation | Scribe | Coordinator |
| Work queue, dependency and cleanup monitoring | Ralph | Coordinator |
| Responsible AI, ethics, social/environmental impact | Rai | Sarek; Fact Checker |
| Claims, sources, prices, limits, contradiction review | Fact Checker | Domain owner |

## Issue Labels

| Label | Owner |
|-------|-------|
| `squad` | Jean-Luc Picard triages |
| `squad:jean-luc-picard` | Jean-Luc Picard |
| `squad:jadzia-dax` | Jadzia Dax |
| `squad:nyota-uhura` | Nyota Uhura |
| `squad:geordi-la-forge` | Geordi La Forge |
| `squad:seven-of-nine` | Seven of Nine |
| `squad:miles-obrien` | Miles O'Brien |
| `squad:sarek` | Sarek |
| `squad:copilot` | @copilot for approved implementation tasks |

## Rules

1. GitHub issues are the durable work ledger; no independently owned work starts without one.
2. Cyrus approves the issue DAG, RACI, exclusive author paths, and merge order before parallel work.
3. Use isolated worktree sessions for independent work and the coordinator's execution-time model/settings unless Cyrus approves a deviation.
4. One author owns each artifact. Other members review; they do not edit the same path concurrently.
5. Scribe consolidates shared decisions; accepted decisions are promoted into indexed `docs/` artifacts.
6. Agent Merge may drive authorized readiness work but never bypass SHA-bound approval or merge by itself.
7. Archive sessions and remove worktrees/branches only after status, commits, artifact disposition, and teardown are recorded.
8. `main` is the only persistent branch and production CI/CD source.
