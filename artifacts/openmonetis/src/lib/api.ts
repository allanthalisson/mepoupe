export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, { credentials: "include", headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) }, ...init });
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || "Não foi possível carregar os dados.");
  return body;
}
export const money = (value: string | number) => Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });