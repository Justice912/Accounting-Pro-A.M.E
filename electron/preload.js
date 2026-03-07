import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  // AI
  sendToAI: (payload) =>
    ipcRenderer.invoke('ai:send', payload.domain, payload.subdomain, payload.messages, payload.conversationId, payload.model),
  getProviderHealth: () => ipcRenderer.invoke('ai:health'),
  testProvider: (provider) => ipcRenderer.invoke('ai:test', provider),

  // Database - Conversations
  getConversations: (domain) => ipcRenderer.invoke('db:conversations:list', domain),
  saveConversation: (data) => ipcRenderer.invoke('db:conversations:save', data),
  deleteConversation: (id) => ipcRenderer.invoke('db:conversations:delete', id),
  renameConversation: (id, title) => ipcRenderer.invoke('db:conversations:rename', id, title),
  searchConversations: (query) => ipcRenderer.invoke('db:conversations:search', query),

  // Database - Messages
  getMessages: (conversationId) => ipcRenderer.invoke('db:messages:list', conversationId),
  saveMessage: (conversationId, message) =>
    ipcRenderer.invoke('db:messages:save', conversationId, message),

  // Database - Usage & Export
  getUsageStats: () => ipcRenderer.invoke('db:usage:stats'),
  exportConversation: (conversationId) =>
    ipcRenderer.invoke('db:conversations:export', conversationId),

  // Files
  openFile: (filePath) => ipcRenderer.invoke('file:open', filePath),
  saveFileDialog: (data, defaultName) =>
    ipcRenderer.invoke('file:save-dialog', data, defaultName),
  importFile: () => ipcRenderer.invoke('file:import'),
  extractFileText: (filePath) => ipcRenderer.invoke('file:extract-text', filePath),

  // Document Generation & Extraction
  generateDocument: (type, data, template) =>
    ipcRenderer.invoke('doc:generate', type, data, template),
  exportContent: (type, content, title) =>
    ipcRenderer.invoke('doc:export-content', type, content, title),
  pdfToExcel: (pdfFilePath, options) =>
    ipcRenderer.invoke('doc:pdf-to-excel', pdfFilePath, options),
  listDocuments: (projectId) => ipcRenderer.invoke('doc:list', projectId),

  // Terminal / Code Execution
  executeCommand: (command, cwd, timeout) =>
    ipcRenderer.invoke('terminal:execute', command, cwd, timeout),
  killProcess: (pid) => ipcRenderer.invoke('terminal:kill', pid),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  saveApiKey: (provider, key) =>
    ipcRenderer.invoke('settings:apikey:save', provider, key),
  getApiKey: (provider) => ipcRenderer.invoke('settings:apikey:get', provider),

  // App
  getVersion: () => ipcRenderer.invoke('app:version'),
  checkForUpdates: () => ipcRenderer.invoke('app:update:check'),
  getAppPath: () => ipcRenderer.invoke('app:path'),

  // Window controls
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  onMaximizeChange: (callback) => {
    ipcRenderer.on('window:maximize-change', (_, isMaximized) =>
      callback(isMaximized)
    );
    return () => ipcRenderer.removeAllListeners('window:maximize-change');
  },
});
