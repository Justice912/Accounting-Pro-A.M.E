/**
 * One-time maintenance script: clears all bank transactions for client "Nosisa Blockyard".
 *
 * Usage (run from the project root):
 *   node scripts/clear-nosisa-bank-txns.mjs
 *
 * Requires better-sqlite3 (already a project dependency).
 * The app does NOT need to be running — close it first to avoid locking the DB.
 */

import Database from 'better-sqlite3';
import { existsSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { homedir, platform } from 'node:os';

function resolveDbPath() {
  const appName = 'ame-pro-workstation';
  const candidates = platform() === 'darwin'
    ? [join(homedir(), 'Library', 'Application Support', appName, 'database.sqlite')]
    : platform() === 'win32'
      ? [join(process.env.APPDATA || '', appName, 'database.sqlite')]
      : [
          join(homedir(), '.config', appName, 'database.sqlite'),
          join(homedir(), '.config', 'AME Pro AI Workstation', 'database.sqlite'),
        ];

  const found = candidates.find(p => existsSync(p));
  if (!found) {
    console.error('Could not find database.sqlite. Tried:\n' + candidates.map(p => '  ' + p).join('\n'));
    process.exit(1);
  }
  return realpathSync(found);
}

const dbPath = resolveDbPath();
console.log(`Opening database at: ${dbPath}`);

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

const client = db.prepare(
  `SELECT id, name FROM clients WHERE LOWER(name) LIKE LOWER(?) LIMIT 1`
).get('%Nosisa%Blockyard%');

if (!client) {
  console.error('Client "Nosisa Blockyard" not found in the database.');
  db.close();
  process.exit(1);
}

console.log(`Found client: "${client.name}" (id: ${client.id})`);

const before = db.prepare(
  'SELECT COUNT(*) AS n FROM vat_bank_transactions WHERE client_id = ?'
).get(client.id).n;

const result = db.prepare(
  'DELETE FROM vat_bank_transactions WHERE client_id = ?'
).run(client.id);

console.log(`Deleted ${result.changes} of ${before} bank transaction(s) for "${client.name}".`);

db.close();
