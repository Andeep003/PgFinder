const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:8080').replace(/\/+$/, '');

export function apiUrl(path) {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function apiGet(path) {
  const response = await fetch(apiUrl(path), {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Backend request failed (${response.status})`);
  }
  return response.json();
}

export function apiImageUrl(path) {
  if (!path || /^(https?:|data:)/i.test(path)) return path;
  return apiUrl(path);
}
