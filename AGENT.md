# Banking Software — Agent Configuration

## Project Context
Cooperative banking management system for Bhagwati Credit Co-operative Society Ltd.
This is a financial system — correctness, security, and auditability are paramount.

## Coding Standards
- TypeScript strict mode everywhere
- All monetary values as integer paise (never floating-point)
- Parameterized SQL queries only (never string interpolation)
- Never log passwords, tokens, or PII (Aadhaar, PAN)
- Every financial operation must produce balanced journal entries
- Posted transactions are immutable — corrections via reversal entries only
- Maker-checker for sensitive operations above configured threshold

## Architecture
- Monorepo: `/shared` (types + schemas), `/backend` (Express), `/frontend` (React + MUI), `/database` (migrations)
- Backend modules by domain: auth, staff, branches, audit, members, accounts, transactions, ledger, loans, expenses, notifications, reports
- RBAC: 9 roles, 27 permissions, checked via middleware
- Double-entry ledger: every transaction creates balanced journal entries

## Do NOT
- Use floating-point for money
- Skip audit logging on financial operations
- Allow self-approval on maker-checker operations
- Hardcode interest rates or business rules
- Expose full Aadhaar/PAN in UI, logs, or notifications
- Silently delete posted financial records
- Trust client-side authorization
