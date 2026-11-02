import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../utils/password.js';

describe('password hashing', () => {
  it('produces a bcrypt hash', async () => {
    const hash = await hashPassword('Test@1234');
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it('produces different hashes for the same input', async () => {
    const h1 = await hashPassword('Test@1234');
    const h2 = await hashPassword('Test@1234');
    expect(h1).not.toBe(h2);
  });

  it('verifies correct password', async () => {
    const hash = await hashPassword('Test@1234');
    const result = await verifyPassword('Test@1234', hash);
    expect(result).toBe(true);
  });

  it('rejects wrong password', async () => {
    const hash = await hashPassword('Test@1234');
    const result = await verifyPassword('Wrong@1234', hash);
    expect(result).toBe(false);
  });
});
