"use client";

import React, { useState, useRef, useEffect } from "react";
import { LuChevronDown, LuCheck } from "react-icons/lu";

export default function CustomDropdown({
  value,
  onChange,
  options = [], // [{ label: "TypeScript", value: "typescript", icon: ... }]
  placeholder = "Select...",
  className = "",
  buttonClassName = "",
  menuClassName = "",
  size = "md", // "sm" | "md"
  searchable = false,
  align = "left", // "left" | "right"
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);

  const selectedOption =
    options.find((opt) => opt.value === value) ||
    (value ? { label: typeof value === "string" ? value.charAt(0).toUpperCase() + value.slice(1) : String(value), value } : options[0]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handleOutsideClick);
    return () => document.removeEventListener("pointerdown", handleOutsideClick);
  }, []);

  const filteredOptions = searchable && search
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase().trim())
      )
    : options;

  return (
    <div className={`relative inline-block text-left select-none ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-between gap-1.5 transition-colors cursor-pointer rounded-lg border text-xs font-medium ${
          size === "sm" ? "px-2 py-1" : "px-3 py-1.5"
        } ${buttonClassName || "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
      >
        <span className="truncate flex items-center gap-1.5">
          {selectedOption?.icon && <span>{selectedOption.icon}</span>}
          <span>{selectedOption?.label || placeholder}</span>
        </span>
        <LuChevronDown
          size={12}
          className={`shrink-0 transition-transform duration-150 opacity-60 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          className={`absolute ${
            align === "right" ? "right-0" : "left-0"
          } top-full mt-1.5 min-w-[160px] max-h-60 overflow-y-auto z-50 rounded-xl bg-white dark:bg-[#1c1c1f] border border-zinc-200 dark:border-zinc-700/80 shadow-2xl p-1 animate-in fade-in zoom-in-95 duration-100 ${menuClassName}`}
        >
          {searchable && options.length > 5 && (
            <div className="p-1 mb-1 border-b border-zinc-100 dark:border-zinc-800">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full px-2 py-1 text-xs bg-zinc-50 dark:bg-zinc-900 rounded-md border border-zinc-200 dark:border-zinc-700 outline-none text-zinc-800 dark:text-zinc-200 placeholder-zinc-400"
                autoFocus
              />
            </div>
          )}
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-[11px] text-zinc-400 text-center">No matching options</div>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors cursor-pointer text-left ${
                    isSelected
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <span className="truncate flex items-center gap-1.5">
                    {opt.icon && <span>{opt.icon}</span>}
                    <span>{opt.label}</span>
                  </span>
                  {isSelected && (
                    <LuCheck size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0 ml-1.5" />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
