"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  HomeIcon,
  LayersIcon,
  ClockIcon,
  AtSignIcon,
  MoreIcon,
  GridIcon,
  FolderIcon,
} from "./Icons";

export default function IconRail({
  activeRailTab = "spaces",
  onSelectRailTab,
  currentUser = null,
  onOpenAuth,
  onLogout,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const topNav = [
    { id: "home", icon: HomeIcon, label: "Home" },
    { id: "spaces", icon: LayersIcon, label: "Spaces" },
    { id: "history", icon: ClockIcon, label: "History" },
    { id: "mentions", icon: AtSignIcon, label: "Mentions" },
    { id: "more", icon: MoreIcon, label: "More" },
  ];

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const initials = currentUser?.name
    ? currentUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "";

  return (
    <div className="w-12 bg-[#f9f9f9] dark:bg-[#141416] border-r border-zinc-200/80 dark:border-zinc-800/80 flex flex-col items-center justify-between py-3 select-none z-20 transition-colors duration-150 relative">
      {/* Top Navigation */}
      <div className="flex flex-col items-center gap-2">
        {topNav.map((item) => {
          const Icon = item.icon;
          const isActive = activeRailTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectRailTab && onSelectRailTab(item.id)}
              title={item.label}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
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

      {/* Bottom Profile / Login Button */}
      <div className="flex flex-col items-center gap-2 relative" ref={menuRef}>
        <button
          title="Apps"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
        >
          <GridIcon className="w-4 h-4" />
        </button>

        <button
          title="Library"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
        >
          <FolderIcon className="w-4 h-4" />
        </button>

        {/* User Avatar Button or Login First button */}
        {currentUser ? (
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            title={`${currentUser.name} (${currentUser.email})`}
            className="w-7 h-7 rounded-full overflow-hidden border border-zinc-300 dark:border-zinc-700 hover:ring-2 hover:ring-indigo-500/50 transition-all cursor-pointer mt-1 relative shrink-0"
          >
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center text-[10px] font-semibold">
                {initials}
              </div>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onOpenAuth && onOpenAuth()}
            title="Login first to access your spaces"
            className="w-7 h-7 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center text-xs font-semibold shadow-sm transition-all cursor-pointer mt-1"
          >
            🔑
          </button>
        )}

        {/* User Account Popover */}
        {menuOpen && currentUser && (
          <div className="absolute left-12 bottom-0 ml-2 w-60 bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-3 z-50 text-xs animate-in fade-in slide-in-from-left-2 duration-150">
            {/* User Profile Header */}
            <div className="flex items-center gap-2.5 pb-2.5 mb-2 border-b border-zinc-100 dark:border-zinc-800/80">
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover shrink-0 border border-zinc-200 dark:border-zinc-700"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                  {initials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {currentUser.name}
                </div>
                <div className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate">
                  {currentUser.email}
                </div>
              </div>
            </div>

            {/* Sign Out Button */}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                if (onLogout) onLogout();
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 font-medium transition-colors cursor-pointer text-xs"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
