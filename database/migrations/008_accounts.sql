CREATE TABLE account_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  account_type VARCHAR(50) NOT NULL,
  min_balance_paise BIGINT NOT NULL DEFAULT 0,
  interest_rate_bps INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  rules JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_number VARCHAR(20) UNIQUE,
  member_id UUID NOT NULL REFERENCES members(id),
  product_id UUID NOT NULL REFERENCES account_products(id),
  branch_id UUID NOT NULL REFERENCES branches(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','suspended','closed')),
  balance_paise BIGINT NOT NULL DEFAULT 0,
  opened_at DATE,
  closed_at DATE,
  closure_reason TEXT,
  created_by UUID NOT NULL REFERENCES staff_users(id),
  approved_by UUID REFERENCES staff_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_accounts_member ON accounts(member_id);
CREATE INDEX idx_accounts_number ON accounts(account_number);
CREATE INDEX idx_accounts_status ON accounts(status);
CREATE INDEX idx_accounts_branch ON accounts(branch_id);
CREATE INDEX idx_accounts_product ON accounts(product_id);
