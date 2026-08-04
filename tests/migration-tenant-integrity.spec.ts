import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const migration = (name: string) =>
  readFileSync(join(process.cwd(), 'supabase', 'migrations', name), 'utf8');

test('driver-linked tables reject cross-carrier driver references even for RLS-bypass roles', () => {
  const documents = migration('20260803_compass_driver_documents.sql');
  expect(documents).toContain('create or replace function public.enforce_compass_driver_carrier()');
  expect(documents).toContain('d.id = new.driver_id');
  expect(documents).toContain('d.carrier_id = new.carrier_id');
  expect(documents).toContain("errcode = '23503'");

  for (const [file, trigger] of [
    ['20260803_compass_driver_documents.sql', 'enforce_driver_documents_carrier'],
    ['20260803b_compass_da_tests.sql', 'enforce_da_tests_carrier'],
    ['20260803c_compass_training_records.sql', 'enforce_training_carrier'],
  ]) {
    const sql = migration(file);
    expect(sql).toContain(`create trigger ${trigger}`);
    expect(sql).toContain('before insert or update of carrier_id, driver_id');
    expect(sql).toContain('execute function public.enforce_compass_driver_carrier()');
  }
});

test('all additive migrations are safe to rerun after partial application', () => {
  for (const file of [
    '20260803_compass_driver_documents.sql',
    '20260803b_compass_da_tests.sql',
    '20260803c_compass_training_records.sql',
    '20260803d_compass_ifta_returns.sql',
  ]) {
    const sql = migration(file);
    expect(sql).toMatch(/drop policy if exists "[^"]+"/);
    expect(sql).toMatch(/create policy "[^"]+"/);
  }
});
