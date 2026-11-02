CREATE TABLE loan_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  min_amount_paise BIGINT NOT NULL DEFAULT 0,
  max_amount_paise BIGINT NOT NULL DEFAULT 0,
  interest_rate_bps INTEGER NOT NULL,
  interest_type VARCHAR(20) NOT NULL DEFAULT 'reducing' CHECK (interest_type IN ('flat','reducing')),
  max_tenure_months INTEGER NOT NULL DEFAULT 60,
  processing_fee_bps INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE loan_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_number VARCHAR(30) NOT NULL UNIQUE,
  member_id UUID NOT NULL REFERENCES members(id),
  account_id UUID NOT NULL REFERENCES accounts(id),
  product_id UUID NOT NULL REFERENCES loan_products(id),
  requested_amount_paise BIGINT NOT NULL CHECK (requested_amount_paise > 0),
  approved_amount_paise BIGINT,
  tenure_months INTEGER NOT NULL,
  purpose TEXT,
  guarantor_name VARCHAR(200),
  guarantor_member_id UUID REFERENCES members(id),
  collateral_description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','disbursed','closed','cancelled')),
  applied_by UUID NOT NULL REFERENCES staff_users(id),
  approved_by UUID REFERENCES staff_users(id),
  approved_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES staff_users(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_number VARCHAR(30) NOT NULL UNIQUE,
  application_id UUID NOT NULL UNIQUE REFERENCES loan_applications(id),
  member_id UUID NOT NULL REFERENCES members(id),
  account_id UUID NOT NULL REFERENCES accounts(id),
  product_id UUID NOT NULL REFERENCES loan_products(id),
  principal_paise BIGINT NOT NULL,
  interest_rate_bps INTEGER NOT NULL,
  interest_type VARCHAR(20) NOT NULL,
  tenure_months INTEGER NOT NULL,
  emi_paise BIGINT NOT NULL,
  total_interest_paise BIGINT NOT NULL,
  outstanding_principal_paise BIGINT NOT NULL,
  outstanding_interest_paise BIGINT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','closed','written_off')),
  disbursed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  disbursed_by UUID NOT NULL REFERENCES staff_users(id),
  next_due_date DATE,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE repayment_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES loans(id),
  installment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  principal_paise BIGINT NOT NULL,
  interest_paise BIGINT NOT NULL,
  total_paise BIGINT NOT NULL,
  paid_paise BIGINT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming','due','paid','partial','overdue')),
  paid_at TIMESTAMPTZ,
  UNIQUE(loan_id, installment_number)
);

CREATE TABLE loan_repayments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES loans(id),
  schedule_id UUID REFERENCES repayment_schedules(id),
  transaction_id UUID REFERENCES transactions(id),
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  principal_component_paise BIGINT NOT NULL DEFAULT 0,
  interest_component_paise BIGINT NOT NULL DEFAULT 0,
  received_by UUID NOT NULL REFERENCES staff_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_loan_apps_member ON loan_applications(member_id);
CREATE INDEX idx_loan_apps_status ON loan_applications(status);
CREATE INDEX idx_loans_member ON loans(member_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_repayment_schedule_loan ON repayment_schedules(loan_id);
CREATE INDEX idx_repayment_schedule_due ON repayment_schedules(due_date);
CREATE INDEX idx_loan_repayments_loan ON loan_repayments(loan_id);

-- Default loan products
INSERT INTO loan_products (code, name, description, min_amount_paise, max_amount_paise, interest_rate_bps, interest_type, max_tenure_months, processing_fee_bps) VALUES
  ('PL01', 'Personal Loan', 'General purpose personal loan for members', 5000000, 50000000, 1200, 'reducing', 60, 100),
  ('GL01', 'Gold Loan', 'Loan against gold ornaments', 1000000, 100000000, 900, 'reducing', 36, 50),
  ('EL01', 'Emergency Loan', 'Short-term emergency loan for members', 500000, 10000000, 1500, 'flat', 12, 0);
