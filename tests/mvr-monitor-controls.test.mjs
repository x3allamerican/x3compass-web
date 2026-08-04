import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const page = await readFile(new URL('../src/app/app/mvr/page.tsx', import.meta.url), 'utf8');

test('MVR page consumes the current monitor-list response contract', () => {
  assert.match(page, /monitors\?: ContinuousEnrollment\[\]/);
  assert.match(page, /kpis\?: \{ total: number; active: number; pending: number; canceled: number; failed: number; paused: number \}/);
  assert.match(page, /setContinuousMonitors\(j\.monitors \|\| \[\]\)/);
});

test('per-driver controls expose monitor status and authenticated unenrollment', () => {
  assert.match(page, /continuous-mvr\/unenroll/);
  assert.match(page, /body: JSON\.stringify\(\{ driver_id: driverId \}\)/);
  assert.match(page, /monitorStatus/);
  assert.match(page, />None</);
  assert.match(page, /Unenroll/);
});

test('enrollment never relies on a client-supplied carrier id', () => {
  assert.doesNotMatch(page, /body: JSON\.stringify\(\{ driver_id: driverId, carrier_id:/);
  assert.match(page, /NEEDS_BASELINE/);
  assert.match(page, /ACCOUNT_NOT_APPROVED/);
});
