# Software Project Management Plan (SPMP)

Project: LLL Print
Status: Draft
Last updated: 2026-10-19

## 1. Introduction

### 1.1 Project Overview

LLL Print is a web system for one Malaysian print shop, Three L T shirt Factory
Apparel. It keeps one record for each order, from the customer's first message to
the day the order goes out.

Every order is known by its job title. One real order is used as the example in
all three documents: **KEM PENGAKAP** — EYELAT 170gsm, 55 helai, RM 1,734.00, due
5 October.

Admin types the order in. The customer does not fill in a form in this version.
The customer sends what they want however they like, usually a WhatsApp message,
and Admin types it into the system. A customer form may be added later. It would
use the same fields, the same options and the same prices, so only the person at
the keyboard would change.

The design is agreed outside the system. The customer and the designer talk until
the design is settled. The system does not draw a design, discuss it or approve
it. It keeps the agreed mockup as a picture attached to the order.

This is how one order moves:

1. The customer sends what they want.
2. The customer and the designer agree the design. Outside the system.
3. The customer and the shop agree the date. Outside the system.
4. Admin types the order in — the garments, the sizes, the quantities.
5. The system works out the price, and Admin makes the quotation.
6. Admin sends the customer a link to the quotation.
7. The customer agrees. Admin records that they agreed, and when.
8. One action makes a job and an invoice from the agreed quotation. The
   quotation itself stays exactly as it was.
9. Admin sets the deposit for this order, and records it when the customer pays.
10. Admin starts the job, and the factory begins.
11. The factory moves the job through its steps and marks it finished.
12. Admin asks for the rest of the money and records that payment.
13. The order is posted, or the customer collects it.

Two rules sit on that list. The job never starts by itself — Admin starts it,
once the deposit is paid. And the order is normally paid in full before it goes
out, though Admin may hand it over with money still owing if a reason is
recorded.

The point of the system is that the order is typed once. The same typing produces
the quotation, the invoice and what the factory makes. What was agreed stays
saved, so it can be read again months later without scrolling through a chat.

The benefit claimed is less retyping and clearer handovers. No time saving and no
reduction in mistakes have been measured, and none is claimed.

Read the three documents in this order:

| Document | Question it answers |
|---|---|
| SPMP | Why are we building the product, what is its scope, and how is the work planned? |
| SRS | Who uses the system, how does an order move through it, and what must happen? |
| SDD | How will the screens, architecture, database and interfaces meet those requirements? |

The SRS has been brought in line with this document. The SDD has not yet been,
and until it is, this document and the SRS together are the agreed statement of
the purpose, the scope and the plan.

### 1.2 Problem Statement

Today the shop keeps its orders in two places: WhatsApp and Excel.

The customer's request arrives as a WhatsApp message. Admin reads it and works
out the garments, the sizes, the quantities and the price in an Excel sheet. The
quotation is typed from the sheet. The invoice is typed again. What the factory
must make is told to them again.

That way of working costs the shop five things.

1. **The order lives in two places.** The customer's request is in the WhatsApp
   chat. The sizes, quantities and prices are in the Excel sheet. Nothing joins
   the two, so neither one is the whole order.
2. **The same details are typed again and again.** Once into the sheet, once for
   the quotation, once for the invoice, and once more when telling production
   what to make. Every retyping is a chance for a size or a price to come out
   different.
3. **What was agreed is hard to find again.** When a customer asks two months
   later what they ordered, Admin scrolls back through the chat to look for it.
4. **The sheet sits on one computer.** The factory cannot see it. Admin cannot
   see it from a phone.
5. **Nothing shows the state of everything at once.** Which orders are waiting
   for a deposit, which are in production, which are finished and waiting for the
   rest of the money — there is no one place that answers that.

The KEM PENGAKAP order shows it plainly. One WhatsApp message held five
garments, twenty size entries and 55 helai. Those numbers were worked out in a
sheet, then typed again for the quotation, and the message they came from stayed
in the chat.

This is also the reason the system reads a pasted message. The order already
exists as text the customer wrote. Pasting that text in carries it across instead
of typing it a second time. See `docs/SRS.md` FR-1.14.

How often these problems cause a real mistake, and what each one costs the shop,
has not been measured.

### 1.3 Problem Solution

What the system does, and each line answers something in 1.2:

1. One record for each order, from the first message to the day it is posted.
2. Paste the customer's WhatsApp message in, instead of typing it all again.
3. Type the order once. The quotation, the invoice and the job all use it.
4. The quotation and the invoice stay saved, so what was agreed is always
   visible.
5. Works on a phone, and the factory can see what to make.
6. One screen showing which orders need attention.
7. The mockup is attached as a picture of the agreed design.
8. When the customer agrees, one action makes a job and an invoice from the
   quotation, and the quotation stays as it was, so what was quoted can always
   be read back.
9. The job waits until Admin starts it.

### 1.4 Objectives

1. To study how an order moves from the customer's first message to the day it
   goes out, and to find where details are typed again or handed over unclearly.
2. To design a responsive order-entry and production workflow whose screens,
   architecture and database reuse the same order information.
3. To develop and verify that workflow one module at a time, starting from
   requirements agreed with the shop.

### 1.5 Scopes

#### 1.5.1 Scope of the System

**In scope:**

1. The option catalogue — the necks, sleeves, sizes, materials and other
   choices the shop offers, and what each one costs as standard. Admin
   maintains it, and nothing can be chosen on an order unless it is here first.
2. One order form, typed by Admin, after the design is agreed outside the system.
3. The order in three levels — the specifications once for the whole order,
   then the garment groups, then the sizes and quantities under each group.
   Neck, sleeve and size are chosen as buttons, never typed.
4. Pasting the customer's message to fill in the order rows.
5. The mockup attached to the order.
6. A quotation with the prices worked out and shown.
7. A validity date on the quotation.
8. A quotation document with a private link, which Admin sends to the customer.
9. Recording that the customer agreed.
10. One action that makes a job and an invoice from the agreed quotation,
   leaving the quotation unchanged.
11. Deposit and payment records.
12. Production steps, and the factory updating progress on a phone.
13. Shipping or self-collection.
14. Contacts, and a history of what happened to each order.
15. Company details, kept once and printed on every document.
16. Search on every list — order number, customer name, job title.
17. Filtering by date range and by status.
18. The Overview screen, showing what is running late with the next action on it.
19. Correcting what has already been issued — an invoice, a payment or a
    cancelled order — by replacing, voiding or refunding it, never by quietly
    editing it.
20. Staff accounts, and Admin ticking which business actions each account may
    perform.
21. Works on office desktop, tablet and factory phone.

**Out for now:** the customer filling in their own form, a public shop page
anyone can find, a QR code for the customer to follow their own order, tax,
discounts, automatic quantity-discount tiers, stock and inventory, and full
accounting. Design creation, design discussion and
design approval stay outside the system entirely.

**Serving many shops is the intended direction.** The system is built for one
shop, Three L T shirt Factory Apparel, and nothing for running several shops is
built now. But the intention is that it serves other print shops later, so the
deferral above means later, not never. The one thing this costs today is written
in section 2.2: every record names the shop it belongs to.

**The existing frontend is replaced, not extended.** It was built before the way
the shop takes an order was understood. The same applies to the existing
interface mockup. See section 2.1.

**Attachments, confirmed with the shop:** the mockup is a picture. The system
accepts JPG, PNG and PDF, up to 10 MB per file. See section 2.2.

#### 1.5.2 Coverage of the System

- **Where it is used:** Malaysia.
- **Language and money:** English, `en-MY`, Malaysian Ringgit, Kuala Lumpur time.
- **Who uses it:** Admin, who types the orders and keeps the money records; and
  factory Staff, who do the production work and update progress. The customer
  does not log in.

## 2. Methodology

### 2.1 Software Model

LLL Print is built the Agile way, one module at a time.

A module is one piece of the system that works on its own. It can be opened and
used with real typed data. A screen holding example data is not a module.

The requirements and the design are agreed first, in this document, the SRS and
the SDD. They are the starting point, not a frozen contract. When building a
module shows that something in them is wrong, the document is corrected.

The system is then built module by module. For each module:

1. Agree what it must do, who uses it, and what counts as finished.
2. Design its screens and its data.
3. Build it.
4. Use it with real typed data, on the devices it is meant for — office
   desktop, tablet, and the factory phone.

The modules are built in an order where each one stands on what is already
finished. Section 3.1 lists them. That order may change if the shop needs
something sooner.

The existing frontend is replaced, not extended. It was built before the way the
shop takes an order was understood, so it is kept only as a lesson in what the
screens must not do. The same applies to the existing interface mockup.

An order field or a pricing rule never appears in one place only. When one
changes, it is checked across the form, the quotation, the invoice, the factory
screen and the database before the change is accepted.

**What this project does not use, and why.** There are no fixed-length sprints,
no daily stand-ups, no story points, no velocity measure, no sprint reviews or
retrospectives, and no Scrum roles. The team is one Admin and one developer. None
of those practices would describe anything real at that size, and naming them
would make this plan a description of a project that does not exist.

**What is honest about the method.** Writing and agreeing the three documents
before building is not Agile. It is stated here rather than hidden, because the
requirements for a print shop's order workflow have to be settled with the shop
before any of it is built. What is Agile is the building: small modules, each one
finished and usable before the next begins, and a document corrected when a
module proves it wrong.

### 2.2 Software and Hardware Specification

#### What the system is

| Item | Specification |
|---|---|
| Application type | One responsive web application, used by Admin in the office and by factory Staff on a phone |
| Installable on a phone | Yes. It is installed to the phone's home screen and opens without a browser bar. Its screens open on a weak signal, but saving or reading an order needs a connection to the server |
| Development operating system | Windows |
| Language and region | English, `en-MY`, Malaysian Ringgit, `Asia/Kuala_Lumpur` |

The factory floor is where the signal is worst and where nobody will type a web
address. Making the system installable is a small amount of configuration, not a
different design, so it is committed to here rather than left as an idea.

**Said plainly: the system does not work without a connection.** The screens
themselves open from the phone, but every order is read from and written to the
server. If the factory loses signal, a step cannot be marked until it returns.
Working offline and catching up later is possible to build and is not in this
scope. Whether the factory's signal is good enough is listed below as still to be
decided, because nobody has measured it.

Pinch-to-zoom is never disabled. Some people need it.

#### What it is built with

| Part | Choice |
|---|---|
| Screens | React with TypeScript, built by Vite |
| Screen routing | React Router |
| Reading and caching data on screen | TanStack Query |
| Server | Java with Spring Boot |
| How the screens talk to the server | A REST API of our own |
| Reading and writing records | Spring Data JPA |
| Login, and who may do what | Spring Security, with a signed token and hashed passwords |
| Where the records are kept | MySQL |
| Where the artwork files are kept | Held by the server, which checks the type and the size |
| Reading a pasted customer message | Called from the server, so the provider key is never in the browser |
| Publishing the screens | Cloudflare Pages, already in use |

Money is stored as whole sen. RM 1,734.00 is stored as 173400, never as a
fractional number, so no total can drift by a sen between the quotation and the
invoice.

**Why a server of our own and a relational database.**

1. **The records are related, and those relations must be enforced.** An order
   has garment groups; a garment group has sizes; an invoice belongs to exactly
   one job; a payment belongs to exactly one invoice and never moves between
   customers. A relational database refuses a write that breaks those rules.
   Without one, our own code has to remember, every time.
2. **A quotation and a job must never become one record.** A job's price may be
   corrected later. If the two shared a record, that correction would quietly
   rewrite what the customer agreed to. Separate tables joined by a key make that
   impossible rather than merely forbidden.
