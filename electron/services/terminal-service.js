import { spawn } from 'child_process';
import path from 'path';
import { app } from 'electron';

// Track active processes
const activeProcesses = new Map();

// Max execution time (120 seconds)
const MAX_TIMEOUT = 120000;
const DEFAULT_TIMEOUT = 30000;

/**
 * Detect the appropriate shell and command format for the platform
 */
function getShellConfig(command) {
  if (process.platform === 'win32') {
    return { shell: 'cmd.exe', args: ['/c', command] };
  }
  return { shell: '/bin/sh', args: ['-c', command] };
}

/**
 * Execute a command and return stdout/stderr
 * @param {string} command - Shell command to run
 * @param {string} cwd - Working directory (defaults to user home)
 * @param {number} timeout - Timeout in ms (default 30s, max 120s)
 * @returns {{ stdout, stderr, exitCode, killed, duration }}
 */
function execute(command, cwd, timeout) {
  return new Promise((resolve) => {
    const effectiveTimeout = Math.min(timeout || DEFAULT_TIMEOUT, MAX_TIMEOUT);
    const effectiveCwd = cwd || app.getPath('home');
    const { shell, args } = getShellConfig(command);

    const startTime = Date.now();
    let stdout = '';
    let stderr = '';
    let killed = false;

    const proc = spawn(shell, args, {
      cwd: effectiveCwd,
      timeout: effectiveTimeout,
      env: { ...process.env },
      windowsHide: true,
    });

    const pid = proc.pid;
    if (pid) {
      activeProcesses.set(pid, proc);
    }

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
      // Cap output at 100KB to prevent memory issues
      if (stdout.length > 102400) {
        stdout = stdout.slice(0, 102400) + '\n... [output truncated at 100KB]';
        kill(pid);
        killed = true;
      }
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
      if (stderr.length > 51200) {
        stderr = stderr.slice(0, 51200) + '\n... [stderr truncated at 50KB]';
      }
    });

    proc.on('close', (exitCode) => {
      if (pid) activeProcesses.delete(pid);
      const duration = Date.now() - startTime;
      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: exitCode ?? -1,
        killed,
        duration,
        pid,
      });
    });

    proc.on('error', (err) => {
      if (pid) activeProcesses.delete(pid);
      const duration = Date.now() - startTime;
      resolve({
        stdout: '',
        stderr: err.message,
        exitCode: -1,
        killed: false,
        duration,
        pid,
      });
    });
  });
}

/**
 * Kill a running process by PID
 */
function kill(pid) {
  const proc = activeProcesses.get(pid);
  if (proc) {
    try {
      proc.kill('SIGTERM');
      // Force kill after 3s if still alive
      setTimeout(() => {
        try { proc.kill('SIGKILL'); } catch {}
      }, 3000);
    } catch {}
    activeProcesses.delete(pid);
    return true;
  }
  return false;
}

/**
 * Get list of active processes
 */
function getActiveProcesses() {
  return Array.from(activeProcesses.keys());
}

export default {
  execute,
  kill,
  getActiveProcesses,
};
