/**
 * Default `/api` uses the Vite dev proxy (see vite.config.js) so the browser
 * stays same-origin and CORS is not required for JSON calls.
 * For split production deploys, set VITE_API_URL (e.g. https://api.example.com/api).
 */
export const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

/** Used for OAuth redirect; must hit the Spring server directly (not the Vite URL). */
export const BACKEND_ORIGIN =
  import.meta.env.VITE_BACKEND_ORIGIN ?? 'http://localhost:8081'
