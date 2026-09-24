# Software Project Management Plan (SPMP)

Project: LLL Print
Status: Draft
Last updated: 2026-09-21

## 1. Introduction

### 1.1 Project Overview

LLL Print is an original, independent web product for Malaysian print-shop
operations. Its purpose is to reduce repeated manual entry by capturing an
order once and carrying its details through quotation, invoicing, production
and fulfilment. Customers and Admin use a priced order form; operational staff
use the resulting records to coordinate the work.

Design discussion and customer agreement take place outside the application.
Once the design is agreed, the customer or Admin enters the clothing choices,
quantities and customer details, and attaches the mockup. The system generates
a quotation from that information. Admin sets an order-specific deposit from
RM0 up to the invoice total, then clicks Confirm order once to confirm the
quotation, create the job and issue the invoice. Once the deposit and mockup
conditions are met, Admin may release the job for production. The remaining balance is
confirmed before shipping or customer collection.

The intended journey is:

Design agreed externally → priced form and mockup → generated quotation →
Admin-issued invoice and deposit requirement → requirement met → Admin release to factory → factory
production and completion → confirmed remaining payment → shipping or
self-collection.

For avoidance of doubt, the approved sequence is: design agreed externally;
priced form and mockup; submitted quotation; Admin sets the deposit; one
Confirm order action creates the Job and initial Invoice; the Job awaits
release until the deposit and mockup conditions are met; Admin releases it;
configured production steps run; production completion plus full settlement
normally enables Shipped or Collected, while Admin may approve a reasoned
handover with a visible unpaid balance. This statement supersedes the older abbreviated
journey line immediately above.

The linked production job remains the record of what must be made. Submission
does not itself confirm the quotation, create a job, issue an invoice or start
production.
Reusing information must preserve historical agreements and issued documents.
The intended benefit is fewer repeated entries and clearer handoffs; no
measured time saving or error reduction is claimed.

Read the three documents in this order:

| Document | Question it answers |
|---|---|
| SPMP | Why are we building the product, what is its scope, and how is the work planned? |
| SRS | Who uses the system, how does an order move through it, and what must happen? |
| SDD | How will the UI/UX, architecture, database and interfaces meet those requirements? |

This introduction records the direction agreed on 2026-09-21. Sections 2–3
and the SRS/SDD remain subject to coordinated review; their older scope and
implementation-status statements must not be read as an updated baseline.

### 1.2 Problem Statement

**Ideal situation:** After agreeing the design, the customer or Admin records
the order details once. The customer sees the price, and the shop reuses the
same information to prepare documents, collect payment, produce and ship.

**Current gaps:** The described shop process starts with design discussion
outside the application, followed by confirmation of clothing type and
quantity. Staff must bring those details into the operational workflow.
Repeatedly copying customer details, selections and the mockup between steps
adds manual work and makes it harder to keep the order consistent.

**Consequences:** Re-entry creates opportunities for mismatched quantities,
clothing selections, prices or design references. Staff also need a clear
distinction between work awaiting a deposit, work in production and completed
work awaiting the remaining payment before shipping. The frequency and cost
of these problems have not been measured.

### 1.3 Problem Solution

The agreed approach is one connected order workflow:

- Allow the customer to complete a priced form, or Admin to enter the order
  on the customer's behalf, using the same order information and pricing rules.
- Include the mockup as a reference to the design already agreed outside the
  app. Do not add a separate in-app design-approval workflow.
- Generate the quotation from the submitted details and reuse those details
  in the linked invoice and production job, avoiding repeated entry.
- Show production progress and payment information clearly. Admin sets each
  order's deposit from RM0 up to the invoice total. A zero deposit needs no
  receipt; a positive deposit must be confirmed. Meeting the requirement makes
  the job eligible for Admin release, but never starts production automatically.
  Full settlement normally precedes shipping or customer collection; Admin may
  approve the controlled unpaid-handover exception with a required reason.
- Retain document and activity history. An enquiry-source note may provide a
  manual reference, but does not capture or guarantee access to a conversation.

Form fields, price calculation and the exact handoffs will be specified in
the SRS, then translated into UI, architecture and data design in the SDD.

### 1.4 Objectives

1. To analyze the journey from agreed design to shipping and identify where
   repeated entry or unclear handoffs cause difficulty.
2. To design a responsive order-entry and operational workflow whose screens,
   architecture and database reuse consistent order information.
3. To develop and verify that workflow in separately approved stages, starting
   from reviewed requirements and assessing the existing prototype against them.

### 1.5 Scopes

#### 1.5.1 Scope of the System

**Agreed product direction for planning:**

- One priced order form completed by the customer or Admin after external
  design agreement, with mockup attachment by either party.
- Quotation generation from entered order information, with document status
  and history; one Admin Confirm order action creates the linked job and
  initial invoice after the Admin sets the deposit.
- Linked production jobs reusing customer details, clothing selections,
  quantities and the mockup. Admin releases eligible jobs to factory Staff,
  who update production progress and completion in the same system.
- Order-specific deposit requirements and remaining-payment records, with production and
  fulfilment gates; shipping and self-collection; Contacts and relevant
  activity history.
- Responsive use across customer devices, office desktop, supervisor tablet
  and factory-floor mobile.

Existing planning for controlled invoice replacement, confirmed refund
records and cancellation settlement remains for review in SRS FR-7/FR-8;
this intake change does not remove historical records or authorize automatic
money transfers. Stock management is not part of this order-entry scope.

**Open decisions:** Exact catalogue option rules, quantity pricing and
additional charges; quotation output and detailed change/cancellation handling;
attachment file limits/storage and detailed fulfilment charges. Deposit is not a fixed
percentage: Admin sets it per order from RM0 up to the invoice total.

