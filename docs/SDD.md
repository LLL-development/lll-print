# Software Design Document (SDD)

Project: LLL Print
Status: Draft — the current phase includes completing and reviewing the SDD
development baseline; it remains Draft until accepted.
Last updated: 2026-09-08

This document describes how the system specified in `docs/SRS.md` is
designed. It may describe the planned modular-monolith direction and the
technologies named in `docs/SRS.md` § 1 "Current technical direction" as
**design intent only**. It does not authorize creating backend services,
databases, infrastructure, or dependencies.

## 1. Purpose and scope

- Describes the design for LLL Print v1 derived from `docs/SRS.md`, for
  anyone implementing or reviewing work against the agreed v1 scope.
- The current phase may define concrete API contracts and database schemas as
  design artifacts. It does not authorize backend implementation, database
  creation, infrastructure, dependency, or deployment work (see § 8).
- The current phase may document the traceability chain through planned API
  operations, data ownership, and transaction boundaries. Acceptance-test
  mapping remains a documentation task; none of these design artifacts
  authorize implementation.

## 2. Architecture overview

| Layer | Current state (already present in repo) | Planned (design intent, not authorized to build) |
|---|---|---|
| Frontend | React, TypeScript, Vite, React Router, TanStack Query (SRS § 1) | Same — this is the confirmed frontend foundation |
| Backend | None | NestJS with Fastify, REST/OpenAPI |
| Database | None | PostgreSQL, Prisma |
| Background jobs | None | pg-boss |
| File/object storage | None | S3-compatible object storage |
| System shape | Single frontend prototype | Modular monolith, single-company launch, tenant-ready ownership boundaries |

Nothing in the "Planned" column is authorized for implementation by this
document. It exists so the frontend design below is not built in a way
that forecloses the planned backend shape.

The frontend is organized as a modular-monolith-aligned single-page
application:

- `src/app/` — application shell concerns: routing (`AppRouter.tsx`,
  `routes.tsx`), data-fetching provider (`QueryProvider.tsx` wrapping
  TanStack Query).
- `src/components/layout/` — shared layout components (e.g. `AppShell.tsx`)
  used across routes, supporting the responsive desktop/tablet/mobile
  requirement (NFR-1).
- `src/lib/` — cross-cutting utilities not tied to one feature (e.g.
  `formatters.ts` for MYR/`en-MY`/`Asia/Kuala_Lumpur` formatting, NFR-2).
- Feature areas map 1:1 to the functional requirement groups in
  `docs/SRS.md` section 4 (quotations, jobs, contacts, inventory/BOM,
  stock ledger), so each planned backend module (§ 3) has a corresponding
  frontend feature area, keeping the modular-monolith boundary consistent
  across layers.

Routing and data-fetching (React Router, TanStack Query) are already part
of the confirmed frontend foundation (SRS § 1) and are reflected in the
current `src/app/` scaffolding; the above describes their intended
organization, it does not authorize new frontend dependencies beyond what
is already confirmed.

### Design rationale

The frontend's feature-area structure was chosen to mirror the planned
backend module boundaries (§ 3) one-to-one, so that when a backend is
later authorized, each frontend feature area has an obvious corresponding
module to integrate against rather than requiring a frontend
reorganization first. Billing is kept as a module separate from Jobs
specifically so invoice creation stays a distinct step from job
completion (FR-7.2) rather than an implicit side effect of the Jobs
module.

## 3. Module / component breakdown

Mapped from `docs/SRS.md` functional requirements to planned modular-
monolith modules. No backend module listed here exists yet; this is a
target shape for a later, separately authorized implementation phase.

| Module | Covers (SRS requirement IDs) | Notes |
|---|---|---|
| Quotations | FR-1, FR-2, FR-4 | Owns quotation lifecycle and source-of-enquiry note. |
| Jobs | FR-3, FR-6 | Owns job stage tracking and delivery status. |
| Billing | FR-7, FR-8 | Owns manual invoice creation and confirmed payment marking; deliberately separate from Jobs so invoice creation stays a distinct step (FR-7.2). |
| Contacts | FR-9.1 | Customers/suppliers. |
| Inventory | FR-9.2, FR-9.3 | BOM and stock ledger. |
| Audit | FR-5 | Cross-cutting: records changes from Quotations, Jobs, Billing modules. |
| Identity/Roles | FR-10 | v1 scope is UI-only role display for Admin and Staff; no enforcement logic is planned. A future authorized phase would keep Admin business-level access and configure each Staff account's module actions individually (SRS §2, §6). |

