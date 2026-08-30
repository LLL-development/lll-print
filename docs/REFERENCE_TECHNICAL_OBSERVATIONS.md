# Reference Platform — Extended Technical and Product Observations

**Reference reviewed:** `https://www.nzprintflow.my/`  
**Collection date:** 27 August 2026  
**Method:** Authorized black-box browser inspection and analysis of publicly delivered client assets  
**Purpose:** Capture additional observable information useful when designing LLL Print

## 1. Important Boundaries

This appendix records information delivered publicly to a normal browser or displayed through the authorized trial account. It does not represent access to private repositories, server source code, database security rules, provider credentials, or internal documentation.

The following confidence terms are used:

- **Verified:** Directly observed in the authenticated or public interface.
- **Public-bundle verified:** Present in JavaScript/configuration delivered to an ordinary browser.
- **Inferred:** Reasonable interpretation of visible behavior or identifiers; backend behavior remains unverified.

No vulnerability exploitation, permission bypass, excessive scraping, or destructive workflow testing was performed.

## 2. Observable Application Architecture

| Area | Observation | Confidence |
|---|---|---|
| Frontend | React single-page application compiled with Vite | Public-bundle verified |
| Routing | Hash-based routes such as `/#/dashboard` | Verified |
| Hosting behavior | Static entry document with code-split JavaScript assets | Public-bundle verified |
| Styling | Utility-class-oriented responsive styling | Public-bundle verified |
| Data platform | Firebase modules, including Firestore-oriented operations | Public-bundle verified |
| File handling | Separate storage and image utility modules | Public-bundle verified |
| Analytics | Google Analytics tag `G-8CK7K81QGW` and Firebase analytics module | Public-bundle verified |
| AI | Google Generative AI/Gemini client module | Public-bundle verified |
| Spreadsheet processing | Dedicated XLSX module | Public-bundle verified |
| PWA | Web manifest, service-worker registration, mobile metadata, icons | Verified |
| Communication | WhatsApp deep links and AI-assisted message drafting | Verified/public-bundle verified |
| Authentication state | A browser storage key named `nzprintflow_auth` is referenced | Public-bundle verified |
| Localization | English and Malay identifiers are present | Public-bundle verified |
| Currency | Billing records identify `MYR`; some authenticated UI screens displayed `$` | Public-bundle verified/verified |

The presence of client-side Firebase and browser authentication state does not by itself establish whether authorization is secure or insecure. Firebase security rules and backend enforcement were not accessible through this assessment.

## 3. Public Module Inventory

The current entry bundle references 61 JavaScript chunks. Functionally important chunks include:

### Business application

- Dashboard
- Reminders
- Print Jobs
- Documents and Document Template
- Customers
- Inventory
- Stock
- Finance
- Insight
- Notifications
- Staff Settings
- Business Settings
- AI Settings
- Profile and Edit Profile
- Change Credentials
- Subscription and Pricing
- Data Privacy

### Public/customer experience

- Landing Page
- Login
- Public Track
- Public Document
- Request Quote
- Formal Receipt and Receipt Page
- Privacy Policy
- About
- Getting Started
- Tier Limits

### Platform administration

- Companies
- Owners
- Leads
- Billing History
- Vouchers
- WhatsApp configuration

### Supporting capabilities

- Firebase
- Gemini/GenAI
- Charts
- XLSX
- Image utilities
- Storage
- Phone formatting for WhatsApp
- Workflow definitions and aesthetics
- Collar diagrams
- Size definitions
- Pagination
- Form input primitives

## 4. Observable Route Inventory

### Public and account routes

- `/`
- `/about`
- `/limits`
- `/login`
- `/track`
- `/request-quote`
- `/privacy`
- `/privacy-policy`
- `/pdpa`
- `/getting-started`
- `/feedback`
- `/change-credentials`

### Company routes

- `/dashboard`
- `/reminders`
- `/print-jobs`
- `/documents`
- `/document`
- `/customers`
- `/inventory`
- `/stock`
- `/finance`
- `/analytics`
- `/insight`
- `/defects`
- `/staff`
- `/notifications`
- `/profile`
- `/profile/edit`
- `/profile/business`
- `/profile/password`
- `/profile/pricing`
- `/profile/privacy`
- `/profile/receipt`
- `/ai-settings`
- `/subscription`

### Public company/document routes

- `/:slug`
- `/:slug/document`
- `/:slug/request-quote`

### Platform-administrator routes

- `/superadmin`
- `/superadmin/login`
- `/superadmin/companies`
- `/superadmin/owners`
- `/superadmin/leads`
- `/superadmin/billing-history`
- `/superadmin/vouchers`
- `/superadmin/notifications`
- `/superadmin/receipt`
- `/superadmin/whatsapp`

Observed deployment uses hash routing even though route definitions appear as normal paths. Direct server paths may return the marketing entry page instead of the requested authenticated screen.

## 5. Observable Data Collections

The public client bundle references these datastore collection names:

| Collection | Likely domain purpose | Confidence |
|---|---|---|
| `companies` | Tenant/company profile, subscription, configuration, AI usage | Public-bundle verified |
| `users` | User identity, company association, role | Public-bundle verified |
| `customers` | Customer/contact records | Public-bundle verified |
| `suppliers` | Supplier records | Public-bundle verified |
| `print_jobs` | Quotes, invoices, and production jobs | Public-bundle verified |
| `inventory` | Inventory master items | Public-bundle verified |
| `recipes` | BOM or automatic-deduction definitions | Public-bundle verified |
| `stock_logs` | Stock movement/audit records | Public-bundle verified |
| `stock_batches` | Lot/batch records | Public-bundle verified |
| `expenses` | Expense and transaction records | Public-bundle verified |
| `tasks` | Assigned tasks and quote-request follow-ups | Public-bundle verified |
| `customer_feedback` | Ratings, recommendations, comments, sentiment source data | Public-bundle verified |
| `billing_history` | Subscription payments and receipts | Public-bundle verified |
| `vouchers` | Subscription voucher records | Public-bundle verified |
| `ai_cache` | Cached AI results | Public-bundle verified |
| `ai_monthly_usage` | Aggregated monthly AI usage | Public-bundle verified |
| `ai_token_logs` | Per-operation AI usage/accounting records | Public-bundle verified |
| `deletion_audit` | Data/account deletion audit | Public-bundle verified |
| `health_check` | Service/data health indicator | Public-bundle verified |

