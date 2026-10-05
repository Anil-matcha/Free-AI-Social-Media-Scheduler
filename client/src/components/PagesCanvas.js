"use client";

import React, { useState, useEffect } from "react";
import { PlusIcon, TrashIcon, PageIcon, SparklesIcon, CheckIcon } from "./Icons";
import CustomDropdown from "./CustomDropdown";

const STATUS_OPTIONS = [
  { label: "Draft", value: "draft" },
  { label: "In Review", value: "in_review" },
  { label: "Published", value: "published" },
];

export default function PagesCanvas({
  pages = [],
  activePageId,
  onSelectPage,
  onCreatePage,
  onUpdatePage,
  onDeletePage,
  onTriggerAgentOnPage,
  agents = [],
}) {
  const activePage = pages.find((p) => p.id === activePageId) || pages[0];

  const [title, setTitle] = useState(activePage?.title || "");
  const [content, setContent] = useState(activePage?.content || "");
  const [status, setStatus] = useState(activePage?.status || "draft");
  const [viewMode, setViewMode] = useState("split"); // "edit", "preview", "split"
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync state when active page changes
  useEffect(() => {
    if (activePage) {
      setTitle(activePage.title);
      setContent(activePage.content);
      setStatus(activePage.status);
    }
  }, [activePage?.id]);

  const handleSave = async () => {
    if (!activePage) return;
    setIsSaving(true);
    await onUpdatePage(activePage.id, {
      title,
      content,
      status,
    });
    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleCreateNew = () => {
    onCreatePage({
      title: "Untitled Living Page",
      content: "# New Page\n\nCollaborate with your team and autonomous Dot agents in this living document.",
      status: "draft",
      icon: "📄",
    });
  };

  // Convert basic markdown to simple HTML safely for preview
  const renderSimpleMarkdown = (mdText) => {
    if (!mdText) return "<p class='text-zinc-400 dark:text-zinc-500 italic'>No content yet...</p>";
    let html = mdText
      .replace(/^### (.*$)/gim, "<h3>$1</h3>")
      .replace(/^## (.*$)/gim, "<h2>$1</h2>")
      .replace(/^# (.*$)/gim, "<h1>$1</h1>")
      .replace(/^\> (.*$)/gim, "<blockquote>$1</blockquote>")
      .replace(/\*\*(.*)\*\*/gim, "<strong>$1</strong>")
      .replace(/\*(.*)\*/gim, "<em>$1</em>")
      .replace(/`([^`]+)`/gim, "<code>$1</code>")
      .replace(/\n\n/gim, "</p><p>")
      .replace(/\n/gim, "<br/>");
    return `<p>${html}</p>`;
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-zinc-50 dark:bg-[#141416] transition-colors duration-200">
      {/* Pages Left Column / Sub-navigation */}
      <div className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-[#f7f7f8] dark:bg-[#17171a] flex flex-col select-none">
        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-300">
            <PageIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Living Pages</span>
          </div>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-1 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 px-2 py-1 rounded text-xs transition-colors border border-zinc-200 dark:border-transparent shadow-2xs"
            title="Create page"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {pages.length === 0 ? (
            <div className="text-center py-8 text-xs text-zinc-400 dark:text-zinc-500">
              No pages in this space yet.
            </div>
          ) : (
            pages.map((p) => {
              const isSelected = activePage?.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => onSelectPage(p.id)}
                  className={`group p-2.5 rounded-lg text-xs cursor-pointer transition-all flex items-start justify-between ${
                    isSelected
                      ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs border border-zinc-200 dark:border-zinc-700"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-850 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="text-sm mt-0.5">{p.icon || "📄"}</span>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{p.title || "Untitled"}</div>
                      <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 flex items-center gap-1.5">
                        <span className="uppercase text-[9px] px-1 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                          v{p.version || 1}
                        </span>
                        <span className="capitalize">{p.status}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete page "${p.title}"?`)) onDeletePage(p.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 text-zinc-400 dark:text-zinc-500 rounded transition-opacity"
                    title="Delete page"
                  >
                    <TrashIcon className="w-3 h-3" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Editor & Canvas Area */}
      {activePage ? (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Editor Action Toolbar */}
          <div className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-2.5 bg-white dark:bg-[#19191d] flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Page Title"
                className="bg-transparent font-semibold text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-b focus:border-indigo-500 py-0.5 w-72"
              />

              <CustomDropdown
                value={status}
                onChange={setStatus}
                options={STATUS_OPTIONS}
                size="sm"
                buttonClassName="bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md text-xs text-zinc-700 dark:text-zinc-300 px-2 py-1"
              />

              <span className="text-[11px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700/50">
                v{activePage.version || 1}
              </span>
            </div>

            {/* AI Dot Actions & View Mode */}
            <div className="flex items-center gap-2">
              {/* Dot AI Quick Actions */}
              <div className="relative group">
                <button
                  className="flex items-center gap-1.5 bg-indigo-50 dark:bg-gradient-to-r dark:from-indigo-600/30 dark:to-violet-600/30 hover:bg-indigo-100 dark:hover:from-indigo-600/40 dark:hover:to-violet-600/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/40 px-3 py-1 rounded-lg text-xs font-medium transition-all shadow-2xs"
                >
                  <SparklesIcon className="w-3.5 h-3.5" />
                  <span>Ask Dot to Edit</span>
                </button>

                <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl p-1.5 hidden group-hover:block z-20">
                  <div className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 px-2 py-1">Autonomous Actions</div>
                  <button
                    onClick={() => onTriggerAgentOnPage(activePage.id, "Expand and add a structured competitive matrix")}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                  >
                    ⚡ Expand with Market Matrix
                  </button>
                  <button
                    onClick={() => onTriggerAgentOnPage(activePage.id, "Synthesize into executive summary with action items")}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                  >
                    ✍️ Polish Tone & Executive Pitch
                  </button>
                  <button
                    onClick={() => onTriggerAgentOnPage(activePage.id, "Review for architectural risks and security gaps")}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                  >
                    📐 Systems & Security Audit
                  </button>
                </div>
              </div>

              {/* View Mode Buttons */}
              <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/80 rounded-lg p-0.5 border border-zinc-200 dark:border-zinc-700 text-xs">
                <button
                  onClick={() => setViewMode("edit")}
                  className={`px-2 py-0.5 rounded transition-colors ${viewMode === "edit" ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-2xs font-medium" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"}`}
                >
                  Edit
                </button>
                <button
                  onClick={() => setViewMode("split")}
                  className={`px-2 py-0.5 rounded transition-colors ${viewMode === "split" ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-2xs font-medium" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"}`}
                >
                  Split
                </button>
                <button
                  onClick={() => setViewMode("preview")}
                  className={`px-2 py-0.5 rounded transition-colors ${viewMode === "preview" ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-2xs font-medium" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"}`}
                >
                  Preview
                </button>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors shadow-2xs"
              >
                {savedSuccess ? <CheckIcon className="w-3.5 h-3.5 text-emerald-300" /> : null}
                <span>{savedSuccess ? "Saved to Supabase" : isSaving ? "Saving..." : "Save Page"}</span>
              </button>
            </div>
          </div>

          {/* Canvas Main Body */}
          <div className="flex-1 flex overflow-hidden">
            {/* Markdown Text Area */}
            {(viewMode === "edit" || viewMode === "split") && (
              <div className={`h-full flex flex-col ${viewMode === "split" ? "w-1/2 border-r border-zinc-200 dark:border-zinc-800" : "w-full"}`}>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Start writing markdown content..."
                  className="flex-1 w-full bg-white dark:bg-[#151518] text-zinc-900 dark:text-zinc-200 p-6 text-xs leading-relaxed resize-none focus:outline-none"
                />
              </div>
            )}

            {/* Markdown Rendered Live Preview */}
            {(viewMode === "preview" || viewMode === "split") && (
              <div className={`h-full overflow-y-auto p-8 bg-[#fafafa] dark:bg-[#18181c] ${viewMode === "split" ? "w-1/2" : "w-full"}`}>
                <div
                  className="markdown-body max-w-2xl mx-auto"
                  dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(content) }}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-zinc-400 dark:text-zinc-500 text-sm">
          Select or create a living page to collaborate.
        </div>
      )}
    </div>
  );
}