Each planned backend module would expose REST/OpenAPI operations and own its
PostgreSQL/Prisma schema slice, consistent with "tenant-ready ownership
boundaries" (SRS § 1). Identity/Roles remains a frontend-only display concern
for v1, as recorded in § 8.

## 4. Data design

This section defines the core planned data model as a design artifact only.
It does not authorize a database, API, schema migration, or implementation.
Field names below express intended data ownership and integrity rules; exact
types, indexes, constraints, and API contracts remain to be specified in the
next approved design pass.

### Sales and Jobs

| Entity | Core key fields | Relationships and historical-data rule |
|---|---|---|
| **Contact** | `contact_id`; `contact_type` (customer or supplier); `display_name`; `phone`; `email`; `address`; `internal_notes` | A customer Contact may have many Quotations and Jobs. A supplier Contact may be linked to many Inventory Items. Each Contact must have a display name and at least one of phone or email (FR-9.5). |
| **Quotation** | `quotation_id`; `quotation_number`; `customer_contact_id`; `revision_number`; `previous_quotation_id`; `status`; `source_of_enquiry_note`; `due_date`; `subtotal`; `discount_amount`; `tax_rate`; `tax_amount`; `grand_total`; `notes` | One Quotation has many Quotation Lines. A sent or accepted Quotation is not edited directly: a linked draft revision is created instead (FR-2.6–FR-2.8). Only the latest accepted revision may create one Job. |
| **Quotation Line** | `quotation_line_id`; `quotation_id`; `line_number`; `description`; `quantity`; `unit`; `unit_price`; `line_total` | Belongs to one Quotation. Its positive quantity is the ordered number of finished items or service units and contributes to the quotation totals (FR-1.10–FR-1.12). |
| **Job** | `job_id`; `job_number`; `source_quotation_id`; `customer_contact_id`; `status`; `production_stage`; `delivery_status`; `due_date`; `cancellation_reason`; `rework_reason`; `quotation_snapshot` | One Job is created from one accepted Quotation revision. The Job stores a snapshot of the agreed customer, lines, quantities, prices, tax, totals, source-of-enquiry note, and relevant notes, so later quotation revisions do not alter historical job data (FR-3.3). A Job has many Job Lines and at most one Invoice in v1. |
| **Job Line** | `job_line_id`; `job_id`; `source_quotation_line_id`; `line_number`; `description`; `quantity`; `unit`; `unit_price`; `line_total` | Belongs to one Job and is copied from the accepted Quotation Line at conversion. The stored values form part of the Job snapshot and are not recalculated from later quotation changes. |

### Billing

| Entity | Core key fields | Relationships and historical-data rule |
|---|---|---|
| **Invoice** | `invoice_id`; `invoice_number`; `job_id`; `customer_contact_id`; `issued_at`; `due_date`; `payment_status`; `subtotal`; `discount_amount`; `tax_rate`; `tax_amount`; `grand_total`; `remaining_balance`; `job_snapshot` | Belongs to exactly one Job; each Job may have zero or one Invoice in v1 (FR-7.7). One Invoice has many Invoice Lines and many Payments. On creation, it stores its own customer and commercial snapshot; issued values are not editable or deleted in v1 (FR-7.4–FR-7.5). |
| **Invoice Line** | `invoice_line_id`; `invoice_id`; `source_job_line_id`; `line_number`; `description`; `quantity`; `unit`; `unit_price`; `line_total` | Belongs to one Invoice. Values are copied into the Invoice snapshot when the invoice is created and remain historical even if the related Job or Quotation changes later. |
| **Payment** | `payment_id`; `invoice_id`; `amount`; `payment_date`; `payment_method`; `payment_method_note`; `status`; `void_reason`; `voided_at` | Many Payments may belong to one Invoice. A payment is recorded only after amount/date confirmation; it is not edited or deleted. Voiding retains the payment record and requires a reason (FR-8). Non-voided payment amounts determine the Invoice’s unpaid, partially paid, or paid status and remaining balance. |

### Inventory and history

