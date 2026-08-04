const MAX_BYTES = 25 * 1024 * 1024;

export async function uploadDataqEvidence(file, token) {
  if (!token) return { ok: false, error: "Not signed in" };
  if (!file || !file.name || !Number.isFinite(file.size) || file.size < 1) return { ok: false, error: "Choose a non-empty evidence file" };
  if (file.size > MAX_BYTES) return { ok: false, error: "Max file size is 25 MB" };
  const contentType = file.type || "application/octet-stream";
  try {
    const signedResponse = await fetch("/api/uploads/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ folder: "dataq", filename: file.name, content_type: contentType, size: file.size }),
    });
    const signed = await signedResponse.json().catch(() => ({}));
    if (!signedResponse.ok || !signed.ok || !signed.put_url || !signed.object_key) return { ok: false, error: signed.error || "Could not start evidence upload" };
    const uploaded = await fetch(signed.put_url, { method: "PUT", headers: { "Content-Type": contentType }, body: file });
    if (!uploaded.ok) return { ok: false, error: "Evidence upload failed" };
    return { ok: true, evidence: { label: file.name, file_name: file.name, object_key: signed.object_key, content_type: contentType, size_bytes: file.size } };
  } catch {
    return { ok: false, error: "Evidence upload unavailable" };
  }
}
