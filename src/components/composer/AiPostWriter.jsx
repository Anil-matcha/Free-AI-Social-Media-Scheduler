"use client";

import { useState } from "react";
import { FaMagic, FaCheck, FaSync } from "react-icons/fa";
import { FiX, FiAlertCircle, FiCornerDownLeft } from "react-icons/fi";

const TONES = [
  "Engaging",
  "Professional",
  "Casual",
  "Excited",
  "Educational",
  "Viral",
  "Storytelling"
];

export default function AiPostWriter({
  platform = "youtube",
  onApply,
  onClose,
}) {
  const [prompt, setPrompt] = useState("");
  const [selectedTone, setSelectedTone] = useState("Engaging");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedResult, setGeneratedResult] = useState(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a topic or instruction for your post.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          platform,
          tone: selectedTone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate post with AI.");
      }

      setGeneratedResult(data.data);
    } catch (err) {
      setError(err.message || "Failed to connect to AI generation service.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrefill = () => {
    if (!generatedResult) return;
    onApply(generatedResult);
  };

  return (
    <div className="bg-gradient-to-b from-violet-950/20 via-zinc-900/70 to-zinc-900/90 border border-violet-500/30 rounded-lg p-4 space-y-3.5 text-xs text-zinc-100 shadow-xl shadow-violet-950/20 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-violet-500/20">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-violet-500/30">
            <FaMagic className="text-[11px]" />
          </div>
          <span className="font-semibold text-zinc-100">
            Write with AI
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold ${
            platform === "youtube" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
            platform === "instagram" ? "bg-pink-500/20 text-pink-400 border border-pink-500/30" :
            platform === "tiktok" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" :
            platform === "linkedin" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" :
            platform === "threads" ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" :
            "bg-sky-500/20 text-sky-400 border border-sky-500/30"
          }`}>
            {platform.replace("_", " ")}
          </span>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
            title="Close AI Assistant"
          >
            <FiX className="text-sm" />
          </button>
        )}
      </div>

      {error && (
        <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-md text-[11px] text-red-400 flex items-center gap-1.5">
          <FiAlertCircle className="text-xs shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Prompt Input */}
      <div className="space-y-1">
        <label className="text-[11px] font-medium text-zinc-300 block">
          What is your post about?
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={2}
          placeholder="e.g. Announce our new AI scheduling tool with key benefits, or share 3 productivity tips for creators..."
          className="w-full bg-zinc-950/80 border border-zinc-800 rounded-md p-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 resize-none transition-all leading-relaxed"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              handleGenerate();
            }
          }}
        />
      </div>

      {/* Tone Selection */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-zinc-300 block">
          Tone of Voice
        </label>
        <div className="flex items-center gap-1.5 flex-wrap">
          {TONES.map((tone) => (
            <button
              key={tone}
              type="button"
              onClick={() => setSelectedTone(tone)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                selectedTone === tone
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm shadow-violet-500/30 border border-violet-400/40 font-semibold"
                  : "bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-violet-500/30"
              }`}
            >
              {tone}
            </button>
          ))}
        </div>
      </div>

      {/* Generate Action Button */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[10px] text-zinc-500">
          Press <kbd className="px-1 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-[9px] text-zinc-400">Ctrl+Enter</kbd> to generate
        </span>

        <button
          type="button"
          disabled={loading}
          onClick={handleGenerate}
          className="px-4 py-1.5 rounded-md text-xs font-semibold text-white bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-violet-500/30 active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <FaMagic className="text-[10px] text-amber-300" />
              <span>Generate Post</span>
            </>
          )}
        </button>
      </div>

      {/* Generated Result Preview */}
      {generatedResult && (
        <div className="mt-3 p-3.5 rounded-md bg-zinc-950/90 border border-violet-500/30 space-y-2.5 animate-fade-in shadow-inner">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
            <span className="text-[11px] font-semibold text-violet-300 flex items-center gap-1">
              <FaMagic className="text-[10px]" /> Generated Suggestion
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                title="Regenerate"
              >
                <FaSync className={`text-[9px] ${loading ? "animate-spin text-violet-400" : ""}`} />
                <span>Retry</span>
              </button>
            </div>
          </div>

          <div className="space-y-2 text-zinc-300">
            {generatedResult.title && (
              <div>
                <span className="text-[10px] font-medium text-zinc-500 block uppercase tracking-wide">
                  Title
                </span>
                <p className="font-semibold text-zinc-100 text-xs">
                  {generatedResult.title}
                </p>
              </div>
            )}

            <div>
              <span className="text-[10px] font-medium text-zinc-500 block uppercase tracking-wide">
                Caption
              </span>
              <p className="text-zinc-200 text-xs whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto pr-1">
                {generatedResult.description}
              </p>
            </div>

            {generatedResult.tags && (
              <div>
                <span className="text-[10px] font-medium text-zinc-500 block uppercase tracking-wide">
                  Tags
                </span>
                <p className="text-indigo-400 text-[11px] font-mono">
                  {generatedResult.tags}
                </p>
              </div>
            )}
          </div>

          {/* Prefill Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handlePrefill}
              className="px-4 py-1.5 rounded-md text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/25 active:scale-95"
            >
              <FaCheck className="text-[10px]" />
              <span>Prefill into Composer</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
