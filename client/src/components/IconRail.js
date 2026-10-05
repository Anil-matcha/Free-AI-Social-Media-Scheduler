"use client";

import React from "react";
import {
  HomeIcon,
  LayersIcon,
  ClockIcon,
  AtSignIcon,
  MoreIcon,
  GridIcon,
  FolderIcon,
} from "./Icons";
import ThemeToggle from "./ThemeToggle";

export default function IconRail({ activeRailTab = "spaces", onSelectRailTab }) {
  const topNav = [
    { id: "home", icon: HomeIcon, label: "Home" },
    { id: "spaces", icon: LayersIcon, label: "Spaces" },
    { id: "history", icon: ClockIcon, label: "History" },
    { id: "mentions", icon: AtSignIcon, label: "Mentions" },
    { id: "more", icon: MoreIcon, label: "More" },
  ];

  return (
    <div className="w-12 bg-[#f9f9f9] dark:bg-[#141416] border-r border-zinc-200/80 dark:border-zinc-800/80 flex flex-col items-center justify-between py-3 select-none z-10 transition-colors duration-150">
      {/* Top Icons */}
      <div className="flex flex-col items-center gap-2">
        {topNav.map((item) => {
          const Icon = item.icon;
          const isActive = activeRailTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectRailTab && onSelectRailTab(item.id)}
              title={item.label}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                isActive
                  ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs"
                  : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/50"
              }`}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>

      {/* Bottom Icons & Profile */}
      <div className="flex flex-col items-center gap-2">
        <button
          title="Apps"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/50 transition-colors"
        >
          <GridIcon className="w-4 h-4" />
        </button>

        <button
          title="Library"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/50 transition-colors"
        >
          <FolderIcon className="w-4 h-4" />
        </button>

        {/* User Avatar */}
        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-900 dark:from-zinc-600 dark:to-zinc-800 text-white flex items-center justify-center text-[11px] font-semibold shadow-2xs mt-1">
          J
        </div>
      </div>
    </div>
  );
}
