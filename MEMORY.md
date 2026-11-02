# Banking Software — Project Memory

## Project
- **Name**: Bhagwati Credit Co-operative Society Ltd. — Banking Management System
- **Started**: 2026-10-28
- **Stack**: React 18 + MUI + Vite (frontend), Express + TypeScript (backend), PostgreSQL 16, Redis
- **DB Name**: `bccs_dev` on localhost:5432, user `bccs_dev`

## Phase Status
- [x] Phase 1: Discovery & Architecture — completed 2026-10-28
- [x] Phase 2: Foundation — completed 2026-10-28
  - Project structure (monorepo: shared, backend, frontend, database)
  - PostgreSQL schema: 12 migrations (branches, roles, permissions, staff, audit, config, members, accounts, ledger, transactions, loans, expenses)
  - Auth system: JWT access + refresh tokens, RBAC with 9 roles and 27 permissions
  - Backend: Express with auth, staff, branches, audit modules
  - Frontend: React + MUI with login page, dashboard, navigation sidebar (navy + gold theme)
  - Admin seed: username `admin`, password `Admin@1234`
  - All 32 unit tests passing
- [x] Phase 3: Membership & Accounts — completed 2026-10-28
  - Members: create, approve (auto-generates BCCS-YYYY-NNNNN), reject, update, list with search/filter
  - Accounts: create, approve (auto-generates account number), close (requires zero balance), list by member
  - 5 seeded account products: SAV001, FD001, FD002, RD001, SHR001
- [x] Phase 4: Ledger & Transactions — completed 2026-10-28
  - Transactions: create with idempotency key, maker-checker for amounts >= ₹10,000
  - Double-entry journal entries: every posted transaction creates balanced debit/credit lines
  - GL accounts: Cash (1000), Savings (2100), FD (2200), RD (2300), Loans (2500), etc.
  - Transaction authorization: separate authorizer required (cannot self-approve)
  - Reversals: create reversal entries with opposite journal entries
  - SELECT FOR UPDATE on balance reads to prevent race conditions
  - Passbook: paginated transaction history per account with running balance
  - Statement: date-range statement with opening/closing balance, totals
  - Dashboard: live stats (members, accounts, balances, pending auths, today's volume)
  - Ledger summary with trial balance verification (isBalanced = true)
  - Config management: view and update system configuration
- [~] Phase 5: Loans & Expenses — backend modules created (by background agent)
- [ ] Phase 6: Notifications & Reports
- [ ] Phase 7: Hardening

## Frontend Pages (Phase 3-4)
- Dashboard: live stats from API, quick actions
- Members: list (search/filter), create form, detail page with approve/reject
- Accounts: list (search/filter), create (member lookup + product picker), detail
- Transactions: list, new transaction form (account lookup + amount + method)
- Passbook: per-account passbook view

## Key Decisions
- **Role storage**: VARCHAR on staff_users (not normalized FK to roles table) — roles defined in code via ROLE_PERMISSIONS constant
- **Monetary values**: Integer paise (1 rupee = 100 paise), no floating point
- **Account numbers**: Configurable prefix, sequential — format stored in system_configuration
- **Maker-checker threshold**: ₹10,000 (configurable in system_configuration)
- **Fiscal year**: April–March (configurable)
- **Journal entries**: Auto-created on transaction posting, mapped by product type → GL account
- **Transaction types**: cash_deposit, cash_withdrawal, loan_disbursement, loan_repayment, interest_posting, fee_charge, reversal

## E2E Verified Flow
Member create → approve → account create → approve → deposit (₹5K posted, ₹15K pending maker-checker) → dashboard shows correct stats → trial balance balanced

## Running the System
```bash
cd /Users/dikshant/Banking-Software
# Start PostgreSQL: brew services start postgresql@16
# Redis is already running
npm run dev:backend   # http://localhost:3000
npm run dev:frontend  # http://localhost:5173
npm run db:migrate    # Run pending migrations
npm run db:seed       # Seed admin + products
```

## Open Questions for Society
1. Exact account types and interest rates
2. Loan products and interest calculation methods
3. KYC requirements (which documents mandatory)
4. SMS/WhatsApp notification provider
5. Branch structure (single vs multi)
6. Society registration details
