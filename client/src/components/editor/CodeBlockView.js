"use client";

import React, { useState } from "react";
import { NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from "@tiptap/react";
import CodeBlock from "@tiptap/extension-code-block";
import CustomDropdown from "../CustomDropdown";
import { LuCheck, LuCopy } from "react-icons/lu";

export const CODE_LANGUAGES = [
  { label: "JavaScript", value: "javascript" },
  { label: "TypeScript", value: "typescript" },
  { label: "Python", value: "python" },
  { label: "HTML", value: "html" },
  { label: "CSS", value: "css" },
  { label: "JSON", value: "json" },
  { label: "SQL", value: "sql" },
  { label: "Bash / Shell", value: "bash" },
  { label: "Rust", value: "rust" },
  { label: "Go", value: "go" },
  { label: "C++", value: "cpp" },
  { label: "Java", value: "java" },
  { label: "PHP", value: "php" },
  { label: "Markdown", value: "markdown" },
  { label: "Plain Text", value: "plaintext" },
];

const ALIASES = {
  js: "javascript",
  ts: "typescript",
  py: "python",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  yml: "yaml",
  c: "cpp",
  text: "plaintext",
  txt: "plaintext",
};

export function CodeBlockComponent({ node, updateAttributes }) {
  const rawLang = (node?.attrs?.language || "plaintext").toLowerCase();
  const currentLang = ALIASES[rawLang] || rawLang;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    try {
      const text = node?.textContent || "";
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.warn("Copy failed:", e);
    }
  };

  return (
    <NodeViewWrapper className="code-block-container my-4 rounded-xl overflow-hidden border border-zinc-800 bg-[#16161a] text-zinc-100 shadow-md">
      {/* Individual Code Block Header Bar */}
      <div
        className="code-block-header flex items-center justify-between px-3 py-1.5 bg-[#1f1f24] border-b border-zinc-800 text-xs select-none"
        contentEditable={false}
      >
        {/* Custom Language Dropdown directly on this code block */}
        <div className="flex items-center gap-2">
          <CustomDropdown
            value={currentLang}
            onChange={(newLang) => updateAttributes({ language: newLang === "plaintext" ? null : newLang })}
            options={CODE_LANGUAGES}
            size="sm"
            searchable={true}
            buttonClassName="bg-zinc-800/90 hover:bg-zinc-700/80 text-zinc-300 hover:text-white border-zinc-700/60 rounded-md py-0.5 px-2 text-[11px]"
            menuClassName="bg-[#1f1f24] border-zinc-700 text-zinc-200 shadow-2xl"
          />
        </div>

        {/* 1-Click Copy Code Button */}
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
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

      {/* Code Text Content */}
      <pre className="!p-4 !m-0 !bg-transparent !border-0 overflow-x-auto text-[13px] font-mono leading-relaxed text-zinc-200">
        <NodeViewContent as="code" className={currentLang ? `language-${currentLang}` : ""} />
      </pre>
    </NodeViewWrapper>
  );
}

export const CustomCodeBlock = CodeBlock.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockComponent);
  },
});
