import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ExternalLink, Copy, Check } from 'lucide-react';

interface DynamicMarkdownProps {
  content: string;
  className?: string;
}

export const DynamicMarkdown: React.FC<DynamicMarkdownProps> = ({ content, className = '' }) => {
  return (
    <div className={`dynamic-markdown font-sans text-xs md:text-sm leading-relaxed text-slate-200 max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // ── Tables ──
          table: ({ children, ...props }) => (
            <div className="my-3.5 overflow-x-auto rounded-xl border border-[#1e293b] bg-[#070e1b] shadow-xl">
              <table className="w-full text-left border-collapse text-xs font-sans" {...props}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }) => (
            <thead className="bg-[#0b1326] border-b border-[#1e293b] text-slate-300 font-headline uppercase tracking-wider text-[11px]" {...props}>
              {children}
            </thead>
          ),
          tbody: ({ children, ...props }) => (
            <tbody className="divide-y divide-[#1e293b]/70" {...props}>
              {children}
            </tbody>
          ),
          tr: ({ children, ...props }) => (
            <tr className="hover:bg-[#0f172a] transition-colors" {...props}>
              {children}
            </tr>
          ),
          th: ({ children, ...props }) => (
            <th className="py-2.5 px-3.5 font-bold text-cyan-300 font-mono text-[11px]" {...props}>
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className="py-2.5 px-3.5 text-slate-200 align-middle leading-normal" {...props}>
              {children}
            </td>
          ),

          // ── Headings ──
          h1: ({ children, ...props }) => (
            <h1 className="font-headline text-lg md:text-xl font-extrabold text-[#dae2fd] mt-4 mb-2 tracking-tight flex items-center gap-2 border-b border-[#1e293b] pb-1.5" {...props}>
              <span className="w-2 h-2 rounded-full bg-primary glow-cyan"></span>
              <span>{children}</span>
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="font-headline text-base md:text-lg font-bold text-slate-100 mt-3.5 mb-1.5 tracking-tight flex items-center gap-2" {...props}>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              <span>{children}</span>
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="font-headline text-sm md:text-base font-bold text-cyan-300 mt-3 mb-1" {...props}>
              {children}
            </h3>
          ),
          h4: ({ children, ...props }) => (
            <h4 className="font-headline text-xs md:text-sm font-semibold text-slate-300 mt-2 mb-1" {...props}>
              {children}
            </h4>
          ),

          // ── Paragraphs & Spacing ──
          p: ({ children, ...props }) => (
            <p className="my-2 text-slate-200 leading-relaxed font-normal" {...props}>
              {children}
            </p>
          ),

          // ── Inline Text Formatting ──
          strong: ({ children, ...props }) => (
            <strong className="font-bold text-slate-100 font-headline tracking-wide" {...props}>
              {children}
            </strong>
          ),
          em: ({ children, ...props }) => (
            <em className="italic text-cyan-200/90 font-serif" {...props}>
              {children}
            </em>
          ),

          // ── Hyperlinks ──
          a: ({ href, children, ...props }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-primary hover:text-cyan-300 underline underline-offset-2 decoration-cyan-500/50 hover:decoration-cyan-300 transition-colors cursor-pointer"
              {...props}
            >
              <span>{children}</span>
              <ExternalLink className="w-3 h-3 inline-block flex-shrink-0 opacity-80" />
            </a>
          ),

          // ── Lists ──
          ul: ({ children, ...props }) => (
            <ul className="my-2 ml-4 space-y-1 list-disc list-outside marker:text-primary" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="my-2 ml-4 space-y-1 list-decimal list-outside marker:text-cyan-400 marker:font-mono marker:font-bold" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="pl-1 text-slate-200 leading-relaxed" {...props}>
              {children}
            </li>
          ),

          // ── Blockquotes ──
          blockquote: ({ children, ...props }) => (
            <blockquote className="my-3 border-l-4 border-primary bg-cyan-950/20 px-4 py-2.5 rounded-r-xl text-slate-300 italic border border-[#1e293b]" {...props}>
              {children}
            </blockquote>
          ),

          // ── Horizontal Rule ──
          hr: ({ ...props }) => (
            <hr className="my-4 border-t border-[#1e293b]" {...props} />
          ),

          // ── Code blocks & Inline code ──
          code: ({ inline, className, children, ...props }: any) => {
            if (inline) {
              return (
                <code className="bg-[#070e1b] text-cyan-300 font-mono text-[11px] px-1.5 py-0.5 rounded border border-cyan-900/60 font-semibold" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <CodeBlock className={className}>
                {String(children).replace(/\n$/, '')}
              </CodeBlock>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

interface CodeBlockProps {
  className?: string;
  children: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ className, children }) => {
  const [copied, setCopied] = useState(false);
  const language = className ? className.replace(/language-/, '') : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl border border-[#1e293b] bg-[#070e1b] overflow-hidden shadow-lg">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#0b1326] border-b border-[#1e293b] text-xs font-mono text-slate-400">
        <span className="uppercase text-[10px] tracking-wider text-cyan-400 font-bold">
          {language || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] hover:text-slate-200 transition-colors px-2 py-0.5 rounded hover:bg-[#1e293b]"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-xs font-mono text-slate-200 leading-relaxed">
        <code>{children}</code>
      </pre>
    </div>
  );
};