### Design implication for LLL Print

The reference appears to combine quotation, invoice, and production concepts around print-job records. LLL Print should consider separate quote, invoice, and production tables with explicit links. Separation improves auditability, document versioning, and status validation.

## 6. Default Production Configuration

### 6.1 Equipment presets

| Category | Defaults visible in the public bundle |
|---|---|
| Printers | Printer 1, Printer 2, Printer 3 |
| Heaters | Heater 1, Heater 2 |
| Presses | Press A, Press B |
| DTF printers | DTF Printer 1, DTF Printer 2 |
| Embroidery machines | Tajima 1-Head, Brother 6-Needle, Barudan 4-Head |

### 6.2 Workflow presets

| Print method | Default ordered stages |
|---|---|
| Sublimation | Print → Heat → Cut → Sew → QC |
| DTF | Design → DTF Print → Powder & Cure → Heat Press → QC |
| Embroidery | Digitizing → Hooping → Embroidery Sew → Trim & Clean → QC |
| Silkscreen | Prep → Ink Mix → Screen Print → Cure → QC |
| Heat press | Print → Weed → Press → Peel → QC |
| Custom | Design → Prep → Production → Assembly → QC |

Business Settings also supports custom service/workflow creation. A visible new-service default uses Design, Printing, and Completed stages.

### 6.3 Apparel specification presets

#### Collar styles

- Roundneck
- V-Neck
- Insert Collar
- Polo
- Polo Retro
- Mandarin Hidden Button
- V-Neck Insert
- V-Neck Cross
- NBA Neck
- V-Neck No End

#### Pattern/cutting styles

- Standard
- Slim Fit
- Raglan
- Oversized
- Muslimah
- Kids
- Long Sleeve
- Sleeveless

### 6.4 Proof disclaimer behavior

A default proof note warns that actual product colour may differ from the mockup and asks the customer to verify the design and size list before printing begins. LLL Print should make legal/production disclaimers configurable per company and version them with each issued proof.

## 7. Subscription and Entitlement Matrix

The following values are visible in the current public bundle. They may change and should be treated as reference observations rather than proposed LLL Print pricing.

### 7.1 Quantitative limits

| Entitlement | Expired | Trial | Lite | Smart | Elite |
|---|---:|---:|---:|---:|---:|
| Jobs/month | 0 | 50 | 20 | 100 | 250 |
| Staff seats | 0 | 5 | 1 | 3 | 5 |
| AI credit allowance | 0 | 100,000 | 100,000 | 500,000 | 1,000,000 |
| AI WhatsApp messages | 0 | 99,999 | 99,999 | 99,999 | 99,999 |
| ProofFlow translations | 0 | 20 | 0 | 20 | 50 |
| OCR operations | 0 | 20 | 0 | 50 | 100 |
| Vision/order image scans | 0 | 10 | 0 | 0 | 50 |
| Feedback analyses | 0 | 10 | 0 | 10 | 25 |
| AI planning horizon | 0 days | 14 days | 0 days | 14 days | 30 days |
| Maximum jobs per plan | 0 | 20 | 0 | 20 | 50 |
| Configured model | Gemini 2.5 Flash Lite | Gemini 2.5 Flash Lite | Gemini 2.5 Flash Lite | Gemini 2.5 Flash Lite | Gemini 2.5 Flash Lite |

The value `99,999` appears to function as a practical “very high/unlimited” allowance rather than a typical customer-facing number.

### 7.2 Feature switches

| Capability | Trial | Lite | Smart | Elite |
|---|:---:|:---:|:---:|:---:|
| Analytics | Yes | No | Yes | Yes |
| Defect analysis | Yes | No | No | Yes |
| TrueStock forecasting | Yes | No | Yes | Yes |
| TrueCost estimation | Yes | No | Yes | Yes |
| WhatsApp features | Yes | Yes | Yes | Yes |
| ProofFlow translation | Yes | No | Yes | Yes |
| Feedback sentiment analysis | Yes | No | Yes | Yes |
| AI run planner | Yes | No | Yes | Yes |
| AI calibration | Yes | Yes | Yes | Yes |
| AI order-image OCR | Yes | No | No | Yes |
| AI rescue plan | Yes | No | No | Yes |
| AI reminder drafting | Yes | No | Yes | Yes |

### 7.3 Usage reset behavior

Visible client logic references monthly reset keys for:

- AI credits
- WhatsApp messages
- Proof translations
- OCR operations
- Feedback analyses

Several messages state that allowances renew on the first day of the next month.

### 7.4 Billing observations

- Billing records use `MYR`.
- An observable provider value is `Offline / Bank Transfer`.
- Billing history records include company, tier, amount, currency, provider, reference, status, and creation time.
- A platform administrator can adjust plan, expiry, usage, and billing history through observable administration modules.

## 8. Gemini Integration Catalogue

### 8.1 Model identifiers

The public application assets contain these identifiers:

- `gemini-2.5-flash-lite`
- `gemini-2.5-flash`
- `gemini-3.1-flash-lite`
- `gemini-3.5-flash-lite`
- `gemini-3.6-flash`

The entitlement configuration currently associates all normal tiers with `gemini-2.5-flash-lite`. Other identifiers may be fallback, migration, or forward-looking configuration. Their presence does not prove they are active or publicly available.

### 8.2 Observable AI operation identifiers

1. `ai_run_planner`
2. `bottleneck_analysis`
3. `defect_analysis`
4. `delay_apology`
5. `email_template`
6. `feedback_sentiment`
7. `inventory_doc_ocr`
8. `lead_email`
9. `proofflow_translation`
10. `receipt_ocr`
11. `rescue_plan`
12. `supplier_po_note`
13. `truecost_estimate`
14. `truestock_forecast`
15. `vision_order_import`
16. `whatsapp_reply`

### 8.3 AI behavior and required structured outputs

