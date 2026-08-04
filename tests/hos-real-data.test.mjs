import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../src/app/app/hos/page.tsx", import.meta.url), "utf8");

test("signed-in HOS uses compass_hos_logs or an honest empty state", () => {
  assert.match(source, /\.from\("compass_hos_logs"\)/);
  assert.match(source, /withDemoFallback<[^>]+>\(realRows, DEMO_HOS_LOGS, !carrier\)/);
  assert.match(source, /No HOS data imported yet/);
  assert.match(source, /Connect your ELD or use the documented CSV template/);
});

test("HOS does not advertise or call an endpoint that does not exist", () => {
  assert.doesNotMatch(source, /\/api\/hos\/upload-log/);
  assert.match(source, /Automated HOS sync is not enabled yet/);
  assert.match(source, /Latest imported log/);
});
