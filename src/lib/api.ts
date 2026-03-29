import { API_BASE_URL } from './config';
import { clearToken, getToken, setToken } from './auth';

export type ApiError = { error: string };

async function parseJsonSafely(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let token = typeof window !== 'undefined' ? getToken() : null;
  const sentAuthHeader = Boolean(token);

  async function doFetch(currentToken: string | null) {
    return fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
        ...(init?.headers ?? {}),
      },
      cache: 'no-store',
    });
  }

  let res = await doFetch(token);

  // If token is present but backend says 401, try to force-refresh Firebase token and retry once.
  if (res.status === 401 && sentAuthHeader && typeof window !== 'undefined') {
    try {
      const { getFirebaseAuth } = await import('./firebaseClient');
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (user) {
        const fresh = await user.getIdToken(true);
        setToken(fresh);
        token = fresh;
        res = await doFetch(token);
      }
    } catch {
      // Ignore refresh issues and fall back to normal error handling.
    }
  }

  const data = await parseJsonSafely(res);

  if (!res.ok) {
    if (res.status === 401 && sentAuthHeader) {
      clearToken();
    }
    const message =
      typeof data === 'object' && data && 'error' in data ? String((data as ApiError).error) : `HTTP ${res.status}`;
    throw new Error(message);
  }

  return data as T;
}
