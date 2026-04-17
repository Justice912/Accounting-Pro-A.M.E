import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  // AI
  sendToAI: (payload) =>
    ipcRenderer.invoke('ai:send', payload.domain, payload.subdomain, payload.messages, payload.conversationId, payload.model, {
      clientId: payload.clientId || null,
      webSearch: payload.webSearch || false,
    }),
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

  // Memory / Learning
  saveMemory: (data) => ipcRenderer.invoke('memory:save', data),
  listMemories: (domain) => ipcRenderer.invoke('memory:list', domain),
  deleteMemory: (id) => ipcRenderer.invoke('memory:delete', id),
  clearMemories: (domain) => ipcRenderer.invoke('memory:clear', domain),

  // Web Search
  webSearch: (query, maxResults) => ipcRenderer.invoke('web:search', query, maxResults),
  fetchPage: (url) => ipcRenderer.invoke('web:fetch-page', url),

  // Skills / Plugins
  createSkill: (data) => ipcRenderer.invoke('skill:create', data),
  importSkill: (filePath) => ipcRenderer.invoke('skill:import', filePath),
  listSkills: () => ipcRenderer.invoke('skill:list'),
  getSkill: (id) => ipcRenderer.invoke('skill:get', id),
  toggleSkill: (id, active) => ipcRenderer.invoke('skill:toggle', id, active),
  updateSkill: (id, updates) => ipcRenderer.invoke('skill:update', id, updates),
  deleteSkill: (id) => ipcRenderer.invoke('skill:delete', id),

  // Clients
  createClient: (data) => ipcRenderer.invoke('client:create', data),
  updateClient: (id, data) => ipcRenderer.invoke('client:update', id, data),
  deleteClient: (id) => ipcRenderer.invoke('client:delete', id),
  getClient: (id) => ipcRenderer.invoke('client:get', id),
  listClients: () => ipcRenderer.invoke('client:list'),
  searchClients: (query) => ipcRenderer.invoke('client:search', query),

  // Terminal / Code Execution
  executeCommand: (command, cwd, timeout) =>
    ipcRenderer.invoke('terminal:execute', command, cwd, timeout),
  killProcess: (pid) => ipcRenderer.invoke('terminal:kill', pid),

  // VAT Capture
  vatListReceipts: (clientId, filters) => ipcRenderer.invoke('vat:receipt:list', clientId, filters),
  vatPendingCount: () => ipcRenderer.invoke('vat:receipt:pending-count'),
  vatGetReceipt: (id) => ipcRenderer.invoke('vat:receipt:get', id),
  vatSaveReceipt: (data) => ipcRenderer.invoke('vat:receipt:save', data),
  vatDeleteReceipt: (id) => ipcRenderer.invoke('vat:receipt:delete', id),
  vatUpdateReceiptStatus: (id, status, notes) => ipcRenderer.invoke('vat:receipt:update-status', id, status, notes),
  vatBulkStatus: (ids, status) => ipcRenderer.invoke('vat:receipt:bulk-status', ids, status),
  vatImportImage: () => ipcRenderer.invoke('vat:receipt:import-image'),
  vatExtractReceipt: (imagePath) => ipcRenderer.invoke('vat:receipt:extract', imagePath),
  vatVerifyVatNumber: (vatNumber) => ipcRenderer.invoke('vat:verify-vat', vatNumber),
  vatImportBank: (clientId) => ipcRenderer.invoke('vat:bank:import', clientId),
  vatListBankTxns: (clientId, filters) => ipcRenderer.invoke('vat:bank:list', clientId, filters),
  vatMatchBankTxn: (txnId, receiptId) => ipcRenderer.invoke('vat:bank:match', txnId, receiptId),
  vatGetReminders: (clientId, period) => ipcRenderer.invoke('vat:reminders:get', clientId, period),
  vatUpdateReminderState: (payload) => ipcRenderer.invoke('vat:reminder:update-state', payload),
  vatReminderCount: () => ipcRenderer.invoke('vat:reminders:count'),
  vatDashboardGet: (period) => ipcRenderer.invoke('vat:dashboard:get', period),
  vatGenerateSchedule: (clientId, period) => ipcRenderer.invoke('vat:schedule:generate', clientId, period),
  vatGetSchedule: (clientId, period) => ipcRenderer.invoke('vat:schedule:get', clientId, period),
  vatExportExcel: (clientId, period) => ipcRenderer.invoke('vat:export:excel', clientId, period),

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
