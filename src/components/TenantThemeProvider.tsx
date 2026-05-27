"use client";

/* ============================================================
   TenantThemeProvider · runtime white-label layer
   ------------------------------------------------------------
   Wraps the AppShell. Reads a tenant config (logo, name, color
   tokens) from React context and injects CSS variables inline
   on a wrapper div. CSS specificity ensures these win over the
   default Manus tokens in globals.css.

   White-label = pass a different TenantConfig. That's it.
   30 surfaces re-theme themselves.
   ============================================================ */

import { createContext, useContext, ReactNode, useMemo } from "react";

export type TenantTokens = {
  /** Canvas background (sidebar + topbar + content) */
  bg?: string;
  /** Card / panel background */
  surface?: string;
  /** Accent color · buttons, links, KPI deltas, focus rings */
  accent?: string;
  /** Border color */
  border?: string;
  /** Body text */
  fg?: string;
  /** Muted text */
  fgMuted?: string;
};

export type TenantConfig = {
  /** Tenant identifier (e.g., carrier_id or "x3compass" for the default). */
  id: string;
  /** Display name shown in the topbar pill ("Apex Logistics"). */
  name: string;
  /** Optional DOT number badge ("DOT #123456"). */
  dotNumber?: string;
  /** Logo URL (square or wordmark). Falls back to the X3 Compass mark. */
  logoUrl?: string;
  /** Partner-defined product name override (e.g., "Acme Compliance"). */
  productName?: string;
  /** Optional palette override. Empty values fall back to globals.css. */
  tokens?: TenantTokens;
};

export const DEFAULT_TENANT: TenantConfig = {
  id: "x3compass",
  name: "X3 Compass",
  productName: "X3 Compass",
  // tokens omitted → falls back to the Manus app-shell defaults in globals.css
};

const TenantContext = createContext<TenantConfig>(DEFAULT_TENANT);

export function useTenant(): TenantConfig {
  return useContext(TenantContext);
}

type Props = {
  tenant?: TenantConfig;
  children: ReactNode;
};

export default function TenantThemeProvider({ tenant = DEFAULT_TENANT, children }: Props) {
  // Build a style object with only the tokens the tenant overrides. Empty
  // string would clear the value, which we don't want · only set tokens that
  // were explicitly provided.
  const styleVars = useMemo<React.CSSProperties>(() => {
    const t = tenant.tokens || {};
    const out: Record<string, string> = {};
    if (t.bg)       out["--bg"]       = t.bg;
    if (t.surface)  out["--surface"]  = t.surface;
    if (t.accent)   out["--accent"]   = t.accent;
    if (t.border)   out["--border"]   = t.border;
    if (t.fg)       out["--fg"]       = t.fg;
    if (t.fgMuted)  out["--fg-muted"] = t.fgMuted;
    return out as React.CSSProperties;
  }, [tenant]);

  return (
    <TenantContext.Provider value={tenant}>
      <div data-x3-shell="app" data-tenant={tenant.id} style={styleVars}>
        {children}
      </div>
    </TenantContext.Provider>
  );
}
