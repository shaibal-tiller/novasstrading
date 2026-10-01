import "server-only";

type Fields = Record<string, unknown>;
export type MediaRow = {
  id: number;
  path: string;
  original_filename: string;
  bytes: number;
  width: number;
  height: number;
  mime_type: string;
  used_by_count: number;
  created_at: string;
};

function baseUrl(): string {
  const url = process.env.CPANEL_API_URL;
  if (!url) throw new Error("CPANEL_API_URL is not set");
  return url;
}

function apiKey(): string {
  const key = process.env.CPANEL_API_KEY;
  if (!key) throw new Error("CPANEL_API_KEY is not set");
  return key;
}

async function call(
  path: string,
  init: RequestInit & { sessionToken?: string } = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    "X-Api-Key": apiKey(),
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (init.sessionToken) {
    headers.Authorization = `Bearer ${init.sessionToken}`;
  }
  return fetch(`${baseUrl()}${path}`, { ...init, headers });
}

export async function login(email: string, password: string): Promise<string> {
  const res = await call("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("invalid credentials");
  const data = await res.json();
  return data.token as string;
}

export async function requestOtp(email: string): Promise<void> {
  const res = await call("/auth/otp/request", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error(`Failed to request OTP (${res.status})`);
}

export async function verifyOtp(email: string, code: string): Promise<string> {
  const res = await call("/auth/otp/verify", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
  if (!res.ok) throw new Error("invalid or expired code");
  const data = await res.json();
  return data.token as string;
}

export async function getSections(): Promise<Record<string, Fields>> {
  const res = await call("/sections");
  return res.json();
}

export async function getSection(key: string): Promise<Fields | null> {
  const res = await call(`/sections/${key}`);
  if (!res.ok) return null;
  return res.json();
}

export async function updateSection(key: string, fields: Fields, sessionToken: string): Promise<void> {
  const res = await call(`/sections/${key}`, { method: "PUT", body: JSON.stringify(fields), sessionToken });
  if (!res.ok) throw new Error(`Failed to update section "${key}" (${res.status})`);
}

export async function listItems(section: string): Promise<{ id: number; fields: Fields }[]> {
  const res = await call(`/items?section=${encodeURIComponent(section)}`);
  return res.json();
}

export async function createItem(section: string, fields: Fields, sessionToken: string): Promise<number> {
  const res = await call("/items", { method: "POST", body: JSON.stringify({ section, fields }), sessionToken });
  if (!res.ok) throw new Error(`Failed to create item in "${section}" (${res.status})`);
  const data = await res.json();
  return data.id as number;
}

export async function updateItem(id: number, fields: Fields, sessionToken: string): Promise<void> {
  const res = await call(`/items/${id}`, { method: "PUT", body: JSON.stringify({ fields }), sessionToken });
  if (!res.ok) throw new Error(`Failed to update item ${id} (${res.status})`);
}

export async function deleteItem(id: number, sessionToken: string): Promise<void> {
  const res = await call(`/items/${id}`, { method: "DELETE", sessionToken });
  if (!res.ok) throw new Error(`Failed to delete item ${id} (${res.status})`);
}

export async function reorderItems(section: string, ids: number[], sessionToken: string): Promise<void> {
  const res = await call("/items/reorder", { method: "PUT", body: JSON.stringify({ section, ids }), sessionToken });
  if (!res.ok) throw new Error(`Failed to reorder items in "${section}" (${res.status})`);
}

export async function listMedia(): Promise<MediaRow[]> {
  const res = await call("/media");
  return res.json();
}

export async function createMedia(meta: Omit<MediaRow, "id" | "used_by_count" | "created_at">, sessionToken: string): Promise<number> {
  const res = await call("/media", { method: "POST", body: JSON.stringify(meta), sessionToken });
  if (!res.ok) throw new Error(`Failed to create media record (${res.status})`);
  const data = await res.json();
  return data.id as number;
}

export async function deleteMedia(id: number, sessionToken: string): Promise<void> {
  const res = await call(`/media/${id}`, { method: "DELETE", sessionToken });
  if (!res.ok) throw new Error(`Failed to delete media ${id} (${res.status})`);
}

export async function listTrash(): Promise<{ id: number; section: string; fields: Fields; deletedAt: string }[]> {
  const res = await call("/items/trash");
  return res.json();
}

export async function restoreItem(id: number, sessionToken: string): Promise<void> {
  const res = await call(`/items/${id}/restore`, { method: "PUT", sessionToken });
  if (!res.ok) throw new Error(`Failed to restore item ${id} (${res.status})`);
}

