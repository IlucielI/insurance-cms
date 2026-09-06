# Insurance CMS

Insurance Policy Backoffice & Underwriting Management Portal for the technical assessment.

## Scope

This CMS provides administrative and underwriting capabilities integrated with `insurance-core-api`:

- **Executive Underwriting Dashboard**: Live portfolio metrics, underwriting throughput, SLA monitors, and Top 3 premium volume contributors.
- **Underwriting Queue & Workbench**: 4-Pillar compliance evaluation (Identity Dukcapil, Income/DSR, Legal Documents, Medical Screening) with Manual Override authorization.
- **Underwriting Action Modals**: Streamlined workflows for approving & issuing policies (e-Sign, PDF 28 hal), requesting additional documents (RFI checklist, email notification), and formal rejections.
- **Product Management & Pricing Engine**: Product catalog administration, actuarial age multiplier matrix, risk loading rules, and calculation sandbox.
- **Knowledge Base AI & pgvector RAG**: Policy document ingestion pipeline (OCR -> 512-token chunks -> 1536-dim embeddings -> pgvector sync) and vector retrieval assistant.
- **System Health & Audit Trail**: Real-time Go Fiber Core API telemetry, PostgreSQL pool monitoring, and underwriter compliance logs.

## Architecture

The project is structured with strict separation of concerns combining **Clean Architecture** on the server layer and **Atomic Design** on the frontend UI:

### 1. Server Core (`src/server/`)

Layered architecture following SOLID principles:

- `controllers`: HTTP request/response handlers with status code mappings and response serialization.
- `services`: Business logic, use cases, and Go-compatible duration formatting.
- `repositories`: Data access contracts (`system.repository.interface.ts`) and concrete implementations (`system.repository.ts`).
- `di`: Centralized Dependency Injection (DI) assembly and service registry (`registry.ts`).
- `dtos`: Strongly-typed Data Transfer Objects defining API contracts (`health.dto.ts`).

### 2. Frontend Atomic Design (`src/components/`)

Component hierarchy following Brad Frost's Atomic Design methodology:

- `atoms`: Fundamental UI building blocks (`Badge`, `Button`, `StatusDot`).
- `molecules`: Combinations of atoms acting as a unit (`Breadcrumb`, `SearchInput`, `StatusPill`, `UserChip`).
- `organisms`: Distinct UI sections composed of molecules and atoms (`Topbar`, `Sidebar`).
- `templates`: Page-level layout skeletons (`CMSLayout`).

## Prerequisites

For local Node.js development:

- Node.js 20.x or newer
- npm 10.x or newer

For Docker development:

- Docker
- Docker Compose

## Environment Setup

Create a local environment file before running the app:

```bash
cp .env.example .env
```

Default values:

```env
APP_NAME=insurance-cms
APP_ENV=development
APP_VERSION=0.1.0
GIT_HASH=dev
PORT=3000

# Backend Core API Integration
NEXT_PUBLIC_CORE_API_URL=http://localhost:8080
CORE_API_INTERNAL_URL=http://insurance-core-api:8080

# Next.js Telemetry
NEXT_TELEMETRY_DISABLED=1
```

`APP_VERSION` and `GIT_HASH` can be injected during Docker build via `--build-arg`. Remove them from `.env` if you want build-time metadata to be used instead of runtime overrides.

## Directory Structure

```text
insurance-cms/
├── .dockerignore
├── .env.example
├── .gitignore
├── README.md
├── next.config.ts                     # Standalone production output enabled
├── package.json
├── tsconfig.json
│
├── deployment/                        # Multi-stage, multi-dockerfile setup
│   ├── Dockerfile.base                # Pre-installs npm dependencies (node:20-alpine)
│   ├── Dockerfile                     # Builder & minimal standalone runner
│   ├── build-base.sh                  # Build script: insurance-cms-base:latest
│   ├── build-cms.sh                   # Build script: insurance-cms:latest
│   ├── docker-compose.yaml            # Docker Compose service definition (port 3000)
│   └── README.md                      # Deployment instructions
│
└── src/
    ├── app/                           # Delivery Layer (Next.js App Router)
    │   ├── health/
    │   │   └── route.ts               # GET /health endpoint handler (matches core-api)
    │   ├── layout.tsx
    │   └── page.tsx                   # Executive Dashboard page
    │
    ├── server/                        # Server Layer (Clean Architecture)
    │   ├── di/
    │   │   ├── registry.ts            # Service Registry & DI assembly
    │   │   └── index.ts               # Barrel export
    │   ├── controllers/
    │   │   └── health.controller.ts
    │   ├── services/
    │   │   ├── health.service.interface.ts
    │   │   └── health.service.ts
    │   ├── repositories/
    │   │   ├── system.repository.interface.ts
    │   │   └── system.repository.ts
    │   └── dtos/
    │       └── health.dto.ts
    │
    └── components/                    # Frontend Layer (Atomic Design)
        ├── atoms/                     # Atoms: Badge, Button, StatusDot
        ├── molecules/                 # Molecules: Breadcrumb, SearchInput, StatusPill, UserChip
        ├── organisms/                 # Organisms: Topbar, Sidebar
        └── templates/                 # Templates: CMSLayout
```

