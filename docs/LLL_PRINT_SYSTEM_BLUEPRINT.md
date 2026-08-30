# LLL Print Product Analysis and Reconstruction Blueprint

**Prepared:** 27 August 2026  
**Reference product reviewed:** <https://www.nzprintflow.my/#/dashboard>  
**Assessment type:** External black-box product inspection  
**Purpose:** Document the observable product so a comparable print-shop management system can be planned and built.

> This report supports the original LLL Print implementation using observable product concepts from the referenced platform. It does not contain or claim access to third-party source code, private APIs, database internals, proprietary algorithms, branding, copy, or visual assets.

## 1. Executive Summary

LLL Print is planned as a responsive, multi-company print-production management platform for Malaysian apparel printing businesses. Its blueprint combines customer and supplier management, print jobs, production workflows, quotations and invoices, inventory and stock movements, finance, reminders, analytics, staff access, QR-assisted factory operations, WhatsApp communication, and AI-assisted planning in one application.

The observed product has two main experiences:

1. A public marketing and customer-service layer containing product information, pricing, login, order tracking, quote requests, privacy information, and onboarding content.
2. An authenticated business application for owners and staff to run daily print-shop operations.

The system is suitable as a reference for building a print-shop ERP, but a successful reconstruction should first implement the operational core—customers, jobs, workflow stages, inventory, documents, and payments—before adding AI, advanced accounting, cryptographic stock ledgers, and subscription automation.

## 2. Assessment Scope and Method

### 2.1 Work performed

- Accessed the public website using a real Chromium browser.
- Signed into a user-provided trial session through a separate interactive browser profile.
- Inspected public and authenticated navigation routes.
- Recorded visible headings, buttons, fields, tables, filters, empty states, and redirects.
- Opened important data-entry dialogs without submitting them.
- Captured desktop screenshots at 1440 × 900.
- Captured mobile screenshots at 390 × 844.
- Monitored visible browser console warnings and failed page requests.
- Avoided creating, editing, submitting, paying, deleting, or exporting private account data.

### 2.2 Limitations

- This was black-box testing; backend code, database rules, server authorization, and private APIs were not inspected.
- Mutating workflows were documented from their visible forms but were not submitted.
- Email, WhatsApp, payment, OCR, notification, QR-camera, PDF/Excel export, and AI-provider delivery were not executed end-to-end.
- Super-administrator functions were identified from observable routes but not accessed with a super-administrator account.
- Exact calculations and subscription enforcement rules require controlled test records or owner documentation to verify.

### 2.3 Evidence confidence

- **Verified:** Directly observed in the browser.
- **Observed but not submitted:** Form/dialog was opened and inspected without saving.
- **Inferred:** Likely requirement derived from visible labels, outputs, navigation, or relationships.

## 3. Product Positioning

### 3.1 Target users

- Sublimation apparel printers
- Silkscreen or sablon businesses
- DTF and heat-press operators
- Embroidery businesses
- Mixed-method apparel factories
- Business owners, administrators, production staff, finance staff, and customers

### 3.2 Main value proposition

The public site describes “Net Zero Print Flow” through three goals:

- Reduce material waste through stock monitoring and defect analysis.
- Reduce factory downtime through job sequencing and production visibility.
- Reduce profit leakage through cost and finance calculations.

### 3.3 Commercial model

Observed public plans:

| Plan | Public price | Jobs/month | Staff seats | Promoted capabilities |
|---|---:|---:|---:|---|
| Lite | RM20/month | 20 | 1 | Inventory, invoices, reminders |
| Smart | RM60/month | 100 | 3 | AI planning, cost analysis, ink calibration |
| Elite | RM150/month | 250 | 5 | Defect AI, audit ledger, priority support |
| Trial | 14 days | Trial allowance | Trial allowance | Broad/Elite-like feature access |

The observed trial account displayed a persistent expiry countdown and a finite AI-credit allowance.

## 4. Information Architecture

### 4.1 Public routes

| Route | Purpose |
|---|---|
| `/#/` | Marketing homepage |
| `/#/about` | Product/company explanation |
| `/#/limits` | Plan limits and tier comparison |
| `/#/login` | Business application login |
| `/#/track` | Public customer order tracking |
| `/#/request-quote` | Public quotation request |
| `/#/privacy`, `/#/privacy-policy` | Privacy documentation |
| `/#/pdpa` | Malaysian PDPA information |
| `/#/getting-started` | Onboarding guidance |
| `/#/feedback` | Feedback flow |

