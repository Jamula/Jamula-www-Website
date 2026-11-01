# Jamula Squad Team

> A small, cost-aware Star Trek-inspired team delivering the Jamula website from idea to production.

## Coordinator

| Name | Role | Notes |
|------|------|-------|
| Seven | Chief of Staff / Lead | Primary coordinator; turns priorities into owned work, routes and unblocks the team, enforces review and approval gates. Does not implement or produce project artifacts. |

## Members

| Name | Role | Charter | Status |
|------|------|---------|--------|
| Seven | Chief of Staff / Lead | `.squad/agents/seven/charter.md` | Active |
| Spock | Solution Architect & Implementation Engineer | `.squad/agents/spock/charter.md` | Active |
| Data | Code Reviewer | `.squad/agents/data/charter.md` | Active |
| Uhura | Technical Writer / Documentation | `.squad/agents/uhura/charter.md` | Active |

## On-Demand Support

These support roles are not routine project workers. Seven invokes them only when their bounded
responsibility or a required repository gate applies.

| Name | Role | When to use |
|------|------|-------------|
| Scribe | Decision Merger | Accepted durable decisions need to be merged from the state inbox. |
| Rai | Responsible AI Reviewer | A material responsible-AI or content-safety risk requires a bounded review. |
| Fact Checker | Verification | A claim, source, assumption, or consequential decision needs independent verification. |
| Ralph | Work Monitor | Cyrus explicitly requests a board scan or keep-working loop. |

## Project Context

- **Owner:** Cyrus
- **Project:** Jamula.net website and its repository
- **Stack:** Astro static website and GitHub Actions; follow `.github/copilot-instructions.md` for new tools and systems.
- **Description:** Deliver Jamula's public website while preserving product, privacy, security, accessibility, claims, cost, and production controls documented in `PRODUCT.md` and `docs/`.
- **Created:** 2026-11-01
