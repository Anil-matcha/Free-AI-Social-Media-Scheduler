"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import RichEditor from "./editor/RichEditor";
import { inspectMarkdown } from "./editor/markdown";
import {
  WindowIcon,
  SparklesIcon,
} from "./Icons";
import { LuFileCode2 } from "react-icons/lu";

const DEFAULT_STARTER_TEMPLATE = `> Pages are a place for you to write, build, and collaborate with ChatGPT and your teammates. Use this page as your playground to learn the basics — and have fun!

### Getting started

- [ ] **Play with this page.** Type \`/\` to add headings, images, checklists, tables, and more. Try it out below!

I'm a curious, collaborative person who enjoys turning ideas into meaningful projects, learning from the people around me, and finding thoughtful ways to help others.

- [ ] Try adding a heading, checklist, or callout to this page using the \`/\` menu.`;

const EMOJI_OPTIONS = ["📄", "🎓", "💡", "🚀", "📌", "📊", "📝", "🎯", "⚡", "🤖", "📁", "💻"];

export default function CanvasPage({
  page,
  onUpdatePage,
  onStatusChange,
  onTriggerAI,
  saveTrigger,
}) {
  const [title, setTitle] = useState(page?.title || "Untitled page");
  const [icon, setIcon] = useState(page?.icon || "📄");
  const [content, setContent] = useState(page?.content || "");
  const [sourceMode, setSourceMode] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [promptInput, setPromptInput] = useState("");
  const [notice, setNotice] = useState("");

  const draftRef = useRef({
    id: page?.id,
    title: page?.title || "Untitled page",
    icon: page?.icon || "📄",
    content: page?.content || "",
    isDirty: false,
  });

  // Hold timer: only trigger save when user STOPS typing/modifying
  const idleHoldTimerRef = useRef(null);
  const isSavingRef = useRef(false);
  const saveQueuedRef = useRef(false);
  const prevSaveTriggerRef = useRef(saveTrigger);

  // Sync draft state whenever page prop changes
  useEffect(() => {
    if (!page) return;

    if (draftRef.current.isDirty && draftRef.current.id && draftRef.current.id !== page.id) {
      flushSave(draftRef.current);
    }

    const initialTitle = page.title || "Untitled page";
    const initialIcon = page.icon || "📄";
    const rawContent =
      page.content !== undefined && page.content !== null && page.content !== ""
        ? page.content
        : DEFAULT_STARTER_TEMPLATE;

    setTitle(initialTitle);
    setIcon(initialIcon);
    setContent(rawContent);

    draftRef.current = {
      id: page.id,
      title: initialTitle,
      icon: initialIcon,
      content: rawContent,
      isDirty: false,
    };

    if (onStatusChange) {
      onStatusChange("Saved");
    }
  }, [page?.id]);

  // Flush save function
  const flushSave = useCallback(
    async (overrideDraft = null) => {
      const current = overrideDraft || draftRef.current;
      if (!current.id || !current.isDirty) return;

      if (idleHoldTimerRef.current) {
        clearTimeout(idleHoldTimerRef.current);
        idleHoldTimerRef.current = null;
      }

      if (isSavingRef.current) {
        saveQueuedRef.current = true;
        return;
      }

      isSavingRef.current = true;
      if (onStatusChange) onStatusChange("Saving...");

      const snapshot = {
        id: current.id,
        title: current.title,
        icon: current.icon,
        content: current.content,
      };

      try {
        const updated = await onUpdatePage(snapshot.id, {
          title: snapshot.title,
          icon: snapshot.icon,
          content: snapshot.content,
        });

        if (updated) {
          if (
            draftRef.current.content === snapshot.content &&
            draftRef.current.title === snapshot.title &&
            draftRef.current.icon === snapshot.icon
          ) {
            draftRef.current.isDirty = false;
            if (onStatusChange) onStatusChange("Saved");
          } else {
            // Further edits were made while request was in flight
            draftRef.current.isDirty = true;
            if (onStatusChange) onStatusChange("Unsaved changes");
            idleHoldTimerRef.current = setTimeout(() => {
              flushSave();
            }, 1500);
          }
        } else {
          if (onStatusChange) onStatusChange("Failed");
        }
      } catch (err) {
        console.warn("Autosave error:", err?.message || err);
        if (onStatusChange) onStatusChange("Failed");
      } finally {
        isSavingRef.current = false;
        if (saveQueuedRef.current && draftRef.current.isDirty) {
          saveQueuedRef.current = false;
          idleHoldTimerRef.current = setTimeout(() => {
            flushSave();
          }, 1500);
        }
      }
    },
    [onUpdatePage, onStatusChange]
  );

  // Debounced idle hold: Hold changes on "Unsaved changes" until user stops for 1.5s
  const scheduleIdleAutosave = useCallback(
    (newDraft) => {
      draftRef.current = {
        ...draftRef.current,
        ...newDraft,
        isDirty: true,
      };
      if (onStatusChange) onStatusChange("Unsaved changes");

      // Reset the hold timer on every change
      if (idleHoldTimerRef.current) {
        clearTimeout(idleHoldTimerRef.current);
      }

      idleHoldTimerRef.current = setTimeout(() => {
        flushSave();
      }, 1500);
    },
    [flushSave, onStatusChange]
  );

  // Respond to manual Save button trigger from PageHeaderBar
  useEffect(() => {
    if (saveTrigger !== prevSaveTriggerRef.current) {
      prevSaveTriggerRef.current = saveTrigger;
      if (draftRef.current.isDirty) {
        flushSave();
      }
    }
  }, [saveTrigger, flushSave]);

  // Keyboard shortcut Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        flushSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [flushSave]);

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (idleHoldTimerRef.current) {
        clearTimeout(idleHoldTimerRef.current);
      }
      if (draftRef.current.isDirty && draftRef.current.id) {
        flushSave(draftRef.current);
      }
    };
  }, [flushSave]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowEmojiPicker(false);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const handleTitleChange = (newTitle) => {
    setTitle(newTitle);
    scheduleIdleAutosave({ title: newTitle });
  };

  const handleIconChange = (newIcon) => {
    setIcon(newIcon);
    setShowEmojiPicker(false);
    scheduleIdleAutosave({ icon: newIcon });
  };

  const handleContentChange = (newContent) => {
    setContent(newContent);
    scheduleIdleAutosave({ content: newContent });
  };

  const safety = inspectMarkdown(content);

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-[#141416] text-zinc-900 dark:text-zinc-100 transition-colors duration-150">
      <div className="max-w-3xl mx-auto px-10 py-10">
        {/* Top Control Bar: Mode Toggle & Emoji Picker */}
        <div className="flex items-center justify-between mb-4 select-none">
          {/* Emoji Page Icon */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowEmojiPicker(!showEmojiPicker);
              }}
              className="text-4xl p-1 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer select-none"
              title="Click to change icon"
            >
              {icon || "📄"}
            </button>

            {showEmojiPicker && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute left-0 top-14 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl p-2 z-40 flex flex-wrap gap-2 w-56 animate-in fade-in zoom-in-95 duration-100"
              >
                {EMOJI_OPTIONS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => handleIconChange(e)}
                    className="w-9 h-9 flex items-center justify-center text-xl rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer transition-transform hover:scale-110"
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mode Switcher Button (Visual Editor vs Markdown Source) */}
          <button
            type="button"
            onClick={() => {
              if (!sourceMode && !safety.supported) {
                setNotice(safety.reason || "This document needs Markdown source mode.");
              }
              setSourceMode(!sourceMode);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors border ${
              sourceMode
                ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            <WindowIcon className="w-3.5 h-3.5" />
            <span>{sourceMode ? "Visual Editor" : "Markdown Source"}</span>
          </button>
        </div>

        {/* Notice alert if any */}
        {notice && (
          <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between">
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice("")}
              className="text-amber-600 dark:text-amber-400 font-bold ml-2 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Page Title Input matching OpenDots (Image 2) */}
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          onBlur={() => flushSave()}
          placeholder="Untitled page"
          maxLength={160}
          className="document-title w-full text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 bg-transparent focus:outline-none placeholder-zinc-300 dark:placeholder-zinc-600 mb-6"
        />

        {/* Document Body */}
        {sourceMode ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 pb-1">
              <LuFileCode2 size={16} />
              <span>Markdown source</span>
            </div>
            <textarea
              rows={20}
              spellCheck={false}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              onBlur={() => flushSave()}
              placeholder="Write your document in Markdown..."
              className="w-full bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-xs font-mono text-zinc-800 dark:text-zinc-200 leading-relaxed resize-y focus:outline-none focus:border-zinc-400 transition-colors"
            />
            <div className="text-[11px] text-zinc-400 flex justify-between">
              <span>{content.length} characters</span>
              <span>{content.split(/\s+/).filter(Boolean).length} words</span>
            </div>
          </div>
        ) : (
          /* Visual Document Editor matching OpenDots (Image 2) */
          <div className="document-editor-wrapper">
            <RichEditor
              value={content}
              onChange={handleContentChange}
              onNotice={(msg) => setNotice(msg)}
              pageTitle={title}
              pageId={page?.id}
            />
          </div>
        )}

        {/* Inline ChatGPT / Dot Directive Box */}
        <div className="mt-12 p-4 rounded-xl bg-zinc-50 dark:bg-[#18181e] border border-zinc-200 dark:border-zinc-800 space-y-2 select-none">
          <div className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              Work with ChatGPT.
            </span>{" "}
            Type{" "}
            <span className="bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 font-medium px-1.5 py-0.5 rounded text-[11px] border border-indigo-200 dark:border-indigo-800">
              @ChatGPT
            </span>
            , followed by your request, and ChatGPT will jump in to help with whatever you need.
          </div>

          <div className="flex items-center gap-2 pt-1">
            <span className="text-zinc-400 text-xs">↳</span>
            <input
              type="text"
              placeholder="do some research about this topic or ask Dot agent..."
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && promptInput.trim()) {
                  onTriggerAI && onTriggerAI(promptInput.trim());
                  setPromptInput("");
                }
              }}
              className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-indigo-500 shadow-2xs"
            />
            <button
              type="button"
              onClick={() => {
                if (promptInput.trim()) {
                  onTriggerAI && onTriggerAI(promptInput.trim());
                  setPromptInput("");
                }
              }}
              className="p-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 transition-opacity cursor-pointer"
              title="Run directive"
            >
              <SparklesIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
