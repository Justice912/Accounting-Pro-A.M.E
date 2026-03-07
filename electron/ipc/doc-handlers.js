import crypto from 'crypto';
import path from 'path';

/**
 * Register IPC handlers for document operations
 * @param {Electron.IpcMain} ipcMain
 * @param {Object} services - { documentEngine, database }
 */
export default function registerDocHandlers(ipcMain, services) {
  const { documentEngine, database } = services;

  /**
   * doc:generate - Generate a document (excel, word, or pdf)
   * @param {string} type - 'excel', 'word', or 'pdf'
   * @param {Object} data - Data to populate the document
   * @param {string} template - Template name
   */
  ipcMain.handle('doc:generate', async (event, type, data, template) => {
    try {
      const filePath = await documentEngine.generate(type, data, template);

      // Save document record to database
      const docId = database.insert('documents', {
        id: crypto.randomUUID(),
        project_id: data.projectId || null,
        client_id: data.clientId || null,
        name: data.title || template || `${type}-document`,
        type,
        file_path: filePath,
        domain: data.domain || null,
        template: template || null,
      });

      // Audit trail
      database.insert('audit_trail', {
        id: crypto.randomUUID(),
        action: 'document_generated',
        resource_type: 'document',
        resource_id: docId,
        details: JSON.stringify({ type, template, name: data.title }),
      });

      return {
        success: true,
        id: docId,
        filePath,
        type,
      };
    } catch (error) {
      console.error('[Doc Handler] Error generating document:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  });

  /**
   * doc:pdf-to-excel - Extract PDF content and convert to Excel
   * @param {string} pdfFilePath - Absolute path to source PDF
   * @param {Object} options - { sheetName }
   */
  ipcMain.handle('doc:pdf-to-excel', async (event, pdfFilePath, options) => {
    try {
      const filePath = await documentEngine.pdfToExcel(pdfFilePath, options || {});

      // Save document record
      const docId = crypto.randomUUID();
      database.insert('documents', {
        id: docId,
        project_id: null,
        client_id: null,
        name: `PDF Extract - ${path.basename(pdfFilePath)}`,
        type: 'excel',
        file_path: filePath,
        domain: null,
        template: 'pdf-to-excel',
      });

      database.insert('audit_trail', {
        id: crypto.randomUUID(),
        action: 'pdf_to_excel',
        resource_type: 'document',
        resource_id: docId,
        details: JSON.stringify({ sourcePdf: pdfFilePath, outputExcel: filePath }),
      });

      return { success: true, filePath, id: docId };
    } catch (error) {
      console.error('[Doc Handler] PDF→Excel error:', error);
      return { success: false, error: error.message };
    }
  });

  /**
   * doc:export-content - Generate a document from markdown/text content
   * @param {string} type - 'pdf', 'excel', or 'word'
   * @param {string} content - The text/markdown content to export
   * @param {string} title - Document title
   */
  ipcMain.handle('doc:export-content', async (event, type, content, title) => {
    try {
      let filePath;
      const safeName = (title || 'export').replace(/[^a-zA-Z0-9-_ ]/g, '').substring(0, 50);

      if (type === 'pdf') {
        filePath = await documentEngine.generatePDF(
          { title: title || 'Export', content },
          safeName
        );
      } else if (type === 'word') {
        filePath = await documentEngine.generateWord(
          { title: title || 'Export', body: content },
          safeName
        );
      } else if (type === 'excel') {
        // Parse content into rows: split by newlines, cells by tab or |
        const lines = content.split('\n').filter((l) => l.trim());
        const rows = lines.map((line) =>
          line
            .split(/\t|\|/)
            .map((c) => c.trim())
            .filter((c) => c)
        );
        const headers = rows.length > 0 ? rows[0] : ['Data'];
        const dataRows = rows.slice(1);

        filePath = await documentEngine.generateExcel(
          { headers, rows: dataRows, title },
          safeName
        );
      } else {
        throw new Error(`Unsupported export type: ${type}`);
      }

      const docId = crypto.randomUUID();
      database.insert('documents', {
        id: docId,
        project_id: null,
        client_id: null,
        name: title || `${type}-export`,
        type,
        file_path: filePath,
        domain: null,
        template: 'content-export',
      });

      return { success: true, filePath, id: docId };
    } catch (error) {
      console.error('[Doc Handler] Export content error:', error);
      return { success: false, error: error.message };
    }
  });

  /**
   * doc:list - List all documents for a project (or all documents)
   */
  ipcMain.handle('doc:list', async (event, projectId) => {
    try {
      if (projectId) {
        return database.getAll(
          'SELECT * FROM documents WHERE project_id = ? ORDER BY created_at DESC',
          [projectId]
        );
      }
      return database.getAll('SELECT * FROM documents ORDER BY created_at DESC');
    } catch (error) {
      console.error('[Doc Handler] Error listing documents:', error);
      throw error;
    }
  });
};
