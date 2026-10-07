"use client";

import { useState, useRef, useEffect } from "react";
import { FaChevronDown } from "react-icons/fa";

export default function CustomSelect({
  label,
  options,
  value,
  onChange,
  className = "",
  upward = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find((opt) => opt.id === value) || options[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative flex flex-col gap-1.5 ${className}`} ref={dropdownRef}>
      {label && <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{label}</span>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white/5 border border-white/10 hover:border-violet-500/40 rounded-xl text-sm font-medium text-white transition-all focus:outline-none cursor-pointer"
      >
        <span className="flex items-center gap-2">
          {selectedOption.emoji && <span>{selectedOption.emoji}</span>}
          <span>{selectedOption.name}</span>
        </span>
        <FaChevronDown className={`w-3 h-3 text-zinc-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <ul
          className={`absolute left-0 right-0 z-50 p-1 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl max-h-60 overflow-y-auto prevent-scroll-chaining shadow-2xl shadow-black/50 ${
            upward ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          {options.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                onClick={() => {
                  onChange(option.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer ${
                  option.id === value
                    ? "bg-violet-600 text-white font-semibold"
                    : "text-zinc-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  {option.emoji && <span>{option.emoji}</span>}
                  <span>{option.name}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
