"use client";

import React, { useState, useRef, useEffect } from "react";
import { LuChevronDown, LuCheck } from "react-icons/lu";

export default function CustomDropdown({
  value,
  onChange,
  options = [], // [{ label: "TypeScript", value: "typescript", icon: ..., tag: ..., description: ..., group: ... }]
  placeholder = "Select...",
  className = "",
  buttonClassName = "",
  menuClassName = "",
  size = "md", // "xs" | "sm" | "md" | "lg"
  searchable = false,
  align = "left", // "left" | "right"
  direction = "auto", // "auto" | "down" | "up"
  header = null, // Optional menu header text
  disabled = false,
  renderTrigger = null, // (selectedOption, open) => React.ReactNode
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [computedDirection, setComputedDirection] = useState("down");
  const [computedMaxHeight, setComputedMaxHeight] = useState(380);
  const dropdownRef = useRef(null);

  const selectedOption =
    options.find((opt) => opt.value === value) ||
    options.find((opt) => opt.id === value) ||
    (value
      ? {
          label:
            typeof value === "string"
              ? value.charAt(0).toUpperCase() + value.slice(1)
              : String(value),
          value,
        }
      : null);

  // Dynamically calculate optimal direction and max-height to guarantee zero viewport overflow
  const updatePlacement = () => {
    if (!dropdownRef.current) return;
    const rect = dropdownRef.current.getBoundingClientRect();
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;

    let targetDir = direction;
    if (direction === "auto") {
      // Pick direction with more space, defaulting to down if at least 260px available
      targetDir = spaceBelow >= 260 || spaceBelow >= spaceAbove ? "down" : "up";
    } else if (direction === "up") {
      // If forced up but space above is too tight (< 220px) and space below has much more room, flip down
      if (spaceAbove < 220 && spaceBelow > spaceAbove) {
        targetDir = "down";
      } else {
        targetDir = "up";
      }
    } else if (direction === "down") {
      // If forced down but space below is too tight (< 220px) and space above has much more room, flip up
      if (spaceBelow < 220 && spaceAbove > spaceBelow) {
        targetDir = "up";
      } else {
        targetDir = "down";
      }
    }

    setComputedDirection(targetDir);

    // Keep safe margin from screen edges (at least 16px buffer)
    const available = targetDir === "up" ? spaceAbove - 20 : spaceBelow - 20;
    setComputedMaxHeight(Math.max(160, Math.min(available, 400)));
  };

  useEffect(() => {
    if (open) {
      updatePlacement();
      window.addEventListener("resize", updatePlacement);
      window.addEventListener("scroll", updatePlacement, true);
      return () => {
        window.removeEventListener("resize", updatePlacement);
        window.removeEventListener("scroll", updatePlacement, true);
      };
    }
  }, [open, direction]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const filteredOptions =
    searchable && search
      ? options.filter((opt) => {
          const q = search.toLowerCase().trim();
          return (
            (opt.label || "").toLowerCase().includes(q) ||
            (opt.tag || "").toLowerCase().includes(q) ||
            (opt.group || "").toLowerCase().includes(q) ||
            (opt.value || "").toLowerCase().includes(q)
          );
        })
      : options;

  const sizeClasses = {
    xs: "px-2 py-0.5 text-[11px]",
    sm: "px-2.5 py-1 text-xs",
    md: "px-3 py-1.5 text-xs",
    lg: "px-3.5 py-2 text-sm",
  }[size] || "px-3 py-1.5 text-xs";

  const positionClasses =
    computedDirection === "up"
      ? `bottom-full mb-1.5 ${align === "right" ? "right-0" : "left-0"}`
      : `top-full mt-1.5 ${align === "right" ? "right-0" : "left-0"}`;

  return (
    <div
      className={`relative inline-block text-left select-none ${className}`}
      ref={dropdownRef}
    >
      {renderTrigger ? (
        <div onClick={() => !disabled && setOpen(!open)}>
          {renderTrigger(selectedOption, open)}
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen(!open)}
          className={`flex items-center justify-between gap-1.5 transition-colors cursor-pointer rounded-lg border font-medium ${sizeClasses} ${
            disabled
              ? "opacity-50 cursor-not-allowed bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400"
              : buttonClassName ||
                "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <span className="truncate flex items-center gap-1.5 min-w-0">
            {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
            <span className="truncate">{selectedOption?.label || placeholder}</span>
          </span>
          <LuChevronDown
            size={12}
            className={`shrink-0 transition-transform duration-150 opacity-60 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
      )}

      {open && (
        <div
          className={`absolute ${positionClasses} min-w-[160px] overflow-y-auto z-50 rounded-xl bg-white dark:bg-[#1c1c1f] border border-zinc-200 dark:border-zinc-700/80 shadow-2xl p-1 animate-in fade-in zoom-in-95 duration-100 ${menuClassName}`}
          style={{ maxHeight: `${computedMaxHeight}px` }}
        >
          {header && (
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-2.5 py-1 border-b border-zinc-100 dark:border-zinc-800 mb-1">
              {header}
            </div>
          )}

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
            <div className="px-3 py-2 text-[11px] text-zinc-400 text-center">
              No matching options
            </div>
          ) : (
            filteredOptions.map((opt, idx) => {
              const isSelected = opt.value === value;
              const prevOpt = idx > 0 ? filteredOptions[idx - 1] : null;
              const isNewGroup = opt.group && (!prevOpt || prevOpt.group !== opt.group);

              return (
                <React.Fragment key={opt.value || opt.id || idx}>
                  {isNewGroup && (
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-2.5 pt-2 pb-1 border-t border-zinc-100 dark:border-zinc-800/60 first:border-t-0 first:pt-1">
                      {opt.group}
                    </div>
                  )}
                  <button
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
                    <div className="truncate flex items-center gap-2 min-w-0">
                      {opt.icon && <span className="text-sm shrink-0">{opt.icon}</span>}
                      <div className="min-w-0">
                        <div className="truncate leading-snug">{opt.label}</div>
                        {(opt.tag || opt.description) && (
                          <div className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">
                            {opt.tag || opt.description}
                          </div>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <LuCheck
                        size={13}
                        className="text-indigo-600 dark:text-indigo-400 shrink-0 ml-1.5"
                      />
                    )}
                  </button>
                </React.Fragment>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
