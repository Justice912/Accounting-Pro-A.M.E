import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

// Services
import database from './services/database.js';
import keychain from './services/keychain.js';
import aiGateway from './services/ai-gateway.js';
import promptEngine from './services/prompt-engine.js';
import documentEngine from './services/document-engine.js';
import fileService from './services/file-service.js';
import backupService from './services/backup-service.js';
import workflowEngine from './services/workflow-engine.js';

// IPC handlers
import registerAIHandlers from './ipc/ai-handlers.js';
import registerDBHandlers from './ipc/db-handlers.js';
import registerDocHandlers from './ipc/doc-handlers.js';
import registerSettingsHandlers from './ipc/settings-handlers.js';
import registerFileHandlers from './ipc/file-handlers.js';
import registerTerminalHandlers from './ipc/terminal-handlers.js';

// Menu
import createMenu from './menu.js';

let mainWindow = null;

function createWindow() {
  const preloadPath = path.join(__dirname, '../preload/index.mjs');

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    frame: false,
    backgroundColor: '#0f172a',
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: preloadPath,
    },
  });

  // Load renderer
  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Show window when ready to avoid visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Notify renderer of maximize state changes
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window:maximize-change', true);
  });
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window:maximize-change', false);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Set up native menu
  createMenu(mainWindow);
}

function registerWindowControls() {
  ipcMain.on('window:minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });
  ipcMain.on('window:maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });
  ipcMain.on('window:close', () => {
    if (mainWindow) mainWindow.close();
  });
  ipcMain.handle('window:isMaximized', () => {
    return mainWindow ? mainWindow.isMaximized() : false;
  });
}

function registerAllHandlers() {
  const services = {
    database,
    keychain,
    aiGateway,
    promptEngine,
    documentEngine,
    fileService,
    backupService,
    workflowEngine,
  };

  registerWindowControls();
  registerAIHandlers(ipcMain, services);
  registerDBHandlers(ipcMain, services);
  registerDocHandlers(ipcMain, services);
  registerSettingsHandlers(ipcMain, services);
  registerFileHandlers(ipcMain, services);
  registerTerminalHandlers(ipcMain, services);

  // App info handlers
  ipcMain.handle('app:version', () => {
    return app.getVersion();
  });
  ipcMain.handle('app:update:check', () => {
    // Placeholder for auto-updater integration
    return { updateAvailable: false, currentVersion: app.getVersion() };
  });
  ipcMain.handle('app:path', () => {
    return app.getPath('userData');
  });
}

app.whenReady().then(async () => {
  // Initialize database
  await database.initialize();

  // Run startup backup check
  backupService.runOnStartup();

  // Register IPC handlers
  registerAllHandlers();

  // Create window
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: prevent new window creation
app.on('web-contents-created', (_, contents) => {
  contents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });
});
