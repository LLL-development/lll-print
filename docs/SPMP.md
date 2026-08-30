# LLL Print Software Project Management Plan

## Document control

| Field | Value |
|---|---|
| Document ID | LLL-SPMP-001 |
| Version | 0.3 |
| Status | Proposed |
| Current phase | Phase 1A — Product and Frontend Foundation |
| Product Owner | Project owner |
| Approval authority | Product Owner |
| Adviser | Supervisor, when consultation is requested |
| Last updated | 2026-08-29 |

### Revision history

| Version | Date | Summary | Decision |
|---|---|---|---|
| 0.1 | 2026-08-29 | Initial current-phase draft | Superseded |
| 0.2 | 2026-08-29 | Product Owner governance and management controls added | Superseded |
| 0.3 | 2026-08-29 | Restructured as a tailored standards-based SPMP | Product Owner review pending |

## 1. Introduction

### 1.1 Purpose

This Software Project Management Plan (SPMP) defines how Phase 1A of LLL Print
will be organized, controlled, reviewed, and closed. It establishes the phase
boundary, responsibilities, deliverables, management processes, technical
approach, supporting processes, and acceptance gates.

The Product Owner makes final product and project decisions. Advice does not
become a requirement until the Product Owner records its acceptance.

### 1.2 Scope of this plan

This plan governs Phase 1A — Product and Frontend Foundation. It does not
authorize production use, later-phase work, or functionality merely because it
appears in the clickable prototype.

Product purpose, audience, promise, and product-level non-goals are owned by
the [Product Vision](PRODUCT_VISION.md). Release inclusion will be owned by a
separate MVP scope baseline.

### 1.3 Intended audience

- Product Owner
- Developer
- Assigned technical reviewer
- Supervisor or other adviser when consulted
- Future contributors who need to understand the approved project baseline

### 1.4 Standards and tailoring

This plan is structured with reference to:

- ISO/IEC/IEEE 16326:2019, project management for systems and software;
- ISO/IEC 29110, lightweight management and engineering guidance for very
  small entities;
- ISO/IEC/IEEE 29148:2018, requirements engineering;
- ISO/IEC/IEEE 42010:2022, architecture descriptions; and
- ISO/IEC/IEEE 29119, software testing.

LLL Print does not claim formal conformity or certification. The standards are
tailored to an owner-led project so that controls remain useful and
proportionate.

### 1.5 Terms

| Term | Meaning in this plan |
|---|---|
| Baseline | A version explicitly accepted by the Product Owner for controlled use |
| Deliverable | A reviewable work product with defined acceptance evidence |
| Decision record | A dated record of a choice, its owner, rationale, and affected artifacts |
| ADR | Architecture Decision Record for one architecturally significant choice |
| Phase gate | Evidence that must be accepted before work advances |

## 2. Project overview

### 2.1 Product objective

LLL Print is an independent responsive web product for Malaysian print-shop
operations. It is intended to support office desktop, supervisor tablet, and
factory-floor mobile contexts in one application.

### 2.2 Phase objective

Phase 1A establishes a reviewable product and frontend foundation from which
the Product Owner can approve an MVP boundary and authorize later requirements
and design work.

### 2.3 In-scope work

- Establish LLL Print product-governance documents.
- Review the prototype's terminology, navigation, screens, and proposed flows.
- Demonstrate applicable desktop, tablet, and mobile behavior.
- Maintain the React, TypeScript, Vite, React Router, and TanStack Query
  frontend foundation.
- Use mock data and simulated interactions for evaluation only.
- Verify the frontend foundation with proportionate technical checks.
- Record the Product Owner's product and MVP-scope decisions.
- Prepare an authorization baseline for later SRS and SDD work.

### 2.4 Excluded work

- Production backend APIs or services
- Databases, migrations, production data, or implemented tenancy
- Production authentication or authorization
- Infrastructure, monitoring, deployment, or release operations
- Real file storage or document generation
- Messaging, payment, OCR, AI, and accounting integrations
- Tax, SST, MyInvois, PDPA, security, accessibility, or accounting-compliance
  claims
- Final SRS or SDD production unless separately added to the phase
- Reuse of reference-product branding, wording, assets, layouts, code, pricing,
  prompts, identifiers, or confidential information

### 2.5 Assumptions and constraints

