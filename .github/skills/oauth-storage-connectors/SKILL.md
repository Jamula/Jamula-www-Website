---
name: oauth-storage-connectors
description: OneDrive, Google Drive, and Box OAuth evaluation and security controls.
---

# OAuth Storage Connectors

- Approve test accounts/tenants, registrations, consent authority, terms, credentials, spend, verification dependencies, and teardown before a spike.
- Use minimum scopes, Authorization Code with PKCE, state/nonce, exact redirects, login-CSRF/account-linking defenses, encrypted server-side tokens, key separation, rotation/revocation, and validated webhooks.
- Enforce tenant/account linking, audit, file limits, malware responsibility, cache/metadata rules, and data residency.
- Reconcile permission changes with webhooks plus periodic scans; set maximum staleness, fail closed, invalidate previews/embeddings/indexes, and propagate deletion.
- Preview may expose passing providers; Phase 3 GA requires OneDrive, Google Drive, and Box.
- Accept executed spike evidence or a standardized blocked packet; never weaken a gate to claim support.
