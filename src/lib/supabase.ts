import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_client) return _client;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase env vars missing — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  _client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
      // Explicit storage key + localStorage backing so the session
      // ALWAYS persists across refreshes. Without this, some browsers
      // (Safari with strict cookie policies, incognito edge cases)
      // can fail to rehydrate the session after a hard reload.
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      storageKey: "sb-lsxtcluavinibdqlooil-auth-token",
    },
  });
  return _client;
}
