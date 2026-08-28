# MZPrintFlow

An original print-shop operations application scaffold derived from black-box product requirements—not from third-party source code or proprietary assets.

## Current scaffold

- Responsive desktop sidebar and six-item mobile navigation
- Dashboard with production metrics and action centre
- Searchable/filterable print-job table
- Documents workspace
- Customer and supplier contacts
- Inventory Items & BOM workspace
- Auditable stock-movement ledger
- Operational finance overview in MYR
- Production insights
- Typed domain models and realistic mock data
- Malaysian date and currency formatting

This is a frontend-only clickable MVP. Login, navigation, job search and filtering, record-creation dialogs, job detail/progress, and settings feedback are interactive. New demo records are stored in browser memory and reset after the page is refreshed.

## Run locally

```powershell
npm install
npm run dev
```

Production verification:

```powershell
npm run build
```

## Structure

```text
src/
  data/mockData.ts       Development fixtures
  domain/models.ts       Core TypeScript entities
  App.tsx                Responsive application and module views
  App.css                Original design system and responsive styles
docs/
  MZPRINTFLOW_SYSTEM_BLUEPRINT.md
  MZPRINTFLOW_SRS.md
  REFERENCE_TECHNICAL_OBSERVATIONS.md
  SUPERVISOR_DEMO_GUIDE.md
```

## Recommended next implementation stage

1. Add URL routing and production authentication.
2. Add company tenancy and owner/staff roles.
3. Replace in-memory demo data with a transactional API and database.
4. Add production-grade validation and file handling.
5. Implement persistent workflow-stage events and stock movements.
6. Add tests before introducing OCR, AI, WhatsApp, or accounting features.

See the product blueprint in `docs/` for the complete domain, workflow, security, and phased-delivery specification.
