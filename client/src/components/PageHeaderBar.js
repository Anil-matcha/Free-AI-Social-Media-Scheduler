"use client";

import React from "react";
import {
  PageIcon,
  CloseIcon,
  PlusIcon,
  ChatIcon,
  ShareIcon,
  SparklesIcon,
  ArrowLeftIcon,
  DownloadIcon,
  TrashIcon,
  ClockIcon,
  MoreIcon,
} from "./Icons";
import CustomDropdown from "./CustomDropdown";

export default function PageHeaderBar({
  title = "Untitled page",
  icon = "📄",
  openPages = [], // [{ id, title, icon }]
  activePageId,
  onSelectPage,
  onClosePage,
  isCreatingPage = false,
  spaceName = "Space",
  onBackToLibrary,
  onNewPage,
  onToggleChat,
  chatOpen,
  onToggleHistory,
  historyOpen = false,
  onTriggerAI,
  onDownloadMarkdown,
  onDeletePage,
  onSaveNow,
  saveStatus = "Saved", // 'Saved' | 'Saving...' | 'Unsaved changes' | 'Conflict' | 'Failed'
}) {
  // Render open tabs or active page
  const tabs =
    openPages && openPages.length > 0
      ? openPages
      : (activePageId ? [{ id: activePageId, title, icon }] : []);

  return (
    <header className="h-11 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#141416] flex items-center justify-between px-3 select-none text-xs text-zinc-600 dark:text-zinc-400 transition-colors duration-150">
      {/* Left: Back to Space Library + Multi-Tabs Bar */}
      <div className="flex items-center gap-2 h-full overflow-hidden max-w-[70%]">
        {onBackToLibrary && (
          <button
            onClick={onBackToLibrary}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors text-xs font-medium cursor-pointer shrink-0"
            title={`Back to ${spaceName} Library`}
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{spaceName}</span>
          </button>
        )}

        <div className="flex items-center gap-1 h-full pt-1.5 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = tab.id === activePageId;
            return (
              <div
                key={tab.id}
                onClick={() => onSelectPage && onSelectPage(tab.id)}
                className={`group flex items-center gap-2 px-3 py-1 rounded-t-lg border-t border-x text-xs font-medium max-w-[190px] cursor-pointer transition-all shrink-0 ${
                  isActive
                    ? "bg-zinc-100 dark:bg-zinc-800/90 text-zinc-900 dark:text-zinc-100 border-zinc-200/90 dark:border-zinc-700/80 shadow-2xs"
                    : "bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 border-transparent hover:border-zinc-200/60 dark:hover:border-zinc-700/40"
                }`}
                title={tab.title || "Untitled page"}
              >
                <span className="text-xs shrink-0">{tab.icon || "📄"}</span>
                <span className="truncate">{tab.title || "Untitled page"}</span>
                {onClosePage && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClosePage(tab.id);
                    }}
                    className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 ml-0.5 p-0.5 rounded-sm hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 cursor-pointer transition-colors opacity-70 group-hover:opacity-100"
                    title="Close tab"
                  >
                    <CloseIcon className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Create New Page (+) Button */}
          <button
            type="button"
            onClick={onNewPage}
            title="Create new page"
            className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer shrink-0"
          >
            <PlusIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Right Actions (modeled on OpenDots PageDocument header) */}
      <div className="flex items-center gap-2">
        {/* Autosave / Save Now button */}
        <button
          type="button"
          onClick={saveStatus === "Unsaved changes" || saveStatus === "Failed" || saveStatus === "Conflict" ? onSaveNow : undefined}
          title={
            saveStatus === "Conflict"
              ? "Edit conflict detected. Click to review options"
              : saveStatus === "Unsaved changes"
              ? "Unsaved changes. Click to save now or press ⌘/Ctrl+S"
              : saveStatus === "Failed"
              ? "Save failed. Click to retry"
              : "Saved to cloud"
          }
          className={`text-[11px] font-medium hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border transition-all ${
            saveStatus === "Conflict"
              ? "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700/80 text-rose-700 dark:text-rose-300 cursor-pointer hover:bg-rose-100"
              : saveStatus === "Unsaved changes"
              ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/80 text-amber-700 dark:text-amber-300 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/40"
              : saveStatus === "Saving..."
              ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 cursor-default"
              : saveStatus === "Failed"
              ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 cursor-pointer hover:bg-red-100"
              : "bg-zinc-100 dark:bg-zinc-800/60 border-zinc-200/60 dark:border-zinc-700/60 text-zinc-500 dark:text-zinc-400 cursor-default"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              saveStatus === "Saving..."
                ? "bg-amber-400 animate-ping"
                : saveStatus === "Unsaved changes"
                ? "bg-amber-500"
                : saveStatus === "Conflict"
                ? "bg-rose-500 animate-pulse"
                : saveStatus === "Failed"
                ? "bg-red-500"
                : "bg-emerald-500"
            }`}
          />
          <span>{saveStatus}</span>
        </button>

        {/* Revisions History button */}
        {onToggleHistory && (
          <button
            onClick={onToggleHistory}
            title="Page Revision History & Snapshots"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-xs font-medium ${
              historyOpen
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-2xs"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            <ClockIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">History</span>
          </button>
        )}

        {/* Page Actions CustomDropdown */}
        <CustomDropdown
          value=""
          onChange={(action) => {
            if (action === "history" && onToggleHistory) onToggleHistory();
            if (action === "download" && onDownloadMarkdown) onDownloadMarkdown();
            if (action === "delete" && onDeletePage) onDeletePage();
          }}
          options={[
            ...(onToggleHistory
              ? [{ label: "Revision History", value: "history", icon: <ClockIcon className="w-3.5 h-3.5 text-zinc-500" /> }]
              : []),
            ...(onDownloadMarkdown
              ? [{ label: "Download Markdown (.md)", value: "download", icon: <DownloadIcon className="w-3.5 h-3.5 text-zinc-500" /> }]
              : []),
            ...(onDeletePage
              ? [{ label: "Delete Page", value: "delete", icon: <TrashIcon className="w-3.5 h-3.5 text-rose-500" /> }]
              : []),
          ]}
          align="right"
          size="xs"
          renderTrigger={(_, open) => (
            <button
              type="button"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                open
                  ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
              title="Page Options & Actions"
            >
              <MoreIcon className="w-4 h-4" />
            </button>
          )}
        />

        {/* Discussion / Chat drawer toggle */}
        <button
          onClick={onToggleChat}
          title="Discuss with Open Spaces / Dot Agents"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-xs font-medium ${
            chatOpen
              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-2xs"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
          }`}
        >
          <ChatIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Discussion</span>
        </button>

        {/* Ask AI button */}
        <button
          onClick={onTriggerAI}
          title="Ask Open Spaces to iterate on this page"
          className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer"
        >
          <SparklesIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
