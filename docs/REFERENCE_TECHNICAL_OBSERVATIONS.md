# Reference Platform — Extended Technical and Product Observations

**Reference reviewed:** `https://www.nzprintflow.my/`  
**Collection date:** 27 August 2026  
**Method:** Authorized black-box browser inspection and analysis of publicly delivered client assets  
**Purpose:** Capture additional observable information useful when designing MZPrintFlow

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

### Design implication for MZPrintFlow

The reference appears to combine quotation, invoice, and production concepts around print-job records. MZPrintFlow should consider separate quote, invoice, and production tables with explicit links. Separation improves auditability, document versioning, and status validation.

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

A default proof note warns that actual product colour may differ from the mockup and asks the customer to verify the design and size list before printing begins. MZPrintFlow should make legal/production disclaimers configurable per company and version them with each issued proof.

## 7. Subscription and Entitlement Matrix

The following values are visible in the current public bundle. They may change and should be treated as reference observations rather than proposed MZPrintFlow pricing.

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

Many calls request `application/json` with explicit response schemas. This is a strong design pattern for MZPrintFlow: request structured results, validate the schema server-side, and require user confirmation before applying changes.

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

MZPrintFlow should place model invocation and usage enforcement behind its own backend. Provider API keys, entitlement decisions, and usage increments must not be trusted to browser code.

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

MZPrintFlow should implement these with decimal-safe arithmetic and immutable issue versions rather than copying the reference data model.

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

This is a valuable MZPrintFlow requirement: public enquiries should enter an actionable internal queue rather than only send email.

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

The exact cryptographic ledger construction and enforcement were not verified. MZPrintFlow should first guarantee transactional immutable movements, permissions, reversals, and backups; a hash chain may be added as defence-in-depth.

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

The reference displays a wide accounting scope. MZPrintFlow should not claim validated accounting statements until double-entry rules, chart of accounts, opening balances, period controls, and reports have been reviewed by a qualified accountant.

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

MZPrintFlow platform administration must be isolated from company-owner authorization, require strong authentication, record reasons for support access, and audit every privileged change.

## 17. Differences MZPrintFlow Should Intentionally Make

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

These observations support the following decisions already present in `MZPRINTFLOW_SRS.md`:

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

This appendix should be treated as discovery evidence. The SRS remains the authoritative statement of what MZPrintFlow shall implement.

