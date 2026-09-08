# LLL Print

LLL Print is a frontend foundation for a Malaysian print-shop operations
workspace. It brings quotations, production jobs, contacts, inventory, stock,
and finance views into one responsive interface for office and factory-floor
use.

The application currently uses local mock data. It has no production backend,
login, database, or external integration.

## Technology stack

| Area | Technology |
|---|---|
| Framework | React 19 |
| Language | TypeScript |
| Build tool | Vite |
| Routing | React Router |
| Client data foundation | TanStack Query |
| Tests | Vitest and Testing Library |
| Linting | Oxlint |

## Prerequisites

- A current Node.js LTS release
- npm

## Local development

```powershell
# Install the locked project dependencies
npm ci

# Start the development server
npm run dev

# Create a production build
npm run build

# Run automated tests
npm run test

# Run linting
npm run lint

# Preview a production build locally
npm run preview
```

## Current capabilities

- Responsive desktop sidebar and mobile navigation
- Dashboard with production metrics and action centre
- Searchable and filterable print-job table
- Quotation and invoice workspace
- Customer and supplier contacts
- Inventory, BOM, and stock-ledger views
- Finance and production-insight views in MYR
- Malaysian date and currency formatting
- Typed domain models and development fixtures

## Project structure

```text
src/
  app/                    Application router, route table, query provider
  components/layout/      Shared application shell and layout
  data/                   Development fixtures
  domain/                 Core TypeScript models
  lib/                    Shared formatters and unit tests
  test/                   Test environment setup
  App.tsx                 Application composition root
  PrototypeApp.tsx        Interactive frontend views
  App.css                 Application design system and responsive styles
  index.css               Global styles
docs/
  SPMP.md                 Project plan and current phase scope
  SRS.md                  Product context, v1 scope, and requirements
  SDD.md                  Design intent derived from the SRS
```

## Documentation and scope

The current documents are Draft:

- [`docs/SPMP.md`](docs/SPMP.md) — project plan and phase scope
- [`docs/SRS.md`](docs/SRS.md) — product context, requirements, and
  acceptance checks
- [`docs/SDD.md`](docs/SDD.md) — architecture and data-design intent

Backend services, authentication, a database, AI, messaging, payment
integration, and permission enforcement are deferred to separately authorized
future phases.

## License

Private. All rights reserved.
