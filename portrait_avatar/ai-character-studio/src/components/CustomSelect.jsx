"use client";

import { useState, useRef, useEffect } from "react";
import { FaChevronDown, FaChevronUp, FaCheck } from "react-icons/fa";

export default function CustomSelect({ options, value, onChange, label, upward = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find((opt) => opt.id === value) || options[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col gap-1.5 w-full select-none" ref={containerRef}>
      {label && <span className="text-xs font-semibold text-zinc-400">{label}</span>}
      <div className="relative">
        {/* Toggle Button */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-xs text-zinc-200 hover:border-zinc-700 transition-all font-medium text-left"
        >
          <span className="flex items-center gap-2">
            {selectedOption.emoji && <span>{selectedOption.emoji}</span>}
            {selectedOption.name}
          </span>
          {isOpen ? <FaChevronUp className="text-[10px] text-zinc-500" /> : <FaChevronDown className="text-[10px] text-zinc-500" />}
        </button>

        {/* Dropdown Options List */}
        {isOpen && (
          <ul
            className={`absolute left-0 right-0 z-50 max-h-48 overflow-y-auto overscroll-contain bg-zinc-900 border border-zinc-800 rounded-xl py-1.5 shadow-2xl ${
              upward ? "bottom-full mb-1.5" : "top-full mt-1.5"
            }`}
          >
            {options.map((opt) => {
              const isSelected = opt.id === value;
              return (
                <li
                  key={opt.id}
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between px-3.5 py-2 hover:bg-zinc-800 text-xs font-medium cursor-pointer transition-colors ${
                    isSelected ? "text-magenta-400 bg-magenta-500/5 font-semibold" : "text-zinc-300 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {opt.emoji && <span>{opt.emoji}</span>}
                    {opt.name}
                  </span>
                  {isSelected && <FaCheck className="text-[9px] text-magenta-400 shrink-0" />}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
