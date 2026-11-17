import apiClient from './client';
import type { ApiResponse, LoginResponse } from '@bccs/shared';

export async function loginApi(username: string, password: string): Promise<LoginResponse> {
  const { data } = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', {
    username,
    password,
  });
  return data.data!;
}

export async function googleLoginApi(idToken: string): Promise<LoginResponse> {
  const { data } = await apiClient.post<ApiResponse<LoginResponse>>('/auth/google', { idToken });
  return data.data!;
}

export async function refreshApi(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  const { data } = await apiClient.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
    '/auth/refresh',
    { refreshToken },
  );
  return data.data!;
}

export async function logoutApi(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function changePasswordApi(currentPassword: string, newPassword: string): Promise<void> {
  await apiClient.post('/auth/change-password', { currentPassword, newPassword });
}

export async function setupProfileApi(fullName: string, password: string): Promise<void> {
  await apiClient.post('/auth/setup-profile', { fullName, password });
}
