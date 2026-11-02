CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_number VARCHAR(30) NOT NULL UNIQUE,
  account_id UUID NOT NULL REFERENCES accounts(id),
  transaction_type VARCHAR(30) NOT NULL,
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  balance_after_paise BIGINT,
  payment_method VARCHAR(20),
  reference_number VARCHAR(100),
  description TEXT,
  idempotency_key VARCHAR(100) UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','authorized','posted','reversed','failed')),
  journal_entry_id UUID REFERENCES journal_entries(id),
  reversal_of UUID REFERENCES transactions(id),
  reversed_by UUID REFERENCES transactions(id),
  entered_by UUID NOT NULL REFERENCES staff_users(id),
  authorized_by UUID REFERENCES staff_users(id),
  authorized_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  branch_id UUID NOT NULL REFERENCES branches(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_txn_account ON transactions(account_id);
CREATE INDEX idx_txn_number ON transactions(transaction_number);
CREATE INDEX idx_txn_status ON transactions(status);
CREATE INDEX idx_txn_date ON transactions(created_at DESC);
CREATE INDEX idx_txn_branch ON transactions(branch_id);
CREATE INDEX idx_txn_idempotency ON transactions(idempotency_key);

CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number VARCHAR(30) NOT NULL UNIQUE,
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  generated_by UUID NOT NULL REFERENCES staff_users(id)
);
