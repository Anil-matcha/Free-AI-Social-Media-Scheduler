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
      {label && <span className="text-xs font-semibold text-slate-500">{label}</span>}
      <div className="relative">
        {/* Toggle Button */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-full border border-slate-200 bg-white text-xs text-slate-800 hover:border-slate-300 transition-all font-bold text-left shadow-sm cursor-pointer"
        >
          <span className="flex items-center gap-2">
            {selectedOption.emoji && <span>{selectedOption.emoji}</span>}
            {selectedOption.flag && <span>{selectedOption.flag}</span>}
            {selectedOption.name}
          </span>
          {isOpen ? <FaChevronUp className="text-[10px] text-slate-400" /> : <FaChevronDown className="text-[10px] text-slate-400" />}
        </button>

        {/* Dropdown Options List */}
        {isOpen && (
          <ul
            className={`absolute left-0 right-0 z-50 max-h-48 overflow-y-auto overscroll-contain bg-white border border-slate-200 rounded-2xl py-1.5 shadow-xl ${
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
                  className={`flex items-center justify-between px-4 py-2 hover:bg-slate-50 text-xs font-bold cursor-pointer transition-colors ${
                    isSelected ? "text-purple-700 bg-purple-50 font-bold" : "text-slate-700 hover:text-slate-900"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {opt.emoji && <span>{opt.emoji}</span>}
                    {opt.flag && <span>{opt.flag}</span>}
                    {opt.name}
                  </span>
                  {isSelected && <FaCheck className="text-[9px] text-purple-700 shrink-0" />}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
