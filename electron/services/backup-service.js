import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import database from './database.js';

const MAX_BACKUPS = 7;
const BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get the backups directory path
 */
function getBackupsDir() {
  const dir = path.join(app.getPath('userData'), 'backups');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Create a backup of the database
 * @returns {string} Path to the backup file
 */
function backup() {
  const dbPath = database.getDbPath();
  if (!fs.existsSync(dbPath)) {
    throw new Error('Database file not found');
  }

  const backupsDir = getBackupsDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupName = `backup-${timestamp}.sqlite`;
  const backupPath = path.join(backupsDir, backupName);

  // Use better-sqlite3's backup API if database is open, otherwise copy file
  try {
    const db = database.getDb();
    db.backup(backupPath);
  } catch (e) {
    // Fallback: direct file copy
    fs.copyFileSync(dbPath, backupPath);
  }

  console.log(`[BackupService] Backup created: ${backupPath}`);

  // Clean old backups
  cleanOldBackups();

  return backupPath;
}

/**
 * Remove old backups, keeping only the most recent MAX_BACKUPS
 */
function cleanOldBackups() {
  const backupsDir = getBackupsDir();

  try {
    const files = fs
      .readdirSync(backupsDir)
      .filter((f) => f.startsWith('backup-') && f.endsWith('.sqlite'))
      .map((f) => ({
        name: f,
        path: path.join(backupsDir, f),
        mtime: fs.statSync(path.join(backupsDir, f)).mtime.getTime(),
      }))
      .sort((a, b) => b.mtime - a.mtime); // newest first

    if (files.length > MAX_BACKUPS) {
      const toDelete = files.slice(MAX_BACKUPS);
      for (const file of toDelete) {
        fs.unlinkSync(file.path);
        console.log(`[BackupService] Deleted old backup: ${file.name}`);
      }
    }
  } catch (e) {
    console.error('[BackupService] Error cleaning old backups:', e);
  }
}

/**
 * Check if a backup is needed (last backup older than 24 hours)
 * @returns {boolean}
 */
function shouldBackup() {
  const backupsDir = getBackupsDir();

  try {
    const files = fs
      .readdirSync(backupsDir)
      .filter((f) => f.startsWith('backup-') && f.endsWith('.sqlite'))
      .map((f) => ({
        name: f,
        mtime: fs.statSync(path.join(backupsDir, f)).mtime.getTime(),
      }))
      .sort((a, b) => b.mtime - a.mtime);

    if (files.length === 0) {
      return true;
    }

    const latestBackupAge = Date.now() - files[0].mtime;
    return latestBackupAge > BACKUP_INTERVAL_MS;
  } catch (e) {
    console.error('[BackupService] Error checking backup status:', e);
    return true; // backup if unsure
  }
}

/**
 * Run on application startup: check if backup is needed and perform it
 */
function runOnStartup() {
  try {
    if (shouldBackup()) {
      console.log('[BackupService] Automatic backup triggered on startup');
      backup();
    } else {
      console.log('[BackupService] No backup needed at this time');
    }
  } catch (e) {
    console.error('[BackupService] Startup backup failed:', e);
  }
}

export default {
  backup,
  cleanOldBackups,
  shouldBackup,
  runOnStartup,
  getBackupsDir,
};
