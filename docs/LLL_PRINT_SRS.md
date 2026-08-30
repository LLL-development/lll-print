# Software Requirements Specification

## LLL Print — Print Operations Management System

| Document field | Value |
|---|---|
| Document type | Software Requirements Specification (SRS) |
| Version | 1.0 Draft |
| Date | 27 August 2026 |
| Product | LLL Print |
| Intended market | Malaysian apparel printing businesses |
| Status | Ready for stakeholder review |

## Document Control

### Revision History

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 Draft | 27 August 2026 | Project team | Initial formal requirements derived from the approved product blueprint |

### Approval

| Role | Name | Decision | Date |
|---|---|---|---|
| Project supervisor |  | Pending |  |
| Product owner |  | Pending |  |
| Technical lead |  | Pending |  |

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification defines the functional and non-functional requirements for LLL Print, a multi-company print-shop operations system. It provides a formal agreement between stakeholders, designers, developers, testers, and supervisors concerning what the system shall do and how its quality will be evaluated.

### 1.2 Scope

LLL Print shall support the operational lifecycle of apparel-printing orders, including customer enquiries, quotations, artwork proofs, print jobs, production stages, stock consumption, invoices, payments, reporting, staff access, and customer communication.

The initial target processes include:

- Sublimation printing
- Silkscreen printing
- Direct-to-film (DTF) and heat press
- Embroidery
- Custom production workflows

LLL Print will be implemented with original source code, branding, content, and design assets. The product blueprint was informed by black-box study of an external reference platform; no third-party private code or backend implementation forms part of this specification.

### 1.3 Intended Audience

- Project supervisor
- Product owner
- Business analyst
- UI/UX designer
- Software developers
- Quality-assurance testers
- Security and compliance reviewers
- Print-shop owners and operational staff

### 1.4 Document Conventions

- **Shall** indicates a mandatory requirement.
- **Should** indicates a recommendation that may be deferred with approval.
- **May** indicates an optional capability.
- Requirements are assigned stable identifiers such as `FR-JOB-001`.
- Priority values are `Must`, `Should`, and `Could`.
- Release values identify the recommended delivery phase: `MVP`, `Phase 2`, `Phase 3`, or `Phase 4`.

### 1.5 References

- `LLL_PRINT_SYSTEM_BLUEPRINT.md`
- `REFERENCE_TECHNICAL_OBSERVATIONS.md`
- Malaysia Personal Data Protection Act 2010 (PDPA)
- Current LHDN/MyInvois documentation, subject to a separate compliance review before implementation
- OWASP Application Security Verification Standard, current version at implementation time
- WCAG 2.2, Level AA

## 2. Overall Description

### 2.1 Product Perspective

LLL Print is a responsive, multi-tenant web application and progressive web application. Each subscribing business operates in an isolated company workspace. Owners configure the business, invite staff, manage production, and access reports. Customers use restricted public links for quotation requests, order tracking, proof approval, and invoice-balance viewing.

The system consists of the following logical domains:

1. Identity and company tenancy
2. Customer and supplier relationship management
3. Sales documents
4. Print-job and production management
5. Inventory, BOM, batches, and stock ledger
6. Tasks, reminders, and notifications
7. Operational finance and reporting
8. Analytics and defect/waste tracking
9. Subscription and entitlement management
10. Platform administration
11. Optional AI and integration services

### 2.2 Product Goals

| Goal ID | Goal |
|---|---|
| GOAL-01 | Provide one reliable source of truth for print orders from enquiry to delivery. |
| GOAL-02 | Reduce production delays through clear scheduling, stage tracking, and reminders. |
| GOAL-03 | Reduce material waste through BOM-based consumption and auditable stock movements. |
| GOAL-04 | Improve profitability through consistent pricing, job costing, invoicing, and expense visibility. |
| GOAL-05 | Improve customer communication through tracking, proof approval, and status notifications. |
| GOAL-06 | Support safe growth through company isolation, staff permissions, subscriptions, and audit records. |

### 2.3 User Classes

| Actor | Description | Main privileges |
|---|---|---|
| Public visitor | Unauthenticated prospective user | View marketing, pricing, privacy, and login pages |
| Customer | Recipient of a restricted public link | Submit quote request, track own order, review proof, view own balance |
| Staff member | Employee of a subscribed print business | Access permitted operational modules and actions |
| Owner | Primary administrator of a company workspace | Full company operations, configuration, staff, subscription, and data controls |
| Platform administrator | Operator of the LLL Print service | Manage companies, plans, billing support, platform notifications, and audits |
| External service | Approved integration endpoint | Deliver email, WhatsApp, push, OCR, AI, payment, or e-invoice services |

### 2.4 Operating Environment

- Current versions of Chrome, Edge, Firefox, and Safari
- Desktop viewport from 1024 CSS pixels wide
- Mobile viewport from 320 CSS pixels wide
- Android and iOS browsers supporting PWA standards where practical
- Server environment capable of transactional database operations and object storage
- Default timezone: `Asia/Kuala_Lumpur`
- Default currency: `MYR`
- Default locales: English (Malaysia) and Malaysian Malay

### 2.5 Assumptions and Dependencies

- Each company is responsible for the accuracy of its business, tax, pricing, and bank information.
- WhatsApp delivery depends on an approved WhatsApp Business provider and template rules.
- Email, push, OCR, AI, and payment functions depend on external providers.
- LHDN/MyInvois integration shall not be described as compliant until verified against current official specifications.
- Full accounting reports require professional accounting validation.
- Camera and push features require user permission and compatible devices.

### 2.6 Constraints

