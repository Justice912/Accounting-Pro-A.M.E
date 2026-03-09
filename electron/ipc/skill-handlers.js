/**
 * Register IPC handlers for skills/plugin operations
 */
export default function registerSkillHandlers(ipcMain, services) {
  const { skillService } = services;

  ipcMain.handle('skill:create', async (event, data) => {
    try {
      const id = skillService.createSkill(data);
      return { success: true, id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('skill:import', async (event, filePath) => {
    try {
      const id = skillService.importSkillFile(filePath);
      return { success: true, id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('skill:list', async () => {
    try {
      return skillService.listSkills();
    } catch (error) {
      return [];
    }
  });

  ipcMain.handle('skill:get', async (event, id) => {
    try {
      return skillService.getSkill(id);
    } catch {
      return null;
    }
  });

  ipcMain.handle('skill:toggle', async (event, id, active) => {
    try {
      skillService.toggleSkill(id, active);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('skill:update', async (event, id, updates) => {
    try {
      skillService.updateSkill(id, updates);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('skill:delete', async (event, id) => {
    try {
      skillService.deleteSkill(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}
