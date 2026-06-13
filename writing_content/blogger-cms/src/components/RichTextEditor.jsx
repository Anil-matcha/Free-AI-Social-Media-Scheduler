"use client";

import { useEffect, useRef, useState } from "react";
import { FaBold, FaItalic, FaUnderline, FaListUl, FaListOl, FaHeading, FaCode, FaParagraph } from "react-icons/fa";

export function RichTextEditor({ value, onChange, placeholder = "Start writing your blog post content..." }) {
  const editorRef = useRef(null);
  const [html, setHtml] = useState(value || "");

  // Update editor content when value changes externally (e.g. from AI generation)
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || "";
      setHtml(value || "");
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      const currentHtml = editorRef.current.innerHTML;
      setHtml(currentHtml);
      onChange(currentHtml);
    }
  };

  const executeCommand = (command, argument = null) => {
    document.execCommand(command, false, argument);
    handleInput();
  };

  const isEmptyHtml = (h) => {
    if (!h) return true;
    const clean = h.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
    return clean === "";
  };

  return (
    <div className="w-full relative border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            executeCommand("formatBlock", "<p>");
          }}
          title="Paragraph"
          className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <FaParagraph className="text-sm" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            executeCommand("formatBlock", "<h2>");
          }}
          title="Heading 2"
          className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex items-center gap-0.5"
        >
          <FaHeading className="text-xs" />
          <span className="text-[10px] font-bold">2</span>
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            executeCommand("formatBlock", "<h3>");
          }}
          title="Heading 3"
          className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex items-center gap-0.5"
        >
          <FaHeading className="text-xs" />
          <span className="text-[10px] font-bold">3</span>
        </button>
        <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            executeCommand("bold");
          }}
          title="Bold"
          className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <FaBold className="text-sm" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            executeCommand("italic");
          }}
          title="Italic"
          className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <FaItalic className="text-sm" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            executeCommand("underline");
          }}
          title="Underline"
          className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <FaUnderline className="text-sm" />
        </button>
        <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            executeCommand("insertUnorderedList");
          }}
          title="Bullet List"
          className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <FaListUl className="text-sm" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            executeCommand("insertOrderedList");
          }}
          title="Numbered List"
          className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <FaListOl className="text-sm" />
        </button>
      </div>
 
      {/* Editor Content Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="w-full min-h-[350px] max-h-[600px] overflow-y-auto p-5 outline-none prose prose-slate max-w-none dark:prose-invert focus:ring-0 dark:bg-slate-900 dark:text-slate-100"
        placeholder={placeholder}
        style={{ minHeight: "400px" }}
      />
      {isEmptyHtml(html) && (
        <div className="absolute top-[80px] left-[20px] pointer-events-none text-slate-400 text-sm select-none">
          {placeholder}
        </div>
      )}
    </div>
  );
}