### 4.2 Main authenticated navigation

1. Dashboard
2. Reminders
3. Print Jobs
4. Documents
5. Customers
6. Inventory
7. Stock
8. Finance
9. Insight

Profile and utility areas provide notifications, business configuration, AI settings, staff management, subscription management, data/privacy controls, logout, and QR scanning.

### 4.3 Additional observed routes

`/analytics` and `/defects` redirect to the combined `/insight` page. `/profile/pricing` redirects to the Business Profile pricing tab. Separate routes also exist for AI settings, subscription, notifications, staff, profile editing, credentials, and super-administrator functions.

## 5. Roles and Access Model

### 5.1 Observable roles

- **Owner:** Full company-level access, settings, staff, billing, and operational modules.
- **Staff:** Invited user with module-specific permissions.
- **Customer/public visitor:** Uses tracking, proofing, quote request, and public information without normal staff login.
- **Super administrator:** Platform-level administration across companies, owners, billing, leads, vouchers, notifications, and WhatsApp configuration.

### 5.2 Staff permission model

The Add Staff dialog exposes a permission matrix with `View`, `Add`, `Edit`, and `Delete` permissions for:

- Reminders and alerts
- Inventory
- Print jobs
- Stock management
- Customers and suppliers
- Financials

### 5.3 Recommended authorization implementation

Store permissions server-side and enforce them on every API request. Hiding a button in the browser is not sufficient. Recommended primitives:

- `companies`
- `users`
- `company_memberships`
- `roles`
- `permissions`
- `role_permissions`
- optional per-user permission overrides

## 6. Detailed Module Specification

### 6.1 Authentication

### Verified interface

- Username field
- Password field
- System Login mode
- Forgot-password action
- Access Platform submit button
- Links to customer tracking, plans, about, and privacy

### Required behavior for a comparable system

- Secure session creation and logout
- Password reset
- Rate limiting and generic invalid-login messages
- Multi-company membership selection if a user belongs to multiple companies
- Server-side role and subscription checks
- Audit records for login, logout, password reset, and sensitive changes

### 6.2 Dashboard

### Verified sections

- Subscription expiry banner
- Store Overview heading
- Share Quote Form action
- Date filters: Day, Week, Month, Year, Custom
- Smart Reorder Reminders
- FlowSmart AI Run Planner
- Low-stock count
- Pending-feedback count
- Active-printing count
- Completed-jobs count
- Today’s Production Agenda
- My Tasks
- Personal pending items
- Team pending overview
- Current Stock Distribution chart
- Jobs Created chart
- New Task action
- Global QR scanner

### Observed AI planner output

Planner items show rank, job title, score, material availability/risk, a short recommendation, and a link to production. The user can generate or delete a plan.

### Rebuild requirements

Dashboard metrics should be calculated for a selected date range and company. Empty states must not consume excessive vertical space. Manual refresh and last-updated timestamps are recommended for operational confidence.

### 6.3 Smart Reminders and Action Center

### Verified sections

- Total alerts
- Overdue jobs
- Low-stock alerts
- Pending proof approvals
- Search
- Reminder type tabs
- Card/table view switch
- Refresh Alerts
- AI Rescue Plan
- Past Plans

### Inferred reminder rules

- Job due date approaching or overdue
- Inventory below safety threshold
- Proof sent but not approved within a configured period
- Possible one-click WhatsApp follow-up
- Assigned staff and completion state

Recommended reminder entity fields: type, severity, source entity, due time, assignee, status, suggested action, generated-by, created-at, resolved-at.

### 6.4 Print Jobs

### Verified list features

- List and calendar views
- AI Run Plan
- QR scan
- New Job
- Search by Job ID, customer, or title
- Filters for status, print type, customer, and overdue jobs
- Summary cards for overdue, due today, due this week, and on track
- Status tabs: All, Pending, Printing, Completed, Cancelled
- Total unit count
- Sort order
- Per-job actions for WhatsApp notification, edit, jobsheet printing, proof upload, and more actions

### Verified New Print Job form (opened, not submitted)

General fields:

- Customer
- Due date
- Title/reference
- Print type: Sublimation, Silkscreen, Embroidery, Heatpress, Custom
- Material
- Calculated total quantity
- Internal notes

