import { API_BASE_URL } from '../config.js';

/**
 * Small fetch wrapper for the capstone API.
 * Sends a JSON body when one is provided and attaches the JWT as a Bearer token
 * for protected requests. Errors carry the HTTP status so callers can react to 401s.
 */
export async function apiRequest(path, { token, headers = {}, ...options } = {}) {
  const requestHeaders = new Headers(headers);
  if (options.body && !requestHeaders.has('content-type')) {
    requestHeaders.set('content-type', 'application/json');
  }
  if (token) requestHeaders.set('authorization', `Bearer ${token}`);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers: requestHeaders });
  } catch {
    const networkError = new Error('Cannot reach the API. Check that the server is running and VITE_API_URL is correct.');
    networkError.status = 0;
    throw networkError;
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const requestError = new Error(payload.message || `Request failed with status ${response.status}.`);
    requestError.status = response.status;
    throw requestError;
  }
  return payload;
}
