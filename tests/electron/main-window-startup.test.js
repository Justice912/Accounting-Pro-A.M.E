import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(testDir, '../..');

test('electron main startup includes fallback reveal paths for the main window', async () => {
  const source = await readFile(path.join(workspaceRoot, 'electron/main.js'), 'utf8');

  assert.match(
    source,
    /did-finish-load/,
    'expected a did-finish-load reveal fallback when ready-to-show does not fire',
  );
  assert.match(
    source,
    /setTimeout/,
    'expected a timeout-based reveal fallback to avoid a permanently hidden window',
  );
});