Print consumption fields:

- Width in metres
- Height in metres
- Coverage percentage
- Automatic stock deduction context

Equipment assignment:

- Printers
- Heaters
- Presses
- DTF printers
- Embroidery machines
- Neck-tag assignment

Sublimation apparel specification:

- Pattern/cutting style
- Collar style and quick collar selection
- Collar-tube artwork
- Care-tag/neck artwork

Item breakdown and assets:

- AI-assisted import
- Excel/CSV import
- Multi-variant customer mockups
- Print/vector layout proof
- Custom production flow and schedule
- Default stages observed: Print, Heat, Cut, Sew, QC

### Suggested job lifecycle

`Draft → Pending Proof → Approved → Scheduled → Printing/Production → Quality Control → Ready → Delivered → Completed`

Cancellation should be a separate terminal state. Stage histories should be append-only and include actor, timestamp, quantity completed, defect quantity, note, and attachment.

### 6.5 Documents: Quotations and Invoices

### Verified list behavior

- Separate Invoice and Quotation tabs
- Search by document ID, customer, or job
- Date filter
- Payment/status filter
- Document table with ID, date, customer, service, amount, status, and actions
- WhatsApp send
- Preview/print
- Mark paid or unpaid
- FlowSmart AI Import
- Create Quote

### Verified quotation form (opened, not submitted)

- Existing or new customer
- Service type
- Job title/description
- Optional material
- Item breakdown
- Excel/CSV import
- Total quantity
- Due date
- TrueCost price recommendation
- Base unit price
- Design/setup fee
- Deposit amount
- Deposit percentage
- Tax rate
- Per-unit add-ons
- Grand-total estimate

### Required document rules

- Immutable document number after issue
- Draft and issued states
- Quote acceptance/rejection/expiry
- Conversion of accepted quote to job and invoice
- Deposit, balance, tax, discounts, add-ons, and payments
- PDF rendering from company branding and billing settings
- Currency stored as an ISO code, not inferred from a symbol
- Malaysia-oriented invoice export should be designed against current LHDN requirements and validated separately

### 6.6 Contacts: Customers and Suppliers

### Verified features

- Page navigation label is Customers; page heading is Contacts
- Customer and Supplier tabs
- Card and table views
- Search
- Add New
- More-actions menu
- WhatsApp indicator/action

### Verified contact form (opened, not submitted)

- Customer/Supplier type
- Name
- International phone prefix selector
- Phone number
- Optional email
- Internal notes
- WhatsApp consent checkbox

### Recommended extensions

- Multiple contact people and addresses
- Tax/registration identifiers
- Credit terms and credit limit
- Communication history
- Linked quotes, jobs, invoices, payments, and proofs
- Consent source, timestamp, and withdrawal status

### 6.7 Inventory and Bill of Materials

### Verified features

- Stock Items tab
- Auto-Deduct (BOM) tab
- Grid and list views
- QR/bin scanning
- Add Item
- Search
- Category filters: Shirt, Sublimation, Silkscreen, Embroidery, Heatpress, Other, and custom categories
- Per-item stock in/out, quick minus one, quick plus one, QR asset tag, edit, and additional actions

### Verified Add Item form (opened, not submitted)

- Item image
- Core or custom category
- Quick-suggestion classification
- OCR/scan-photo auto-fill
- Item name/title
- Colour
- Size
- Fabric type/material
- Current quantity
- Low-stock threshold
- Purchase cost per unit
- Main supplier

### BOM behavior to implement

A BOM or recipe maps a product/service variant to materials and quantities. Completing a stage or job should optionally create stock-out movements from the relevant BOM, with preview and confirmation. Reversal must generate compensating movements rather than deleting audit history.

### 6.8 Stock Intelligence and Ledger

### Verified features

- Today’s inflow/outflow
- Active batch count
- Ledger integrity percentage
- Audit Ledger tab
- Active Batches (FIFO) tab
- Material Burn and Forecast tab
- Search by item, reason, PO number, batch lot, or SHA hash
- Item and movement-type filters
- Refresh ledger
- Excel export
- Log Movement
- Per-item adjustment

### Observable positioning

The UI promotes a SHA-256 chained audit ledger, FIFO/LIFO batch lifespan, and material velocity. Exact cryptographic implementation was not verifiable through black-box testing.

### Recommended stock model

