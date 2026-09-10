/**
 * Axios API client configuration.
 *
 * Creates a single shared Axios instance with:
 *  - Base URL pointing to the backend (configurable via NEXT_PUBLIC_API_URL)
 *  - withCredentials: true — sends the HTTP-only JWT cookie on every request
 *
 * All API calls in the frontend should use this instance rather than plain
 * fetch or a separate axios.create() to ensure credentials are always sent.
 */

import axios from 'axios';

const api = axios.create({
  baseURL: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/+$/, ''),
  /**
   * CRITICAL: withCredentials must be true so the browser includes the
   * HTTP-only 'token' cookie in cross-origin requests to the backend.
   * Without this, authentication will fail silently.
   */
  withCredentials: true,

  // Default headers
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