- Company data must be isolated at both application and database access layers.
- Financial and stock audit records must not be silently overwritten.
- AI output must remain advisory until explicitly accepted and validated.
- Personally identifiable information must be handled according to applicable Malaysian law.
- A customer-facing public link must not reveal unrelated customer or company-private data.

### 2.7 Out of Scope for the MVP

- Native Android or iOS applications
- Payroll and human-resource management
- General-purpose marketplace or e-commerce storefront
- Automatic bank reconciliation
- Complete certified accounting package
- Automatic legal or tax-compliance guarantees
- Fully autonomous AI changes to jobs, stock, finance, or customer communications

## 3. System Context

```text
Public visitor/customer
        │ quote request, tracking, proof decision
        ▼
┌─────────────────────────────────────────┐
│               LLL Print               │
│ CRM ─ Sales ─ Production ─ Stock        │
│ Tasks ─ Finance ─ Insights ─ Settings   │
└─────────────────────────────────────────┘
   ▲          ▲           ▲          ▲
   │          │           │          │
 Owner/     Staff      File store   External services
 admin                             (WhatsApp/email/AI)
```

## 4. Functional Requirements

### 4.1 Authentication and Session Management

| ID | Requirement | Priority | Release |
|---|---|---|---|
| FR-AUTH-001 | The system shall allow an active user to sign in using an approved identifier and password. | Must | MVP |
| FR-AUTH-002 | The system shall create a secure server-controlled session after successful authentication. | Must | MVP |
| FR-AUTH-003 | The system shall display a generic error for invalid credentials without revealing whether an account exists. | Must | MVP |
| FR-AUTH-004 | The system shall rate-limit repeated authentication attempts. | Must | MVP |
| FR-AUTH-005 | The system shall allow a user to request a time-limited password-reset link. | Must | MVP |
| FR-AUTH-006 | The system shall allow an authenticated user to log out and invalidate the active session. | Must | MVP |
| FR-AUTH-007 | The system shall require reauthentication for high-risk actions defined by security policy. | Should | Phase 2 |
| FR-AUTH-008 | The system shall support multi-factor authentication for owners and platform administrators. | Should | Phase 2 |
| FR-AUTH-009 | The system shall record authentication security events without storing passwords or raw session tokens. | Must | MVP |

### 4.2 Company Tenancy and Business Configuration

| ID | Requirement | Priority | Release |
|---|---|---|---|
| FR-COMP-001 | The system shall associate each operational record with exactly one company workspace. | Must | MVP |
| FR-COMP-002 | An owner shall be able to configure company name, registration number, contact details, address, logo, and default locale. | Must | MVP |
| FR-COMP-003 | An owner shall be able to configure MYR currency, tax rate, invoice notes, bank details, and document numbering. | Must | MVP |
| FR-COMP-004 | An owner shall be able to configure print methods, workflow templates, equipment, item categories, and production defaults. | Must | Phase 2 |
| FR-COMP-005 | The system shall prevent a user from reading or changing records belonging to an unauthorized company. | Must | MVP |
| FR-COMP-006 | The system shall record changes to sensitive company and billing settings. | Must | MVP |

### 4.3 Roles, Staff, and Permissions

| ID | Requirement | Priority | Release |
|---|---|---|---|
| FR-RBAC-001 | An owner shall be able to invite a staff member by name and email. | Must | MVP |
| FR-RBAC-002 | An invited staff member shall set their own password through an expiring invitation. | Must | MVP |
| FR-RBAC-003 | The system shall support `View`, `Add`, `Edit`, and `Delete` permissions per operational module. | Must | MVP |
| FR-RBAC-004 | The server shall enforce permissions for every protected operation. | Must | MVP |
| FR-RBAC-005 | An owner shall be able to suspend or revoke staff access. | Must | MVP |
| FR-RBAC-006 | The system shall display current staff-seat usage and the applicable subscription limit. | Should | Phase 2 |
| FR-RBAC-007 | The system shall prevent removal of the final active owner without an ownership-transfer process. | Must | MVP |

### 4.4 Contacts: Customers and Suppliers

| ID | Requirement | Priority | Release |
|---|---|---|---|
| FR-CRM-001 | An authorized user shall be able to create, view, edit, archive, search, and filter customer records. | Must | MVP |
| FR-CRM-002 | An authorized user shall be able to create, view, edit, archive, search, and filter supplier records. | Must | MVP |
| FR-CRM-003 | A contact shall support name, type, phone, email, address, notes, and registration/tax identifiers where applicable. | Must | MVP |
| FR-CRM-004 | The system shall normalize phone numbers while preserving the selected international prefix. | Should | MVP |
| FR-CRM-005 | The system shall record WhatsApp or marketing consent, source, timestamp, and withdrawal state. | Must | Phase 2 |
| FR-CRM-006 | A user shall be able to view the jobs, quotes, invoices, payments, proofs, and communications linked to a customer. | Must | Phase 2 |
| FR-CRM-007 | The system shall warn before creation of a probable duplicate contact. | Should | Phase 2 |

### 4.5 Quotation Requests and Quotations

| ID | Requirement | Priority | Release |
|---|---|---|---|
| FR-QUO-001 | A public customer shall be able to submit a quotation request with contact and job information. | Should | Phase 2 |
| FR-QUO-002 | An authorized user shall be able to create a draft quotation for an existing or new customer. | Must | MVP |
| FR-QUO-003 | A quotation shall support service type, description, due date, quantities, unit prices, setup fees, add-ons, discount, tax, deposit, and notes. | Must | MVP |
| FR-QUO-004 | The system shall calculate subtotal, discount, tax, deposit, and grand total using decimal-safe monetary arithmetic. | Must | MVP |
| FR-QUO-005 | The system shall assign a company-specific unique quotation number when a quotation is issued. | Must | MVP |
| FR-QUO-006 | The system shall support Draft, Sent, Viewed, Accepted, Rejected, Expired, and Converted quotation states. | Must | Phase 2 |
| FR-QUO-007 | The system shall generate a branded quotation preview and PDF in MYR. | Must | MVP |
| FR-QUO-008 | An accepted quotation shall be convertible into a print job without re-entering shared data. | Must | Phase 2 |
| FR-QUO-009 | The system shall preserve the issued quotation version used for customer acceptance. | Must | Phase 2 |

