"use client";

export default function CustomToggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer group select-none">
      {label && (
        <span className="text-xs font-semibold text-secondary-text group-hover:text-primary-text transition-colors">
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
              ? "bg-primary border-primary"
              : "bg-divider/50 border-divider/50 hover:border-primary/50"
          }`}
        />
        {/* Sliding Dot */}
        <div
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-all duration-350 shadow-sm ${
            checked ? "transform translate-x-4" : ""
          }`}
        />
      </div>
    </label>
  );
}
