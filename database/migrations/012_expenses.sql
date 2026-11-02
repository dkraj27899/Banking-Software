CREATE TABLE expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  gl_account_id UUID REFERENCES chart_of_accounts(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_number VARCHAR(30) NOT NULL UNIQUE,
  category_id UUID NOT NULL REFERENCES expense_categories(id),
  description TEXT NOT NULL,
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  expense_date DATE NOT NULL,
  payment_method VARCHAR(20) NOT NULL DEFAULT 'cash',
  payee VARCHAR(200),
  invoice_reference VARCHAR(100),
  branch_id UUID NOT NULL REFERENCES branches(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','paid')),
  journal_entry_id UUID REFERENCES journal_entries(id),
  created_by UUID NOT NULL REFERENCES staff_users(id),
  approved_by UUID REFERENCES staff_users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_branch ON expenses(branch_id);
CREATE INDEX idx_expenses_category ON expenses(category_id);

-- Default expense categories mapped to chart of accounts
INSERT INTO expense_categories (code, name, gl_account_id)
  SELECT 'SAL', 'Salaries & Wages', id FROM chart_of_accounts WHERE code = '5210';
INSERT INTO expense_categories (code, name, gl_account_id)
  SELECT 'RENT', 'Rent', id FROM chart_of_accounts WHERE code = '5220';
INSERT INTO expense_categories (code, name, gl_account_id)
  SELECT 'OFFICE', 'Office & Stationery', id FROM chart_of_accounts WHERE code = '5230';
INSERT INTO expense_categories (code, name, gl_account_id)
  SELECT 'UTIL', 'Utilities', id FROM chart_of_accounts WHERE code = '5230';
INSERT INTO expense_categories (code, name, gl_account_id)
  SELECT 'TRAVEL', 'Travel & Conveyance', id FROM chart_of_accounts WHERE code = '5230';
INSERT INTO expense_categories (code, name, gl_account_id)
  SELECT 'MISC', 'Miscellaneous', id FROM chart_of_accounts WHERE code = '5200';
