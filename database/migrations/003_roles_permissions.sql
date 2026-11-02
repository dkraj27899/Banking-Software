CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  module VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Roles
INSERT INTO roles (code, name, description, is_system) VALUES
  ('super_admin',          'Super Administrator',   'Full system access',                              true),
  ('branch_admin',         'Branch Administrator',  'Branch-scoped staff and operations management',   true),
  ('membership_operator',  'Membership Operator',   'Create and edit membership applications',         true),
  ('accountant',           'Accountant',            'Post transactions, manage ledger, run reports',   true),
  ('cashier',              'Cashier',               'Enter deposits and withdrawals',                  true),
  ('loan_officer',         'Loan Officer',          'Create loan applications, assess eligibility',    true),
  ('loan_approver',        'Loan Approver',         'Approve or reject loan applications',             true),
  ('auditor',              'Auditor',               'Read-only access to all data and audit logs',     true),
  ('readonly_manager',     'Read-Only Manager',     'Dashboard and reports only',                      true);

-- Permissions
INSERT INTO permissions (code, name, module) VALUES
  ('member:create',        'Create Member',              'member'),
  ('member:read',          'View Members',               'member'),
  ('member:update',        'Update Member',              'member'),
  ('member:approve',       'Approve Membership',         'member'),
  ('account:create',       'Create Account',             'account'),
  ('account:read',         'View Accounts',              'account'),
  ('account:update',       'Update Account',             'account'),
  ('account:close',        'Close Account',              'account'),
  ('transaction:create',   'Create Transaction',         'transaction'),
  ('transaction:read',     'View Transactions',          'transaction'),
  ('transaction:authorize','Authorize Transaction',      'transaction'),
  ('transaction:reverse',  'Reverse Transaction',        'transaction'),
  ('loan:create',          'Create Loan Application',    'loan'),
  ('loan:read',            'View Loans',                 'loan'),
  ('loan:approve',         'Approve Loan',               'loan'),
  ('loan:disburse',        'Disburse Loan',              'loan'),
  ('expense:create',       'Create Expense',             'expense'),
  ('expense:read',         'View Expenses',              'expense'),
  ('expense:approve',      'Approve Expense',            'expense'),
  ('ledger:read',          'View Ledger',                'ledger'),
  ('report:read',          'View Reports',               'report'),
  ('reconciliation:run',   'Run Reconciliation',         'reconciliation'),
  ('staff:manage',         'Manage Staff',               'staff'),
  ('branch:manage',        'Manage Branches',            'branch'),
  ('config:manage',        'Manage Configuration',       'config'),
  ('audit:read',           'View Audit Logs',            'audit'),
  ('notification:read',    'View Notifications',         'notification');

-- Role-permission mappings

-- super_admin: all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'super_admin';

-- branch_admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'branch_admin'
  AND p.code IN (
    'member:create','member:read','member:update','member:approve',
    'account:create','account:read','account:update','account:close',
    'transaction:create','transaction:read','transaction:authorize','transaction:reverse',
    'loan:create','loan:read','loan:approve','loan:disburse',
    'expense:create','expense:read','expense:approve',
    'ledger:read','report:read','reconciliation:run',
    'staff:manage','audit:read','notification:read'
  );

-- membership_operator
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'membership_operator'
  AND p.code IN (
    'member:create','member:read','member:update',
    'account:read'
  );

-- accountant
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'accountant'
  AND p.code IN (
    'member:read','account:read',
    'transaction:create','transaction:read','transaction:authorize','transaction:reverse',
    'ledger:read','report:read','reconciliation:run',
    'expense:read','expense:approve'
  );

-- cashier
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'cashier'
  AND p.code IN (
    'member:read','account:read',
    'transaction:create','transaction:read'
  );

-- loan_officer
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'loan_officer'
  AND p.code IN (
    'member:read','account:read',
    'loan:create','loan:read'
  );

-- loan_approver
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'loan_approver'
  AND p.code IN (
    'member:read','account:read',
    'loan:read','loan:approve','loan:disburse'
  );

-- auditor
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'auditor'
  AND p.code IN (
    'member:read','account:read',
    'transaction:read','loan:read','expense:read',
    'ledger:read','report:read','reconciliation:run',
    'audit:read','notification:read'
  );

-- readonly_manager
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'readonly_manager'
  AND p.code IN (
    'member:read','account:read',
    'transaction:read','loan:read','expense:read',
    'ledger:read','report:read'
  );
