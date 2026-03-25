import { API_BASE_URL } from './config';
import { getToken } from './auth';

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
  const token = typeof window !== 'undefined' ? getToken() : null;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });

  const data = await parseJsonSafely(res);

  if (!res.ok) {
    const message =
      typeof data === 'object' && data && 'error' in data ? String((data as ApiError).error) : `HTTP ${res.status}`;
    throw new Error(message);
  }

  return data as T;
}
