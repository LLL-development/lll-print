# LLL Print MVP Scope Baseline

## Document control

| Field | Value |
|---|---|
| Document ID | LLL-MVP-001 |
| Version | 1.0 |
| Status | Approved |
| Deliverable | SPMP P1A-D06 — MVP scope baseline |
| Approval authority | Product Owner |
| Approved by | Muflih (Product Owner / sole developer) |
| Approved on | 2026-08-30 |
| Last updated | 2026-08-30 |

This document defines what LLL Print's first buildable version (v1) includes
and excludes. It depends on the confirmed decisions in `PRODUCT_VISION.md`,
the dispositioned findings in `tasks/260830_prototype_review.md`, and the
black-box design lessons in `REFERENCE_TECHNICAL_OBSERVATIONS.md` (sections
20–23). Approving this document does not authorize implementation by itself —
implementation still requires the separate SRS/SDD planning authorization
(SPMP deliverable P1A-D07).

## In scope for v1

1. **Quotation form** — customer picker, structured item list, pricing,
   tax. Item rows must count as soon as they are filled in — no separate
   hidden "confirm" step (fixes the mis-pricing risk found in
   `REFERENCE_TECHNICAL_OBSERVATIONS.md` §22.2).
2. **Explicit quotation status lifecycle** — draft → sent →
   accepted/declined → converted-to-job. Not a single paid/unpaid flag
   (fixes the design gap in §20.7).
3. **Job tracking board** — all jobs, current production stage, due date,
   status, matching the confirmed MVP order in `PRODUCT_VISION.md`.
4. **Source-of-enquiry note** — a free-text field on each quotation
   recording where the order came from (e.g. "WhatsApp, 28 Aug"). Directly
   addresses the core problem: no current way to trace a quote back to the
   conversation it came from.
5. **Basic activity/audit log** — records who changed what, and when, on
   quotations and jobs. Low effort given the `AUDIT_LOG` table already
   planned in the architecture research; directly supports the "hard to
   deal with customer disputes" problem.
6. **Visible delivery status** — a real, visible status on the job board,
   not hidden metadata (fixes the gap found in §23.6).
7. **Manual invoice creation** — a separate, deliberate step from "job
   production complete," not automatically coupled (fixes §22.5/§23 finding
   1... see summary table in §23.9).
8. **Payment marking with confirmation** — recording a payment requires
   confirming amount/date, not a single unconfirmed click (fixes §23.4).
9. **Contacts (customers/suppliers), Inventory & BOM, Stock Ledger** — the
   current prototype screens, refined per the confirmed roles.
10. **Basic roles reflected in the UI** — Owner, Admin, Designer, at least
    visually distinct even if permission enforcement is not fully built yet.
11. **Mobile navigation fix** — 5-icon bottom nav with no overlap on the
    dashboard stats (fixes the bug found during the M3 prototype review).
12. **Responsive desktop/tablet/mobile support** for all of the above, per
    the confirmed product principle.

## Explicitly out of scope for v1 (deferred, later authorized phase)

- Customer-facing QR order/production status tracking (needs a real
  backend; confirmed future goal in `PRODUCT_VISION.md`)
- Any AI-assisted features (planning, rescue plans, translation). If added
  in a later phase, must never present fabricated specifics as fact — see
  the hallucination finding in §23.8, and must be schema-validated with
  required user confirmation before any result is applied.
- Full accounting suite (P&L, balance sheet, trial balance, tax filings)
- Enforced multi-staff permissions (per-stage staff assignment is a good
  pattern noted in §23.5, but not required for v1)
- WhatsApp/payment-gateway integrations
- Platform administration / multi-company management
- Camera-based scanning (job identification, universal asset lookup) — if
  added later, hardware-permission failures must be contained to the
  requesting feature and must never crash the whole application (see the
  reproducible crash defect in §23.3)

## Acceptance

Approved on 2026-08-30 by the Product Owner. This satisfies SPMP deliverable
P1A-D06. Work may now proceed toward P1A-D07 (SRS/SDD planning
authorization) and eventually M6 (Phase 1A closure).
