import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Square, Sparkles, Download } from 'lucide-react';
import MessageBubble from './MessageBubble';
import QuickStartPrompts from './QuickStartPrompts';
import WorkflowIndicator from './WorkflowIndicator';
import { FileUploadButton, AttachedFilesList } from './FileUploadButton';
import DocumentToolbar from './DocumentToolbar';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAIProvider } from '../../contexts/AIProviderContext';

export default function ChatInterface({ domain, conversationId, onConversationCreated }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeWorkflow, setActiveWorkflow] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const cancelledRef = useRef(false);
  const { attachedFiles, attachFile, removeFile, clearFiles, updateConversationTitle } = useWorkspace();
  const { selectedModel } = useAIProvider();

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [messages]);

  // Load existing messages when conversationId changes
  useEffect(() => {
    setActiveWorkflow(null);
    if (conversationId && window.api) {
      window.api.getMessages(conversationId).then(msgs => {
        if (msgs?.length) setMessages(msgs);
        else setMessages([]);
      }).catch(() => setMessages([]));
    } else {
      setMessages([]);
    }
  }, [conversationId]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, [conversationId]);

  const handleFileUpdate = useCallback((fileData) => {
    attachFile(fileData);
  }, [attachFile]);

  const handleSend = async (retryContent = null) => {
    const content = retryContent || input.trim();
    if (!content || loading) return;

    // Build message content with attached files context
    const fileContext = attachedFiles
      .filter(f => f.extractedText && !f.loading)
      .map(f => `--- File: ${f.name} ---\n${f.extractedText}`)
      .join('\n\n');

    const fullContent = fileContext
      ? `${fileContext}\n\n--- User Question ---\n${content}`
      : content;

    const userMsg = {
      role: 'user',
      content: content,
      fullContent,
      timestamp: new Date().toISOString(),
      files: attachedFiles.map(f => ({ name: f.name, size: f.size })),
    };

    // For retry, don't add a new user message — it's already in the list
    const newMessages = retryContent
      ? [...messages.filter(m => m.provider !== 'error' || m.content !== messages[messages.length - 1]?.content)]
      : [...messages, userMsg];

    if (!retryContent) {
      setMessages(newMessages);
      setInput('');
      clearFiles();
    }

    setLoading(true);
    cancelledRef.current = false;

    // Auto-create conversation on first message
    let activeConvId = conversationId;
    if (!activeConvId && onConversationCreated) {
      activeConvId = await onConversationCreated(domain, content.slice(0, 50));
    }
    if (activeConvId && messages.length === 0) {
      const autoTitle = content.length > 40 ? content.slice(0, 40) + '...' : content;
      updateConversationTitle(activeConvId, autoTitle);
    }

    try {
      if (window.api) {
        const response = await window.api.sendToAI({
          domain: domain || 'general',
          subdomain: 'general',
          messages: newMessages.map(m => ({
            role: m.role,
            content: m.fullContent || m.content,
          })),
          conversationId: activeConvId,
          model: selectedModel || null,
        });

        // If user cancelled while waiting, discard result
        if (cancelledRef.current) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: '*Generation stopped by user.*',
            provider: 'system',
            timestamp: new Date().toISOString(),
          }]);
          return;
        }

        // Capture workflow info from response
        if (response?.workflow) {
          setActiveWorkflow(response.workflow);
        }

        const assistantMsg = {
          role: 'assistant',
          content: response?.content || response?.message || 'No response received.',
          provider: response?.provider || 'unknown',
          model: response?.model || null,
          tokensInput: response?.tokensInput || null,
          tokensOutput: response?.tokensOutput || null,
          estimatedCostZar: response?.estimatedCostZar || null,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `**Dev Mode** — AI response for domain "${domain}" would appear here.\n\nConfigure API keys in **Settings** to enable AI responses.\n\n\`\`\`\nDomain: ${domain}\nConversation: ${activeConvId}\nFiles attached: ${attachedFiles.length}\n\`\`\``,
          provider: 'dev',
          timestamp: new Date().toISOString(),
        }]);
      }
    } catch (err) {
      if (!cancelledRef.current) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `**Error:** ${err.message || 'Failed to get AI response. Check your API keys in Settings.'}`,
          provider: 'error',
          timestamp: new Date().toISOString(),
        }]);
      }
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleStop = () => {
    cancelledRef.current = true;
    setLoading(false);
  };

  const handleRetry = useCallback(() => {
    // Find the last user message to retry
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      // Remove the error message
      setMessages(prev => prev.filter((m, i) => i < prev.length - 1 || m.provider !== 'error'));
      handleSend(lastUserMsg.fullContent || lastUserMsg.content);
    }
  }, [messages]);

  const handleExport = async () => {
    if (!conversationId || !window.api?.exportConversation) return;
    try {
      const result = await window.api.exportConversation(conversationId);
      if (result?.markdown) {
        const blob = new Blob([result.markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${result.title || 'conversation'}.md`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error('Export failed:', e);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickStart = (promptText) => {
    setInput(promptText);
    inputRef.current?.focus();
  };

  const getDomainLabel = () => {
    const labels = {
      'sa-tax': 'South African tax',
      'auditing': 'ISA auditing standards',
      'quantity-surveying': 'quantity surveying',
      'hr-payroll': 'HR and payroll',
      'accounting': 'accounting and IFRS',
      'finance': 'cost accounting, management accounting and investment banking',
    };
    return labels[domain] || 'professional accounting services';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Workflow indicator */}
      <WorkflowIndicator workflow={activeWorkflow} />

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4 py-8">
            <Sparkles className="w-10 h-10 text-emerald-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              {domain ? `Ask about ${getDomainLabel()}` : 'How can I help?'}
            </h3>
            <p className="text-sm text-slate-500 mb-8 max-w-md text-center">
              AI-powered assistance with domain-specific knowledge for South African professionals.
            </p>
            <QuickStartPrompts domain={domain || 'general'} onSelectPrompt={handleQuickStart} />
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-4 space-y-1">
            {messages.map((msg, idx) => (
              <MessageBubble
                key={idx}
                message={msg}
                onRetry={msg.provider === 'error' ? handleRetry : undefined}
              />
            ))}
            {loading && (
              <div className="flex items-center gap-3 text-slate-500 py-4 px-4">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm">Thinking...</span>
                </div>
                <button
                  onClick={handleStop}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors border border-red-200"
                >
                  <Square className="w-3 h-3 fill-current" />
                  Stop
                </button>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Attached files bar */}
      <AttachedFilesList files={attachedFiles} onRemove={removeFile} />

      {/* Document tools (PDF→Excel, etc.) */}
      <DocumentToolbar />

      {/* Input area */}
      <div className="border-t bg-white p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-2 bg-slate-50 border rounded-xl px-2 py-2 focus-within:ring-2 focus-within:ring-emerald-400 focus-within:border-emerald-400">
            <FileUploadButton onFileSelect={handleFileUpdate} />
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about accounting, tax, audit..."
              rows={1}
              className="flex-1 resize-none bg-transparent px-2 py-2 text-sm focus:outline-none max-h-32 text-slate-800 placeholder-slate-400"
              style={{ minHeight: '40px' }}
            />
            {conversationId && messages.length > 0 && (
              <button
                onClick={handleExport}
                title="Export conversation as Markdown"
                className="text-slate-400 hover:text-emerald-600 p-2 rounded-lg hover:bg-emerald-50 transition-colors flex-shrink-0"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="bg-emerald-600 text-white p-2.5 rounded-lg hover:bg-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-[11px] text-slate-400">
              AME Pro may make mistakes. Verify important information independently.
            </p>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span title="New Chat">Ctrl+N</span>
              <span title="Send message">Enter ↵</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
