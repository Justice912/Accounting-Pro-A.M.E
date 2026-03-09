import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { app } from 'electron';

/**
 * Strip markdown syntax from text, returning clean readable text.
 */
function stripMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/^#{1,6}\s+/gm, '')         // headings
    .replace(/\*\*\*(.*?)\*\*\*/g, '$1')  // bold+italic
    .replace(/\*\*(.*?)\*\*/g, '$1')      // bold
    .replace(/\*(.*?)\*/g, '$1')          // italic
    .replace(/~~(.*?)~~/g, '$1')          // strikethrough
    .replace(/`{3}[\s\S]*?`{3}/g, '')     // code blocks (remove entirely)
    .replace(/`([^`]+)`/g, '$1')          // inline code
    .replace(/^\s*[-*+]\s+/gm, '  - ')   // normalize list markers
    .replace(/^\s*\d+\.\s+/gm, '')        // numbered list markers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links → text only
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // images → alt text
    .replace(/^>\s?/gm, '')               // blockquotes
    .replace(/^---+$/gm, '')              // horizontal rules
    .replace(/\n{3,}/g, '\n\n')           // collapse excessive blank lines
    .trim();
}

/**
 * Word-wrap a line to maxWidth characters, splitting at word boundaries.
 */
function wrapLine(text, maxWidth = 80) {
  if (!text || text.length <= maxWidth) return [text || ''];
  const words = text.split(/\s+/);
  const lines = [];
  let current = '';
  for (const word of words) {
    if (current && (current.length + 1 + word.length) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = current ? current + ' ' + word : word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

/**
 * Detect if a line is a markdown heading and return its level (1-6) or 0.
 */
function getHeadingLevel(line) {
  const match = line.match(/^(#{1,6})\s+/);
  return match ? match[1].length : 0;
}

/**
 * Sanitize text for WinAnsi encoding (pdf-lib standard fonts only support WinAnsi).
 * Replaces unsupported Unicode characters with safe ASCII equivalents.
 */
function sanitizeForPdf(text) {
  if (!text) return '';
  return text
    .replace(/\u2022/g, '-')       // bullet → dash
    .replace(/\u2013/g, '-')       // en dash → dash
    .replace(/\u2014/g, '--')      // em dash → double dash
    .replace(/\u2018/g, "'")       // left single quote
    .replace(/\u2019/g, "'")       // right single quote
    .replace(/\u201C/g, '"')       // left double quote
    .replace(/\u201D/g, '"')       // right double quote
    .replace(/\u2026/g, '...')     // ellipsis
    .replace(/\u00A0/g, ' ')       // non-breaking space
    .replace(/\u2032/g, "'")       // prime
    .replace(/\u2033/g, '"')       // double prime
    .replace(/\u2192/g, '->')      // right arrow
    .replace(/\u2190/g, '<-')      // left arrow
    .replace(/\u2713/g, 'v')       // check mark
    .replace(/\u2717/g, 'x')       // cross mark
    .replace(/\u00B7/g, '-')       // middle dot
    .replace(/[^\x00-\xFF]/g, ''); // strip anything else outside Latin-1
}

/**
 * Get the documents output directory
 */
function getDocumentsDir() {
  const dir = path.join(app.getPath('userData'), 'documents');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Generate an Excel workbook using ExcelJS
 * @param {Object} data - Data to populate the workbook
 * @param {string} templateName - Template name to determine structure
 * @returns {string} Path to generated file
 */
async function generateExcel(data, templateName) {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AME Pro AI Workstation';
  workbook.created = new Date();

  if (templateName === 'tax-calculation') {
    const sheet = workbook.addWorksheet('Tax Calculation');

    // Header styling
    const headerFill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F172A' },
    };
    const headerFont = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };

    // Title
    sheet.mergeCells('A1:D1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = data.title || 'SA Tax Calculation';
    titleCell.font = { bold: true, size: 14 };

    sheet.mergeCells('A2:D2');
    sheet.getCell('A2').value = `Tax Year: ${data.taxYear || '2025'}`;

    // Headers row
    const headers = ['Description', 'Amount (ZAR)', 'Rate', 'Tax (ZAR)'];
    const headerRow = sheet.getRow(4);
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { horizontal: 'center' };
    });

    // Column widths
    sheet.getColumn(1).width = 30;
    sheet.getColumn(2).width = 18;
    sheet.getColumn(3).width = 12;
    sheet.getColumn(4).width = 18;

    // Data rows
    const items = data.items || [
      { description: 'Gross Income', amount: 0, rate: '', tax: 0 },
      { description: 'Less: Exemptions', amount: 0, rate: '', tax: 0 },
      { description: 'Taxable Income', amount: 0, rate: '', tax: 0 },
      { description: 'Tax on Taxable Income', amount: 0, rate: '', tax: 0 },
      { description: 'Less: Primary Rebate', amount: 0, rate: '', tax: 0 },
      { description: 'Less: Medical Credits', amount: 0, rate: '', tax: 0 },
      { description: 'Tax Payable', amount: 0, rate: '', tax: 0 },
    ];

    items.forEach((item, i) => {
      const row = sheet.getRow(5 + i);
      row.getCell(1).value = item.description;
      row.getCell(2).value = item.amount;
      row.getCell(2).numFmt = '#,##0.00';
      row.getCell(3).value = item.rate;
      row.getCell(4).value = item.tax;
      row.getCell(4).numFmt = '#,##0.00';
    });
  } else {
    // Generic data sheet
    const sheet = workbook.addWorksheet('Data');
    if (data.headers && data.rows) {
      sheet.addRow(data.headers);
      data.rows.forEach((row) => sheet.addRow(row));
    }
  }

  const fileName = `${templateName || 'document'}-${Date.now()}.xlsx`;
  const filePath = path.join(getDocumentsDir(), fileName);
  await workbook.xlsx.writeFile(filePath);

  console.log(`[DocumentEngine] Excel generated: ${filePath}`);
  return filePath;
}

/**
 * Generate a Word document using docx
 * @param {Object} data - Data to populate the document
 * @param {string} templateName - Template name to determine structure
 * @returns {string} Path to generated file
 */
async function generateWord(data, templateName) {
  const docx = await import('docx');
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
    Table,
    TableRow,
    TableCell,
    WidthType,
    BorderStyle,
  } = docx;

  const children = [];

  // Company header
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: data.companyName || 'AME Pro',
          bold: true,
          size: 32,
          color: '0F172A',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    })
  );

  // Document title
  children.push(
    new Paragraph({
      text: data.title || templateName || 'Document',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  // Date
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Date: ${data.date || new Date().toLocaleDateString('en-ZA')}`,
          size: 20,
        }),
      ],
      spacing: { after: 200 },
    })
  );

  // Content sections
  if (data.sections) {
    for (const section of data.sections) {
      children.push(
        new Paragraph({
          text: section.heading,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );
      children.push(
        new Paragraph({
          text: section.content,
          spacing: { after: 100 },
        })
      );
    }
  }

  // Body text — parse markdown into structured paragraphs
  if (data.body) {
    const bodyLines = data.body.split('\n');
    let inCodeBlock = false;
    let codeBuffer = [];

    for (const rawLine of bodyLines) {
      const trimmed = rawLine.trim();

      // Handle code block fences
      if (/^```/.test(trimmed)) {
        if (inCodeBlock) {
          // End code block — output collected code
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: codeBuffer.join('\n'),
                  font: 'Courier New',
                  size: 18,
                  color: '334155',
                }),
              ],
              spacing: { before: 50, after: 100 },
              indent: { left: 360 },
            })
          );
          codeBuffer = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
        continue;
      }

      if (inCodeBlock) {
        codeBuffer.push(rawLine);
        continue;
      }

      // Skip horizontal rules
      if (/^[-*_]{3,}$/.test(trimmed)) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: '' })],
            spacing: { after: 100 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' } },
          })
        );
        continue;
      }

      // Empty lines → spacing paragraph
      if (!trimmed) {
        children.push(new Paragraph({ text: '', spacing: { after: 50 } }));
        continue;
      }

      // Headings
      const headingLevel = getHeadingLevel(trimmed);
      if (headingLevel > 0) {
        const headingMap = {
          1: HeadingLevel.HEADING_1,
          2: HeadingLevel.HEADING_2,
          3: HeadingLevel.HEADING_3,
          4: HeadingLevel.HEADING_4,
          5: HeadingLevel.HEADING_5,
          6: HeadingLevel.HEADING_6,
        };
        children.push(
          new Paragraph({
            text: stripMarkdown(trimmed),
            heading: headingMap[headingLevel] || HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 },
          })
        );
        continue;
      }

      // List items (bullet or numbered)
      const bulletMatch = trimmed.match(/^[-*+]\s+(.*)/);
      const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (bulletMatch) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: stripMarkdown(bulletMatch[1]) })],
            bullet: { level: 0 },
            spacing: { after: 40 },
          })
        );
        continue;
      }
      if (numberedMatch) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: stripMarkdown(numberedMatch[2]) })],
            numbering: { reference: 'default-numbering', level: 0 },
            spacing: { after: 40 },
          })
        );
        continue;
      }

      // Blockquote
      if (trimmed.startsWith('>')) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: stripMarkdown(trimmed.replace(/^>\s?/, '')),
                italics: true,
                color: '64748B',
              }),
            ],
            indent: { left: 360 },
            spacing: { after: 60 },
          })
        );
        continue;
      }

      // Regular paragraph — handle inline bold/italic
      const runs = [];
      const parts = stripMarkdown(trimmed);
      runs.push(new TextRun({ text: parts, size: 22 }));
      children.push(
        new Paragraph({
          children: runs,
          spacing: { after: 80 },
        })
      );
    }
  }

  const doc = new Document({
    sections: [{ children }],
  });

  const buffer = await Packer.toBuffer(doc);
  const fileName = `${templateName || 'document'}-${Date.now()}.docx`;
  const filePath = path.join(getDocumentsDir(), fileName);
  fs.writeFileSync(filePath, buffer);

  console.log(`[DocumentEngine] Word document generated: ${filePath}`);
  return filePath;
}

/**
 * Generate a PDF document using pdf-lib
 * @param {Object} data - Data to populate the document
 * @param {string} templateName - Template name to determine structure
 * @returns {string} Path to generated file
 */
async function generatePDF(data, templateName) {
  const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');

  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  if (templateName === 'payslip') {
    const page = pdfDoc.addPage([595, 842]); // A4
    const { height } = page.getSize();
    let y = height - 50;

    // Company name
    page.drawText(sanitizeForPdf(data.companyName || 'Company Name'), {
      x: 50,
      y,
      size: 18,
      font: helveticaBold,
      color: rgb(0.06, 0.09, 0.16),
    });
    y -= 30;

    // Title
    page.drawText('PAYSLIP', {
      x: 50,
      y,
      size: 14,
      font: helveticaBold,
    });
    y -= 25;

    // Period
    page.drawText(sanitizeForPdf(`Pay Period: ${data.period || 'Month Year'}`), {
      x: 50,
      y,
      size: 10,
      font: helvetica,
    });
    y -= 20;

    // Employee details
    page.drawText(sanitizeForPdf(`Employee: ${data.employeeName || 'Employee Name'}`), {
      x: 50,
      y,
      size: 10,
      font: helvetica,
    });
    y -= 15;
    page.drawText(sanitizeForPdf(`ID Number: ${data.idNumber || 'N/A'}`), {
      x: 50,
      y,
      size: 10,
      font: helvetica,
    });
    y -= 15;
    page.drawText(sanitizeForPdf(`Tax Number: ${data.taxNumber || 'N/A'}`), {
      x: 50,
      y,
      size: 10,
      font: helvetica,
    });
    y -= 30;

    // Line
    page.drawLine({
      start: { x: 50, y },
      end: { x: 545, y },
      thickness: 1,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= 20;

    // Earnings header
    page.drawText('EARNINGS', {
      x: 50,
      y,
      size: 11,
      font: helveticaBold,
    });
    y -= 18;

    const earnings = data.earnings || [
      { description: 'Basic Salary', amount: 0 },
    ];
    let totalEarnings = 0;
    for (const item of earnings) {
      page.drawText(sanitizeForPdf(item.description), { x: 60, y, size: 10, font: helvetica });
      page.drawText(`R ${Number(item.amount).toFixed(2)}`, {
        x: 420,
        y,
        size: 10,
        font: helvetica,
      });
      totalEarnings += Number(item.amount);
      y -= 15;
    }

    y -= 10;
    page.drawText('Total Earnings', {
      x: 60,
      y,
      size: 10,
      font: helveticaBold,
    });
    page.drawText(`R ${totalEarnings.toFixed(2)}`, {
      x: 420,
      y,
      size: 10,
      font: helveticaBold,
    });
    y -= 25;

    // Deductions header
    page.drawText('DEDUCTIONS', {
      x: 50,
      y,
      size: 11,
      font: helveticaBold,
    });
    y -= 18;

    const deductions = data.deductions || [{ description: 'PAYE', amount: 0 }];
    let totalDeductions = 0;
    for (const item of deductions) {
      page.drawText(sanitizeForPdf(item.description), { x: 60, y, size: 10, font: helvetica });
      page.drawText(`R ${Number(item.amount).toFixed(2)}`, {
        x: 420,
        y,
        size: 10,
        font: helvetica,
      });
      totalDeductions += Number(item.amount);
      y -= 15;
    }

    y -= 10;
    page.drawText('Total Deductions', {
      x: 60,
      y,
      size: 10,
      font: helveticaBold,
    });
    page.drawText(`R ${totalDeductions.toFixed(2)}`, {
      x: 420,
      y,
      size: 10,
      font: helveticaBold,
    });
    y -= 30;

    // Net pay
    page.drawLine({
      start: { x: 50, y: y + 5 },
      end: { x: 545, y: y + 5 },
      thickness: 2,
      color: rgb(0.06, 0.09, 0.16),
    });
    page.drawText('NET PAY', {
      x: 50,
      y: y - 10,
      size: 13,
      font: helveticaBold,
      color: rgb(0.06, 0.09, 0.16),
    });
    page.drawText(`R ${(totalEarnings - totalDeductions).toFixed(2)}`, {
      x: 400,
      y: y - 10,
      size: 13,
      font: helveticaBold,
      color: rgb(0.06, 0.09, 0.16),
    });
  } else {
    // Generic PDF with proper markdown handling
    let currentPage = pdfDoc.addPage([595, 842]);
    const pageWidth = 595;
    const margin = 50;
    const textWidth = pageWidth - margin * 2;
    let y = currentPage.getSize().height - 50;

    // Draw title
    currentPage.drawText(sanitizeForPdf(data.title || 'Document'), {
      x: margin,
      y,
      size: 18,
      font: helveticaBold,
      color: rgb(0.06, 0.09, 0.16),
    });
    y -= 10;

    // Thin line under title
    currentPage.drawLine({
      start: { x: margin, y },
      end: { x: pageWidth - margin, y },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });
    y -= 20;

    // Date
    currentPage.drawText(
      `Generated: ${new Date().toLocaleDateString('en-ZA')}`,
      { x: margin, y, size: 8, font: helvetica, color: rgb(0.5, 0.5, 0.5) }
    );
    y -= 25;

    if (data.content) {
      const rawLines = data.content.split('\n');

      // Helper to ensure y position has room; adds new page if needed
      const ensureSpace = (needed = 15) => {
        if (y < margin + needed) {
          currentPage = pdfDoc.addPage([595, 842]);
          y = currentPage.getSize().height - margin;
        }
      };

      for (const rawLine of rawLines) {
        const trimmed = rawLine.trim();

        // Skip horizontal rules
        if (/^[-*_]{3,}$/.test(trimmed)) {
          ensureSpace(10);
          currentPage.drawLine({
            start: { x: margin, y },
            end: { x: pageWidth - margin, y },
            thickness: 0.5,
            color: rgb(0.8, 0.8, 0.8),
          });
          y -= 15;
          continue;
        }

        // Skip code block fences
        if (/^```/.test(trimmed)) continue;

        // Empty line → spacing
        if (!trimmed) {
          y -= 8;
          continue;
        }

        // Detect headings
        const headingLevel = getHeadingLevel(trimmed);
        if (headingLevel > 0) {
          const headingText = stripMarkdown(trimmed);
          const fontSize = headingLevel === 1 ? 15 : headingLevel === 2 ? 13 : 11;
          const spacing = headingLevel === 1 ? 20 : 12;
          y -= spacing;
          ensureSpace(fontSize + 10);
          currentPage.drawText(sanitizeForPdf(headingText), {
            x: margin,
            y,
            size: fontSize,
            font: helveticaBold,
            color: rgb(0.06, 0.09, 0.16),
          });
          y -= fontSize + 6;
          continue;
        }

        // Regular text — strip markdown, word-wrap
        const cleanText = stripMarkdown(trimmed);
        if (!cleanText) continue;

        // Detect list items (indented with "  - ")
        const isListItem = /^\s*[-*+]\s/.test(rawLine) || /^\s*\d+\.\s/.test(rawLine);
        const indent = isListItem ? 15 : 0;
        const charsPerLine = Math.floor((textWidth - indent) / 5.5);
        const wrapped = wrapLine(cleanText, charsPerLine);

        for (let i = 0; i < wrapped.length; i++) {
          ensureSpace(14);
          const prefix = (isListItem && i === 0) ? '-  ' : '';
          currentPage.drawText(sanitizeForPdf(prefix + wrapped[i]), {
            x: margin + indent,
            y,
            size: 10,
            font: helvetica,
            color: rgb(0.1, 0.1, 0.1),
          });
          y -= 14;
        }
      }
    }
  }

  const pdfBytes = await pdfDoc.save();
  const fileName = `${templateName || 'document'}-${Date.now()}.pdf`;
  const filePath = path.join(getDocumentsDir(), fileName);
  fs.writeFileSync(filePath, pdfBytes);

  console.log(`[DocumentEngine] PDF generated: ${filePath}`);
  return filePath;
}

