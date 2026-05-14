// Typed fetch wrapper. Reads auth token from Clerk if available,
// falls back to demo mode when VITE_DEMO_MODE=true or ?demo=true in URL.

const BASE = "/api";

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  // Get Clerk token if available
  let token: string | null = null;
  try {
    const { Clerk } = window as any;
    if (Clerk?.session) {
      token = await Clerk.session.getToken();
    }
  } catch {
    // Clerk not loaded — demo mode
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `API error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export function apiGet<T>(path: string) {
  return apiFetch<T>(path);
}

export function apiPost<T>(path: string, body: unknown) {
  return apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) });
}

export function apiPatch<T>(path: string, body: unknown) {
  return apiFetch<T>(path, { method: "PATCH", body: JSON.stringify(body) });
}

export function apiDelete(path: string) {
  return apiFetch<{ ok: boolean }>(path, { method: "DELETE" });
}