### 4.6 Print Jobs

| ID | Requirement | Priority | Release |
|---|---|---|---|
| FR-JOB-001 | An authorized user shall be able to create a print job for an existing customer. | Must | MVP |
| FR-JOB-002 | A print job shall include a unique job number, title/reference, customer, due date, method, material, quantity, status, and notes. | Must | MVP |
| FR-JOB-003 | Supported methods shall include Sublimation, Silkscreen, DTF, Embroidery, Heat Press, and Custom. | Must | MVP |
| FR-JOB-004 | A job shall support multiple item variants, including size, colour, garment type, quantity, and optional name/number customisation. | Must | MVP |
| FR-JOB-005 | A job shall support print dimensions, coverage percentage, equipment assignments, and production assets where applicable. | Should | Phase 2 |
| FR-JOB-006 | An authorized user shall be able to search jobs by job number, title, or customer. | Must | MVP |
| FR-JOB-007 | An authorized user shall be able to filter jobs by status, method, customer, date, and overdue condition. | Must | MVP |
| FR-JOB-008 | The system shall provide list and calendar views of jobs. | Should | Phase 2 |
| FR-JOB-009 | The system shall support Draft, Pending, Awaiting Proof, Approved, Scheduled, In Production, Quality Check, Ready, Delivered, Completed, and Cancelled states. | Must | MVP |
| FR-JOB-010 | A status transition shall record actor, timestamp, previous status, new status, and optional note. | Must | MVP |
| FR-JOB-011 | The system shall warn before a user cancels a job or reverses a completed production action. | Must | MVP |
| FR-JOB-012 | The system shall generate a printable jobsheet containing approved production information. | Should | Phase 2 |
| FR-JOB-013 | A user shall be able to attach mockups, artwork, and production files to a job. | Must | MVP |
| FR-JOB-014 | The system shall show overdue, due-today, due-this-week, and on-track counts. | Should | MVP |

### 4.7 Production Workflows and Equipment

| ID | Requirement | Priority | Release |
|---|---|---|---|
| FR-PROD-001 | An owner shall be able to define reusable production workflow templates by print method. | Must | Phase 2 |
| FR-PROD-002 | A workflow template shall contain an ordered set of production stages. | Must | Phase 2 |
| FR-PROD-003 | The system shall copy the selected workflow into a job so later template changes do not silently alter active jobs. | Must | Phase 2 |
| FR-PROD-004 | Authorized staff shall be able to start, pause, complete, and comment on an assigned stage. | Must | Phase 2 |
| FR-PROD-005 | A stage event shall record accepted quantity, rejected quantity, actor, equipment, start time, and completion time. | Must | Phase 2 |
| FR-PROD-006 | An owner shall be able to configure equipment names, types, availability, and active status. | Should | Phase 2 |
| FR-PROD-007 | The system shall prevent stage-completed quantity from exceeding the allowed job quantity unless an authorized overrun is recorded. | Must | Phase 2 |
| FR-PROD-008 | The system shall provide a production agenda ordered by due date and operational priority. | Should | Phase 2 |
| FR-PROD-009 | A worker shall be able to open an authorized job or stage by scanning a QR code. | Should | Phase 2 |

### 4.8 Artwork Proofing and Customer Tracking

| ID | Requirement | Priority | Release |
|---|---|---|---|
| FR-PROOF-001 | An authorized user shall be able to upload one or more proof variants to a job. | Must | Phase 2 |
| FR-PROOF-002 | The system shall assign an immutable version number to each issued proof. | Must | Phase 2 |
| FR-PROOF-003 | The system shall create a high-entropy, revocable customer link for tracking and proof review. | Must | Phase 2 |
| FR-PROOF-004 | A customer using the valid link shall see only approved customer-facing job information. | Must | Phase 2 |
| FR-PROOF-005 | A customer shall be able to approve or reject the current proof and provide feedback. | Must | Phase 2 |
| FR-PROOF-006 | The system shall record proof version, decision, signer, timestamp, and lawful request metadata. | Must | Phase 2 |
| FR-PROOF-007 | An approved proof shall not be silently replaced or modified. | Must | Phase 2 |
| FR-PROOF-008 | The public tracking page should show production progress and invoice balance without exposing internal cost, notes, or staff data. | Should | Phase 2 |

### 4.9 Inventory Items and Bill of Materials

| ID | Requirement | Priority | Release |
|---|---|---|---|
| FR-INV-001 | An authorized user shall be able to create, view, edit, archive, search, and categorise inventory items. | Must | MVP |
| FR-INV-002 | An item shall support SKU, name, category, image, specifications, unit, quantity, reorder level, purchase cost, and supplier. | Must | MVP |
| FR-INV-003 | The system shall identify items at or below their reorder level. | Must | MVP |
| FR-INV-004 | An authorized user shall be able to define a BOM/recipe that maps a product or service variant to material quantities. | Must | Phase 2 |
| FR-INV-005 | The system shall preview calculated BOM consumption before posting stock movements. | Must | Phase 2 |
| FR-INV-006 | The system shall support QR labels for inventory items and storage bins. | Should | Phase 2 |
| FR-INV-007 | Item quantity shall not be changed without a corresponding stock movement. | Must | MVP |

