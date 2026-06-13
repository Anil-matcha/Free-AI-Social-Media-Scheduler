"use client";

import { FiVideo, FiImage, FiSearch, FiUser } from "react-icons/fi";

export function FloatingToolbar({ onSeeMore }) {
  return (
    <div className="flex items-center gap-1 p-1 rounded bg-white border border-[#ececec] shadow-sm">
      <button className="flex items-center gap-2 px-4 py-1.5 rounded bg-[#1a1a1a] text-white text-[11px] font-bold">
        <FiUser className="text-xs" />
        <span>Talking Actors</span>
      </button>
      <button className="flex items-center gap-2 px-4 py-1.5 rounded hover:bg-[#f5f5f5] text-[11px] font-bold text-[#666] transition-colors border border-transparent hover:border-[#ececec]">
        <FiVideo className="text-xs" />
        <span>Video</span>
      </button>
      <button className="flex items-center gap-2 px-4 py-1.5 rounded hover:bg-[#f5f5f5] text-[11px] font-bold text-[#666] transition-colors border border-transparent hover:border-[#ececec]">
        <FiImage className="text-xs" />
        <span>Image</span>
      </button>
      <button 
        onClick={onSeeMore}
        className="flex items-center gap-2 px-4 py-1.5 rounded hover:bg-[#f5f5f5] text-[11px] font-bold text-[#666] transition-colors border border-transparent hover:border-[#ececec]"
      >
        <FiSearch className="text-xs" />
        <span>See more</span>
      </button>
    </div>
  );
}