| Operation | Observable purpose | Required structured fields visible in bundle |
|---|---|---|
| AI run planner | Rank active jobs using urgency, material availability, batching, and horizon | `job_id`, `title`, `priority_score`, `rank`, `rationale`, `material_status`, `status_badge` |
| Bottleneck analysis | Identify delayed/queued stage and propose a capacity action | `bottleneck_stage`, `suggested_action`, `throughput_gain_est` |
| Defect analysis | Identify likely machine/human/material root cause and remedy | `root_cause`, `remedy_steps`, `impact_level` |
| Delay apology | Draft a short professional Bahasa Melayu WhatsApp apology | `whatsapp_text` |
| Feedback sentiment | Analyse customer feedback themes and urgency | `overall_sentiment`, `key_themes`, `top_issues`, `recommendations`, `strengths`, `priority_score` |
| Inventory document OCR | Extract product/material details from label, invoice, or shipping document | At minimum `item_name`; visible prompt also requests material, size, colour, quantity, and unit cost |
| ProofFlow translation | Convert artwork/proof feedback into technical production actions | `technical_summary`, `action_items` |
| Receipt OCR | Extract an expense from receipt image | `vendor`, `total_amount`, `date`, `category` |
| Rescue plan | Produce a three-step prioritized recovery plan | `headline`, `steps` |
| Supplier PO note | Draft supplier quotation and availability enquiry | `po_text` |
| TrueCost estimate | Estimate consumables, labour, electricity, and machine factors | `consumables_total`, `labor_time`, `hours`, `watts` plus other calculated context |
| TrueStock forecast | Forecast inventory depletion and action | `predicted_stockout_date`, `burn_rate_daily`, `recommendation` |
| Vision order import | Extract customer/order/item information from an uploaded image | `customer_name`, `title`, `items` |
| WhatsApp reply | Generate concise professional response content | Structured message fields are requested; exact schema should be verified at runtime |

### 8.4 Prompting characteristics

Visible system instructions position Gemini as:

- Malaysian print-shop manager
- Factory production director
- Production scheduling expert
- Production floor manager
- Manufacturing cost estimator
- Inventory analyst
- Purchasing manager
- Quality-control consultant
- Expense assistant
- Industrial inventory-document parser

Many calls request `application/json` with explicit response schemas. This is a strong design pattern for LLL Print: request structured results, validate the schema server-side, and require user confirmation before applying changes.

### 8.5 Observable AI usage accounting

The client references:

- Monthly aggregate usage
- Token logs
- Cache records
- Per-company counters
- Operation tags
- Plan feature checks
- Monthly allowance resets
- Administrative credit top-ups

LLL Print should place model invocation and usage enforcement behind its own backend. Provider API keys, entitlement decisions, and usage increments must not be trusted to browser code.

## 9. Print Job and Document Behavior

### 9.1 Print-job controls verified in the authenticated UI

- List/calendar toggle
- Search by job ID, customer, or title
- Status, print type, customer, and overdue filters
- Overdue, due-today, due-this-week, and on-track summaries
- Total-unit summary
- Tabs for All, Pending, Printing, Completed, and Cancelled
- New Job
- QR scan
- AI Run Plan
- WhatsApp notification
- Edit job
- Print jobsheet
- Upload proof
- More actions

### 9.2 New-job fields verified

- Customer
- Due date
- Title/reference
- Printing method
- Material
- Calculated quantity
- Print width, height, and coverage percentage
- Printer, heater, press, DTF printer, embroidery machine, and neck-tag assignments
- Pattern/cutting type
- Collar style
- Collar-tube artwork
- Care-tag/neck artwork
- Detailed item breakdown
- Excel/CSV or AI import
- Multi-variant mockup
- Print/vector layout
- Custom production stages
- Internal notes

### 9.3 Documents behavior

- Invoices and Quotations are tabs over document-like job records.
- Search supports document ID, customer, or job.
- Date filters include All Time, Today, Past 7 Days, and This Month.
- Invoice filters include Paid and Unpaid.
- Visible columns include document ID, date, customer, service, amount, status, and actions.
- Actions include WhatsApp, preview/print, paid/unpaid toggle, and additional menu.
- FlowSmart AI Import can populate document order specifications.

### 9.4 Quotation calculations

Observable quotation fields/calculation concepts include:

- Quantity
- Unit/base price
- Design fee
- Deposit amount and percentage
- Tax rate
- Per-unit add-ons
- Subtotal
- Tax total
- Grand total
- Balance

LLL Print should implement these with decimal-safe arithmetic and immutable issue versions rather than copying the reference data model.

## 10. Public Quote-Request Flow

The public quote request performs more than a passive contact submission.

Observable behavior indicates:

1. Customer details are collected or a customer is created.
2. WhatsApp consent and consent timestamp are recorded.
3. Pricing is calculated from selected print method, quantity, and add-ons.
4. A pending record marked as a quote is created.
5. Item breakdown and notes are stored.
6. A high-priority pending task is created for staff follow-up.
7. The follow-up due date is approximately one day after submission.
8. The UI displays subtotal, SST/tax, and grand total in RM.
9. The form communicates PDPA handling and WhatsApp use.

This is a valuable LLL Print requirement: public enquiries should enter an actionable internal queue rather than only send email.

## 11. Customer Tracking and Proof Flow

The public tracking module visibly supports:

- Order reference and current status
- Production-stage progress
- Customer-safe order details
- Artwork/mockup viewing
- Full-screen proof image
- Proof approval/revision interaction when enabled
- Invoice/balance context
- WhatsApp Updates button
- Share Track Link
- QR code for opening tracking on another device
- Privacy Policy and Malaysian PDPA messaging

The public link should be implemented using a high-entropy, revocable token. It must never expose internal cost, staff notes, provider keys, other customer data, or sequentially enumerable records.

## 12. Reminders and Recovery Workflows

Observable reminder types include:

- Job deadline/overdue alert
- Low-stock alert
- Pending proof approval

Actions visible or implied include:

- Search and filter reminders
- Card/table view
- Snooze/resolve state
- WhatsApp follow-up
- AI-generated delay apology
- Advance production stage
- Refresh alerts
- AI Rescue Plan
- Past rescue plans

The reminder engine ignores jobs already marked completed or cancelled when generating active deadline alerts.

## 13. Inventory and Stock Details

### Inventory master

- Categories include Shirt, Sublimation, Silkscreen, Embroidery, Heatpress, Other, and custom categories.
- Item fields include image, name, colour, size, material/fabric, quantity, low-stock threshold, cost per unit, and main supplier.
- Quick decrement/increment actions are present.
- QR asset tags and bin scanning are present.
- OCR can attempt to populate item data from a label or invoice image.
- BOM/recipes are presented as Auto-Deduct formulas.

