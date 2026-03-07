import { useRef } from 'react';
import { Paperclip, X, FileText, FileSpreadsheet, File } from 'lucide-react';

const FILE_TYPES = {
  'application/pdf': { icon: FileText, label: 'PDF', color: 'text-red-500' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: FileSpreadsheet, label: 'Excel', color: 'text-emerald-500' },
  'application/vnd.ms-excel': { icon: FileSpreadsheet, label: 'Excel', color: 'text-emerald-500' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: FileText, label: 'Word', color: 'text-blue-500' },
  'text/csv': { icon: FileSpreadsheet, label: 'CSV', color: 'text-amber-500' },
  'text/plain': { icon: FileText, label: 'Text', color: 'text-slate-500' },
};

function getFileInfo(file) {
  return FILE_TYPES[file.type] || { icon: File, label: file.name.split('.').pop()?.toUpperCase() || 'File', color: 'text-slate-500' };
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUploadButton({ onFileSelect }) {
  const inputRef = useRef(null);

  const handleClick = () => inputRef.current?.click();

  const handleChange = async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      const fileData = {
        id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        path: file.path || null,
        extractedText: null,
        loading: true,
      };

      onFileSelect(fileData);

      // Extract text content via IPC if running in Electron
      if (file.path && window.api?.extractFileText) {
        try {
          const text = await window.api.extractFileText(file.path);
          onFileSelect({ ...fileData, extractedText: text, loading: false });
        } catch (err) {
          console.error('Text extraction failed:', err);
          onFileSelect({ ...fileData, extractedText: `[Could not extract text from ${file.name}]`, loading: false });
        }
      } else {
        // Fallback: read text files directly
        if (file.type === 'text/plain' || file.type === 'text/csv') {
          const text = await file.text();
          onFileSelect({ ...fileData, extractedText: text, loading: false });
        } else {
          onFileSelect({ ...fileData, extractedText: `[File attached: ${file.name}]`, loading: false });
        }
      }
    }
    e.target.value = '';
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        title="Attach files"
      >
        <Paperclip className="w-5 h-5" />
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.xlsx,.xls,.docx,.csv,.txt,.json,.xml"
        onChange={handleChange}
        className="hidden"
      />
    </>
  );
}

export function AttachedFilesList({ files, onRemove }) {
  if (!files.length) return null;

  return (
    <div className="flex flex-wrap gap-2 px-4 py-2 border-t bg-slate-50">
      {files.map(file => {
        const info = getFileInfo(file);
        const Icon = info.icon;
        return (
          <div
            key={file.id}
            className="flex items-center gap-2 bg-white border rounded-lg px-3 py-1.5 text-sm"
          >
            <Icon className={`w-4 h-4 ${info.color}`} />
            <span className="text-slate-700 max-w-[150px] truncate">{file.name}</span>
            <span className="text-xs text-slate-400">{formatSize(file.size)}</span>
            {file.loading && (
              <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            )}
            <button
              onClick={() => onRemove(file.id)}
              className="p-0.5 text-slate-400 hover:text-red-500 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
