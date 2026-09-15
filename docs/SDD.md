# Software Design Document (SDD)

Project: LLL Print
Status: Draft — the current phase includes completing and reviewing the SDD
development baseline; it remains Draft until accepted.
Last updated: 2026-09-09

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

| Layer | Current local working state | Planned (design intent, not authorized to build) |
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

The following frontend foundation exists locally. As inspected on
2026-09-08, the routing/provider scaffolding, layout and formatter files are
uncommitted; this does not describe a completed or delivered architecture.
Feature separation below is a target for later implementation:

- `src/app/` — application shell concerns: routing (`AppRouter.tsx`,
  `routes.tsx`), data-fetching provider (`QueryProvider.tsx` wrapping
  TanStack Query).
- `src/components/layout/` — shared layout components (e.g. `AppShell.tsx`)
  used across routes, supporting the responsive desktop/tablet/mobile
  requirement (NFR-1).
- `src/lib/` — cross-cutting utilities not tied to one feature (e.g.
  `formatters.ts` for MYR/`en-MY`/`Asia/Kuala_Lumpur` formatting, NFR-2).
- Feature areas group related user tasks (quotations, jobs, billing,
  contacts and inventory). A feature may cover several SRS requirement
  groups; frontend screens do not need a one-to-one correspondence with
  backend endpoints.

Routing and data-fetching (React Router, TanStack Query) are already part
of the confirmed frontend foundation (SRS § 1) and are reflected in the
current `src/app/` scaffolding; the above describes their intended
organization, it does not authorize new frontend dependencies beyond what
is already confirmed.

### Design rationale

Feature areas follow the same business vocabulary as the backend modules
(§3), while allowing screens to combine information from several modules.
Billing is kept as a module separate from Jobs
specifically so invoice creation stays a distinct step from job
completion (FR-7.2) rather than an implicit side effect of the Jobs
module.

### Planned code organisation

Use one frontend application and one modular backend application. Modules
separate responsibilities inside the applications; they do not require
separate deployed services. The backend directory location remains a later
repository decision. This illustrative frontend tree is not created yet:

```text
src/
  app/                    Routing, providers and application composition
  components/
    layout/               Shared responsive shell and navigation
    ui/                   Reusable controls without feature rules
  features/
    quotations/           Quotation pages, forms, rules and data access
    jobs/                 Production board, job detail and transitions
    billing/              Invoices, payment forms and balances
    contacts/             Customer and supplier screens
    inventory/            Items, BOM and manual ledger
  lib/                    Shared formatting and infrastructure helpers
  test/                   Shared test setup
```

Within a feature, separate pages, components, domain rules, API/mock adapters
and tests when those responsibilities exist. Do not create empty folders for
their own sake. Reuse or relocate existing domain utilities deliberately
rather than creating a second implementation of the same rule.

| Boundary | Responsibility | Must not own |
|---|---|---|
| App/router | Compose routes, providers and layout | Quotation calculations or every module's screen code |
| Feature page/components | Render a task and collect input | Database queries, secrets or server authorization |
| Feature domain rules | Pure calculations, validation and transition logic | React rendering or network calls |
| Feature data adapter | Explicit operations backed by mocks, later the agreed API | Invented business rules or direct cross-feature state mutation |
| Backend controller | Parse and validate transport input; call a use case | The entire business transaction in one route handler |
| Backend service/domain | Authorize the operation and enforce business rules | Trust browser totals or role labels |
| Backend persistence | Execute scoped queries, constraints and transactions | Decide UI layout or bypass the owning module's rules |

One file should have one coherent responsibility. A page that mixes forms,
calculations, requests and several modules must be split even if it is short.
A growing file approaching several hundred lines triggers a responsibility
review; line count alone is not an architecture rule. Do not extend
`PrototypeApp.tsx` into the permanent implementation of all modules.

Modules use explicit interfaces. Cross-module transactions, such as converting
a quotation into a job and recording history, need one coordinating use case
and one transaction boundary. Splitting code must not split an atomic business
operation into unrelated writes.

### Frontend and backend integration

Frontend and backend use the same approved requirements and interface contract.

Before implementing a journey, document its inputs, outputs, validation,
errors, permissions, decimal/date representation and retry behaviour in §5.
Then frontend mocks and backend responses must match that contract. A contract
change requires updating both sides and their tests before integration.

Each bounded coding task must include:

1. The user journey, SRS IDs, open decisions already resolved and acceptance
   checks.
2. Allowed files/modules and the relevant design boundaries.
3. The agreed API/mock contract and examples using synthetic data only.
4. Required tests and the expected review evidence, including mobile states
   for frontend work and access/transaction checks for backend work.
5. A completion report listing changed files, checks actually run and remaining
   limitations. Completion requires verified behaviour against the acceptance checks.

The frontend owns interactions and API consumption. The backend owns server
rules, identity, persistence and transactions. Review shared-contract changes
across both implementations, and verify each change before the next task.

## 3. Module / component breakdown

Mapped from `docs/SRS.md` functional requirements to planned modular-
monolith modules. No backend module listed here exists yet; this is a
target shape for a later, separately authorized implementation phase.

| Module | Covers (SRS requirement IDs) | Notes |
|---|---|---|
| Quotations | FR-1, FR-2, FR-4 | Owns quotation lifecycle and source-of-enquiry note. |
| Jobs | FR-3, FR-6 | Owns job stage tracking and delivery status. |
| Billing | FR-7, FR-8 | Owns manual invoice creation and confirmed payment marking; deliberately separate from Jobs so invoice creation stays a distinct step (FR-7.2). |
| Contacts | FR-9.1, FR-9.4–FR-9.6 | Customers/suppliers. |
| Inventory | FR-9.2–FR-9.3, FR-9.7–FR-9.21 | BOM and stock ledger. |
| Audit | FR-5 | Cross-cutting: records changes from Quotations, Jobs, Billing modules. |
| Identity/Roles | FR-10 | v1 scope is UI-only role display for Admin and Staff; no enforcement logic is planned. A future authorized phase would keep Admin business-level access and configure each Staff account's module actions individually (SRS §2, §6). |

Each planned backend module would expose REST/OpenAPI operations and own its
PostgreSQL/Prisma schema slice, consistent with "tenant-ready ownership
boundaries" (SRS § 1). Identity/Roles remains a frontend-only display concern
for v1, as recorded in § 8.

## 4. Data design

This section defines the core planned data model as a design artifact only.
It does not authorize a database, API, schema migration, or implementation.
Field names below express data ownership and integrity rules. The relational
baseline later in this section specifies logical types, indexes and constraints;
§5 specifies wire contracts. Executable migrations and identity-provider schema
are later implementation/security work, not created artifacts.

### Sales and Jobs