**Out of scope (deferred):** Customer-facing QR order/production status
tracking, AI-assisted features, a full accounting suite, enforced
multi-staff permissions, WhatsApp/payment-gateway integrations, platform
administration/multi-company management, camera-based scanning, and
Inventory, BOM and Stock Ledger. Full
list: `docs/SRS.md` section 3.

Design creation, design discussions and design approval remain outside the
application. Recording the agreed mockup does not introduce a design editor
or approval module. Customer form entry does not imply a customer account or
customer-facing tracking portal.

**Existing prototype versus intended system:** The existing frontend is a
synthetic-data prototype, not the completed customer-intake and payment-gated
workflow described here. Older references to **v1** describe the frontend
demonstration; this expanded direction has not yet been assigned a release.

**Current work:** Review and revise the planning documents. Architecture,
database, customer access and attachment storage may be designed, but their
implementation, backend services, authentication, dependencies and deployment
require separately assigned work. A real-data release needs persistent
storage, appropriate access controls and verification; the prototype does
not establish those capabilities.

#### 1.5.2 Coverage of the System

- **Location or area of the user:** Malaysia (Malaysian print-shop
  operations).
- **Language of the system:** English (`en-MY` locale), with MYR currency
  and `Asia/Kuala_Lumpur` timezone as defaults.
- **Users of the intended system:** Customer (priced order-form entry through
  a private customer-specific link after design agreement); Admin (entry on
  behalf of customers, commercial records and order coordination); Staff
  (production work). Detailed Staff permissions follow the agreed module and
  action model. Customer QR tracking remains deferred and is separate from the
  agreed form-entry direction.

## 2. Methodology

### 2.1 Software Model

LLL Print follows an iterative, journey-based development approach. Review
the business workflow and record its requirements in the SRS. Then design the
UI/UX, architecture, database and interfaces together in the SDD before
implementing the affected journey.

Develop and verify one connected journey at a time rather than treating each
screen as an independent feature. For each journey:

1. Confirm the users, inputs, pricing or business rules, statuses, exceptions
   and expected result.
2. Define the screen behaviour, data relationships, system boundaries and
   acceptance checks.
3. Compare the existing prototype with the reviewed requirements and decide
   what can be retained, corrected or replaced.
4. Implement only the approved slice, then verify the complete workflow on
   its applicable customer, office and production devices.

Frontend and backend work use the same SRS and SDD. A change to an order field
or business rule must be reviewed across the form, documents, production view,
API and database before integration. The present activity is document review;
it does not establish that the revised workflow is implemented.

### 2.2 Software and Hardware Specification

#### Current development environment and frontend

| Item | Specification |
|---|---|
| Development operating system | Windows workspace currently used for the project |
| Application type | Responsive web application accessed through a supported browser |
| Existing frontend | React, TypeScript, Vite, React Router, TanStack Query |
| Frontend status | Synthetic-data prototype; does not yet represent the complete revised workflow |

#### Planned later backend direction

| Area | Direction |
|---|---|
| Server | NestJS with Fastify |
| API | REST/OpenAPI |
| Database | PostgreSQL with Prisma |
| Background jobs | pg-boss |
| File/object storage | S3-compatible object storage |

These planned components are not yet built. PostgreSQL supports the planned
business records; object storage is relevant to mockup attachments. The need
for background jobs must be justified by a specific approved task such as
document generation or retryable processing before implementation.

#### Target devices

| Item | Specification |
|---|---|
| Customer access | Customer mobile phone, tablet or desktop browser for the priced order form |
| Internal access | Office desktop, supervisor tablet and factory-floor mobile device |
| Display | Responsive layout appropriate to each user and task |
| Development hardware minimum | Not yet measured or agreed |
| Supported browser/device minimum | To be defined and verified before a real-data release |

## 3. Project Management Plan

### 3.1 Project Milestone

The milestones below describe the actual project position. An earlier
synthetic-data frontend prototype exists, but it was built before the current
order-intake direction was understood clearly. Its existence is not evidence
that the requirements or design milestones are complete.

| Milestone | Description | Outcome | Status | Completion date |
|---|---|---|---|---|
| M1 — Product planning review | Confirm the real workflow, purpose, scope and unresolved business decisions | Reviewed SPMP | In progress | To be agreed |
| M2 — Requirements review | Define the customer/Admin form, quotation, invoice, payment, production and shipping behaviour | Approved SRS | Pending | To be agreed |
| M3 — UI and technical design | Design the screen flows, architecture, database, interfaces and mockup storage from the approved requirements | Approved SDD and linked UI designs | Pending | To be agreed |
| M4 — Existing prototype assessment | Compare the current frontend with the approved SRS/SDD and identify what can be retained, corrected or replaced | Evidence-based prototype assessment and implementation plan | Pending | To be agreed |
| M5 — Implementation by journey | Implement approved customer and internal journeys in small connected stages | Working system slices that satisfy their acceptance checks | Pending | To be agreed |
| M6 — System verification and release preparation | Verify the complete workflow, responsive use, data integrity, access controls and operational readiness | Reviewed release candidate and documented remaining risks | Pending | To be agreed |

Milestones move forward only when their stated outcome has been reviewed.
Reaching a later milestone does not erase the need to revisit an earlier one
when the business workflow changes. No completion dates are assumed.

The current work is M1. After the SPMP is reviewed, the next work is M2: align
the SRS with the agreed single-entry workflow. Database tables, API contracts
and screen layouts belong to M3 after their requirements are clear.

Implementation task briefs will be prepared later from the approved SRS and
SDD. Older task labels and prototype sequencing are historical context, not
the current plan. Inventory, BOM and Stock Ledger remain deferred. Backend,
database, authentication, file-storage and deployment implementation require
their own assigned work after the relevant design milestone is approved.