/**
 * Extract text/tables from a PDF and generate an Excel workbook
 * @param {string} pdfFilePath - Path to the source PDF
 * @param {Object} options - { sheetName, detectTables }
 * @returns {string} Path to generated Excel file
 */
async function pdfToExcel(pdfFilePath, options = {}) {
  const pdfParse = (await import('pdf-parse')).default;
  const ExcelJS = (await import('exceljs')).default;

  const buffer = fs.readFileSync(pdfFilePath);
  const pdfData = await pdfParse(buffer);
  const text = pdfData.text || '';

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AME Pro AI Workstation';
  workbook.created = new Date();

  // Try to detect tabular data by splitting lines and finding consistent delimiters
  const lines = text.split('\n').filter((l) => l.trim());
  const tables = detectTables(lines);

  if (tables.length > 0) {
    // Create one sheet per detected table
    tables.forEach((table, idx) => {
      const sheetName = options.sheetName
        ? `${options.sheetName}${tables.length > 1 ? ` ${idx + 1}` : ''}`
        : `Table ${idx + 1}`;
      const sheet = workbook.addWorksheet(sheetName);

      // Style header row
      const headerFill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0F172A' },
      };
      const headerFont = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };

      table.forEach((row, rowIdx) => {
        const excelRow = sheet.addRow(row);
        if (rowIdx === 0) {
          excelRow.eachCell((cell) => {
            cell.fill = headerFill;
            cell.font = headerFont;
          });
        }
      });

      // Auto-fit column widths
      sheet.columns.forEach((col) => {
        let maxLen = 10;
        col.eachCell({ includeEmpty: false }, (cell) => {
          const len = String(cell.value || '').length;
          if (len > maxLen) maxLen = Math.min(len + 2, 50);
        });
        col.width = maxLen;
      });
    });
  } else {
    // Fallback: put all lines as single-column data
    const sheet = workbook.addWorksheet(options.sheetName || 'Extracted Data');
    sheet.getColumn(1).width = 80;

    // Add source info
    const titleRow = sheet.addRow([`Extracted from: ${path.basename(pdfFilePath)}`]);
    titleRow.getCell(1).font = { bold: true, size: 12 };
    sheet.addRow([`Pages: ${pdfData.numpages}`]);
    sheet.addRow([`Extracted: ${new Date().toLocaleString('en-ZA')}`]);
    sheet.addRow([]);

    lines.forEach((line) => {
      sheet.addRow([line.trim()]);
    });
  }

  const baseName = path.basename(pdfFilePath, path.extname(pdfFilePath));
  const fileName = `${baseName}-extracted-${Date.now()}.xlsx`;
  const filePath = path.join(getDocumentsDir(), fileName);
  await workbook.xlsx.writeFile(filePath);

  console.log(`[DocumentEngine] PDF→Excel: ${filePath} (${pdfData.numpages} pages, ${tables.length} tables)`);
  return filePath;
}

