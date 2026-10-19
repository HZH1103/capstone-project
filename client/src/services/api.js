import { API_BASE_URL } from '../config.js';

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
    throw new Error('Cannot reach the API. Check that the server is running and VITE_API_URL is correct.');
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || `Request failed with status ${response.status}.`);
  }
  return payload;
}
