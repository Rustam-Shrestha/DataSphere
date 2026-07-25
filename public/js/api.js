export async function apiFetch(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...opts.headers };
  const token = localStorage.getItem('token');
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(path, { ...opts, headers });

  if (opts.raw) return res;

  const body = await res.json();
  if (!body.success) {
    throw new Error(body.error?.message || 'Request failed');
  }
  return body.data;
}

export function setToken(token) {
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
}

export function getToken() {
  return localStorage.getItem('token');
}