/**
 * Detect tabular structures in lines of text
 * Looks for lines with consistent tab/multi-space delimiters
 */
function detectTables(lines) {
  const tables = [];
  let currentTable = [];
  let prevColCount = 0;

  for (const line of lines) {
    // Split by tab or 2+ spaces
    const cells = line
      .split(/\t|(?:\s{2,})/)
      .map((c) => c.trim())
      .filter((c) => c);

    if (cells.length >= 2) {
      if (currentTable.length === 0 || Math.abs(cells.length - prevColCount) <= 1) {
        currentTable.push(cells);
        prevColCount = cells.length;
      } else {
        // Column count changed significantly — new table
        if (currentTable.length >= 2) {
          tables.push(normalizeTable(currentTable));
        }
        currentTable = [cells];
        prevColCount = cells.length;
      }
    } else {
      // Single-value line breaks the table
      if (currentTable.length >= 2) {
        tables.push(normalizeTable(currentTable));
      }
      currentTable = [];
      prevColCount = 0;
    }
  }

  // Don't forget the last table
  if (currentTable.length >= 2) {
    tables.push(normalizeTable(currentTable));
  }

  return tables;
}

/**
 * Normalize table rows to have equal column counts
 */
function normalizeTable(rows) {
  const maxCols = Math.max(...rows.map((r) => r.length));
  return rows.map((row) => {
    while (row.length < maxCols) row.push('');
    return row.slice(0, maxCols);
  });
}

/**
 * Generate a document based on type
 * @param {string} type - 'excel', 'word', or 'pdf'
 * @param {Object} data - Data to populate
 * @param {string} templateName - Template identifier
 * @returns {string} Path to generated file
 */
async function generate(type, data, templateName) {
  switch (type) {
    case 'excel':
      return generateExcel(data, templateName);
    case 'word':
      return generateWord(data, templateName);
    case 'pdf':
      return generatePDF(data, templateName);
    default:
      throw new Error(`Unsupported document type: ${type}`);
  }
}

export default {
  generate,
  generateExcel,
  generateWord,
  generatePDF,
  pdfToExcel,
  getDocumentsDir,
};
