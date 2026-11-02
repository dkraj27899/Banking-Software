import { describe, it, expect, beforeAll } from 'vitest';

// Set env vars before importing jwt module
beforeAll(() => {
  process.env['DATABASE_URL'] = 'postgresql://test:test@localhost:5432/test';
  process.env['JWT_SECRET'] = 'test-secret-minimum-32-characters-long!!';
  process.env['JWT_REFRESH_SECRET'] = 'test-refresh-secret-minimum-32-chars!!a';
  process.env['JWT_ACCESS_EXPIRES_IN'] = '15m';
  process.env['JWT_REFRESH_EXPIRES_IN'] = '7d';
});

import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../utils/jwt.js';
import type { AccessTokenPayload, RefreshTokenPayload } from '../utils/jwt.js';

const accessPayload: AccessTokenPayload = {
  userId: '123e4567-e89b-12d3-a456-426614174000',
  username: 'testuser',
  role: 'cashier',
  branchId: '223e4567-e89b-12d3-a456-426614174000',
  permissions: ['transaction:create', 'transaction:read'],
};

const refreshPayload: RefreshTokenPayload = {
  userId: '123e4567-e89b-12d3-a456-426614174000',
  tokenFamily: 'family-abc',
};

describe('access token', () => {
  it('generates and verifies', () => {
    const token = generateAccessToken(accessPayload);
    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe(accessPayload.userId);
    expect(decoded.username).toBe(accessPayload.username);
    expect(decoded.role).toBe(accessPayload.role);
    expect(decoded.branchId).toBe(accessPayload.branchId);
    expect(decoded.permissions).toEqual(accessPayload.permissions);
  });

  it('rejects tampered token', () => {
    const token = generateAccessToken(accessPayload);
    const tampered = token.slice(0, -4) + 'xxxx';
    expect(() => verifyAccessToken(tampered)).toThrow();
  });

  it('rejects garbage', () => {
    expect(() => verifyAccessToken('not.a.token')).toThrow();
  });
});

describe('refresh token', () => {
  it('generates and verifies', () => {
    const token = generateRefreshToken(refreshPayload);
    const decoded = verifyRefreshToken(token);
    expect(decoded.userId).toBe(refreshPayload.userId);
    expect(decoded.tokenFamily).toBe(refreshPayload.tokenFamily);
  });

  it('access secret cannot verify refresh token', () => {
    const token = generateRefreshToken(refreshPayload);
    expect(() => verifyAccessToken(token)).toThrow();
  });
});
