"use client";
import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";

export type DriverOpt = { id: string; first_name: string; last_name: string };

export function useDrivers(carrierId: string | undefined) {
  const [drivers, setDrivers] = useState<DriverOpt[]>([]);
  useEffect(() => {
    if (!carrierId) return;
    let cancelled = false;
    getSupabase().from("compass_drivers").select("id,first_name,last_name").eq("carrier_id", carrierId).order("last_name").then(({ data }) => {
      if (!cancelled && data) setDrivers(data as DriverOpt[]);
    });
    return () => { cancelled = true; };
  }, [carrierId]);
  return drivers;
}

export function driverLabel(d: DriverOpt | undefined) {
  return d ? `${d.last_name}, ${d.first_name}` : "—";
}
