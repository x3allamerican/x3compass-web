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

export function useUser() {
  const [state, setState] = useState<State>({
    user: null,
    carrier: null,
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    // CRITICAL: Wrap the whole thing in try/catch. Without it, any thrown
    // exception (missing env vars, network blip, Supabase outage, anything)
    // silently swallows and setState({loading: false}) never fires · leaving
    // users stuck on "Checking your session…" forever. This was the bug
    // Joshua saw in the wild.
    try {
      const supabase = getSupabase();
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr) { setState({ user: null, carrier: null, loading: false, error: userErr.message }); return; }
      if (!user) { setState({ user: null, carrier: null, loading: false, error: null }); return; }
      const { data: rows, error } = await supabase
        .from("compass_carrier_users")
        .select("carrier_id, role, compass_carriers!inner(id, name, usdot_number, service_tier, hazmat_addon, subscription_status, trial_ends_at)")
        .eq("user_id", user.id).limit(1);
      if (error) { setState({ user, carrier: null, loading: false, error: error.message }); return; }
      const carrier = (rows?.[0] as unknown as { compass_carriers: CarrierRow } | undefined)?.compass_carriers || null;
      setState({ user, carrier, loading: false, error: null });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // Surface to console for live debugging · production users see the
      // error string in the AppShell fallback (red text under the logo).
      console.error("[useUser] refresh failed:", msg);
      setState({ user: null, carrier: null, loading: false, error: msg });
    }
  }, []);

  useEffect(() => {
    refresh();
    const supabase = getSupabase();
    const { data: sub } = supabase.auth.onAuthStateChange(() => refresh());
    return () => sub.subscription.unsubscribe();
  }, [refresh]);

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    if (typeof window !== "undefined") window.location.href = "/signin";
  }, []);

  return { ...state, refresh, signOut };
}