| Entity | Core key fields | Relationships and historical-data rule |
|---|---|---|
| **Inventory Item** | `inventory_item_id`; `name`; `unit_of_measure`; `custom_unit_label`; `category`; `supplier_contact_id`; `current_balance` | May be linked to one supplier Contact and may have many Stock Movements and BOM Components. Its unit cannot change after Stock Movements exist; `other` requires a custom unit label (FR-9.12–FR-9.14). |
| **Stock Movement** | `stock_movement_id`; `inventory_item_id`; `movement_type`; `quantity`; `movement_date`; `reason`; `actor_label`; `resulting_balance`; `reversal_of_stock_movement_id` | Many Stock Movements belong to one Inventory Item. Posted movements are not edited or deleted; a correction is represented by a linked reversal or adjustment. v1 allows only manual stock-in, stock-out, and adjustment movements; Job completion and BOM editing do not create movements (FR-9.8–FR-9.11, FR-9.17–FR-9.18). |
| **BOM** | `bom_id`; `name`; `notes` | One BOM has many BOM Components. It describes a finished print item or job item and may be edited in v1 because automatic stock deduction is out of scope. |
| **BOM Component** | `bom_component_id`; `bom_id`; `inventory_item_id`; `quantity_per_finished_unit`; `unit_of_measure` | Belongs to one BOM and references one Inventory Item. Its quantity must be positive and use the referenced item’s unit of measure (FR-9.15–FR-9.16). |
| **Activity History** | `activity_history_id`; `subject_type`; `subject_id`; `action`; `changed_information`; `previous_status`; `next_status`; `actor_label`; `occurred_at`; `reason` | Records required activity for Quotations, Jobs, and Payments. In v1, `actor_label` is the current in-app role/profile label only; it is not secure identity attribution (FR-5.1–FR-5.3). |

### Core relationship summary

- Contact (customer) → many Quotations and Jobs.
- Quotation → many Quotation Lines; accepted latest revision → zero or one Job.
- Job → many Job Lines; Job → zero or one Invoice.
- Invoice → many Invoice Lines and many Payments.
- Inventory Item → many Stock Movements and many BOM Components.
- BOM → many BOM Components.
- Activity History may reference a Quotation, Job, or Payment through
  `subject_type` and `subject_id`.

The planned document snapshots are intentionally separate from live Contact,
Quotation, and Job records. This preserves what was agreed, produced, and
invoiced at the time of each business step.

### Core integrity rules

| Rule | Applies to | Design intent |
|---|---|---|
| Exact commercial calculations | Quotation, Quotation Line, Job, Invoice, Invoice Line, Payment | Calculate authoritative money values using decimal-safe arithmetic and the SRS calculation order. Do not use binary floating-point values for authoritative totals (FR-1.10). |
| Historical snapshots | Quotation, Job, Invoice and their Lines | Preserve accepted quotation values in the Job snapshot and issued Job values in the Invoice snapshot. Later edits or revisions must not rewrite historical Job or Invoice data (FR-2.6–FR-2.8, FR-3.3, FR-7.4–FR-7.5). |
| Explicit lifecycle changes | Quotation, Job, Payment | Apply only the permitted SRS lifecycle transitions. A cancellation, rework, or payment void requires its stated reason and creates an Activity History entry (FR-2, FR-3, FR-8). |
| One Invoice per Job | Job, Invoice | A Job may have zero or one Invoice in v1. Invoice creation must reject a second Invoice for the same Job (FR-7.7). |
| Payment-derived status | Invoice, Payment | Record each Payment separately. Determine Invoice payment status and remaining balance from non-voided Payments; do not use a standalone paid checkbox (FR-8.5–FR-8.13). |
| Immutable posted stock history | Inventory Item, Stock Movement | A posted Stock Movement is never edited or deleted. Corrections use a linked reversal or adjustment; each posting must retain its resulting balance (FR-9.8–FR-9.11). |
| No automatic BOM consumption in v1 | Job, BOM, Inventory Item, Stock Movement | Creating/editing a BOM and completing a Job must not create Stock Movements in v1. Stock changes are manual Ledger postings only (FR-9.10, FR-9.17–FR-9.18). |
| Activity-history limits | Activity History | Record the current in-app role/profile label, time, action, subject, changed information, and required reason for Quotation, Job, and Payment events. Do not present this v1 record as secure identity attribution (FR-5). |

### Data representation conventions

These conventions are planned data-design guidance only. They do not
authorize a database schema, migration, or implementation.

- Use UUIDs as record identifiers. Use separate human-readable numbers for
  Quotations, Jobs, and Invoices.
- Store authoritative money and quantity values with decimal-safe precision;
  never use binary floating point. Display MYR values to two decimal places
  using the approved half-up rounding rule (FR-1.10).
- Store timestamps in UTC and display them using `Asia/Kuala_Lumpur`. Treat
  quotation due dates, invoice due dates, and payment dates as local calendar
  dates.
- Retain historical issued-document snapshots, Payments, posted Stock
  Movements, and Activity History rather than silently editing or deleting
  them.
