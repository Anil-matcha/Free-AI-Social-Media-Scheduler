"use client";

import { useState, useRef, useEffect } from "react";
import { FaChevronDown } from "react-icons/fa";

export function CustomDropdown({ label, value, options, onChange, className = "" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectedLabel =
    options.find((o) => (typeof o === "object" ? o.value === value : o === value));
  const displayLabel =
    typeof selectedLabel === "object" ? selectedLabel.label : selectedLabel || value;

  return (
    <div className={`relative ${className}`} ref={ref}>
      {label && (
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-black dark:text-white hover:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all"
      >
        <span className="truncate">{displayLabel}</span>
        <FaChevronDown
          className={`text-[10px] text-zinc-400 transition-transform duration-200 ${open ? "rotate-180" : ""
            }`}
        />
      </button>

      {open && (
        <div className="absolute z-50 bottom-12 w-full max-h-60 overflow-y-auto bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl shadow-black/10 dark:shadow-black/30 animate-in fade-in slide-in-from-bottom-1 duration-150">
          {options.map((opt, i) => {
            const optValue = typeof opt === "object" ? opt.value : opt;
            const optLabel = typeof opt === "object" ? opt.label : opt;
            const isActive = optValue === value;

            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  onChange(optValue);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${isActive
                  ? "bg-orange-500/10 text-orange-500 font-medium"
                  : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  } ${i === 0 ? "rounded-t-lg" : ""} ${i === options.length - 1 ? "rounded-b-lg" : ""
                  }`}
              >
                {optLabel}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
