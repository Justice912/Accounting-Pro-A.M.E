import { useState } from 'react';
import { User, Bot, AlertCircle, Copy, Check, FileText, RefreshCw, ChevronDown, ChevronUp, Coins } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import DocumentActions from './DocumentActions';

function formatTokens(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

export default function MessageBubble({ message, onRetry }) {
  const isUser = message.role === 'user';
  const isError = message.provider === 'error';
  const isSystem = message.provider === 'system';
  const [copied, setCopied] = useState(false);
  const [showTokens, setShowTokens] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasTokenData = message.tokensInput || message.tokensOutput || message.tokens_input || message.tokens_output;
  const tokIn = message.tokensInput || message.tokens_input || 0;
  const tokOut = message.tokensOutput || message.tokens_output || 0;
  const costZar = message.estimatedCostZar || message.estimated_cost_zar || null;

  return (
    <div className={`py-4 ${isUser ? '' : 'bg-white -mx-4 px-4 border-b border-slate-100'}`}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
          isUser ? 'bg-slate-700' : isError ? 'bg-red-100' : isSystem ? 'bg-amber-100' : 'bg-emerald-100'
        }`}>
          {isUser ? (
            <User className="w-3.5 h-3.5 text-white" />
          ) : isError ? (
            <AlertCircle className="w-3.5 h-3.5 text-red-500" />
          ) : (
            <Bot className="w-3.5 h-3.5 text-emerald-600" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Role label + metadata */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-slate-700">
              {isUser ? 'You' : 'AME Pro'}
            </span>
            {!isUser && !isError && !isSystem && (message.model || message.provider) && (
              <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] uppercase font-medium text-slate-500">
                {message.model || message.provider}
              </span>
            )}
            {/* Token summary badge */}
            {!isUser && hasTokenData && (
              <button
                onClick={() => setShowTokens(!showTokens)}
                className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[10px] font-medium hover:bg-emerald-100 transition-colors"
                title="Token usage & cost"
              >
                <Coins className="w-2.5 h-2.5" />
                {formatTokens(tokIn + tokOut)} tok
                {costZar ? ` · R${costZar < 0.01 ? '<0.01' : costZar.toFixed(2)}` : ''}
                {showTokens ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
              </button>
            )}
            {message.timestamp && (
              <span className="text-[11px] text-slate-400">
                {new Date(message.timestamp || message.created_at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          {/* Expanded token details */}
          {showTokens && hasTokenData && (
            <div className="mb-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
              <span>Input: <strong>{formatTokens(tokIn)}</strong> tokens</span>
              <span>Output: <strong>{formatTokens(tokOut)}</strong> tokens</span>
              <span>Total: <strong>{formatTokens(tokIn + tokOut)}</strong> tokens</span>
              {costZar != null && (
                <span>Cost: <strong className="text-emerald-700">R{costZar < 0.01 ? '<0.01' : costZar.toFixed(4)}</strong></span>
              )}
            </div>
          )}

          {/* File attachments */}
          {message.files?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {message.files.map((f, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                  <FileText className="w-3 h-3" />
                  {f.name}
                </span>
              ))}
            </div>
          )}

          {/* Message content */}
          {isUser ? (
            <div className="text-sm text-slate-800 whitespace-pre-wrap">{message.content}</div>
          ) : isError ? (
            <div className="text-sm text-red-700">{message.content}</div>
          ) : isSystem ? (
            <div className="text-sm text-amber-700 italic">{message.content}</div>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}

          {/* Action bar */}
          <div className="flex items-center gap-3 mt-2">
            {/* Copy button for assistant */}
            {!isUser && !isError && !isSystem && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}

            {/* Retry button for errors */}
            {isError && onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-md transition-colors font-medium"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
              </button>
            )}
          </div>

          {/* Document export actions for assistant messages */}
          {!isUser && !isError && !isSystem && message.content?.length > 50 && (
            <DocumentActions content={message.content} />
          )}
        </div>
      </div>
    </div>
  );
}
