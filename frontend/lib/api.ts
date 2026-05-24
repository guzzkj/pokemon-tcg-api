import { PagedResponse, ApiError } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

function getApiKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("pokemon_api_key") ?? "";
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const apiKey = getApiKey();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { "X-API-Key": apiKey } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    let err: ApiError;
    try {
      err = await res.json();
    } catch {
      err = { status: res.status, erro: "Erro", mensagem: res.statusText };
    }
    throw err;
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function get<T>(path: string): Promise<T> {
  return request<T>(path);
}

export async function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: "POST", body: JSON.stringify(body) });
}

export async function put<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: "PUT", body: JSON.stringify(body) });
}

export async function del(path: string): Promise<void> {
  return request<void>(path, { method: "DELETE" });
}

export function extractList<T>(
  data: PagedResponse<T>,
  key: string
): T[] {
  return data._embedded?.[key] ?? [];
}

export async function generateApiKey(nomeCliente: string) {
  const res = await fetch(
    `${BASE_URL}/api-keys?nomeCliente=${encodeURIComponent(nomeCliente)}`,
    { method: "POST" }
  );
  if (!res.ok) throw await res.json();
  return res.json();
}