### Stock intelligence

- Today’s inflow and outflow
- Active batches
- Ledger integrity percentage
- Audit Ledger
- Active Batches (FIFO)
- Material Burn and Forecast
- Search by item, reason, purchase-order number, lot, or SHA hash
- Adjustment and movement logging
- Excel export
- Visible marketing language for SHA-256 chained records and FIFO/LIFO lifespan

The exact cryptographic ledger construction and enforcement were not verified. LLL Print should first guarantee transactional immutable movements, permissions, reversals, and backups; a hash chain may be added as defence-in-depth.

## 14. Finance and Business Settings

### Finance modules visible

- Financial Summary
- Data Entry/Transactions
- Profit and Loss
- Balance Sheet
- Tax Summary (SST/GST)
- Cash Flow Statement
- Trial Balance
- Comprehensive Income
- Partner’s Equity
- Asset Depreciation
- Opening Balances

### Summary metrics visible

- Gross profit
- Administrative expense
- Net profit
- Estimated tax and zakat provision

### Business settings visible

- Company logo and registration details
- Address, phone, email, and website
- Public company slug
- Bank/payment details
- Billing/document information
- Registration/tax identifier
- Default SST/GST tax rate, with a visible default of 6% in current code paths
- Invoice footer/message
- Receipt information
- Pricing rules
- Production configuration
- Equipment lists
- Workflow configuration
- Apparel/collar configuration

The reference displays a wide accounting scope. LLL Print should not claim validated accounting statements until double-entry rules, chart of accounts, opening balances, period controls, and reports have been reviewed by a qualified accountant.

## 15. Analytics and Feedback

### Production analytics

- Day, Week, Month, Year, and Custom range
- Overdue impact
- Estimated loss
- Average lead time
- Current bottleneck/jam
- Redo impact
- Stage Execution Statistics
- Average Time per Stage
- Completion Time by Type

### Defect and waste analysis

- Defect quantity/rate
- Affected production stage
- Potential machine, human, or material root cause
- Technical remedies
- Impact level
- AI-assisted analysis on higher tiers

### Customer feedback

- Feedback list and filtering
- Rating and recommendation filters
- Sort controls
- AI sentiment view
- Overall sentiment
- Themes
- Issues
- Recommendations
- Strengths
- Urgency/priority score

Analytics should be derived from timestamped domain events rather than manually overwritten summary fields.

## 16. Platform Administration Observations

Observable administration capabilities include:

- Company list and management
- Owner list and management
- Lead management
- Billing history
- Voucher management
- Notifications
- Receipt processing
- WhatsApp-related configuration
- Subscription activation/expiry
- AI usage reset and credit top-up
- Company deletion across related collections

LLL Print platform administration must be isolated from company-owner authorization, require strong authentication, record reasons for support access, and audit every privileged change.

## 17. Differences LLL Print Should Intentionally Make

1. Use separate sales-document and production entities rather than overloading print-job records.
2. Use `Contacts`, `Items & BOM`, and `Stock Ledger` consistently.
3. Display MYR/RM consistently throughout Malaysian workspaces.
4. Use unambiguous Malaysian date formatting.
5. Keep mobile primary navigation to five destinations plus More.
6. Put all Gemini calls and entitlement enforcement behind a secure backend.
7. Treat AI results as drafts requiring authorized confirmation.
8. Use staff invitations instead of owner-assigned passwords.
9. Provide explicit chart dimensions and accessible textual alternatives.
10. Make trial/expiry notices compact and dismissible until urgency increases.
11. Implement immutable document versions, stock reversals, and proof decisions.
12. Validate LHDN/MyInvois and accounting behavior separately before marketing compliance.

## 18. Remaining Unknowns

The following cannot be established conclusively from public assets and read-only inspection:

- Firebase security rules and tenant-isolation enforcement
- Password hashing and server-side authentication design
- Exact Gemini API proxy/key handling at runtime
- Active Gemini model selected for every operation
- Actual token-to-credit conversion
- Retry, timeout, and fallback strategy for Gemini
- Exact PDF and XLSX layouts across all record types
- End-to-end WhatsApp provider behavior
- LHDN/MyInvois submission behavior, if any
- Payment gateway behavior, if any
- Complete accounting journal rules
- Stock hash-chain algorithm and validation authority
- Backup, disaster recovery, and data-retention operations
- Real performance and scaling characteristics
- Full platform-administrator access rules

Resolving these unknowns would require owner-provided technical documentation, authorized runtime network inspection, or controlled functional testing with temporary data.

## 19. Source-to-Requirement Implications

These observations support the following decisions already present in `LLL_PRINT_SRS.md`:

- Server-enforced company tenancy and RBAC
- Separate quote, invoice, payment, job, proof, stock, and audit entities
- Configurable workflows and equipment
- Public tracking with secure revocable tokens
- BOM preview before stock posting
- Immutable stock corrections through reversal
- Advisory, schema-validated AI operations
- Monthly entitlement accounting
- Malaysia-first localization
- Delayed implementation of full accounting and formal LHDN integration

This appendix should be treated as discovery evidence. The SRS remains the authoritative statement of what LLL Print shall implement.

## 20. Documents Module — Deep Dive (session update, 29 August 2026)

This section expands §9.3 with detail gathered from direct navigation of the authenticated Documents screen. No pricing figures, customer identities, or business branding are reproduced; only structure and behavior are recorded.

### 20.1 Document types and container model

- The Documents screen presents two tabs over what appears to be one underlying document/record type: **Invoices** and **Quotations**. This matches the earlier inference that quotes and invoices are not fully separate entities in the reference (§5 design implication). — Verified
- On the account inspected, only invoice-tagged records existed; the Quotations tab rendered an empty state ("no documents match filter") even with all filters cleared, so the quote→invoice transition itself could not be directly observed this session. — Verified (absence), Inferred (transition mechanics)
- Each document shares its identifier with a corresponding entry in the Print Jobs list (same short alphanumeric code appears in both screens). This is strong evidence that a document and its production job are the same backing record, or are created together and cross-referenced by a shared key, consistent with the `print_jobs` collection guess in §5. — Verified

