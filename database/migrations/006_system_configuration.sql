CREATE TABLE system_configuration (
  key VARCHAR(200) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  module VARCHAR(50) NOT NULL DEFAULT 'system',
  updated_by UUID REFERENCES staff_users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO system_configuration (key, value, description, module) VALUES
  ('society_name',                '"Bhagwati Credit Co-operative Society Ltd."', 'Full legal name of the society',              'system'),
  ('society_short_name',          '"BCCS"',                                      'Short name / abbreviation',                   'system'),
  ('membership_number_prefix',    '"BCCS"',                                      'Prefix for generated membership numbers',     'member'),
  ('account_number_prefix',       '"BR01"',                                      'Prefix for generated account numbers',        'account'),
  ('fiscal_year_start_month',     '4',                                           'Month number when fiscal year starts (April)', 'accounting'),
  ('maker_checker_threshold_paise','1000000',                                    'Transaction amount (paise) above which maker-checker is required (₹10,000)', 'transaction'),
  ('max_failed_login_attempts',   '5',                                           'Lock account after this many consecutive failures', 'auth'),
  ('account_lock_duration_minutes','30',                                         'Minutes to lock an account after max failed attempts', 'auth'),
  ('password_expiry_days',        '90',                                          'Days after which a password change is required', 'auth');
