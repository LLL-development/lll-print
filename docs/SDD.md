# Software Design Document (SDD)

Project: LLL Print
Status: Draft — the current phase includes completing and reviewing the SDD
development baseline; it remains Draft until accepted.
Last updated: 2026-09-24

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
- Feature areas group related user tasks (quotations, jobs, billing and
  contacts). Inventory is deferred. A feature may cover several SRS requirement
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

Modules use explicit interfaces. Cross-module transactions, especially Confirm
order across quotation, job, billing, invoice and history, need one coordinating use case
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
| Quotations | FR-1, FR-2, FR-4 | Owns private priced-form submission, submitted-order review and quotation history. |
| Jobs | FR-3, FR-6 | Owns release, configurable production progress and fulfilment. |
| Billing | FR-7, FR-8 | Owns issued-invoice history, confirmed payments, corrections and refunds. It participates in the atomic Confirm order operation rather than adding a separate first-invoice step. |
| Contacts | FR-9 | Owns reusable customer details while historical documents retain snapshots. |
| Inventory | Deferred | Items, BOM and Stock Ledger are not in current scope. |
| Audit | FR-5 | Cross-cutting: records changes from Quotations, Jobs, Billing modules. |
| Identity and action grants | FR-10, NFR-4 | Admin manages Staff accounts and grants explicit business actions. Enforcement is required before real data; its implementation remains separately scoped. |

Each planned backend module would expose REST/OpenAPI operations and own its
PostgreSQL/Prisma schema slice, consistent with "tenant-ready ownership
boundaries" (SRS § 1). The current synthetic frontend may demonstrate projected
views, but it is not evidence that identity or authorization is implemented.

## 4. Data design

This section defines the core planned data model as a design artifact only.
It does not authorize a database, API, schema migration, or implementation.
Field names below express data ownership and integrity rules. The relational
baseline later in this section specifies logical types, indexes and constraints;
§5 specifies wire contracts. Executable migrations and identity-provider schema
are later implementation/security work, not created artifacts.

### Sales and Jobs

One priced form submission creates a submitted quotation only. During review,
Admin sets the required deposit from RM0 up to the invoice total. One Confirm
order action then confirms the quotation, creates its single Job and issues
its initial Invoice atomically. The Job begins awaiting release, showing any
unmet deposit or mockup condition. RM0 needs no receipt; a positive deposit
needs confirmed payment. Payment never releases the job automatically.

Admin first prepares a customer-specific form from reusable company catalogue
options. Catalogue categories may include clothing type, sleeve type, material,
GSM, colour, size, printing method, print location/component and other
company-defined choices. Admin selects only the options to display, can add a
one-time option, and sets every applicable price before sharing. The customer
may freely combine the displayed choices; this design has no compatibility
matrix or automatic quantity-discount tiers. Admin remains responsible for
offering suitable choices and uses Needs changes when a submitted combination
cannot be produced.

Pricing is assembled from an Admin-prepared base price plus applicable option
charges. A component can be free, charged per piece, charged once per order or
use a fixed item adjustment. Size adjustments are individually configurable,
so a company may charge from 3XL while another uses different amounts or no
plus-size charge. Saved customer-specific prices may prefill preparation, but
Admin may replace them for the individual form. All price labels, methods and
amounts are copied into the shared form; there is no hidden automatic price
rule after sharing.

A shared form is a fixed offer. Admin may remove the old link and create/share
a new prepared form, but cannot silently change the options or prices behind a
link the customer already received. The removed link cannot be reactivated and
any incomplete draft under it is discarded. Catalogue options may be edited or
deleted for future preparation with no activate/archive workflow. A later
option with the same label is a new record. Existing shared forms and submitted
quotations remain readable from their copied snapshots. Once submitted, the
quotation remains historical; Needs changes leads to a newly prepared form
rather than deleting the earlier submission.

The fixed-offer rule applies to offered choices and prices, not to unnecessary
workflow rigidity. Admin and customer normally discuss feasibility outside the
system first. Due date, recipient and fulfilment details are operational facts
the form records and may prefill for convenience; the customer may complete or
correct the fields exposed on that form before submission. The system does not
run a production-capacity approval or treat the due date as a guaranteed
schedule. Admin reviews the complete submission before Confirm order.

The submitted-order review is one drawer containing customer, items,
quantities, current mockup, fulfilment method, shipping charge, total and
missing-information indicators. Its deposit field starts blank and has no
automatic percentage. Admin chooses RM0 through the invoice total, then uses
one Confirm order action. Needs changes remains secondary in the same drawer;
the normal flow has no separate quotation-detail, job-creation or first-invoice
page.

Mockup attachment remains an in-context action on the form or current job
drawer. Customer, Admin or Staff granted Attach mockup may upload a revision
without entering a reason. Each upload appends a version with server-owned
uploader/time metadata; the latest is current and earlier versions remain
readable. One current version is required at release. A later upload updates
the factory view with a non-blocking Mockup updated notice and does not stop
production, reopen steps or require a separate approval automatically.