### 4.10 Stock Batches and Movement Ledger

| ID | Requirement | Priority | Release |
|---|---|---|---|
| FR-STK-001 | The system shall record receipts, consumption, returns, transfers, adjustments, and reversals as stock movements. | Must | MVP |
| FR-STK-002 | A movement shall record item, quantity, unit, direction, reason, reference, actor, timestamp, and resulting balance. | Must | MVP |
| FR-STK-003 | A posted movement shall not be editable or deletable; corrections shall use a linked reversal. | Must | MVP |
| FR-STK-004 | The system shall reject an operation that would create disallowed negative stock. | Must | MVP |
| FR-STK-005 | The system shall support supplier batch/lot number, received date, unit cost, and expiry where applicable. | Should | Phase 2 |
| FR-STK-006 | The system shall support FIFO batch allocation and may support LIFO if enabled by company policy. | Should | Phase 3 |
| FR-STK-007 | An authorized user shall be able to search and filter the movement ledger. | Must | MVP |
| FR-STK-008 | An authorized user shall be able to export stock movements in a common tabular format. | Should | Phase 2 |
| FR-STK-009 | A tamper-evident hash chain may be added, but shall not replace access controls, database integrity, or backups. | Could | Phase 3 |

### 4.11 Invoices and Payments

| ID | Requirement | Priority | Release |
|---|---|---|---|
| FR-INVCE-001 | An authorized user shall be able to create an invoice from a quote, job, or new transaction. | Must | MVP |
| FR-INVCE-002 | An invoice shall support line items, fees, discounts, tax, deposit, payments, and remaining balance. | Must | MVP |
| FR-INVCE-003 | The system shall assign a unique company-specific invoice number when issued. | Must | MVP |
| FR-INVCE-004 | The system shall support Draft, Issued, Partially Paid, Paid, Overdue, and Void states. | Must | MVP |
| FR-INVCE-005 | The system shall preserve customer, line, price, and tax values as they appeared when the invoice was issued. | Must | MVP |
| FR-INVCE-006 | An authorized user shall be able to record a payment with date, amount, method, reference, and note. | Must | MVP |
| FR-INVCE-007 | The system shall calculate remaining balance from invoice total and valid payments. | Must | MVP |
| FR-INVCE-008 | The system shall generate a branded invoice preview and PDF in MYR. | Must | MVP |
| FR-INVCE-009 | A void operation shall preserve the invoice and audit history. | Must | MVP |

### 4.12 Tasks, Reminders, and Notifications

| ID | Requirement | Priority | Release |
|---|---|---|---|
| FR-TASK-001 | An authorized user shall be able to assign a task with description, assignee, priority, due date, and optional job reference. | Must | Phase 2 |
| FR-TASK-002 | A task shall support Open, In Progress, Blocked, Completed, and Cancelled states. | Must | Phase 2 |
| FR-REM-001 | The system shall generate reminders for overdue jobs, approaching due dates, low stock, and pending proofs. | Must | Phase 2 |
| FR-REM-002 | A user shall be able to search, filter, assign, dismiss, or resolve reminders where authorized. | Should | Phase 2 |
| FR-NOT-001 | The system shall provide an in-application notification centre and unread state. | Must | Phase 2 |
| FR-NOT-002 | A user shall be able to configure permitted notification channels and categories. | Should | Phase 2 |
| FR-NOT-003 | The system shall record notification delivery attempts and provider responses. | Must | Phase 2 |
| FR-NOT-004 | The system shall request browser-push permission only after a user-initiated action. | Must | Phase 2 |

### 4.13 Dashboard and Operational Reporting

| ID | Requirement | Priority | Release |
|---|---|---|---|
| FR-DASH-001 | The dashboard shall show active, overdue, due-soon, completed, low-stock, and pending-proof information. | Must | MVP |
| FR-DASH-002 | Dashboard metrics shall be limited to the active company and permitted data scope. | Must | MVP |
| FR-DASH-003 | The user shall be able to select Day, Week, Month, Year, or a custom date range. | Should | Phase 2 |
| FR-DASH-004 | The dashboard shall provide direct links from actionable metrics to filtered operational records. | Must | MVP |
| FR-DASH-005 | Each calculated dashboard area should display its applicable period and last-updated time. | Should | Phase 2 |

### 4.14 Finance and Expenses

| ID | Requirement | Priority | Release |
|---|---|---|---|
| FR-FIN-001 | An authorized user shall be able to record income and expenses with category, date, amount, tax, supplier/customer, reference, and attachment. | Must | MVP |
| FR-FIN-002 | The system shall calculate operational revenue, cost of goods sold, gross profit, expenses, net profit, receivables, and cash received. | Must | Phase 2 |
| FR-FIN-003 | Financial reports shall use decimal-safe arithmetic and company currency. | Must | MVP |
| FR-FIN-004 | The system shall allow authorized export of operational finance data. | Should | Phase 2 |
| FR-FIN-005 | Full general-ledger reports shall only be released after double-entry rules and outputs are professionally validated. | Must | Phase 3 |
| FR-FIN-006 | If implemented, opening balances, journals, trial balance, balance sheet, cash flow, equity, and depreciation shall be derived from balanced ledger entries. | Must | Phase 3 |

### 4.15 Analytics, Defects, and Waste

