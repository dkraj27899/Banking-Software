import { query } from '../../config/database.js';
import { logger } from '../../utils/logger.js';

const DEFAULT_PRODUCTS = [
  { code: 'SAV001', name: 'Regular Savings Account', accountType: 'savings', minBalancePaise: 100000, interestRateBps: 400 },
  { code: 'FD001', name: 'Fixed Deposit (1 Year)', accountType: 'fixed_deposit', minBalancePaise: 500000, interestRateBps: 700 },
  { code: 'FD002', name: 'Fixed Deposit (3 Year)', accountType: 'fixed_deposit', minBalancePaise: 500000, interestRateBps: 800 },
  { code: 'RD001', name: 'Regular Recurring Deposit', accountType: 'recurring_deposit', minBalancePaise: 50000, interestRateBps: 650 },
  { code: 'SHR001', name: 'Share Capital', accountType: 'share_capital', minBalancePaise: 0, interestRateBps: 0 },
];

export async function seedProducts() {
  for (const p of DEFAULT_PRODUCTS) {
    const existing = await query<{ id: string }>(
      `SELECT id FROM account_products WHERE code = $1`, [p.code],
    );
    if (existing.rows.length === 0) {
      await query(
        `INSERT INTO account_products (code, name, account_type, min_balance_paise, interest_rate_bps)
         VALUES ($1,$2,$3,$4,$5)`,
        [p.code, p.name, p.accountType, p.minBalancePaise, p.interestRateBps],
      );
      logger.info(`Seeded account product: ${p.code} — ${p.name}`);
    }
  }
}