Admin or Staff granted Manage production workflow maintains one company-level
sequence of broad checkpoints such as printing, sewing, QC and packing. The
control opens from the Production screen as an in-context drawer or modal, not
a separate management destination. The system does not require workflow
templates, method-specific task lists or detailed factory instructions.
Changes apply automatically to unfinished jobs, while completed/skipped step
events remain immutable history. Added unfinished work reopens a completed job
before handover and clears readiness; shipped/collected jobs stay closed. A
granted action may complete, skip or rework a step; skip and rework each
require a short free-text reason and create history.
Release immediately puts the job in production at its first current step;
there is no separate start action. Staff normally see only relevant current
work and complete the current permitted step with one action. The system owns
the actor/time fields, advances to the next step automatically and requires no
normal completion note or manual next-status selection. When every step is
completed or reasoned-skipped, it marks production complete automatically;
there is no separate Complete production action.
No per-job Staff assignment is required. Every Staff account granted the
current-step action may see and attempt it; the first valid action records its
actor, while a stale competing action fails without duplicating progress.
Named workload assignment remains deferred rather than adding Admin entry to
each job.
The factory task projection contains job number, due date, product
specifications, size quantities, mockup, current-step instructions, essential
production notes and permitted actions. It omits customer identity/contact
details, prices, invoices, payment history and unrestricted Admin notes unless
separately granted. A Shipped or Collected projection may add only the required
recipient name, phone, address or pickup location, fulfilment method and a
simple Ready or Not paid yet indicator. That fulfilment grant does not reveal
invoice contents or payment history.
Before handover, Admin alone may use Reopen for rework on a production-complete
job. The request selects one return step and includes a short
reason. It preserves prior history, puts the job back in production at that
step, clears readiness, and makes that step and every following step pending
completion or a new reasoned skip. This is not a normal step action and is not
Staff-grantable.
Production completion and full settlement automatically enable the applicable
Shipped or Collected handover action. Admin grants each Staff account explicit
business actions; generic View/Add/Edit/Delete groupings are not the policy.

Full settlement is the normal handover gate. After production completion,
Admin alone may approve an exceptional Shipped or Collected handover while a
balance remains. That operation requires a reason, records the approval in
history and leaves the balance open and visibly Not paid yet. It is not a
Staff-grantable handover path. If a payment is
voided after release, recalculate the balance but do not reverse or stop
physical production automatically; normal readiness remains blocked unless
the balance is settled or Admin uses this exception.

Fulfilment remains in the completed job drawer. Shipped or Collected uses one
confirmation and server-owned actor/current-time values while reusing the
saved recipient/address or pickup location. Collected exposes no extra entry.
Shipped keeps optional courier and tracking/reference fields collapsed under
Add shipping details; blanks never block confirmation. The Admin-only Allow
handover with balance action appears in the same drawer only when production
is complete and an unpaid balance remains, and still requires its reason.
Detailed handover history is secondary detail.

Record payment is an in-context action in the current job/order drawer rather
than a required navigation to a separate invoice page. It preselects the local
current date and offers the amount still needed to satisfy the deposit, the
remaining balance, or a custom amount. The user may correct the actual receipt
date, selects the required payment method and confirms the amount/date once.
The result appends one immutable Payment and refreshes balance, release and
Ready/Not paid yet indicators. Detailed invoice and payment history stays
available as secondary detail rather than blocking the normal action.

Inventory, BOM and Stock Ledger are deferred and have no active entities,
routes, grants or acceptance checks in this design.

| Entity | Core key fields | Relationships and historical-data rule |
|---|---|---|
| **Contact** | `contact_id`; `display_name`; `phone`; `email`; fulfilment defaults; `internal_notes` | One customer Contact may have many private form links, Quotations and Jobs. Later contact corrections affect future use, not historical snapshots. |
| **Catalogue Option** | `catalogue_option_id`; category; label; display order; default pricing metadata | Reusable company choice selected while preparing forms. Admin may edit or delete it. Prepared-form and quotation snapshots never depend on the live record remaining. No compatibility graph or activation lifecycle is required. |
| **Customer Price Default** | `customer_price_default_id`; customer; applicable catalogue/base/component reference; charge method; amount | Optional reusable starting price for one customer. It only prefills a new prepared form and never updates an already shared form or historical quotation. |
| **Prepared Order Form** | `prepared_form_id`; customer; state (`draft` or `shared`); optional due-date/fulfilment initial values; expiry; created/shared/removed metadata | Admin-owned preparation root. Draft options and prices are editable. Sharing freezes offered choices/prices, while exposed operational fields may be completed or corrected before submission. Removing a shared form permanently disables its link and discards its incomplete customer draft. |
| **Prepared Form Option** | form; category; copied label; display order; base/adjustment amount; charge method; source catalogue reference (nullable) | Contains only choices Admin wants this customer to see. Supports catalogue-derived and one-time choices. Options combine freely; no compatibility matrix or quantity tier selects a different price. |
| **Private Form Link** | `form_link_id`; `prepared_form_id`; customer; token digest; expiry/removal/submission metadata | Bound to one frozen Prepared Order Form, company and customer. The raw token is never stored or logged. A removed, expired or submitted link cannot be reused or reactivated. |
| **Quotation** | `quotation_id`; `quotation_number`; `customer_contact_id`; `status`; `source_of_enquiry_note`; `due_date`; totals; fulfilment choice; shipping charge; snapshot fields | Submission creates `submitted`. Admin may request changes or cancel it. Confirm order changes it to `confirmed` and creates exactly one Job, billing record and initial Invoice in the same transaction. |
| **Quotation Item** | selected clothing/sleeve/material/GSM/colour/printing values; size quantities; base unit price; copied labels and price effects; totals | Belongs to one Quotation. Multiple clothing items may coexist. Each preserves the choices, grouped size quantities and prices displayed on the submitted form. |
| **Quotation Charge** | quotation/item reference; copied component label; charge method; applicable quantity; unit amount; total | Preserves transparent free, per-piece, per-order and fixed-item charges, including size and printing/component adjustments. |
| **Mockup / Mockup Version** | owner record; object metadata; current-version pointer; uploader; uploaded time | Versions append; the newest is current and older versions remain readable. A current version is required for release, not for initial submission. |
| **Job** | `job_id`; `job_number`; `source_quotation_id`; `status`; current due date, fulfilment details, production notes and version | Created only by Confirm order and starts `awaiting_release`. It begins from the confirmed quotation snapshot, then remains Admin-editable until Shipped, Collected or Cancelled. Its current values are the factory's working instruction, not a rewrite of the quotation. |
| **Job Revision** | `job_revision_id`; job; revision number; complete before/after snapshot; changed fields; Admin; changed time | Append-only record created for every Admin Job save. It preserves the prior working instruction, including commercial and fulfilment values. Factory-relevant changes after release record the selected return checkpoint; delivery-only, due-date and price changes do not reopen production. |
| **Production Step Definition** | `step_id`; company; label; sequence; active state; version | Company-level broad checkpoints are configurable. Unfinished jobs use the current sequence; historical step events retain their recorded label and position. |
| **Job Step Event** | job; step reference and snapshot; result; actor; occurred time; reason when required | Append-only completion, skip and rework history. Normal completion needs no note; skip and rework require a reason. |
| **Handover Event** | job; method; actor; occurred time; optional courier/tracking; unpaid-balance override and reason | Exactly one final Shipped or Collected outcome. Full settlement is normal; only Admin may approve handover with balance after production completion. |