| Entity | Core key fields | Relationships and historical-data rule |
|---|---|---|
| **Contact** | `contact_id`; `contact_type` (customer or supplier); `display_name`; `phone`; `email`; `address`; `internal_notes` | A customer Contact may have many Quotations and Jobs. A supplier Contact may be linked to many Inventory Items. Each Contact must have a display name and at least one of phone or email (FR-9.5). |
| **Quotation** | `quotation_id`; `quotation_number`; `customer_contact_id`; `revision_number`; `previous_quotation_id`; `status`; `source_of_enquiry_note`; `due_date`; `subtotal`; `discount_amount`; `tax_rate`; `tax_amount`; `grand_total`; `notes` | One Quotation has many Quotation Lines. A sent or accepted Quotation is not edited directly: a linked draft revision is created instead (FR-2.6–FR-2.8). Only an accepted latest family revision may create one Job for that family. |
| **Quotation Line** | `quotation_line_id`; `quotation_id`; `line_number`; `description`; `quantity`; `unit`; `unit_price`; `line_total` | Belongs to one Quotation. Its positive quantity is the ordered number of finished items or service units and contributes to the quotation totals (FR-1.10–FR-1.12). |
| **Job** | `job_id`; `job_number`; `source_quotation_id`; `customer_contact_id`; `status`; `production_stage`; `delivery_status`; `due_date`; `cancellation_reason`; `rework_reason`; `quotation_snapshot` | One Job is created from one accepted Quotation revision. The Job stores a snapshot of the agreed customer, lines, quantities, prices, tax, totals, source-of-enquiry note, and relevant notes, so later quotation revisions do not alter historical job data (FR-3.3). A Job has many Job Lines and one billing record once invoiced, with at most one active Invoice. |
| **Job Line** | `job_line_id`; `job_id`; `source_quotation_line_id`; `line_number`; `description`; `quantity`; `unit`; `unit_price`; `line_total` | Belongs to one Job and is copied from the accepted Quotation Line at conversion. The stored values form part of the Job snapshot and are not recalculated from later quotation changes. |

### Billing

| Entity | Core key fields | Relationships and historical-data rule |
|---|---|---|
| **Job Billing Record** | `billing_id`; `job_id`; `customer_contact_id`; `active_invoice_id`; `version`; `cancellation_review_status`; `settlement_reason`; `agreement_note` | One per billed job/customer. Owns settlement across all invoice versions, payments and refunds. Creates no separate bank balance. Cancellation review is not-required, pending or confirmed; confirmation records actor/time in history. |
| **Invoice** | `invoice_id`; `billing_id`; `invoice_number`; `job_id`; `customer_contact_id`; `issued_at`; `due_date`; `lifecycle_status`; `replaces_invoice_id`; `replacement_reason`; `agreement_note`; `subtotal`; `discount_amount`; `tax_rate`; `tax_amount`; `grand_total`; `job_snapshot` | One active invoice per billing record, with superseded predecessors retained. Lifecycle is active or superseded, separate from derived payment state. Replacement keeps the same job/customer and has its own reviewed commercial snapshot and unique number (FR-7). |
| **Invoice Line** | `invoice_line_id`; `invoice_id`; `source_job_line_id`; `line_number`; `description`; `quantity`; `unit`; `unit_price`; `line_total` | Belongs to one Invoice. Initial values are copied from the Job; replacement values are reviewed under FR-7.9 and may have a null source_job_line_id. Each issued version remains historical. |
| **Payment** | `payment_id`; `billing_id`; `invoice_id`; `amount`; `payment_date`; `payment_method`; `payment_method_note`; `status`; `void_reason`; `voided_at` | Immutable receipt attached to the invoice active when recorded and its job billing record. Invoice replacement never reassigns this reference. Effective receipts contribute once to net received. Status is recorded or voided; effective linked refunds prevent payment void (FR-8). |
| **Refund** | `refund_id`; `billing_id`; `source_payment_id`; `amount`; `refund_date`; `method`; `external_reference_or_cash_note`; `reason`; `status`; `void_reason`; `voided_at` | Immutable confirmed external return of money. Same billing record/customer as source Payment. Multiple refunds may reference one Payment but cannot exceed its effective amount or current refund due. Status is recorded or voided; history records actor and event time. |

### Inventory and history

| Entity | Core key fields | Relationships and historical-data rule |
|---|---|---|
| **Inventory Item** | `inventory_item_id`; `name`; `unit_of_measure`; `custom_unit_label`; `category`; `supplier_contact_id`; `current_balance` | May be linked to one supplier Contact and may have many Stock Movements and BOM Components. Its unit cannot change after Stock Movements exist; `other` requires a custom unit label (FR-9.12–FR-9.14). |
| **Stock Movement** | `stock_movement_id`; `inventory_item_id`; `movement_type`; `quantity`; `movement_date`; `reason`; `actor_label`; `resulting_balance`; `reversal_of_stock_movement_id` | Many Stock Movements belong to one Inventory Item. Posted movements are not edited or deleted; a correction is represented by a linked reversal or adjustment. v1 allows only manual stock-in, stock-out, adjustment and linked reversal movements; Job completion and BOM editing do not create movements (FR-9.8–FR-9.11, FR-9.17–FR-9.21). |
| **BOM** | `bom_id`; `name`; `notes` | One BOM has many BOM Components. It describes a finished print item or job item and may be edited in v1 because automatic stock deduction is out of scope. |
| **BOM Component** | `bom_component_id`; `bom_id`; `inventory_item_id`; `quantity_per_finished_unit`; `unit_of_measure` | Belongs to one BOM and references one Inventory Item. Its quantity must be positive and use the referenced item’s unit of measure (FR-9.15–FR-9.16). |
| **Activity History** | `activity_history_id`; `subject_type`; `subject_id`; `action`; `changed_information`; `previous_status`; `next_status`; `actor_label`; `occurred_at`; `reason` | Records required activity for Quotations, Jobs, Invoices, Payments, Refunds and cancellation settlement. In v1, `actor_label` is the current in-app role/profile label only; it is not secure identity attribution (FR-5.1–FR-5.4). |

### Core relationship summary

- Contact (customer) → many Quotations and Jobs.
- Quotation → many Quotation Lines; accepted latest revision → zero or one Job.
- Job → many Job Lines; Job → zero or one Job Billing Record.
- Job Billing Record → many invoice versions, at most one active Invoice.
- Invoice → many Invoice Lines and original Payment references.
- Job Billing Record → many Payments and Refunds; Payment → many Refunds.
- Inventory Item → many Stock Movements and many BOM Components.
- BOM → many BOM Components.
- Activity History may reference a Quotation, Job, Invoice, Payment, Refund
  or Job Billing Record through
  `subject_type` and `subject_id`.

The planned document snapshots are intentionally separate from live Contact,
Quotation, and Job records. This preserves what was agreed, produced, and
invoiced at the time of each business step.

### Core integrity rules

