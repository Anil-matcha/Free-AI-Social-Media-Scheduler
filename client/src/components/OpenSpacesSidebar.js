"use client";

import React, { useState } from "react";
import {
  SearchIcon,
  PlusIcon,
  ChevronDownIcon,
  CloseIcon,
  TrashIcon,
  PinIcon,
  ChatIcon,
} from "./Icons";
import ThemeToggle from "./ThemeToggle";

export default function OpenSpacesSidebar({
  conversations = [],
  activeConversationId = null,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onTogglePinConversation,
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter conversations by search query if any
  const filtered = conversations.filter((c) =>
    (c.title || "").toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const pinnedConversations = filtered.filter((c) => c.pinned);
  const unpinnedConversations = filtered.filter((c) => !c.pinned);

  // Group unpinned conversations by timeframe
  const categorizeConversations = (items) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const sevenDaysAgo = today - 7 * 86400000;
    const thirtyDaysAgo = today - 30 * 86400000;

    const groups = {
      Today: [],
      Yesterday: [],
      "Previous 7 Days": [],
      "Previous 30 Days": [],
      Older: [],
    };

    items.forEach((c) => {
      const time = c.updatedAt || c.createdAt || Date.now();
      if (time >= today) {
        groups["Today"].push(c);
      } else if (time >= yesterday) {
        groups["Yesterday"].push(c);
      } else if (time >= sevenDaysAgo) {
        groups["Previous 7 Days"].push(c);
      } else if (time >= thirtyDaysAgo) {
        groups["Previous 30 Days"].push(c);
      } else {
        groups["Older"].push(c);
      }
    });

    return Object.entries(groups).filter(([_, list]) => list.length > 0);
  };

  const grouped = categorizeConversations(unpinnedConversations);

  const renderChatItem = (conv) => {
    const isActive = activeConversationId === conv.id;
    return (
      <div
        key={conv.id}
        onClick={() => onSelectConversation && onSelectConversation(conv.id)}
        className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left cursor-pointer transition-colors ${
          isActive
            ? "bg-zinc-200/90 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200"
        }`}
      >
        <span className="truncate text-xs flex-1 pr-2">
          {conv.title || "Untitled Chat"}
        </span>

        {/* Hover action icons: Pin & Delete */}
        <div
          className={`flex items-center gap-1 transition-opacity ${
            isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {onTogglePinConversation && (
            <button
              type="button"
              onClick={(e) => onTogglePinConversation(conv.id, e)}
              title={conv.pinned ? "Unpin chat" : "Pin chat"}
              className={`p-1 rounded hover:bg-zinc-300/60 dark:hover:bg-zinc-700 transition-colors ${
                conv.pinned
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              }`}
            >
              <PinIcon className="w-3 h-3" />
            </button>
          )}

          {onDeleteConversation && (
            <button
              type="button"
              onClick={(e) => onDeleteConversation(conv.id, e)}
              title="Delete chat"
              className="p-1 rounded text-zinc-400 hover:text-red-500 hover:bg-zinc-300/60 dark:hover:bg-zinc-700 transition-colors"
            >
              <TrashIcon className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <aside className="w-60 bg-[#f7f7f8] dark:bg-[#18181b] border-r border-zinc-200/80 dark:border-zinc-800/80 flex flex-col h-screen select-none text-zinc-700 dark:text-zinc-300 text-xs transition-colors duration-150">
      {/* Top Header: Open Spaces ˇ with Search toggle */}
      <div className="p-3 pb-2 flex items-center justify-between">
        <div
          onClick={onNewChat}
          className="flex items-center gap-1 cursor-pointer hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
            Open Spaces
          </span>
          <ChevronDownIcon className="w-3.5 h-3.5 text-zinc-400" />
        </div>

        <div className="flex items-center gap-1 text-zinc-400">
          <button
            onClick={() => {
              setSearchOpen(!searchOpen);
              if (searchOpen) setSearchQuery("");
            }}
            title="Search conversations"
            className={`p-1 rounded hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors ${
              searchOpen
                ? "text-zinc-900 dark:text-zinc-100 bg-zinc-200/60 dark:bg-zinc-800"
                : "hover:text-zinc-700 dark:hover:text-zinc-200"
            }`}
          >
            <SearchIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick search input */}
      {searchOpen && (
        <div className="px-3 pb-2 flex items-center gap-1.5">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search chat history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-500"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <CloseIcon className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* + New chat button */}
      <div className="px-3 py-1.5">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/80 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium transition-colors shadow-2xs"
        >
          <PlusIcon className="w-3.5 h-3.5 text-zinc-500" />
          <span>New chat</span>
        </button>
      </div>

      {/* Scrollable list of REAL conversation history */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        {/* Pinned section (only shown if there are pinned real conversations) */}
        {pinnedConversations.length > 0 && (
          <div>
            <div className="text-[11px] font-medium text-zinc-400 px-2.5 mb-1 flex items-center gap-1.5">
              <PinIcon className="w-3 h-3 text-zinc-400" />
              <span>Pinned</span>
            </div>
            <div className="space-y-0.5">
              {pinnedConversations.map(renderChatItem)}
            </div>
          </div>
        )}

        {/* Grouped Recent conversation history */}
        {grouped.length > 0 ? (
          grouped.map(([timeLabel, chatList]) => (
            <div key={timeLabel}>
              <div className="text-[11px] font-medium text-zinc-400 px-2.5 mb-1">
                {timeLabel}
              </div>
              <div className="space-y-0.5">
                {chatList.map(renderChatItem)}
              </div>
            </div>
          ))
        ) : pinnedConversations.length === 0 ? (
          /* Empty state when user has no conversation history */
          <div className="px-3 py-10 text-center select-none">
            <ChatIcon className="w-5 h-5 mx-auto mb-2 text-zinc-400/60 dark:text-zinc-600" />
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              No conversation history
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 leading-relaxed">
              Send a message to start a conversation. Your chat history will be saved here.
            </p>
          </div>
        ) : null}
      </div>

      {/* Footer with ThemeToggle */}
      <div className="p-3 border-t border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between">
        <span className="text-[11px] text-zinc-400 font-medium">Theme</span>
        <ThemeToggle />
      </div>
    </aside>
  );
}
