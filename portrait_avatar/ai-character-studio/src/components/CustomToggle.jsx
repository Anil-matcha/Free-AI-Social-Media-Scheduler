"use client";

export default function CustomToggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer group select-none">
      {label && (
        <span className="text-xs font-semibold text-zinc-400 group-hover:text-zinc-200 transition-colors">
          {label}
        </span>
      )}
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        {/* Track */}
        <div
          className={`w-9 h-5 rounded-full border transition-all duration-350 ${
            checked
              ? "bg-magenta-600 border-magenta-500 shadow-[0_0_10px_rgba(217,70,239,0.3)]"
              : "bg-zinc-900 border-zinc-700 hover:border-zinc-600"
          }`}
        />
        {/* Sliding Dot */}
        <div
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-all duration-350 shadow-md ${
            checked ? "transform translate-x-4" : ""
          }`}
        />
      </div>
    </label>
  );
}