| Rule | Applies to | Design intent |
|---|---|---|
| Exact commercial calculations | Quotation, Quotation Line, Job, Invoice, Invoice Line, Payment, Refund | Calculate authoritative money values using decimal-safe arithmetic and the SRS calculation order. Do not use binary floating-point values for authoritative totals (FR-1.10). |
| Historical snapshots | Quotation, Job, Invoice and their Lines | Preserve accepted quotation values in the Job snapshot and issued Job values in the Invoice snapshot. Later edits or revisions must not rewrite historical Job or Invoice data (FR-2.6–FR-2.8, FR-3.3, FR-7.4–FR-7.5). |
| Explicit lifecycle changes | Quotation, Job, Payment | Apply only the permitted SRS lifecycle transitions. A cancellation, rework, or payment void requires its stated reason and creates an Activity History entry (FR-2, FR-3, FR-8). |
| One active invoice per job | Job Billing Record, Invoice | Unique billing record per job; unique active invoice per billing record. Replacement atomically supersedes the old invoice and creates the new one (FR-7.7–FR-7.13). |
| Receipt-derived settlement | Job Billing Record, Invoice, Payment, Refund | Sum effective receipts minus effective refunds once across invoice history, compare with active invoice total, and show either amount due or refund due; never sum superseded invoice totals (FR-8.19). |
| Immutable posted stock history | Inventory Item, Stock Movement | A posted Stock Movement is never edited or deleted. Corrections use a linked reversal or adjustment; each posting must retain its resulting balance (FR-9.8–FR-9.11). |
| No automatic BOM consumption in v1 | Job, BOM, Inventory Item, Stock Movement | Creating/editing a BOM and completing a Job must not create Stock Movements in v1. Stock changes are manual Ledger postings only (FR-9.10, FR-9.17–FR-9.21). |
| Activity-history limits | Activity History | Record the current in-app role/profile label, time, action, subject, changed information, and required reason for Quotation, Job, Invoice, Payment, Refund and settlement events. Do not present this v1 record as secure identity attribution (FR-5). |

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
- Retain historical issued-document snapshots, Payments, Refunds, posted Stock
  Movements, and Activity History rather than silently editing or deleting
  them.
- Apply `company_id` to all business entities, including child lines, history
  and request identities, under the ownership baseline below. It is omitted
  from the repeated core-field lists for readability, not from the design.

### Relational constraints and ownership baseline

Design decision 2026-09-09: every business record carries `company_id`, with
one configured company at launch. The server derives company ownership from
verified membership, never a body/header chosen by the caller. This prepares
isolation; it does not add multi-company UI or platform administration. Synthetic
mocks use a fixed fixture company. Identity tables/provider remain backend design.

All primary IDs use UUID; event times use timezone-aware UTC timestamps;
calendar dates use date; versions use positive bigint limited to the JSON-safe integer maximum 9007199254740991. Money/unit prices use
numeric(20,2), quantities/deltas numeric(20,3), tax percentage numeric(5,2).
Apply the tighter API range checks in §5, not just database capacity. Use exact
arithmetic for aggregates; derived settlement is not independently editable.
Mutable roots (Quotation Family, Contact, Job, Inventory Item, BOM and Job Billing
Record) have a version; increment it once per committed aggregate mutation.

| Records | Required uniqueness and reference constraints | Transaction-only checks |
|---|---|---|
| Quotation Family | Add `family_id`, `latest_revision_id`, `converted_job_id` (nullable), version and company ownership; one latest pointer belongs to its family | Lock family for edit/revise/transition/convert; no change after conversion |
| Quotation / Lines | Add family_id and unique `(company_id,family_id,revision_number)`; previous revision belongs to same family; unique line_number per revision | New revision becomes latest atomically; complete/valid before sent; accepted latest only converts |
| Job / Lines | Unique `(company_id,source_quotation_family_id)` and source revision; job and source quote/customer share company | Snapshot and source converted marker/history commit together |
| Contact | Same-company references; at least phone or email; type customer/supplier; restrict deletion of referenced records | Prevent contact-type change if it would invalidate existing references |
| Job Billing Record | Unique `(company_id,job_id)`; same-company/customer Job; active invoice pointer belongs to this billing record | Serialize all billing operations on this row; initial creation coordinates with Job lock |
| Invoice / Lines | Unique `(company_id,invoice_number)`; partial unique billing_id where lifecycle=active; replacement belongs to same billing record; unique replacement link and line_number | Supersede and replace together; immutable content; current pointer and active invoice agree at commit |
| Payment / Refund | Composite references enforce company and billing membership; positive amounts; refund source Payment required; valid recorded/voided enums | Aggregate refund/source caps, payment-void protection and dates; one billing lock protects all writes |
| Inventory Item / Stock Movement | Movement same-company item; unit taken from item; unique non-null reversal_of per company; posted content immutable; numeric delta nonzero | Lock item, reject negative/overflow balance, calculate historical resulting_balance; prohibit reversal of reversal |
| BOM / Component | Same-company item; positive quantity; unique inventory item per BOM; unit from item | Version check full component replacement; no stock side effect |
| Activity / request keys | Same-company subjects; actor from session in real-data mode; request identity unique by company/actor/operation/key | Insert activity and deduplication result with business transaction; sanitize change fields |

Use composite foreign keys/unique keys where ownership must survive incorrect
application code. Index foreign keys and list access paths: company+createdAt+id,
jobs company+status+dueDate+id, quotations company+status+createdAt+id, invoices
billingId+issuedAt+id, movements itemId+createdAt+id, and activity
company+subjectType+subjectId+occurredAt+id. Do not cascade-delete historical
invoices, payments, refunds, movements or audit records. Exact migration syntax
and identity foreign keys must be reviewed when backend implementation is assigned.

## 5. Interface design

### API shape

The current baseline contains operation summaries followed by concrete JSON
contracts, paths, validation and errors. They define the frontend mock/backend
agreement; they do not authorize API implementation.

#### Sales and Jobs

| Operation | SRS link | Records | Must ensure |
|---|---|---|---|
| Create/revise/send/accept/decline quotation (Quotations) | FR-1, FR-2, FR-4 | Quotation, Quotation Line, Activity History | Validate and calculate values. A sent/accepted change creates a linked draft revision and activity entry. |
| Convert accepted quotation to Job (Quotations + Jobs) | FR-2.3–FR-2.8, FR-3.3 | Quotation, Job, Job Line, Activity History | Verify that the latest family revision is accepted and no family Job exists; create the Job snapshot/lines, mark conversion, and record activity together. |
| Update Job lifecycle, delivery, or production stage (Jobs) | FR-3, FR-6 | Job, Activity History | Allow only permitted transitions; require cancellation/rework reason where applicable and record activity. |

#### Billing and Activity History

| Operation | SRS link | Records | Must ensure |
|---|---|---|---|
| Create Invoice for Job (Billing) | FR-7 | Job, Invoice, Invoice Line | Job comes from an accepted quotation, is not cancelled and has no Invoice; create the full Invoice snapshot and lines together, including before production. |
| Record or void Payment (Billing) | FR-8 | Payment, Invoice, Activity History | Confirm details; prevent overpayment; recalculate balance/status. A void retains its Payment, requires a reason, and records the required activity. |
| Replace invoice / settle cancellation (Billing) | FR-7.7–FR-7.13, FR-5.4 | Job Billing Record, Invoice/Lines, Activity History | One active invoice, immutable predecessors, same job/customer, reason/agreement confirmation; preserve existing money records. |
| Record or void Refund (Billing) | FR-8.19–FR-8.27, FR-5.4 | Refund, Payment, Job Billing Record, Activity History | Confirm actual external return; enforce refundable/source caps and dates; preserve original on a reasoned recording correction. |
| Retrieve Activity History (Audit) | FR-5 | Activity History | Return Quotation, Job, Invoice, Payment, Refund and settlement entries by affected record/time, using the in-app label only—not secure identity attribution. |

#### Contacts and Inventory

