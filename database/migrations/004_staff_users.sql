CREATE TABLE staff_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  email VARCHAR(200) NOT NULL,
  mobile VARCHAR(15) NOT NULL,
  role VARCHAR(30) NOT NULL CHECK (role IN (
    'super_admin', 'branch_admin', 'membership_operator',
    'accountant', 'cashier', 'loan_officer',
    'loan_approver', 'auditor', 'readonly_manager'
  )),
  branch_id UUID NOT NULL REFERENCES branches(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  must_change_password BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES staff_users(id)
);

CREATE INDEX idx_staff_users_role ON staff_users(role);
CREATE INDEX idx_staff_users_branch ON staff_users(branch_id);
CREATE INDEX idx_staff_users_username ON staff_users(username);