### Billing

| Entity | Core key fields | Relationships and historical-data rule |
|---|---|---|
| **Job Billing Record** | `billing_id`; `job_id`; `customer_contact_id`; `active_invoice_id`; `version`; `cancellation_review_status`; `settlement_reason`; `agreement_note` | One per billed job/customer. Owns settlement across all invoice versions, payments and refunds. Creates no separate bank balance. Cancellation review is not-required, pending or confirmed; confirmation records actor/time in history. |
| **Invoice** | `invoice_id`; `billing_id`; `invoice_number`; `job_id`; `customer_contact_id`; `issued_at`; `due_date`; `required_deposit_amount`; lifecycle/replacement fields; totals; `job_revision_snapshot` | The initial Invoice is issued inside Confirm order. Required deposit is RM0 through the invoice total. A commercial Admin Job edit atomically creates the next Invoice version from the current Job revision; every issued version remains immutable. |
| **Invoice Line** | `invoice_line_id`; `invoice_id`; `source_job_line_id`; `line_number`; `description`; `quantity`; `unit`; `unit_price`; `line_total` | Belongs to one Invoice. Initial values are copied from the Job; replacement values are reviewed under FR-7.9 and may have a null source_job_line_id. Each issued version remains historical. |
| **Payment** | `payment_id`; `billing_id`; `invoice_id`; `amount`; `payment_date`; `payment_method`; `payment_method_note`; `status`; `void_reason`; `voided_at` | Immutable receipt attached to the invoice active when recorded and its job billing record. Invoice replacement never reassigns this reference. Effective receipts contribute once to net received. Status is recorded or voided; effective linked refunds prevent payment void (FR-8). |
| **Refund** | `refund_id`; `billing_id`; `source_payment_id`; `amount`; `refund_date`; `method`; `external_reference_or_cash_note`; `reason`; `status`; `void_reason`; `voided_at` | Immutable confirmed external return of money. Same billing record/customer as source Payment. Multiple refunds may reference one Payment but cannot exceed its effective amount or current refund due. Status is recorded or voided; history records actor and event time. |

### Activity history

| Entity | Core key fields | Relationships and historical-data rule |
|---|---|---|
| **Activity History** | subject; action; previous/next state; actor; occurred time; approved reason; safe changed fields | Records confirmation, release, production, mockup, billing, void/refund and handover events. Real-data history uses server-derived identity; synthetic labels are demonstrations only. |

### Core relationship summary

- Company → many reusable Catalogue Options; Contact → optional Customer Price Defaults.
- Contact (customer) → many Prepared Order Forms, private form links, Quotations and Jobs.
- Prepared Order Form → many snapshotted options and one private link; sharing freezes the form.
- Quotation → many grouped items, item/order charges and mockup versions; confirmed Quotation → exactly one Job.
- Confirm order → one confirmed Quotation, one Job, one Job Billing Record and one initial Invoice atomically.
- Job → many append-only Job Revisions, step events and zero or one final handover event.
- Company → one ordered set of active Production Step Definitions.
- Job Billing Record → many invoice versions, at most one active Invoice.
- Invoice → many Invoice Lines and original Payment references.
- Job Billing Record → many Payments and Refunds; Payment → many Refunds.
- Activity History may reference a Quotation, Job, Invoice, Payment, Refund
  or Job Billing Record through
  `subject_type` and `subject_id`.

The submitted Quotation is the preserved record of what was agreed at
submission. The Job is the editable working instruction until final handover,
with append-only Job Revisions preserving every earlier instruction. Each
issued Invoice is a separate immutable commercial snapshot. This preserves
what was agreed, what the factory was instructed to make at each revision, and
what was invoiced at each business step.

### Core integrity rules

