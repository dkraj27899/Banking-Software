CREATE TABLE chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('asset','liability','equity','income','expense')),
  parent_id UUID REFERENCES chart_of_accounts(id),
  is_header BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  normal_balance VARCHAR(10) NOT NULL CHECK (normal_balance IN ('debit','credit')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE accounting_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  closed_by UUID REFERENCES staff_users(id),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT no_overlap EXCLUDE USING gist (daterange(start_date, end_date, '[]') WITH &&)
);

CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_number VARCHAR(30) NOT NULL UNIQUE,
  entry_date DATE NOT NULL,
  description TEXT NOT NULL,
  reference_type VARCHAR(50),
  reference_id UUID,
  period_id UUID NOT NULL REFERENCES accounting_periods(id),
  is_reversal BOOLEAN NOT NULL DEFAULT false,
  reversal_of UUID REFERENCES journal_entries(id),
  posted_by UUID NOT NULL REFERENCES staff_users(id),
  posted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE journal_entry_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id UUID NOT NULL REFERENCES journal_entries(id),
  account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
  debit_paise BIGINT NOT NULL DEFAULT 0 CHECK (debit_paise >= 0),
  credit_paise BIGINT NOT NULL DEFAULT 0 CHECK (credit_paise >= 0),
  description TEXT,
  CONSTRAINT debit_or_credit CHECK (
    (debit_paise > 0 AND credit_paise = 0) OR (debit_paise = 0 AND credit_paise > 0)
  )
);

CREATE INDEX idx_je_entry_date ON journal_entries(entry_date);
CREATE INDEX idx_je_reference ON journal_entries(reference_type, reference_id);
CREATE INDEX idx_jel_account ON journal_entry_lines(account_id);
CREATE INDEX idx_jel_journal ON journal_entry_lines(journal_entry_id);

-- Default chart of accounts (header accounts first, then children)
INSERT INTO chart_of_accounts (code, name, account_type, is_header, normal_balance, description) VALUES
  ('1000', 'Cash',                     'asset',     false, 'debit',  'Cash on hand at branches'),
  ('1100', 'Bank Account',             'asset',     false, 'debit',  'Society bank account balances'),
  ('2000', 'Member Deposits',          'liability', true,  'credit', 'Header for all deposit liabilities'),
  ('2500', 'Loan Principal Outstanding','asset',    false, 'debit',  'Outstanding loan principal receivable'),
  ('3000', 'Share Capital',            'equity',    false, 'credit', 'Member share capital contributions'),
  ('4000', 'Interest Income',          'income',    true,  'credit', 'Header for interest income'),
  ('4200', 'Fee Income',               'income',    false, 'credit', 'Processing fees, penalties, charges'),
  ('5000', 'Interest Expense',         'expense',   true,  'debit',  'Header for interest expense'),
  ('5200', 'Operating Expenses',       'expense',   true,  'debit',  'Header for operating expenses');

-- Child accounts referencing parents
INSERT INTO chart_of_accounts (code, name, account_type, parent_id, is_header, normal_balance, description)
SELECT '2100', 'Savings Deposits', 'liability', id, false, 'credit', 'Savings account deposit liability'
FROM chart_of_accounts WHERE code = '2000';

INSERT INTO chart_of_accounts (code, name, account_type, parent_id, is_header, normal_balance, description)
SELECT '2200', 'Fixed Deposits', 'liability', id, false, 'credit', 'Fixed deposit liability'
FROM chart_of_accounts WHERE code = '2000';

INSERT INTO chart_of_accounts (code, name, account_type, parent_id, is_header, normal_balance, description)
SELECT '2300', 'Recurring Deposits', 'liability', id, false, 'credit', 'Recurring deposit liability'
FROM chart_of_accounts WHERE code = '2000';

INSERT INTO chart_of_accounts (code, name, account_type, parent_id, is_header, normal_balance, description)
SELECT '4100', 'Interest on Loans', 'income', id, false, 'credit', 'Interest earned on member loans'
FROM chart_of_accounts WHERE code = '4000';

INSERT INTO chart_of_accounts (code, name, account_type, parent_id, is_header, normal_balance, description)
SELECT '5100', 'Interest on Deposits', 'expense', id, false, 'debit', 'Interest paid on member deposits'
FROM chart_of_accounts WHERE code = '5000';

INSERT INTO chart_of_accounts (code, name, account_type, parent_id, is_header, normal_balance, description)
SELECT '5210', 'Salaries', 'expense', id, false, 'debit', 'Staff salaries and wages'
FROM chart_of_accounts WHERE code = '5200';

INSERT INTO chart_of_accounts (code, name, account_type, parent_id, is_header, normal_balance, description)
SELECT '5220', 'Rent', 'expense', id, false, 'debit', 'Office and branch rent'
FROM chart_of_accounts WHERE code = '5200';

INSERT INTO chart_of_accounts (code, name, account_type, parent_id, is_header, normal_balance, description)
SELECT '5230', 'Office Expenses', 'expense', id, false, 'debit', 'Stationery, utilities, miscellaneous'
FROM chart_of_accounts WHERE code = '5200';
