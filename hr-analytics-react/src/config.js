// Set VITE_API_URL in Vercel's project env vars (and a local .env for dev) to your
// backend's public URL, e.g. https://hr-api.swag.sa — no trailing slash.
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8430';