- The planned company ownership field (for example, `company_id`) remains an
  open design decision. It is not added to the core entity model in this
  baseline.

## 5. Interface design

### API shape

Planned REST/OpenAPI operations only. No endpoint paths, request/response
schemas, or implementation are authorized in this phase.

#### Sales and Jobs

| Operation | SRS link | Records | Must ensure |
|---|---|---|---|
| Create/revise/send/accept/decline quotation (Quotations) | FR-1, FR-2, FR-4 | Quotation, Quotation Line, Activity History | Validate and calculate values. A sent/accepted change creates a linked draft revision and activity entry. |
| Convert accepted quotation to Job (Quotations + Jobs) | FR-2.3–FR-2.8, FR-3.3 | Quotation, Job, Job Line, Activity History | Verify the latest accepted revision; create the Job snapshot/lines, mark conversion, and record activity together. |
| Update Job lifecycle, delivery, or production stage (Jobs) | FR-3, FR-6 | Job, Activity History | Allow only permitted transitions; require cancellation/rework reason where applicable and record activity. |

#### Billing and Activity History

| Operation | SRS link | Records | Must ensure |
|---|---|---|---|
| Create Invoice for Job (Billing) | FR-7 | Job, Invoice, Invoice Line | Job is ready/delivered and has no Invoice; create one Invoice snapshot and its lines together. |
| Record or void Payment (Billing) | FR-8 | Payment, Invoice, Activity History | Confirm details; prevent overpayment; recalculate balance/status. A void retains its Payment, requires a reason, and records the required activity. |
| Retrieve Activity History (Audit) | FR-5 | Activity History | Return Quotation, Job, and Payment entries by affected record/time, using the in-app label only—not secure identity attribution. |

#### Contacts and Inventory

| Operation | SRS link | Records | Must ensure |
|---|---|---|---|
| Manage Contacts (Contacts) | FR-9.1, FR-9.4–FR-9.6 | Contact | Validate a display name and at least one contact method before saving. |
| Manage Inventory Items and BOMs (Inventory) | FR-9.2, FR-9.7, FR-9.12–FR-9.18 | Inventory Item, BOM, BOM Component | Validate units and positive component quantities. BOM changes do not post stock in v1. |
| Post manual Stock Movement or correction (Inventory) | FR-9.3, FR-9.8–FR-9.11 | Stock Movement, Inventory Item | Validate item/unit and non-negative balance; use linked reversal/adjustment, never edit/delete. |

These operations describe intended ownership and integrity boundaries only.
They do not authorize implementing REST endpoints, an OpenAPI file,
database transactions, or backend services.
- **UI/UX** — each major SRS flow is handled by the frontend feature area
  matching its module in § 3 (e.g. the quotation flow in the Quotations
  feature area, job tracking in the Jobs feature area). No separate
  mockups/wireframes exist outside the current prototype UI.

## 6. Non-functional design notes

- NFR-1 (responsive support): addressed at the frontend layer only (§ 2);
  no backend design implication.
- NFR-2 (localization): addressed via `src/lib/formatters.ts` (already
  present) using MYR/`en-MY`/`Asia/Kuala_Lumpur` defaults; a planned
  backend would need equivalent server-side defaults, not specified here.

## 7. Out of scope for this design

Per `docs/SPMP.md` § 3.1 and `docs/SRS.md` section 3, this SDD does not
design: QR customer tracking, AI-assisted features, full accounting,
enforced multi-staff permissions, WhatsApp/payment-gateway integrations,
platform administration, or camera-based scanning. These remain deferred
to a later, separately authorized phase.

## 8. Open items

- Core entity relationships, key fields, integrity rules, data-representation
  conventions, and planned operation/transaction boundaries are documented in
  §§ 4–5. Remaining design work: endpoint paths, request/response schemas,
  error conventions, exact database constraints/indexes, and implementation
  details.
- **Decided 2026-09-02:** Identity/Roles stays a frontend-only display
  concern for v1 (no backend module), matching FR-10 — enforcement is not
  required for v1 per `docs/SRS.md` § 2 item 10. The planned module table in
  § 3 lists it for future reference only; nothing under it is authorized
  to be built for v1.
- Cross-cutting acceptance checks are documented in SRS § 4. Full traceability
  links from requirements through planned operations, transactions, and final
  acceptance tests remain a later documentation task.
- **Open:** The planned company ownership field (for example, `company_id`)
  and its cross-record isolation rules remain undecided. This must be decided
  before a production database schema or multi-company capability is designed.
