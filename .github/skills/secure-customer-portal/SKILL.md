---
name: secure-customer-portal
description: Multi-tenant portal identity, authorization, audit, and operational security.
---

# Secure Customer Portal

- Use immutable tenant context, deny-by-default authorization, tenant-enforced data access, tenant-scoped caches/indexes/keys, and cross-tenant IDOR tests.
- Mandate phishing-resistant MFA for privileged users and step-up authentication for exports and connector/payment changes.
- Cover invitations, membership, tenant switching, domain claims, recovery, identity linking/collision, offboarding, support access, and break-glass.
- Pin OWASP ASVS, Web/API Top 10, and OAuth BCP versions; map controls to future tests.
- Define secrets, encryption, audit integrity, detection/response, immutable backups, RPO/RTO, vulnerability disclosure, and incident communication.
- Fail closed on ambiguous tenant, revoked permission, expired consent, or unavailable policy enforcement.
