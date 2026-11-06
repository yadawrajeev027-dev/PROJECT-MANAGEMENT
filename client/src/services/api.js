/**
 * api.js
 * Centralized Axios instance with request/response interceptors for ProjectPulse AI.
 *
 * Configures:
 *  - Dynamic baseURL (from VITE_API_URL or defaults to '/api' via Vite dev proxy).
 *  - Automatic JWT Bearer token attachment.
 *  - Centralized error normalization (401, 403, 404, 409, 422, 429, 500, 503, 504).
 *  - Automatic session cleanup and redirect triggers on 401 Unauthorized.
 */

import axios from 'axios';

// Resolve API base URL prioritizing VITE_API_BASE_URL, falling back to VITE_API_URL or local '/api'
const rawEnvUrl = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  '/api'
).trim();

// Normalize URL: remove any trailing slashes
let normalizedBaseUrl = rawEnvUrl.replace(/\/+$/, '');

// If an absolute URL was provided (e.g., https://backend.onrender.com) and it does NOT already end in /api,
// append /api so that endpoint paths (/auth/login, /projects) resolve to /api/auth/login, /api/projects
if (/^https?:\/\//i.test(normalizedBaseUrl) && !normalizedBaseUrl.endsWith('/api')) {
  normalizedBaseUrl = `${normalizedBaseUrl}/api`;
}

const API_BASE_URL = normalizedBaseUrl;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000, // 45 seconds for long-running AST or AI analysis calls
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Standardize error formatting and session expiration
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    let message = data?.message || error.message || 'An unexpected error occurred';

    // 401 Unauthorized: Session expired or invalid token
    if (status === 401) {
      const hadToken = Boolean(localStorage.getItem('token'));
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      if (hadToken && !window.location.pathname.includes('/login')) {
        message = 'Your session has expired. Please log in again.';
        // Notify components or redirect
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
    } else if (status === 403) {
      message = data?.message || 'Access denied: You do not have permission for this resource.';
    } else if (status === 404) {
      if (
        !data?.message &&
        typeof window !== 'undefined' &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1' &&
        API_BASE_URL === '/api'
      ) {
        message = 'Backend API URL is not connected. Please set VITE_API_BASE_URL in your Vercel Project Settings and redeploy.';
      } else {
        message = data?.message || 'The requested resource was not found.';
      }
    } else if (status === 409) {
      message = data?.message || 'A conflicting operation is already in progress.';
    } else if (status === 429) {
      message = data?.message || 'Rate limit exceeded. Please wait a moment before trying again.';
    } else if (status === 503) {
      message = data?.message || 'Service temporarily unavailable. AI or backend service not ready.';
    } else if (status === 504) {
      message = data?.message || 'Service request timed out.';
    }

    const customError = new Error(message);
    customError.status = status;
    customError.data = data;
    customError.originalError = error;

    return Promise.reject(customError);
  }
);

export default api;