## Run Locally with Node.js

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

The CMS starts on `http://localhost:3000` by default.

To build and run the optimized standalone production bundle:

```bash
npm run build
npm run start
```

## Run with Docker

The deployment uses a multi-dockerfile pattern matching `insurance-core-api`:

1. Build the dependency base image once:

```bash
./deployment/build-base.sh
```

2. Build the application image:

```bash
./deployment/build-cms.sh
```

3. Run the container using Docker Compose:

```bash
docker compose -f deployment/docker-compose.yaml up -d
```

If only source code changes, rerun `./deployment/build-cms.sh`. If `package.json` or `package-lock.json` changes, rerun both build scripts.

To view container logs or stop the service:

```bash
# View live logs
docker compose -f deployment/docker-compose.yaml logs -f cms

# Stop container
docker compose -f deployment/docker-compose.yaml down
```

## Health Check

The CMS exposes a lightweight health check endpoint adhering to the exact contract of `insurance-core-api`:

```bash
curl http://localhost:3000/health
```

**Response Format (`200 OK`)**:
```json
{
  "version": "0.1.0",
  "uptime": "14.281s",
  "git_hash": "a1b2c3d"
}
```

The `uptime` format is guaranteed to follow Go duration string conventions (e.g. `14.281s`, `1m23.456s`).

## Integration with Insurance Core API

The CMS acts as the backoffice frontend and orchestrator for `insurance-core-api` (`http://localhost:8080`).

### 1. Check Backend Connectivity

Verify that the Core API is running:

```bash
curl http://localhost:8080/health
```

### 2. Underwriting Applications Queue

Fetch applications submitted by customers for underwriter review:

```bash
curl "http://localhost:8080/api/v1/applications?status=submitted&page=1&limit=20"
```

Available application statuses:
- `submitted`: Newly submitted policy applications awaiting underwriting review.
- `under_review`: Application currently being audited by an underwriter.
- `approved`: Application approved and policy issued.
- `rejected`: Application rejected with formal reason.

### 3. Four-Pillar Underwriting Review Checks

Inspect the 4 verification pillars for a specific application:

```bash
curl http://localhost:8080/api/v1/applications/{application_id}/review-checks
```

Update a review check pillar:

```bash
curl -X PATCH http://localhost:8080/api/v1/applications/{application_id}/review-checks/identity_verified \
  -H "Content-Type: application/json" \
  -d '{
    "status": "passed",
    "reviewed_by": "underwriter@example.com",
    "notes": "NIK e-KTP matches Dukcapil database."
  }'
```

Available review check types:
- `identity_verified`: Dukcapil biometrics and ID card match.
- `income_verified`: Salary slip and Debt Service Ratio (DSR <= 30%).
- `documents_complete`: Required signatures and legal forms uploaded.
- `medical_required`: Medical history and underwriting risk assessment.

Available review check statuses:
- `pending`
- `passed`
- `failed`
- `not_needed`

> **Approval Rule**: An application can only transition to `approved` status after every review check is either `passed` or `not_needed`.

### 4. Underwriting Decision Actions

#### A. Approve and Issue Policy

```bash
curl -X PATCH http://localhost:8080/api/v1/applications/{application_id}/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved",
    "reviewed_by": "underwriter@example.com"
  }'
```

*Triggers digital policy generation (e-Policy PDF) and dispatches confirmation via email.*

#### B. Reject Application

```bash
curl -X PATCH http://localhost:8080/api/v1/applications/{application_id}/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "rejected",
    "reviewed_by": "underwriter@example.com",
    "rejection_reason": "DSR exceeds maximum threshold of 30%."
  }'
```

*Dispatches official rejection notification via email to the applicant.*

### 5. Product Management & Pricing Sandbox

Fetch product catalog:

```bash
curl http://localhost:8080/api/v1/products
```

Simulate premium quote calculation in the actuarial sandbox:

```bash
curl -X POST http://localhost:8080/api/v1/products/secure-life-plus/quotes \
  -H "Content-Type: application/json" \
  -d '{
    "age": 32,
    "gender": "male",
    "sum_assured": 500000000,
    "payment_term": 10,
    "payment_frequency": "monthly",
    "smoker": "no",
    "occupation_class": "standard",
    "health_risk": "low"
  }'
```

### 6. Knowledge Base Assistant (RAG)

Query the policy knowledge base vector store:

```bash
curl -X POST http://localhost:8080/api/v1/assistant/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Bagaimana SOP verifikasi dokumen pendapatan untuk DSR diatas 30%?"}'
```
