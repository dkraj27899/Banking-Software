import twilio from 'twilio';
import { env } from '../config/env.js';

const client =
  env.SMS_ENABLED === 'true' && env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN
    ? twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN)
    : null;

const from = env.TWILIO_PHONE_NUMBER ?? '';
const SOCIETY_NAME = 'Bhagwati Credit Co-op';

function formatRupees(paise: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(paise / 100);
}

async function send(to: string, body: string): Promise<void> {
  if (!client) {
    console.log(`[SMS-DISABLED] To: ${to}\n${body}`);
    return;
  }
  const mobile = to.startsWith('+') ? to : `+91${to.replace(/^0+/, '')}`;
  try {
    await client.messages.create({ from, to: mobile, body });
  } catch (err) {
    console.error(`[SMS-ERROR] Failed to send to ${mobile}:`, err);
  }
}

export function sendAccountOpened(mobile: string, memberName: string, accountNumber: string, productName: string): void {
  const msg =
    `Dear ${memberName}, your ${productName} A/C ${accountNumber} has been opened successfully at ${SOCIETY_NAME}. ` +
    `Visit your nearest branch for any queries.`;
  void send(mobile, msg);
}

export function sendDeposit(mobile: string, memberName: string, accountNumber: string, amountPaise: number, balancePaise: number): void {
  const msg =
    `Dear ${memberName}, ${formatRupees(amountPaise)} credited to your A/C ${accountNumber}. ` +
    `Available balance: ${formatRupees(balancePaise)}. ` +
    `- ${SOCIETY_NAME}`;
  void send(mobile, msg);
}

export function sendWithdrawal(mobile: string, memberName: string, accountNumber: string, amountPaise: number, balancePaise: number): void {
  const msg =
    `Dear ${memberName}, ${formatRupees(amountPaise)} debited from your A/C ${accountNumber}. ` +
    `Available balance: ${formatRupees(balancePaise)}. ` +
    `- ${SOCIETY_NAME}`;
  void send(mobile, msg);
}

export function sendAccountClosed(mobile: string, memberName: string, accountNumber: string): void {
  const msg =
    `Dear ${memberName}, your A/C ${accountNumber} has been closed at ${SOCIETY_NAME}. ` +
    `Thank you for banking with us.`;
  void send(mobile, msg);
}
