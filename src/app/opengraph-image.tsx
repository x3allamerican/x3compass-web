import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "X3 Compass — AI Safety Director for fleets";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%",
          display: "flex", flexDirection: "column",
          background: "linear-gradient(135deg, #0A1929 0%, #15233D 100%)",
          color: "#FFFFFF", fontFamily: "system-ui, sans-serif",
          padding: "70px 80px",
        }}
      >
        {/* Top bar: logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 12,
            background: "linear-gradient(135deg, #22D3EE, #06B6D4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#0A1929", fontWeight: 900, fontSize: 28,
          }}>X3</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: -0.5 }}>X3 COMPASS</div>
            <div style={{ fontSize: 12, color: "#22D3EE", letterSpacing: 2, fontWeight: 700 }}>AI SAFETY DIRECTOR</div>
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto", marginBottom: 14 }}>
          <div style={{ fontSize: 18, color: "#22D3EE", letterSpacing: 4, fontWeight: 700, marginBottom: 16 }}>
            FOR FMCSA-REGULATED MOTOR CARRIERS 1–100 POWER UNITS
          </div>
          <div style={{ fontSize: 72, fontWeight: 900, lineHeight: 1.05, letterSpacing: -1.5 }}>
            An AI Safety Director.
          </div>
          <div style={{ fontSize: 72, fontWeight: 900, lineHeight: 1.05, letterSpacing: -1.5 }}>
            <span style={{ fontStyle: "italic", color: "#22D3EE", fontFamily: "Georgia, serif" }}>Or a real one.</span>
            {" "}Both work.
          </div>
          <div style={{ fontSize: 26, color: "#94A8C4", marginTop: 28, fontWeight: 500 }}>
            300 FMCSA skills · every one CFR-cited · $25/driver · 7-day free trial, no card
          </div>
        </div>

        {/* Footer bar */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: 20, marginTop: 28,
          fontSize: 16, color: "#94A8C4",
        }}>
          <div style={{ fontFamily: "monospace" }}>x3compass.com</div>
          <div>Built by X3 Fleet Safety LLC — MC-authorized carrier</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
