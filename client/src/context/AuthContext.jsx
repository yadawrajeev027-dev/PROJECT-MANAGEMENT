/**
 * AuthContext.jsx
 * Context managing user authentication state, token persistence, and profile details.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const [token, setToken] = useState(() => authService.getToken());
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Validate session on app initialization
  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      const storedToken = authService.getToken();
      if (!storedToken) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const profile = await authService.getMe();
        if (isMounted) {
          setUser(profile);
          setToken(storedToken);
        }
      } catch (err) {
        console.warn('Session verification failed, logging out:', err.message);
        authService.logout();
        if (isMounted) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    verifySession();

    // Listen for cross-tab or interceptor session expiration events
    const handleExpired = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth:expired', handleExpired);
    window.addEventListener('auth:logout', handleExpired);

    return () => {
      isMounted = false;
      window.removeEventListener('auth:expired', handleExpired);
      window.removeEventListener('auth:logout', handleExpired);
    };
  }, []);

  const login = useCallback(async ({ email, password }) => {
    setAuthError(null);
    try {
      const res = await authService.login({ email, password });
      setUser(res.data.user);
      setToken(res.data.token);
      return res.data;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  }, []);

  const register = useCallback(async ({ name, email, password }) => {
    setAuthError(null);
    try {
      const res = await authService.register({ name, email, password });
      setUser(res.data.user);
      setToken(res.data.token);
      return res.data;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setToken(null);
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isLoading,
    authError,
    setAuthError,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
