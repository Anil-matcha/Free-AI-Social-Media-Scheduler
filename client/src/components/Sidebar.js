"use client";

import React, { useState } from "react";
import { FolderIcon, PlusIcon, SearchIcon, PinIcon, DatabaseIcon, SparklesIcon } from "./Icons";
import ThemeToggle from "./ThemeToggle";
import CustomDropdown from "./CustomDropdown";

const ICON_OPTIONS = [
  { label: "🚀 Launch", value: "🚀" },
  { label: "🧠 Research", value: "🧠" },
  { label: "💡 Ideation", value: "💡" },
  { label: "⚡ Performance", value: "⚡" },
  { label: "🎨 Design", value: "🎨" },
  { label: "📊 Analytics", value: "📊" },
];

const COLOR_OPTIONS = [
  { label: "Indigo", value: "indigo" },
  { label: "Emerald", value: "emerald" },
  { label: "Amber", value: "amber" },
  { label: "Rose", value: "rose" },
  { label: "Sky", value: "sky" },
];

export default function Sidebar({
  spaces = [],
  activeSpaceId,
  onSelectSpace,
  onCreateSpace,
  backendOnline,
}) {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [newSpaceDesc, setNewSpaceDesc] = useState("");
  const [newSpaceColor, setNewSpaceColor] = useState("indigo");
  const [newSpaceIcon, setNewSpaceIcon] = useState("🚀");

  const filteredSpaces = spaces.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.description && s.description.toLowerCase().includes(search.toLowerCase()))
  );

  const pinnedSpaces = filteredSpaces.filter((s) => s.pinned);
  const otherSpaces = filteredSpaces.filter((s) => !s.pinned);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newSpaceName.trim()) return;
    onCreateSpace({
      name: newSpaceName.trim(),
      description: newSpaceDesc.trim(),
      color: newSpaceColor,
      icon: newSpaceIcon || "📁",
      pinned: false,
    });
    setNewSpaceName("");
    setNewSpaceDesc("");
    setShowModal(false);
  };

  return (
    <aside className="w-72 bg-[#f7f7f8] dark:bg-[#18181b] border-r border-zinc-200 dark:border-zinc-800 flex flex-col h-screen select-none transition-colors duration-200">
      {/* Brand Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md">
            <SparklesIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <span>OpenSpaces</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700">
                OSS
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Open Spaces Studio</p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="p-1.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
          title="Create New Space"
        >
          <PlusIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Supabase & Backend Status */}
      <div className="px-4 py-2 bg-zinc-100/70 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
          <DatabaseIcon className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
          <span className="text-[11px] font-medium">Supabase DB</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${backendOnline ? "bg-emerald-500 dark:bg-emerald-400 animate-pulse" : "bg-amber-500"}`} />
          <span className="text-[10px] text-zinc-600 dark:text-zinc-400">{backendOnline ? "Port 8000 Live" : "Connecting..."}</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-3">
        <div className="relative">
          <SearchIcon className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search spaces..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900/80 border border-zinc-300 dark:border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors shadow-2xs"
          />
        </div>
      </div>

      {/* Spaces List */}
      <div className="flex-1 overflow-y-auto px-3 space-y-4">
        {/* Pinned Spaces */}
        {pinnedSpaces.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider px-2 mb-1 flex items-center gap-1">
              <PinIcon className="w-3 h-3 text-amber-500" />
              <span>Pinned Spaces</span>
            </div>
            <div className="space-y-1">
              {pinnedSpaces.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onSelectSpace(s.id)}
                  className={`w-full text-left p-2 rounded-lg text-xs transition-all flex items-center gap-2.5 ${
                    activeSpaceId === s.id
                      ? "bg-indigo-100/70 dark:bg-indigo-600/20 text-indigo-900 dark:text-indigo-200 border border-indigo-300/80 dark:border-indigo-500/30 shadow-2xs"
                      : "hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <span className="text-base">{s.icon || "📁"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{s.name}</div>
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-500 flex items-center gap-2">
                      <span>{s.pages_count || 0} pages</span>
                      <span>•</span>
                      <span>{s.agents?.length || 0} dots</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* All Spaces */}
        <div>
          <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-2 mb-1">
            All Spaces ({filteredSpaces.length})
          </div>
          <div className="space-y-1">
            {otherSpaces.map((s) => (
              <button
                key={s.id}
                onClick={() => onSelectSpace(s.id)}
                className={`w-full text-left p-2 rounded-lg text-xs transition-all flex items-center gap-2.5 ${
                  activeSpaceId === s.id
                    ? "bg-indigo-100/70 dark:bg-indigo-600/20 text-indigo-900 dark:text-indigo-200 border border-indigo-300/80 dark:border-indigo-500/30 shadow-2xs"
                    : "hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                <span className="text-base">{s.icon || "📁"}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{s.name}</div>
                  <div className="text-[10px] text-zinc-500 flex items-center gap-2">
                    <span>{s.pages_count || 0} pages</span>
                    <span>•</span>
                    <span>{s.agents?.length || 0} dots</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* User Footer with Theme Toggle */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs bg-white/40 dark:bg-transparent">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-zinc-300 to-zinc-400 dark:from-zinc-700 dark:to-zinc-600 flex items-center justify-center font-medium text-zinc-800 dark:text-zinc-200 text-xs shadow-2xs">
            OP
          </div>
          <div>
            <div className="font-medium text-zinc-800 dark:text-zinc-200 leading-tight">OpenSpaces Team</div>
            <div className="text-[10px] text-zinc-500">Pro / Self-Hosted</div>
          </div>
        </div>

        {/* Theme Toggle Component */}
        <ThemeToggle />
      </div>

      {/* New Space Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e1e24] border border-zinc-200 dark:border-zinc-700 rounded-xl w-full max-w-md p-5 shadow-2xl transition-colors">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Create New Space</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              A shared workspace for pages, persistent chat context, and autonomous Dot agents.
            </p>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Space Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026 Strategy & Roadmap"
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of what this space is about..."
                  value={newSpaceDesc}
                  onChange={(e) => setNewSpaceDesc(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Icon</label>
                  <CustomDropdown
                    value={newSpaceIcon}
                    onChange={setNewSpaceIcon}
                    options={ICON_OPTIONS}
                    className="w-full"
                    buttonClassName="w-full justify-between"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Theme Color</label>
                  <CustomDropdown
                    value={newSpaceColor}
                    onChange={setNewSpaceColor}
                    options={COLOR_OPTIONS}
                    className="w-full"
                    buttonClassName="w-full justify-between"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
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
