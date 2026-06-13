export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-10 h-10 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
      <p className="text-slate-400 text-sm font-bold uppercase tracking-widest animate-pulse">Syncing Library...</p>
    </div>
  );
}
