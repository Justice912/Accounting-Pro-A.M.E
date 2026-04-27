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
import memoryService from './services/memory-service.js';
import webSearchService from './services/web-search-service.js';
import skillService from './services/skill-service.js';

// IPC handlers
import registerAIHandlers from './ipc/ai-handlers.js';
import registerDBHandlers from './ipc/db-handlers.js';
import registerDocHandlers from './ipc/doc-handlers.js';
import registerSettingsHandlers from './ipc/settings-handlers.js';
import registerFileHandlers from './ipc/file-handlers.js';
import registerTerminalHandlers from './ipc/terminal-handlers.js';
import registerMemoryHandlers from './ipc/memory-handlers.js';
import registerSearchHandlers from './ipc/search-handlers.js';
import registerSkillHandlers from './ipc/skill-handlers.js';
import registerClientHandlers from './ipc/client-handlers.js';
import registerVatHandlers from './ipc/vat-handlers.js';

// Menu
import createMenu from './menu.js';

let mainWindow = null;

function createWindow() {
  const preloadPath = path.join(__dirname, '../preload/index.mjs');
  let revealTimeout = null;

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

  const clearRevealTimeout = () => {
    if (revealTimeout) {
      clearTimeout(revealTimeout);
      revealTimeout = null;
    }
  };

  const revealMainWindow = (reason) => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      clearRevealTimeout();
      return;
    }

    clearRevealTimeout();

    if (mainWindow.isVisible()) {
      return;
    }

    console.log(`[Window] Revealing main window via ${reason}`);

    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }

    mainWindow.show();
    mainWindow.focus();
  };

  // Prefer ready-to-show, but fall back if Chromium never emits it.
  mainWindow.once('ready-to-show', () => {
    revealMainWindow('ready-to-show');
  });
  mainWindow.webContents.once('did-finish-load', () => {
    revealMainWindow('did-finish-load');
  });
  mainWindow.webContents.on('did-fail-load', (_, errorCode, errorDescription, validatedURL, isMainFrame) => {
    if (!isMainFrame) {
      return;
    }

    console.error(
      `[Window] Renderer failed to load (${errorCode}) ${errorDescription}: ${validatedURL}`,
    );
    revealMainWindow('did-fail-load');
  });
  mainWindow.webContents.on('render-process-gone', (_, details) => {
    console.error('[Window] Renderer process exited unexpectedly:', details);
  });
  mainWindow.on('unresponsive', () => {
    console.error('[Window] Main window became unresponsive');
  });
  revealTimeout = setTimeout(() => {
    revealMainWindow('timeout-fallback');
  }, 1500);

  // Notify renderer of maximize state changes
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window:maximize-change', true);
  });
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window:maximize-change', false);
  });

  mainWindow.on('closed', () => {
    clearRevealTimeout();
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
    memoryService,
    webSearchService,
    skillService,
  };

  registerWindowControls();
  registerAIHandlers(ipcMain, services);
  registerDBHandlers(ipcMain, services);
  registerDocHandlers(ipcMain, services);
  registerSettingsHandlers(ipcMain, services);
  registerFileHandlers(ipcMain, services);
  registerTerminalHandlers(ipcMain, services);
  registerMemoryHandlers(ipcMain, services);
  registerSearchHandlers(ipcMain, services);
  registerSkillHandlers(ipcMain, services);
  registerClientHandlers(ipcMain, services);
  registerVatHandlers(ipcMain, services);

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

  // Initialize services that need the database
  memoryService.init(database);
  skillService.init(database);

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