- Inventory item
- Storage location/bin
- Batch/lot
- Stock movement
- Movement line
- Supplier purchase reference
- Job consumption reference
- Adjustment reason
- Unit cost
- Previous hash/current hash if a tamper-evident chain is required

Never update “quantity on hand” without a corresponding movement. Quantity should be derived or transactionally maintained from the movement ledger.

### 6.9 Finance and Accounting

### Verified top-level views

- Financial Summary
- Data Entry / Transactions
- Profit and Loss
- Balance Sheet
- Tax Summary (SST/GST)
- Cash Flow Statement
- Trial Balance
- Comprehensive Income
- Partner’s Equity
- Asset Depreciation
- Opening Balances
- Date-range filters

### Verified summary metrics

- Gross profit
- Administrative expenses
- Net profit
- Estimated tax and zakat provision

### Build recommendation

For an MVP, implement operational finance rather than a complete accounting package:

- Sales documents and payments
- Expenses
- Cost of goods sold
- Simple profit summary
- Tax configuration
- CSV/Excel export

A real general ledger, trial balance, balance sheet, and statutory reporting require double-entry accounting rules, period locking, chart of accounts, journals, reconciliation, and professional accounting review. These should be a later phase or integrated with established accounting software.

### 6.10 Insight, Production Analytics, Defects and Feedback

### Verified navigation

- Date filters
- Production tab
- Defects & Waste tab
- Customer Feedback tab

### Verified metrics/charts

- Overdue impact and estimated loss
- Average job lead time
- Current production bottleneck/jam
- Redo/defect impact
- Stage Execution Statistics
- Average Time per Stage
- Completion Time by Print Type

### Recommended event model

Analytics should be derived from event records rather than mutable summary fields:

- job created
- proof requested/approved/rejected
- stage queued/started/paused/completed
- units accepted/rejected
- defect recorded with reason and image
- material consumed/wasted
- invoice issued/paid
- job delivered

### 6.11 Tasks and Production Agenda

### Verified task form (opened, not submitted)

- Task description
- Staff assignee
- Normal/high priority
- Assign Task action

Recommended fields include source job, due date/time, status, creator, assignee, completion timestamp, and comments.

### 6.12 Notifications

### Verified features

- In-app notification list
- Enable Background Alerts
- Empty state for low-stock and completed-job alerts
- Notification access from the top bar

Implementation should separate notification events, delivery channels, user preferences, delivery attempts, and read status. Browser push permission must only be requested in response to a user action.

### 6.13 Staff Management

### Verified features

- Staff list
- Current seat usage and plan limit
- Role display
- Add Staff
- Module permission matrix

### Verified Add Staff fields (opened, not submitted)

- Full name
- Username
- Email
- Password
- Per-module View/Add/Edit/Delete permissions

For production, staff should normally receive an invitation to set their own password rather than an owner assigning a reusable password.

### 6.14 Business Profile and Configuration

### Verified tabs

- General Info
- Billing
- Pricing Rules
- Production
- Workflows

### Verified configuration areas

- Company logo
- Company/business name
- Company registration/SSM number
- Phone and email
- Public/company slug
- Address
- Bank details
- Receipt reference/configuration
- Invoice notes
- Equipment names
- Dynamic production equipment
- Default print area and stock deduction
- Sublimation apparel and collar specifications
- Custom categories and workflow definitions

These settings provide templates and defaults for jobs, invoices, costing, and workflow stages.

### 6.15 AI/Intelligence Configuration

### Verified settings areas

- Manufacturing logic
- Hourly labour/operating context
- Electricity rate
- Machine value and lifespan/depreciation factors
- ProofFlow translation settings
- Financial strategy and target margin context

### AI capabilities promoted or exposed

- Print-job sequencing and rescue planning
- Reorder prediction
- TrueCost price recommendation
- Receipt/inventory OCR
- Order extraction from text/images/WhatsApp-like content
- Excel/CSV-assisted import
- Defect/waste analysis
- Customer feedback analysis
- Translation/proof communication
- Supplier purchase-enquiry drafting

### Safe architecture recommendation

AI output must be advisory. Store the prompt version, model, structured output, confidence, user acceptance/rejection, and cost. Validate all structured output server-side before it can create or modify business data. Never let AI silently post financial or stock transactions.

### 6.16 Subscription

### Verified features

- Trial status and countdown
- Current plan
- AI credit usage
- Upgrade prompt
- Lite, Smart, and Elite comparison
- Contact-to-subscribe actions
- Subscription/receipt area

Recommended enforcement should occur server-side using entitlements such as jobs per month, seats, AI credits, OCR operations, translation credits, planning range, and premium analytics access.

### 6.17 Data and Privacy

### Verified features

- Malaysian PDPA explanation
- Download My Data (JSON)
- Account deletion/right-to-erasure information
- Consent withdrawal initiation
- Full privacy-policy link

Recommended implementation needs a data-export job, verified deletion workflow, retention rules, legal-hold exceptions, consent ledger, and administrator audit trail.

### 6.18 Customer Tracking and Proofing

The public product claims a unique tracking link that can be sent through WhatsApp. Customers can view production status, inspect artwork mockups, approve/reject proofs, and see invoice balances without a staff account.

Recommended security model:

- Use a high-entropy, revocable public token rather than a sequential job ID.
- Display only customer-safe data.
- Record proof version, decision, signer name, timestamp, IP metadata where lawful, and consent.
- Expire or rotate links after completion when appropriate.

### 6.19 Super-Administrator Area

Observable routes indicate platform administration for:

- Companies
- Owners
- Billing history
- Leads
- Vouchers
- Notifications
- Receipts
- WhatsApp configuration

This should be a separate authorization boundary from company administration, protected by strong authentication and comprehensive audit logging.

## 7. Core End-to-End Workflows

### 7.1 Quote-to-cash

1. Create/select customer.
2. Create quotation with items, quantity, due date, pricing, tax, deposit, and add-ons.
3. Send preview/link through WhatsApp or another channel.
4. Customer accepts quotation and proof.
5. Convert quote into print job.
6. Schedule production stages and assign equipment/staff.
7. Consume materials through BOM/stock movements.
8. Complete QC and mark job ready/delivered.
9. Issue invoice, record deposit and remaining payment.
10. Update finance summaries and customer history.

### 7.2 Stock replenishment

1. Calculate on-hand and forecast material burn.
2. Generate low-stock reminder.
3. Review recommended reorder quantity.
4. Draft supplier enquiry or purchase order.
5. Receive goods into a batch/lot.
6. Record unit cost and supplier reference.
7. Update forecast and ledger.

### 7.3 Proof approval

1. Upload one or more mockup variants.
2. Create a proof version.
3. Send secure public link.
4. Customer approves or rejects with feedback.
5. Reminder is generated if no response is received.
6. Approved version is locked to the job.

### 7.4 Production execution

1. Prioritize jobs manually or with AI suggestions.
2. Assign equipment, stages, and staff.
3. Worker scans a QR code or opens the job.
4. Start/complete each stage and record quantities.
5. Record defects, waste, rework, and notes.
6. Complete QC.
7. Notify customer and prepare delivery.

## 8. Proposed Data Model

### 8.1 Identity and tenancy

- `companies`
- `users`
- `memberships`
- `roles`
- `permissions`
- `sessions`
- `audit_events`

### 8.2 CRM

- `contacts`
- `contact_people`
- `addresses`
- `communication_consents`
- `communication_events`

### 8.3 Sales and documents

- `quotes`
- `quote_lines`
- `invoices`
- `invoice_lines`
- `payments`
- `document_sequences`
- `document_files`

### 8.4 Production

- `print_jobs`
- `job_items`
- `job_variants`
- `job_stages`
- `stage_events`
- `workflow_templates`
- `workflow_template_stages`
- `equipment`
- `equipment_assignments`
- `proofs`
- `proof_versions`
- `proof_decisions`
- `defects`
- `tasks`

### 8.5 Inventory

- `inventory_items`
- `inventory_categories`
- `storage_locations`
- `stock_batches`
- `stock_movements`
- `stock_movement_lines`
- `bom_recipes`
- `bom_lines`
- `suppliers`

### 8.6 Finance and platform

- `expenses`
- `expense_categories`
- `accounts`
- `journal_entries` and `journal_lines` if full accounting is required
- `subscriptions`
- `plans`
- `entitlements`
- `usage_counters`
- `notifications`
- `notification_deliveries`
- `ai_runs`

Every business table should carry `company_id`. Important records should use created/updated timestamps, creator/updater IDs, soft deletion where appropriate, and version or concurrency controls.

## 9. State and Business Rules

