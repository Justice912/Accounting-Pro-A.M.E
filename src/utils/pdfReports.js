// Lightweight PDF table renderer using pdf-lib (already in package.json).
//
// Designed for accounting reports: a header strip with company + title +
// period + generated date, a table with right-aligned numeric columns, an
// optional totals row, and page breaks that re-print the column headers.
//
// Single export: exportTablePdf({...}) triggers a browser download.

// pdf-lib is loaded lazily — see loadPdfLib() — so the ~430 KB library is
// only fetched when a user actually clicks "Export to PDF". Cached after
// the first load so subsequent exports are instant. `rgb` and the standard
// fonts are pulled out of the module exports onto the singletons below
// after the first load so the synchronous draw helpers can use them.
let _pdfLib = null;
let rgb = null;
async function loadPdfLib() {
  if (_pdfLib) return _pdfLib;
  _pdfLib = await import('pdf-lib');
  rgb = _pdfLib.rgb;
  return _pdfLib;
}

const MARGIN = 36;
const HEADER_HEIGHT = 70;
const FOOTER_HEIGHT = 22;
const ROW_HEIGHT = 16;
const HEADER_ROW_HEIGHT = 20;
const FONT_SIZE_HEADER = 18;
const FONT_SIZE_SUB = 10;
const FONT_SIZE_TABLE_HEADER = 9;
const FONT_SIZE_BODY = 9;

// Helvetica is metric-similar enough to Tailwind's default font that
// the in-app preview and the PDF print look the same.
async function buildDoc() {
  const { PDFDocument, StandardFonts } = await loadPdfLib();
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  return { pdf, font, fontBold };
}

// pdf-lib's StandardFonts use WinAnsi (CP1252) which can't encode arrows,
// CJK, emoji, math symbols, etc. Drawing such a character throws. Map the
// common offenders to ASCII; anything else outside CP1252 becomes '?'.
const WINANSI_EXTRA = new Set([
  0x20ac, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021,
  0x02c6, 0x2030, 0x0160, 0x2039, 0x0152, 0x017d, 0x2018,
  0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014, 0x02dc,
  0x2122, 0x0161, 0x203a, 0x0153, 0x017e, 0x0178,
]);

function sanitizeText(str) {
  const s = String(str ?? '')
    .replace(/→/g, '->')
    .replace(/←/g, '<-')
    .replace(/↔/g, '<->')
    .replace(/⇒/g, '=>')
    .replace(/⇐/g, '<=')
    .replace(/↑/g, '^')
    .replace(/↓/g, 'v')
    .replace(/✓/g, 'v')
    .replace(/✗/g, 'x')
    .replace(/ /g, ' ')
    .replace(/′/g, "'")
    .replace(/″/g, '"');
  let out = '';
  for (const ch of s) {
    const code = ch.codePointAt(0);
    if (code <= 0xff || WINANSI_EXTRA.has(code)) out += ch;
    else out += '?';
  }
  return out;
}

// Width of a string in points at a given font size. pdf-lib gives us the
// font metric directly.
function widthOf(str, font, size) {
  return font.widthOfTextAtSize(sanitizeText(str), size);
}

// Truncate a string with an ellipsis so it fits within maxWidth at fontSize.
function fitText(str, font, size, maxWidth) {
  const s = sanitizeText(str);
  if (widthOf(s, font, size) <= maxWidth) return s;
  // Binary-trim
  let lo = 0;
  let hi = s.length;
  const ell = '…';
  const ellW = widthOf(ell, font, size);
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (widthOf(s.slice(0, mid), font, size) + ellW <= maxWidth) lo = mid;
    else hi = mid - 1;
  }
  return s.slice(0, lo) + ell;
}

// Compute column widths so they fit the available content width. Columns
// with `weight: n` get a proportional share of the slack after fixed
// columns are placed. Anything else gets weight 1.
function layoutColumns(columns, availableWidth) {
  let fixed = 0;
  let totalWeight = 0;
  for (const c of columns) {
    if (typeof c.width === 'number') fixed += c.width;
    else totalWeight += c.weight || 1;
  }
  const slack = Math.max(0, availableWidth - fixed);
  return columns.map((c) => {
    if (typeof c.width === 'number') return { ...c, _w: c.width };
    return { ...c, _w: (slack * (c.weight || 1)) / Math.max(totalWeight, 1) };
  });
}

