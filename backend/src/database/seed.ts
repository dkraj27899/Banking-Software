import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 12;
const DEFAULT_ADMIN = {
  username: 'admin',
  password: 'Admin@1234',
  fullName: 'System Administrator',
  email: 'admin@bccs.local',
  mobile: '9999999999',
  role: 'super_admin',
};

async function seed(): Promise<void> {
  const connectionString = process.env['DATABASE_URL'] ?? 'postgresql://bccs_dev:bccs_dev_password@localhost:5432/bccs_dev';
  const pool = new Pool({ connectionString });

  try {
    const branchResult = await pool.query<{ id: string }>(
      "SELECT id FROM branches WHERE code = 'BR01'",
    );

    if (branchResult.rows.length === 0) {
      console.error("Default branch 'BR01' not found. Run migrations first.");
      process.exit(1);
    }

    const branchId = branchResult.rows[0]!.id;

    const existing = await pool.query(
      'SELECT id FROM staff_users WHERE username = $1',
      [DEFAULT_ADMIN.username],
    );

    if (existing.rows.length > 0) {
      console.log(`Admin user '${DEFAULT_ADMIN.username}' already exists — skipping.`);
    } else {
      const passwordHash = await bcrypt.hash(DEFAULT_ADMIN.password, BCRYPT_ROUNDS);

      await pool.query(
        `INSERT INTO staff_users (username, password_hash, full_name, email, mobile, role, branch_id, must_change_password)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
        [
          DEFAULT_ADMIN.username,
          passwordHash,
          DEFAULT_ADMIN.fullName,
          DEFAULT_ADMIN.email,
          DEFAULT_ADMIN.mobile,
          DEFAULT_ADMIN.role,
          branchId,
        ],
      );

      console.log(`Created admin user '${DEFAULT_ADMIN.username}' (password: ${DEFAULT_ADMIN.password}).`);
      console.log('IMPORTANT: Change this password on first login.');
    }

    // Seed demo staff users
    const demoUsers = [
      { username: 'manager', password: 'Manager@123', fullName: 'Branch Manager', email: 'manager@bccs.local', mobile: '9999999998', role: 'branch_admin' },
      { username: 'cashier1', password: 'Cashier@123', fullName: 'Ramesh Kumar', email: 'ramesh@bccs.local', mobile: '9999999997', role: 'cashier' },
      { username: 'cashier2', password: 'Cashier@123', fullName: 'Suresh Sharma', email: 'suresh@bccs.local', mobile: '9999999996', role: 'cashier' },
    ];

    for (const u of demoUsers) {
      const ex = await pool.query('SELECT id FROM staff_users WHERE username = $1', [u.username]);
      if (ex.rows.length === 0) {
        const hash = await bcrypt.hash(u.password, BCRYPT_ROUNDS);
        await pool.query(
          `INSERT INTO staff_users (username, password_hash, full_name, email, mobile, role, branch_id, must_change_password)
           VALUES ($1, $2, $3, $4, $5, $6, $7, false)`,
          [u.username, hash, u.fullName, u.email, u.mobile, u.role, branchId],
        );
        console.log(`Created demo user '${u.username}' (${u.role}).`);
      }
    }

    // Seed default account products
    const products = [
      { code: 'SAV001', name: 'Regular Savings Account', type: 'savings', minBal: 100000, rate: 400 },
      { code: 'FD001', name: 'Fixed Deposit (1 Year)', type: 'fixed_deposit', minBal: 500000, rate: 700 },
      { code: 'FD002', name: 'Fixed Deposit (3 Year)', type: 'fixed_deposit', minBal: 500000, rate: 800 },
      { code: 'RD001', name: 'Regular Recurring Deposit', type: 'recurring_deposit', minBal: 50000, rate: 650 },
      { code: 'SHR001', name: 'Share Capital', type: 'share_capital', minBal: 0, rate: 0 },
    ];

    for (const p of products) {
      const exists = await pool.query('SELECT id FROM account_products WHERE code = $1', [p.code]);
      if (exists.rows.length === 0) {
        await pool.query(
          `INSERT INTO account_products (code, name, account_type, min_balance_paise, interest_rate_bps) VALUES ($1,$2,$3,$4,$5)`,
          [p.code, p.name, p.type, p.minBal, p.rate],
        );
        console.log(`Seeded product: ${p.code} — ${p.name}`);
      }
    }
  } finally {
    await pool.end();
  }
}

const isMain = process.argv[1] && (
  process.argv[1].endsWith('/seed.ts') ||
  process.argv[1].endsWith('/seed.js')
);

if (isMain) {
  console.log('Seeding database...');
  seed()
    .then(() => {
      console.log('Seed complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}

export { seed };
