import { Menu } from 'electron';

export default function createMenu(mainWindow) {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Client',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow.webContents.send('menu:new-client'),
        },
        {
          label: 'New Project',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => mainWindow.webContents.send('menu:new-project'),
        },
        { type: 'separator' },
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => mainWindow.webContents.send('menu:settings'),
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { role: 'resetZoom' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Tools',
      submenu: [
        {
          label: 'AI Workspace',
          accelerator: 'CmdOrCtrl+Shift+A',
          click: () => mainWindow.webContents.send('menu:workspace'),
        },
        {
          label: 'Tax Calculator',
          click: () => mainWindow.webContents.send('menu:tax'),
        },
        {
          label: 'QS Estimator',
          click: () => mainWindow.webContents.send('menu:qs'),
        },
        { type: 'separator' },
        {
          label: 'Backup Database',
          click: () => mainWindow.webContents.send('menu:backup'),
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About AME Pro',
          click: () => mainWindow.webContents.send('menu:about'),
        },
        {
          label: 'Check for Updates',
          click: () => mainWindow.webContents.send('menu:check-updates'),
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
};
