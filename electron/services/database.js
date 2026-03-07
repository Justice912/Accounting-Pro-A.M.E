import path from 'path';
import crypto from 'crypto';
import { app } from 'electron';

let db = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'practitioner',
  preferences TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  registration_number TEXT,
  vat_number TEXT,
  type TEXT NOT NULL DEFAULT 'individual',
  contact_details TEXT,
  tax_history TEXT,
  notes TEXT,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES clients(id),
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  context TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  client_id TEXT,
  domain TEXT NOT NULL,
  subdomain TEXT,
  title TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT REFERENCES conversations(id),
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  provider TEXT,
  model TEXT,
  tokens_input INTEGER,
  tokens_output INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  client_id TEXT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  domain TEXT,
  template TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prompts (
  id TEXT PRIMARY KEY,
  domain TEXT NOT NULL,
  subdomain TEXT NOT NULL,
  version TEXT NOT NULL,
  effective_from DATE,
  effective_to DATE,
  system_prompt TEXT NOT NULL,
  legislation_ref TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_trail (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usage_log (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  domain TEXT,
  tokens_input INTEGER,
  tokens_output INTEGER,
  estimated_cost_zar REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

function getDbPath() {
  return path.join(app.getPath('userData'), 'database.sqlite');
}

async function initialize() {
  const Database = (await import('better-sqlite3')).default;
  const dbPath = getDbPath();

  db = new Database(dbPath);

  // Enable WAL mode for performance
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Run migrations / create tables
  db.exec(SCHEMA);

  // Migration: add workflow_type column to conversations if missing
  const convCols = db.prepare("PRAGMA table_info('conversations')").all();
  const hasWorkflowType = convCols.some(c => c.name === 'workflow_type');
  if (!hasWorkflowType) {
    db.exec('ALTER TABLE conversations ADD COLUMN workflow_type TEXT');
    console.log('[Database] Migration: added workflow_type column to conversations');
  }

  console.log('[Database] Initialized at:', dbPath);
  return db;
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initialize() first.');
  }
  return db;
}

function getAll(sql, params = []) {
  return getDb().prepare(sql).all(...(Array.isArray(params) ? params : [params]));
}

function getOne(sql, params = []) {
  return getDb().prepare(sql).get(...(Array.isArray(params) ? params : [params]));
}

function run(sql, params = []) {
  return getDb().prepare(sql).run(...(Array.isArray(params) ? params : [params]));
}

function insert(table, data) {
  const id = data.id || crypto.randomUUID();
  const dataWithId = { ...data, id };

  const columns = Object.keys(dataWithId);
  const placeholders = columns.map(() => '?').join(', ');
  const values = columns.map((col) => dataWithId[col]);

  const sql = `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
  getDb().prepare(sql).run(...values);

  return id;
}

function close() {
  if (db) {
    db.close();
    db = null;
  }
}

export default {
  initialize,
  getDb,
  getAll,
  getOne,
  run,
  insert,
  close,
  getDbPath,
};
