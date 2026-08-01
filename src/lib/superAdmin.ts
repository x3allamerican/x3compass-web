"use client";
import { useEffect, useState } from "react";
import { getSupabase } from "./supabase";

const SUPER_ADMIN_EMAILS = [
  "joshua@x3compass.com",
  "joshua@x3fleetsafety.com",
  "joshuakovarik@yahoo.com",
];

/**
 * useIsSuperAdmin · returns true if the current authenticated user is an X3 internal super-admin.
 * Used by AppShell to gate the X3 Admin sidebar section (Control Center, Finance, Marketing, etc.)
 *
 * v1 implementation: check email against allow-list.
 * v2 will switch to: SELECT compass_super_admins WHERE user_id = auth.uid()
 */
export function useIsSuperAdmin(): boolean {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = getSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (cancelled) return;
        if (user?.email && SUPER_ADMIN_EMAILS.includes(user.email.toLowerCase())) {
          setIsSuperAdmin(true);
        }
      } catch { /* not signed in · not super-admin */ }
    })();
    return () => { cancelled = true; };
  }, []);

  return isSuperAdmin;
}
