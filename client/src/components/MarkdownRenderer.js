"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { LuCopy, LuCheck } from "react-icons/lu";

function MarkdownCodeBlock({ className, children }) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const lang = match ? match[1] : "";
  const codeText = typeof children === "string" ? children : (Array.isArray(children) ? children.join("") : String(children || ""));

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(codeText.replace(/\n$/, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.warn("Copy failed:", e);
    }
  };

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-zinc-800 bg-[#16161a] text-zinc-100 shadow-md">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#1f1f24] border-b border-zinc-800 text-xs select-none">
        <span className="text-[11px] font-mono text-zinc-400 font-medium tracking-wide uppercase">
          {lang || "code"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <LuCheck size={12} className="text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <LuCopy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="!p-4 !m-0 !bg-transparent !border-0 overflow-x-auto text-[13px] font-mono leading-relaxed text-zinc-200">
        <code>{children}</code>
      </pre>
    </div>
  );
}

export default function MarkdownRenderer({ content = "" }) {
  return (
    <div className="markdown-content text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 space-y-3">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => (
            <h1
              className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-4 mb-2 first:mt-0"
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <h2
              className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mt-3.5 mb-1.5 first:mt-0"
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3
              className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-3 mb-1 first:mt-0"
              {...props}
            />
          ),
          p: ({ node, ...props }) => (
            <p className="my-1.5 leading-relaxed text-zinc-800 dark:text-zinc-200" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc pl-5 my-2 space-y-1 text-zinc-800 dark:text-zinc-200" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal pl-5 my-2 space-y-1 text-zinc-800 dark:text-zinc-200" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="leading-relaxed pl-0.5" {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-semibold text-zinc-900 dark:text-zinc-100" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="italic text-zinc-800 dark:text-zinc-200" {...props} />
          ),
          hr: ({ node, ...props }) => (
            <hr className="my-4 border-zinc-200 dark:border-zinc-800" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-2 border-indigo-500 pl-3 my-2 italic text-zinc-600 dark:text-zinc-400"
              {...props}
            />
          ),
          code: ({ node, inline, className, children, ...props }) => {
            const isInline = !className && typeof children === "string" && !children.includes("\n");
            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 text-xs font-medium font-mono"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return <MarkdownCodeBlock className={className}>{children}</MarkdownCodeBlock>;
          },
          table: ({ node, ...props }) => (
            <div className="my-4 overflow-x-auto rounded-xl border border-zinc-300 dark:border-zinc-700/80 bg-white dark:bg-[#141418] shadow-xs">
              <table className="min-w-full text-xs border-collapse border-spacing-0" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-zinc-100/90 dark:bg-zinc-800/80 font-semibold" {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr className="last:[&>td]:border-b-0 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="px-4 py-2.5 text-left border-b border-r border-zinc-300 dark:border-zinc-700/80 last:border-r-0 font-semibold text-zinc-900 dark:text-zinc-100" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-4 py-2.5 border-b border-r border-zinc-200 dark:border-zinc-800 last:border-r-0 text-zinc-800 dark:text-zinc-200 align-top leading-relaxed" {...props} />
          ),
          a: ({ node, ...props }) => (
            <a
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
