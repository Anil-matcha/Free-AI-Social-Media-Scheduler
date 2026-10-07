"use client";

import { FiVideo, FiImage, FiSearch, FiUser } from "react-icons/fi";

export function FloatingToolbar({ onSeeMore }) {
  return (
    <div className="flex items-center gap-1 p-1 rounded bg-glass-bg border border-glass-border shadow-sm">
      <button className="flex items-center gap-2 px-4 py-1.5 rounded bg-primary text-white hover:bg-primary-hover text-[11px] font-bold transition-colors">
        <FiUser className="text-xs" />
        <span>Talking Actors</span>
      </button>
      <button className="flex items-center gap-2 px-4 py-1.5 rounded hover:bg-glass-hover text-[11px] font-bold text-secondary-text transition-colors border border-transparent hover:border-glass-border">
        <FiVideo className="text-xs" />
        <span>Video</span>
      </button>
      <button className="flex items-center gap-2 px-4 py-1.5 rounded hover:bg-glass-hover text-[11px] font-bold text-secondary-text transition-colors border border-transparent hover:border-glass-border">
        <FiImage className="text-xs" />
        <span>Image</span>
      </button>
      <button 
        onClick={onSeeMore}
        className="flex items-center gap-2 px-4 py-1.5 rounded hover:bg-glass-hover text-[11px] font-bold text-secondary-text transition-colors border border-transparent hover:border-glass-border"
      >
        <FiSearch className="text-xs" />
        <span>See more</span>
      </button>
    </div>
  );
}
