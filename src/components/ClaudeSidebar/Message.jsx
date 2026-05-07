import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// One chat bubble. role is 'user' | 'assistant' | 'tool'.
// Content blocks the model produces include text + tool_use; we render text
// as markdown and surface tool calls as a small italic line so the user sees
// what the assistant is doing.
export default function Message({ role, blocks }) {
  const isUser = role === 'user';
  const isTool = role === 'tool';

  if (isTool) {
    return (
      <div className="flex justify-start">
        <div className="max-w-[90%] text-xs text-slate-500 italic px-3 py-1.5 rounded-md bg-slate-100 border border-slate-200">
          {blocks.map((b, i) => (
            <div key={i}>{b.text}</div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm whitespace-pre-wrap break-words ${
          isUser
            ? 'bg-emerald-600 text-white rounded-br-sm'
            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'
        }`}
      >
        {blocks.map((b, i) => {
          if (b.type === 'tool_use') {
            return (
              <div key={i} className="text-xs italic opacity-80 mt-1">
                Calling tool: <span className="font-mono">{b.name}</span>
              </div>
            );
          }
          // Text block — render as markdown for assistant, plain for user.
          if (isUser) {
            return <span key={i}>{b.text}</span>;
          }
          return (
            <div key={i} className="prose-sm prose-slate max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p className="my-1">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-5 my-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-5 my-1">{children}</ol>,
                  li: ({ children }) => <li className="my-0.5">{children}</li>,
                  h1: ({ children }) => <h3 className="font-semibold text-base mt-2 mb-1">{children}</h3>,
                  h2: ({ children }) => <h4 className="font-semibold text-sm mt-2 mb-1">{children}</h4>,
                  h3: ({ children }) => <h5 className="font-semibold text-sm mt-1.5 mb-1">{children}</h5>,
                  code: ({ inline, children }) =>
                    inline ? (
                      <code className="px-1 py-0.5 rounded bg-slate-100 text-[0.85em] font-mono">{children}</code>
                    ) : (
                      <pre className="bg-slate-900 text-slate-100 rounded-md p-2 overflow-x-auto text-xs font-mono my-1.5">
                        <code>{children}</code>
                      </pre>
                    ),
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noreferrer" className="text-emerald-700 underline">
                      {children}
                    </a>
                  ),
                }}
              >
                {b.text || ''}
              </ReactMarkdown>
            </div>
          );
        })}
      </div>
    </div>
  );
}