| Operation | SRS link | Records | Must ensure |
|---|---|---|---|
| Manage Contacts (Contacts) | FR-9.1, FR-9.4–FR-9.6 | Contact | Validate a display name and at least one contact method before saving. |
| Manage Inventory Items and BOMs (Inventory) | FR-9.2, FR-9.7, FR-9.12–FR-9.18 | Inventory Item, BOM, BOM Component | Validate units and positive component quantities. BOM changes do not post stock in v1. |
| Post manual Stock Movement or correction (Inventory) | FR-9.3, FR-9.8–FR-9.11 | Stock Movement, Inventory Item | Validate item/unit and non-negative balance; use linked reversal/adjustment, never edit/delete. |

These operations describe intended ownership and integrity boundaries only.
They do not authorize implementing REST endpoints, database transactions or
backend services. Contract documentation remains within this three-document
set until another artifact is explicitly requested.

### UI/UX journey outline

This is a design outline, not a claim that the prototype implements it.
Complete each journey's detailed fields and exceptional paths before coding.

| Journey | User interaction | Visible result |
|---|---|---|
| Prepare quotation | Open quotation list, create draft, select customer, enter lines and review totals | Saved draft detail or validation errors retaining entered values |
| Convert quotation | Open accepted quotation, review agreed items and confirm conversion | Linked job with preserved quantities and prices; ineligible revisions cannot convert |
| Track production | Open job board and job detail; apply an allowed stage/status action | Updated status and required history; cancellation/rework requests a reason |
| Issue invoice | Open eligible job and deliberately create invoice | Immutable invoice detail showing amount due; a second active invoice is rejected; corrections use linked replacement |
| Record payment | Open invoice, enter an actual receipt (including a pre-production deposit) and confirm; void a recording mistake through a reasoned action | Separate payment history and recalculated remaining balance; no second invoice or production-status change |
| Correct invoice / settle cancellation | Open billing detail, compare proposed values with original/job, enter reason and agreement note, then confirm | Linked replacement or unchanged-charge settlement; net receipts retained; amount due/refund due visible |
| Record refund | Open refund-due billing detail, select source receipt, confirm actual return details | Immutable refund/history and recalculated settlement; promise or excessive amount rejected |
| Manage contacts | Open contact list and edit/create customer or supplier | Validated contact available to its relevant workflow |
| Maintain inventory | Open item/BOM detail; post stock through a separate manual ledger action | Updated balance explained by movement history; BOM edits do not consume stock |

For each applicable screen, specify loading, empty, validation failure,
service failure, retry, unsaved changes and duplicate-submit behaviour.
Avoid success messages until the operation succeeds. In the future connected
system, retrying an uncertain write must use the agreed duplicate-protection
contract. A disabled button alone is insufficient.

Mobile views follow NFR-1 with readable lists/cards and a single-column form.
The proposed navigation and prototype data defaults below are design choices
to review in the walkthrough; mocks must not be presented as durable storage.

### Proposed navigation and screen behaviour

Planning defaults for the later frontend, subject to walkthrough review:

| Destination | Main task | Detail/actions |
|---|---|---|
| Overview | See workload and amounts outstanding | Summaries link to filtered source lists; no separate dashboard totals logic |
| Quotations | Find and prepare offers | Draft form, review/detail, revision history and conversion confirmation |
| Jobs | See what needs production next | Board/list, job detail, stage/status action and relevant history |
| Billing | Find invoices and balances | Invoice detail, issue preview, payment confirmation and reasoned void |
| More | Reach supporting records | Contacts, Inventory, BOM and Stock Ledger; role indicator is display-only in the prototype |

These five destinations form mobile bottom navigation, with text labels and
space reserved below page content. Desktop uses the same destinations in a
sidebar. Tablet adapts the shell to available width. Lists open a focused
detail screen; returning preserves the list's filters and position where
possible. A global history/search/settings product is not implied.

| Screen state | Planned behaviour |
|---|---|
| Loading | Show progress in the affected area; do not show an empty result as if loading succeeded |
| Empty | Explain that no records match; distinguish no records from an active filter returning none |
| Invalid input | Mark fields, keep values and move focus to an accessible error summary |
| Save failed | Retain input, explain failure and offer retry; never report success without a result |
| Unknown write result | Reconcile the original operation using its request identity before allowing a potentially duplicate retry |
| Unsaved navigation | Ask whether to discard or stay before an intentional in-app route change; browser-close protection is best effort |
| Stale edit | Explain the conflict and allow review of current data; do not silently overwrite another change |
| Permission denied | In the later authenticated application, explain unavailable access without exposing protected record data |

Review at 320 CSS pixels, representative tablet sizes in both orientations
and desktop. Check keyboard focus, accessible names, zoom, long descriptions,
visible actions with the on-screen keyboard and no page-level horizontal
overflow. These are acceptance checks, not an accessibility certification.

### Prototype data boundary

Proposed default: use deterministic synthetic fixtures through feature data
adapters. Keep edits in memory for the running session; reload restores the
fixtures. Display a clear demo-data/reset notice. Do not add browser storage
or accept real business data as a shortcut to production persistence.

Fixtures and the later API use the same operation interfaces. Domain state is
owned by the adapter/server; cached query results are not a second database.
The adapter must update all affected records together for conversion/payment/
stock scenarios, including linked history where required. Mock failures and
conflicts must be reproducible for acceptance checks. This design is not yet
implemented and does not alter the current prototype's actual behaviour.

### API contract baseline

Design version: 2026-09-09. These contracts are documentation, not implemented
endpoints. Billing contracts below settle the approved FR-7/FR-8 behaviour;
other module contracts follow. Business decisions still marked proposed in
SRS §6 remain gates for their dependent actions.

#### Shared transport and validation

- Prefix `/api/v1`; JSON UTF-8; camelCase wire fields, mapped explicitly to
  snake_case storage fields. Unknown request properties are rejected.
- IDs are UUID strings. Dates use valid `YYYY-MM-DD` calendar dates; timestamps
  use ISO 8601 UTC. The server resolves the current date in Asia/Kuala_Lumpur.
- Money uses non-negative decimal strings with exactly two decimal places in
  responses, at most two in input; maximum `999999999999.99` per amount/total.
  Quantity is a positive decimal string with at most three places and maximum
  `9999999.999`. Unit price maximum is `9999999.99`; tax rate is a decimal
  percentage 0–100 with at most two places. Reject excess precision, exponent
  notation, NaN, overflow, negative non-adjustment values and out-of-range totals.
  These numeric limits are technical contract defaults for review, not pricing.
- All strings are plain text, not HTML. Trim outer whitespace. Display names
  and line descriptions: 1–200 characters; unit: 1–30; reason: 1–500;
  agreement note: 1–2000; general notes: 0–2000; reference/cash note: 1–200.
  Each quotation/invoice has 1–200 lines. A zero-charge cancellation may use
  one clearly described zero-price line. Request body limit: 256 KiB.
- Every mutation requires a UUID `Idempotency-Key` header. Mutable aggregates
  also require `expectedVersion` (positive integer) in the request. Authentication
  and resource/action authorization are checked before mutation or replay.
