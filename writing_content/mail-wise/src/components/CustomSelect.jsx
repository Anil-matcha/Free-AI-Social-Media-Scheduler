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
      {label && <span className="text-xs font-semibold text-secondary-text">{label}</span>}
      <div className="relative">
        {/* Toggle Button */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-full border border-divider/50 bg-bg-page text-xs text-primary-text hover:border-primary/50 transition-all font-bold text-left shadow-sm cursor-pointer"
        >
          <span className="flex items-center gap-2">
            {selectedOption.emoji && <span>{selectedOption.emoji}</span>}
            {selectedOption.flag && <span>{selectedOption.flag}</span>}
            {selectedOption.name}
          </span>
          {isOpen ? <FaChevronUp className="text-[10px] text-secondary-text" /> : <FaChevronDown className="text-[10px] text-secondary-text" />}
        </button>

        {/* Dropdown Options List */}
        {isOpen && (
          <ul
            className={`absolute left-0 right-0 z-50 max-h-48 overflow-y-auto overscroll-contain bg-bg-card border border-divider/50 rounded-2xl py-1.5 shadow-xl ${
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
                  className={`flex items-center justify-between px-4 py-2 hover:bg-bg-card-hover text-xs font-bold cursor-pointer transition-colors ${
                    isSelected ? "text-primary bg-primary/10 font-bold" : "text-secondary-text hover:text-primary-text"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {opt.emoji && <span>{opt.emoji}</span>}
                    {opt.flag && <span>{opt.flag}</span>}
                    {opt.name}
                  </span>
                  {isSelected && <FaCheck className="text-[9px] text-primary shrink-0" />}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
