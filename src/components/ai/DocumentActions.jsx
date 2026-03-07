import { useState } from 'react';
import { FileText, FileSpreadsheet, FileType, Download, Check, Loader2, FolderOpen } from 'lucide-react';

const BUTTON_STYLES = {
  pdf: {
    active: 'bg-red-100 text-red-700',
    idle: 'bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-600 border border-slate-200 hover:border-red-200',
  },
  excel: {
    active: 'bg-emerald-100 text-emerald-700',
    idle: 'bg-slate-50 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-200 hover:border-emerald-200',
  },
  word: {
    active: 'bg-blue-100 text-blue-700',
    idle: 'bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 hover:border-blue-200',
  },
};

/**
 * Document export action buttons for AI responses.
 * Allows exporting message content as PDF, Excel, or Word.
 */
export default function DocumentActions({ content, title }) {
  const [exporting, setExporting] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  if (!window.api?.exportContent) return null;

  const handleExport = async (type) => {
    if (exporting) return;
    setExporting(type);
    setLastResult(null);

    try {
      const docTitle = title || `AME Pro Export - ${new Date().toLocaleDateString('en-ZA')}`;
      const result = await window.api.exportContent(type, content, docTitle);

      if (result?.success) {
        setLastResult({ type, filePath: result.filePath, success: true });
      } else {
        setLastResult({ type, success: false, error: result?.error || 'Export failed' });
      }
    } catch (err) {
      setLastResult({ type, success: false, error: err.message });
    } finally {
      setExporting(null);
    }
  };

  const handleOpen = () => {
    if (lastResult?.filePath && window.api?.openFile) {
      window.api.openFile(lastResult.filePath);
    }
  };

  const buttons = [
    { type: 'pdf', label: 'PDF', icon: FileText },
    { type: 'excel', label: 'Excel', icon: FileSpreadsheet },
    { type: 'word', label: 'Word', icon: FileType },
  ];

  return (
    <div className="flex items-center gap-1.5 mt-1">
      <span className="text-[10px] text-slate-400 mr-1">
        <Download className="w-3 h-3 inline" /> Export:
      </span>
      {buttons.map(({ type, label, icon: Icon }) => {
        const styles = BUTTON_STYLES[type];
        return (
          <button
            key={type}
            onClick={() => handleExport(type)}
            disabled={!!exporting}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors
              ${exporting === type ? styles.active : styles.idle}
              disabled:opacity-40 disabled:cursor-not-allowed`}
            title={`Export as ${label}`}
          >
            {exporting === type ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Icon className="w-3 h-3" />
            )}
            {label}
          </button>
        );
      })}

      {lastResult?.success && (
        <button
          onClick={handleOpen}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
          title="Open generated file"
        >
          <Check className="w-3 h-3" />
          Open {lastResult.type.toUpperCase()}
          <FolderOpen className="w-3 h-3" />
        </button>
      )}

      {lastResult && !lastResult.success && (
        <span className="text-[10px] text-red-500">
          Failed: {lastResult.error}
        </span>
      )}
    </div>
  );
}