### 20.2 Document list (table) fields

Columns observed: document ID, date, customer name, service/print-method tag, monetary amount, payment status badge, and a row-level actions cluster. — Verified

Row-level actions observed:

- Send via a messaging channel (WhatsApp-style deep link), consistent with §9.1/§11 patterns elsewhere in the app.
- Preview/print, which opens a rendered document view (see §20.3).
- A payment-status toggle action, which flips between a "mark paid" and "mark unpaid" verb depending on current state — i.e., payment status is a manually-toggled field, not visibly derived from a separate ledger/payment-record entity in the UI.
- One additional icon-only action per row (unlabeled in the accessibility tree; likely a delete or overflow menu based on placement/iconography, not confirmed by click). — Inferred

### 20.3 Rendered document (invoice) template — structural fields only

The preview/print view for an invoice-tagged document renders, top to bottom:

1. Business identity area (name), with a large "INVOICE" watermark-style label.
2. A document-number field and an issue-date field, right-aligned as a small metadata block.
3. A two-column block: "Bill To" (customer name + phone number) beside "Job Description" (job title/reference, service/print method, material).
4. A line-item table: description (with a sub-line for method/variant), quantity, unit price, line total.
5. A totals block: subtotal, a tax line labeled with both SST and GST plus the configured rate, grand total, a deposit-paid deduction line, and a balance-due line.
6. A closing courtesy line.

This structurally confirms the tax-rate and deposit concepts already listed in §9.4, and shows they render as explicit line items on the customer-facing document rather than being summarized only internally. — Verified

### 20.4 Document creation form ("New Quotation")

Triggered from a "Create Quote" action on the Documents screen (the same modal family is presumably reused for invoices, not separately confirmed). Fields observed, in order:

- Customer — a searchable picker with an inline "new customer" shortcut (create-on-the-fly contact, no separate screen navigation required).
- Service Type — a single-select tag (e.g., the print method).
- Job Title/Description — free text.
- Material — optional free text.
- Item Breakdown — a small table (variant, size, quantity, notes) with two import shortcuts: an AI-assisted import (same "FlowSmart" AI branding used for job-side AI import) and a spreadsheet (Excel/CSV) import.
- Total Quantity — appears auto-derived from the item breakdown but is presented as an editable field.
- Due Date — a date picker.
- A promoted "price recommender" call-to-action (AI-assisted pricing suggestion) sitting above the manual pricing fields, framed as calculating a recommended unit price from the business's own cost inputs (labor, consumables, overhead) rather than market pricing.
- Base Unit Price and Design/Setup Fee — manual currency fields.
- Deposit Amount and Deposit Percentage — presented as a linked pair (either can presumably drive the other; not confirmed by interaction).
- Tax Rate — pre-filled from a business-level default (observed default matches the 6% SST/GST default already noted in §14).
- Item Add-ons (per unit) — a repeatable row (label, quantity, price) for optional per-unit extras, distinct from the main item breakdown.
- A live-updating grand-total estimate summary.
- A single "Save Document" submit action.

No separate "status" selector (e.g., draft/sent/approved) is present anywhere in the creation form — status appears to be entirely a post-creation, list-level concept (payment toggle only), not an authored field. — Verified

### 20.5 Status/workflow observations

Two independent status dimensions were observed, tracked on what looks like the same or linked record:

- **Document-level status**: binary paid/unpaid, changed manually via the row toggle described in §20.2. No intermediate states (e.g., draft, sent, viewed, overdue-flagged) were visible in the Documents screen itself.
- **Job-level status**: the linked Print Jobs record carries its own multi-state status (pending/printing/completed/cancelled, per §9.1), independent of the document's paid/unpaid flag. A document can therefore be "paid" while its linked job is still "pending," and vice versa.

### 20.6 Filters and navigation summary

- Tabs: Invoices, Quotations.
- Global actions above the list: AI-assisted import and "Create Quote."
- A text search across document ID, customer, and job/title.
- A date-range filter (all time / today / past 7 days / this month) present on both tabs.
- A payment-status filter (any/paid/unpaid) present only on the Invoices tab — consistent with quotations not carrying a payment concept. — Verified

### 20.7 Design implication for LLL Print (reinforces §17)

The reference's choice to model quotation and invoice as the same underlying record with only a type/status distinction is now more directly evidenced (shared IDs across Documents and Print Jobs, no draft/sent/approved lifecycle field, status limited to a manual paid/unpaid flag). This strengthens the existing §17 recommendation to keep LLL Print's sales-document and production entities separate, and additionally suggests LLL Print should model an explicit quote status lifecycle (e.g., draft → sent → accepted/declined → converted-to-invoice) rather than reusing a single paid/unpaid flag across both document types.

## 21. Full-Application UX Pass (session update, 30 August 2026)

