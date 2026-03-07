import crypto from 'crypto';
import terminalService from '../services/terminal-service.js';

/**
 * Register IPC handlers for terminal / code execution
 * @param {Electron.IpcMain} ipcMain
 * @param {Object} services - { database }
 */
export default function registerTerminalHandlers(ipcMain, services) {
  const { database } = services;

  /**
   * terminal:execute - Run a shell command
   * Args: command, cwd, timeout
   */
  ipcMain.handle('terminal:execute', async (event, command, cwd, timeout) => {
    try {
      if (!command || typeof command !== 'string') {
        throw new Error('Command is required');
      }

      // Execute
      const result = await terminalService.execute(command, cwd, timeout);

      // Audit trail
      try {
        database.insert('audit_trail', {
          id: crypto.randomUUID(),
          action: 'terminal_execute',
          resource_type: 'terminal',
          resource_id: String(result.pid || ''),
          details: JSON.stringify({
            command: command.slice(0, 200),
            cwd,
            exitCode: result.exitCode,
            duration: result.duration,
            killed: result.killed,
          }),
        });
      } catch {}

      return {
        success: result.exitCode === 0,
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        duration: result.duration,
        killed: result.killed,
      };
    } catch (error) {
      console.error('[Terminal Handler] Error:', error);
      return {
        success: false,
        stdout: '',
        stderr: error.message,
        exitCode: -1,
        duration: 0,
      };
    }
  });

  /**
   * terminal:kill - Kill a running process
   */
  ipcMain.handle('terminal:kill', async (event, pid) => {
    try {
      const killed = terminalService.kill(pid);
      return { success: killed };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}
