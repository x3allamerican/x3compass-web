"use client";
import { useUser } from "./useUser";

/**
 * Returns true if the current user is an X3 super-admin (Joshua or anyone with
 * user_metadata.role === 'super_admin'). Used to gate the X3 ADMIN sidebar section
 * and any cross-tenant operations console.
 *
 * Real auth gate (server-side) belongs in Supabase RLS + Pages Functions.
 * This hook is for UI visibility only — never for security.
 */
const SUPER_ADMIN_EMAILS = new Set<string>([
  "joshua@x3compass.com",
  "joshua@x3fleetsafety.com",
  "joshuakovarik@yahoo.com",
]);

export function useIsSuperAdmin(): boolean {
  const { user } = useUser();
  if (!user) return false;
  const email = (user.email || "").toLowerCase().trim();
  if (SUPER_ADMIN_EMAILS.has(email)) return true;
  const role = (user.user_metadata as Record<string, unknown> | undefined)?.role;
  return role === "super_admin";
}
