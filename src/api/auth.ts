import api from './client';
import type { User } from '../types';

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface RefreshTokenResponse {
  access_token: string;
}

/**
 * Authenticates a user with username and password.
 * Uses OAuth2 form-encoded body as required by FastAPI's OAuth2PasswordRequestForm.
 */
export async function login(username: string, password: string): Promise<LoginResponse> {
  const params = new URLSearchParams();
  params.append('username', username);
  params.append('password', password);

  const response = await api.post<LoginResponse>('/auth/login', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return response.data;
}

/**
 * Refreshes the current access token using the stored token.
 */
export async function refreshToken(): Promise<RefreshTokenResponse> {
  const response = await api.post<RefreshTokenResponse>('/auth/refresh');
  return response.data;
}

/**
 * Retrieves the current authenticated user's profile.
 */
export async function getMe(): Promise<User> {
  const response = await api.get<User>('/auth/me');
  return response.data;
}