| ID | Type | Statement | Treatment |
|---|---|---|---|
| P1A-AC01 | Constraint | LLL Print remains independent from all reference products. | Applies throughout the phase |
| P1A-AC02 | Constraint | Applicable features support desktop, tablet, and mobile contexts. | Include in review evidence |
| P1A-AC03 | Constraint | Prototype behavior is not automatically an approved requirement. | Record explicit Product Owner decisions |
| P1A-AC04 | Constraint | Later architecture is planned as a modular monolith with clear ownership boundaries. | Planning input only; no implementation authority |
| P1A-AC05 | Assumption | The prototype is sufficient to support early workflow and terminology review. | Validate during prototype review |
| P1A-AC06 | Assumption | One Product Owner can provide timely decisions for the current phase. | Reassess if decisions delay milestones |

## 3. Project organization

### 3.1 Roles and authority

| Role | Responsibilities | Authority |
|---|---|---|
| Product Owner | Own direction, priorities, phase boundaries, MVP scope, baselines, and final acceptance | Final decision authority |
| Developer | Produce authorized deliverables, protect scope, verify work, and report evidence and blockers | Technical execution within approved scope |
| Technical reviewer | Review technical evidence and architecture decisions when assigned | Advisory; cannot approve product scope |
| Supervisor/adviser | Offer advice when consulted | Non-binding advisory role |
| Intended user representative | Evaluate terminology and workflow usefulness when invited | Feedback only unless delegated authority is recorded |

### 3.2 Responsibility assignment

`A` means accountable, `R` responsible, `C` consulted, and `I` informed.

| Work item | Product Owner | Developer | Technical reviewer | Adviser/user representative |
|---|---:|---:|---:|---:|
| Product vision | A/R | C | I | C |
| SPMP | A/R | C | I | C |
| Prototype | A | R | C | C |
| Technical foundation | A | R | C | I |
| MVP scope | A/R | C | I | C |
| SRS/SDD authorization | A/R | C | C | I |
| Phase acceptance | A/R | C | C | I |

## 4. Management process

### 4.1 Objectives and priorities

Work is prioritized in this order:

1. protect product independence and decision authority;
2. establish an approved product and phase baseline;
3. obtain usable prototype feedback across relevant device contexts;
4. define a controlled MVP boundary;
5. prepare traceable inputs for later requirements and architecture work.

### 4.2 Planning and task control

- Only one unfinished task objective is active at a time.
- Each task states its goal, completion condition, scope, affected artifacts,
  authority, and verification method.
- Work outside the phase or task boundary requires a new Product Owner
  decision.
- Estimates and dates are commitments only after the Product Owner records
  them.

### 4.3 Decision and change control

1. Identify the decision or requested change and its reason.
2. Assess affected scope, deliverables, requirements, architecture, schedule,
   risk, and verification.
3. Record alternatives when the choice is material.
4. Obtain the Product Owner's decision.
5. Update the authoritative artifact and any affected traceability.
6. Verify the result and report its actual delivery state.

Architecturally significant decisions require an ADR containing status,
context, considered options, outcome, rationale, consequences, decision owner,
confirmation method, and revisit trigger.

### 4.4 Monitoring and reporting

Progress is reported by deliverable and milestone. Reports distinguish:

- proposed;
- approved or baselined;
- changed locally;
- verified;
- committed;
- pushed;
- pull request opened;
- merged; and
- deployed.

One state is not evidence of another. Reporting cadence remains a Product Owner
decision until a calendar schedule is established.

### 4.5 Risk management

Risks are reviewed when scope changes, at each phase gate, and before delivery.
Likelihood and impact use `Low`, `Medium`, or `High`.

| ID | Risk | Likelihood | Impact | Owner | Response | Review point |
|---|---|---|---|---|---|---|
| P1A-R01 | Prototype behavior is mistaken for approved scope | High | High | Product Owner | Require recorded product and MVP decisions | M3 and M4 |
| P1A-R02 | Reference material is treated as LLL Print authority | Medium | High | Product Owner | Keep it non-authoritative; accept only sanitized decisions | Every baseline |
| P1A-R03 | Backend or production work begins prematurely | Medium | High | Product Owner | Enforce phase and authorization gates | M4 and M5 |
| P1A-R04 | Mobile/tablet behavior is not validated | Medium | High | Developer | Require device-specific review evidence | M3 |
| P1A-R05 | Local work is reported as delivered | Medium | Medium | Developer | Report delivery states separately | Before delivery |
| P1A-R06 | Unrelated working-tree work is overwritten | Medium | High | Developer | Inspect live state and preserve unrelated work | Before mutation |
| P1A-R07 | Delivery targets the wrong repository or branch | Medium | High | Product Owner | Verify repository identity and target before delivery | Before delivery |
| P1A-R08 | Missing dates or evidence delay closure | High | Medium | Product Owner | Assign commitments before baselining milestones | M2 |

