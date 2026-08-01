"use client";
import { getSupabase } from "./supabase";

export async function apiFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const supabase = getSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  const headers = new Headers(init.headers || {});
  if (session?.access_token) headers.set("Authorization", `Bearer ${session.access_token}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const res = await fetch(path, { ...init, headers });
  const raw = await res.text();
  if (!res.ok) throw new Error(`API ${res.status}: ${raw.slice(0, 200) || res.statusText}`);
  // Defensive JSON parse — if the endpoint returns HTML (e.g. Pages Function
  // not deployed on this domain), give the user a clear error instead of
  // "Unexpected end of JSON input".
  if (!raw) throw new Error(`API ${res.status}: empty response`);
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(`API ${res.status}: response was not JSON. Endpoint may not be deployed on this domain.`);
  }
}