### 9.1 Suggested job statuses

- Draft
- Pending
- Awaiting proof
- Approved
- Scheduled
- Printing/in production
- QC
- Ready
- Delivered
- Completed
- Cancelled

### 9.2 Suggested document statuses

- Quote: Draft, Sent, Viewed, Accepted, Rejected, Expired, Converted
- Invoice: Draft, Issued, Partially Paid, Paid, Overdue, Void
- Proof: Draft, Sent, Viewed, Approved, Rejected, Superseded
- Task: Open, In Progress, Blocked, Completed, Cancelled

### 9.3 Important invariants

- A completed stock movement cannot be deleted; correct it with a reversal.
- An accepted proof version cannot be silently replaced.
- An issued invoice preserves its historical amounts and customer details.
- Stage completion cannot exceed the relevant job quantity without an explicit overrun rule.
- Cross-company records must never be accessible through guessed identifiers.
- Subscription limits must be checked transactionally on the server.

## 10. Non-Functional Requirements

### 10.1 Responsive/PWA behavior

The inspected application has desktop sidebar navigation and a mobile header plus fixed bottom navigation. Core pages fit a 390-pixel viewport without document-level horizontal overflow. A comparable system should support intermittent factory connectivity, installable PWA behavior, camera/QR access, and touch targets of at least 44 CSS pixels.

### 10.2 Security

- TLS everywhere
- Secure, HTTP-only, SameSite cookies
- CSRF protection where cookie authentication is used
- Strong tenant isolation
- Server-side RBAC
- Rate limiting on login, public tracking, quote requests, OCR, and AI endpoints
- Malware/type validation for uploads
- Signed short-lived download URLs or authorized file proxying
- Secret management outside frontend bundles
- Append-only audit logs for sensitive operations
- Backup, recovery, and retention plans

### 10.3 Accessibility

- Proper labels for every form control and icon action
- Keyboard-operable dialogs and menus
- Focus trapping and focus return for dialogs
- Visible focus indicators
- Sufficient colour contrast
- Text alternatives for charts and status colours
- Status should not rely on colour alone

### 10.4 Localization

- English and Malaysian Malay content
- Malaysian date format such as `27/08/2026` or an unambiguous localized long date
- `MYR`/`RM` currency formatting
- Configurable timezone, defaulting to Asia/Kuala_Lumpur
- International phone formatting with Malaysian defaults

## 11. Recommended Technical Architecture

One practical implementation for a new product:

- **Frontend:** React with TypeScript, a client router, component library/design tokens, form validation, and a chart library
- **Backend:** Cloudflare Workers/Hono, Node/NestJS, or another typed API framework
- **Database:** PostgreSQL for mature transactional/accounting needs, or Cloudflare D1 for a controlled MVP
- **File storage:** R2 or S3-compatible object storage
- **Background work:** Queues for PDF generation, exports, notifications, OCR, AI, and webhook retries
- **Authentication:** Managed identity provider or carefully implemented password/session service
- **Realtime:** Server-sent events, WebSockets, or database-backed polling for production boards
- **Observability:** Structured logs, error tracking, request tracing, and product analytics
- **Integrations:** WhatsApp Business provider, email provider, push notifications, LHDN-compatible integration/export, and optional accounting integration

### Suggested service boundaries

Keep one deployable application for the MVP but separate code by domain:

- Identity and tenancy
- CRM
- Sales documents
- Production
- Inventory
- Finance
- Notifications
- AI/automation
- Subscription/billing

Avoid microservices until scale or organizational ownership requires them.

## 12. MVP and Delivery Roadmap

### Phase 1 — Operational foundation

- Authentication and company tenancy
- Owner/staff roles
- Customers and suppliers
- Print jobs and configurable stages
- Basic dashboard
- Inventory items and stock movements
- Quotes and invoices
- File/mockup upload
- Responsive desktop/mobile UI
- Audit logging

### Phase 2 — Factory workflow

- QR job and bin scanning
- Equipment assignment
- Jobsheets
- Proof approval portal
- BOM and automatic stock deduction
- Tasks and reminders
- WhatsApp/email notifications
- PDF and Excel exports

### Phase 3 — Business intelligence

- Production event analytics
- Defect and waste tracking
- Cost and margin calculation
- Forecasting
- Finance summaries
- Subscription tiers and usage enforcement

### Phase 4 — Advanced platform

