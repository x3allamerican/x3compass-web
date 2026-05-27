"""
X3 Compass · WeasyPrint render service
========================================
Stack 3 of the PDF strategy. Companion to the Pages Function:
  - Stack 1 (Cloudflare Browser Rendering) · prose docs, marketing-quality
  - Stack 2 (pdf-lib in CF Workers)        · stamping + merging existing PDFs
  - Stack 3 (WeasyPrint, this service)     · LEGAL-GRADE documents

Why a separate service:
  WeasyPrint is Python + native deps (Pango, Cairo). It can't run in
  Cloudflare Workers (no native binaries, 10 MB code cap). We host it
  externally on Render.com (or similar) and the Pages Function calls
  in over HTTP when legal-mode rendering is requested.

Why bother when we have Browser Rendering?
  WeasyPrint has FAR better CSS Paged Media support:
    · Native running heads/footers via @page :first / :left / :right
    · Footnotes that flow to the bottom of the right page
    · Page-aware widow/orphan control · keeps headings with their content
    · Smaller output (8 KB vs 16 KB for the same doc · matters at scale)
    · Bookmarks/outline for navigable PDFs
  Used when the X3 Compass audit packet is going to a judge, an
  insurance company in subrogation, or a federal review board.

Endpoint
--------
  POST /render
    Content-Type: application/json
    Authorization: Bearer <WEASYPRINT_TOKEN>  (matches env var)
    Body:
      {
        "html": "<!DOCTYPE html>...",
        "base_url": "https://x3compass.com/",   // optional · for resolving <link href="..."> + <img src="...">
        "pdf_metadata": {                       // optional
          "title": "Audit Packet",
          "author": "X3 Compass",
          "subject": "FMCSA compliance review",
          "keywords": ["FMCSA", "compliance"]
        }
      }
    Response: application/pdf binary

  GET /health
    Returns { ok: true, version: "<weasyprint-version>" }

Auth
----
  Hardcoded Bearer token via WEASYPRINT_TOKEN env var. Shared secret
  between this service and the X3 Compass Pages Function. Rotate by
  re-deploying with a new token + updating CF Pages env vars.

Limits
------
  · 5 MB max HTML input body
  · 60-second wall-clock timeout per render (handled by gunicorn config)
"""

import logging
import os
import io
from flask import Flask, request, jsonify, Response

# WeasyPrint imports · these are heavy (~50MB transitive deps via Cairo/Pango)
# so we import at module-load time and let gunicorn pre-warm the workers.
from weasyprint import HTML, CSS  # noqa: E402

app = Flask(__name__)
log = logging.getLogger("x3-weasyprint")
log.setLevel(logging.INFO)

MAX_HTML_BYTES = 5 * 1024 * 1024  # 5 MB
WEASYPRINT_TOKEN = os.environ.get("WEASYPRINT_TOKEN", "")


@app.before_request
def _auth_gate():
    """Bearer token check on POST /render. GET /health is public."""
    if request.method == "GET":
        return None
    if not WEASYPRINT_TOKEN:
        log.error("WEASYPRINT_TOKEN env var not set · refusing all writes")
        return jsonify({"ok": False, "error": "Service token not configured"}), 503
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return jsonify({"ok": False, "error": "Missing Bearer token"}), 401
    if auth.split(" ", 1)[1] != WEASYPRINT_TOKEN:
        return jsonify({"ok": False, "error": "Invalid token"}), 401
    return None


@app.get("/health")
def health():
    """Health probe for Render.com + the Pages Function client.

    Returns the WeasyPrint version so we can confirm the deployed image
    is current. No auth required.
    """
    try:
        import weasyprint
        return jsonify({
            "ok": True,
            "service": "x3-compass-weasyprint",
            "weasyprint_version": weasyprint.__version__,
        })
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.post("/render")
def render():
    """Render HTML → PDF.

    Bytes-in / bytes-out · no template registry server-side. The Pages
    Function builds the HTML using its own template module (the same one
    that backs Stack 1) and posts it here. Keeps the service stateless
    and means we don't have to re-deploy WeasyPrint when the design
    system changes.
    """
    # Body size guard
    cl = request.content_length or 0
    if cl > MAX_HTML_BYTES:
        return jsonify({"ok": False, "error": f"Body too large ({cl} bytes, max {MAX_HTML_BYTES})"}), 413

    payload = request.get_json(silent=True) or {}
    html_str = payload.get("html") or ""
    if not html_str:
        return jsonify({"ok": False, "error": "html field required"}), 400
    if len(html_str) > MAX_HTML_BYTES:
        return jsonify({"ok": False, "error": "html string exceeds 5 MB"}), 413

    base_url = payload.get("base_url") or "https://x3compass.com/"
    meta = payload.get("pdf_metadata") or {}

    try:
        # WeasyPrint render · base_url lets relative <img src="..."> resolve
        # against the X3 Compass marketing/app domain.
        html_doc = HTML(string=html_str, base_url=base_url)

        # PDF metadata · WeasyPrint reads from <title> + <meta name="..."> in
        # the HTML by default. We override here only when explicitly requested.
        kwargs = {}
        if meta.get("title"):
            kwargs["pdf_title"] = meta["title"]
        if meta.get("author"):
            kwargs["pdf_author"] = meta["author"]
        if meta.get("subject"):
            kwargs["pdf_subject"] = meta["subject"]
        if meta.get("keywords"):
            kw = meta["keywords"]
            kwargs["pdf_keywords"] = ", ".join(kw) if isinstance(kw, list) else str(kw)

        buf = io.BytesIO()
        html_doc.write_pdf(target=buf, **kwargs)
        pdf_bytes = buf.getvalue()
    except Exception as e:
        log.exception("WeasyPrint render failed")
        return jsonify({
            "ok": False,
            "error": f"WeasyPrint render failed: {type(e).__name__}: {e}",
        }), 500

    return Response(
        pdf_bytes,
        status=200,
        content_type="application/pdf",
        headers={
            "Content-Length": str(len(pdf_bytes)),
            "Content-Disposition": 'inline; filename="x3-weasyprint.pdf"',
            "Cache-Control": "private, no-store",
            "X-Render-Engine": "weasyprint",
        },
    )


@app.get("/")
def root():
    """Friendly root · helps when someone hits the service URL directly."""
    return jsonify({
        "service": "x3-compass-weasyprint",
        "description": "X3 Compass legal-grade PDF render service · Stack 3 of the PDF strategy",
        "endpoints": {
            "POST /render": "Render HTML → PDF · requires Bearer token",
            "GET /health":  "Health probe · public",
        },
        "docs": "/services/weasyprint/README.md in the x3compass-web repo",
    })


if __name__ == "__main__":
    # Local dev only · production uses gunicorn via the Procfile
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "8000")))
