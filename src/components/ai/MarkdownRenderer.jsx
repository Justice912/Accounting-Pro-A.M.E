import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { useState } from 'react';
import { Check, Copy, Play, Square, Loader2, Terminal, AlertTriangle } from 'lucide-react';

// Languages that support execution
const EXECUTABLE_LANGS = {
  javascript: { cmd: 'node', flag: '-e' },
  js: { cmd: 'node', flag: '-e' },
  python: { cmd: 'python', flag: '-c' },
  py: { cmd: 'python', flag: '-c' },
  bash: { cmd: 'bash', flag: '-c' },
  sh: { cmd: 'sh', flag: '-c' },
  powershell: { cmd: 'powershell', flag: '-Command' },
  ps1: { cmd: 'powershell', flag: '-Command' },
  cmd: { cmd: 'cmd', flag: '/c' },
};

function CodeBlock({ children, className, ...props }) {
  const [copied, setCopied] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [execResult, setExecResult] = useState(null);
  const match = /language-(\w+)/.exec(className || '');
  const lang = match?.[1]?.toLowerCase() || '';
  const isInline = !match && !props.node?.tagName?.includes('pre');
  const isExecutable = !!EXECUTABLE_LANGS[lang] && !!window.api?.executeCommand;

  if (isInline) {
    return (
      <code className="bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded text-[13px] font-mono" {...props}>
        {children}
      </code>
    );
  }

  const codeText = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRun = async () => {
    if (executing || !isExecutable) return;
    setExecuting(true);
    setExecResult(null);

    try {
      const config = EXECUTABLE_LANGS[lang];
      const command = `${config.cmd} ${config.flag} ${JSON.stringify(codeText)}`;
      const result = await window.api.executeCommand(command, null, 30000);
      setExecResult(result);
    } catch (err) {
      setExecResult({
        success: false,
        stdout: '',
        stderr: err.message || 'Execution failed',
        exitCode: -1,
        duration: 0,
      });
    } finally {
      setExecuting(false);
    }
  };

  const handleStop = () => {
    // Terminal kill would need PID tracking; for now just show stopped
    setExecuting(false);
  };

  return (
    <div className="relative group my-3">
      {/* Header bar */}
      <div className="flex items-center justify-between bg-slate-800 text-slate-400 text-xs px-4 py-2 rounded-t-lg">
        <div className="flex items-center gap-2">
          <span>{lang || 'code'}</span>
          {isExecutable && (
            <span className="flex items-center gap-1 text-emerald-400">
              <Terminal className="w-3 h-3" />
              runnable
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isExecutable && (
            <button
              onClick={executing ? handleStop : handleRun}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
                executing
                  ? 'bg-red-600/20 text-red-400 hover:text-red-300'
                  : 'bg-emerald-600/20 text-emerald-400 hover:text-emerald-300'
              }`}
            >
              {executing ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" />
                  Run
                </>
              )}
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 hover:text-white transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Code */}
      <pre className={`bg-slate-900 text-slate-100 p-4 overflow-x-auto text-sm ${execResult ? '' : 'rounded-b-lg'}`}>
        <code className={className} {...props}>
          {children}
        </code>
      </pre>

      {/* Execution output */}
      {execResult && (
        <div className={`border-t border-slate-700 rounded-b-lg overflow-hidden ${
          execResult.success ? 'bg-slate-950' : 'bg-red-950/30'
        }`}>
          <div className="flex items-center justify-between px-4 py-1.5 bg-slate-800/50 text-[10px]">
            <div className="flex items-center gap-2">
              {execResult.success ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Exit code: 0
                </span>
              ) : (
                <span className="text-red-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Exit code: {execResult.exitCode}
                </span>
              )}
            </div>
            <span className="text-slate-500">{execResult.duration}ms</span>
          </div>
          {execResult.stdout && (
            <pre className="px-4 py-3 text-xs text-emerald-300 font-mono overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap">
              {execResult.stdout}
            </pre>
          )}
          {execResult.stderr && (
            <pre className="px-4 py-3 text-xs text-red-400 font-mono overflow-x-auto max-h-40 overflow-y-auto whitespace-pre-wrap border-t border-slate-700/50">
              {execResult.stderr}
            </pre>
          )}
          {!execResult.stdout && !execResult.stderr && (
            <div className="px-4 py-3 text-xs text-slate-500 italic">No output</div>
          )}
          <button
            onClick={() => setExecResult(null)}
            className="w-full text-center text-[10px] text-slate-500 hover:text-slate-300 py-1 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

function StepHeading({ children, ...props }) {
  const text = String(children);
  const stepMatch = text.match(/^Step\s+(\d+):\s*(.*)/i);

  if (stepMatch) {
    const stepNum = stepMatch[1];
    const stepTitle = stepMatch[2];
    return (
      <div className="flex items-center gap-3 mt-6 mb-3 pb-2 border-b border-amber-200">
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex-shrink-0">
          {stepNum}
        </span>
        <h2 className="text-base font-semibold text-slate-800 m-0" {...props}>
          {stepTitle}
        </h2>
      </div>
    );
  }

  return <h2 className="text-base font-semibold text-slate-800 mt-6 mb-3" {...props}>{children}</h2>;
}

export default function MarkdownRenderer({ content }) {
  return (
    <div className="prose prose-sm prose-slate dark:prose-invert max-w-none
      prose-headings:font-semibold prose-headings:text-slate-800
      prose-p:text-slate-700 prose-p:leading-relaxed
      prose-a:text-emerald-600 prose-a:no-underline hover:prose-a:underline
      prose-strong:text-slate-800
      prose-ul:text-slate-700 prose-ol:text-slate-700
      prose-table:border-collapse
      prose-th:border prose-th:border-slate-300 prose-th:bg-slate-50 prose-th:px-3 prose-th:py-2 prose-th:text-left
      prose-td:border prose-td:border-slate-200 prose-td:px-3 prose-td:py-2
      prose-blockquote:border-l-emerald-500 prose-blockquote:bg-emerald-50/50 prose-blockquote:py-1 prose-blockquote:px-4
      prose-hr:border-slate-200
    ">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          code: CodeBlock,
          h2: StepHeading,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
