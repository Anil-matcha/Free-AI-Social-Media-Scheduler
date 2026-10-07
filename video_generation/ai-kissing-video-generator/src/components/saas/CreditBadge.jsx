import { FaHeart } from "react-icons/fa";

export function CreditBadge({ credits }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-full text-xs font-semibold text-rose-300">
      <FaHeart className="text-rose-500 text-[10px] animate-pulse" />
      <span>{credits} Hearts</span>
    </div>
  );
}
