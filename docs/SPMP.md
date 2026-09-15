# Software Project Management Plan (SPMP)

Project: LLL Print
Status: Draft
Last updated: 2026-09-09

## 1. Introduction

### 1.1 Project Overview

LLL Print is an original, independent web product for Malaysian
print-shop operations. It provides one responsive operational workspace,
usable across office desktop, supervisor tablet, and factory-floor
mobile contexts, to replace manual, chat-based order handling with a
structured quotation and job-tracking workflow. Full product context,
scope, and requirements are detailed in `docs/SRS.md`.

The product centres on three everyday questions: what did the customer agree
to, what needs producing next, and what is still unpaid? Its intended value is
clear handoffs, dependable quantities and money, and usable production views
on a phone. This is a product direction to validate, not a measured claim of
speed or superiority.

Read the three documents in this order:

| Document | Question it answers |
|---|---|
| SPMP | What are we doing now, and what comes next? |
| SRS | Who uses the system, how does an order move through it, and what must happen? |
| SDD | How will the code, data and security responsibilities support those requirements? |

### 1.2 Problem Statement

**Ideal situation:** A print shop can take an order, turn it into an
accurate quotation in minutes, track its production stage in one place,
and let staff see all current orders and their status without digging
through chat history.

**Current gaps:** Today, orders are received and negotiated entirely
through informal chat (e.g. WhatsApp) — a customer describes the order,
quantity, and sizes in conversation, and staff manually re-write that
conversation into a quotation and job description by hand.

**Consequences:** This manual re-entry is slow and error-prone — wrong
quantity, size, or price mistakes happen because staff retype from memory
or chat instead of entering structured data. It also gives no way to
trace a quote back to the conversation it came from, and no shared view
of all current orders and their status.

### 1.3 Problem Solution

Candidate approaches considered:

- A structured quotation form that replaces free-text chat re-entry with
  itemized, priced line items.
- A shared job-tracking board so all current orders and their stage are
  visible in one place instead of scattered across chat threads.
- A source-of-enquiry field so a quote can always be traced back to the
  conversation it came from.

The confirmed direction (structured quotation + job-tracking workspace)
is detailed as functional requirements in `docs/SRS.md`.

### 1.4 Objectives

1. To analyze current print-shop order-intake and job-tracking workflows
   and the gaps caused by manual, chat-based handling.
2. To design a responsive quotation and job-tracking workspace usable
   across desktop, tablet, and mobile contexts.
3. To develop a frontend foundation demonstrating that workspace against
   the confirmed v1 scope.

### 1.5 Scopes

#### 1.5.1 Scope of the System

**In scope (v1):** Quotation form with explicit status lifecycle, job
tracking board, source-of-enquiry note, basic activity/audit log, visible
delivery status, manual invoice creation, confirmed payment marking,
Contacts/Inventory & BOM/Stock Ledger, basic role display, mobile
navigation fix, and responsive desktop/tablet/mobile support. Full list
with detail: `docs/SRS.md` § 2.

Billing planning now includes a manually issued full invoice after job
creation and confirmed deposits received before production. The remaining
balance stays in the same job billing record. The planning scope expanded on
2026-09-09 to include controlled invoice replacement, manually confirmed
refund records and cancellation settlement (SRS FR-7/FR-8). Original invoices,
receipts and refunds remain traceable. Actual transfers, formal credit notes
and automatic payment collection remain excluded; implementation is still
not authorized by this documentation task.

**Out of scope (deferred):** Customer-facing QR order/production status
tracking, AI-assisted features, a full accounting suite, enforced
multi-staff permissions, WhatsApp/payment-gateway integrations, platform
administration/multi-company management, and camera-based scanning. Full
list: `docs/SRS.md` § 3.

Production backend APIs/services, databases, production authentication,
infrastructure/deployment operations, and real file storage are also out
of scope for the current phase (see § 3.1 below).

**Planning boundary clarified 2026-09-08:** Current work is planning and
documentation only. Existing frontend code is a prototype to inspect, not
evidence that the planned workflows are complete. In these documents, **v1**
means the agreed frontend demonstration scope. A **real-data release** is a
later delivery stage requiring persistent storage, authentication,
server-enforced permissions and security verification. Deferring those
implementations does not make them optional for real business use.

#### 1.5.2 Coverage of the System

- **Location or area of the user:** Malaysia (Malaysian print-shop
  operations).
- **Language of the system:** English (`en-MY` locale), with MYR currency
  and `Asia/Kuala_Lumpur` timezone as defaults.
- **Users of the system:** Admin, Staff (operational workspace users,
  visually distinct in v1, not permission-enforced); Customer (no-login,
  QR-tracking view — deferred to a later phase). Full role detail:
  `docs/SRS.md` § 1.

