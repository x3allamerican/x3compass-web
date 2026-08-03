"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#000", color: "#fff", fontFamily: "Inter, system-ui, sans-serif" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ maxWidth: 420, textAlign: "center" }}>
            <div style={{ fontSize: 30, marginBottom: 12 }}>⚠️</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px" }}>Something went wrong</h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,.6)", margin: "0 0 24px" }}>A problem interrupted the app. Your data is safe. Please try again.</p>
            <button onClick={() => reset()} style={{ padding: "10px 20px", borderRadius: 8, fontWeight: 800, fontSize: 13, color: "#000", background: "#16C7FF", border: "none", cursor: "pointer" }}>Try again</button>
            {error?.digest && <p style={{ marginTop: 24, fontSize: 11, color: "rgba(255,255,255,.3)" }}>Reference: {error.digest}</p>}
          </div>
        </div>
      </body>
    </html>
  );
}
