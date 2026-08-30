# LLL Print Product Vision

## Document control

- Status: Approved foundation
- Product: LLL Print
- Owner: Product Owner
- Approver: Product Owner (final decision); supervisor consulted for advice only
- Approved by: Muflih (Product Owner / sole developer)
- Approved on: 2026-08-30
- Release applicability: Product foundation; release scope is not yet approved
- Last updated: 2026-08-30

This document defines the product-level foundation for LLL Print. It does not
approve implementation, release scope, detailed requirements, or architecture.

## Product identity

LLL Print is an independent web product for Malaysian print-shop operations.
It is not simply the earlier internal draft (formerly named MZPrintFlow)
carried forward under a new name without independent review, and it is not a
copy or clone of the external reference product NZPrintFlow
(nzprintflow.my) or any other reference system.

## Intended users and operating contexts

The product is intended to support print-shop work across these confirmed
device contexts:

- Office desktop
- Supervisor tablet
- Factory-floor mobile device

### Confirmed user roles

- **Owner** — oversees the business and overall order flow.
- **Admin** — receives customer orders, prepares quotations and job
  descriptions, and manages orders end to end.
- **Designer** — creates and manages the print design/artwork for each order.
- **Customer** — does not log in or use the operational workspace. A customer
  only views their own order/production status, without an account, by
  scanning a QR code (similar to a food-delivery order-tracking experience).

Detailed responsibilities and permissions for each role remain open for
Product Owner approval.

## Problem statement

Malaysian print shops need a practical way to coordinate operational work
across office, supervision, and production contexts without depending on a
desktop-only experience.

Today, orders are received and negotiated entirely through informal chat
(e.g. WhatsApp): a customer describes the order, quantity, and sizes in
conversation, and staff then manually re-write that conversation into a
quotation and job description. This manual re-entry is slow and error-prone,
and it gives the customer no way to check order or production progress
without asking staff directly.

The exact priority problems and measurable outcomes remain open for Product
Owner approval before this statement becomes an approved product requirement.

## Product promise

LLL Print is intended to provide one responsive operational workspace that is
usable across desktop, tablet, and mobile contexts, replacing manual,
chat-based order handling with a structured quotation and job workflow.

A confirmed future goal (not part of the current documentation/frontend
phase) is customer-facing, no-login order and production status tracking via
QR code, similar in spirit to a food-delivery order-tracking experience. This
requires a real backend and is out of scope until a later, separately
authorized phase.

### Confirmed success measures

LLL Print will be judged successful for its intended users when it delivers:

- **Faster quotations** — creating a quotation/job description takes minutes,
  not manual re-typing from a chat conversation.
- **Fewer mistakes** — wrong quantity, size, or price errors drop because
  staff enter structured data instead of retyping from memory or chat.
- **Easier order tracking** — Admin and Owner can see all current orders and
  their status in one place, instead of scrolling through chat history.

The detailed value proposition and priority workflows remain open decisions.

## Confirmed product principles

- LLL Print is an original, independent product.
- It targets Malaysian print-shop operations.
- It is one responsive web application, not separate desktop and mobile
  products.
- Applicable features must define their desktop, tablet, and mobile behavior.
- Current localization defaults are MYR, `en-MY`, and
  `Asia/Kuala_Lumpur`.
- Prototype behavior is not automatically a production requirement.
- Reference-product observations are not approved LLL Print requirements.

## Current technical direction

The current frontend foundation is React, TypeScript, Vite, React Router, and
TanStack Query.

The planned system direction is a modular monolith with a single-company
launch and tenant-ready ownership boundaries. The planned backend technologies
are NestJS with Fastify, REST/OpenAPI, PostgreSQL, Prisma, pg-boss, and
S3-compatible object storage.

These are design constraints and planning inputs. They do not authorize
backend, database, infrastructure, dependency, or deployment work.

## Non-goals until explicitly approved

The following are outside the product foundation and must not be assumed to be
in scope:

- Customer-facing QR order/production status tracking (confirmed future
  goal, requires a real backend, deferred to a later authorized phase)
- AI or OCR features
- Messaging integrations
- Payment integrations
- Subscription or platform-administration capabilities
- Advanced analytics
- Claims of tax, accounting, PDPA, SST, MyInvois, security, accessibility, or
  other regulatory compliance
- Reproduction of reference-product branding, wording, assets, layouts, code,
  pricing, prompts, identifiers, or confidential information

## Decision classification

### Confirmed decisions

- Product identity and Malaysian market context
- Responsive desktop, tablet, and mobile product direction
- Localization defaults
- Current frontend foundation
- Planned modular-monolith direction
- Separation between LLL Print requirements and reference research
- Core roles: Owner, Admin, Designer, and no-login QR-tracking Customer
- Core problem: manual, chat-based order intake and quotation creation
- Future goal (later phase): customer QR order/production status tracking
- Confirmed MVP build order (for later, separately authorized implementation
  phases), earliest first:
  1. Quotation and job-description creation form (structured data entry
     replacing manual chat re-typing)
  2. Order/job status tracking board (all jobs and their current stage in one
     place)
  3. Customer-facing QR order/production status tracking (requires a real
     backend; separately authorized, later phase only)

### Assumptions requiring validation

- A shared operational workspace is the primary product value.
- Office, supervisory, and factory-floor work should be coordinated in one
  product.

These assumptions must not be expressed as mandatory requirements until
approved.

### Reference-derived material

Existing LLL Print-labelled SRS, blueprint, and technical-observation files
are research or historical planning inputs only. Their workflows, fields,
roles, rules, and feature lists are not authoritative for LLL Print.

### Open decisions

- Detailed responsibilities and permissions for each named role
- Highest-priority user problems, beyond the core manual-order-intake problem
- Detailed MVP inclusions and exclusions beyond the confirmed build order
  (e.g. which fields, filters, and screens are truly required for v1)
- Phase and release boundaries
- Approval owner and approval record

## Documentation authority

This product vision owns the approved audience, problem, promise, principles,
and non-goals once its open decisions receive supervisor approval.

The planned formal documentation set has separate authority:

- SPMP: project management, delivery scope, responsibilities, schedule, risks,
  and controls
- SRS: approved functional and non-functional requirements
- SDD: approved system and software design derived from the SRS

Later module specifications, workflow documents, rule documents, ADRs, and
acceptance tests should link to their authoritative statements rather than
duplicate them.

## Approval gate

This document remains proposed until the supervisor resolves the open
decisions and records approval. Its creation does not approve implementation or
authorize changes beyond this documentation file.