## 5. Technical process

### 5.1 Lifecycle model

Phase 1A uses an iterative, evidence-gated lifecycle:

`governance draft → Product Owner decision → prototype review → MVP baseline → requirements-planning authorization → phase closure`

Feedback may cause an earlier artifact to be revised. A revision must be
reviewed again when it changes an accepted decision or downstream dependency.

### 5.2 Current technical direction

- Frontend: React, TypeScript, Vite, React Router, and TanStack Query
- Product delivery: one responsive web application
- Localization defaults: MYR, `en-MY`, and `Asia/Kuala_Lumpur`
- Planned later architecture: modular monolith, single-company launch, and
  tenant-ready ownership boundaries

Planned technologies and architecture constrain later design discussions but
do not authorize backend, database, infrastructure, or integration work.

### 5.3 Requirements and design traceability

Approved features will be traced through:

`user problem → requirement → interaction → permission → business rule → API operation → database transaction → audit event → acceptance test`

Links that are not yet approved remain open decisions. The product vision owns
the problem and promise; the MVP scope owns release inclusion; the SRS owns
requirements; the SDD and ADRs own design decisions.

### 5.4 Development and review method

- Begin with live-state inspection.
- Make the smallest change that satisfies the approved task.
- Preserve unrelated work.
- Review responsive behavior when the task affects user interaction.
- Verify in proportion to risk.
- Record what was and was not verified.

## 6. Supporting processes

### 6.1 Configuration management

- Product deliverables are versioned in the designated repository.
- Repository identity, remote, branch, and target are verified before delivery.
- Private working notes, credentials, local data, generated output, and secrets
  remain outside version control.
- A baseline identifies included artifacts, approval, verification evidence,
  and delivery state.

### 6.2 Verification and validation

Documentation is reviewed for authority, completeness, consistency,
traceability, explicit assumptions, and approval status.

Frontend verification is selected according to change risk and may include:

- automated tests;
- TypeScript production build;
- lint and changed-file checks;
- focused interaction review;
- loading, empty, error, and long-content cases; and
- representative desktop, tablet, and 320-pixel mobile review.

Technical verification confirms that work was constructed correctly. Product
Owner validation confirms that it is the right behavior. Neither substitutes
for the other, and test results are stored as dated task or milestone evidence.

### 6.3 Quality objectives

| Quality objective | Phase 1A evidence |
|---|---|
| Functional suitability | Product Owner disposition of prototype flows |
| Usability | Recorded terminology, navigation, and device-context review |
| Reliability | Relevant automated checks and failure-state review |
| Maintainability | Typed structure, focused modules, lint, and build evidence |
| Portability | Supported-browser and responsive-layout observations when defined |
| Security | No production-security claim; unsafe scope is explicitly excluded |

### 6.4 Issue and decision records

An issue record identifies the problem, effect, owner, status, and next action.
A decision record identifies the question, options when material, decision,
rationale, owner, date, and affected artifacts. Unresolved matters must not be
written as mandatory requirements.

## 7. Work plan

### 7.1 Work breakdown

| Work package | Output | Completion evidence |
|---|---|---|
| WP1 — Governance foundation | Product vision and SPMP | Product Owner approval records |
| WP2 — Prototype assessment | Consolidated review findings | Device-context review and dispositions |
| WP3 — Frontend foundation assessment | Technical verification record | Applicable tests, build, lint, and focused review |
| WP4 — Product decisions | Decision register | Dated decisions linked to affected artifacts |
| WP5 — MVP definition | MVP scope baseline | Approved inclusions, exclusions, priorities, and acceptance authority |
| WP6 — Requirements handoff | SRS/SDD planning authorization | Approved purpose, inputs, owner, and boundaries |
| WP7 — Phase closure | Closure record | Accepted deliverables, transferred items, and next-phase decision |

### 7.2 Milestones

