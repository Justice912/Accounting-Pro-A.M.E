import { shell, dialog, BrowserWindow, app } from 'electron';
import fs from 'fs';
import path from 'path';

/**
 * Get the documents directory path
 */
function getDocumentsDir() {
  const dir = path.join(app.getPath('userData'), 'documents');
  ensureDir(dir);
  return dir;
}

/**
 * Ensure a directory exists, creating it if necessary
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Open a file with the OS default application
 * @param {string} filePath - Path to the file to open
 */
async function openFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const result = await shell.openPath(filePath);
  if (result) {
    throw new Error(`Failed to open file: ${result}`);
  }
  return true;
}

/**
 * Show a save dialog and write data to the selected path
 * @param {Buffer|string} data - Data to write
 * @param {string} defaultName - Default file name
 * @returns {string|null} Path where file was saved, or null if cancelled
 */
async function saveFileDialog(data, defaultName) {
  const win = BrowserWindow.getFocusedWindow();
  const ext = path.extname(defaultName || '').slice(1);

  const filters = [];
  if (ext === 'xlsx') {
    filters.push({ name: 'Excel Workbook', extensions: ['xlsx'] });
  } else if (ext === 'docx') {
    filters.push({ name: 'Word Document', extensions: ['docx'] });
  } else if (ext === 'pdf') {
    filters.push({ name: 'PDF Document', extensions: ['pdf'] });
  } else if (ext === 'csv') {
    filters.push({ name: 'CSV File', extensions: ['csv'] });
  }
  filters.push({ name: 'All Files', extensions: ['*'] });

  const result = await dialog.showSaveDialog(win, {
    defaultPath: defaultName,
    filters,
  });

  if (result.canceled || !result.filePath) {
    return null;
  }

  if (Buffer.isBuffer(data)) {
    fs.writeFileSync(result.filePath, data);
  } else {
    fs.writeFileSync(result.filePath, data, 'utf8');
  }

  console.log(`[FileService] File saved to: ${result.filePath}`);
  return result.filePath;
}

/**
 * Show an open dialog and return the selected file content
 * @returns {Object|null} { name, path, content, buffer } or null if cancelled
 */
async function importFile() {
  const win = BrowserWindow.getFocusedWindow();
  const result = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: [
      {
        name: 'Documents',
        extensions: ['xlsx', 'xls', 'csv', 'docx', 'pdf', 'txt', 'json'],
      },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const filePath = result.filePaths[0];
  const fileName = path.basename(filePath);
  const ext = path.extname(filePath).toLowerCase();

  // For text-based files, read as string
  if (['.csv', '.txt', '.json'].includes(ext)) {
    const content = fs.readFileSync(filePath, 'utf8');
    return { name: fileName, path: filePath, content, type: ext.slice(1) };
  }

  // For binary files, read as buffer and return base64
  const buffer = fs.readFileSync(filePath);
  return {
    name: fileName,
    path: filePath,
    content: buffer.toString('base64'),
    type: ext.slice(1),
    isBinary: true,
  };
}

export default {
  openFile,
  saveFileDialog,
  importFile,
  getDocumentsDir,
  ensureDir,
};