3. **Money is worked out where it cannot be altered.** A total calculated in the
   browser can be changed in the browser. The server works it out again from the
   stored lines and refuses one that does not match.
4. **Growing to serve more shops is the direction.** A smaller setup would have
   to be replaced to get here, and replacing it later costs more than building it
   this way now.

**What else was considered.**

| Option | Why it was not chosen |
|---|---|
| A browser application talking straight to a hosted database, with no server of our own | Genuinely works, costs nothing to run, and is the quickest way to a working screen. Rejected because it cannot enforce the relations in reason 1, cannot work the price out where nobody can alter it, and would have to be replaced to reach the direction in reason 4 |
| The same, but with a hosted relational database | Closer, and it keeps the relations. Still rejected for reason 4: the business rules would live in the screens and in database rules rather than in one place that can be reused for another shop |
| A ready-made shop or invoicing system, bought off the shelf | None of them price a garment the way this shop does: three levels, priced options as buttons, a price that differs per customer, and a price that may be negative |
| Keeping Excel and WhatsApp as they are | Section 1.2 is the answer to that |

The first two work. This one was chosen because the system is meant to grow.

#### Built so another shop can use it

The system is built as a framework that one shop uses first, not as a program
written for one shop. Three rules follow, and they shape the design rather than
being added later.

1. **Every record names the shop it belongs to**, and every query includes it.
2. **What differs between shops is data, not code.** The garment options and
   their prices, the sizes, the production steps, the company's own details: a
   shop sets all of these up for itself. Serving a different shop means new rows,
   not new code.
3. **The business rules live in one place on the server**, kept apart from the
   screens and from the database, so they can be reused rather than rewritten.

What is **not** built now: any way to switch between shops, to sign a new shop
up, to bill shops, or to administer the platform.

**What it costs.** The server and the database have to be hosted somewhere. While
the system is being built, both run on the developer's own machine at no cost.
Where they run once the shop uses it is listed below as still to be decided.

#### Devices

| Item | Specification |
|---|---|
| Office | Desktop browser |
| Supervisor | Tablet |
| Factory floor | Mobile phone, with the system installed to the home screen |
| Display | Responsive layout suited to each task |

The customer's own device is not listed. In this version Admin enters every order,
so the customer never opens the system. When the customer form is added later, its
device support is added with it.

#### Attachments

| Item | Specification |
|---|---|
| What is attached | One file per order, being both the customer's mockup and the print artwork |
| When it is attached | At any time. Usually at order entry, but the design file may arrive later, so the system never waits for it and never refuses an order or a job because it is missing |
| Accepted file types | JPG, PNG and PDF. The mockup itself is always a picture; PDF is accepted so Admin is never stuck when a designer sends one |
| Maximum file size | 10 MB. A photograph from a phone is well under 1 MB, so this leaves room for a large file without allowing a video |

Confirmed with the shop 2026-09-29, and the timing confirmed 2026-09-30. The
SRS states the same list, the same limit and the same timing as requirements.

#### Still to be decided

| Item | Status |
|---|---|
| Where the server and the database are hosted | Not decided. Both run on the developer's own machine while the system is being built. It is not a concern until the shop uses the system |
| Whether the factory's signal is good enough | Not measured. The system needs a connection for every action, so this has to be checked on the factory floor before module 3 is relied on |
| Minimum development hardware | Not measured or agreed |
| Minimum supported browser and device | To be defined and verified before real customer data is used |
| Page weight budget | Not set. Worth setting, because the factory phone downloads it over a weak signal. The Overview screen is specified as counters and lists rather than graphs, which keeps a charting library out of the download |
| Cost and monthly limit of the message reader | The reading service is charged for by use. The SRS requires that a limit exists and that Admin is told when it is reached (FR-1.14). The number itself and the cost are still to be decided |

## 3. Project Management Plan

### 3.1 Project Milestone