This section records a broader structural/UX pass across all 10 authenticated
nav sections, using an authorized trial account. No pricing figures, real
customer data, or branding assets are reproduced — only navigation structure,
screen composition, and interaction patterns. All records observed in this
session were test/placeholder data (e.g. "AI Test Customer," "AI TEST BOM
Material") rather than real business data. — Verified

### 21.1 Global navigation and layout

- Eight persistent nav sections: Dashboard, Reminders, Print Jobs, Documents,
  Customers (labelled "Contacts" in on-page headings), Inventory, Stock,
  Finance, Insight. — Verified
- A persistent trial-countdown banner ("Your subscription expires in...")
  renders above page content on every authenticated screen. — Verified
- A floating circular QR-code action button is pinned bottom-right on most
  list screens (Dashboard, Print Jobs, Documents, Customers, Inventory,
  Stock, Reminders), suggesting QR scanning is a cross-cutting action rather
  than a single-page feature. — Verified
- Mobile bottom navigation is limited to 5 icons (Dashboard, Reminders, Print
  Jobs, Documents, Customers); remaining sections are presumably reached via
  a hamburger/menu control not confirmed by click in this session. — Verified
  (5-icon bar), Inferred (remaining-sections access path)

### 21.2 Dashboard composition

- A "Store Overview" heading with Day/Week/Month/Year/Custom range tabs. — Verified
- Two promoted AI feature cards precede the plain stat tiles: a "Smart
  Reorder Reminders" panel (stock-optimization messaging) and a "FlowSmart AI
  Run Planner" panel that lists ranked jobs with a numeric score, a
  qualitative tag (e.g. "Quick Win," "Material Risk"), and a material-
  availability indicator. — Verified
- Below the AI cards: four plain stat tiles (Low Stock Items, Pending
  Feedback, Active Printing, Completed), then a "Today's Production Agenda"
  list further down the page. — Verified

### 21.3 Print Jobs

- Search plus four filter controls: status, print type, customer, and an
  "Overdue Only" toggle. — Verified
- Four summary counters (Overdue, Due Today, This Week, On Track) sit above a
  unit-count chip and status-tab row (All/Pending/Printing/Completed/
  Cancelled). — Verified
- A "Scan QR" action sits beside "New Job" in the primary action row,
  distinct from the floating QR button — indicating QR scanning is used
  during production workflow, not only for customer-facing tracking. — Verified

### 21.4 Documents

- Confirms §20's structural finding directly: Invoices and Quotations render
  as tabs over one list component, with a single "Create Quote" primary
  action and a separate "FlowSmart AI Import" action. — Verified
- List columns match §20.2 (doc ID, date, customer, service, amount, status,
  actions) with a chat-style icon, a document icon, and a currency/payment
  icon as per-row actions. — Verified

### 21.5 Customers (Contacts)

- Two sub-tabs: Customers and Suppliers. — Verified
- Each customer card shows a WhatsApp-verification badge ("✓ WA") alongside
  name, phone, and optional email, plus a free-text note field visible on
  the card itself (used in this account for internal test annotations). — Verified
- Grid/list view toggle present. — Verified

### 21.6 Inventory

- Labelled on-page as "Inventory & Production," with a mode toggle between
  "Stock Items" and "Auto-Deduct (BOM)" — BOM/recipe configuration is a
  distinct mode selection, not a secondary tab or modal off the main list. — Verified
- Category filter row (All Categories, Shirt, Sublimation, Silkscreen,
  Embroidery, Heatpress, Other) matches the category set already listed in
  §13. — Verified
- A "Scan Bin" action is distinct from the floating QR button, implying
  QR/bin scanning is a first-class inventory action. — Verified

### 21.7 Stock

- Branded on-page as "Stock Intelligence & Ledger" / "TrueStock™," with
  strong trust/audit-focused UI copy: "Cryptographic SHA-256 Ledger,"
  "Ledger Integrity 100% Chained," and a banner reading "Chained SHA-256
  Ledger Active — Every transaction logs a parent hash and cryptographic
  signature to prevent tampering or untracked shrinkage." — Verified (UI
  copy), Unverified (actual cryptographic construction, per §18)
- Four stat tiles (Today's Inflow, Today's Outflow, Active Batches, Ledger
  Integrity) sit above three secondary views (Audit Ledger, Active Batches
  FIFO, Material Burn & Forecast) and a filterable movement list showing a
  truncated hash per entry. — Verified

### 21.8 Finance

- Labelled "Finance & Accounting — Full Suite," with four headline stat
  tiles (Gross Profit, Admin Expenses, Net Profit, Tax & Zakat estimate)
  followed by a grid of ten report shortcuts: Financial Summary, Data Entry/
  Transactions, Profit & Loss, Balance Sheet, Tax Summary (SST/GST), Cash
  Flow Statement, Trial Balance, Comprehensive Income, Partner's Equity, and
  Asset Depreciation. — Verified
- This is a substantially larger accounting surface than anything in LLL
  Print's current MVP scope; treat as a scale/scope warning, not a target to
  match early. — Inferred (design implication)

### 21.9 Reminders

- A dedicated "Smart Reminders & Action Center" screen, separate from the
  Dashboard's own action-centre card, with four counters (Total Alerts,
  Overdue Jobs, Low Stock, Pending Proofs) and filter tabs (All Reminders,
  Job Deadlines, Stock Alerts, Proof Follow-ups). — Verified
- An "AI Rescue Plan" action and a "Past Plans" counter are present on this
  screen specifically (distinct from the Dashboard's AI Run Planner). — Verified

### 21.10 Notifications

- A minimal screen: one prompt card to "Enable Background Alerts" (opt-in
  browser/device notifications for stock and job-completion events) and a
  plain notification feed below, empty in this session. — Verified

### 21.11 Design implications for LLL Print

1. The floating QR action and the separate in-context "Scan QR"/"Scan Bin"
   actions suggest QR usage is broader than customer tracking alone — LLL
   Print's confirmed future QR goal (customer status tracking) could later
   extend to a staff-facing scan action for production/inventory, but this
   remains out of scope for the current phase per `PRODUCT_VISION.md`.
2. The Reminders screen being separate from the Dashboard action centre (two
   related but distinct surfaces) is a reasonable pattern to reuse: a
   glanceable Dashboard summary plus a dedicated, filterable action screen.
3. The Finance module's scope (full accounting suite) reinforces the
   existing SPMP exclusion of accounting/compliance claims for Phase 1A —
   LLL Print should not expand Finance beyond the confirmed MVP order without
   a separate Product Owner decision.
4. The WhatsApp-verified badge on customer cards is a small, low-cost pattern
   directly relevant to LLL Print's core problem (chat-based order intake)
   and worth considering when the quotation/customer screens are designed.

## 22. Full Order-Lifecycle Black-Box Test (session update, 30 August 2026)

This section records an authorized, interactive black-box test of one
complete order lifecycle (create quotation → convert to job → run production
stages → auto-invoice → check stock impact), using a realistic but fictional
test customer and order created for this purpose. No real customer, pricing,
or business data was used or affected. All actions below were performed
directly in the authenticated trial account. — Verified

### 22.1 Quotation creation flow

- The "New Quotation" modal is a single scrollable form (not a multi-step
  wizard): Customer → Service Type → Job Title/Description → Material →
  Item Breakdown → Total Quantity/Due Date → TrueCost recommender → Base
  Unit Price/Design Fee/Deposit/Tax Rate → Item Add-ons → Grand Total → Save.
  — Verified
- "New Customer" opens as a small nested modal (Name, Phone with a fixed
  `+60` prefix, optional Email) and returns directly to the quotation form
  with the new customer pre-selected on save. — Verified

### 22.2 Item-breakdown commit behavior (notable UX finding)

- Typing values directly into the inline Variant/Size/Qty/Notes row is
  **not sufficient** to register the item. The row must be explicitly
  confirmed via its adjacent `+` button; only after that does it appear as a
  committed line (with its own delete/× control) and does "Total Quantity"
  update to match. — Verified
- Before that confirmation step, "Total Quantity" silently remains at its
  default of `1`, and the Grand Total is calculated for quantity 1 (observed:
  a filled-in row showing "30" produced a grand total based on qty 1 until
  the `+` button was clicked, after which the same inputs produced the
  correct qty-30 total). — Verified
- **Design implication for LLL Print:** this is an easy real-world mistake —
  a staff member could fill in an item row, not notice the missing
  confirmation step, and send a quotation priced for 1 unit instead of the
  intended quantity. LLL Print's own quotation form should either commit a
  row automatically as soon as its fields are filled (no separate confirm
  step), or make the uncommitted/"draft" state visually obvious and block
  save until every row is confirmed.

### 22.3 Quotation → Job conversion

- Saving a quotation places it under the Documents → Quotations tab with its
  own status distinct from invoice paid/unpaid (observed value: `PENDING`).
  This refines §20.5, which — based on a static pass with no live quotation
  present — inferred quotations might carry no independent status; a
  `PENDING` status is in fact shown once one exists. — Verified
- A green circular action icon on the quotation row (distinct from the
  chat/document-preview icons) converts the quotation directly into a Print
  Job: the record disappears entirely from the Quotations list (not just
  re-tagged) and appears immediately in Print Jobs under the same short ID,
  with the job's initial status `PENDING` and no separate "approved" or
  "converted" intermediate state exposed in the UI. — Verified

### 22.4 Production-stage execution

- Each job's production stages (per the Sublimation preset: Print → Heat →
  Cut → Sew → QC, confirmed matching §6.2) are advanced one at a time via a
  two-step **Start → Finish** action per stage, not a single toggle. A stage
  must be started (button becomes "Finish") before it can be finished; the
  next stage's "Start" button only activates after the previous stage is
  finished. — Verified
