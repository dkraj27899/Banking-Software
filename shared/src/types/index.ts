import type { RoleCode, PermissionCode } from '../constants/index.js';

// === API Response Envelope ===
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    totalPages?: number;
  };
}

// === Auth ===
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  role: RoleCode;
  permissions: PermissionCode[];
  branchId: string;
  branchName: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// === Staff ===
export interface StaffUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  mobile: string;
  role: RoleCode;
  branchId: string;
  branchName: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffRequest {
  username: string;
  password: string;
  fullName: string;
  email: string;
  mobile: string;
  role: RoleCode;
  branchId: string;
}

// === Branch ===
export interface Branch {
  id: string;
  code: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
}

// === Audit ===
export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, unknown>;
  ipAddress: string;
  branchId: string;
  createdAt: string;
}

// === Pagination ===
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}
