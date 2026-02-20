import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as authApi from '../api/auth';
import type { User } from '../types';

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------
export const AUTH_QUERY_KEY = ['auth', 'me'] as const;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useAuth — centralized authentication state manager.
 *
 * Manages token storage in localStorage and fetches the current user profile
 * from GET /auth/me using React Query. Provides login/logout actions.
 *
 * Usage:
 *   const { user, isAuthenticated, login, logout, loading } = useAuth();
 */
export function useAuth() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Determine if a token is already stored (persists across page refreshes)
  const hasToken = !!localStorage.getItem('token');

  // Fetch the current user only when a token is present
  const {
    data: user,
    isLoading: meLoading,
    error: meError,
  } = useQuery<User, Error>({
    queryKey: AUTH_QUERY_KEY,
    queryFn: authApi.getMe,
    enabled: hasToken,
    // Do not refetch on window focus — user profile rarely changes
    refetchOnWindowFocus: false,
    // Retry once on failure (e.g., transient network issue)
    retry: 1,
    // Treat a 401 from the interceptor as a signal to clear state
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  /**
   * Authenticates the user with username and password.
   * On success: stores the access_token in localStorage and invalidates auth cache.
   * On failure: sets loginError with the server message.
   */
  const login = useCallback(
    async (username: string, password: string) => {
      setLoginLoading(true);
      setLoginError(null);
      try {
        const { access_token } = await authApi.login(username, password);
        localStorage.setItem('token', access_token);
        // Invalidate so useQuery re-fetches getMe with the new token
        await queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
        navigate('/dashboard/presupuesto', { replace: true });
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : 'Error al iniciar sesión. Verifique sus credenciales.';
        setLoginError(message);
      } finally {
        setLoginLoading(false);
      }
    },
    [navigate, queryClient]
  );

  /**
   * Logs out the current user.
   * Clears localStorage, removes cached user data, and redirects to /login.
   */
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    queryClient.removeQueries({ queryKey: AUTH_QUERY_KEY });
    queryClient.clear();
    navigate('/login', { replace: true });
  }, [navigate, queryClient]);

  const isAuthenticated = !!user && !meError;
  const loading = loginLoading || (hasToken && meLoading);

  return {
    user: user ?? null,
    isAuthenticated,
    login,
    logout,
    loading,
    loginError,
  };
}