| Rule | Applies to | Design intent |
|---|---|---|
| Exact commercial calculations | Quotation, Quotation Line, Job, Invoice, Invoice Line, Payment, Refund | Calculate authoritative money values using decimal-safe arithmetic and the SRS calculation order. Do not use binary floating-point values for authoritative totals (FR-1.10). |
| Historical snapshots and working revisions | Quotation, Job Revision and Invoice | Preserve the submitted Quotation and every issued Invoice. Admin may update the current Job before final handover, but each save appends a Job Revision and never rewrites the original quotation, a prior Job Revision, an issued Invoice or completed step event. |
| Stable shared pricing | Prepared Order Form, Prepared Form Option, Private Form Link | Sharing freezes the displayed options, charge methods and amounts. Catalogue/customer-price edits cannot change that offer. Replacement requires removing the old link and sharing a new form. |
| Transparent calculation | Prepared Form Option, Quotation Item, Quotation Charge | Calculate each item from the Admin-set base price and selected free/per-piece/per-order/fixed adjustments. Show the breakdown and shipping charge; do not apply an implicit compatibility rule or quantity tier. |
| Atomic confirmation | Quotation, Job, Job Billing Record, Invoice | Confirm order validates the reviewed quotation and deposit, then confirms the quotation, creates its one Job and issues the initial Invoice in one transaction. A retry cannot duplicate any result. |
| Atomic commercial Job edit | Job, Job Revision, Job Billing Record, Invoice | A commercial Admin Job save appends the Job Revision, supersedes the current Invoice and issues the next Invoice version in one transaction. It keeps the optional deposit unless it exceeds the new total, in which case it becomes the new total. After release it recalculates balance/readiness but never pauses or reverses production. Existing Payments and Refunds keep their original Invoice references and count once within the same billing record. |
| Release gates | Job, Invoice, Payment, Mockup | Release requires Admin action, a current mockup and an effective confirmed receipt total meeting the required deposit. RM0 satisfies the financial condition without a receipt. |
| Explicit lifecycle changes | Quotation, Job, Payment, Job Step Event, Handover Event | Apply only permitted SRS transitions. Required reasons and server-derived actor/time are recorded in history. |
| Production concurrency | Job, Production Step Definition, Job Step Event | The first valid current-step action wins. Stale competing actions fail without duplicate progress. Workflow edits affect unfinished work but never rewrite completed/skipped history or reopen handed-over jobs. |
| Handover gate | Job, settlement, Handover Event | Production completion plus full settlement enables normal handover. Only Admin may authorize handover with an unpaid balance and a reason; the balance remains open and visible as Not paid yet. |
| One active invoice per job | Job Billing Record, Invoice | Unique billing record per job; unique active invoice per billing record. Replacement atomically supersedes the old invoice and creates the new one (FR-7.7–FR-7.13). |
| Receipt-derived settlement | Job Billing Record, Invoice, Payment, Refund | Sum effective receipts minus effective refunds once across invoice history, compare with active invoice total, and show either amount due or refund due; never sum superseded invoice totals (FR-8.19). |
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
- Retain historical issued-document snapshots, step events, handover events,
  Payments, Refunds and Activity History rather than silently editing or
  deleting them.
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
Mutable roots (Catalogue Option, Customer Price Defaults, Prepared Order Form,
Quotation, Contact, Job, Production Workflow and Job Billing Record) have a
version; increment it once per committed aggregate mutation.

| Records | Required uniqueness and reference constraints | Transaction-only checks |
|---|---|---|
| Catalogue Option / Customer Price Default | Same-company ownership; price-default references belong to the same customer/company; exact amounts and valid charge methods | Deleting a catalogue option does not cascade into frozen forms or history; creating the same label later creates a new identity |
| Prepared Order Form / Options | Same-company customer; unique option order within category; valid copied labels, charge methods and amounts | Editable only while draft; sharing freezes the aggregate; removing a shared form invalidates its link and incomplete draft permanently |
| Private Form Link | Same-company Prepared Order Form/customer; unique token digest; one submission result | Validate shared state, expiry/removal and prior submission atomically; never persist or log the raw token |
| Quotation / Items | Unique quotation number; unique item order; submitted commercial snapshot immutable | Submit validates pricing and fulfilment; Confirm order locks the quotation and rejects duplicate confirmation |
| Job / Revisions / Items | Unique `(company_id,source_quotation_id)`; Job and source quotation/customer share company; unique revision number per Job | Confirmed marker, initial Job revision, billing record, Invoice and history commit together. Every later Admin save locks the current Job version and appends exactly one Job Revision. |
| Contact | Same-company references; display name and usable contact details; restrict deletion of referenced records | Historical snapshots do not change with later contact edits |
| Production Workflow / Step Events | Unique active sequence positions; step events belong to same-company Job and preserve step label/position | Workflow edits recalculate unfinished work only; step actions lock/version the Job so one current-step action wins |
| Job Billing Record | Unique `(company_id,job_id)`; same-company/customer Job; active invoice belongs to this billing record | Confirm order creates the initial billing state; all later billing writes serialize on this row |
| Invoice / Lines | Unique `(company_id,invoice_number)`; partial unique billing_id where lifecycle=active; replacement belongs to same billing record; unique replacement link and line_number | Supersede and replace together; immutable content; current pointer and active invoice agree at commit |
| Payment / Refund | Composite references enforce company and billing membership; positive amounts; refund source Payment required; valid recorded/voided enums | Aggregate refund/source caps, payment-void protection and dates; one billing lock protects all writes |
| Handover Event | Unique final event per Job; method matches saved fulfilment method | Require production complete; require full settlement or an Admin-only balance override with reason |
| Activity / request keys | Same-company subjects; actor from session in real-data mode; request identity unique by company/actor/operation/key | Insert activity and deduplication result with business transaction; sanitize change fields |

