export type AuthUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
};

type SessionResponse = { user: AuthUser; session: { id: string; expiresAt: string } } | null;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/auth${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.error?.message || "Não foi possível concluir a solicitação.");
  }
  return data as T;
}

export const authClient = {
  getSession: () => request<SessionResponse>("/get-session"),
  signIn: (email: string, password: string) =>
    request("/sign-in/email", { method: "POST", body: JSON.stringify({ email, password }) }),
  signUp: (name: string, email: string, password: string) =>
    request("/sign-up/email", { method: "POST", body: JSON.stringify({ name, email, password }) }),
  signOut: () => request("/sign-out", { method: "POST" }),
};