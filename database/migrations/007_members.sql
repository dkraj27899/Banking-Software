CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_number VARCHAR(20) UNIQUE,
  full_name VARCHAR(200) NOT NULL,
  father_guardian_name VARCHAR(200),
  date_of_birth DATE,
  gender VARCHAR(10),
  address_line1 TEXT NOT NULL DEFAULT '',
  address_line2 TEXT,
  city VARCHAR(100) NOT NULL DEFAULT '',
  state VARCHAR(100) NOT NULL DEFAULT '',
  pincode VARCHAR(6) NOT NULL DEFAULT '',
  mobile VARCHAR(15) NOT NULL,
  email VARCHAR(200),
  aadhaar_last4 VARCHAR(4),
  aadhaar_verified BOOLEAN NOT NULL DEFAULT false,
  pan_number_encrypted BYTEA,
  pan_verified BOOLEAN NOT NULL DEFAULT false,
  membership_type VARCHAR(50) NOT NULL DEFAULT 'individual',
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','inactive','rejected')),
  application_date DATE NOT NULL DEFAULT CURRENT_DATE,
  approval_date DATE,
  approved_by UUID REFERENCES staff_users(id),
  rejection_reason TEXT,
  branch_id UUID NOT NULL REFERENCES branches(id),
  created_by UUID NOT NULL REFERENCES staff_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_members_membership_number ON members(membership_number);
CREATE INDEX idx_members_mobile ON members(mobile);
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_branch ON members(branch_id);
CREATE INDEX idx_members_name ON members(full_name);
