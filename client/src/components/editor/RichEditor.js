"use client";

import React, { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import { Markdown } from "@tiptap/markdown";
import Placeholder from "@tiptap/extension-placeholder";
import {
  LuBold,
  LuItalic,
  LuHeading1,
  LuHeading2,
  LuHeading3,
  LuList,
  LuListOrdered,
  LuListTodo,
  LuQuote,
  LuCode,
  LuTable,
  LuMinus,
  LuLink,
  LuUndo2,
  LuRedo2,
  LuPlus,
  LuChevronDown,
  LuTrash2,
  LuSparkles,
} from "react-icons/lu";
import { documentExtensions } from "./markdown";
import { SlashCommands } from "./slash-commands";
import "./editor.css";

export default function RichEditor({
  value = "",
  onChange,
  onNotice,
  pageTitle = "Page",
  pageId = "",
}) {
  const changeRef = useRef(onChange);
  changeRef.current = onChange;
  const noticeRef = useRef(onNotice);
  noticeRef.current = onNotice;
  const emittedRef = useRef(value);

  const [showInsertMenu, setShowInsertMenu] = useState(false);
  const insertMenuRef = useRef(null);

  const editor = useEditor({
    extensions: [
      ...documentExtensions(),
      Markdown,
      Placeholder.configure({
        placeholder: "Start writing, or type / for blocks…",
      }),
      SlashCommands,
    ],
    content: value,
    contentType: "markdown",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "document-prose",
        "aria-label": "Page content",
        role: "textbox",
        "aria-multiline": "true",
      },
    },
    onUpdate: ({ editor: ed }) => {
      const markdown = ed.getMarkdown();
      emittedRef.current = markdown;
      if (changeRef.current) {
        changeRef.current(markdown);
      }
    },
  });

  const state = useEditorState({
    editor,
    selector: ({ editor: ed }) =>
      ed
        ? {
            bold: ed.isActive("bold"),
            italic: ed.isActive("italic"),
            h1: ed.isActive("heading", { level: 1 }),
            h2: ed.isActive("heading", { level: 2 }),
            h3: ed.isActive("heading", { level: 3 }),
            bullet: ed.isActive("bulletList"),
            ordered: ed.isActive("orderedList"),
            checklist: ed.isActive("taskList"),
            quote: ed.isActive("blockquote"),
            code: ed.isActive("codeBlock"),
            table: ed.isActive("table"),
            undo: ed.can().undo(),
            redo: ed.can().redo(),
          }
        : null,
  });

  // Sync external value safely outside React lifecycle to avoid flushSync collision
  useEffect(() => {
    if (editor && value !== emittedRef.current) {
      emittedRef.current = value;
      const timer = setTimeout(() => {
        if (!editor.isDestroyed) {
          editor.commands.setContent(value, {
            contentType: "markdown",
            emitUpdate: false,
          });
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [editor, value]);

  // Sync page context into editor storage
  useEffect(() => {
    if (editor) {
      editor.storage.pageContext = { title: pageTitle, pageId };
    }
  }, [editor, pageTitle, pageId]);

  // Close insert menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (insertMenuRef.current && !insertMenuRef.current.contains(e.target)) {
        setShowInsertMenu(false);
      }
    };
    document.addEventListener("pointerdown", handleClickOutside);
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, []);

  if (!editor) {
    return <div className="editor-loading">Loading editor…</div>;
  }

  return (
    <div className="w-full">
      {/* 1. Main Format Toolbar */}
      <div
        className="format-toolbar"
        role="toolbar"
        aria-label="Text formatting"
      >
        {/* Insert Block Dropdown Button */}
        <div className="relative inline-block" ref={insertMenuRef}>
          <button
            type="button"
            className="insert-block-trigger"
            onClick={() => setShowInsertMenu(!showInsertMenu)}
            title="Insert block (+)"
            aria-expanded={showInsertMenu}
          >
            <LuPlus size={15} />
            <span>Insert</span>
            <LuChevronDown size={12} className={`transition-transform ${showInsertMenu ? "rotate-180" : ""}`} />
          </button>

          {showInsertMenu && (
            <div className="insert-block-dropdown animate-in fade-in zoom-in-95 duration-100">
              <div className="insert-dropdown-section">AI GENERATE</div>
              <button
                type="button"
                className="ai-menu-item"
                onClick={() => {
                  editor.chain().focus().insertContent({ type: "aiPrompt" }).run();
                  setShowInsertMenu(false);
                }}
              >
                <span className="insert-icon ai-insert-icon">✨</span>
                <span className="insert-text font-semibold text-purple-700 dark:text-purple-300">Generate with AI</span>
              </button>

              <button
                type="button"
                className="ai-menu-item"
                onClick={() => {
                  editor.chain().focus().insertContent({ type: "aiImagePrompt" }).run();
                  setShowInsertMenu(false);
                }}
              >
                <span className="insert-icon ai-insert-icon">🖼️</span>
                <span className="insert-text font-semibold text-purple-700 dark:text-purple-300">Generate Image (GPT-Image-2)</span>
              </button>

              <div className="insert-dropdown-section">BASIC BLOCKS</div>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().setParagraph().run();
                  setShowInsertMenu(false);
                }}
              >
                <span className="insert-icon">T</span>
                <span className="insert-text">Text paragraph</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().setHeading({ level: 1 }).run();
                  setShowInsertMenu(false);
                }}
              >
                <span className="insert-icon">H1</span>
                <span className="insert-text">Heading 1</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().setHeading({ level: 2 }).run();
                  setShowInsertMenu(false);
                }}
              >
                <span className="insert-icon">H2</span>
                <span className="insert-text">Heading 2</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().setHeading({ level: 3 }).run();
                  setShowInsertMenu(false);
                }}
              >
                <span className="insert-icon">H3</span>
                <span className="insert-text">Heading 3</span>
              </button>

              <div className="insert-dropdown-section">LISTS & CALLOUTS</div>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleBulletList().run();
                  setShowInsertMenu(false);
                }}
              >
                <span className="insert-icon">•</span>
                <span className="insert-text">Bullet list</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleOrderedList().run();
                  setShowInsertMenu(false);
                }}
              >
                <span className="insert-icon">1.</span>
                <span className="insert-text">Numbered list</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleTaskList().run();
                  setShowInsertMenu(false);
                }}
              >
                <span className="insert-icon">☑</span>
                <span className="insert-text">Checklist</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleBlockquote().run();
                  setShowInsertMenu(false);
                }}
              >
                <span className="insert-icon">“</span>
                <span className="insert-text">Quote callout</span>
              </button>

              <div className="insert-dropdown-section">COMPONENTS</div>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                  setShowInsertMenu(false);
                }}
              >
                <span className="insert-icon">⊞</span>
                <span className="insert-text">Table (3x3 grid)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleCodeBlock({ language: "javascript" }).run();
                  setShowInsertMenu(false);
                }}
              >
                <span className="insert-icon">&lt;&gt;</span>
                <span className="insert-text">Code block</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().setHorizontalRule().run();
                  setShowInsertMenu(false);
                }}
              >
                <span className="insert-icon">—</span>
                <span className="insert-text">Divider line</span>
              </button>
            </div>
          )}
        </div>

        <span className="toolbar-divider" />

        {/* Text styling */}
        <button
          type="button"
          title="Bold (⌘/Ctrl B)"
          aria-label="Bold"
          aria-pressed={state?.bold}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <LuBold size={15} />
        </button>
        <button
          type="button"
          title="Italic (⌘/Ctrl I)"
          aria-label="Italic"
          aria-pressed={state?.italic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <LuItalic size={15} />
        </button>

        <span className="toolbar-divider" />

        {/* Headings */}
        <button
          type="button"
          title="Heading 1"
          aria-label="Heading 1"
          aria-pressed={state?.h1}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <LuHeading1 size={16} />
        </button>
        <button
          type="button"
          title="Heading 2"
          aria-label="Heading 2"
          aria-pressed={state?.h2}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <LuHeading2 size={16} />
        </button>
        <button
          type="button"
          title="Heading 3"
          aria-label="Heading 3"
          aria-pressed={state?.h3}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <LuHeading3 size={16} />
        </button>

        <span className="toolbar-divider" />

        {/* Lists */}
        <button
          type="button"
          title="Bullet list"
          aria-label="Bullet list"
          aria-pressed={state?.bullet}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <LuList size={16} />
        </button>
        <button
          type="button"
          title="Numbered list"
          aria-label="Numbered list"
          aria-pressed={state?.ordered}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <LuListOrdered size={16} />
        </button>
        <button
          type="button"
          title="Checklist"
          aria-label="Checklist"
          aria-pressed={state?.checklist}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        >
          <LuListTodo size={16} />
        </button>

        <span className="toolbar-divider" />

        {/* Blocks: Quote, Code, Table, Divider, Link */}
        <button
          type="button"
          title="Quote"
          aria-label="Quote"
          aria-pressed={state?.quote}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <LuQuote size={15} />
        </button>
        <button
          type="button"
          title="Code block"
          aria-label="Code block"
          aria-pressed={state?.code}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <LuCode size={16} />
        </button>
        <button
          type="button"
          title="Insert table"
          aria-label="Insert table"
          aria-pressed={state?.table}
          onClick={() => {
            if (state?.table) {
              editor.chain().focus().deleteTable().run();
            } else {
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
            }
          }}
        >
          <LuTable size={16} />
        </button>
        <button
          type="button"
          title="Horizontal divider"
          aria-label="Divider"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <LuMinus size={16} />
        </button>
        <button
          type="button"
          title="Add link"
          aria-label="Add link"
          onClick={() => {
            const currentHref = editor.getAttributes("link").href ?? "";
            const url = window.prompt("Link URL (https://...)", currentHref);
            if (url === null) return;
            if (!url) {
              editor.chain().focus().unsetLink().run();
              return;
            }
            editor
              .chain()
              .focus()
              .extendMarkRange("link")
              .setLink({ href: url })
              .run();
          }}
        >
          <LuLink size={15} />
        </button>

        <span className="toolbar-divider" />

        {/* Undo / Redo */}
        <button
          type="button"
          aria-label="Undo"
          title="Undo (⌘/Ctrl Z)"
          disabled={!state?.undo}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <LuUndo2 size={15} />
        </button>
        <button
          type="button"
          aria-label="Redo"
          title="Redo"
          disabled={!state?.redo}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <LuRedo2 size={15} />
        </button>
      </div>

      {/* 2. Contextual Sub-bar: Table Controls (visible whenever cursor is inside a table) */}
      {state?.table && (
        <div className="table-actions-bar animate-in fade-in slide-in-from-top-1 duration-150">
          <span className="table-bar-label">Table:</span>
          <button
            type="button"
            onClick={() => editor.chain().focus().addRowBefore().run()}
            title="Add row above"
          >
            + Row Above
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().addRowAfter().run()}
            title="Add row below"
          >
            + Row Below
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteRow().run()}
            title="Delete current row"
          >
            - Delete Row
          </button>
          <span className="subbar-divider" />
          <button
            type="button"
            onClick={() => editor.chain().focus().addColumnBefore().run()}
            title="Add column to left"
          >
            + Col Left
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            title="Add column to right"
          >
            + Col Right
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteColumn().run()}
            title="Delete current column"
          >
            - Delete Col
          </button>
          <span className="subbar-divider" />
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteTable().run()}
            title="Delete entire table"
            className="table-delete-action"
          >
            <LuTrash2 size={13} />
            <span>Remove Table</span>
          </button>
        </div>
      )}

      {/* Unified TipTap Free-Typing Document Canvas */}
      <EditorContent editor={editor} />

      {/* 5. Editor Hint matching OpenDots */}
      <p className="editor-hint">
        Type <kbd>/</kbd> for blocks · Click <kbd>+ Insert</kbd> in toolbar · ⌘/Ctrl + S to save
      </p>
    </div>
  );
}