The three requirement documents are agreed first. The system is then built one
module at a time, in the order below, following section 2.1.

A module counts as reached only when it can be opened and used with real typed
data. A screen that exists but holds example data has not reached its milestone.

**The existing frontend prototype is not a milestone.** It was built before the
way the shop takes an order was understood, and it is being replaced rather than
assessed. Earlier versions of this plan carried a prototype-assessment milestone;
it has been removed because there is nothing to assess. The prototype work sits
outside this milestone track entirely.

| Milestone | Description | Outcome | Status | Completion date |
|---|---|---|---|---|
| M1 — Project plan agreed | Confirm the real order workflow, the purpose, the scope, the way of working and the module order | Agreed SPMP | Reached | 2026-09-29 |
| M2 — Requirements agreed | Define the order form and its option buttons, the pricing rules, the quotation, the customer's agreement, the invoice, payments, production, sending out, and what each Staff account may do | Agreed SRS | Reached | 2026-10-15 |
| M3 — Design agreed | Design the screens, the data, the interfaces and the mockup storage from the agreed requirements | Agreed SDD and its interface designs | Reached | 2026-10-19 |
| M4 — Module 1: the order form, its prices and the quotation | Four steps in order: the option catalogue and its standard prices; the order form with its running total; the quotation document and its private link; then reading a pasted customer message | A real order can be typed and a quotation produced from it | Pending | To be agreed |
| M5 — Module 2: agreement, job and invoice, deposit and payments | Record that the customer agreed. One action creates the job and the invoice together. Deposit typed per order, and payment records | An agreed quotation becomes a job and an invoice, with the balance visible | Pending | To be agreed |
| M6 — Module 3: production | The job, its production steps, and factory Staff updating progress on a phone | The factory can move a real job through its steps | Pending | To be agreed |
| M7 — Module 4: sending out, and Contacts | Delivery or self-collection, and the full Contacts screen with search and order history | An order can be finished from the first message to handover | Pending | To be agreed |
| M8 — Module 5: Overview | The one screen showing what needs attention — late, waiting for a deposit, waiting to be checked, finished but not paid | The state of every order readable on one screen | Pending | To be agreed |
| M9 — Checked and ready for real use | Verify the whole workflow, responsive use on all three devices, data integrity, and that Staff permissions are enforced | Reviewed release candidate and a written list of remaining risks | Pending | To be agreed |

**M4 is larger than the others and the table does not show it.** Module 1 is the
first module, so it carries the foundation every later module stands on: the
server, the database, logging in, and who may do what. None of that is visible on
a screen, and all of it comes before the first order can be saved. The module is
still finished only when a real order can be typed and a quotation produced from
it, but the work before that first showing is heavier than for any module after
it.

**Why this order.** Each module stands on what is already finished. Module 1 must
come first because every other module reads an order. Module 5 must come last
because every line on it is a reading of records the other modules own; built
earlier it would be an empty screen. M2 to M8 each produce something that can be
opened and demonstrated, which is the point of dividing the work this way.

**Why module 1 has four steps inside it.** The option catalogue comes first
because a form whose fields are option buttons cannot be built before something
decides what those buttons are and what each one costs. The pasted-message reader
comes last because it is the least predictable piece of work in the plan; putting
it last means the form and the quotation are both demonstrable before it starts.

**The module order may change.** If the shop needs something sooner, the order
changes and this table is updated. The order of M6 and M7 is the least settled:
production comes before sending out because that is the real order of work in the
shop, but sending out is the smaller module.

Milestones move forward only when their outcome has been reviewed. Reaching a
later milestone does not remove the need to return to an earlier one when the
shop's way of working turns out to be different from what was written down. No
completion dates are assumed.

The current work is M4, module 1 — the order form, its prices and the
quotation.

Inventory, bill of materials and stock ledger remain out of scope. The database,
login, file storage and publishing are set up inside the modules that need them
rather than as separate milestones, because a module cannot hold real typed data
without them.
