import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const page = await readFile(new URL('../src/app/app/mvr/page.tsx', import.meta.url), 'utf8');

test('MVR upload is encoded and sent to the authenticated parse endpoint', () => {
  assert.match(page, /fileToBase64/);
  assert.match(page, /\/api\/screenings\/mvr\/parse/);
  assert.match(page, /file_base64/);
  assert.match(page, /Authorization: `Bearer \$\{session\.access_token\}`/);
});

test('parser output pre-fills review and manual fallback remains available', () => {
  assert.match(page, /extractedToMvr/);
  assert.match(page, /needs_manual/);
  assert.match(page, /setReviewUpload/);
  assert.match(page, /Manual review required/);
});

test('saving review links the source upload to the new MVR row', () => {
  assert.match(page, /matched_mvr_id/);
  assert.match(page, /\.from\("mvr_uploads"\)\.update/);
  assert.match(page, /\.select\("id"\)\.single\(\)/);
});
