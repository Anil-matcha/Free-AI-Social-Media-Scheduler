"use client";

import React, { useState } from "react";
import { SendIcon, SparklesIcon, BotIcon, PageIcon } from "./Icons";

export default function SpaceChat({
  messages = [],
  onSendMessage,
  agents = [],
  pages = [],
  onNavigateToPage,
}) {
  const [inputText, setInputText] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    let finalContent = inputText.trim();
    if (selectedAgent) {
      finalContent = `@${selectedAgent}: ${finalContent}`;
    }

    onSendMessage({
      content: finalContent,
      sender_type: "user",
      sender_name: "You",
    });

    setInputText("");
    setSelectedAgent("");
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50 dark:bg-[#151518] transition-colors duration-200">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-4xl mx-auto w-full">
        {messages.length === 0 ? (
          <div className="text-center py-16 text-zinc-400 dark:text-zinc-500 text-sm">
            <SparklesIcon className="w-8 h-8 mx-auto mb-2 text-indigo-500 dark:text-indigo-400 opacity-60" />
            <p className="font-medium text-zinc-700 dark:text-zinc-400">Welcome to your Space Chat</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1 max-w-md mx-auto">
              Discuss ideas, ask questions, or @mention your autonomous Dot agents to generate and iterate on living documents.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isAgent = msg.sender_type === "agent";
            const isUser = msg.sender_type === "user";

            return (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs ${isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-semibold ${
                    isAgent
                      ? "bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-2xs"
                      : "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700"
                  }`}
                >
                  {isAgent ? "⚡" : "U"}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-xl rounded-2xl px-4 py-3 shadow-2xs ${
                    isUser
                      ? "bg-indigo-600 text-white"
                      : "bg-white dark:bg-[#202025] text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-1">
                    <span className="font-semibold text-[11px] opacity-80">
                      {msg.sender_name}
                    </span>
                    <span className="text-[10px] opacity-50">
                      {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "now"}
                    </span>
                  </div>

                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                  {/* Referenced Page Link if any */}
                  {msg.referenced_page_id && (
                    <div className="mt-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-700/40">
                      <button
                        onClick={() => onNavigateToPage(msg.referenced_page_id)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900/60 dark:hover:bg-zinc-900 text-indigo-700 dark:text-indigo-300 text-[11px] transition-colors border border-indigo-200 dark:border-indigo-500/20"
                      >
                        <PageIcon className="w-3.5 h-3.5" />
                        <span>Open referenced page</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input bar */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#19191d] transition-colors">
        <div className="max-w-4xl mx-auto space-y-2">
          {/* Quick Tag Dot Agent pill */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Mention Dot:</span>
            {agents.map((agent) => (
              <button
                key={agent.id}
                type="button"
                onClick={() => setSelectedAgent(agent.name)}
                className={`text-[11px] px-2 py-0.5 rounded-full transition-colors ${
                  selectedAgent === agent.name
                    ? "bg-indigo-600 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                @{agent.name.split(" ")[0]}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                selectedAgent
                  ? `Message directed to @${selectedAgent}...`
                  : "Message the space or ask Dots to assist..."
              }
              className="flex-1 bg-zinc-100 dark:bg-zinc-900/90 border border-zinc-300 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <SendIcon className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
