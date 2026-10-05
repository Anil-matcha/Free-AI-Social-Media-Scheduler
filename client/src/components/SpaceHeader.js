"use client";

import React from "react";
import { PageIcon, ChatIcon, BotIcon, MicIcon, UsersIcon, PinIcon } from "./Icons";

export default function SpaceHeader({
  space,
  activeTab,
  onTabChange,
  onTogglePin,
  onOpenAgentModal,
}) {
  if (!space) return null;

  const tabs = [
    { id: "pages", label: "Pages (Canvas)", icon: PageIcon, count: space.pages_count },
    { id: "chat", label: "Space Chat", icon: ChatIcon, count: space.messages_count },
    { id: "agents", label: "Dots (AI Agents)", icon: BotIcon, count: space.agents?.length || 0 },
    { id: "meetings", label: "Meeting Notes", icon: MicIcon },
  ];

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#19191d] px-6 pt-5 select-none transition-colors duration-200">
      {/* Top Space Bar */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3.5">
          <div className="text-3xl p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 shadow-2xs flex items-center justify-center">
            {space.icon || "📁"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{space.name}</h1>
              <button
                onClick={onTogglePin}
                title={space.pinned ? "Unpin space" : "Pin space"}
                className={`p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                  space.pinned ? "text-amber-500" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                }`}
              >
                <PinIcon className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1 max-w-2xl">
              {space.description || "Persistent collaborative workspace for documents and autonomous agents."}
            </p>
          </div>
        </div>

        {/* Right side: Active Dots & Members */}
        <div className="flex items-center gap-3">
          {/* Active Dot Agents Pills */}
          <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-full px-2.5 py-1">
            <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
              Dots
            </span>
            <div className="flex items-center gap-1">
              {(space.agents || []).map((dot) => (
                <button
                  key={dot.id}
                  onClick={() => onOpenAgentModal(dot)}
                  className="flex items-center gap-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-700/80 text-zinc-700 dark:text-zinc-200 px-2 py-0.5 rounded-full text-[11px] transition-colors shadow-2xs"
                  title={`Click to prompt ${dot.name}`}
                >
                  <span>{dot.avatar === "agent-bolt" ? "⚡" : dot.avatar === "agent-pen" ? "✍️" : dot.avatar === "agent-ruler" ? "📐" : "🤖"}</span>
                  <span className="font-medium">{dot.name.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Members */}
          <div className="flex items-center -space-x-1.5">
            {(space.members || []).map((m, idx) => (
              <div
                key={m.id || idx}
                className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 shadow-2xs"
                title={`${m.name} (${m.role})`}
              >
                {m.name.charAt(0)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                isActive
                  ? "border-indigo-600 dark:border-indigo-500 text-indigo-700 dark:text-indigo-300 bg-indigo-50/60 dark:bg-indigo-500/5 font-semibold"
                  : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
}
