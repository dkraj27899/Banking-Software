import { describe, it, expect } from 'vitest';
import { toPaise, toRupees, addPaise, subtractPaise, formatINR } from '../utils/money.js';

describe('toPaise', () => {
  it('converts whole rupees', () => {
    expect(toPaise(100)).toBe(10000);
  });

  it('converts rupees with paise', () => {
    expect(toPaise(99.99)).toBe(9999);
  });

  it('rounds fractional paise', () => {
    expect(toPaise(10.005)).toBe(1001);
    expect(toPaise(10.004)).toBe(1000);
  });

  it('handles zero', () => {
    expect(toPaise(0)).toBe(0);
  });

  it('handles negative', () => {
    expect(toPaise(-50.50)).toBe(-5050);
  });
});

describe('toRupees', () => {
  it('converts paise to rupees', () => {
    expect(toRupees(10000)).toBe(100);
  });

  it('preserves two decimal places', () => {
    expect(toRupees(9999)).toBe(99.99);
  });

  it('handles zero', () => {
    expect(toRupees(0)).toBe(0);
  });

  it('throws on non-integer', () => {
    expect(() => toRupees(100.5)).toThrow('must be an integer');
  });
});

describe('addPaise', () => {
  it('adds two integers', () => {
    expect(addPaise(100, 200)).toBe(300);
  });

  it('throws on non-integer first arg', () => {
    expect(() => addPaise(100.5, 200)).toThrow('must be an integer');
  });

  it('throws on non-integer second arg', () => {
    expect(() => addPaise(100, 200.1)).toThrow('must be an integer');
  });
});

describe('subtractPaise', () => {
  it('subtracts two integers', () => {
    expect(subtractPaise(500, 200)).toBe(300);
  });

  it('allows negative result', () => {
    expect(subtractPaise(100, 500)).toBe(-400);
  });

  it('throws on non-integer', () => {
    expect(() => subtractPaise(100.5, 200)).toThrow('must be an integer');
  });
});

describe('formatINR', () => {
  it('formats small amounts', () => {
    expect(formatINR(100)).toBe('₹1.00');
  });

  it('formats amounts under 1000 rupees', () => {
    expect(formatINR(99900)).toBe('₹999.00');
  });

  it('formats with Indian grouping', () => {
    expect(formatINR(12345678)).toBe('₹1,23,456.78');
  });

  it('formats lakhs', () => {
    expect(formatINR(10000000)).toBe('₹1,00,000.00');
  });

  it('formats crores', () => {
    expect(formatINR(1000000000)).toBe('₹1,00,00,000.00');
  });

  it('handles zero', () => {
    expect(formatINR(0)).toBe('₹0.00');
  });

  it('handles negative', () => {
    expect(formatINR(-12345678)).toBe('-₹1,23,456.78');
  });

  it('throws on non-integer', () => {
    expect(() => formatINR(100.5)).toThrow('must be an integer');
  });
});
