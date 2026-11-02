# Bhagwati Credit Co-operative Society Ltd.

### Banking Management System

A full-stack cooperative banking platform built for **Bhagwati Credit Co-operative Society Ltd.** — managing members, accounts, transactions, loans, and expenses with a double-entry general ledger, maker-checker approval workflows, and role-based access control.

---

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Setup](#environment-setup)
  - [Database Setup](#database-setup)
  - [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Authentication & Authorization](#authentication--authorization)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Security](#security)
- [Deployment](#deployment)

---

## Architecture

```
┌─────────────────────┐     ┌──────────────────────┐     ┌──────────────┐
│   React Frontend    │────▶│   Express Backend     │────▶│ PostgreSQL   │
│   (Vite + MUI)      │     │   (REST API)          │     │   16         │
│   Port 5173         │     │   Port 3000           │     │   Port 5432  │
└─────────────────────┘     └──────────┬───────────┘     └──────────────┘
                                       │
                                       ▼
                              ┌──────────────┐
                              │    Redis 7   │
                              │  (Sessions)  │
                              │  Port 6379   │
                              └──────────────┘
```

**Monorepo** with three workspaces:

| Workspace    | Description                                      |
|-------------|--------------------------------------------------|
| `shared/`   | TypeScript types, Zod schemas, constants (RBAC roles, permissions, enums) |
| `backend/`  | Express 4 REST API with PostgreSQL + Redis        |
| `frontend/` | React 18 SPA with Material UI 6, React Query, React Hook Form |

---

## Tech Stack

| Layer        | Technology                                                    |
|-------------|--------------------------------------------------------------|
| **Frontend** | React 18, TypeScript, Vite 6, MUI 6, TanStack React Query 5, React Hook Form, Notistack |
| **Backend**  | Node.js, Express 4, TypeScript, Zod validation, JWT auth     |
| **Database** | PostgreSQL 16 (double-entry ledger, integer paise arithmetic) |
| **Cache**    | Redis 7 (refresh token store, session management)            |
| **Testing**  | Vitest, React Testing Library                                |
| **Infra**    | Docker Compose (PostgreSQL + Redis)                          |

---

## Features

### Core Banking
- **Member Management** — Application, KYC verification (Aadhaar last-4, PAN), approval/rejection workflow
- **Account Lifecycle** — Savings, Fixed Deposits, Recurring Deposits, Share Capital; account opening, suspension, closure
- **Transaction Processing** — Cash deposits/withdrawals, NEFT/RTGS/UPI/cheque, internal transfers, interest posting, fee charges
- **Loan Management** — Application, approval, disbursement, EMI schedule generation, repayment tracking
- **Expense Tracking** — Categorized expense recording with multi-level approval

### Financial Controls
- **Double-Entry General Ledger** — Every transaction creates balanced debit/credit journal entries
- **Integer Paise Arithmetic** — All monetary values stored as integer minor units (1 rupee = 100 paise), never floating-point
- **Maker-Checker Workflow** — Every transaction stays `pending` until authorized by a senior staff member; the creator cannot approve their own transaction
- **Idempotency Keys** — Retryable transaction requests without double-processing
- **Transaction Reversals** — Authorized reversal entries; no silent edits or deletes on posted transactions

### Operations
- **Real-Time Notifications** — Database-backed notification system; admins/managers get alerts for pending approvals
- **Bank Passbook / Statement** — Print-ready A4 landscape passbook with navy+gold branding, proper CSS print styles
- **Dashboard** — At-a-glance KPIs: total members, accounts, deposits, loans, daily cash position, ledger summary
- **Daily Cash Report** — End-of-day cash reconciliation
- **Audit Trail** — Every staff action logged with actor name, IP address, timestamp, entity, and change details

### Administration
- **9 RBAC Roles** with 27 granular permissions
- **Staff Management** — Create, deactivate, role assignment
- **Branch Management** — Multi-branch support with per-branch isolation
- **System Configuration** — Runtime-configurable settings (membership number prefix, etc.)

---

## Getting Started

### Prerequisites

| Dependency | Version  |
|-----------|----------|
| Node.js   | >= 18    |
| npm       | >= 9     |
| PostgreSQL| 16       |
| Redis     | 7        |
| Docker    | Optional (for infra) |

### Installation

```bash
# Clone the repository
git clone https://github.com/dkraj27899/Banking-Software.git
cd Banking-Software

# Install all workspace dependencies
npm install
```

### Environment Setup

```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your values — at minimum, change:
#   JWT_SECRET          — random 32+ character string
#   JWT_REFRESH_SECRET  — different random 32+ character string
#   DATABASE_URL        — your PostgreSQL connection string
```

### Database Setup

**Option A: Docker (recommended)**

```bash
# Start PostgreSQL 16 + Redis 7
npm run docker:up

# Run migrations
npm run db:migrate

# Seed default data (branch, admin user, products)
npm run db:seed
```

**Option B: Existing PostgreSQL + Redis**

```bash
# Create the database
createdb bccs_dev

# Update DATABASE_URL and REDIS_URL in .env, then:
npm run db:migrate
npm run db:seed
```

### Running the Application

```bash
# Start both backend (port 3000) and frontend (port 5173)
npm run dev

# Or start individually:
npm run dev:backend    # Express API on http://localhost:3000
npm run dev:frontend   # Vite dev server on http://localhost:5173
```

### Default Credentials

| Username   | Password      | Role           | Name           |
|-----------|---------------|----------------|----------------|
| `admin`    | `Admin@1234`  | Super Admin    | Administrator  |
| `manager`  | `Manager@123` | Branch Admin   | Branch Manager |
| `cashier1` | `Cashier@123` | Cashier        | Ramesh Kumar   |
| `cashier2` | `Cashier@123` | Cashier        | Suresh Sharma  |

> **Change these immediately in production.**

---

## Project Structure

```
Banking-Software/
├── backend/
│   ├── src/
│   │   ├── config/          # Database pool, Redis client, env parsing
│   │   ├── database/        # Migrate runner, seed script
│   │   ├── middleware/       # Auth, RBAC, audit logging, rate limiting, validation
│   │   ├── modules/
│   │   │   ├── accounts/    # Account CRUD, products, close, approve
│   │   │   ├── audit/       # Audit log query endpoints
│   │   │   ├── auth/        # Login, logout, refresh, change password
│   │   │   ├── branches/    # Branch management
│   │   │   ├── config/      # System configuration key-value store
│   │   │   ├── dashboard/   # Stats, ledger summary
│   │   │   ├── expenses/    # Expense tracking + approval
│   │   │   ├── loans/       # Applications, approval, disbursement, repayment
│   │   │   ├── members/     # Membership lifecycle
│   │   │   ├── notifications/ # Real-time approval notifications
│   │   │   ├── reports/     # Daily cash report
│   │   │   ├── staff/       # Staff user management
│   │   │   ├── statements/  # Passbook + account statements
│   │   │   └── transactions/ # Transaction create, authorize, reverse
│   │   └── utils/           # JWT, password hashing, money helpers, logger
│   ├── tsconfig.json
│   └── vitest.config.ts
├── database/
│   └── migrations/          # 13 numbered SQL migrations (001–013)
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios API client + typed endpoint functions
│   │   ├── components/
│   │   │   ├── common/      # ConfirmDialog, EmptyState, LoadingSpinner, StatusChip
│   │   │   └── layout/      # AppLayout, Header (with NotificationBell), Sidebar
│   │   ├── hooks/           # usePermission
│   │   ├── pages/           # Route-level page components
│   │   ├── store/           # Auth store (context + token management)
│   │   ├── theme/           # MUI theme (Navy #0A1628 + Gold #C5A572)
│   │   └── utils/           # Formatting helpers (currency, dates)
│   ├── index.html
│   └── vite.config.ts
├── shared/                  # @bccs/shared — types, schemas, constants
│   └── src/
│       ├── constants/       # ROLES, PERMISSIONS, ROLE_PERMISSIONS, enums
│       ├── schemas/         # Zod validation schemas
│       └── types/           # TypeScript interfaces (API envelopes, entities)
├── docker-compose.yml       # PostgreSQL 16 + Redis 7
├── .env.example
└── package.json             # Workspace root
```

---

## Authentication & Authorization

### Auth Flow

1. **Login** — `POST /api/auth/login` returns an access token (15 min) and refresh token (7 days)
2. **Access Token** — JWT containing `userId`, `role`, `permissions[]`, `fullName`, `branchId`, `branchName`
3. **Refresh** — `POST /api/auth/refresh` exchanges a valid refresh token for a new access token
4. **Logout** — `POST /api/auth/logout` invalidates the refresh token in Redis

### Roles & Permissions

| Role                 | Key Permissions                                              |
|---------------------|-------------------------------------------------------------|
| `super_admin`       | All 27 permissions — full system access                     |
| `branch_admin`      | All operations within branch; staff management; approve all |
| `accountant`        | Transactions, authorize, reverse, ledger, reports, expenses |
| `cashier`           | Create transactions (pending), view members/accounts        |
| `membership_operator` | Create/update members, view accounts                      |
| `loan_officer`      | Create loan applications, view members/accounts             |
| `loan_approver`     | Approve/reject/disburse loans                               |
| `auditor`           | Read-only across all modules + audit logs                   |
| `readonly_manager`  | Read-only across members, accounts, transactions, reports   |

---

## API Reference

All endpoints prefixed with `/api`. Authentication required unless noted.

### Auth
| Method | Endpoint                | Description              |
|--------|------------------------|--------------------------|
| POST   | `/auth/login`          | Login (rate limited)     |
| POST   | `/auth/refresh`        | Refresh access token     |
| POST   | `/auth/logout`         | Invalidate refresh token |
| POST   | `/auth/change-password`| Change current password  |

### Members
| Method | Endpoint                | Permission        |
|--------|------------------------|-------------------|
| GET    | `/members`             | `member:read`     |
| GET    | `/members/:id`         | `member:read`     |
| POST   | `/members`             | `member:create`   |
| PATCH  | `/members/:id`         | `member:update`   |
| POST   | `/members/:id/approve` | `member:approve`  |
| POST   | `/members/:id/reject`  | `member:approve`  |

### Accounts
| Method | Endpoint                        | Permission        |
|--------|---------------------------------|-------------------|
| GET    | `/accounts`                     | `account:read`    |
| GET    | `/accounts/:id`                 | `account:read`    |
| GET    | `/accounts/by-member/:memberId` | `account:read`    |
| GET    | `/accounts/by-number/:number`   | `account:read`    |
| GET    | `/accounts/products`            | `account:read`    |
| POST   | `/accounts`                     | `account:create`  |
| POST   | `/accounts/:id/approve`         | `account:create`  |
| POST   | `/accounts/:id/close`           | `account:close`   |
| POST   | `/accounts/products`            | `config:manage`   |
| PATCH  | `/accounts/:id/product`         | `account:create`  |

### Transactions
| Method | Endpoint                          | Permission                |
|--------|-----------------------------------|---------------------------|
| GET    | `/transactions`                   | `transaction:read`        |
| GET    | `/transactions/:id`               | `transaction:read`        |
| GET    | `/transactions/pending`           | `transaction:authorize`   |
| POST   | `/transactions`                   | `transaction:create`      |
| POST   | `/transactions/:id/authorize`     | `transaction:authorize`   |
| POST   | `/transactions/:id/reverse`       | `transaction:reverse`     |

### Loans
| Method | Endpoint                                | Permission       |
|--------|-----------------------------------------|------------------|
| GET    | `/loans`                                | `loan:read`      |
| GET    | `/loans/:id`                            | `loan:read`      |
| GET    | `/loans/:id/schedule`                   | `loan:read`      |
| GET    | `/loans/products`                       | `loan:read`      |
| GET    | `/loans/applications`                   | `loan:read`      |
| POST   | `/loans/applications`                   | `loan:create`    |
| POST   | `/loans/applications/:id/approve`       | `loan:approve`   |
| POST   | `/loans/applications/:id/reject`        | `loan:approve`   |
| POST   | `/loans/applications/:id/disburse`      | `loan:disburse`  |
| POST   | `/loans/:id/repayment`                  | `transaction:create` |

### Expenses
| Method | Endpoint                   | Permission        |
|--------|---------------------------|-------------------|
| GET    | `/expenses`               | `expense:read`    |
| GET    | `/expenses/:id`           | `expense:read`    |
| GET    | `/expenses/categories`    | `expense:read`    |
| POST   | `/expenses`               | `expense:create`  |
| POST   | `/expenses/:id/approve`   | `expense:approve` |
| POST   | `/expenses/:id/reject`    | `expense:approve` |
| POST   | `/expenses/:id/pay`       | `expense:approve` |

### Statements
| Method | Endpoint                             | Permission           |
|--------|--------------------------------------|----------------------|
| GET    | `/statements/:accountId/passbook`    | `transaction:read`   |
| GET    | `/statements/:accountId/statement`   | `transaction:read`   |

### Notifications
| Method | Endpoint                    | Auth Required |
|--------|-----------------------------|---------------|
| GET    | `/notifications`            | Yes           |
| GET    | `/notifications/count`      | Yes           |
| PATCH  | `/notifications/:id/read`   | Yes           |
| PATCH  | `/notifications/read-all`   | Yes           |

### Other
| Method | Endpoint              | Description                |
|--------|-----------------------|---------------------------|
| GET    | `/dashboard/stats`    | Dashboard KPIs             |
| GET    | `/dashboard/ledger`   | Ledger summary             |
| GET    | `/reports/daily-cash` | Daily cash position        |
| GET    | `/staff`              | List staff users           |
| POST   | `/staff`              | Create staff user          |
| GET    | `/branches`           | List branches              |
| POST   | `/branches`           | Create branch              |
| GET    | `/audit`              | Audit log (paginated)      |
| GET    | `/config`             | System configuration       |
| GET    | `/health`             | Health check (no auth)     |

---

## Database Schema

13 migrations in `database/migrations/` build the schema:

| Migration | Table(s)                | Purpose                                     |
|-----------|------------------------|---------------------------------------------|
| 001       | Extensions             | `uuid-ossp`, `pgcrypto`                     |
| 002       | `branches`             | Multi-branch support                        |
| 003       | `roles`, `permissions` | RBAC role-permission mapping                |
| 004       | `staff_users`          | Staff credentials, roles, branch assignment |
| 005       | `audit_logs`           | Immutable audit trail                       |
| 006       | `system_configuration` | Key-value runtime config                    |
| 007       | `members`              | Member applications and KYC                 |
| 008       | `accounts`, `products` | Savings/FD/RD/Share accounts and product catalog |
| 009       | `chart_of_accounts`, `journal_entries` | Double-entry general ledger |
| 010       | `transactions`         | Financial transactions with maker-checker   |
| 011       | `loan_products`, `loan_applications`, `loans`, `loan_schedule` | Full loan lifecycle |
| 012       | `expenses`, `expense_categories` | Expense tracking                |
| 013       | `notifications`        | Approval notification system                |

---

## Security

### Design Principles

- **No floating-point money** — All financial values are integer paise (minor units)
- **No silent edits** — Posted transactions are immutable; corrections go through authorized reversals
- **Maker-checker** — The creator of a transaction cannot approve it
- **No secrets in code** — Credentials in `.env` only, never committed (`.gitignore` enforced)
- **No PII in logs** — Aadhaar stored as last 4 digits only; no passwords/tokens/OTPs in audit logs
- **Rate limiting** — Login: 5 attempts per 15 minutes; API: 100 requests per 15 minutes
- **Helmet** — Standard HTTP security headers
- **CORS** — Restricted to configured `FRONTEND_URL`
- **Input validation** — Zod schemas on every mutating endpoint
- **Parameterized queries** — All SQL uses `$1, $2, ...` bind parameters (no string interpolation)

### Auth Security

- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days and are stored in Redis (server-side revocation)
- Passwords hashed with bcrypt (10 salt rounds)
- JWT carries `fullName` and `branchName` for audit trail without extra DB lookups

---

## Deployment

### Production Build

```bash
# Build all workspaces
npm run build

# Start the backend
cd backend && node dist/index.js
```

### Environment Variables (Production)

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/bccs_prod
REDIS_URL=redis://host:6379
JWT_SECRET=<random-64-char-string>
JWT_REFRESH_SECRET=<different-random-64-char-string>
FRONTEND_URL=https://your-domain.com
LOG_LEVEL=info
```

### Production Checklist

- [ ] Change all default passwords (admin, manager, cashier1, cashier2)
- [ ] Set strong, unique `JWT_SECRET` and `JWT_REFRESH_SECRET`
- [ ] Use managed PostgreSQL with SSL (`?sslmode=require`)
- [ ] Use managed Redis with authentication
- [ ] Set `NODE_ENV=production`
- [ ] Set `FRONTEND_URL` to actual domain (CORS)
- [ ] Configure reverse proxy (Nginx/Caddy) with TLS
- [ ] Set up automated database backups
- [ ] Review and tighten rate limit values
- [ ] Enable PostgreSQL connection pooling (PgBouncer)

---

## Scripts

| Command              | Description                              |
|---------------------|------------------------------------------|
| `npm run dev`       | Start backend + frontend concurrently    |
| `npm run dev:backend` | Start Express API with hot reload      |
| `npm run dev:frontend` | Start Vite dev server                 |
| `npm run build`     | Build all workspaces for production      |
| `npm run test`      | Run tests across all workspaces          |
| `npm run lint`      | TypeScript type-check all workspaces     |
| `npm run db:migrate`| Run pending database migrations          |
| `npm run db:seed`   | Seed default data                        |
| `npm run docker:up` | Start PostgreSQL + Redis containers      |
| `npm run docker:down`| Stop infrastructure containers          |

---

## License

Private — Bhagwati Credit Co-operative Society Ltd. All rights reserved.
