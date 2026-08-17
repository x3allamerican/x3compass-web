import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Compass onboarding and webhook share the compass tier", async () => {
  const migration = await readFile(new URL("../supabase/migrations/20260817_compass_service_tier.sql", import.meta.url), "utf8");
  const signup = await readFile(new URL("../functions/api/auth/post-signup.ts", import.meta.url), "utf8");
  const webhook = await readFile(new URL("../functions/api/stripe/webhook.ts", import.meta.url), "utf8");
  assert.match(migration, /service_tier.*compass/i);
  assert.match(signup, /service_tier:\s*["']compass["']/);
  assert.match(webhook, /updates\.service_tier\s*=\s*["']compass["']/);
});