- A committed key is scoped to company, actor and operation, with canonical
  payload hash and affected record IDs. Keep sensitive-write deduplication
  evidence for the life of the business record; do not silently expire it and
  execute the same financial request again. Same key/payload returns the original
  operation result; different payload returns `IDEMPOTENCY_CONFLICT`.
  Replayed snapshots may be stale: refresh the current detail after replay.
- GET lists use `limit` (default 25, maximum 100) and opaque `cursor`; response
  is `{items: T[], nextCursor: string|null}`. Stable order is createdAt then ID
  descending. Invalid limit/cursor is rejected; cursors are scoped to filters
  and authorized ownership. Queries never trust a client company identifier.
- Mutation success: 201 when creating a resource, otherwise 200; replay retains
  original status and adds `Idempotency-Replayed: true`. An uncommitted failed
  transaction leaves no partial business effect. A concurrent in-flight request
  returns `REQUEST_IN_PROGRESS`; reconcile/retry the same key, never a fresh key.
- Error body: `{error:{code:string,message:string,fieldErrors?:{path:string,
  message:string}[],requestId:string}}`. 400 `INVALID_REQUEST`; 401
  `UNAUTHENTICATED`; 403 `FORBIDDEN`; 404 `NOT_FOUND` for missing/inaccessible
  record IDs; 409 `STALE_VERSION`, `INVALID_TRANSITION`, `IDEMPOTENCY_CONFLICT`,
  `REQUEST_IN_PROGRESS`, `ACTIVE_INVOICE_EXISTS`, `PAYMENT_HAS_REFUNDS`,
  `AMOUNT_EXCEEDS_DUE`, `AMOUNT_EXCEEDS_REFUNDABLE`, `NEGATIVE_STOCK`, `REVISION_NOT_LATEST`, `FAMILY_ALREADY_CONVERTED`, `RECORD_ALREADY_VOIDED`; 422 `VALIDATION_FAILED`;
  429 `RATE_LIMITED` with Retry-After; 503 `TEMPORARY_FAILURE`. Do not reveal
  another company's existence, payload, stack trace or key lookup result.

#### Billing request and response shapes

Notation below defines JSON object shapes; `?` means optional/omittable,
`null` is allowed only where shown, and arrays use `[]`. All other fields are
required. `UUID`, `Date`, `Timestamp`, `Money`, `Quantity` follow the rules above.
Server-owned calculated values are never accepted in write bodies.

```typescript
type Method = 'cash' | 'bank_transfer' | 'e_wallet_qr' | 'other';
type InvoiceLineInput = {
  description: string; quantity: Quantity; unit: string; unitPrice: Money;
};
type InvoiceTerms = {
  billingName: string; billingAddress: string | null;
  dueDate: Date; lines: InvoiceLineInput[];
  discountAmount: Money; taxRate: string; notes: string;
};
type SettlementView = {
  activeTotal: Money; received: Money; refunded: Money; netReceived: Money;
  amountDue: Money; refundDue: Money;
  paymentState: 'unpaid' | 'partially_paid' | 'paid' | 'non_payable' | 'refund_due';
};
type BillingView = {
  id: UUID; jobId: UUID; customerId: UUID; version: number;
  activeInvoiceId: UUID; cancellationReview: 'not_required' | 'pending' | 'confirmed';
  settlement: SettlementView;
};
type InvoiceView = InvoiceTerms & {
  id: UUID; billingId: UUID; number: string;
  lifecycle: 'active' | 'superseded'; replacesInvoiceId: UUID | null;
  issuedAt: Timestamp; reason: string | null; agreementNote: string | null;
  subtotal: Money; taxAmount: Money; grandTotal: Money;
  lineTotals: Money[]; // same order/length as lines, server calculated
};
type PaymentView = {
  id: UUID; billingId: UUID; invoiceId: UUID; amount: Money; paymentDate: Date;
  method: Method; methodNote: string | null; status: 'recorded' | 'voided';
  createdAt: Timestamp; voidedAt: Timestamp | null; voidReason: string | null;
  refundableFromSource: Money; // current source cap, not overall refund due
};
type RefundView = {
  id: UUID; billingId: UUID; sourcePaymentId: UUID; amount: Money;
  refundDate: Date; method: Method; referenceOrCashNote: string; reason: string;
  status: 'recorded' | 'voided'; createdAt: Timestamp;
  voidedAt: Timestamp | null; voidReason: string | null;
};
type BillingResult = {
  billing: BillingView;
  changedRecord: {kind: 'invoice' | 'payment' | 'refund' | 'settlement'; id: UUID};
};
```

Billing address length is 0–1000 characters when non-null. Initial invoice
terms are derived from the agreed Job snapshot, never client-submitted totals.
Replacement billing display name/address may change but customerId cannot.
Replacement dueDate cannot precede replacement issue date. Currency is MYR;
no foreign-currency input or conversion is implied.

| Method and path | JSON input / query | Success body / rule |
|---|---|---|
| POST `/jobs/{jobId}/billing` | `{expectedVersion:number,dueDate:Date}`; version refers to Job | 201 BillingResult; create first billing record and active invoice from job snapshot. Require eligible non-cancelled job; reject existing billing record |
| GET `/jobs/{jobId}/billing` | No body | BillingView; 404 if none exists |
| GET `/billing-records/{id}` | No body | BillingView |
| GET `/billing-records/{id}/invoices` | Common pagination | List of InvoiceView; includes superseded versions |
| GET `/billing-records/{id}/invoices/{invoiceId}` | No body | InvoiceView; both IDs must belong together |
| POST `/billing-records/{id}/replacements` | `{expectedVersion:number,terms:InvoiceTerms,reason:string,agreementNote:string}` | 201 BillingResult; same job/customer, new number; cancelled job must use settlement route |
| POST `/billing-records/{id}/cancellation-settlements` | `{expectedVersion:number,reason:string,agreementNote:string,replacementTerms:InvoiceTerms|null}` | 200 BillingResult; job must be cancelled. Null confirms unchanged active charge; terms create replacement and confirm charge atomically. changedRecord ID is billing ID |
| GET `/billing-records/{id}/payments` | Common pagination | List of PaymentView; recorded and voided entries included |
| POST `/billing-records/{id}/payments` | `{expectedVersion:number,amount:Money,paymentDate:Date,method:Method,methodNote?:string}` | 201 BillingResult; attach current active invoice; amount >0 and <=amountDue. Date not future; note required for other, 1–200 chars |
| POST `/billing-records/{id}/payments/{paymentId}/void` | `{expectedVersion:number,reason:string}` | 200 BillingResult; reject effective source refunds or already-voided record |
| GET `/billing-records/{id}/refunds` | Common pagination | List of RefundView |
| POST `/billing-records/{id}/refunds` | `{expectedVersion:number,sourcePaymentId:UUID,amount:Money,refundDate:Date,method:Method,referenceOrCashNote:string,reason:string}` | 201 BillingResult; source is recorded and belongs to same billing record; enforce both refund caps and FR-8.27 |
| POST `/billing-records/{id}/refunds/{refundId}/void` | `{expectedVersion:number,reason:string}` | 200 BillingResult; already-voided is invalid; recalculate settlement |

