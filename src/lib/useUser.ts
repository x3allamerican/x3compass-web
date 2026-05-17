"use client";
import { useEffect, useState, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase } from "./supabase";

export type CarrierRow = {
  id: string; name: string; usdot_number: string | null;
  service_tier: string; hazmat_addon: boolean;
  subscription_status: string; trial_ends_at: string | null;
};

type State = { user: User | null; carrier: CarrierRow | null; loading: boolean; error: string | null };

const SAFETY_TIMEOUT_MS = 6000; // hard ceiling — even if Supabase hangs, bail

export function useUser() {
  const [state, setState] = useState<State>({ user: null, carrier: null, loading: true, error: null });

  const refresh = useCallback(async () => {
    let supabase;
    try {
      supabase = getSupabase();
    } catch (e) {
      // Env vars missing or client init failed. Don't get stuck on the loader.
      setState({ user: null, carrier: null, loading: false, error: e instanceof Error ? e.message : "client init failed" });
      return;
    }

    let user: User | null = null;
    try {
      // Newer @supabase/supabase-js (>= 2.x) throws AuthSessionMissingError when there's no session.
      // We treat that as "not signed in" rather than a hard failure.
      const result = await supabase.auth.getUser();
      user = result.data?.user ?? null;
    } catch (e) {
      // AuthSessionMissingError or transient auth/network error — treat as logged out.
      setState({ user: null, carrier: null, loading: false, error: null });
      return;
    }

    if (!user) {
      setState({ user: null, carrier: null, loading: false, error: null });
      return;
    }

    try {
      const { data: rows, error } = await supabase
        .from("compass_carrier_users")
        .select("carrier_id, role, compass_carriers!inner(id, name, usdot_number, service_tier, hazmat_addon, subscription_status, trial_ends_at)")
        .eq("user_id", user.id).limit(1);

      if (error) {
        // Auth is fine; carrier lookup failed. Let user into the app — onboarding may not have run yet.
        setState({ user, carrier: null, loading: false, error: error.message });
        return;
      }
      const carrier = (rows?.[0] as unknown as { compass_carriers: CarrierRow } | undefined)?.compass_carriers || null;
      setState({ user, carrier, loading: false, error: null });
    } catch (e) {
      // Network failure on the carrier fetch — still flip loading off so the app renders.
      setState({ user, carrier: null, loading: false, error: e instanceof Error ? e.message : "carrier fetch failed" });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    // Safety: if refresh() somehow hangs > SAFETY_TIMEOUT_MS, force loading=false so the
    // signed-out redirect can fire. Prevents the "Checking your session..." loop seen on 2026-05-17.
    const t = setTimeout(() => {
      if (cancelled) return;
      setState((s) => (s.loading ? { ...s, loading: false, error: s.error ?? "session check timed out" } : s));
    }, SAFETY_TIMEOUT_MS);

    refresh().finally(() => { if (!cancelled) clearTimeout(t); });

    let subUnsub: (() => void) | null = null;
    try {
      const supabase = getSupabase();
      const { data: sub } = supabase.auth.onAuthStateChange(() => { if (!cancelled) refresh(); });
      subUnsub = () => sub.subscription.unsubscribe();
    } catch { /* client init failed — already handled in refresh */ }

    return () => { cancelled = true; clearTimeout(t); if (subUnsub) subUnsub(); };
  }, [refresh]);

  const signOut = useCallback(async () => {
    try {
      const supabase = getSupabase();
      await supabase.auth.signOut();
    } catch { /* still navigate */ }
    if (typeof window !== "undefined") window.location.href = "/signin";
  }, []);

  return { ...state, refresh, signOut };
}
