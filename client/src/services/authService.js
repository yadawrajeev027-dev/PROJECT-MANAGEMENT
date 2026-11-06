/**
 * authService.js
 * Centralized authentication service for ProjectPulse AI.
 */

import api from './api';

export const authService = {
  /**
   * Register a new user
   * @param {{ name, email, password }} credentials
   */
  async register({ name, email, password }) {
    const res = await api.post('/auth/register', { name, email, password });
    if (res.data?.token) {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    }
    return res;
  },

  /**
   * Log in an existing user
   * @param {{ email, password }} credentials
   */
  async login({ email, password }) {
    const res = await api.post('/auth/login', { email, password });
    if (res.data?.token) {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    }
    return res;
  },

  /**
   * Fetch current authenticated user's profile
   */
  async getMe() {
    const res = await api.get('/auth/me');
    if (res.data) {
      localStorage.setItem('user', JSON.stringify(res.data));
    }
    return res.data;
  },

  /**
   * Clear session and log out
   */
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new CustomEvent('auth:logout'));
  },

  /**
   * Get currently cached user object
   */
  getCurrentUser() {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  },

  /**
   * Get currently active JWT token
   */
  getToken() {
    return localStorage.getItem('token');
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return Boolean(localStorage.getItem('token'));
  },
};

export default authService;
