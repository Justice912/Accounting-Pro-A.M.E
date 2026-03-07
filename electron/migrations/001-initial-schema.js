// 001-initial-schema.js — Creates all database tables for AME Pro AI Workstation
// This migration runs automatically on app startup

import { randomUUID } from 'crypto';

export default function migrate(db) {
  // Users (for multi-user support in Phase 2)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'practitioner',
      preferences TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Clients
  db.exec(`
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
    )
  `);

  // Projects (linked to clients)
  db.exec(`
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
    )
  `);

  // Conversations (AI chat history per project)
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      client_id TEXT,
      domain TEXT NOT NULL,
      subdomain TEXT,
      title TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Messages (individual chat messages)
  db.exec(`
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
    )
  `);

  // Documents (generated files)
  db.exec(`
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
    )
  `);

  // Prompt Library (versioned domain prompts)
  db.exec(`
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
    )
  `);

  // Audit Trail
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_trail (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      resource_type TEXT,
      resource_id TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Usage Tracking (AI costs)
  db.exec(`
    CREATE TABLE IF NOT EXISTS usage_log (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      domain TEXT,
      tokens_input INTEGER,
      tokens_output INTEGER,
      estimated_cost_zar REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Settings (app-level key-value store)
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes for common queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_project ON conversations(project_id);
    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id);
    CREATE INDEX IF NOT EXISTS idx_audit_trail_action ON audit_trail(action);
    CREATE INDEX IF NOT EXISTS idx_usage_log_provider ON usage_log(provider);
  `);

  // Insert default user if none exists
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    db.prepare(`
      INSERT INTO users (id, name, email, role, preferences)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      randomUUID(),
      'Practitioner',
      'user@ame.co.za',
      'admin',
      JSON.stringify({ theme: 'light', defaultProvider: 'claude', defaultDomain: 'sa-tax' })
    );
  }

  // Insert default settings
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get();
  if (settingsCount.count === 0) {
    const defaults = {
      'defaultProvider': 'claude',
      'autoFailover': 'true',
      'theme': 'light',
      'backupEnabled': 'true',
    };
    const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
    for (const [key, value] of Object.entries(defaults)) {
      insertSetting.run(key, value);
    }
  }

  console.log('[Database] Migration 001 complete — all tables created');
};
