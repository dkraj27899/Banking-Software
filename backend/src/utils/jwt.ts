import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { PermissionCode, RoleCode } from '@bccs/shared';

export interface AccessTokenPayload {
  userId: string;
  username: string;
  fullName: string;
  role: RoleCode;
  branchId: string;
  branchName: string;
  permissions: PermissionCode[];
}

export interface RefreshTokenPayload {
  userId: string;
  tokenFamily: string;
}

export function generateAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(
    { ...payload },
    env.JWT_SECRET as jwt.Secret,
    {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as string,
      issuer: 'bccs',
      subject: payload.userId,
    } as jwt.SignOptions,
  );
}

export function generateRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(
    { ...payload },
    env.JWT_REFRESH_SECRET as jwt.Secret,
    {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as string,
      issuer: 'bccs',
      subject: payload.userId,
    } as jwt.SignOptions,
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET, { issuer: 'bccs' });
  return decoded as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, { issuer: 'bccs' });
  return decoded as RefreshTokenPayload;
}
