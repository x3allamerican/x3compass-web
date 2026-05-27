"use client";
import AppShell from "@/components/AppShell";

const TARGET = "https://x3compass-app-preview.pages.dev/hazmat-training.html";

export default function Page() {
  return (
    <AppShell title="Hazmat Training Tracker" crumbs="Hazmat · § 172.704">
      <div style={{ padding: "8px 0 4px", fontSize: 12, color: "#94A3B8" }}>
        Loading from app.x3compass.com · Native React port shipping in next sprint.
      </div>
      <iframe
        src={TARGET}
        title="Hazmat Training Tracker"
        style={{ width: "100%", height: "calc(100vh - 160px)", border: 0, borderRadius: 12, background: "#0A1628", boxShadow: "0 8px 24px rgba(0,0,0,0.35)" }}
        loading="eager"
        allow="clipboard-read; clipboard-write"
      />
    </AppShell>
  );
}
