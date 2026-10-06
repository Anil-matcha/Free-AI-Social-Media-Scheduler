"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import RichEditor from "./editor/RichEditor";
import { inspectMarkdown } from "./editor/markdown";
import {
  WindowIcon,
  SparklesIcon,
  ClockIcon,
  CloseIcon,
} from "./Icons";
import {
  LuFileCode2,
  LuTriangleAlert,
  LuRotateCcw,
  LuCopy,
  LuCheck,
  LuHistory,
} from "react-icons/lu";
import CustomDropdown from "./CustomDropdown";

const EMOJI_OPTIONS = ["📄", "🎓", "💡", "🚀", "📌", "📊", "📝", "🎯", "⚡", "🤖", "📁", "💻"];

export default function CanvasPage({
  page,
  onUpdatePage,
  onStatusChange,
  onTriggerAI,
  saveTrigger,
  historyOpen = false,
  onCloseHistory,
  onRestoreRevision,
  authHeaders = {},
}) {
  const [title, setTitle] = useState(page?.title || "Untitled page");
  const [icon, setIcon] = useState(page?.icon || "📄");
  const [content, setContent] = useState(page?.content || "");
  const [pageStatus, setPageStatus] = useState(page?.status || "draft");
  const [sourceMode, setSourceMode] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [promptInput, setPromptInput] = useState("");
  const [notice, setNotice] = useState("");

  // Conflict and Local Draft states
  const [conflictInfo, setConflictInfo] = useState(null);
  const [localDraftAlert, setLocalDraftAlert] = useState(null);
  const [copiedDraft, setCopiedDraft] = useState(false);

  // Revision History state
  const [revisions, setRevisions] = useState([]);
  const [isLoadingRevisions, setIsLoadingRevisions] = useState(false);

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

  // Helper to persist draft locally
  const persistLocalDraft = (draftObj) => {
    if (!draftObj?.id) return;
    try {
      localStorage.setItem(
        `openspaces_draft_${draftObj.id}`,
        JSON.stringify({
          title: draftObj.title,
          icon: draftObj.icon,
          content: draftObj.content,
          timestamp: Date.now(),
        })
      );
    } catch (_) {}
  };

  const clearLocalDraft = (pageId) => {
    if (!pageId) return;
    try {
      localStorage.removeItem(`openspaces_draft_${pageId}`);
    } catch (_) {}
  };

  // Sync draft state whenever page prop changes
  useEffect(() => {
    if (!page) return;

    if (draftRef.current.isDirty && draftRef.current.id && draftRef.current.id !== page.id) {
      flushSave(draftRef.current);
    }

    const initialTitle = page.title || "Untitled page";
    const initialIcon = page.icon || "📄";
    const rawContent = page.content ?? "";

    setTitle(initialTitle);
    setIcon(initialIcon);
    setContent(rawContent);
    setPageStatus(page.status || "draft");
    setConflictInfo(null);

    draftRef.current = {
      id: page.id,
      title: initialTitle,
      icon: initialIcon,
      content: rawContent,
      isDirty: false,
    };

    // Check for an unsaved local draft for this page
    try {
      const stored = localStorage.getItem(`openspaces_draft_${page.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (
          parsed &&
          (parsed.content !== rawContent || parsed.title !== initialTitle)
        ) {
          setLocalDraftAlert(parsed);
        } else {
          setLocalDraftAlert(null);
        }
      } else {
        setLocalDraftAlert(null);
      }
    } catch (_) {
      setLocalDraftAlert(null);
    }

    if (onStatusChange) {
      onStatusChange("Saved");
    }
  }, [page?.id]);

  // Fetch revisions when history drawer is opened
  useEffect(() => {
    if (!historyOpen || !page?.id || !page?.space_id) return;
    let isMounted = true;
    setIsLoadingRevisions(true);
    fetch(`http://localhost:8000/api/spaces/${page.space_id}/pages/${page.id}/revisions`, {
      headers: authHeaders,
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (isMounted) {
          setRevisions(data);
          setIsLoadingRevisions(false);
        }
      })
      .catch((err) => {
        console.error("Error loading page revisions:", err);
        if (isMounted) setIsLoadingRevisions(false);
      });
    return () => {
      isMounted = false;
    };
  }, [historyOpen, page?.id, page?.space_id, page?.version]);

  // Flush save function with optimistic concurrency
  const flushSave = useCallback(
    async (overrideDraft = null, forcedRevision = null) => {
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
        const payload = {
          title: snapshot.title,
          icon: snapshot.icon,
          content: snapshot.content,
        };
        if (forcedRevision !== null) {
          payload.expected_revision = forcedRevision;
        } else if (page?.version !== undefined) {
          payload.expected_revision = page.version;
        }

        const result = await onUpdatePage(snapshot.id, payload);

        if (result && result.conflict) {
          // 409 Conflict occurred
          setConflictInfo(result.detail);
          if (onStatusChange) onStatusChange("Conflict");
          return;
        }

        if (result) {
          setConflictInfo(null);
          clearLocalDraft(snapshot.id);

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
    [onUpdatePage, onStatusChange, page?.version]
  );

  // Debounced idle hold: Hold changes on "Unsaved changes" until user stops for 1.5s
  const scheduleIdleAutosave = useCallback(
    (newDraft) => {
      draftRef.current = {
        ...draftRef.current,
        ...newDraft,
        isDirty: true,
      };
      persistLocalDraft(draftRef.current);
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

  const handleStatusChange = (newStatus) => {
    setPageStatus(newStatus);
    if (onUpdatePage && page?.id) {
      onUpdatePage(page.id, { status: newStatus });
    }
  };

  const safety = inspectMarkdown(content);

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Main Canvas Area */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-[#141416] text-zinc-900 dark:text-zinc-100 transition-colors duration-150">
        <div className="max-w-3xl mx-auto px-10 py-10">
          {/* Top Control Bar: Mode Toggle, Status Selector & Emoji Picker */}
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

            {/* Right Tools: Status Dropdown & Mode Switcher */}
            <div className="flex items-center gap-2">
              <CustomDropdown
                value={pageStatus}
                onChange={handleStatusChange}
                options={[
                  { label: "Draft", value: "draft", icon: "📝" },
                  { label: "In Review", value: "in_review", icon: "👀" },
                  { label: "Published", value: "published", icon: "🚀" },
                ]}
                size="xs"
                buttonClassName="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg py-1 px-2.5 text-xs border-zinc-200 dark:border-zinc-700"
              />

              {/* Mode Switcher Button (Visual Editor vs Markdown Source) */}
              <button
                type="button"
                onClick={() => {
                  if (!sourceMode && !safety.supported) {
                    setNotice(safety.reason || "This document needs Markdown source mode.");
                  }
                  setSourceMode(!sourceMode);
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors border ${
                  sourceMode
                    ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                <WindowIcon className="w-3.5 h-3.5" />
                <span>{sourceMode ? "Visual Editor" : "Markdown Source"}</span>
              </button>
            </div>
          </div>

          {/* Local Draft Recovery Alert Banner */}
          {localDraftAlert && (
            <div className="mb-6 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 flex items-center justify-between animate-in fade-in slide-in-from-top-1 shadow-2xs">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-amber-700 dark:text-amber-300">Unsaved Local Draft:</span>
                <span>You have an uncommitted local version from {new Date(localDraftAlert.timestamp || Date.now()).toLocaleTimeString()}.</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTitle(localDraftAlert.title || "Untitled page");
                    setIcon(localDraftAlert.icon || "📄");
                    setContent(localDraftAlert.content || "");
                    draftRef.current = {
                      id: page.id,
                      title: localDraftAlert.title || "Untitled page",
                      icon: localDraftAlert.icon || "📄",
                      content: localDraftAlert.content || "",
                      isDirty: true,
                    };
                    setLocalDraftAlert(null);
                    if (onStatusChange) onStatusChange("Unsaved changes");
                  }}
                  className="px-2.5 py-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  Restore Draft
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearLocalDraft(page.id);
                    setLocalDraftAlert(null);
                  }}
                  className="px-2.5 py-1 rounded-md hover:bg-amber-100 dark:hover:bg-amber-900/50 text-xs text-amber-800 dark:text-amber-300 transition-colors cursor-pointer"
                >
                  Discard
                </button>
              </div>
            </div>
          )}

          {/* Conflict Resolution Alert Banner */}
          {conflictInfo && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 animate-in fade-in slide-in-from-top-2 shadow-2xs">
              <div className="flex items-start gap-3">
                <LuTriangleAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-rose-900 dark:text-rose-100">
                    Edit Conflict Detected (Server is at revision v{conflictInfo.current_version})
                  </h4>
                  <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">
                    Another edit was saved while you were working. Your unsaved changes are preserved safely in your editor. Choose how you would like to proceed:
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        flushSave(draftRef.current, conflictInfo.current_version);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium transition-colors shadow-xs cursor-pointer"
                    >
                      Keep My Draft & Overwrite
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const serverP = conflictInfo.current_page;
                        if (serverP) {
                          setTitle(serverP.title || "Untitled page");
                          setIcon(serverP.icon || "📄");
                          setContent(serverP.content || "");
                          draftRef.current = {
                            id: serverP.id,
                            title: serverP.title || "Untitled page",
                            icon: serverP.icon || "📄",
                            content: serverP.content || "",
                            isDirty: false,
                          };
                        }
                        clearLocalDraft(page.id);
                        setConflictInfo(null);
                        if (onStatusChange) onStatusChange("Saved");
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-rose-300 dark:border-zinc-600 text-xs font-medium text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer"
                    >
                      Discard & Load Server Version
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof navigator !== "undefined" && navigator.clipboard) {
                          navigator.clipboard.writeText(content);
                          setCopiedDraft(true);
                          setTimeout(() => setCopiedDraft(false), 2000);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg hover:bg-rose-100/60 dark:hover:bg-rose-900/40 text-xs font-medium text-rose-800 dark:text-rose-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedDraft ? <LuCheck className="w-3.5 h-3.5 text-emerald-600" /> : <LuCopy className="w-3.5 h-3.5" />}
                      <span>{copiedDraft ? "Copied to clipboard!" : "Copy My Draft"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

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

          {/* Page Title Input */}
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
            /* Visual Document Editor */
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

          {/* Inline Open Spaces / Dot Directive Box */}
          <div className="mt-12 p-4 rounded-xl bg-zinc-50 dark:bg-[#18181e] border border-zinc-200 dark:border-zinc-800 space-y-2 select-none">
            <div className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                Work with Open Spaces.
              </span>{" "}
              Type{" "}
              <span className="bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 font-medium px-1.5 py-0.5 rounded text-[11px] border border-indigo-200 dark:border-indigo-800">
                @OpenSpaces
              </span>
              , followed by your request, and Open Spaces will jump in to help with whatever you need.
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

      {/* Revisions History Side Panel */}
      {historyOpen && (
        <aside className="w-80 border-l border-zinc-200 dark:border-zinc-800 bg-[#fafafa] dark:bg-[#18181b] flex flex-col h-full shadow-lg z-30 animate-in slide-in-from-right duration-200 select-none">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LuHistory className="w-4 h-4 text-indigo-500" />
              <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Revision History</span>
            </div>
            {onCloseHistory && (
              <button
                type="button"
                onClick={onCloseHistory}
                className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                title="Close revision history"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {isLoadingRevisions ? (
              <div className="flex flex-col items-center justify-center p-8 text-zinc-400 gap-2">
                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs">Loading revisions...</span>
              </div>
            ) : revisions.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-400">
                No previous snapshots available yet.
              </div>
            ) : (
              revisions.map((rev) => {
                const isCurrent = rev.version === page?.version;
                return (
                  <div
                    key={rev.id}
                    className={`p-3 rounded-xl border transition-all ${
                      isCurrent
                        ? "bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800"
                        : "bg-white dark:bg-zinc-900/80 border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                          isCurrent
                            ? "bg-indigo-600 text-white"
                            : "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        v{rev.version} {isCurrent && "(Current)"}
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        {new Date(rev.created_at).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate mb-1">
                      {rev.title || "Untitled page"}
                    </div>

                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-2 flex items-center gap-1">
                      <span>By {rev.author || "You"}</span>
                      <span>•</span>
                      <span>{(rev.content || "").length} chars</span>
                    </div>

                    {!isCurrent && onRestoreRevision && (
                      <button
                        type="button"
                        onClick={async () => {
                          const restored = await onRestoreRevision(page.id, rev.version);
                          if (restored) {
                            setTitle(restored.title);
                            setContent(restored.content || "");
                            setIcon(restored.icon || "📄");
                            draftRef.current = {
                              id: restored.id,
                              title: restored.title,
                              icon: restored.icon || "📄",
                              content: restored.content || "",
                              isDirty: false,
                            };
                            if (onCloseHistory) onCloseHistory();
                          }
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-medium transition-colors cursor-pointer"
                      >
                        <LuRotateCcw className="w-3 h-3 text-indigo-500" />
                        <span>Restore this version</span>
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
