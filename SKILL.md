# Banking Software — Skills & Capabilities

## Available Commands
```bash
npm run dev              # Start both backend and frontend
npm run dev:backend      # Backend only (http://localhost:3000)
npm run dev:frontend     # Frontend only (http://localhost:5173)
npm run test             # Run all workspace tests
npm run db:migrate       # Run pending database migrations
npm run db:seed          # Seed default admin user + account products
npm run build            # Production build all workspaces
npm run docker:up        # Start PostgreSQL + Redis containers
```

## Database
- **PostgreSQL 16**: `bccs_dev` on localhost:5432
- **Redis**: localhost:6379
- **Migrations**: `database/migrations/` (numbered .sql files)
- **Migration runner**: `backend/src/database/migrate.ts`
- **Seed**: `backend/src/database/seed.ts`

## API Endpoints

### Auth
- `POST /api/auth/login` — Login (returns JWT)
- `POST /api/auth/refresh` — Refresh token
- `POST /api/auth/logout` — Logout (authenticated)
- `POST /api/auth/change-password` — Change password (authenticated)

### Staff
- `GET  /api/staff` — List staff (paginated, requires staff:manage)
- `POST /api/staff` — Create staff
- `GET  /api/staff/:id` — Get staff details
- `PATCH /api/staff/:id` — Update staff
- `PATCH /api/staff/:id/deactivate` — Deactivate staff

### Branches
- `GET  /api/branches` — List branches
- `POST /api/branches` — Create branch (requires branch:manage)
- `GET  /api/branches/:id` — Get branch details
- `PATCH /api/branches/:id` — Update branch

### Members
- `GET  /api/members` — List members (paginated, search, filter by status)
- `GET  /api/members/:id` — Get member details
- `POST /api/members` — Create member application
- `PATCH /api/members/:id` — Update pending member
- `POST /api/members/:id/approve` — Approve member (generates BCCS-YYYY-NNNNN)
- `POST /api/members/:id/reject` — Reject member

### Accounts
- `GET  /api/accounts/products` — List account products
- `POST /api/accounts/products` — Create account product (requires config:manage)
- `GET  /api/accounts` — List accounts (paginated, filter by member/status)
- `GET  /api/accounts/:id` — Get account details
- `POST /api/accounts` — Create account for member
- `POST /api/accounts/:id/approve` — Approve account (generates account number)
- `POST /api/accounts/:id/close` — Close account (balance must be zero)

### Transactions
- `GET  /api/transactions` — List transactions (paginated, filter by account/status/type)
- `GET  /api/transactions/pending` — Pending authorizations
- `GET  /api/transactions/:id` — Get transaction details
- `POST /api/transactions` — Create transaction (idempotency key required)
- `POST /api/transactions/:id/authorize` — Authorize or reject pending transaction
- `POST /api/transactions/:id/reverse` — Reverse posted transaction

### Statements
- `GET  /api/statements/:accountId/passbook` — Passbook (paginated, date filter)
- `GET  /api/statements/:accountId/statement` — Account statement (fromDate, toDate required)

### Dashboard
- `GET  /api/dashboard/stats` — Dashboard statistics
- `GET  /api/dashboard/ledger` — Ledger summary with trial balance

### Config
- `GET  /api/config` — List all system configuration
- `GET  /api/config/:key` — Get config value
- `PATCH /api/config/:key` — Update config value

### Loans (Phase 5)
- `GET  /api/loans` — List loans
- `POST /api/loans` — Create loan application
- `POST /api/loans/:id/approve` — Approve loan
- `POST /api/loans/:id/disburse` — Disburse loan
- `POST /api/loans/:id/repayment` — Record EMI payment

### Expenses (Phase 5)
- `GET  /api/expenses` — List expenses
- `POST /api/expenses` — Create expense
- `POST /api/expenses/:id/approve` — Approve expense

### Audit
- `GET  /api/audit` — Audit logs (requires audit:read)

### Health
- `GET  /api/health` — Health check

## Default Login
- Username: `admin`
- Password: `Admin@1234`
- Role: super_admin (all 27 permissions)

## Seeded Account Products
| Code | Name | Type | Min Balance | Rate (bps) |
|------|------|------|-------------|------------|
| SAV001 | Regular Savings Account | savings | ₹1,000 | 400 (4%) |
| FD001 | Fixed Deposit (1 Year) | fixed_deposit | ₹5,000 | 700 (7%) |
| FD002 | Fixed Deposit (3 Year) | fixed_deposit | ₹5,000 | 800 (8%) |
| RD001 | Regular Recurring Deposit | recurring_deposit | ₹500 | 650 (6.5%) |
| SHR001 | Share Capital | share_capital | ₹0 | 0 |
