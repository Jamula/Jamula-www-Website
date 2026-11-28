---
name: cloud-hosting-and-cost-evaluation
description: Hosting, DNS, CI/CD, portability, sustainability, and cost evaluation.
---

# Cloud Hosting and Cost Evaluation

- Compare free, lean, Azure-aligned, and growth scenarios with shared numeric workloads.
- Include monthly, first-year, and three-year fixed, usage, labor, migration, verification, support, tax, renewal, and overage ranges.
- Document commercial-use limits, overage behavior, alert/cap/kill switch, owner, degraded mode, recovery, and test evidence.
- Evaluate registrar, DNS, TLS, transactional/workforce email, DNSSEC/CAA, SPF/DKIM/DMARC, MTA-STS/TLS-RPT, recovery, and rollback separately.
- `main` alone deploys production; PRs validate and may create ephemeral previews. Keep workflow YAML thin and delegate verification, retry, and release gates to tested `.github/scripts/*.mjs` or `.NET 11` modules tracked in `scripts/coverage/inventory.json`.
- Define a portability contract and representative artifact before testing.
- Evaluate resource efficiency and vendor sustainability evidence without accepting marketing claims as proof.