All versions except first issue refer to Job Billing Record.version, not an
invoice version. History reads use `/billing-records/{id}/activity` with common
pagination and `{id,subjectType,subjectId,action,actorLabel,occurredAt,reason,
changes}` entries; `reason` is nullable, `changes` is an array of
`{field:string,before:string|null,after:string|null}` limited to approved safe
fields. Production actor identity is server-derived; frontend fixtures use
an explicitly synthetic display label. No secret or unrestricted request-body
logging is allowed through history.

Example refund request after a RM700 receipt and RM200 cancellation charge:

```json
{
  "expectedVersion": 4,
  "sourcePaymentId": "00000000-0000-4000-8000-000000000001",
  "amount": "500.00",
  "refundDate": "2026-09-09",
  "method": "bank_transfer",
  "referenceOrCashNote": "SYNTHETIC-REFUND-001",
  "reason": "Agreed cancellation settlement; return completed externally"
}
```

Resulting settlement is activeTotal `200.00`, received `700.00`, refunded
`500.00`, netReceived `200.00`, amountDue `0.00`, refundDue `0.00`, state paid.
Version increments to 5. The original payment remains attached to its original
invoice, even if cancellation created a replacement invoice.

#### Quotation, production and inventory contracts

These routes use the shared prefix, validation, errors, idempotency and list
envelope above. DTOs below define the screen data; storage-only keys are not
implicitly exposed. Fields are required except `?`; nullable fields use null.

```typescript
type ContactInput = {
  type: 'customer' | 'supplier'; displayName: string;
  phone: string | null; email: string | null;
  address: string | null; notes: string;
};
type ContactView = ContactInput & {id: UUID; version: number; createdAt: Timestamp};
type DraftLine = {
  description: string; quantity: Quantity | null; unit: string;
  unitPrice: Money | null;
};
type QuotationInput = {
  customerId: UUID | null; dueDate: Date | null; sourceNote: string;
  lines: DraftLine[]; discountAmount: Money; taxRate: string; notes: string;
};
type QuotationView = QuotationInput & {
  id: UUID; familyId: UUID; version: number; revision: number;
  number: string; previousRevisionId: UUID | null; isLatest: boolean;
  status: 'draft' | 'sent' | 'accepted' | 'declined' | 'converted_to_job';
  jobId: UUID | null; createdAt: Timestamp;
  totals: {subtotal: Money; taxAmount: Money; grandTotal: Money; provisional: boolean};
  lineTotals: (Money | null)[];
};
type JobStatus = 'pending' | 'in_production' | 'ready_for_delivery' | 'delivered' | 'cancelled';
type Stage = 'preparation' | 'production' | 'quality_check' | 'packing';
type JobView = {
  id: UUID; number: string; version: number; createdAt: Timestamp;
  status: JobStatus; stage: Stage; dueDate: Date;
  deliveryStatus: 'not_ready' | 'ready' | 'delivered' | 'not_applicable';
  lines: {description:string; quantity:Quantity; unit:string}[];
  customer: {id:UUID; displayName:string} | null;
  sourceQuotationId: UUID | null;
};
type ItemInput = {
  name: string; unit: 'unit' | 'sheet' | 'metre' | 'kilogram' | 'roll' | 'other';
  customUnitLabel: string | null; category: string | null; supplierId: UUID | null;
};
type ItemView = ItemInput & {id:UUID; version:number; balance:string; createdAt:Timestamp};
type MovementView = {
  id:UUID; itemId:UUID; type:'stock_in' | 'stock_out' | 'adjustment' | 'reversal';
  delta:string; resultingBalance:string; unit:string; movementDate:Date;
  reason:string; actorLabel:string; reversalOf:UUID|null; createdAt:Timestamp;
};
type BomInput = {
  name:string; notes:string;
  components:{itemId:UUID; quantityPerUnit:Quantity}[];
};
type BomView = BomInput & {id:UUID; version:number; createdAt:Timestamp};
```

Contact phone: 1–40 characters; email: valid address up to 254 characters;
at least one non-null contact method. Address up to 1000 characters. Changing
contact type is rejected if it invalidates existing references; archival UI
is deferred rather than exposing a destructive delete route.

Draft quotation fields may be incomplete: customer/date may be null, source
and descriptions may be empty, lines may be empty (max 200), and quantity/
price may be null. Non-null numeric values must still satisfy validation.
Only rows with description, quantity, price and unit produce a line total;
others return null. Totals are provisional until all required header/line
fields are complete. Discount cannot exceed the subtotal of complete rows.
Sending fails until every row and required header is complete. Due date is
a recorded requested date, not an automatic scheduling commitment; no automatic
future-date restriction is inferred for quotations.

JobView always omits financial values. Customer is null without contacts.view;
sourceQuotationId is null without quotations.view. Financial readers use the
separately authorized quotation/billing endpoints. In synthetic mode these
permissions are fixture projections, never security claims.

Item name/category follow name length rules; customUnitLabel is required only
for other, otherwise null. Supplier must be a supplier Contact. Stock balance
is non-negative with up to three decimals, maximum `999999999999.999`.
Movement dates cannot be future; recorded order is createdAt/ID, not a
backdated movement date, so historical resulting balances never rearrange.
BOMs have 1–200 unique item components with positive quantities; units are
derived from items. No automatic consumption is implied.

| Method and path | JSON input / query | Success / condition |
|---|---|---|
| GET `/contacts` | Pagination, optional `type`, `q` (0–100 chars) | List ContactView; q searches displayName |
| GET `/contacts/{id}` | None | ContactView |
| POST `/contacts` | ContactInput | 201 ContactView, version 1 |
| PUT `/contacts/{id}` | `{expectedVersion:number,contact:ContactInput}` | 200 ContactView; full replacement of editable fields |
| GET `/quotations` | Pagination, optional `status`, `q` (display number) | List QuotationView of latest family revisions only |
| GET `/quotations/{id}` | None | QuotationView of requested revision |
| GET `/quotations/{id}/revisions` | Pagination | List QuotationView in the same family |
| POST `/quotations` | QuotationInput | 201 QuotationView; new family, draft revision 1, version 1 |
| PUT `/quotations/{id}` | `{expectedVersion:number,quotation:QuotationInput}` | 200 QuotationView; family version; latest draft only |
| POST `/quotations/{id}/transitions` | `{expectedVersion:number,action:'send'|'accept'|'decline'}` | 200 QuotationView; latest revision and legal source state only |
| POST `/quotations/{id}/revisions` | `{expectedVersion:number}` | 201 copied draft QuotationView; latest sent/accepted/declined revision only, no converted family |
| POST `/quotations/{id}/conversion` | `{expectedVersion:number}` | 201 `{quotation:QuotationView,job:JobView}`; accepted latest only; one job per family |
| GET `/jobs` | Pagination, optional `status`, `q` (job number), `dueFrom`, `dueTo` | List JobView; dueFrom <= dueTo |
| GET `/jobs/{id}` | None | JobView |
| POST `/jobs/{id}/transitions` | `{expectedVersion:number,action:'start'|'ready'|'deliver'|'cancel',reason?:string}` | 200 JobView; cancel requires reason; rules below |
| POST `/jobs/{id}/stage` | `{expectedVersion:number,target:Stage,reason?:string}` | 200 JobView; in-production only; backward movement requires reason; same stage rejected |
| GET `/inventory/items` | Pagination, optional `q` (name) | List ItemView |
| GET `/inventory/items/{id}` | None | ItemView |
| POST `/inventory/items` | ItemInput | 201 ItemView with zero balance, version 1 |
| PUT `/inventory/items/{id}` | `{expectedVersion:number,item:ItemInput}` | 200 ItemView; cannot change unit/customUnitLabel after any movement |
| GET `/inventory/items/{id}/movements` | Pagination | List MovementView |
| POST `/inventory/items/{id}/movements` | `{expectedVersion:number,type:'stock_in'|'stock_out'|'adjustment',quantity:string,movementDate:Date,reason:string}` | 201 `{item:ItemView,movement:MovementView}`; in/out quantity positive, adjustment signed nonzero; derive delta |
| POST `/inventory/items/{id}/movements/{movementId}/reversal` | `{expectedVersion:number,movementDate:Date,reason:string}` | 201 `{item:ItemView,movement:MovementView}`; negate full original delta once, no reversal of reversal |
| GET `/inventory/boms` | Pagination, optional `q` (name) | List BomView |
| GET `/inventory/boms/{id}` | None | BomView |
| POST `/inventory/boms` | BomInput | 201 BomView, version 1 |
| PUT `/inventory/boms/{id}` | `{expectedVersion:number,bom:BomInput}` | 200 BomView; full component replacement; no stock change |