Use composite foreign keys/unique keys where ownership must survive incorrect
application code. Index foreign keys and list access paths: company+createdAt+id,
jobs company+status+dueDate+id, job revisions jobId+revisionNumber, quotations
company+status+createdAt+id, invoices billingId+issuedAt+id, step events
jobId+occurredAt+id, and activity
company+subjectType+subjectId+occurredAt+id. Do not cascade-delete historical
invoices, payments, refunds, step events, handover events or audit records. Exact migration syntax
and identity foreign keys must be reviewed when backend implementation is assigned.

## 5. Interface design

### API shape

The current baseline contains operation summaries followed by concrete JSON
contracts, paths, validation and errors. They define the frontend mock/backend
agreement; they do not authorize API implementation.

#### Sales and Jobs

| Operation | SRS link | Records | Must ensure |
|---|---|---|---|
| Save and submit priced form | FR-1, FR-2, FR-4 | Form link, Quotation, items, mockup versions, history | Resolve approved pricing, calculate totals, snapshot displayed values and create `submitted`; do not create a Job or Invoice. |
| Confirm order | FR-2, FR-3, FR-7 | Quotation, Job, billing record, Invoice, history | Admin supplies deposit RM0–total. Confirm quotation, create its single Job and issue the initial Invoice atomically and idempotently. |
| Edit Job | FR-3, FR-7 | Job, Job Revision, billing record, Invoice, step events, history | Admin only before handover/cancellation. Append a revision; commercial changes replace the current Invoice atomically and retain the optional deposit unless it exceeds the new total. After release, factory-relevant changes require a selected return step and repend that step onward. |
| Release production | FR-3 | Job, mockup, settlement, history | Admin only; require awaiting-release Job, current mockup and deposit condition. Start the first configured step; payment alone never releases. |
| Complete, skip or rework current step | FR-3, FR-5 | Job, step event, history | Require the individually granted action and current Job version. Complete is one tap; skip/rework require reason; advance or complete production automatically. |
| Reopen for rework | FR-3 | Job, step events, history | Admin only before handover; select return step and reason, clear readiness, preserve history and repend that step onward. |
| Record Shipped or Collected | FR-6 | Job, handover event, history | Require production completion and full settlement, or Admin-only handover-with-balance reason. Courier/tracking are optional for shipping. |

#### Billing and Activity History

| Operation | SRS link | Records | Must ensure |
|---|---|---|---|
| Issue initial Invoice within Confirm order | FR-7 | Job Billing Record, Invoice, Invoice Item | Use the confirmed quotation/Job snapshot and Admin-set deposit RM0–total; no separate first-invoice request exists. |
| Record or void Payment | FR-8 | Payment, Invoice, Activity History | Append a confirmed receipt and recalculate settlement. Void retains the Payment and requires a reason. After release, a void never reverses or stops production, but may block normal handover. |
| Replace invoice / settle cancellation (Billing) | FR-7.7–FR-7.13, FR-5.4 | Job Billing Record, Invoice/Lines, Activity History | One active invoice and immutable predecessors. Commercial Job edits replace it automatically; billing-only corrections require a reason, while cancellation settlement retains its agreement confirmation. Existing money records remain attached. |
| Record or void Refund (Billing) | FR-8.19–FR-8.27, FR-5.4 | Refund, Payment, Job Billing Record, Activity History | Confirm actual external return; enforce refundable/source caps and dates; preserve original on a reasoned recording correction. |
| Retrieve Activity History (Audit) | FR-5 | Activity History | Return Quotation, Job, Invoice, Payment, Refund and settlement entries by affected record/time, using the in-app label only—not secure identity attribution. |

#### Contacts

| Operation | SRS link | Records | Must ensure |
|---|---|---|---|
| Manage Contacts | FR-9 | Contact | Validate reusable customer details; changes apply prospectively and never rewrite submitted/issued snapshots. |

These operations describe intended ownership and integrity boundaries only.
They do not authorize implementing REST endpoints, database transactions or
backend services. Contract documentation remains within this three-document
set until another artifact is explicitly requested.

### UI/UX journey outline

This is a design outline, not a claim that the prototype implements it.
Complete each journey's detailed fields and exceptional paths before coding.

| Journey | User interaction | Visible result |
|---|---|---|
| Submit priced order | Customer or Admin opens the private form, chooses configured options/quantities, sees prices and fulfilment cost, optionally attaches mockup and submits | One submitted quotation retaining entered values and displayed prices; no Job or Invoice yet |
| Confirm order | Admin opens the submitted-order drawer, reviews missing information, sets deposit and confirms once | Quotation confirmed, Job created awaiting release and initial Invoice issued as one result |
| Release production | Admin resolves displayed deposit/mockup conditions and releases explicitly | Job enters production at the first current configured step |
| Track production | Granted Staff opens current work and completes one step, or skips/reworks with reason | Actor/time recorded, next step shown automatically; all steps complete production automatically |
| Record payment | Open the job/order drawer, choose deposit-needed, remaining balance or custom amount, verify prefilled date/method and confirm | Immutable receipt and refreshed deposit, balance and Ready/Not paid yet indicators |
| Fulfil order | Open completed job drawer and confirm Shipped or Collected; optionally expand shipping details | One handover event with actor/time; unpaid handover appears only as an Admin exception requiring reason |
| Edit Job / correct invoice | Admin edits the current Job drawer; a billing-only correction remains available in billing detail | A Job edit preserves a revision and updates the current Invoice when commercial values changed; earlier invoices and money records remain readable |
| Record refund | Open refund-due billing detail, select source receipt, confirm actual return details | Immutable refund/history and recalculated settlement; promise or excessive amount rejected |
| Manage contacts | Open contact list and edit/create customer or supplier | Validated contact available to its relevant workflow |

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
| Quotations | Review submitted priced forms | Submitted-order drawer with Needs changes and one Confirm order action |
| Jobs | See what needs production next | Board/list, job detail, stage/status action and relevant history |
| Billing | Find invoices and balances | Invoice detail, issue preview, payment confirmation and reasoned void |
| More | Reach supporting records | Contacts, settings and secondary history; deferred inventory is absent |

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
The adapter must update all affected records together for Confirm order,
payment and production scenarios, including linked history where required. Mock failures and
conflicts must be reproducible for acceptance checks. This design is not yet
implemented and does not alter the current prototype's actual behaviour.

