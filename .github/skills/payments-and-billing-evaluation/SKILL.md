---
name: payments-and-billing-evaluation
description: Phase 4 hosted payment, billing, security, cost, and compliance evaluation.
---

# Payments and Billing Evaluation

- Scope: invoices, deposits/milestones, recurring retainers/subscriptions, receipts, payment history, retries, cancellation, refunds, disputes, and reconciliation.
- Prefer provider-hosted checkout/customer portals; Jamula must not store, process, or log raw card data.
- Evaluate cards, ACH, wallets, fees, FX, payout delays, reserves, disputes, tax tooling, accounting integration, and lock-in.
- Require signed/replay-resistant webhooks, idempotency, tenant isolation, immutable financial audit events, fraud/rate controls, key separation, and environment isolation.
- Define processor, CRM, accounting, bank, and portal systems of record; the website is not the financial ledger.
- Route PCI, tax/nexus, revenue recognition, auto-renewal, refund, assent, sanctions/KYC, and insurance questions to qualified professionals.
- Do not connect a payment MCP or live provider until selection, provenance/permissions review, test mode, and Cyrus approval.
