"use client";

import React, { useState } from "react";
import {
  SearchIcon,
  NewPageIcon,
  PageIcon,
  FolderIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PlusIcon,
  CloseIcon,
  TrashIcon,
} from "./Icons";
import ThemeToggle from "./ThemeToggle";

export default function SpaceSidebar({
  spaces = [],
  activeSpaceId,
  onSelectSpace,
  onCreateSpace,
  onDeleteSpace,
  pages = [],
  activePageId,
  onSelectPage,
  onCreatePage,
  isCreatingPage = false,
}) {
  const [showNewSpaceModal, setShowNewSpaceModal] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [newSpaceDesc, setNewSpaceDesc] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSpaces, setExpandedSpaces] = useState({
    [activeSpaceId]: true,
  });

  const toggleSpaceExpand = (spaceId, e) => {
    if (e) e.stopPropagation();
    setExpandedSpaces((prev) => ({
      ...prev,
      [spaceId]: !prev[spaceId],
    }));
  };

  const handleCreateSpaceSubmit = (e) => {
    e.preventDefault();
    if (!newSpaceName.trim()) return;
    onCreateSpace({
      name: newSpaceName.trim(),
      description: newSpaceDesc.trim(),
      icon: "📁",
      color: "indigo",
    });
    setNewSpaceName("");
    setNewSpaceDesc("");
    setShowNewSpaceModal(false);
  };

  return (
    <aside className="w-60 bg-[#f7f7f8] dark:bg-[#18181b] border-r border-zinc-200/80 dark:border-zinc-800/80 flex flex-col h-screen select-none text-zinc-700 dark:text-zinc-300 text-xs transition-colors duration-150">
      {/* Top Header: SPACES with Create Space (+) button */}
      <div className="p-3 pb-2 flex items-center justify-between border-b border-zinc-200/60 dark:border-zinc-800/60">
        <div className="flex items-center gap-1.5 font-semibold text-sm text-zinc-900 dark:text-zinc-100">
          <FolderIcon className="w-4 h-4 text-indigo-500" />
          <span>Spaces</span>
        </div>

        <button
          onClick={() => setShowNewSpaceModal(true)}
          className="p-1 rounded-lg hover:bg-zinc-200/70 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
          title="Create new Space"
        >
          <PlusIcon className="w-4 h-4" />
        </button>
      </div>

      {/* New Page Button for Active Space */}
      <div className="px-3 pt-3 pb-1">
        <button
          onClick={!isCreatingPage ? () => onCreatePage({ title: "Untitled page", content: "" }) : undefined}
          disabled={isCreatingPage}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/80 text-zinc-800 dark:text-zinc-200 font-medium transition-colors shadow-2xs ${
            isCreatingPage
              ? "cursor-wait opacity-60"
              : "hover:bg-zinc-50 dark:hover:bg-zinc-700 cursor-pointer"
          }`}
        >
          {isCreatingPage ? (
            <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <NewPageIcon className="w-3.5 h-3.5 text-indigo-500" />
          )}
          <span>{isCreatingPage ? "Creating page..." : "New page"}</span>
        </button>
      </div>

      {/* Filter / Search input */}
      <div className="px-3 py-1.5">
        <div className="relative">
          <SearchIcon className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2" />
          <input
            type="text"
            placeholder="Filter spaces & pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg pl-8 pr-2 py-1 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-400"
          />
        </div>
      </div>

      {/* Spaces & Hierarchical Pages Tree (Modeled on OpenDots SpaceNav.tsx) */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2 mb-1 flex items-center justify-between">
          <span>SPACES LIBRARY</span>
          <span className="text-[10px] text-zinc-400 font-normal">
            {spaces.length} spaces
          </span>
        </div>

        {spaces.map((space) => {
          const isSpaceActive = activeSpaceId === space.id;
          const isExpanded = expandedSpaces[space.id] ?? isSpaceActive;
          const spacePages = pages.filter((p) => p.space_id === space.id || isSpaceActive);

          const matchingPages = spacePages.filter((p) =>
            (p.title || "").toLowerCase().includes(searchQuery.toLowerCase().trim())
          );

          return (
            <div key={space.id} className="space-y-0.5">
              {/* Space Row */}
              <div
                className={`group flex items-center justify-between px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  isSpaceActive && !activePageId
                    ? "bg-zinc-200/90 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold"
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
                }`}
                onClick={() => {
                  onSelectSpace(space.id);
                  onSelectPage(null); // Open Space Library overview
                }}
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  {/* Expand / Collapse chevron */}
                  <button
                    type="button"
                    onClick={(e) => toggleSpaceExpand(space.id, e)}
                    className="p-0.5 rounded hover:bg-zinc-300/50 dark:hover:bg-zinc-700 text-zinc-400"
                  >
                    {isExpanded ? (
                      <ChevronDownIcon className="w-3 h-3" />
                    ) : (
                      <ChevronRightIcon className="w-3 h-3" />
                    )}
                  </button>

                  <span className="text-sm shrink-0">{space.icon || "📁"}</span>
                  <span className="truncate text-xs font-medium">
                    {space.name}
                  </span>
                </div>

                {onDeleteSpace && spaces.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSpace(space.id);
                    }}
                    title="Delete space"
                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-500 rounded transition-opacity"
                  >
                    <TrashIcon className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Nested Pages for this Space (OpenDots branches view) */}
              {isExpanded && (
                <div className="pl-6 pr-1 space-y-0.5 border-l border-zinc-200 dark:border-zinc-800 ml-3">
                  {isSpaceActive && matchingPages.length > 0 ? (
                    matchingPages.map((page) => {
                      const isPageSelected = activePageId === page.id;
                      return (
                        <button
                          key={page.id}
                          onClick={() => {
                            onSelectSpace(space.id);
                            onSelectPage(page.id);
                          }}
                          className={`w-full flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-left transition-colors truncate cursor-pointer ${
                            isPageSelected
                              ? "bg-zinc-200/90 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium"
                              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/40 dark:hover:bg-zinc-800/40 hover:text-zinc-900 dark:hover:text-zinc-200"
                          }`}
                        >
                          <span className="text-xs shrink-0">
                            {page.icon || "📄"}
                          </span>
                          <span className="truncate">
                            {page.title || "Untitled"}
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="text-[11px] text-zinc-400 px-2 py-1 italic">
                      No pages yet
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer with ThemeToggle */}
      <div className="p-3 border-t border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between">
        <span className="text-[11px] text-zinc-400 font-medium">Theme</span>
        <ThemeToggle />
      </div>

      {/* Modal for Creating a New Space */}
      {showNewSpaceModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e1e24] border border-zinc-200 dark:border-zinc-700 rounded-2xl w-full max-w-sm p-5 shadow-xl select-text">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Create New Space
              </h3>
              <button
                onClick={() => setShowNewSpaceModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateSpaceSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                  Space Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marketing, Product Specs..."
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional description of this workspace..."
                  value={newSpaceDesc}
                  onChange={(e) => setNewSpaceDesc(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowNewSpaceModal(false)}
                  className="px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                >
                  Create Space
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