| ID | Requirement | Priority | Release |
|---|---|---|---|
| FR-ANA-001 | The system shall derive production analytics from timestamped operational events. | Must | Phase 3 |
| FR-ANA-002 | The system shall report average lead time and average time per production stage. | Should | Phase 3 |
| FR-ANA-003 | The system shall identify overdue impact and potential production bottlenecks. | Should | Phase 3 |
| FR-DEF-001 | An authorized user shall be able to record a defect with job, stage, category, quantity, cost estimate, note, and image. | Must | Phase 3 |
| FR-DEF-002 | The system shall report defect rate, rework quantity, material waste, and first-pass quality. | Should | Phase 3 |
| FR-ANA-004 | Charts shall provide textual summaries or accessible data alternatives. | Must | Phase 3 |

### 4.16 AI and Automation

| ID | Requirement | Priority | Release |
|---|---|---|---|
| FR-AI-001 | The system may provide advisory job sequencing based on due date, stage, material availability, and configured capacity. | Could | Phase 4 |
| FR-AI-002 | The system may extract structured draft data from receipts, labels, spreadsheets, images, or customer order text. | Could | Phase 4 |
| FR-AI-003 | The system may provide cost, margin, reorder, defect, feedback, and translation suggestions. | Could | Phase 4 |
| FR-AI-004 | Every AI-generated structured output shall be schema-validated before display or use. | Must | Phase 4 |
| FR-AI-005 | AI output shall not post stock, financial, customer, or production changes without explicit authorized confirmation. | Must | Phase 4 |
| FR-AI-006 | The system shall record AI provider, model, prompt/template version, output, usage, user decision, and timestamp. | Must | Phase 4 |
| FR-AI-007 | The system shall clearly label AI output as a suggestion and permit manual correction. | Must | Phase 4 |
| FR-AI-008 | Sensitive data sent to an AI provider shall follow approved privacy, retention, and contractual controls. | Must | Phase 4 |

### 4.17 Subscription and Entitlements

| ID | Requirement | Priority | Release |
|---|---|---|---|
| FR-SUB-001 | The system shall associate each company with a plan and subscription state. | Must | Phase 3 |
| FR-SUB-002 | The server shall enforce plan entitlements and usage limits transactionally. | Must | Phase 3 |
| FR-SUB-003 | The system shall support trial, active, past-due, suspended, cancelled, and expired subscription states. | Must | Phase 3 |
| FR-SUB-004 | An owner shall be able to view plan, usage, renewal/expiry date, and available upgrades. | Must | Phase 3 |
| FR-SUB-005 | Near-limit and expiry notices shall be clear but shall not unnecessarily obstruct daily work. | Should | Phase 3 |
| FR-SUB-006 | Subscription events and manual platform adjustments shall be audited. | Must | Phase 3 |

### 4.18 Data Privacy

| ID | Requirement | Priority | Release |
|---|---|---|---|
| FR-PRIV-001 | The system shall provide an accessible privacy notice describing collected data and purposes. | Must | MVP |
| FR-PRIV-002 | An authenticated owner shall be able to request an export of company and personal data, subject to authorization and legal constraints. | Must | Phase 2 |
| FR-PRIV-003 | A user shall be able to request account deletion or consent withdrawal through a verified workflow. | Must | Phase 2 |
| FR-PRIV-004 | The system shall retain proof of consent and withdrawal where required. | Must | Phase 2 |
| FR-PRIV-005 | Deletion shall respect approved retention, audit, dispute, and legal-hold requirements. | Must | Phase 2 |
| FR-PRIV-006 | Privacy requests shall be logged and visible only to authorized personnel. | Must | Phase 2 |

### 4.19 Platform Administration

| ID | Requirement | Priority | Release |
|---|---|---|---|
| FR-ADM-001 | Platform administrators shall use a separate privileged authorization boundary. | Must | Phase 4 |
| FR-ADM-002 | A platform administrator shall be able to view and manage company lifecycle and subscription support state. | Must | Phase 4 |
| FR-ADM-003 | A platform administrator shall be able to manage plans, entitlements, vouchers, platform notices, and approved integration configuration. | Should | Phase 4 |
| FR-ADM-004 | Privileged support access to company data shall require a recorded reason and comprehensive audit event. | Must | Phase 4 |
| FR-ADM-005 | Platform administrators shall not be able to retrieve user passwords or raw session secrets. | Must | Phase 4 |

## 5. External Interface Requirements

### 5.1 User Interface

| ID | Requirement |
|---|---|
| UI-001 | The desktop application shall provide persistent primary navigation and a clear active-module indicator. |
| UI-002 | The mobile application shall provide no more than five primary navigation destinations plus a clearly labelled More destination. |
| UI-003 | Every screen shall provide a unique, descriptive heading. |
| UI-004 | Destructive actions shall require confirmation and explain the affected record. |
| UI-005 | Forms shall identify required fields and show validation errors adjacent to the relevant control. |
| UI-006 | Empty states shall explain why no data is shown and provide an appropriate next action. |
| UI-007 | The system shall use consistent terminology, including `Contacts`, `Items & BOM`, and `Stock Ledger`. |
| UI-008 | Monetary values shall display `RM`/`MYR` consistently unless a document explicitly uses another stored ISO currency. |
| UI-009 | Dates shall use the company locale and an unambiguous Malaysian representation. |

### 5.2 Software Interfaces

- REST or equivalent transactional application API
- Relational database
- Object storage for artwork, proofs, logos, receipts, and generated documents
- Background job/queue system
- Optional WhatsApp Business API
- Email-delivery provider
- Browser push service
- Optional OCR and AI providers
- Optional payment provider
- Optional LHDN/MyInvois interface after formal compliance analysis

### 5.3 File Interfaces

