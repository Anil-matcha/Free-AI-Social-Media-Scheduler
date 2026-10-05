"use client";

import React, { useState, useMemo } from "react";
import {
  PageIcon,
  PlusIcon,
  SearchIcon,
  GridIcon,
  ListIcon,
  ArrowUpRightIcon,
  TrashIcon,
} from "./Icons";
import CustomDropdown from "./CustomDropdown";

const SORT_OPTIONS = [
  { label: "Recently edited", value: "recent" },
  { label: "Name A–Z", value: "name" },
];

// Helper to extract clean plaintext preview from Markdown content (modeled on OpenDots)
export function pageExcerpt(content = "") {
  if (!content) return "";
  return content
    .replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/^\s*(?:[-+*]|\d+[.)])\s+(?:\[[ xX]\]\s+)?/gm, "")
    .replace(/```[\s\S]*?```/g, "Code block")
    .replace(/!?\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`|~]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);
}

export default function SpaceLibrary({
  space,
  pages = [],
  onSelectPage,
  onNewPage,
  onDeletePage,
  isCreatingPage = false,
}) {
  const [query, setQuery] = useState("");
  const [layout, setLayout] = useState("grid"); // 'grid' | 'list'
  const [sort, setSort] = useState("recent"); // 'recent' | 'name'

  const filtered = useMemo(() => {
    return pages
      .filter((page) =>
        `${page.title} ${page.content || ""}`
          .toLowerCase()
          .includes(query.toLowerCase().trim())
      )
      .sort((a, b) => {
        if (sort === "name") {
          return (a.title || "").localeCompare(b.title || "");
        }
        const timeA = new Date(a.updated_at || a.created_at || 0).getTime();
        const timeB = new Date(b.updated_at || b.created_at || 0).getTime();
        return timeB - timeA || (a.title || "").localeCompare(b.title || "");
      });
  }, [pages, query, sort]);

  const formatDate = (dateString) => {
    if (!dateString) return "Recently";
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fbfbfa] dark:bg-[#141416] text-zinc-900 dark:text-zinc-100 overflow-y-auto select-none transition-colors duration-150">
      <div className="max-w-5xl mx-auto w-full p-6 sm:p-8 space-y-6">
        {/* Header (modeled on OpenDots library-heading) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1 flex items-center gap-1.5">
              <span>{space?.icon || "📁"}</span>
              <span>SPACE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {space?.name || "Space Library"}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl leading-relaxed">
              {space?.description ||
                "A persistent home for living pages, autonomous agent research, and collaborative documents."}
            </p>
          </div>

          <button
            onClick={!isCreatingPage ? onNewPage : undefined}
            disabled={isCreatingPage}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium text-xs shadow-sm transition-all shrink-0 ${
              isCreatingPage
                ? "bg-zinc-800 text-zinc-400 dark:bg-zinc-200 dark:text-zinc-500 cursor-wait opacity-70"
                : "bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 hover:scale-[1.02] cursor-pointer"
            }`}
          >
            {isCreatingPage ? (
              <div className="w-3.5 h-3.5 border-2 border-white dark:border-zinc-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <PlusIcon className="w-4 h-4" />
            )}
            <span>{isCreatingPage ? "Creating..." : "New page"}</span>
          </button>
        </div>

        {/* Toolbar: Search, Sort, View Toggle (modeled on OpenDots library-tools) */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <SearchIcon className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search pages in this space..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-white dark:bg-[#1a1a20] border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors shadow-2xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Sort selector */}
            <CustomDropdown
              value={sort}
              onChange={setSort}
              options={SORT_OPTIONS}
              size="sm"
              buttonClassName="bg-white dark:bg-[#1a1a20] border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 py-1.5 px-3 rounded-xl shadow-2xs text-xs"
              align="right"
            />

            {/* Grid / List view toggle */}
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-xl border border-zinc-200 dark:border-zinc-700/80">
              <button
                type="button"
                onClick={() => setLayout("grid")}
                title="Grid view"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  layout === "grid"
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-2xs"
                    : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                }`}
              >
                <GridIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setLayout("list")}
                title="List view"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  layout === "list"
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-2xs"
                    : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                }`}
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Section label & count */}
        <div className="flex items-center justify-between text-xs text-zinc-400 font-medium px-1">
          <span>{query ? "Search results" : "All documents"}</span>
          <span>
            {filtered.length} {filtered.length === 1 ? "page" : "pages"}
          </span>
        </div>

        {/* Pages Grid or List */}
        {filtered.length > 0 ? (
          layout === "grid" ? (
            /* Grid View Cards */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((page) => (
                <div
                  key={page.id}
                  onClick={() => onSelectPage(page.id)}
                  className="group relative flex flex-col justify-between p-4 rounded-2xl bg-white dark:bg-[#1a1a20] border border-zinc-200/90 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all hover:shadow-md cursor-pointer select-none text-left"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center text-sm font-semibold">
                        {page.icon || "📄"}
                      </span>
                      <ArrowUpRightIcon className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors opacity-0 group-hover:opacity-100" />
                    </div>

                    <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 tracking-tight line-clamp-1">
                      {page.title || "Untitled page"}
                    </h3>

                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                      {pageExcerpt(page.content) ||
                        "An empty page, ready to write and edit."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px] text-zinc-400">
                    <span>Edited {formatDate(page.updated_at)}</span>

                    {onDeletePage && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePage(page.id);
                        }}
                        title="Delete page"
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-red-500 transition-opacity"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View Rows */
            <div className="bg-white dark:bg-[#1a1a20] border border-zinc-200/90 dark:border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.map((page) => (
                <div
                  key={page.id}
                  onClick={() => onSelectPage(page.id)}
                  className="group flex items-center justify-between p-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
                    <span className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-sm shrink-0">
                      {page.icon || "📄"}
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {page.title || "Untitled page"}
                      </div>
                      <div className="text-zinc-400 truncate text-[11px]">
                        {pageExcerpt(page.content) || "No additional text"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-zinc-400 text-[11px]">
                    <span>Edited {formatDate(page.updated_at)}</span>
                    <ArrowUpRightIcon className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {onDeletePage && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePage(page.id);
                        }}
                        title="Delete page"
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 hover:text-red-500 transition-opacity"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Empty State (modeled on OpenDots library-empty) */
          <div className="p-12 text-center border border-dashed border-zinc-300 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-[#18181c]/50">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-400">
              <PageIcon className="w-6 h-6" />
            </div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {query ? "No matching pages found" : "No pages in this Space yet"}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed">
              {query
                ? "Try searching for a different title or keyword."
                : "Create your first page to start writing, organizing research, and collaborating with Dot agents."}
            </p>
            {!query && (
              <button
                onClick={onNewPage}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-medium shadow-xs hover:opacity-90 transition-opacity"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                <span>Create page</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
