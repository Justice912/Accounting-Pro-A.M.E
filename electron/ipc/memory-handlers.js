/**
 * Register IPC handlers for AI memory operations
 */
export default function registerMemoryHandlers(ipcMain, services) {
  const { memoryService } = services;

  ipcMain.handle('memory:save', async (event, data) => {
    try {
      const id = memoryService.saveMemory(data);
      return { success: true, id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('memory:list', async (event, domain) => {
    try {
      if (domain) return memoryService.getMemories(domain);
      return memoryService.getAllMemories();
    } catch (error) {
      return [];
    }
  });

  ipcMain.handle('memory:delete', async (event, id) => {
    try {
      memoryService.deleteMemory(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('memory:clear', async (event, domain) => {
    try {
      memoryService.clearMemories(domain);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}
