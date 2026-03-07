import { useState } from 'react';
import { FileSpreadsheet, FileText, FileType, Loader2, Check, FolderOpen, X, ArrowRight } from 'lucide-react';

/**
 * Document generation toolbar — shown above the chat input area.
 * Provides:
 * 1. PDF → Excel extraction
 * 2. Quick document generation (PDF/Excel/Word from data)
 */
export default function DocumentToolbar() {
  const [converting, setConverting] = useState(false);
  const [result, setResult] = useState(null); // { success, filePath, error }
  const [showResult, setShowResult] = useState(false);

  if (!window.api?.pdfToExcel) return null;

  const handlePdfToExcel = async () => {
    if (converting) return;
    setConverting(true);
    setResult(null);

    try {
      // Use file import dialog to pick a PDF
      const importResult = await window.api.importFile();
      if (!importResult?.success || importResult.cancelled) {
        setConverting(false);
        return;
      }

      const filePath = importResult.filePath || importResult.path;
      if (!filePath?.toLowerCase().endsWith('.pdf')) {
        setResult({ success: false, error: 'Please select a PDF file' });
        setShowResult(true);
        setConverting(false);
        return;
      }

      const excelResult = await window.api.pdfToExcel(filePath);
      if (excelResult?.success) {
        setResult({ success: true, filePath: excelResult.filePath });
      } else {
        setResult({ success: false, error: excelResult?.error || 'Conversion failed' });
      }
      setShowResult(true);
    } catch (err) {
      setResult({ success: false, error: err.message });
      setShowResult(true);
    } finally {
      setConverting(false);
    }
  };

  const handleOpen = () => {
    if (result?.filePath && window.api?.openFile) {
      window.api.openFile(result.filePath);
    }
  };

  const dismissResult = () => {
    setShowResult(false);
    setResult(null);
  };

  return (
    <div className="border-t border-slate-100 bg-slate-50/50">
      {/* Result banner */}
      {showResult && result && (
        <div className={`flex items-center gap-2 px-4 py-2 text-xs ${
          result.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>
          {result.success ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>PDF extracted to Excel successfully!</span>
              <button
                onClick={handleOpen}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 rounded hover:bg-emerald-200 transition-colors font-medium"
              >
                <FolderOpen className="w-3 h-3" />
                Open File
              </button>
            </>
          ) : (
            <>
              <X className="w-3.5 h-3.5" />
              <span>{result.error}</span>
            </>
          )}
          <button onClick={dismissResult} className="ml-auto hover:opacity-70">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Toolbar buttons */}
      <div className="flex items-center gap-2 px-4 py-1.5">
        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Documents</span>
        <button
          onClick={handlePdfToExcel}
          disabled={converting}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium
            bg-white border border-slate-200 text-slate-600
            hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200
            disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Select a PDF file and extract its data into an Excel spreadsheet"
        >
          {converting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              <FileText className="w-3.5 h-3.5 text-red-500" />
              <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            </>
          )}
          {converting ? 'Converting...' : 'PDF → Excel'}
        </button>
      </div>
    </div>
  );
}