## 2. Methodology

### 2.1 Software Model

The current phase (Phase 1A — Product and Frontend Foundation) follows an
iterative, evidence-gated approach: draft a decision → record it →
review it → move to the next dependent decision. Each step only proceeds
once its dependency is recorded, rather than committing to a full
up-front plan.

For subsequent development, finish one user journey at a time. Before coding
a journey, settle its fields, rules, screen states and acceptance checks in
the SRS and its implementation boundaries in the SDD. Review the working
journey before starting the next one. Do not build every screen independently
and postpone integration until the end.

Frontend and backend development follow the same SRS and SDD. Business rules
and interface changes are reviewed together before integration.

### 2.2 Software and Hardware Specification

#### Current platform and frontend

| Item | Specification |
|---|---|
| Operating System | Cross-platform (web-based) |
| Frontend | React, TypeScript, Vite, React Router, TanStack Query |

#### Planned later backend direction

| Area | Direction |
|---|---|
| Server | NestJS with Fastify |
| API | REST/OpenAPI |
| Database | PostgreSQL with Prisma |
| Background jobs | pg-boss |
| File/object storage | S3-compatible object storage |

These planned components are not yet built and are not authorized for the
current phase.

#### Target devices

| Item | Specification |
|---|---|
| Target devices | Office desktop, supervisor tablet, factory-floor mobile device |
| Display | Responsive layout required for all three device contexts |

## 3. Project Management Plan

### 3.1 Project Milestone

| Milestone | Result | Status |
|---|---|---|
| M1 | Foundation restored | Complete |
| M2 | Governance baseline | Complete |
| M3 | Prototype review | Complete |
| M4 | MVP baseline | Complete |
| M5 | SRS/SDD baseline completion | In progress |
| M6 | Phase 1A closure | Pending |

- **M2:** Product context was approved on 2026-08-30 and is now in
  `docs/SRS.md` § 1.
- **M3:** A review of LLL Print's own clickable prototype was carried out.
  The planned separate findings file was never written; its results were
  folded into `docs/SRS.md` section 2, including the mobile-navigation fix.
- **M4:** v1 scope was approved on 2026-08-30 and is now in
  `docs/SRS.md` §§ 2–3.
- **M5:** Scope expanded on 2026-09-08 to complete and review the SRS/SDD
  development baseline.

#### Next work and completion conditions

These are proposed delivery stages, not implementation authorization or
promised dates. No completion dates have been agreed for the pending stages.

| Stage | Work | Completion condition | Target date |
|---|---|---|---|
| Planning — current | Explain the product journey; settle the first slice's rules; document code boundaries and real-data security targets | The journey is understood, its open business decisions are answered, and requirements link to design and acceptance checks | To be agreed |
| Frontend foundation — later | Review existing local scaffold, define feature folders and mock-data behaviour, define the first frontend task | Routing and shared layout work; mock/API boundary is clear; relevant tests and build pass | To be agreed |
| First complete frontend journey — later | Customer selection → quotation → accepted quotation → job | Correct totals and quantities, rejected invalid transitions, recoverable failures, and usable desktop/tablet/mobile flow | To be agreed |
| Remaining frontend workflows — later | Job progress and history, billing/payments, then inventory/BOM/manual ledger | Each module passes its SRS acceptance checks before the next is treated as complete | To be agreed |
| Backend and integration — later | Implement backend modules from agreed API contracts; implement identity, persistence and server rules by journey | Frontend and backend pass contract, permission, transaction and end-to-end checks | To be agreed |
| Real-data readiness — later | Verify security targets, operational recovery and release configuration | Agreed security checks pass and a backup restore is demonstrated; unresolved release blockers are closed | To be agreed |

#### Batched development task plan

All tasks below are future work. The current planning batch documents the
journeys, design and checks together; coding starts only when the relevant
decisions are settled and implementation is requested. Task IDs are local
planning references, not created issues or completion claims.

| Task | Deliverable | Depends on | Completion evidence |
|---|---|---|---|
| T1 — Planning decisions | D1–D5 accepted and incorporated on 2026-09-09; business contracts and data constraints documented | Complete for this planning batch; overall documents remain Draft | Accepted rules, transition tables, contract fields and AT checks agree |
| T2 — Frontend preparation | Review existing scaffold and agree allowed feature files, synthetic fixtures and interfaces | T1 decisions needed for first journey; user implementation request | Reproducible setup, reviewed scope, foundation checks and build pass |
| T3 — Quotation and customer flow | Frontend: customer picker, quotation form/detail, totals and recoverable save states | T2; approved validation and contact contract | AT-01, applicable AT-06/AT-07 |
| T4 — Conversion and production | Frontend: revision/conversion, job board/detail and history | T3; D1/D2 and their contracts | AT-02/AT-03, applicable AT-06/AT-07 |
| T5 — Billing | Frontend: early invoice issue, deposits/later receipts, replacement review, manual refunds, cancellation settlement and history | T4; exact billing contract under SRS FR-7/FR-8 and SDD §5 | AT-04 plus correction/refund/settlement cases, applicable AT-06/AT-07; backend must verify AT-08 and transaction races |
| T6 — Inventory support | Frontend: contacts management, items, BOM and manual ledger | T2; D4 and related contracts | AT-05, applicable AT-06/AT-07 |
| T7 — Secure backend by journey | Identity/ownership first, then matching module APIs, constraints and transactions | Agreed contracts, D5/security design and explicit backend scope | Contract tests plus permission, transaction and concurrency checks; relevant AT-01–AT-08 |
| T8 — Integration and release review | Connect one frontend journey at a time, retire its mocks from connected mode, verify end-to-end and recovery | Corresponding frontend/backend tasks | Relevant AT checks against API; full AT-08 and release blockers closed before real-data use |

#### Ready-to-assign task briefs

These task briefs define implementation scope and completion criteria.
Inspect the existing working tree and preserve unrelated local changes.
Select the applicable brief, include the named SRS/SDD sections, and require a
reviewable diff and actual verification results before accepting completion.

| Brief | Allowed implementation scope when assigned | Required result and checks |
|---|---|---|
| Frontend — foundation (T2) | `src/app`, shared layout/navigation and synthetic data-adapter wiring; inspect existing scaffold before changing it | Five agreed destinations, demo reset notice, one adapter boundary; synthetic data only; no backend calls; navigation tests and build pass |
| Frontend — quotation slice (T3) | Contacts selector and `src/features/quotations`, pure calculation module, adapter fixtures and related tests | SRS FR-1/FR-4, SDD Contact/Quotation DTOs and AT-01/06/07. Incomplete draft survives failed save; decimal examples pass; no feature business logic added to App/PrototypeApp |
| Frontend — job slice (T4) | Quotation revision/conversion and `src/features/jobs` | FR-2/FR-3/FR-6 transition table; repeat conversion/stale version rejected; snapshots and mobile views verified with AT-02/03/06 |
| Frontend — billing slice (T5) | `src/features/billing`, mock Billing API and related tests | Full SDD billing contract, FR-7/FR-8, AT-04/04a/04b; distinguish actual receipts/refunds from promises; retain invoice history and prevent duplicate mock effects |
| Frontend — inventory slice (T6) | Contact management, `src/features/inventory` and adapters/tests | FR-9, Item/BOM/Movement DTOs; signed previews, immutable reversals, no automatic stock deduction; AT-05/06/07 |
| Backend — backend prerequisite (T7a) | Design/review login, session, membership and grants first; implementation only after that scope is assigned | Company-bound identity, explicit permissions, session revocation and negative access tests. Never deploy an unauthenticated business API as a placeholder |
| Backend — module slice (T7b) | One assigned module with controller, service/domain, persistence and tests in the later backend directory | Implement exact SDD contract and constraints, ownership checks, atomic history and idempotency; compare against frontend fixtures and relevant AT cases. Do not change frontend contract silently |

For each implementation task: state the task ID, allowed files, contract version
(2026-09-09), relevant FR/AT IDs and excluded work. Stop only the dependent
change if a contract conflict is discovered; report it rather than guessing.
Dependency changes, authentication, migrations and deployment require their
own implementation scope; they are not implied by a frontend task.

The next development step is frontend preparation (T2). Full backend readiness
still requires T7a and operational
security/recovery decisions. Do not call all production planning complete from
the business-contract baseline alone.

T3–T7 are divided into small reviewed changes against the same requirements
and contract baseline. T6 can
follow a different order after its dependencies are met. Backend work need
not wait for every frontend screen once the first contract is agreed.

The current planning batch is complete when the worked example, exception
recommendations, screen states, code boundaries and acceptance mapping are
consistent across the three documents. D1–D5 are now accepted. This is distinct
from completion of production design or permission to start coding.

Phase 1A explicitly excludes: production backend APIs/services,
databases/migrations/production data, production authentication,
infrastructure/deployment operations, real file storage, messaging/
payment/OCR/AI/accounting integrations, and any tax/accounting/PDPA/SST/
MyInvois/security/accessibility compliance claim. The current phase includes
completing and reviewing the SRS/SDD development baseline, but does not
authorize backend, database, infrastructure, authentication, dependency, or
deployment work (see `docs/SRS.md`, `docs/SDD.md`).
