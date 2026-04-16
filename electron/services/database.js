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

CREATE TABLE IF NOT EXISTS ai_memory (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'fact',
  domain TEXT,
  content TEXT NOT NULL,
  source_conversation_id TEXT,
  relevance_score REAL DEFAULT 1.0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  instructions TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  is_active INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vat_receipts (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES clients(id),
  capture_method TEXT DEFAULT 'manual',
  image_path TEXT,
  supplier_name TEXT,
  supplier_vat_number TEXT,
  supplier_address TEXT,
  invoice_number TEXT,
  invoice_date TEXT,
  total_incl_vat REAL DEFAULT 0,
  vat_amount REAL DEFAULT 0,
  total_excl_vat REAL DEFAULT 0,
  line_items TEXT,
  vat_number_valid INTEGER,
  maths_valid INTEGER,
  ai_confidence REAL,
  flags TEXT DEFAULT '[]',
  expense_category TEXT DEFAULT 'General',
  vat_type TEXT DEFAULT 'standard',
  vat_period TEXT,
  status TEXT DEFAULT 'pending',
  reviewed_by TEXT,
  reviewed_at DATETIME,
  review_notes TEXT,
  is_reconciled INTEGER DEFAULT 0,
  bank_transaction_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vat_bank_transactions (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES clients(id),
  txn_date TEXT,
  description TEXT,
  amount REAL,
  reference TEXT,
  bank_name TEXT,
  statement_period TEXT,
  matched_receipt_id TEXT,
  is_matched INTEGER DEFAULT 0,
  imported_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vat_schedules (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES clients(id),
  period TEXT NOT NULL,
  period_start TEXT,
  period_end TEXT,
  status TEXT DEFAULT 'draft',
  input_vat_standard REAL DEFAULT 0,
  input_vat_capital REAL DEFAULT 0,
  input_vat_total REAL DEFAULT 0,
  output_vat_standard REAL DEFAULT 0,
  output_vat_total REAL DEFAULT 0,
  net_vat REAL DEFAULT 0,
  receipt_count INTEGER DEFAULT 0,
  approved_count INTEGER DEFAULT 0,
  pending_count INTEGER DEFAULT 0,
  flagged_count INTEGER DEFAULT 0,
  finalised_by TEXT,
  finalised_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vat_verified_vendors (
  vat_number TEXT PRIMARY KEY,
  vendor_name TEXT,
  is_valid INTEGER,
  verified_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vat_reminder_state (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES clients(id),
  vat_period TEXT NOT NULL,
  rule_key TEXT NOT NULL,
  state TEXT NOT NULL,
  snoozed_until TEXT,
  condition_signature TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vat_receipts_client ON vat_receipts(client_id);
CREATE INDEX IF NOT EXISTS idx_vat_receipts_period ON vat_receipts(vat_period);
CREATE INDEX IF NOT EXISTS idx_vat_receipts_status ON vat_receipts(status);
CREATE INDEX IF NOT EXISTS idx_vat_bank_client ON vat_bank_transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_vat_schedules_client ON vat_schedules(client_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_vat_reminder_state_period
ON vat_reminder_state(client_id, vat_period, rule_key);
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

  // Migration: add extra columns to clients table
  const clientCols = db.prepare("PRAGMA table_info('clients')").all();
  const clientColNames = clientCols.map(c => c.name);
  const clientMigrations = [
    ['address', 'TEXT'],
    ['email', 'TEXT'],
    ['phone', 'TEXT'],
    ['contact_person', 'TEXT'],
    ['trading_name', 'TEXT'],
    ['industry', 'TEXT'],
    ['financial_year_end', 'TEXT'],
  ];
  for (const [col, colType] of clientMigrations) {
    if (!clientColNames.includes(col)) {
      db.exec(`ALTER TABLE clients ADD COLUMN ${col} ${colType}`);
      console.log(`[Database] Migration: added ${col} column to clients`);
    }
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
