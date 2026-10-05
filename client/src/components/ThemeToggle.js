"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { SunIcon, MoonIcon, MonitorIcon } from "./Icons";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-1 bg-zinc-200/60 dark:bg-zinc-800/80 p-1 rounded-lg w-24 h-7 animate-pulse" />
    );
  }

  return (
    <div className="flex items-center bg-zinc-200/80 dark:bg-zinc-800/80 p-0.5 rounded-lg border border-zinc-300 dark:border-zinc-700/80">
      <button
        onClick={() => setTheme("light")}
        className={`p-1 rounded-md transition-all ${
          theme === "light"
            ? "bg-white text-amber-500 shadow-xs"
            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
        }`}
        title="Light theme"
        aria-label="Light theme"
      >
        <SunIcon className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => setTheme("dark")}
        className={`p-1 rounded-md transition-all ${
          theme === "dark"
            ? "bg-zinc-700 text-indigo-300 shadow-xs"
            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
        }`}
        title="Dark theme"
        aria-label="Dark theme"
      >
        <MoonIcon className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => setTheme("system")}
        className={`p-1 rounded-md transition-all ${
          theme === "system"
            ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
        }`}
        title="System default theme"
        aria-label="System default theme"
      >
        <MonitorIcon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