| ID | Requirement |
|---|---|
| FILE-001 | The system shall accept only explicitly approved file types and sizes. |
| FILE-002 | The system shall verify file signature/type rather than trusting the extension alone. |
| FILE-003 | Private files shall require authorization or a short-lived signed URL. |
| FILE-004 | The system shall support generated PDF documents. |
| FILE-005 | The system should support validated CSV/XLSX import and export for approved modules. |
| FILE-006 | Import shall provide a preview, validation results, and explicit confirmation before committing records. |

### 5.4 Communication Interfaces

| ID | Requirement |
|---|---|
| COM-001 | Outbound communication shall use approved templates and the recipient’s recorded consent where required. |
| COM-002 | Each delivery attempt shall record channel, recipient reference, template, provider status, and timestamp. |
| COM-003 | Provider credentials and webhook secrets shall never be exposed to the browser. |
| COM-004 | Incoming webhooks shall be authenticated and idempotent. |

## 6. Data Requirements

### 6.1 Principal Entities

- Company, user, membership, role, permission, session, audit event
- Contact, address, consent, communication event
- Quote, quote line, invoice, invoice line, payment, document sequence
- Print job, job item, variant, workflow, stage, stage event, equipment assignment
- Proof, proof version, proof decision, attachment
- Inventory item, category, BOM, BOM line, location, batch, stock movement
- Task, reminder, notification, notification delivery
- Expense, account, journal entry, journal line where full accounting applies
- Plan, entitlement, subscription, usage counter
- AI run and approved AI result

### 6.2 Data Integrity

| ID | Requirement |
|---|---|
| DATA-001 | Each business record shall contain a company identifier and server-generated primary identifier. |
| DATA-002 | Mutable records shall include created/updated timestamps and actor identifiers where applicable. |
| DATA-003 | Concurrent updates shall be detected through versioning or equivalent transactional controls. |
| DATA-004 | Monetary values shall use fixed decimal or integer minor units and shall not use binary floating-point arithmetic. |
| DATA-005 | Server timestamps shall be stored in UTC and displayed using the company timezone. |
| DATA-006 | Document, proof, stock, payment, and audit history shall preserve required historical values. |
| DATA-007 | Referential integrity shall prevent orphaned operational records. |
| DATA-008 | Soft deletion shall not be used as a substitute for immutable financial and stock reversals. |

### 6.3 Retention and Backup

| ID | Requirement |
|---|---|
| DATA-RET-001 | The product owner shall approve a retention schedule for operational, personal, financial, and audit data before production launch. |
| DATA-RET-002 | The system shall perform encrypted, automated backups according to the approved recovery policy. |
| DATA-RET-003 | Backup restoration shall be tested at defined intervals. |
| DATA-RET-004 | Deletion from the active system and expiry from backups shall follow documented schedules. |

## 7. Non-Functional Requirements

### 7.1 Security

| ID | Requirement | Target |
|---|---|---|
| NFR-SEC-001 | All network traffic shall use TLS. | TLS 1.2 or later |
| NFR-SEC-002 | Passwords shall be stored with an approved adaptive password hashing algorithm. | Argon2id or approved equivalent |
| NFR-SEC-003 | Session cookies shall be Secure, HTTP-only, and appropriately SameSite. | Mandatory |
| NFR-SEC-004 | State-changing operations shall be protected against CSRF where cookie authentication applies. | Mandatory |
| NFR-SEC-005 | User-controlled output shall be encoded and rich content sanitized. | Mandatory |
| NFR-SEC-006 | Uploads shall be type/size validated and isolated from executable application content. | Mandatory |
| NFR-SEC-007 | Authorization shall be covered by automated cross-role and cross-company tests. | Mandatory |
| NFR-SEC-008 | Secrets shall be stored in an approved secret-management facility. | Mandatory |
| NFR-SEC-009 | Critical dependencies shall be scanned for known vulnerabilities during CI. | Mandatory |
| NFR-SEC-010 | A security review shall be completed before production launch. | Mandatory |

### 7.2 Performance

| ID | Requirement | Target |
|---|---|---|
| NFR-PERF-001 | Authenticated page navigation should become usable within 2.5 seconds under normal broadband conditions. | 95th percentile |
| NFR-PERF-002 | Standard read API requests should complete within 500 ms excluding third-party services. | 95th percentile |
| NFR-PERF-003 | Standard write API requests should complete within 1 second excluding background work. | 95th percentile |
| NFR-PERF-004 | Lists shall use server pagination or equivalent bounded loading beyond 100 records. | Mandatory |
| NFR-PERF-005 | Long-running PDF, export, OCR, AI, and messaging operations shall execute asynchronously. | Mandatory |

### 7.3 Availability and Recovery

| ID | Requirement | Target |
|---|---|---|
| NFR-AVL-001 | Production service availability should meet the approved service-level objective. | Initial target 99.5% monthly |
| NFR-AVL-002 | The system shall fail safely when an external integration is unavailable. | Mandatory |
| NFR-AVL-003 | Queued external operations shall use bounded retries and idempotency controls. | Mandatory |
| NFR-AVL-004 | Recovery point and recovery time objectives shall be approved before launch. | Proposed RPO 24 h; RTO 8 h for MVP |

### 7.4 Usability and Accessibility

| ID | Requirement | Target |
|---|---|---|
| NFR-UX-001 | The interface shall meet WCAG 2.2 Level AA for supported core workflows. | Mandatory |
| NFR-UX-002 | All actions shall be operable by keyboard. | Mandatory |
| NFR-UX-003 | All icon-only controls shall have an accessible name and visible tooltip. | Mandatory |
| NFR-UX-004 | Focus shall be visible, trapped within modal dialogs, and returned after closing. | Mandatory |
| NFR-UX-005 | Status information shall not rely on colour alone. | Mandatory |
| NFR-UX-006 | Primary touch targets shall be at least 44 × 44 CSS pixels where practical. | Mandatory |
| NFR-UX-007 | Core screens shall not produce document-level horizontal overflow at 320 CSS pixels. | Mandatory |

