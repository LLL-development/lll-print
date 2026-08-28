# MZPrintFlow Clickable MVP — Supervisor Demo Guide

## Purpose

This prototype demonstrates the proposed MZPrintFlow information architecture, interface direction, and core user journey before backend development begins.

It is a frontend mock application. Records created during the demonstration are stored temporarily in browser memory and reset when the page is refreshed.

## Start the Prototype

```powershell
cd C:\dev\MZPrintFlow
npm run dev
```

Open the local address printed by Vite, normally `http://localhost:5173`.

## Demo Login

The login form is prefilled for demonstration:

- Email: `owner@mzprintflow.demo`
- Password: `prototype`

The login is simulated and does not connect to a real authentication service.

## Recommended Presentation Flow

### 1. Login and product positioning

- Show the original MZPrintFlow identity.
- Explain that the product is designed for Malaysian printing operations.
- Point out MYR currency and Malaysian date formatting.
- Enter the demo workspace.

### 2. Dashboard

- Explain the active-job, due-date, stock-risk, and completion metrics.
- Show the live production stages.
- Show the action centre for proof, stock, and payment issues.
- Click a production job to open its detail drawer.

### 3. Job production detail

- Review customer, method, quantity, and due date.
- Explain the production timeline: artwork, material preparation, printing, finishing, and QC.
- Click **Advance stage** to demonstrate simulated operational feedback.

### 4. Create a print job

- Open **New print job**.
- Select a customer and method.
- Enter a title, quantity, and due date.
- Explain the default workflow preview.
- Submit and show the new job at the top of the Print Jobs screen.

### 5. Search and filter jobs

- Search by job title or customer.
- Filter by Pending, In Production, Quality Check, or Completed.
- Open a job from the table.

### 6. Documents

- Open Documents.
- Explain invoice and quotation separation.
- Create a quotation draft using customer, quantity, price, and deposit fields.
- Point out consistent MYR formatting.

### 7. Contacts

- Show combined customers and suppliers.
- Add a temporary contact.
- Explain how contacts will connect to quotes, jobs, invoices, and communications.

### 8. Items, BOM, and stock

- Show healthy and low-stock states.
- Add a temporary inventory item.
- Open Stock Ledger and show receipts and job consumption.
- Log a simulated stock movement.
- Explain that the production system will use immutable movements and reversals.

### 9. Finance and insights

- Show MYR revenue, cost, receivables, and gross profit.
- Explain that MVP finance is operational and not yet a complete accounting package.
- Show lead time, first-pass quality, and completion trends.

### 10. Settings and mobile layout

- Show business, currency, invoice-prefix, tax, and payment-term settings.
- Resize the browser to demonstrate the six-item mobile navigation.
- Explain that later modules are grouped under **More** instead of overflowing the screen.

## Prototype Coverage

| Screen or flow | Prototype state |
|---|---|
| Login | Clickable simulation |
| Dashboard | Interactive navigation and job opening |
| Print-job list | Searchable and filterable |
| New print job | Creates an in-memory record |
| Job production detail | Clickable stage simulation |
| Documents | Invoice list and quotation form |
| Contacts | Creates an in-memory contact |
| Items & BOM | Creates an in-memory inventory item |
| Stock ledger | Movement form simulation |
| Finance | Visual mock with MYR values |
| Insights | Visual production metrics |
| Settings | Editable mock form and save feedback |
| Mobile layout | Responsive navigation and dialogs |

## Explicit Prototype Limitations

- No production authentication or authorization
- No backend API or database
- No persistent records after refresh
- No real PDF, Excel, QR, WhatsApp, email, payment, OCR, AI, or LHDN integration
- No accounting or compliance certification
- No production file upload/storage

These limitations are deliberate. The prototype is intended to validate screens, terminology, navigation, and workflow before backend implementation.

## Supervisor Review Questions

1. Are the proposed modules and navigation understandable?
2. Does the create-job flow capture the correct minimum information?
3. Are the production stages appropriate for the target print business?
4. Should Customers and Suppliers remain under one Contacts module?
5. Is the distinction between Items & BOM and Stock Ledger clear?
6. Which screens are mandatory for the first implemented release?
7. Are there required reports or approval steps missing from the prototype?

