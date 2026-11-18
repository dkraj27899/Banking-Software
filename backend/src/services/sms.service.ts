import { env } from '../config/env.js';

const SOCIETY_NAME = 'Bhagwati Credit Co-op Society';
const MSG91_API = 'https://control.msg91.com/api/v5/flow/';

function formatRupees(paise: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(paise / 100);
}

function formatMobile(to: string): string {
  const cleaned = to.replace(/\D/g, '').replace(/^0+/, '');
  return cleaned.startsWith('91') ? cleaned : `91${cleaned}`;
}

async function send(to: string, body: string): Promise<void> {
  if (env.SMS_ENABLED !== 'true' || !env.MSG91_AUTH_KEY) {
    console.log(`[SMS-DISABLED] To: ${to}\n${body}`);
    return;
  }

  const mobile = formatMobile(to);

  try {
    const res = await fetch('https://control.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: {
        'authkey': env.MSG91_AUTH_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        template_id: env.MSG91_TEMPLATE_ID,
        short_url: '0',
        recipients: [
          {
            mobiles: mobile,
            message: body,
          },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[SMS-ERROR] MSG91 response ${res.status}: ${text}`);
    }
  } catch (err) {
    console.error(`[SMS-ERROR] Failed to send to ${mobile}:`, err);
  }
}

export function sendMemberRegistered(mobile: string, memberName: string, membershipNumber: string): void {
  const msg =
    `Dear ${memberName}, welcome to ${SOCIETY_NAME}! ` +
    `Your membership (${membershipNumber}) has been registered successfully. ` +
    `Visit your nearest branch for account opening.`;
  void send(mobile, msg);
}

export function sendAccountOpened(mobile: string, memberName: string, accountNumber: string, productName: string): void {
  const msg =
    `Dear ${memberName}, your ${productName} A/C ${accountNumber} has been opened successfully at ${SOCIETY_NAME}. ` +
    `Visit your nearest branch for any queries.`;
  void send(mobile, msg);
}

export function sendDeposit(mobile: string, memberName: string, accountNumber: string, amountPaise: number, balancePaise: number): void {
  const msg =
    `Dear ${memberName}, Rs.${formatRupees(amountPaise)} credited to your A/C ${accountNumber}. ` +
    `Available Bal: ${formatRupees(balancePaise)}. ` +
    `- ${SOCIETY_NAME}`;
  void send(mobile, msg);
}

export function sendWithdrawal(mobile: string, memberName: string, accountNumber: string, amountPaise: number, balancePaise: number): void {
  const msg =
    `Dear ${memberName}, Rs.${formatRupees(amountPaise)} debited from your A/C ${accountNumber}. ` +
    `Available Bal: ${formatRupees(balancePaise)}. ` +
    `- ${SOCIETY_NAME}`;
  void send(mobile, msg);
}

export function sendAccountClosed(mobile: string, memberName: string, accountNumber: string): void {
  const msg =
    `Dear ${memberName}, your A/C ${accountNumber} has been closed at ${SOCIETY_NAME}. ` +
    `Thank you for banking with us.`;
  void send(mobile, msg);
}

export function sendTransactionAuthorized(mobile: string, memberName: string, accountNumber: string, txnNumber: string, amountPaise: number): void {
  const msg =
    `Dear ${memberName}, your transaction ${txnNumber} of ${formatRupees(amountPaise)} on A/C ${accountNumber} has been approved. ` +
    `- ${SOCIETY_NAME}`;
  void send(mobile, msg);
}