function drawText(page, text, x, y, opts = {}) {
  page.drawText(sanitizeText(text), {
    x,
    y,
    size: opts.size || FONT_SIZE_BODY,
    font: opts.font,
    color: opts.color || rgb(0.13, 0.16, 0.22),
  });
}

function drawHeaderStrip(page, font, fontBold, { title, subtitle, period, company, asof }, pageWidth) {
  const yTop = page.getHeight() - MARGIN;

  if (company) {
    drawText(page, company, MARGIN, yTop - 4, { font, size: FONT_SIZE_SUB, color: rgb(0.36, 0.42, 0.5) });
  }
  drawText(page, title, MARGIN, yTop - 22, {
    font: fontBold,
    size: FONT_SIZE_HEADER,
    color: rgb(0.04, 0.36, 0.27), // emerald
  });
  if (subtitle) {
    drawText(page, subtitle, MARGIN, yTop - 38, { font, size: FONT_SIZE_SUB, color: rgb(0.36, 0.42, 0.5) });
  }

  const meta = [];
  if (period) meta.push(period);
  else if (asof) meta.push(`As at ${asof}`);
  meta.push(`Generated ${new Date().toLocaleString('en-ZA')}`);
  const metaTxt = meta.join('  ·  ');
  const tw = widthOf(metaTxt, font, FONT_SIZE_SUB);
  drawText(page, metaTxt, pageWidth - MARGIN - tw, yTop - 4, { font, size: FONT_SIZE_SUB, color: rgb(0.36, 0.42, 0.5) });

  // Divider line
  page.drawLine({
    start: { x: MARGIN, y: yTop - HEADER_HEIGHT + 6 },
    end: { x: pageWidth - MARGIN, y: yTop - HEADER_HEIGHT + 6 },
    thickness: 0.5,
    color: rgb(0.78, 0.84, 0.91),
  });
}

function drawColumnHeaders(page, columns, y, fontBold) {
  const fillY = y - HEADER_ROW_HEIGHT + 2;
  page.drawRectangle({
    x: MARGIN,
    y: fillY,
    width: page.getWidth() - 2 * MARGIN,
    height: HEADER_ROW_HEIGHT,
    color: rgb(0.94, 0.96, 0.98),
  });
  let x = MARGIN + 4;
  for (const col of columns) {
    const innerW = col._w - 8;
    const text = fitText(col.header, fontBold, FONT_SIZE_TABLE_HEADER, innerW);
    if (col.align === 'right') {
      const tw = widthOf(text, fontBold, FONT_SIZE_TABLE_HEADER);
      drawText(page, text, x + col._w - 4 - tw, y - HEADER_ROW_HEIGHT + 7, {
        font: fontBold,
        size: FONT_SIZE_TABLE_HEADER,
      });
    } else {
      drawText(page, text, x, y - HEADER_ROW_HEIGHT + 7, {
        font: fontBold,
        size: FONT_SIZE_TABLE_HEADER,
      });
    }
    x += col._w;
  }
}

function drawRow(page, columns, row, y, font, opts = {}) {
  let x = MARGIN + 4;
  if (opts.zebra) {
    page.drawRectangle({
      x: MARGIN,
      y: y - ROW_HEIGHT + 2,
      width: page.getWidth() - 2 * MARGIN,
      height: ROW_HEIGHT,
      color: rgb(0.985, 0.99, 0.995),
    });
  }
  if (opts.bold) {
    page.drawLine({
      start: { x: MARGIN, y: y + 2 },
      end: { x: page.getWidth() - MARGIN, y: y + 2 },
      thickness: 0.5,
      color: rgb(0.6, 0.66, 0.72),
    });
  }
  for (const col of columns) {
    const innerW = col._w - 8;
    let raw = row[col.key];
    if (col.format) raw = col.format(raw);
    const text = fitText(raw, font, FONT_SIZE_BODY, innerW);
    if (col.align === 'right') {
      const tw = widthOf(text, font, FONT_SIZE_BODY);
      drawText(page, text, x + col._w - 4 - tw, y - ROW_HEIGHT + 5, {
        font,
        size: FONT_SIZE_BODY,
        color: opts.bold ? rgb(0.13, 0.16, 0.22) : undefined,
      });
    } else {
      drawText(page, text, x, y - ROW_HEIGHT + 5, {
        font,
        size: FONT_SIZE_BODY,
      });
    }
    x += col._w;
  }
}

