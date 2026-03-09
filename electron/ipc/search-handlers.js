/**
 * Register IPC handlers for web search operations
 */
export default function registerSearchHandlers(ipcMain, services) {
  const { webSearchService } = services;

  ipcMain.handle('web:search', async (event, query, maxResults) => {
    try {
      const result = await webSearchService.search(query, maxResults || 5);
      return { success: true, ...result };
    } catch (error) {
      return { success: false, error: error.message, results: [], summary: '' };
    }
  });

  ipcMain.handle('web:fetch-page', async (event, url) => {
    try {
      const content = await webSearchService.fetchPageContent(url);
      return { success: true, content };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}