### 7.5 Maintainability and Testability

| ID | Requirement |
|---|---|
| NFR-MNT-001 | Source code shall be divided into documented business domains with explicit interfaces. |
| NFR-MNT-002 | Database schema changes shall use version-controlled migrations. |
| NFR-MNT-003 | Public and internal APIs shall use documented versioned contracts. |
| NFR-MNT-004 | Critical calculations and authorization rules shall have automated unit and integration tests. |
| NFR-MNT-005 | Core user journeys shall have browser-level regression tests. |
| NFR-MNT-006 | Production errors shall include correlation identifiers and structured logs without unnecessary personal data. |
| NFR-MNT-007 | Deployment shall support rollback to a known-good release. |

### 7.6 Localization

| ID | Requirement |
|---|---|
| NFR-L10N-001 | The system shall support English (Malaysia) and Malaysian Malay UI strings. |
| NFR-L10N-002 | User-facing text shall be externalized from source components. |
| NFR-L10N-003 | Dates, times, numbers, and currency shall use locale-aware formatters. |
| NFR-L10N-004 | The default currency shall be MYR and the default timezone Asia/Kuala_Lumpur. |

### 7.7 Privacy

| ID | Requirement |
|---|---|
| NFR-PRIV-001 | The system shall collect only data necessary for an approved purpose. |
| NFR-PRIV-002 | Personal data shall not appear in logs unless explicitly required and protected. |
| NFR-PRIV-003 | Access to exported personal/company data shall require authorization and expire. |
| NFR-PRIV-004 | External processors shall be documented and assessed before receiving production data. |

## 8. Key Use Cases

### UC-01: Create a Print Job

**Primary actor:** Authorized owner or staff member  
**Preconditions:** User is authenticated; company is active; customer exists; user has job-add permission.  
**Trigger:** User selects New Job.

**Main flow:**

1. System displays the job form.
2. User selects the customer and enters title, due date, method, and item variants.
3. User optionally selects workflow, materials, equipment, and attachments.
4. System validates required fields and calculated quantity.
5. User confirms creation.
6. System creates the job and initial status event in one transaction.
7. System displays the new job and audit reference.

**Alternative flows:**

- Customer is created without leaving the workflow.
- User saves a draft with incomplete optional information.
- Subscription limit or permission prevents creation and the system explains the reason.

**Postconditions:** Job and initial audit/status records exist; no stock is consumed until an approved production action.

### UC-02: Approve an Artwork Proof

**Primary actor:** Customer  
**Preconditions:** A proof version was issued; public token is valid and not revoked.  
**Trigger:** Customer opens the proof link.

**Main flow:**

1. System validates the token and displays customer-safe job/proof information.
2. Customer reviews the current proof version.
3. Customer enters required signer information.
4. Customer approves the proof.
5. System records the immutable decision and timestamp.
6. System updates the job’s proof state and notifies authorized staff.

**Alternative flow:** Customer rejects the proof and submits feedback; the job remains blocked from approved production where configured.

### UC-03: Complete Production and Consume Stock

**Primary actor:** Authorized production staff  
**Preconditions:** Job is approved and active; workflow stage is available; BOM exists where auto-consumption is enabled.  
**Trigger:** Staff completes a production stage.

**Main flow:**

1. System displays stage, quantity, material preview, and relevant equipment.
2. Staff records accepted and rejected quantities.
3. System validates totals and stock availability.
4. Staff confirms completion.
5. System writes the stage event and stock movements transactionally.
6. System advances the job when workflow rules allow.
7. Dashboard and reminders update.

**Exception:** If stock is insufficient, the transaction is rejected or routed to an explicitly authorized override.

### UC-04: Issue an Invoice and Record Payment

**Primary actor:** Authorized finance user  
**Preconditions:** Customer and billable lines exist.  
**Main flow:**

1. User creates invoice from a job, quotation, or new transaction.
2. System calculates totals in MYR.
3. User reviews and issues the invoice.
4. System assigns the next company invoice number and preserves the issue version.
5. User sends or downloads the invoice.
6. On payment, user records amount, date, method, and reference.
7. System updates balance and invoice status.

### UC-05: Receive Inventory

**Primary actor:** Authorized inventory user  
**Preconditions:** Inventory item exists.  
**Main flow:**

1. User selects Log Movement and Receipt.
2. User selects item and enters quantity, unit cost, supplier reference, and optional lot.
3. System validates values and previews resulting balance.
4. User confirms.
5. System posts an immutable receipt movement and updates availability.

## 9. Business Rules

| ID | Rule |
|---|---|
| BR-001 | A company shall never access another company’s operational records through normal or guessed identifiers. |
| BR-002 | Posted stock movements are corrected through reversals, not editing or deletion. |
| BR-003 | Issued invoices and accepted quotes preserve their issue-time values. |
| BR-004 | Approved proof versions are immutable and traceable. |
| BR-005 | Job stage quantities must reconcile with job quantity, defects, rework, and approved overrun. |
| BR-006 | Monetary calculations use company/document currency and approved rounding rules. |
| BR-007 | A customer public token grants access only to the specifically permitted resource and actions. |
| BR-008 | Plan limits are enforced on the server at the time of the protected transaction. |
| BR-009 | AI suggestions have no operational effect until validated and accepted by an authorized user. |
| BR-010 | Sensitive changes produce an audit event containing actor, time, action, subject, and permitted metadata. |