### API contract baseline

Design version: 2026-09-23. These contracts are documentation, not implemented
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
  `AMOUNT_EXCEEDS_DUE`, `AMOUNT_EXCEEDS_REFUNDABLE`, `ORDER_ALREADY_CONFIRMED`,
  `RELEASE_CONDITIONS_UNMET`, `STEP_NOT_CURRENT`, `RECORD_ALREADY_VOIDED`; 422 `VALIDATION_FAILED`;
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
  dueDate: Date; requiredDepositAmount: Money; lines: InvoiceLineInput[];
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
terms are created inside Confirm order from the confirmed quotation and Job
snapshot, never client-submitted totals. Required deposit may be RM0 through
the invoice total.
Replacement billing display name/address may change but customerId cannot.
Replacement dueDate cannot precede replacement issue date. Currency is MYR;
no foreign-currency input or conversion is implied.

| Method and path | JSON input / query | Success body / rule |
|---|---|---|
| GET `/jobs/{jobId}/billing` | No body | BillingView; 404 if none exists |
| GET `/billing-records/{id}` | No body | BillingView |
| GET `/billing-records/{id}/invoices` | Common pagination | List of InvoiceView; includes superseded versions |
| GET `/billing-records/{id}/invoices/{invoiceId}` | No body | InvoiceView; both IDs must belong together |
| POST `/billing-records/{id}/replacements` | `{expectedVersion:number,terms:InvoiceTerms,reason:string}` | 201 BillingResult; billing-only correction, same job/customer and new number; cancelled job must use settlement route |
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

#### Quotation and production contracts

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
type ChargeMethod = 'free' | 'per_piece' | 'per_order' | 'fixed_item';
type SelectedOption = {preparedOptionId: UUID};
type DraftItem = {
  selections: SelectedOption[];
  sizeQuantities: {preparedOptionId:UUID; quantity:Quantity}[];
};
type QuotationInput = {
  dueDate: Date | null; sourceNote: string; items: DraftItem[];
  selectedCharges: {preparedOptionId:UUID; applicableQuantity:Quantity}[];
  fulfilmentMethod: 'shipping' | 'self_collection'; notes: string;
};
type QuotationView = QuotationInput & {
  id: UUID; preparedFormId: UUID; version: number; number: string;
  status: 'draft' | 'submitted' | 'needs_changes' | 'confirmed' | 'cancelled';
  jobId: UUID | null; createdAt: Timestamp;
  totals: {itemsTotal:Money; chargesTotal:Money; shippingCharge:Money;
    discountAmount:Money; taxAmount:Money; grandTotal:Money; provisional:boolean};
};
type JobStatus = 'awaiting_release' | 'in_production' | 'production_complete'
  | 'shipped' | 'collected' | 'cancelled';
