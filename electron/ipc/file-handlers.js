import fs from 'fs';
import path from 'path';

/**
 * Register IPC handlers for file operations
 * @param {Electron.IpcMain} ipcMain
 * @param {Object} services - { fileService }
 */
export default function registerFileHandlers(ipcMain, services) {
  const { fileService } = services;

  /**
   * file:open - Open a file with the OS default application
   */
  ipcMain.handle('file:open', async (event, filePath) => {
    try {
      await fileService.openFile(filePath);
      return { success: true };
    } catch (error) {
      console.error('[File Handler] Error opening file:', error);
      return { success: false, error: error.message };
    }
  });

  /**
   * file:save-dialog - Show save dialog and write data to selected path
   */
  ipcMain.handle('file:save-dialog', async (event, data, defaultName) => {
    try {
      const filePath = await fileService.saveFileDialog(data, defaultName);
      if (!filePath) {
        return { success: false, cancelled: true };
      }
      return { success: true, filePath };
    } catch (error) {
      console.error('[File Handler] Error saving file:', error);
      return { success: false, error: error.message };
    }
  });

  /**
   * file:import - Show open dialog and return file content
   */
  ipcMain.handle('file:import', async () => {
    try {
      const result = await fileService.importFile();
      if (!result) {
        return { success: false, cancelled: true };
      }
      return { success: true, ...result };
    } catch (error) {
      console.error('[File Handler] Error importing file:', error);
      return { success: false, error: error.message };
    }
  });

  /**
   * file:extract-text - Extract text content from various file types
   * Supports: PDF, Excel, Word, CSV, TXT, JSON, XML
   */
  ipcMain.handle('file:extract-text', async (event, filePath) => {
    try {
      const ext = path.extname(filePath).toLowerCase();

      switch (ext) {
        case '.pdf': {
          const pdfParse = (await import('pdf-parse')).default;
          const buffer = fs.readFileSync(filePath);
          const data = await pdfParse(buffer);
          return { success: true, text: data.text, pages: data.numpages };
        }

        case '.xlsx':
        case '.xls': {
          const ExcelJS = (await import('exceljs')).default;
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.readFile(filePath);
          let text = '';
          workbook.eachSheet((sheet) => {
            text += `--- Sheet: ${sheet.name} ---\n`;
            sheet.eachRow((row) => {
              const values = [];
              row.eachCell((cell) => {
                values.push(cell.text || cell.value || '');
              });
              text += values.join('\t') + '\n';
            });
            text += '\n';
          });
          return { success: true, text };
        }

        case '.docx': {
          const mammoth = await import('mammoth');
          const result = await mammoth.extractRawText({ path: filePath });
          return { success: true, text: result.value };
        }

        case '.csv':
        case '.txt':
        case '.json':
        case '.xml': {
          const text = fs.readFileSync(filePath, 'utf-8');
          return { success: true, text };
        }

        case '.png':
        case '.jpg':
        case '.jpeg':
        case '.gif':
        case '.webp': {
          const fileName = path.basename(filePath);
          return { success: true, text: `(Image attached: ${fileName})` };
        }

        default:
          return { success: false, error: `Unsupported file type: ${ext}` };
      }
    } catch (error) {
      console.error('[File Handler] Error extracting text:', error);
      return { success: false, error: error.message };
    }
  });
}
