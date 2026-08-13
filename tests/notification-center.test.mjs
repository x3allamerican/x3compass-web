import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const root = new URL("../", import.meta.url);
const api = await readFile(new URL("functions/api/notifications.ts", root), "utf8");
const page = await readFile(new URL("src/app/notifications/page.tsx", root), "utf8");
const shell = await readFile(new URL("src/components/AppShell.tsx", root), "utf8");
const topbar = await readFile(new URL("src/components/AppTopbar.tsx", root), "utf8");
const agent = await readFile(new URL("functions/_shared/agent-registry.ts", root), "utf8");
const webhook = await readFile(new URL("functions/api/screenings/webhook.ts", root), "utf8");

test("notification API is tenant scoped and supports persistent mark-read", () => {
  assert.match(api, /onRequestPatch/);
  assert.match(api, /requireTenant/);
  assert.match(api, /read_at/);
  assert.match(api, /carrier_id=eq\./);
});

test("notification page renders unread state and authenticated mark-read controls", () => {
  assert.match(page, /unread_count/);
  assert.match(page, /Mark all read/);
  assert.match(page, /method: "PATCH"/);
  assert.match(page, /Authorization: `Bearer \$\{session\.access_token\}`/);
});

test("app shell loads the real unread count and bell links to the center", () => {
  assert.match(shell, /notificationCount/);
  assert.match(shell, /\/api\/notifications/);
  assert.match(topbar, /href="\/notifications"/);
});

test("MVR change and expiration agent write tenant notification rows", () => {
  assert.match(webhook, /mvr_change_detected/);
  assert.match(webhook, /notification_log/);
  assert.match(agent, /document_expiration_digest/);
  assert.match(agent, /notification_log/);
});