type JobEditInput = {
  dueDate: Date; fulfilmentMethod: 'shipping' | 'self_collection';
  fulfilmentDetails: object; items: DraftItem[];
  selectedCharges: {preparedOptionId:UUID; applicableQuantity:Quantity}[];
  shippingCharge: Money; productionNotes: string; returnStepId?: UUID;
};
type JobView = {
  id: UUID; number: string; version: number; createdAt: Timestamp;
  status: JobStatus; dueDate: Date;
  currentStep: {id:UUID; label:string; position:number} | null;
  fulfilmentState: 'not_ready' | 'not_paid_yet' | 'ready' | 'handed_over';
  lines: {description:string; quantity:Quantity; unit:string}[];
  customer: {id:UUID; displayName:string} | null;
  sourceQuotationId: UUID | null;
};
```

Contact phone: 1–40 characters; email: valid address up to 254 characters;
at least one non-null contact method. Address up to 1000 characters. Changing
contact type is rejected if it invalidates existing references; archival UI
is deferred rather than exposing a destructive delete route.

The private form accepts only options copied into its Prepared Order Form.
Customer input supplies selections and quantities, never authoritative labels,
prices, charge methods or totals; the server reads those from the frozen form
and calculates the transparent breakdown. Drafts may be incomplete, but
submission requires at least one complete item, positive size quantities and
the approved fulfilment fields. Due date is a requested date, not an automatic
scheduling commitment.

JobView always omits financial values. Customer is null without contacts.view;
sourceQuotationId is null without quotations.view. Financial readers use the
separately authorized quotation/billing endpoints. In synthetic mode these
permissions are fixture projections, never security claims.

| Method and path | JSON input / query | Success / condition |
|---|---|---|
| GET `/contacts` | Pagination, optional `type`, `q` (0–100 chars) | List ContactView; q searches displayName |
| GET `/contacts/{id}` | None | ContactView |
| POST `/contacts` | ContactInput | 201 ContactView, version 1 |
| PUT `/contacts/{id}` | `{expectedVersion:number,contact:ContactInput}` | 200 ContactView; full replacement of editable fields |
| POST `/catalogue-options` | category, label and optional default charge metadata | 201 reusable option; Admin only |
| PUT `/catalogue-options/{id}` | expected version and replacement values | 200 option for future form preparation; frozen forms unchanged |
| DELETE `/catalogue-options/{id}` | expected version | 204; remove from future preparation; frozen forms/history unchanged |
| POST `/prepared-forms` | customer, selected/copied options, Admin-set prices, optional operational-field initial values and expiry | 201 editable draft prepared form |
| POST `/prepared-forms/{id}/share` | expected version | 201 frozen prepared form and private link |
| DELETE `/prepared-forms/{id}` | expected version | 204 for a draft or unsubmitted shared form; permanently remove access and discard incomplete input. Reject after submission; historical quotation remains |
| GET `/quotations` | Pagination, optional `status`, `q` | List QuotationView |
| GET `/quotations/{id}` | None | QuotationView |
| PUT `/form-links/{token}/draft` | QuotationInput | Save a private-form draft within the bound customer/pricing scope |
| POST `/form-links/{token}/submit` | `{expectedVersion:number}` | 201 submitted QuotationView; no Job or Invoice side effect |
| POST `/quotations/{id}/needs-changes` | `{expectedVersion:number,note:string}` | 200 QuotationView; keep correction in the review journey |
| POST `/quotations/{id}/confirm-order` | `{expectedVersion:number,requiredDepositAmount:Money,dueDate:Date}` | 201 quotation, Job, billing record and initial Invoice atomically; deposit may be `0.00` through total |
| GET `/jobs` | Pagination, optional `status`, `q` (job number), `dueFrom`, `dueTo` | List JobView; dueFrom <= dueTo |
| GET `/jobs/{id}` | None | JobView |
| PUT `/jobs/{id}` | `{expectedVersion:number,job:JobEditInput}` | 200 JobView and current billing summary. Admin only while not shipped, collected or cancelled. A released factory-relevant change requires `returnStepId`; a commercial change atomically returns the replacement Invoice and caps any optional deposit at the revised total. |
| POST `/jobs/{id}/release` | `{expectedVersion:number}` | 200 JobView; Admin only; current mockup and deposit conditions required |
| POST `/jobs/{id}/steps/{stepId}/complete` | `{expectedVersion:number}` | 200 JobView; permitted current-step action; actor/time server-owned |
| POST `/jobs/{id}/steps/{stepId}/skip` | `{expectedVersion:number,reason:string}` | 200 JobView; permitted current-step action |
| POST `/jobs/{id}/steps/{stepId}/rework` | `{expectedVersion:number,reason:string}` | 200 JobView; permitted production action |
| POST `/jobs/{id}/reopen-for-rework` | `{expectedVersion:number,returnStepId:UUID,reason:string}` | 200 JobView; Admin only before handover |
| POST `/jobs/{id}/handover` | `{expectedVersion:number,method:'shipped'|'collected',courier?:string,trackingReference?:string,allowBalance?:boolean,balanceReason?:string}` | 200 JobView; settled normally; balance exception Admin-only with reason |

Quotation and Job history endpoints are GET `/quotations/{id}/activity` and
`/jobs/{id}/activity`, using the shared history shape and pagination; quotation
history covers its review events. Job history excludes billing payloads; billing
history requires billing.view. Read routes require domain view permission;
mutation permissions are mapped below. There are no generic delete endpoints
for documents, money or production history.

#### Workflow transition tables

| Aggregate/action | Required state | Result / side effect |
|---|---|---|
| Submit priced form | Complete valid draft and active private link | `submitted`; snapshot visible prices/options; no Job or Invoice |
| Request changes | Submitted quotation | `needs_changes`; retain review history and allow corrected resubmission |
| Confirm order | Submitted quotation; Admin-selected deposit RM0–total | `confirmed`; create awaiting-release Job, billing record and initial Invoice atomically |
| Edit Job | Admin; Job not shipped, collected or cancelled; current version | Append Job Revision and history. Commercial change atomically replaces current Invoice and caps any optional deposit at the revised total. After release, a factory-relevant change requires selected return step, repends it onward and reopens production when necessary. |
| Release | Awaiting-release Job; current mockup; deposit condition met | `in_production` at first configured step; Admin action required |
| Complete current step | In production; permitted current-step action | Append actor/time event and advance; final step makes `production_complete` |
| Skip current step | In production; permitted current-step action; reason | Append reasoned event and advance like completion |
| Rework current step | In production; permitted action; reason | Append reasoned rework event and keep/return work to the applicable current step |
| Reopen for rework | Production complete, not handed over; Admin; return step and reason | `in_production`; clear readiness and repend selected step onward |
| Workflow edited | Unfinished Job | Reconcile remaining steps to company sequence; preserve completed/skipped history; added work may reopen production-complete Job |
| Record Shipped/Collected | Production complete and fully settled | Final handover state and event |
| Allow handover with balance | Production complete, unpaid; Admin; reason | Final handover state; balance remains open and shown Not paid yet |

Shipped and Collected jobs are closed. A payment void after release recalculates
settlement and readiness but never reverses or pauses physical production.

#### Future permission operation map (D5)

Admin can perform authorized business operations within their company, but
cannot bypass immutable-history rules. Staff receive no grants initially;
Admin assigns each action individually. Write operations also require the
corresponding view grant. The design uses explicit business actions rather
than generic CRUD groupings.

| Area | View grant | Separate write grants |
|---|---|---|
| Contacts | contacts.view | contacts.create, contacts.update |
| Quotations | quotations.view | quotations.prepare_form, quotations.request_changes, quotations.confirm_order, quotations.cancel |
| Production | production.view_current | production.attach_mockup, production.complete_step, production.skip_step, production.rework_step, production.manage_workflow |
| Fulfilment | fulfilment.view_ready | fulfilment.ship, fulfilment.collect |
| Billing | billing.view | billing.replace, billing.settle_cancellation, billing.record_payment, billing.void_payment, billing.record_refund, billing.void_refund |

Grant and Staff-account administration are Admin-only in the planned real-data
system; Staff cannot create accounts or grant themselves actions. These
administration actions are independent of quotation, invoice, payment and job
workflows. Admin-only release, reopen-for-rework and allow-handover-with-balance
remain role checks rather than Staff-grantable actions. Preparing a private form
needs contacts.view to select a customer.
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
| AT-02 Submit/confirm | Submission creates only one submitted quotation; Confirm order with deposit RM0–total creates one confirmed quotation, awaiting-release Job and initial Invoice atomically; retry duplicates nothing | FR-1, FR-2, FR-3, FR-7 |
| AT-03 Production lifecycle | Release rejects missing mockup/unmet positive deposit but accepts RM0 without receipt; one-tap current-step completion wins concurrent attempts; workflow edits preserve history; rework and handover rules hold | FR-3, FR-5, FR-6 |
| AT-04 Invoice/payment | Initial Invoice exists from Confirm order; RM700 deposit + RM1,000 later receipt settles RM1,700 on the same billing record; void recalculates without reversing released production; reject invalid or duplicate effects | FR-7, FR-8, FR-5 |
| AT-04a Correction/settlement | No-receipt correction preserves original; with RM700 received, corrected RM1,500 leaves RM800 due, corrected RM500 leaves RM200 refund due; cancellation charge RM200 leaves RM500 refund due; zero charge yields full refund | FR-7.7–FR-7.13, FR-8.19, FR-5.4 |
| AT-04b Refund integrity | Confirmed external refunds reduce refund due; reject wrong source/date, excess and duplicate effects; block source payment void with effective refunds; refund-record void restores the correct balance; concurrent replacements/refunds preserve constraints | FR-8.20–FR-8.27, SEC-5/SEC-6 |
| AT-05 Contacts/form link | Customer-bound private link uses the correct pricing context, expires/revokes safely, and later contact edits do not rewrite submitted or issued snapshots | FR-1, FR-9, NFR-4 |
| AT-06 Responsive recovery | All journeys usable on mobile/tablet/desktop and keyboard, with loading/empty/failure/unsaved states; demo reset disclosed | FR-10, FR-11, NFR-1, NFR-2; §5 screen design |
| AT-07 Boundaries/contracts | Domain tests run without UI; mock and server match the agreed contract; entry points contain composition rather than feature rules | NFR-3; §2 and §5 |
| AT-08 Real-data security | Direct unauthorized/tampered requests fail; session revocation, ownership, logging and duplicate/concurrent writes tested; backup restored | SEC-1–SEC-7; D5 and backend design decisions |

### Deposit, correction, refund and cancellation design

The Billing module owns one Job Billing Record per invoiced job/customer.
Initial invoicing occurs atomically inside Confirm order and snapshots the
confirmed quotation and initial Job revision. A commercial Job edit creates a
new current Invoice version automatically, preserving the original and its
receipt links. A billing-only correction remains a reviewed replacement with a
reason. Neither path changes customer identity, the historical quotation or an
earlier Job revision.
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
| Edit Job with commercial change | Accept Job ID, expected version, current Job values, conditional return step and request identity. Admin only; lock Job and billing record, append Job Revision, recalculate prices, supersede current Invoice, create its numbered replacement/lines, cap the optional deposit at the revised total, update the active pointer and record history together. Return Job, current Invoice and settlement; never move original payments. |
| Replace invoice | Accept billing ID, expected version, corrected values, reason and request identity. Authorize, lock billing record, validate billing-only changes (use settlement flow for cancelled jobs), supersede original, create numbered replacement/lines, update active pointer and record history together. Return new invoice and settlement; never move original payments. |
| Settle cancellation | Accept expected version, confirmed charge/lines and agreement note. Job must be cancelled. Lock billing record; retain active invoice if charge is unchanged, otherwise replace it atomically. Record confirmation/history and clear pending review. No automatic refund. |
| Record refund | Accept source Payment, positive amount, actual date/method/reference, reason, version and request identity. Lock billing record and validate source membership/status, refund due and source cap. Insert refund and history together; return settlement. No external money-transfer call. |
| Void payment/refund record | Accept record ID, expected version, reason and request identity. Reject repeated void, wrong billing record or Payment with effective linked refunds. Retain original and record history; recalculate settlement. This corrects a recording mistake, not a real transfer. |

All billing mutations serialize on the same Job Billing Record and increment
its version. Confirm order uses unique quotation-to-Job and Job-to-billing
ownership to handle concurrent requests. Job cancellation and its pending billing
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
- The synthetic prototype may display projected Admin/Staff views without
  claiming secure authorization. Before real data, Admin-managed Staff accounts,
  default-no-grant behavior and server-enforced business-action grants require
  a separately approved identity/session design and implementation.
- Cross-cutting acceptance checks are documented in SRS § 4. Full traceability
  links from requirements through planned operations, transactions, and final
  acceptance tests must be completed per journey before its implementation.
- **Designed 2026-09-09:** Company ownership and same-company references are
  required under §4. Authentication must bind the session to that ownership
  before any real-data API is exposed. Multi-company management remains excluded.