Quotation and Job history endpoints are GET `/quotations/{id}/activity` and
`/jobs/{id}/activity`, using the shared history shape and pagination; quotation
history covers its family. Job history excludes billing payloads; billing
history requires billing.view. Read routes require domain view permission;
mutation permissions are mapped below. There are no generic delete endpoints
for documents, money or stock history.

#### Workflow transition tables

| Aggregate/action | Required state | Result / side effect |
|---|---|---|
| Quotation send | Latest complete draft, unconverted family | sent; record external-event label only |
| Quotation accept/decline | Latest sent, unconverted family | accepted or declined; no invoice/job/payment |
| Quotation revise | Latest sent/accepted/declined, unconverted family | New latest draft; original content/status remains historical |
| Quotation convert | Latest accepted, family has no job | converted_to_job plus pending/preparation Job and snapshots/history atomically |
| Job start | pending | in_production; retain preparation stage |
| Job change stage | in_production | Target stage; backward requires reason. Forward skips are allowed; packing is still required before ready |
| Job ready | in_production and packing | ready_for_delivery; no stock/invoice/payment action |
| Job deliver | ready_for_delivery | delivered; no payment gate |
| Job cancel | pending or in_production, reason required | cancelled, delivery not_applicable; retain stage; existing billing review becomes pending |
| Stock reversal | Original same-item non-reversal, not previously reversed | New negating movement; reject negative balance; item balance/version update atomically |

No stage action reopens ready/delivered/cancelled jobs. Forward skips are an
implementation baseline consistent with the selected stage model, not a proof
that intermediate physical checks occurred; enforcing each intermediate stage
would require a separate approved rule.

#### Future permission operation map (D5)

Admin can perform authorized business operations within their company, but
cannot bypass immutable-history rules. Staff receive no grants initially;
Admin assigns each action individually. Write operations also require the
corresponding view grant. Suggested display groupings View/Add/Edit/Delete
must map to these explicit capabilities, not a catch-all delete privilege.

| Area | View grant | Separate write grants |
|---|---|---|
| Contacts | contacts.view | contacts.create, contacts.update |
| Quotations | quotations.view | quotations.create, quotations.update, quotations.record_decision, quotations.revise, quotations.convert |
| Jobs | jobs.view | jobs.start, jobs.change_stage, jobs.ready, jobs.deliver, jobs.cancel |
| Billing | billing.view | billing.issue, billing.replace, billing.settle_cancellation, billing.record_payment, billing.void_payment, billing.record_refund, billing.void_refund |
| Inventory | inventory.view | inventory.create, inventory.update, inventory.post_movement, inventory.reverse_movement, inventory.manage_bom |

Grant administration itself is Admin-only in the planned real-data system;
Staff cannot grant themselves actions. A quotation creation/update needs
contacts.view to select a customer; an inventory supplier selector likewise.
Cross-module reads require their own grants. Permissions are server checked
on direct requests; frontend visibility is only a convenience. Actual login,
membership/grant endpoints and session settings remain a later security task.

### Journey acceptance map

These are planned checks, not tests already written or passed. Run the
frontend variants against mocks first; repeat against the real API when
integrated. Server-only invariants require backend tests as well.

| Check | Expected evidence | Requirement / dependency |
|---|---|---|
| AT-01 Quotation totals | Worked example gives RM1,700.00; discount/tax rounding and invalid bounds covered; failed save retains input | FR-1, FR-4; validation policy |
| AT-02 Revision/conversion | Reject declined/stale/ineligible revisions; one intended conversion retains both 50-item lines; retry does not duplicate job | FR-2, FR-3, FR-5; D1 |
| AT-03 Job lifecycle | Allowed transitions succeed, illegal transitions fail; reason required for cancellation/rework; delivery view consistent; no automatic invoice/stock | FR-3, FR-5, FR-6; D2 |
| AT-04 Invoice/payment | Pending job invoices once; RM700 pre-production deposit + RM1,000 later receipt settles RM1,700 on the same invoice; promised deposits do not count; void recalculates; reject non-positive amounts, overpayment and duplicate effects; cancellation preserves receipts | FR-7, FR-8, FR-5; D3 |
| AT-04a Correction/settlement | No-receipt correction preserves original; with RM700 received, corrected RM1,500 leaves RM800 due, corrected RM500 leaves RM200 refund due; cancellation charge RM200 leaves RM500 refund due; zero charge yields full refund | FR-7.7–FR-7.13, FR-8.19, FR-5.4 |
| AT-04b Refund integrity | Confirmed external refunds reduce refund due; reject wrong source/date, excess and duplicate effects; block source payment void with effective refunds; refund-record void restores the correct balance; concurrent replacements/refunds preserve constraints | FR-8.20–FR-8.27, SEC-5/SEC-6 |
| AT-05 Contacts/inventory | Required contact fields, item units and BOM quantities validated; 150 minus 100 leaves 50; correction retains original; concurrent writes cannot make stock negative | FR-9; D4 |
| AT-06 Responsive recovery | All journeys usable on mobile/tablet/desktop and keyboard, with loading/empty/failure/unsaved states; demo reset disclosed | FR-10, FR-11, NFR-1, NFR-2; §5 screen design |
| AT-07 Boundaries/contracts | Domain tests run without UI; mock and server match the agreed contract; entry points contain composition rather than feature rules | NFR-3; §2 and §5 |
| AT-08 Real-data security | Direct unauthorized/tampered requests fail; session revocation, ownership, logging and duplicate/concurrent writes tested; backup restored | SEC-1–SEC-7; D5 and backend design decisions |

### Deposit, correction, refund and cancellation design