function drawFooter(page, font, n, total) {
  const txt = `Page ${n} of ${total}`;
  const tw = widthOf(txt, font, FONT_SIZE_SUB - 1);
  drawText(page, txt, page.getWidth() - MARGIN - tw, MARGIN - 12, {
    font,
    size: FONT_SIZE_SUB - 1,
    color: rgb(0.55, 0.6, 0.66),
  });
}

function triggerDownload(bytes, filename) {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  // Revoke after a short delay so the browser has a chance to start the download.
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

// Main entry. Renders a table report to a multi-page A4 landscape PDF and
// kicks off a download.
//
// args:
//   filename       – the file users get on disk
//   title          – big header text (e.g. "Asset Register — Movement schedule")
//   subtitle       – optional secondary line
//   company        – company name shown above the title
//   period         – e.g. "1 Jan 2026 → 31 Dec 2026"
//   asof           – e.g. "31 Dec 2026" (used if period missing)
//   columns        – [{ key, header, align?, format?, width?, weight? }]
//   rows           – array of objects keyed by column.key
//   totals         – optional row to print as a bold totals line at the bottom
export async function exportTablePdf({
  filename,
  title,
  subtitle,
  company,
  period,
  asof,
  columns,
  rows,
  totals,
}) {
  const { pdf, font, fontBold } = await buildDoc();

  const PAGE_WIDTH = 842; // A4 landscape
  const PAGE_HEIGHT = 595;
  const contentTop = PAGE_HEIGHT - MARGIN - HEADER_HEIGHT;
  const contentBottom = MARGIN + FOOTER_HEIGHT;

  const laidOutCols = layoutColumns(columns, PAGE_WIDTH - 2 * MARGIN);
  const safeRows = Array.isArray(rows) ? rows : [];

  // Pre-compute pages by walking rows and noting where breaks fall.
  const pageBreaks = [];
  let yCursor = contentTop - HEADER_ROW_HEIGHT;
  pageBreaks.push({ start: 0 });
  for (let i = 0; i < safeRows.length; i++) {
    if (yCursor - ROW_HEIGHT < contentBottom) {
      pageBreaks[pageBreaks.length - 1].end = i;
      pageBreaks.push({ start: i });
      yCursor = contentTop - HEADER_ROW_HEIGHT;
    }
    yCursor -= ROW_HEIGHT;
  }
  pageBreaks[pageBreaks.length - 1].end = safeRows.length;
  // Reserve a row for the totals line on the final page.
  if (totals && yCursor - ROW_HEIGHT < contentBottom) {
    pageBreaks.push({ start: safeRows.length, end: safeRows.length });
  }

  const totalPages = pageBreaks.length;

  for (let pIdx = 0; pIdx < totalPages; pIdx++) {
    const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    drawHeaderStrip(page, font, fontBold, { title, subtitle, period, company, asof }, PAGE_WIDTH);

    const headerY = PAGE_HEIGHT - MARGIN - HEADER_HEIGHT;
    drawColumnHeaders(page, laidOutCols, headerY, fontBold);

    let y = headerY - HEADER_ROW_HEIGHT;
    const { start, end } = pageBreaks[pIdx];
    for (let i = start; i < end; i++) {
      drawRow(page, laidOutCols, safeRows[i], y, font, { zebra: i % 2 === 1 });
      y -= ROW_HEIGHT;
    }
    if (safeRows.length === 0 && pIdx === 0) {
      drawText(page, 'No data for this report.', MARGIN + 4, y - 4, {
        font,
        size: FONT_SIZE_BODY,
        color: rgb(0.55, 0.6, 0.66),
      });
    }

    // Totals on the last page.
    if (totals && pIdx === totalPages - 1) {
      drawRow(page, laidOutCols, totals, y, fontBold, { bold: true });
    }

    drawFooter(page, font, pIdx + 1, totalPages);
  }

  const bytes = await pdf.save();
  triggerDownload(bytes, filename);
}
