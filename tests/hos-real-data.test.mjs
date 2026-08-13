import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../src/app/hos/page.tsx", import.meta.url), "utf8");

test("signed-in HOS uses compass_hos_logs or an honest empty state", () => {
  assert.match(source, /\.from\("compass_hos_logs"\)/);
  assert.match(source, /realRows\.length === 0/);
  assert.match(source, /No HOS data imported yet/);
  assert.match(source, /Connect Samsara or Motive/);
});

test("HOS does not advertise or call an endpoint that does not exist", () => {
  assert.doesNotMatch(source, /\/api\/hos\/upload-log/);
  assert.match(source, /syncNow/);
  assert.match(source, /Latest imported log/);
});
