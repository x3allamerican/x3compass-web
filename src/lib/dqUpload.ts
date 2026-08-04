import { getSupabase } from "./supabase";
import type { DqRequirement } from "./dqRequirements";

export type DqDocRow = {
  driver_id: string;
  document_type: string;
  status: string;
  document_url: string | null;
  expires_date: string | null;
};

/**
 * Load every DQ document for a carrier, keyed `${driver_id}::${document_type}`.
 * Degrades to {} if the table isn't present yet (migration not applied) so the
 * page renders honestly (all slots "not on file") instead of crashing.
 */
export async function loadDqDocuments(carrierId: string): Promise<Record<string, DqDocRow>> {
  try {
    const { data, error } = await getSupabase()
      .from("compass_driver_documents")
      .select("driver_id,document_type,status,document_url,expires_date")
      .eq("carrier_id", carrierId);
    if (error || !data) return {};
    const map: Record<string, DqDocRow> = {};
    for (const r of data as DqDocRow[]) map[`${r.driver_id}::${r.document_type}`] = r;
    return map;
  } catch {
    return {};
  }
}

/**
 * Upload one DQ document: sign (JWT-gated, carrier-scoped) → PUT bytes to R2 →
 * upsert the compass_driver_documents row (RLS-scoped). All identity is derived
 * server-side by /api/uploads/sign from the caller's JWT; the client never
 * asserts a carrier id it isn't a member of.
 */
export async function uploadDqDocument(
  carrierId: string,
  driverId: string,
  req: DqRequirement,
  file: File,
): Promise<{ ok: true; objectKey: string } | { ok: false; error: string }> {
  const supa = getSupabase();
  const { data: { session } } = await supa.auth.getSession();
  const token = session?.access_token;
  if (!token) return { ok: false, error: "Not signed in" };
  if (file.size > 25 * 1024 * 1024) return { ok: false, error: "Max file size is 25 MB" };

  const signRes = await fetch("/api/uploads/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ folder: "dq", driver_id: driverId, filename: file.name, content_type: file.type || "application/octet-stream", size: file.size }),
  });
  const sign = (await signRes.json().catch(() => ({}))) as { ok?: boolean; put_url?: string; object_key?: string; error?: string };
  if (!signRes.ok || !sign.ok || !sign.put_url || !sign.object_key) return { ok: false, error: sign.error || "Could not start upload" };

  const putRes = await fetch(sign.put_url, { method: "PUT", headers: { "Content-Type": file.type || "application/octet-stream" }, body: file });
  if (!putRes.ok) return { ok: false, error: "Upload failed" };

  const { error } = await supa.from("compass_driver_documents").upsert(
    {
      carrier_id: carrierId,
      driver_id: driverId,
      document_type: req.key,
      cfr: req.cfr,
      status: "complete",
      document_url: sign.object_key,
      issued_date: new Date().toISOString().slice(0, 10),
    },
    { onConflict: "driver_id,document_type" },
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true, objectKey: sign.object_key };
}
