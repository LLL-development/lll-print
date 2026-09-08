# Software Project Management Plan (SPMP)

Project: LLL Print
Status: Draft
Last updated: 2026-09-08

## 1. Introduction

### 1.1 Project Overview

LLL Print is an original, independent web product for Malaysian
print-shop operations. It provides one responsive operational workspace,
usable across office desktop, supervisor tablet, and factory-floor
mobile contexts, to replace manual, chat-based order handling with a
structured quotation and job-tracking workflow. Full product context,
scope, and requirements are detailed in `docs/SRS.md`.

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

**Out of scope (deferred):** Customer-facing QR order/production status
tracking, AI-assisted features, a full accounting suite, enforced
multi-staff permissions, WhatsApp/payment-gateway integrations, platform
administration/multi-company management, and camera-based scanning. Full
list: `docs/SRS.md` § 3.

Production backend APIs/services, databases, production authentication,
infrastructure/deployment operations, and real file storage are also out
of scope for the current phase (see § 3.1 below).

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

Phase 1A explicitly excludes: production backend APIs/services,
databases/migrations/production data, production authentication,
infrastructure/deployment operations, real file storage, messaging/
payment/OCR/AI/accounting integrations, and any tax/accounting/PDPA/SST/
MyInvois/security/accessibility compliance claim. The current phase includes
completing and reviewing the SRS/SDD development baseline, but does not
authorize backend, database, infrastructure, authentication, dependency, or
deployment work (see `docs/SRS.md`, `docs/SDD.md`).
