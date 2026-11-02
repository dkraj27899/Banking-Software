export function assertInteger(value: number, label: string): void {
  if (!Number.isInteger(value)) {
    throw new Error(`${label} must be an integer (got ${value})`);
  }
}

export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function toRupees(paise: number): number {
  assertInteger(paise, 'paise');
  return Number((paise / 100).toFixed(2));
}

export function addPaise(a: number, b: number): number {
  assertInteger(a, 'a');
  assertInteger(b, 'b');
  return a + b;
}

export function subtractPaise(a: number, b: number): number {
  assertInteger(a, 'a');
  assertInteger(b, 'b');
  return a - b;
}

export function formatINR(paise: number): string {
  assertInteger(paise, 'paise');
  const rupees = toRupees(paise);
  const [whole, decimal] = rupees.toFixed(2).split('.');

  // Indian grouping: last 3 digits, then groups of 2
  const isNegative = whole!.startsWith('-');
  const absWhole = isNegative ? whole!.slice(1) : whole!;

  let formatted: string;
  if (absWhole.length <= 3) {
    formatted = absWhole;
  } else {
    const last3 = absWhole.slice(-3);
    const remaining = absWhole.slice(0, -3);
    const groups: string[] = [];
    for (let i = remaining.length; i > 0; i -= 2) {
      groups.unshift(remaining.slice(Math.max(0, i - 2), i));
    }
    formatted = groups.join(',') + ',' + last3;
  }

  return (isNegative ? '-' : '') + '₹' + formatted + '.' + decimal;
}
