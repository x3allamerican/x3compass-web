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
  const [state, setState] = useState<State>({ user: null, carrier: null, loading: true, error: null });

  const refresh = useCallback(async () => {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setState({ user: null, carrier: null, loading: false, error: null }); return; }
    const { data: rows, error } = await supabase
      .from("compass_carrier_users")
      .select("carrier_id, role, compass_carriers!inner(id, name, usdot_number, service_tier, hazmat_addon, subscription_status, trial_ends_at)")
      .eq("user_id", user.id).limit(1);
    if (error) { setState({ user, carrier: null, loading: false, error: error.message }); return; }
    const carrier = (rows?.[0] as unknown as { compass_carriers: CarrierRow } | undefined)?.compass_carriers || null;
    setState({ user, carrier, loading: false, error: null });
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