The Billing module owns one Job Billing Record per invoiced job/customer.
Initial invoicing snapshots the accepted job. Corrections create a reviewed
replacement with a new number, preserving the original and its receipt links.
The replacement may correct billing display details, lines and commercial
values under FR-7.9, but never customer identity or the historical Job snapshot.
Payment history does not block a correction: it remains in the same billing
record and is applied exactly once to the current total.

Logical types: identifiers are UUIDs; invoice lifecycle is active/superseded;
payment/refund status is recorded/voided; version is a positive integer;
monetary amounts are exact decimals, transmitted as decimal strings. Event
times are UTC timestamps, receipt/refund dates are calendar dates. Optional
replacement/source-line IDs are null on initial invoices/new correction lines.
Database precision and API size limits are specified in §§4–5.

Settlement is derived, not entered independently:

```text
P = sum of recorded (not voided) payments in this job billing record
R = sum of recorded (not voided) refunds in this job billing record
N = P - R
T = total of the active invoice only
amount_due = max(T - N, 0)
refund_due = max(N - T, 0)
source_unrefunded = source_payment.amount - its effective linked refunds
```

Keep N non-negative. Reject new receipts above amount_due. Reject refunds
above either refund_due or source_unrefunded. No API accepts a client-supplied
balance as authoritative. On superseded invoice screens show their original
contents and direct receipt references, with a link to current job settlement;
do not present every historical invoice as a separate outstanding debt.

| Operation | Transaction and interface requirements |
|---|---|
| Replace invoice | Accept billing ID, expected version, corrected values, reason/agreement note and request identity. Authorize, lock billing record, validate changes (use settlement flow for cancelled jobs), supersede original, create numbered replacement/lines, update active pointer and record history together. Return new invoice and settlement; never move original payments. |
| Settle cancellation | Accept expected version, confirmed charge/lines and agreement note. Job must be cancelled. Lock billing record; retain active invoice if charge is unchanged, otherwise replace it atomically. Record confirmation/history and clear pending review. No automatic refund. |
| Record refund | Accept source Payment, positive amount, actual date/method/reference, reason, version and request identity. Lock billing record and validate source membership/status, refund due and source cap. Insert refund and history together; return settlement. No external money-transfer call. |
| Void payment/refund record | Accept record ID, expected version, reason and request identity. Reject repeated void, wrong billing record or Payment with effective linked refunds. Retain original and record history; recalculate settlement. This corrects a recording mistake, not a real transfer. |

All billing mutations serialize on the same Job Billing Record and increment
its version. Initial invoice creation uses unique job-to-billing ownership to
handle concurrent first requests. Job cancellation and its pending billing
review flag update atomically; lock ordering must be consistent with invoice
issue so a cancellation race cannot bypass eligibility. If settlement is
changed later, record another explicit reviewed event; never silently edit
its agreement history.

Scope request identities to authorized ownership, operation and payload. A
retry returns the original result after authorization; mismatched payloads
and stale versions fail safely. Database constraints must enforce source
membership, one active invoice and unique numbers; transactional checks cover
aggregate receipt/refund limits. No two invoices in the replacement chain
may become active together.

Billing screens show invoice history, net receipts, amount due and refund due
separately. Correction confirmation previews old/new totals and the resulting
balance. Cancellation review records the agreed retained charge, including
zero, without inventing a default fee. Refund confirmation clearly says it
records money already returned externally. Do not cache independent financial
balances in each page; all screens use the same settlement response.

Test correction before/after receipts, reduced/increased totals, zero charge,
partial/full refunds, mistaken refund void, source-payment void protection,
unchanged cancellation charge, and retries/races between all billing writes.
Include the worked examples in SRS acceptance checks. This is an operational
record design, not a formal credit-note, tax or accounting implementation.

## 6. Non-functional design notes

- NFR-1 (responsive support): addressed at the frontend layer only (§ 2);
  no backend design implication.
- NFR-2 (localization): planned through the locally uncommitted
  `src/lib/formatters.ts` using MYR/`en-MY`/`Asia/Kuala_Lumpur` defaults; a planned
  backend uses the same currency/date conventions specified in §5.
- NFR-3 (maintainability): §2 defines code responsibilities and integration
  boundaries. Review imports and ownership, and test domain rules independently
  of UI. Verify the API/mock contract when connecting a feature.

### Proposed real-data security design (NFR-4)

The browser is an untrusted client. It can show allowed actions for usability,
but the server must independently identify the user, check access to the
record and validate every operation. No security control in this section is
implemented or verified by this document.

| Targets | Planned mechanism and design work |
|---|---|
| SEC-1, SEC-2 | Central authentication and default-deny authorization, with resource-level checks in each use case. Agree the Staff action matrix and ownership model before protected endpoints are implemented. Role display and hidden buttons are not enforcement. |
| SEC-3 | Select a maintained authentication approach rather than inventing cryptography. A server-managed cookie session is a candidate: Secure, HttpOnly and appropriate SameSite settings, CSRF protection for writes, expiry, revocation and session rotation. Session design and exact lifetimes remain open. |
| SEC-4 | Server-only secret configuration, secret scanning, redacted diagnostics and generic client-facing errors. Do not expose provider keys through frontend environment variables. |
| SEC-5, SEC-6 | Validated request schemas, authoritative server calculations, database constraints, transaction boundaries, duplicate-request protection and concurrency checks. Server-derived actor identity replaces prototype labels for secure history. |
| SEC-7 | Review access-control bypasses, injection and unsafe rendering paths, request abuse and dependencies. Define rate limits and backup/recovery targets; test restore and security failures before real-data release. |

This section applies the guidance linked in SRS NFR-4. It is a planning
baseline, not a complete threat model or certification. File-upload security
needs its own design if real file storage enters scope. Production security
cannot be inferred from the frontend tests or successful page rendering.

## 7. Out of scope for this design

Per `docs/SPMP.md` § 3.1 and `docs/SRS.md` section 3, this SDD does not
design: QR customer tracking, AI-assisted features, full accounting,
the detailed staff-permission administration interface, WhatsApp/payment-gateway integrations,
platform administration, or camera-based scanning. These remain deferred
to a later, separately authorized phase. Security targets and trust boundaries
for eventual real-data use are now planning scope (§6); their implementation
remains deferred.

## 8. Open items

- Core business contracts, logical data constraints and AT-01–AT-08 mapping
  are documented in §§4–5. D1–D5 have been accepted in SRS §6. Remaining
  backend design: login/session/membership/grant endpoints and policy, request
  rate-limit values, recovery targets, deployment boundaries and migration
  review. These do not prevent a synthetic-data frontend task after its
  implementation scope is authorized.
- **Decided 2026-09-02:** Identity/Roles stays a frontend-only display
  concern for v1 (no backend module), matching FR-10 — enforcement is not
  required for v1 per `docs/SRS.md` § 2 item 10. The planned module table in
  §3 records the required frontend display. Server enforcement is excluded
  from the prototype, but must be designed and verified for a real-data
  release under SRS NFR-4.
- Cross-cutting acceptance checks are documented in SRS § 4. Full traceability
  links from requirements through planned operations, transactions, and final
  acceptance tests must be completed per journey before its implementation.
- **Designed 2026-09-09:** Company ownership and same-company references are
  required under §4. Authentication must bind the session to that ownership
  before any real-data API is exposed. Multi-company management remains excluded.
