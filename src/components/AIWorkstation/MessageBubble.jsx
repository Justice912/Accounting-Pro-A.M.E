import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function MessageBubble({ role, content, streaming }) {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
          isUser ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
        }`}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap">{content}</div>
        ) : (
          <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-code:text-xs">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content + (streaming ? '▍' : '')}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