- AI import/OCR and planning
- Advanced accounting or accounting integration
- LHDN integration validated against current specifications
- Super-administrator console
- Vouchers, automated billing, and platform reporting

## 13. Black-Box Findings and Improvement Opportunities

| ID | Severity | Observation | Rebuild recommendation |
|---|---|---|---|
| BB-01 | High | Authenticated financial, document, inventory, and quote interfaces display `$` despite Malaysian/RM product positioning. | Store ISO currency per company/document and render `RM`/`MYR` consistently. |
| BB-02 | Medium | Dates appeared as `8/27/2026`, an ambiguous US-style format. | Use Malaysian locale and an unambiguous format. |
| BB-03 | Medium | Navigation says “Customers,” while the screen heading says “Contacts” and includes suppliers. | Rename navigation to Contacts, or split Customers and Suppliers clearly. |
| BB-04 | Medium | Inventory and Stock are adjacent concepts with overlapping terminology. | Label Inventory as “Items & BOM” and Stock as “Movements & Batches,” with explanatory subtitles. |
| BB-05 | Medium | The trial expiry countdown occupies a prominent banner across authenticated screens. | Use a compact, dismissible status notice except near expiry. |
| BB-06 | Medium | Dashboard and Insight emitted chart warnings reporting negative container width/height during initial rendering. | Give chart containers explicit minimum dimensions and add responsive tests. |
| BB-07 | Medium | Several icon-only buttons had a tooltip title but no accessible name; some buttons were completely unlabeled in the DOM. | Add `aria-label`, keyboard focus, and visible tooltips to every icon action. |
| BB-08 | Low | `/analytics` and `/defects` redirect to `/insight`; pricing redirects into a business-profile tab. | Use one canonical route in navigation and preserve the requested tab via explicit route state. |
| BB-09 | Medium | On a 390-pixel viewport, later bottom-navigation items are only partially visible and require discovery by horizontal movement. | Limit primary mobile tabs to 4–5 and place remaining modules under More. |
| BB-10 | Low | Dashboard gives large visual priority to AI panels even when there are few actionable results. | Prioritize overdue jobs, production state, approvals, and stock risks; collapse inactive AI panels. |
| BB-11 | Medium | Staff creation asks an administrator to type the staff member’s password. | Use expiring email invitations and user-created passwords. |
| BB-12 | Low | Direct non-hash paths such as `/dashboard` return the marketing homepage with HTTP 200, while the deployed app actually uses `/#/dashboard`. | Configure canonical redirects or deploy history-mode fallback correctly to avoid misleading deep links. |

No uncaught page exceptions or failed requests were captured during the primary authenticated route pass. Console warnings were limited to chart sizing on Dashboard and Insight.

## 14. Acceptance Criteria for a Comparable System

A usable first release should demonstrate the following scenario:

1. Owner creates a customer.
2. Owner creates and sends a quotation in MYR.
3. Accepted quotation becomes a print job.
4. Job contains variants, quantities, due date, proof, materials, and workflow stages.
5. Customer approves the proof through a secure public link.
6. Staff processes stages from mobile and/or QR access.
7. Material consumption creates auditable stock movements.
8. Dashboard reflects job, due-date, stock, and task changes.
9. Completion generates an invoice and payment balance.
10. Owner can view profit summary and export relevant business data.
11. Permissions prevent unauthorized staff actions and cross-company access.
12. Every sensitive change is traceable through an audit event.

## 15. Evidence Index

Evidence captured during this assessment is stored locally under:

- `evidence/nzprintflow/` — public-route captures and structured observations
- `evidence/nzprintflow/authenticated/` — authenticated desktop captures
- `evidence/nzprintflow/interactions/` — non-submitted form/dialog captures
- `evidence/nzprintflow/mobile/` — clean mobile captures

The evidence may contain trial-account business information visible on screen. Review and redact it before sharing outside the project team.

## 16. Recommended Next Deliverables

This blueprint is sufficient to begin scope approval. Before development, produce:

1. Original product name, branding, and design system.
2. Prioritized user stories and acceptance tests.
3. Wireframes for desktop, tablet, and mobile.
4. Entity-relationship diagram and data dictionary.
5. API contract.
6. Permission matrix.
7. Subscription entitlement matrix.
8. Accounting and LHDN compliance review.
9. Delivery estimate based on the selected MVP phase.