| Milestone | Depends on | Exit evidence | Status |
|---|---|---|---|
| M1 — Foundation restored | None | Live project state verified | Complete for planning |
| M2 — Governance baseline | M1 | Product vision and SPMP accepted | Complete — Product Vision approved 2026-08-30; SPMP filled in and internally consistent |
| M3 — Prototype review | M2 | Review findings and Product Owner dispositions recorded | Complete — see `tasks\260830_prototype_review.md` (5 findings, 4 accepted, 1 deferred) |
| M4 — MVP baseline | M3 | MVP scope accepted | Complete — MVP_SCOPE.md approved v1.0, 2026-08-30 |
| M5 — Requirements planning authorization | M4 | SRS/SDD planning boundary accepted | Not started — unblocked |
| M6 — Phase 1A closure | M5 | Deliverables accepted and next phase decided | Pending |

### 7.3 Schedule and estimates

Calendar dates and effort estimates have not yet been baselined. Each work
package will receive an owner, estimate, target date, and review date before it
becomes a schedule commitment.

### 7.4 Resources and budget

The current phase is owner-led and uses the existing local development
environment and repository. No staffing, procurement, hosting, subscription,
or external-service budget is approved by this plan. Any cost-bearing decision
requires a recorded Product Owner approval before commitment.

## 8. Deliverable register

| ID | Deliverable | Responsible | Dependency | Acceptance evidence | State |
|---|---|---|---|---|---|
| P1A-D01 | Product vision | Product Owner | None | Dated Product Owner approval | Approved 2026-08-30 |
| P1A-D02 | Phase 1A SPMP | Product Owner | None | Dated Product Owner approval | Filled in and internally consistent; governance/process document, not itself subject to this approval cycle |
| P1A-D03 | Responsive clickable prototype | Developer | Governance sufficient for review | Desktop, tablet, and mobile review record | Reviewed — see `tasks\260830_prototype_review.md` |
| P1A-D04 | Frontend technical foundation | Developer | Approved Phase 1A boundary | Dated technical verification record | Implemented locally; previously verified |
| P1A-D05 | Product decision register | Product Owner | Prototype review | Decisions include rationale, date, and affected artifacts | In progress — dispositions recorded in `tasks\260830_prototype_review.md` and `MVP_SCOPE.md`; no standalone register file yet |
| P1A-D06 | MVP scope baseline | Product Owner | P1A-D01, P1A-D03, P1A-D05 | Approved inclusions, exclusions, and priorities | Approved v1.0, 2026-08-30 |
| P1A-D07 | SRS/SDD planning authorization | Product Owner | P1A-D06 | Approved purpose, inputs, owner, and boundaries | Not started |
| P1A-D08 | Phase closure record | Product Owner | P1A-D01 through P1A-D07 | Acceptance and transfer decisions recorded | Not started |

Reference-product SRS, blueprint, and technical-observation files are not LLL
Print deliverables or approved requirements.

## 9. Phase acceptance and closure

Phase 1A may close when:

1. the Product Owner approves or revises the product vision and this SPMP;
2. the prototype review covers applicable desktop, tablet, and mobile contexts;
3. priority users, problems, workflows, modules, and outcomes are decided or
   explicitly deferred;
4. the MVP inclusions, exclusions, priorities, and acceptance authority are
   baselined;
5. the required technical verification passes against the intended baseline;
6. open risks and decisions have an owner and disposition;
7. deliverable and delivery states are reported accurately; and
8. later requirements, design, implementation, or release work receives a
   separate Product Owner decision.

## 10. Open management decisions

| ID | Decision | Owner | Needed by |
|---|---|---|---|
| P1A-OD01 | Approve or revise the Product Vision | Product Owner | M2 |
| P1A-OD02 | Approve SPMP version 0.3 | Product Owner | M2 |
| P1A-OD03 | Assign a technical reviewer if independent review is needed | Product Owner | M3 |
| P1A-OD04 | Define prototype review participants and method | Product Owner | M3 |
| P1A-OD05 | Set milestone dates, estimates, and reporting cadence | Product Owner | Before schedule baseline |
| P1A-OD06 | Approve the MVP scope | Product Owner | M4 |
| P1A-OD07 | Authorize and bound later SRS/SDD work | Product Owner | M5 |

## 11. Approval record

| Version | Decision | Decision owner | Date | Notes |
|---|---|---|---|---|
| 0.3 | Pending Product Owner review | Product Owner | — | Approval would baseline this management plan, not authorize excluded implementation |