- Each finished stage shows a green checkmark and a "Re-open (Redo)" link,
  confirming stages remain individually reversible after completion rather
  than being a one-way, locked history. — Verified
- Stage transitions are asynchronous with a brief processing delay (roughly
  1–2 seconds) during which the action button is unresponsive; clicking the
  same coordinate again immediately (e.g. to rapid-fire Start then Finish)
  can miss the button entirely while it is mid-transition. — Verified
  (observed via this session's own retries)
- Finishing the final stage (QC) immediately: (a) marked the job
  `Completed` in the Print Jobs list, and (b) triggered a toast reading
  "Order Completed!". — Verified

### 22.5 Automatic quotation-to-invoice conversion (notable finding)

- Completing a job's final production stage automatically converts its
  linked quotation into an invoice under the same document ID — this is
  not a manual "generate invoice" action anywhere in the UI. Observed:
  document `#VWQQIU` moved from Quotations (status `PENDING`) to Invoices
  (status `DUE $911.60`) at the exact moment the linked job's QC stage was
  finished, with no intermediate user action on the Documents screen.
  — Verified
- This means, in the reference product, "job production complete" and
  "billable" are the same event — there is no separate step for deciding
  when to bill a customer relative to production completion.
- **Design implication for LLL Print:** this coupling may not fit every
  print-shop workflow (e.g. a shop that bills on deposit before production,
  or bills separately from completion). LLL Print should treat "convert
  quote to job," "advance production," and "issue invoice" as distinct,
  independently-triggerable decisions rather than assuming completion always
  means "ready to invoice," while still offering the reference's automatic
  behavior as one configurable option.

### 22.6 Stock impact of job completion

- Completing the test job produced **no stock ledger movement**, because no
  BOM/recipe (Auto-Deduct formula, per §13/§21.6) existed linking the job's
  free-text material ("Round neck tee" / "Cotton combed 24s") to any
  Inventory item. This confirms stock auto-deduction is driven by an
  explicit BOM/recipe configuration, not by matching or parsing the job's
  free-text material/description fields. — Verified
- **Design implication for LLL Print:** free-text material fields on a
  quotation/job should be treated as descriptive only; automatic stock
  consumption should require an explicit, structured link to a real
  inventory item/BOM, never inferred from text.

### 22.7 Summary of the confirmed end-to-end flow

```text
New Quotation (form, item rows must be "+" confirmed)
  → Save → appears in Documents ▸ Quotations, status PENDING
  → (convert action) → becomes a Print Job, same ID, status PENDING
  → Start/Finish each production stage in sequence (reversible via Re-open)
  → Finishing the last stage: job → Completed, toast "Order Completed!"
  → same document ID simultaneously appears in Documents ▸ Invoices,
    status DUE $<grand total> (no manual invoicing step)
  → stock ledger only changes if a BOM/recipe was explicitly configured
    for the items involved (not automatic from free text)
```

## 23. Additional Feature Black-Box Tests (session update, 30 August 2026)

This section covers interactive tests of the remaining major features not yet
exercised: the AI Run Planner, the QR/Lens scanners, invoice payment marking,
staff assignment, delivery marking, the public order-tracking page, and the
AI Rescue Plan. All actions were performed in the authenticated trial account
or its public-facing pages; no real customer or business data was affected.

### 23.1 FlowSmart AI Run Planner — live behavior confirmed

- Clicking "AI Run Plan" opens a right-side panel ("FlowSmart AI Planner")
  showing a purpose line and a "Recommended Run Order" list, each entry
  carrying a 0–10 score, a short tag (`QUICK WIN`, `MATERIAL RISK`, `STOCK:
  AVAILABLE`, `STOCK: SHORTAGE`), and a one-sentence rationale. — Verified
- "Regenerate AI Plan" triggers a real, live model call (toast: "AI sequence
  recommendations generated successfully!" after a multi-second delay,
  consistent with an actual API round-trip rather than a canned response).
  — Verified
- The plan only included the two still-open, non-completed jobs with
  material/quantity data; the newly completed "Raya Family Tees 2026" job did
  not appear, confirming the planner scopes itself to active/pending work
  only. — Verified

### 23.2 QR/Lens scanners — two distinct features, both camera-gated

- "Scan QR" on Print Jobs opens a dark-themed overlay titled **"Lens: Job
  Identifier — Automated Workflow v2.5"**, with a "Quick Production Mode"
  toggle ("Scan to advance stage instantly") and a fallback "Upload Image"
  path. This is visually a completely different design language (dark,
  futuristic) from the rest of the light/purple application shell. — Verified
- The floating circular QR button (present on most list screens) opens a
  separate overlay, **"Global Lens — Universal Scanner"**, described as
  locating "asset or job" from a scanned code — a general-purpose lookup,
  distinct from the per-job scanner above. — Verified
- In this automated browser environment, camera hardware access was denied
  for both, surfacing "Hardware Access Restricted" / "Access Denied" states
  with a retry option; this is a graceful fallback, not a crash, in itself.
  — Verified

### 23.3 Reproducible crash on closing a Lens overlay (defect)

- On two separate occasions in this session, closing a camera-access-denied
  Lens/Scanner overlay (via its close control or a "Return to Jobs" button)
  led to the entire application crashing to a generic error boundary
  screen reading "Something went wrong — An unexpected error occurred in
  the application... Unknown error", requiring "Reload Application". No
  specific error detail was surfaced beyond "Unknown error". — Verified
  (reproduced twice)
- **Design implication for LLL Print:** a denied hardware permission (camera,
  in this case) must never be allowed to crash the whole application shell.
  Camera/hardware-access failures should be caught and contained to the
  feature that requested them, with a specific, honest error message —
  never a generic "unknown error" full-page crash.

### 23.4 Marking an invoice paid — no confirmation step

- Clicking the green `$` action on an invoice row (e.g. the $911.60 invoice
  created earlier in this session) instantly flips its status from `DUE
  $911.60` to `PAID`, with no confirmation dialog, no payment amount/method/
  date entry, and no partial-payment option exposed at this control. — Verified
- **Design implication for LLL Print:** per the architecture research
  (§ database design, `PAYMENT` entity), real payments should be recorded as
  their own transactional records (amount, method, date, reference) rather
  than a single boolean flip with no confirmation — this reference behavior
  should not be copied as-is.

### 23.5 Staff assignment — per-stage, but only one account existed

- The job card's "..." menu exposes: Assign Staff, Mark as Delivered, Cancel
  Job, Restart Job, and Delete Job from Database. — Verified
- "Assign Staff" opens "Assign Production Staff": a Target Production Stage
  dropdown (Print/Heat/Cut/Sew/QC/General Production) and an Assign To Staff
  dropdown. Only one staff account existed in this trial ("Administrator
  (owner)"), so multi-staff assignment behavior could not be directly
  observed, but the presence of this feature confirms per-stage task
  assignment is a real, intended capability, not merely a company-wide
  owner/staff split. — Verified (feature exists), Unverified (multi-staff
  behavior)

### 23.6 "Mark as Delivered" — a hidden status

- Selecting "Mark as Delivered" produced a confirmation toast ("Marked as
  Delivered") but caused **no visible change** to the job's status badge in
  the Print Jobs list (it remained `COMPLETED`). This suggests delivery is
  tracked as separate metadata not surfaced in the main list view. — Verified
- **Design implication for LLL Print:** if delivery status matters to your
  workflow (and it plausibly does, given customers picking up or receiving
  printed goods), make it a visible, filterable status — don't bury it as
  silent metadata behind a toast notification only.

### 23.7 Public order-tracking page

- The public, unauthenticated route `/#/track` renders a standalone "Track
  Your Order" page (separate branding header, "Powered by NZPrintFlow"
  footer, PDPA/Privacy Policy links) with a single Job ID input. — Verified
- Entering the actual internal document ID shown in the authenticated app
  (`VWQQIU`) returned "Order not found. Please check your ID." This confirms
  the public tracking identifier is **not** the same as the internal document
  ID visible to staff — a separate, non-guessable token is required, which
  could not be obtained without an explicit "share" action this session did
  not locate. — Verified (lookup failure), Inferred (separate-token design)
- **Design implication for LLL Print:** this is a good pattern to copy
  deliberately — never let the customer-facing tracking identifier be the
  same short ID staff see and use internally, to avoid casual guessing/
  enumeration of other customers' orders.

### 23.8 AI Rescue Plan — confident output not grounded in real data

- With zero overdue jobs, zero low-stock items, and zero pending proofs in
  this account (confirmed by the Reminders screen's own "All Clear" state),
  triggering "AI Rescue Plan" still produced a fully-formed "Proactive
  Preventive Maintenance and Capacity Optimization Plan" with three specific
  action items — including named equipment brands ("Heidelberg and Komori
  presses") and a named location ("Klang Valley warehouse") that have no
  connection to any data visible in this test account. — Verified
- **Design implication for LLL Print (important):** this is a hallucination
  risk. An AI feature should not fabricate specific, confident-sounding
  details (equipment names, locations, quantities) when the underlying data
  is empty or insufficient — it should either say there is nothing to act on,
  or clearly mark generic/example guidance as such. LLL Print's own advisory-
  AI features (per §8.4/§17.7 — schema-validated, user-confirmed) should be
  designed to refuse or flag low-confidence output rather than always
  returning a polished-looking plan.

### 23.9 Summary table of this session's defect/design findings

| # | Finding | Severity for LLL Print design |
|---|---|---|
| 1 | Item-breakdown rows need an unlabeled "+" confirm or price silently defaults to qty 1 | High — direct mis-billing risk |
| 2 | Job completion auto-creates a due invoice with no separate step | Medium — may not fit all billing workflows |
| 3 | Stock only deducts with an explicit BOM link, never from free text | Low — confirms a design principle to keep |
| 4 | Closing a camera-denied Lens overlay crashes the whole app | High — robustness/reliability defect |
| 5 | Marking an invoice paid has no confirmation or payment detail entry | Medium — real-money action with no safeguard |
| 6 | "Mark as Delivered" changes nothing visible in the job list | Low — a UX/visibility gap, not a hard defect |
| 7 | Public tracking correctly uses a separate token from the internal ID | N/A — good practice, worth copying |
| 8 | AI Rescue Plan fabricates specific detail from empty data | High — trust/accuracy risk for any AI feature |

