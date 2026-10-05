"use client";

import React, { useState } from "react";
import { SendIcon, SparklesIcon, CloseIcon, PageIcon, BotIcon } from "./Icons";
import MarkdownRenderer from "./MarkdownRenderer";

export default function ChatDrawer({
  isOpen,
  onClose,
  messages = [],
  onSendMessage,
  agents = [],
  activePageTitle,
}) {
  const [inputText, setInputText] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    onSendMessage({
      content: inputText.trim(),
      sender_type: "user",
      sender_name: "You",
    });
    setInputText("");
  };

  return (
    <div className="w-80 border-l border-zinc-200/80 dark:border-zinc-800/80 bg-[#fbfbfa] dark:bg-[#18181b] flex flex-col h-full select-none text-xs transition-colors duration-150">
      {/* Header */}
      <div className="p-3 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-medium text-zinc-900 dark:text-zinc-100">
          <SparklesIcon className="w-4 h-4 text-indigo-500" />
          <span>Discussion & Dots</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-zinc-200/60 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
        >
          <CloseIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Context Banner */}
      {activePageTitle && (
        <div className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900/60 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center gap-1.5 text-[11px] text-zinc-500">
          <PageIcon className="w-3 h-3 text-zinc-400 shrink-0" />
          <span className="truncate">Discussing: {activePageTitle}</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-10 text-zinc-400 dark:text-zinc-500 text-xs">
            <SparklesIcon className="w-6 h-6 mx-auto mb-2 text-indigo-400 opacity-60" />
            <p>No messages yet.</p>
            <p className="text-[11px] mt-1 text-zinc-400">Ask ChatGPT or tag a Dot to iterate on this page.</p>
          </div>
        ) : (
          messages.map((m) => {
            const isUser = m.sender_type === "user";
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
              >
                <span className="text-[10px] text-zinc-400 mb-0.5 px-1">{m.sender_name}</span>
                <div
                  className={`max-w-[90%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    isUser
                      ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium"
                      : "bg-white dark:bg-zinc-800/90 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700/80 shadow-2xs"
                  }`}
                >
                  {isUser ? m.content : <MarkdownRenderer content={m.content} />}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-zinc-200/80 dark:border-zinc-800/80">
        <div className="relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message or prompt..."
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg pl-3 pr-8 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="absolute right-1.5 top-1.5 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-30"
          >
            <SendIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
