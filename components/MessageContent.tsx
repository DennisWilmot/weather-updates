/**
 * MessageContent - Safe component for rendering message content
 * Handles empty content, whitespace, and ensures proper rendering
 * Supports markdown formatting
 */
'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageContentProps {
  content: string;
  className?: string;
}

export default function MessageContent({ content, className = '' }: MessageContentProps) {
  // If content is empty or only whitespace, show placeholder
  if (!content || !content.trim()) {
    return (
      <span className={`text-gray-400 italic ${className}`}>
        Thinking...
      </span>
    );
  }

  // Render the content with markdown support
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Customize heading styles
          h1: ({ node, ...props }) => <h1 className="text-lg font-bold mt-4 mb-2" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-base font-bold mt-3 mb-2" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-sm font-semibold mt-2 mb-1" {...props} />,
          // Customize list styles
          ul: ({ node, ...props }) => <ul className="list-disc list-inside my-2 space-y-1" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal list-inside my-2 space-y-1" {...props} />,
          li: ({ node, ...props }) => <li className="ml-2" {...props} />,
          // Customize code blocks
          code: ({ node, className, children, ...props }: any) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-xs font-mono" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code className="block bg-black/10 dark:bg-white/10 p-2 rounded text-xs font-mono overflow-x-auto my-2" {...props}>
                {children}
              </code>
            );
          },
          // Customize paragraph
          p: ({ node, ...props }) => <p className="my-2 first:mt-0 last:mb-0" {...props} />,
          // Customize strong/bold
          strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
          // Customize emphasis/italic
          em: ({ node, ...props }) => <em className="italic" {...props} />,
          // Customize links - use colors that work in both light and dark contexts
          a: ({ node, ...props }) => (
            <a className="text-blue-500 hover:text-blue-600 dark:text-blue-300 dark:hover:text-blue-200 hover:underline underline" target="_blank" rel="noopener noreferrer" {...props} />
          ),
          // Customize blockquote
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-current/30 pl-4 italic my-2 opacity-80" {...props} />
          ),
          // Customize horizontal rule
          hr: ({ node, ...props }) => <hr className="my-4 border-current/20" {...props} />,
          // Customize table
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-2">
              <table className="min-w-full border-collapse border border-gray-300" {...props} />
            </div>
          ),
          th: ({ node, ...props }) => (
            <th className="border border-gray-300 px-2 py-1 bg-gray-100 font-semibold text-left" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="border border-gray-300 px-2 py-1" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