## 10. Verification and Acceptance

### 10.1 Requirement Verification Methods

| Method | Description |
|---|---|
| Test | Automated or manual execution with an objectively verifiable result |
| Inspection | Review of interface, record, configuration, source, or generated output |
| Analysis | Evaluation of calculations, logs, performance results, or security behavior |
| Demonstration | Stakeholder-observed end-to-end workflow |

### 10.2 MVP Acceptance Scenario

The MVP shall not be accepted until the following scenario passes in a controlled test company:

1. Owner signs in and invites a restricted staff member.
2. Owner creates a customer and inventory items.
3. Owner creates a MYR quotation with correct totals and PDF output.
4. Quote information is used to create a print job with variants and due date.
5. Authorized staff updates the job without accessing restricted finance settings.
6. A stock receipt and job consumption appear as immutable movements.
7. Job completion updates dashboard metrics.
8. An invoice is issued and partial/full payment updates its balance correctly.
9. Unauthorized and cross-company access tests fail safely.
10. Audit history identifies the actors and changes for the scenario.
11. Core workflows pass at desktop and 320-pixel mobile widths.
12. Backup restoration and deployment rollback procedures are demonstrated.

### 10.3 Exit Criteria by Quality Area

- No open critical or high-severity security defect
- No open data-loss or cross-company isolation defect
- All `Must/MVP` functional requirements tested or formally waived
- Core browser suite passes on supported browsers
- WCAG review completed for core workflows
- Performance targets measured with representative data volume
- Privacy notice, retention policy, and operational support ownership approved

## 11. Requirements Traceability Matrix

| Product goal | Primary requirements | Verification |
|---|---|---|
| GOAL-01 Order source of truth | FR-CRM, FR-QUO, FR-JOB, FR-PROOF, FR-INVCE | End-to-end quote-to-cash test |
| GOAL-02 Reduce delays | FR-PROD, FR-TASK, FR-REM, FR-DASH | Production agenda and overdue-reminder tests |
| GOAL-03 Reduce waste | FR-INV, FR-STK, FR-DEF | BOM consumption, reversal, and defect tests |
| GOAL-04 Improve profitability | FR-QUO, FR-INVCE, FR-FIN | Pricing, invoice, payment, and profit calculation tests |
| GOAL-05 Customer communication | FR-PROOF, FR-NOT, COM requirements | Public-token, proof, and delivery-status tests |
| GOAL-06 Safe growth | FR-COMP, FR-RBAC, FR-SUB, NFR-SEC | Tenant isolation, permission, limit, and audit tests |

Detailed test cases should reference individual requirement IDs in the test-management system.

## 12. Delivery Baseline

### MVP

- Authentication, company tenancy, and permissions
- Customers and suppliers
- Print jobs, variants, statuses, and attachments
- Inventory items and stock movements
- Quotations, invoices, payments, and PDF generation
- Basic dashboard and operational finance
- Audit logging, responsive UI, security, and backups

### Phase 2

- Workflow stages and equipment
- BOM and automatic material deduction
- Customer tracking and proof approval
- Tasks, reminders, notifications, QR scanning, and imports/exports
- Data export and consent-withdrawal workflows

### Phase 3

- Production analytics, defects, waste, forecasting
- Subscription enforcement and billing operations
- Batches and advanced stock allocation
- Professionally validated accounting capabilities

### Phase 4

- AI and OCR assistance
- Platform-administrator console
- Advanced integrations
- Validated LHDN/MyInvois integration if approved

## 13. Open Decisions

The following items require stakeholder decisions before their related implementation begins:

| ID | Decision | Owner | Needed by |
|---|---|---|---|
| OD-001 | Final product logo, colours, and brand guidelines | Product owner | UI design |
| OD-002 | MVP backend/database platform | Technical lead | Architecture approval |
| OD-003 | Exact job-status and workflow transition rules | Product owner | Production module |
| OD-004 | Inventory negative-stock policy | Product owner | Inventory module |
| OD-005 | Quote/invoice numbering and rounding rules | Product owner/accountant | Sales module |
| OD-006 | Tax, SST, and LHDN/MyInvois scope | Accountant/compliance reviewer | Finance planning |
| OD-007 | WhatsApp provider and approved message templates | Product owner | Phase 2 integrations |
| OD-008 | Data-retention and backup objectives | Product owner/security lead | Production launch |
| OD-009 | Subscription tiers, prices, and exact entitlements | Product owner | Phase 3 |
| OD-010 | AI providers, data policy, and usage budget | Product owner/security lead | Phase 4 |

## Appendix A — Glossary

| Term | Definition |
|---|---|
| BOM | Bill of Materials; materials and quantities required to produce an item or variant |
| DTF | Direct-to-film printing |
| ERP | Enterprise resource planning |
| FIFO | First in, first out stock allocation |
| Job stage | A defined production step such as Print, Heat, Cut, Sew, or QC |
| LHDN | Inland Revenue Board of Malaysia |
| MYR | ISO currency code for Malaysian Ringgit |
| PWA | Progressive web application |
| Proof | Customer-facing artwork version submitted for approval |
| RBAC | Role-based access control |
| SST | Malaysian Sales and Service Tax |
| Tenant | A company workspace with isolated users and business records |

## Appendix B — Requirement Status Legend

- **Proposed:** Included in this draft and awaiting stakeholder approval.
- **Approved:** Accepted as part of the product baseline.
- **Implemented:** Delivered in a development environment.
- **Verified:** Tested successfully against its acceptance criteria.
- **Deferred:** Removed from the current release with an approved reason.

All requirements in version 1.0 Draft are **Proposed** until the Approval section is completed.
