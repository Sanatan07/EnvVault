# EnvVault — Full Technical Documentation

> Secrets & Environment Variable Management SaaS for Small Teams
> Stack: Next.js · Python · Django · REST API · Docker · Kubernetes · CI/CD · SAST · DevSecOps
> Architecture: Microservices

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Features](#2-features)
3. [System Architecture](#3-system-architecture)
4. [Microservices Design](#4-microservices-design)
5. [Database Design](#5-database-design)
6. [API Routes](#6-api-routes)
7. [Frontend Structure](#7-frontend-structure)
8. [Backend Structure](#8-backend-structure)
9. [File Structure](#9-file-structure)
10. [Encryption & Security Design](#10-encryption--security-design)
11. [Deployment Structure](#11-deployment-structure)
12. [CI/CD Pipeline](#12-cicd-pipeline)
13. [DevSecOps & SAST](#13-devsecops--sast)
14. [Usage-Based Billing](#14-usage-based-billing)
15. [Environment Variables Reference](#15-environment-variables-reference)

---

## 1. Product Overview

EnvVault is a multi-tenant SaaS platform that allows engineering teams to centrally manage, encrypt, version, and audit-log all secrets and environment variables across projects and deployment environments.

### Core Value Proposition

- Centralised secrets store with AES-256-GCM encryption
- Per-environment segregation (production / staging / development)
- Full audit trail of every read and write
- Usage-based billing per secret read
- Native CI/CD integrations (GitHub Actions, GitLab CI, CLI)
- Role-based access control (Admin / Editor / Viewer)
- One-click secret rollback via versioning

### Tech Stack Summary

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), Tailwind CSS, TypeScript |
| API Gateway | Nginx + Kong |
| Auth Service | Django REST Framework + SimpleJWT |
| Secrets Service | Django REST Framework + cryptography library |
| Audit Service | Django REST Framework + PostgreSQL |
| Billing Service | Django REST Framework + Stripe |
| Notification Service | Django + Celery + Redis |
| Database | PostgreSQL 15 (per service) |
| Cache / Queue | Redis 7 |
| Container | Docker |
| Orchestration | Kubernetes (K8s) |
| CI/CD | GitHub Actions + ArgoCD |
| Secret Scanning | Bandit, Semgrep, Trivy, OWASP ZAP |
| Object Storage | AWS S3 / Cloudflare R2 |

---

## 2. Features

### 2.1 Secret Management

- **CRUD on secrets** — create, read, update, soft-delete secrets
- **Masked display** — values are masked in the UI by default; reveal requires explicit user action
- **Versioning** — every update creates a new version; full history retained
- **Rollback** — restore any previous secret version with one click
- **Bulk import** — paste a `.env` file and all key-value pairs are imported
- **Export** — download environment as a `.env` file (logged in audit trail)
- **Secret rotation reminders** — flag secrets older than configurable N days
- **Leaked secret detection** — webhook listener checks commit diffs against known secret patterns

### 2.2 Environments

- Each project has three default environments: `production`, `staging`, `development`
- Custom environments can be added (e.g. `preview`, `qa`)
- Environments are colour-coded in the UI
- Promotion workflow: copy secrets from staging → production with diff view

### 2.3 Access Control

- **Organisation** is the top-level tenant
- **Projects** belong to an organisation
- **Members** are assigned roles per organisation: `owner`, `admin`, `editor`, `viewer`
- **API Tokens** are scoped to a project + environment + permission set
- Token expiry configurable; tokens stored as bcrypt hash only

### 2.4 Audit Log

- Every secret read, write, delete, export, and rollback is logged
- Log entries include: actor (member or token), secret key, action, IP address, user-agent, timestamp
- Filterable by project, environment, actor, action, and date range
- Exportable as CSV

### 2.5 Integrations

- **CLI** (`envvault pull`) — syncs secrets to local `.env` or injects into shell
- **GitHub Actions** — official action: `envvault/action@v1`
- **GitLab CI** — bash script integration
- **Kubernetes operator** — syncs secrets as K8s `Secret` objects
- **Webhook** — POST on any secret change event
- **Slack notifications** — alert on secret access from new IP, bulk export, or near-expiry

### 2.6 Billing (Usage-Based)

- Free tier: 1 project, 10 secrets, 500 reads/month
- Paid: charged per 1,000 secret reads above free tier
- Billing period resets monthly
- Stripe integration for payment; usage metered via Stripe Meters API
- Invoice emailed at period end

---

## 3. System Architecture

```
                          ┌─────────────────────┐
                          │   Next.js Frontend  │
                          │   (Vercel / K8s)    │
                          └──────────┬──────────┘
                                     │ HTTPS
                          ┌──────────▼──────────┐
                          │    API Gateway       │
                          │  Nginx + Kong        │
                          │  TLS · Rate Limit    │
                          │  JWT Validation      │
                          └─┬──────┬──────┬──────┘
                            │      │      │
             ┌──────────────▼─┐ ┌──▼───┐ ┌▼─────────────┐
             │  Auth Service  │ │Secrets│ │ Audit Service │
             │  :8001         │ │Service│ │ :8003         │
             │                │ │:8002  │ │               │
             └───────┬────────┘ └──┬───┘ └──────┬────────┘
                     │             │             │
             ┌───────▼─────────────▼─────────────▼────────┐
             │              PostgreSQL Cluster             │
             │  auth_db  |  secrets_db  |  audit_db        │
             └─────────────────────────────────────────────┘
                                     │
                          ┌──────────▼──────────┐
                          │   Billing Service    │
                          │   :8004 · Stripe     │
                          └──────────┬───────────┘
                                     │
                          ┌──────────▼──────────┐
                          │ Notification Service │
                          │ :8005 · Celery       │
                          │ Redis Queue          │
                          └─────────────────────┘
```

### Communication Patterns

| Pattern | Used For |
|---|---|
| Synchronous REST | Client ↔ Gateway ↔ Services |
| Async (Celery/Redis) | Email, Slack, webhook delivery, billing counters |
| Service-to-service | Auth token validation via internal HTTP |
| Event bus (Redis Pub/Sub) | Secret change events → Notification + Billing service |

---

## 4. Microservices Design

EnvVault is decomposed into six independently deployable services.

### 4.1 Auth Service (`auth-service`)

**Responsibility:** User registration, login, JWT issuance, OAuth2, API token management, organisation/member management.

**Port:** 8001  
**Database:** `auth_db` (PostgreSQL)  
**Cache:** Redis (session blacklist, rate limiting)

**Key endpoints:**
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/token/refresh`
- `GET  /auth/me`
- `POST /auth/organisations`
- `POST /auth/organisations/{org_id}/members`
- `POST /auth/api-tokens`

---

### 4.2 Secrets Service (`secrets-service`)

**Responsibility:** Full secrets lifecycle — CRUD, encryption/decryption, versioning, rollback, import/export.

**Port:** 8002  
**Database:** `secrets_db` (PostgreSQL)  
**Encryption:** AES-256-GCM with per-organisation envelope keys stored in environment variables / AWS KMS

**Key endpoints:**
- `GET    /secrets/{project_id}/{env}/`
- `POST   /secrets/{project_id}/{env}/`
- `PUT    /secrets/{project_id}/{env}/{key}/`
- `DELETE /secrets/{project_id}/{env}/{key}/`
- `GET    /secrets/{project_id}/{env}/{key}/versions/`
- `POST   /secrets/{project_id}/{env}/{key}/rollback/{version}/`
- `POST   /secrets/{project_id}/{env}/import/`
- `GET    /secrets/{project_id}/{env}/export/`

---

### 4.3 Audit Service (`audit-service`)

**Responsibility:** Receive and store structured audit log events from all other services; expose query and export API.

**Port:** 8003  
**Database:** `audit_db` (PostgreSQL, append-only table)

**Key endpoints:**
- `POST /audit/events/` (internal — called by other services)
- `GET  /audit/events/?project=&env=&actor=&action=&from=&to=`
- `GET  /audit/events/export/?format=csv`

---

### 4.4 Billing Service (`billing-service`)

**Responsibility:** Track secret read counts per organisation, sync to Stripe Meters, manage subscription plans, process Stripe webhooks.

**Port:** 8004  
**Database:** `billing_db` (PostgreSQL)  
**External:** Stripe API

**Key endpoints:**
- `POST /billing/meter/increment/` (internal — called by secrets service)
- `GET  /billing/usage/{org_id}/`
- `POST /billing/webhooks/stripe/`
- `GET  /billing/plans/`
- `POST /billing/checkout/`

---

### 4.5 Notification Service (`notification-service`)

**Responsibility:** Consume events from Redis Pub/Sub; deliver Slack messages, emails, and webhook POSTs.

**Port:** 8005  
**Queue:** Redis + Celery  
**External:** SendGrid (email), Slack API, customer-defined webhook URLs

**Celery tasks:**
- `send_secret_change_alert`
- `send_new_ip_alert`
- `send_expiry_reminder`
- `deliver_webhook`
- `send_invoice_email`

---

### 4.6 API Gateway (`api-gateway`)

**Responsibility:** Single entry point for all client traffic. Handles TLS termination, JWT validation (delegated to Auth Service), rate limiting, and request routing to downstream services.

**Technology:** Nginx + Kong  
**Port:** 443 (external), 8080 (internal)

**Routing table:**

| Path prefix | Upstream |
|---|---|
| `/api/v1/auth/` | auth-service:8001 |
| `/api/v1/secrets/` | secrets-service:8002 |
| `/api/v1/audit/` | audit-service:8003 |
| `/api/v1/billing/` | billing-service:8004 |
| `/api/v1/notifications/` | notification-service:8005 |

---

## 5. Database Design

Each service owns its own database (Database-per-Service pattern). No cross-service joins — data needed across boundaries is fetched via internal API calls.

### 5.1 auth_db

```sql
-- organisations
CREATE TABLE organisations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    plan VARCHAR(50) DEFAULT 'free',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- members (org ↔ user with role)
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'viewer', -- owner | admin | editor | viewer
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, user_id)
);

-- projects
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, slug)
);

-- api_tokens
CREATE TABLE api_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255),
    token_hash VARCHAR(255) NOT NULL,
    scopes TEXT[] DEFAULT '{read}',
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- refresh_token_blacklist
CREATE TABLE token_blacklist (
    jti VARCHAR(255) PRIMARY KEY,
    expires_at TIMESTAMPTZ NOT NULL
);
```

### 5.2 secrets_db

```sql
-- environments
CREATE TABLE environments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL, -- FK resolved via auth-service API
    name VARCHAR(100) NOT NULL, -- production | staging | development | custom
    color VARCHAR(20) DEFAULT '#6366f1',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, name)
);

-- secrets
CREATE TABLE secrets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    environment_id UUID REFERENCES environments(id) ON DELETE CASCADE,
    key VARCHAR(500) NOT NULL,
    encrypted_value TEXT NOT NULL,
    iv VARCHAR(255) NOT NULL, -- AES-GCM initialisation vector
    current_version INT DEFAULT 1,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(environment_id, key)
);

-- secret_versions (append-only)
CREATE TABLE secret_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    secret_id UUID REFERENCES secrets(id) ON DELETE CASCADE,
    encrypted_value TEXT NOT NULL,
    iv VARCHAR(255) NOT NULL,
    version_number INT NOT NULL,
    created_by UUID NOT NULL, -- member_id from auth service
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_secret_versions_secret_id ON secret_versions(secret_id);
CREATE INDEX idx_secrets_environment_key ON secrets(environment_id, key) WHERE is_deleted = FALSE;
```

### 5.3 audit_db

```sql
-- audit_events (append-only, never updated or deleted)
CREATE TABLE audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    project_id UUID NOT NULL,
    environment_name VARCHAR(100),
    actor_type VARCHAR(50) NOT NULL, -- 'member' | 'api_token'
    actor_id UUID NOT NULL,
    actor_email VARCHAR(255),
    secret_key VARCHAR(500),
    action VARCHAR(100) NOT NULL, -- 'read' | 'write' | 'delete' | 'rollback' | 'export' | 'import'
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_org ON audit_events(org_id, created_at DESC);
CREATE INDEX idx_audit_project ON audit_events(project_id, created_at DESC);
CREATE INDEX idx_audit_actor ON audit_events(actor_id, created_at DESC);
```

### 5.4 billing_db

```sql
-- billing_accounts
CREATE TABLE billing_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID UNIQUE NOT NULL,
    stripe_customer_id VARCHAR(255) UNIQUE,
    stripe_subscription_id VARCHAR(255),
    plan VARCHAR(50) DEFAULT 'free',
    billing_period_start TIMESTAMPTZ,
    billing_period_end TIMESTAMPTZ
);

-- usage_counters (one row per org per billing period)
CREATE TABLE usage_counters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    secret_reads BIGINT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, period_start)
);
```

---

## 6. API Routes

All routes are prefixed with `/api/v1/`. Authentication is via `Authorization: Bearer <jwt>` or `Authorization: Token <api_token>`.

### 6.1 Auth Service Routes

```
POST   /auth/register                         Register new user + create org
POST   /auth/login                            Login, returns access + refresh tokens
POST   /auth/token/refresh                    Refresh access token
POST   /auth/logout                           Blacklist refresh token
GET    /auth/me                               Current user profile

GET    /auth/organisations                    List user's organisations
POST   /auth/organisations                    Create organisation
GET    /auth/organisations/{org_id}           Get org details
PATCH  /auth/organisations/{org_id}           Update org name/slug

GET    /auth/organisations/{org_id}/members   List members
POST   /auth/organisations/{org_id}/members   Invite member by email
PATCH  /auth/organisations/{org_id}/members/{member_id}  Update role
DELETE /auth/organisations/{org_id}/members/{member_id}  Remove member

GET    /auth/projects                         List projects for org
POST   /auth/projects                         Create project
GET    /auth/projects/{project_id}            Get project
PATCH  /auth/projects/{project_id}            Update project
DELETE /auth/projects/{project_id}            Delete project

GET    /auth/projects/{project_id}/tokens     List API tokens
POST   /auth/projects/{project_id}/tokens     Create API token (returns plaintext once)
DELETE /auth/projects/{project_id}/tokens/{token_id}  Revoke token

POST   /auth/internal/validate-token         (Internal) Validate JWT or API token
```

### 6.2 Secrets Service Routes

```
GET    /secrets/{project_id}/environments              List environments
POST   /secrets/{project_id}/environments              Create environment
DELETE /secrets/{project_id}/environments/{env_id}     Delete environment

GET    /secrets/{project_id}/{env}/                    List all secrets (keys + masked values)
POST   /secrets/{project_id}/{env}/                    Create secret
GET    /secrets/{project_id}/{env}/{key}/              Read secret (plaintext — counted for billing)
PUT    /secrets/{project_id}/{env}/{key}/              Update secret
DELETE /secrets/{project_id}/{env}/{key}/              Soft-delete secret

GET    /secrets/{project_id}/{env}/{key}/versions/     List all versions
POST   /secrets/{project_id}/{env}/{key}/rollback/{version_number}/  Rollback to version

POST   /secrets/{project_id}/{env}/import/             Import from .env file (multipart)
GET    /secrets/{project_id}/{env}/export/             Export as .env file

POST   /secrets/{project_id}/promote/                  Promote env → env (diff + copy)
```

### 6.3 Audit Service Routes

```
GET    /audit/events/                         Query audit events
       ?project_id=&env=&actor_id=&action=&from=&to=&page=&limit=
GET    /audit/events/{event_id}/              Single event detail
GET    /audit/events/export/                  Export as CSV (same filters)
GET    /audit/stats/                          Summary counts by action/env/period

POST   /audit/events/                         (Internal only) Ingest event
```

### 6.4 Billing Service Routes

```
GET    /billing/plans/                        List available plans
GET    /billing/usage/{org_id}/               Current usage + billing period
POST   /billing/checkout/                     Create Stripe checkout session
POST   /billing/portal/                       Create Stripe customer portal session
POST   /billing/webhooks/stripe/              Stripe webhook receiver

POST   /billing/internal/increment/           (Internal) Increment read counter by org_id
```

### 6.5 Notification Service Routes

```
GET    /notifications/settings/{org_id}/      Get notification preferences
PUT    /notifications/settings/{org_id}/      Update preferences (Slack URL, webhook URL)
POST   /notifications/webhooks/test/          Send test webhook

POST   /notifications/internal/trigger/      (Internal) Trigger a notification event
```

---

## 7. Frontend Structure

### 7.1 Pages & Routes (Next.js App Router)

```
app/
├── (auth)/
│   ├── login/page.tsx                  Login page
│   ├── register/page.tsx               Registration + org creation
│   └── invite/[token]/page.tsx         Accept team invite
│
├── (dashboard)/
│   ├── layout.tsx                      Sidebar + topbar shell
│   ├── page.tsx                        Redirect to first project
│   │
│   ├── [org_slug]/
│   │   ├── page.tsx                    Org overview / project list
│   │   │
│   │   ├── [project_slug]/
│   │   │   ├── page.tsx                Project overview (env selector)
│   │   │   ├── [env]/
│   │   │   │   ├── page.tsx            Secrets list for env
│   │   │   │   └── import/page.tsx     Bulk import .env
│   │   │   ├── tokens/page.tsx         API tokens management
│   │   │   └── settings/page.tsx       Project settings
│   │   │
│   │   ├── members/page.tsx            Team members + invite
│   │   ├── audit/page.tsx              Audit log viewer
│   │   ├── billing/page.tsx            Usage + billing
│   │   └── settings/page.tsx           Org settings
│
├── api/                                Next.js API routes (BFF layer)
│   ├── auth/[...nextauth]/route.ts     NextAuth handler
│   └── proxy/[...path]/route.ts        Proxy to microservices
│
└── layout.tsx                          Root layout (fonts, providers)
```

### 7.2 Component Structure

```
components/
├── ui/                                 Base design system
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Badge.tsx
│   ├── Card.tsx
│   ├── Dialog.tsx
│   ├── Tooltip.tsx
│   └── Table.tsx
│
├── secrets/
│   ├── SecretsTable.tsx                Masked row list with reveal/copy/edit
│   ├── SecretRow.tsx
│   ├── AddSecretDialog.tsx
│   ├── EditSecretDialog.tsx
│   ├── VersionHistoryDrawer.tsx
│   ├── ImportEnvDialog.tsx
│   └── ExportButton.tsx
│
├── audit/
│   ├── AuditLogTable.tsx
│   ├── AuditFilters.tsx
│   └── AuditExportButton.tsx
│
├── billing/
│   ├── UsageMeter.tsx
│   ├── PlanCard.tsx
│   └── BillingPortalButton.tsx
│
├── layout/
│   ├── Sidebar.tsx
│   ├── Topbar.tsx
│   ├── EnvTabs.tsx
│   └── OrgSwitcher.tsx
│
└── integrations/
    ├── CliInstructions.tsx
    ├── GitHubActionsSnippet.tsx
    └── WebhookSettings.tsx
```

### 7.3 State Management

- **Server state:** TanStack Query (React Query) — all API data fetching and caching
- **Client state:** Zustand — active org/project/env selection, UI state
- **Auth:** NextAuth.js with JWT strategy, refresh token rotation
- **Forms:** React Hook Form + Zod validation

---

## 8. Backend Structure

Each microservice follows the same internal Django layout.

### 8.1 Per-Service Django Layout

```
{service-name}/
├── manage.py
├── requirements.txt
├── Dockerfile
├── .env.example
│
├── config/
│   ├── settings/
│   │   ├── base.py
│   │   ├── development.py
│   │   └── production.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
│
├── {app_name}/
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   ├── permissions.py
│   ├── services.py         # Business logic (not in views)
│   ├── tasks.py            # Celery tasks (notification service)
│   └── tests/
│       ├── test_models.py
│       ├── test_views.py
│       └── test_services.py
│
└── utils/
    ├── encryption.py       # AES-256-GCM helpers
    ├── pagination.py
    └── exceptions.py
```

### 8.2 Encryption Service (`utils/encryption.py`)

```python
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import os, base64

def encrypt(plaintext: str, key_b64: str) -> tuple[str, str]:
    """Returns (ciphertext_b64, iv_b64)"""
    key = base64.b64decode(key_b64)
    iv = os.urandom(12)  # 96-bit nonce for GCM
    aesgcm = AESGCM(key)
    ct = aesgcm.encrypt(iv, plaintext.encode(), None)
    return base64.b64encode(ct).decode(), base64.b64encode(iv).decode()

def decrypt(ciphertext_b64: str, iv_b64: str, key_b64: str) -> str:
    key = base64.b64decode(key_b64)
    iv = base64.b64decode(iv_b64)
    ct = base64.b64decode(ciphertext_b64)
    aesgcm = AESGCM(key)
    return aesgcm.decrypt(iv, ct, None).decode()
```

Each organisation has a unique 256-bit encryption key stored as an environment variable (or AWS KMS-managed key in production). The key is never stored in the database.

### 8.3 Audit Emission Pattern

Every service calls the Audit Service via an internal async HTTP call after any secret operation:

```python
import httpx

async def emit_audit(event: dict):
    async with httpx.AsyncClient() as client:
        await client.post(
            "http://audit-service:8003/api/v1/audit/events/",
            json=event,
            headers={"X-Internal-Token": settings.INTERNAL_SERVICE_TOKEN}
        )
```

### 8.4 Read Counter Pattern (Billing)

The Secrets Service increments the billing counter on every successful decryption:

```python
# secrets/services.py
def read_secret(secret_id, org_id) -> str:
    secret = Secret.objects.get(id=secret_id)
    plaintext = decrypt(secret.encrypted_value, secret.iv, get_org_key(org_id))
    # Fire-and-forget billing increment
    increment_read_counter.delay(org_id)  # Celery task
    return plaintext
```

---

## 9. File Structure

### 9.1 Monorepo Root

```
envvault/
├── README.md
├── docker-compose.yml               Local dev: all services
├── docker-compose.test.yml          Integration test environment
├── .github/
│   └── workflows/
│       ├── ci.yml                   Build + test + SAST on PR
│       ├── cd-staging.yml           Deploy to staging on merge to main
│       └── cd-production.yml        Deploy to production on tag
│
├── infra/
│   ├── k8s/
│   │   ├── namespaces.yaml
│   │   ├── auth-service/
│   │   │   ├── deployment.yaml
│   │   │   ├── service.yaml
│   │   │   ├── hpa.yaml
│   │   │   └── configmap.yaml
│   │   ├── secrets-service/
│   │   ├── audit-service/
│   │   ├── billing-service/
│   │   ├── notification-service/
│   │   ├── api-gateway/
│   │   ├── postgres/
│   │   ├── redis/
│   │   └── ingress.yaml
│   │
│   ├── helm/
│   │   └── envvault/
│   │       ├── Chart.yaml
│   │       ├── values.yaml
│   │       ├── values.staging.yaml
│   │       └── values.production.yaml
│   │
│   └── argocd/
│       ├── app-staging.yaml
│       └── app-production.yaml
│
├── services/
│   ├── auth-service/               Django app (see §8.1 layout)
│   ├── secrets-service/
│   ├── audit-service/
│   ├── billing-service/
│   └── notification-service/
│
├── frontend/                       Next.js app
│   ├── package.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── public/
│   ├── app/                        (see §7.1)
│   ├── components/                 (see §7.2)
│   ├── lib/
│   │   ├── api.ts                  Typed API client
│   │   ├── auth.ts                 NextAuth config
│   │   └── utils.ts
│   └── hooks/
│       ├── useSecrets.ts
│       ├── useAuditLog.ts
│       └── useBilling.ts
│
├── cli/                            Python CLI tool
│   ├── setup.py
│   ├── envvault_cli/
│   │   ├── __init__.py
│   │   ├── main.py                 Click CLI entrypoint
│   │   ├── commands/
│   │   │   ├── pull.py             envvault pull --env production
│   │   │   ├── push.py
│   │   │   └── login.py
│   │   └── config.py               ~/.envvault/config.toml
│   └── tests/
│
└── docs/
    ├── envvault-documentation.md   This file
    ├── api-reference.md
    └── deployment-guide.md
```

---

## 10. Encryption & Security Design

### 10.1 Secret Encryption

- Algorithm: **AES-256-GCM** (authenticated encryption — provides both confidentiality and integrity)
- Per-write unique **96-bit IV** (initialisation vector) — stored alongside ciphertext
- **Envelope encryption pattern:**
  - Each organisation has a Data Encryption Key (DEK)
  - In development: DEK stored in environment variable
  - In production: DEK is itself encrypted by a Key Encryption Key (KEK) stored in AWS KMS or HashiCorp Vault
- Secret values are **never stored in plaintext** anywhere — not in logs, not in the DB, not in transit beyond the TLS boundary

### 10.2 API Token Security

- Tokens generated as 32-byte cryptographically random values: `secrets.token_urlsafe(32)`
- Only the **bcrypt hash** is stored in the database
- Shown to the user **exactly once** at creation; cannot be retrieved again
- Scoped to `read`, `write`, or `read:write` per project/environment

### 10.3 Transport Security

- All external traffic: **TLS 1.3** terminated at the API Gateway
- Internal service-to-service: mutual TLS within the Kubernetes cluster (via Istio or Linkerd service mesh)
- `HSTS`, `X-Frame-Options`, `X-Content-Type-Options`, `CSP` headers set on all responses

### 10.4 Authentication Flow

```
1. User POSTs credentials → Auth Service
2. Auth Service returns: { access_token (15min TTL), refresh_token (7d TTL) }
3. access_token is a signed JWT containing: user_id, org_id, role, exp
4. API Gateway validates JWT signature on every request (public key only)
5. On 401, client POSTs refresh_token → new access_token issued
6. On logout: refresh_token JTI added to Redis blacklist (checked at refresh time)
```

---

## 11. Deployment Structure

### 11.1 Environments

| Environment | Trigger | Cluster | Domain |
|---|---|---|---|
| Local dev | `docker-compose up` | Docker Desktop | `localhost` |
| Staging | Merge to `main` | K8s (staging ns) | `staging.envvault.io` |
| Production | Git tag `v*.*.*` | K8s (production ns) | `app.envvault.io` |

### 11.2 Kubernetes Namespace Layout

```
envvault-production/
├── Deployments
│   ├── auth-service          replicas: 2, HPA max: 6
│   ├── secrets-service       replicas: 3, HPA max: 10
│   ├── audit-service         replicas: 2, HPA max: 4
│   ├── billing-service       replicas: 1, HPA max: 3
│   ├── notification-service  replicas: 1 (Celery workers: 2)
│   └── frontend              replicas: 2, HPA max: 6
│
├── StatefulSets
│   ├── postgres-auth
│   ├── postgres-secrets
│   ├── postgres-audit
│   ├── postgres-billing
│   └── redis
│
├── Services (ClusterIP for internal, LoadBalancer for gateway)
├── Ingress (Nginx Ingress Controller + cert-manager)
├── HorizontalPodAutoscalers
├── ConfigMaps (non-secret config per service)
└── Secrets (K8s Secrets for DB passwords, encryption keys — sourced from Vault)
```

### 11.3 Kubernetes Deployment Example (`secrets-service`)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: secrets-service
  namespace: envvault-production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: secrets-service
  template:
    metadata:
      labels:
        app: secrets-service
    spec:
      containers:
        - name: secrets-service
          image: ghcr.io/your-org/envvault-secrets-service:v1.2.0
          ports:
            - containerPort: 8002
          envFrom:
            - secretRef:
                name: secrets-service-env
          resources:
            requests:
              cpu: 250m
              memory: 256Mi
            limits:
              cpu: 500m
              memory: 512Mi
          readinessProbe:
            httpGet:
              path: /health/
              port: 8002
            initialDelaySeconds: 10
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /health/
              port: 8002
            initialDelaySeconds: 30
            periodSeconds: 15
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: secrets-service-hpa
  namespace: envvault-production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: secrets-service
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 65
```

### 11.4 Ingress Configuration

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: envvault-ingress
  namespace: envvault-production
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
spec:
  tls:
    - hosts:
        - app.envvault.io
      secretName: envvault-tls
  rules:
    - host: app.envvault.io
      http:
        paths:
          - path: /api/v1/auth/
            pathType: Prefix
            backend:
              service:
                name: auth-service
                port:
                  number: 8001
          - path: /api/v1/secrets/
            pathType: Prefix
            backend:
              service:
                name: secrets-service
                port:
                  number: 8002
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 3000
```

---

## 12. CI/CD Pipeline

### 12.1 Pipeline Stages (GitHub Actions)

```
Pull Request opened
        │
        ▼
┌─────────────────┐
│  Lint & Format  │  ruff (Python), ESLint (JS), black
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Unit Tests     │  pytest (each service), Jest (frontend)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  SAST Scan      │  Bandit, Semgrep, pip-audit, npm audit
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Docker Build   │  Build image for changed service(s)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Container Scan │  Trivy (CVE scan on Docker image)
└────────┬────────┘
         │
 PR merged to main
         │
         ▼
┌─────────────────┐
│ Push to Registry│  ghcr.io/org/envvault-{service}:{sha}
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Deploy Staging  │  ArgoCD syncs Helm chart (staging values)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Integration Test│  pytest + OWASP ZAP against staging
└────────┬────────┘
         │
   Git tag v*.*.*
         │
         ▼
┌─────────────────┐
│Deploy Production│  ArgoCD syncs Helm chart (prod values)
└─────────────────┘
```

### 12.2 GitHub Actions CI Workflow (`.github/workflows/ci.yml`)

```yaml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  test-and-scan:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [auth-service, secrets-service, audit-service, billing-service, notification-service]

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install dependencies
        run: pip install -r services/${{ matrix.service }}/requirements.txt --break-system-packages

      - name: Run tests
        run: |
          cd services/${{ matrix.service }}
          pytest --tb=short --cov=. --cov-report=xml

      - name: Bandit SAST
        run: bandit -r services/${{ matrix.service }} -ll -x tests/

      - name: Semgrep
        uses: semgrep/semgrep-action@v1
        with:
          config: p/django p/secrets p/owasp-top-ten

      - name: pip-audit dependency scan
        run: pip-audit -r services/${{ matrix.service }}/requirements.txt

      - name: Build Docker image
        run: docker build -t envvault-${{ matrix.service }}:${{ github.sha }} services/${{ matrix.service }}/

      - name: Trivy container scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: envvault-${{ matrix.service }}:${{ github.sha }}
          severity: CRITICAL,HIGH
          exit-code: 1
```

---

## 13. DevSecOps & SAST

### 13.1 Security Toolchain

| Tool | Stage | Purpose |
|---|---|---|
| **Bandit** | CI (PR) | Python AST-based SAST — finds common Python security issues |
| **Semgrep** | CI (PR) | Pattern-based SAST — Django-specific rules, secrets in code, OWASP Top 10 |
| **pip-audit** | CI (PR) | Python dependency CVE scanning (uses OSV database) |
| **npm audit** | CI (PR) | Node.js dependency CVE scanning |
| **Trivy** | CI (post-build) | Docker image layer CVE scanning |
| **OWASP ZAP** | CD (post-staging-deploy) | Dynamic API security testing (DAST) |
| **Gitleaks** | Pre-commit hook | Prevent secrets from being committed to git |
| **checkov** | CI (PR) | IaC scanning on K8s manifests and Helm charts |

### 13.2 Security Policies

- All `CRITICAL` and `HIGH` severity findings block the pipeline
- `MEDIUM` findings generate a PR comment and require manual sign-off
- Docker images are rebuilt weekly even without code changes (base image CVE refresh)
- Secrets rotation reminder fires after 90 days of inactivity
- Rate limiting: 60 reads/minute per API token; 10 writes/minute per API token
- All service-to-service calls require `X-Internal-Token` header (shared secret, rotated monthly)

### 13.3 Pre-commit Hooks (`.pre-commit-config.yaml`)

```yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.0
    hooks:
      - id: gitleaks

  - repo: https://github.com/PyCQA/bandit
    rev: 1.7.8
    hooks:
      - id: bandit
        args: ["-c", "pyproject.toml"]

  - repo: https://github.com/psf/black
    rev: 24.4.2
    hooks:
      - id: black
```

---

## 14. Usage-Based Billing

### 14.1 Billing Tiers

| Tier | Price | Secrets | Reads/mo | Projects |
|---|---|---|---|---|
| Free | $0 | 10 | 500 | 1 |
| Starter | $9/mo base + $0.50/1k reads | Unlimited | 10,000 incl. | 5 |
| Growth | $29/mo base + $0.30/1k reads | Unlimited | 50,000 incl. | 20 |
| Enterprise | Custom | Unlimited | Unlimited | Unlimited |

### 14.2 Billing Flow

```
1. Secret read occurs in secrets-service
2. secrets-service emits Redis event: { org_id, count: 1 }
3. billing-service Celery worker consumes event
4. billing-service increments usage_counters.secret_reads for org + current period
5. At period end: billing-service calls Stripe Meters API with total overage reads
6. Stripe generates invoice and charges stored payment method
7. billing-service receives stripe.invoice.payment_succeeded webhook
8. notification-service sends invoice email to org owner
```

### 14.3 Overage Guard

- At 80% of plan limit: email warning to org owner
- At 100%: Slack notification (if configured) + banner in dashboard
- Hard limit option: org owner can enable "block reads at limit" to prevent unexpected charges

---

## 15. Environment Variables Reference

### All Services (common)

```env
DJANGO_SECRET_KEY=           # Django secret key (50+ random chars)
DJANGO_DEBUG=false
ALLOWED_HOSTS=               # Comma-separated hostnames
DATABASE_URL=                # postgresql://user:pass@host:5432/dbname
REDIS_URL=                   # redis://:password@host:6379/0
INTERNAL_SERVICE_TOKEN=      # Shared token for internal service calls
SENTRY_DSN=                  # Error tracking (optional)
```

### Auth Service

```env
JWT_SIGNING_KEY=             # RS256 private key (PEM)
JWT_ACCESS_TOKEN_LIFETIME=900          # seconds (15 min)
JWT_REFRESH_TOKEN_LIFETIME=604800      # seconds (7 days)
```

### Secrets Service

```env
# Org encryption keys (format: ORG_KEY_{org_id_uppercase}=base64_encoded_256bit_key)
# In production, replaced by AWS KMS key ARN
AWS_KMS_KEY_ARN=             # Production: KMS-managed envelope key
ORG_KEY_DEFAULT=             # Dev fallback: base64 AES-256 key
```

### Billing Service

```env
STRIPE_SECRET_KEY=           # sk_live_... or sk_test_...
STRIPE_WEBHOOK_SECRET=       # whsec_...
STRIPE_METER_ID=             # Stripe Meter ID for secret reads
```

### Notification Service

```env
SENDGRID_API_KEY=
FROM_EMAIL=notifications@envvault.io
SLACK_BOT_TOKEN=             # For org-level Slack integration
```

### Frontend

```env
NEXT_PUBLIC_API_URL=https://app.envvault.io/api/v1
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://app.envvault.io
```

---

## Appendix: Quick-Start (Local Development)

```bash
# Clone and start all services
git clone https://github.com/your-org/envvault.git
cd envvault
cp .env.example .env          # fill in values

docker-compose up --build

# Run migrations for each service
docker-compose exec auth-service python manage.py migrate
docker-compose exec secrets-service python manage.py migrate
docker-compose exec audit-service python manage.py migrate
docker-compose exec billing-service python manage.py migrate

# Create superuser
docker-compose exec auth-service python manage.py createsuperuser

# Frontend available at http://localhost:3000
# API Gateway at http://localhost:8080
# Each service admin at http://localhost:800{1-5}/admin/
```

---

*EnvVault Documentation — v1.0.0 — Generated June 2026*
