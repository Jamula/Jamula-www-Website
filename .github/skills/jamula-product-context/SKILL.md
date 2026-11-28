---
name: jamula-product-context
description: Jamula website goals, roadmap, decision boundaries, and approval gates.
---

# Jamula Product Context

- Directly serve `jamula.net`, `www.jamula.net`, `jamula.com`, and
  `www.jamula.com` over HTTPS. `jamula.net` is canonical for indexing; HTTP
  upgrades to HTTPS on the same hostname while preserving path and query.
- Company: AI-native technology consulting and custom software; Microsoft-preferred, multi-cloud capable.
- Cost posture: genuinely free first only when commercially permitted, secure, credible, and portable.
- Phase 1: public site, contact, social, GitHub, content, analytics/consent.
- Phase 2: CRM, lead follow-up, M365/Teams/Zoom scheduling.
- Phase 3: authenticated portal, OneDrive/Google Drive/Box, read-only customer AI. Preview may use passing connectors; GA requires all three.
- Phase 4: invoices, deposits, recurring retainers/subscriptions through hosted payment flows.
- Phase 5 candidate: public AI after customer AI proves safe, useful, and controlled.
- Engineering toolchain baseline: Python-free repository standardized on `.NET 11` (`net11.0` via root `global.json`, `Directory.Build.props`, and `Jamula.slnx`) and `Node.js` ES modules (`.mjs` / `.ts` plus browser `.js`; no `.cjs`), with thin CI workflows delegating logic to tested, coverage-inventoried modules.
- `main` is the only persistent branch and production CI/CD source.
- GitHub issues are the durable ledger; `docs/` is the project documentation source.
- Cyrus approves role ownership, product decisions, public wording, and exact top-level PR SHAs.
