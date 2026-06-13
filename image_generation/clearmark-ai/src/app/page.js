"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import {
  FaUpload,
  FaSpinner,
  FaDownload,
  FaTrashAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaTimes,
  FaEraser,
  FaMagic,
  FaCamera,
  FaFileAlt,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";

// ── Scenario preset prompts ────────────────────────────────────────────────────
const SCENARIOS = [
  {
    id: "watermark",
    icon: FaEraser,
    label: "Remove Watermark",
    description: "Erase logos, copyright text & overlays",
    color: "indigo",
    prompt: `Remove all watermarks, copyright symbols, logo marks, text overlays, and any branded or promotional elements from this image completely. Use advanced in-painting and contextual reconstruction to seamlessly fill the removed areas using the surrounding content, textures, colors, and patterns. Ensure the restored areas blend naturally with the rest of the image without visible artifacts, blurriness, or seams. Preserve all original colors, sharpness, lighting, and fine detail in untouched areas. The final result should appear completely natural and professional — as if no watermark or overlay was ever present.`,
  },
  {
    id: "old-photo",
    icon: FaCamera,
    label: "Restore Old Photo",
    description: "Fix scratches, fading & stamps on vintage photos",
    color: "amber",
    prompt: `Restore this old, aged, or damaged photograph to pristine modern quality. Remove all scratches, dust spots, tears, creases, discoloration, yellowing, fading, and any stamps, text overlays, or handwritten annotations overlaid on the image. Enhance color vibrancy and saturation to natural levels. Sharpen fine details including facial features, hair, fabric textures, and background elements. Restore realistic skin tones and correct tonal imbalances caused by age. Preserve the original composition, subject identity, and historical authenticity while giving the image a clean, high-resolution, professionally restored appearance.`,
  },
  {
    id: "document",
    icon: FaFileAlt,
    label: "Clean Document",
    description: "Remove stamps, annotations & overlays from scanned docs",
    color: "emerald",
    prompt: `Clean this scanned document, receipt, or certificate by removing all stamps, red or blue ink overlays, official seals, handwritten annotations, watermarks, highlighting marks, and any graphical elements that obscure or overlay the underlying printed content. Preserve all original printed text, numbers, tables, signatures, and layout formatting with full clarity and legibility. Remove any scan artifacts such as uneven backgrounds, smudging, or shadow borders. Deliver a clean, professional, high-contrast document that is fully legible and ready for archiving, sharing, or processing.`,
  },
];

const colorMap = {
  indigo: {
    chip: "bg-indigo-500/10 border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/20",
    active: "bg-indigo-500/20 border-indigo-500 text-indigo-200",
    icon: "text-indigo-400",
  },
  amber: {
    chip: "bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20",
    active: "bg-amber-500/20 border-amber-500 text-amber-200",
    icon: "text-amber-400",
  },
  emerald: {
    chip: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20",
    active: "bg-emerald-500/20 border-emerald-500 text-emerald-200",
    icon: "text-emerald-400",
  },
};

export default function StudioPage() {
  const { data: session, update: updateSession } = useSession();

  // Input state
  const [inputImage, setInputImage] = useState("");
  const [inputPreview, setInputPreview] = useState("");
  const [selectedScenario, setSelectedScenario] = useState("watermark");
  const [customPrompt, setCustomPrompt] = useState(SCENARIOS[0].prompt);
  const [aspectRatio, setAspectRatio] = useState("auto");
  const [resolution, setResolution] = useState("2K");
  const [quality, setQuality] = useState("high");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Upload/generation state
  const [isUploading, setIsUploading] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState("idle");
  const [generatingError, setGeneratingError] = useState("");
  const [resultImage, setResultImage] = useState("");
  const [creationId, setCreationId] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);

  // Compare mode
  const [compareMode, setCompareMode] = useState("result");

  // Load last creation on mount
  useEffect(() => {
    if (typeof window !== "undefined" && session?.user) {
      fetch("/api/creations")
        .then((r) => (r.ok ? r.json() : null))
        .then((list) => {
          if (Array.isArray(list) && list.length > 0) {
            const last = list[0];
            setInputImage(last.inputImage || "");
            setInputPreview(last.inputImage || "");
            setResultImage(last.resultImage || "");
            setCreationId(last.id);
            setCustomPrompt(last.prompt || SCENARIOS[0].prompt);
            if (last.status === "completed") setGeneratingStatus("success");
          }
        })
        .catch(() => {});
    }
  }, [session?.user]);

  // Timer
  useEffect(() => {
    if (generatingStatus === "generating") {
      timerRef.current = setInterval(
        () => setElapsedSeconds((p) => p + 1),
        1000,
      );
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [generatingStatus]);

  // Auto-poll if status is processing
  useEffect(() => {
    if (generatingStatus !== "generating" || !creationId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/creations?id=${creationId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "completed" && data.resultImage) {
            setResultImage(data.resultImage);
            setGeneratingStatus("success");
            updateSession();
          } else if (data.status === "failed") {
            setGeneratingError("AI processing failed. Please try again.");
            setGeneratingStatus("error");
          }
        }
      } catch {}
    }, 4000);
    return () => clearInterval(interval);
  }, [generatingStatus, creationId, updateSession]);

  const handleSelectScenario = (scenarioId) => {
    const s = SCENARIOS.find((x) => x.id === scenarioId);
    if (s) {
      setSelectedScenario(scenarioId);
      setCustomPrompt(s.prompt);
    }
  };

  const handleUpload = async (e) => {
    if (!session?.user) {
      setGeneratingError("Please sign in with Google to upload images.");
      setGeneratingStatus("error");
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setGeneratingError("");

    // local preview
    const localUrl = URL.createObjectURL(file);
    setInputPreview(localUrl);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setInputImage(data.url);
      setResultImage("");
      setGeneratingStatus("idle");
    } catch (err) {
      setGeneratingError("Failed to upload image. Please try again.");
      setGeneratingStatus("error");
      setInputPreview("");
    } finally {
      setIsUploading(false);
      try {
        e.target.value = "";
      } catch {}
    }
  };

  const handleRemoveImage = () => {
    setInputImage("");
    setInputPreview("");
    setResultImage("");
    setCreationId("");
    setGeneratingStatus("idle");
    setGeneratingError("");
  };

  const handleGenerate = async () => {
    if (!session?.user) {
      signIn("google");
      return;
    }
    if (!inputImage) {
      setGeneratingError("Please upload an image first.");
      setGeneratingStatus("error");
      return;
    }

    setElapsedSeconds(0);
    setGeneratingStatus("generating");
    setGeneratingError("");
    setResultImage("");

    try {
      const res = await fetch("/api/generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: inputImage,
          prompt: customPrompt,
          aspectRatio,
          resolution,
          quality,
        }),
      });

      if (res.status === 402) {
        setGeneratingError(
          "Insufficient credits. Please purchase a credit pack.",
        );
        setGeneratingStatus("error");
        return;
      }
      if (!res.ok) throw new Error("Generation failed");

      const data = await res.json();
      setCreationId(data.id);
      updateSession();

      if (data.status === "completed" && data.resultImage) {
        setResultImage(data.resultImage);
        setGeneratingStatus("success");
      } else {
        // will be picked up by polling interval
      }
    } catch {
      setGeneratingError("An error occurred. Please try again.");
      setGeneratingStatus("error");
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const url = `/api/download?url=${encodeURIComponent(resultImage)}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `clearmark-result-${creationId}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = async () => {
    if (!creationId || !confirm("Delete this result?")) return;
    await fetch(`/api/creations?id=${creationId}`, { method: "DELETE" });
    setResultImage("");
    setCreationId("");
    setGeneratingStatus("idle");
  };

  const scenario = SCENARIOS.find((s) => s.id === selectedScenario);
  const colors = colorMap[scenario?.color || "indigo"];

  return (
    <div className="flex-1 flex overflow-hidden relative bg-zinc-950 font-sans">
      <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden p-4 sm:p-6 gap-5 min-h-0">
        {/* ── Left Input Panel ── */}
        <div className="w-full md:w-[30%] flex flex-col gap-4 md:overflow-y-auto pr-0 md:pr-2 min-h-0 flex-shrink-0">
          {/* Guest Banner */}
          {!session?.user && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded p-4 flex gap-3 items-start">
              <FaExclamationTriangle className="text-amber-400 text-base flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-300">
                  Playing as Guest
                </h4>
                <p className="text-[11px] text-amber-400/80 mt-0.5 leading-relaxed">
                  Sign in with Google to upload images, remove watermarks, and
                  save results.
                </p>
              </div>
            </div>
          )}

          {/* Heading */}
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Remove Watermarks with AI
            </h1>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Upload your image, choose a scenario, and let GPT Image 2 clean it
              instantly.
            </p>
          </div>

          {/* Image Upload */}
          <div className="bg-zinc-900 border border-zinc-800 rounded p-5 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              Upload Image
            </h3>

            {inputPreview ? (
              <div className="relative aspect-video rounded overflow-hidden border border-zinc-700 bg-zinc-800 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={inputPreview}
                  alt="Input image"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  title="Remove image"
                >
                  <FaTimes className="text-xs" />
                </button>
                {isUploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <FaSpinner className="animate-spin text-2xl text-indigo-400" />
                  </div>
                )}
              </div>
            ) : (
              <label className="border-2 border-dashed border-zinc-700 hover:border-indigo-500/60 rounded flex flex-col items-center justify-center p-10 text-center cursor-pointer transition-colors group relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  disabled={isUploading}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                {isUploading ? (
                  <>
                    <FaSpinner className="animate-spin text-3xl text-indigo-400 mb-3" />
                    <span className="text-xs font-semibold text-zinc-300">
                      Uploading to CDN...
                    </span>
                  </>
                ) : (
                  <>
                    <div className="h-14 w-14 rounded bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                      <FaUpload className="text-xl text-indigo-400" />
                    </div>
                    <span className="text-sm font-semibold text-zinc-200">
                      Drop image here
                    </span>
                    <span className="text-[11px] text-zinc-500 mt-1.5">
                      or click to browse — JPG, PNG, WebP
                    </span>
                  </>
                )}
              </label>
            )}
          </div>

          {/* Scenario Selector */}
          <div className="bg-zinc-900 border border-zinc-800 rounded p-5 flex flex-col gap-3">
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              Choose Scenario
            </h3>
            <div className="flex flex-col gap-2">
              {SCENARIOS.map((s) => {
                const c = colorMap[s.color];
                const Icon = s.icon;
                const active = selectedScenario === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleSelectScenario(s.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded border text-left transition-all cursor-pointer ${
                      active ? c.active : c.chip
                    }`}
                  >
                    <Icon className={`text-sm flex-shrink-0 ${c.icon}`} />
                    <div>
                      <div className="text-xs font-bold">{s.label}</div>
                      <div className="text-[10px] opacity-70 mt-0.5">
                        {s.description}
                      </div>
                    </div>
                    {active && (
                      <FaCheckCircle
                        className={`ml-auto text-sm flex-shrink-0 ${c.icon}`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prompt Editor */}
          <div className="bg-zinc-900 border border-zinc-800 rounded p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                AI Prompt
              </h3>
              <span className="text-[9px] text-zinc-500 font-medium">
                Editable
              </span>
            </div>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={5}
              placeholder="Describe what you want AI to do with your image..."
              className="w-full text-xs text-zinc-300 bg-zinc-950 border border-zinc-700 focus:border-indigo-500 rounded p-3.5 outline-none resize-none transition-all leading-relaxed"
            />
          </div>

          {/* Advanced Options */}
          <div className="bg-zinc-900 border border-zinc-800 rounded overflow-hidden">
            <button
              onClick={() => setShowAdvanced((v) => !v)}
              className="w-full flex items-center justify-between px-5 py-3.5 text-xs font-bold text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              <span className="uppercase tracking-wider">Advanced Options</span>
              {showAdvanced ? (
                <FaChevronUp className="text-xs" />
              ) : (
                <FaChevronDown className="text-xs" />
              )}
            </button>
            {showAdvanced && (
              <div className="px-5 pb-5 grid grid-cols-3 gap-3">
                {/* Aspect Ratio */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Aspect
                  </label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="text-xs text-zinc-200 bg-zinc-950 border border-zinc-700 rounded px-2.5 py-2 outline-none cursor-pointer"
                  >
                    {["auto", "1:1", "16:9", "9:16", "4:3", "3:4"].map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Resolution */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Resolution
                  </label>
                  <select
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    className="text-xs text-zinc-200 bg-zinc-950 border border-zinc-700 rounded px-2.5 py-2 outline-none cursor-pointer"
                  >
                    {["1K", "2K", "4K"].map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Quality */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Quality
                  </label>
                  <select
                    value={quality}
                    onChange={(e) => setQuality(e.target.value)}
                    className="text-xs text-zinc-200 bg-zinc-950 border border-zinc-700 rounded px-2.5 py-2 outline-none cursor-pointer"
                  >
                    {["low", "medium", "high"].map((q) => (
                      <option key={q} value={q}>
                        {q}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={
              generatingStatus === "generating" || isUploading || !inputImage
            }
            className="w-full flex items-center justify-center gap-2.5 py-4 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed rounded shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
          >
            {generatingStatus === "generating" ? (
              <>
                <FaSpinner className="animate-spin" />
                <span>Removing Watermark...</span>
              </>
            ) : (
              <>
                <FaMagic />
                <span>Remove Watermark (18 Credits)</span>
              </>
            )}
          </button>

          {generatingError && (
            <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 rounded p-3.5">
              <FaTimesCircle className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-300 font-medium leading-relaxed">
                {generatingError}
              </p>
            </div>
          )}
        </div>

        {/* ── Right Output Panel ── */}
        <div className="w-full md:w-[70%] flex flex-col bg-zinc-900 border border-zinc-800 rounded p-5 shadow-2xl relative min-h-[400px] md:h-full overflow-hidden flex-shrink-0">
          {/* Panel Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3.5 mb-4 flex-shrink-0">
            <div>
              <h3 className="text-sm font-bold text-zinc-100">
                Result Preview
              </h3>
              <p className="text-[10px] text-zinc-500 font-medium mt-0.5">
                Before / After comparison
              </p>
            </div>
            <div className="flex items-center gap-2">
              {generatingStatus === "success" && (
                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Completed
                </span>
              )}
              {generatingStatus === "generating" && (
                <span className="text-[9px] font-bold text-indigo-400 bg-indigo-400/10 border border-indigo-400/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-ping" />
                  Processing ({elapsedSeconds}s)
                </span>
              )}
              {/* Compare toggle */}
              {resultImage && inputPreview && (
                <div className="flex bg-zinc-800 rounded p-0.5 border border-zinc-700">
                  {["original", "result"].map((m) => (
                    <button
                      key={m}
                      onClick={() => setCompareMode(m)}
                      className={`text-[10px] font-semibold px-2.5 py-1 rounded transition-all cursor-pointer ${
                        compareMode === m
                          ? "bg-indigo-600 text-white shadow"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {m === "original" ? "Before" : "After"}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Display Area */}
          <div className="flex-1 rounded overflow-hidden border border-zinc-800 bg-zinc-950 flex flex-col items-center justify-center relative min-h-[200px]">
            {resultImage && compareMode === "result" ? (
              <div className="w-full h-full flex items-center justify-center p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resultImage}
                  alt="Watermark Removed Result"
                  className="max-w-full max-h-full object-contain rounded shadow-2xl"
                />
              </div>
            ) : inputPreview && (compareMode === "original" || !resultImage) ? (
              <div className="w-full h-full flex items-center justify-center p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={inputPreview}
                  alt="Original Image"
                  className="max-w-full max-h-full object-contain rounded opacity-80"
                />
                {!resultImage && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-zinc-900/90 border border-zinc-700 rounded-full px-4 py-1.5 text-[10px] text-zinc-400 font-medium whitespace-nowrap">
                    Click &quot;Remove Watermark&quot; to process
                  </div>
                )}
              </div>
            ) : generatingStatus === "generating" ? (
              <div className="text-center max-w-xs px-6">
                <div className="relative mx-auto w-20 h-20 mb-6">
                  <div className="absolute inset-0 rounded bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <FaSpinner className="animate-spin text-3xl text-indigo-400" />
                  </div>
                  <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-violet-600 flex items-center justify-center">
                    <FaMagic className="text-[8px] text-white" />
                  </div>
                </div>
                <h4 className="text-sm font-bold text-zinc-100">
                  Removing Watermark...
                </h4>
                <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">
                  GPT Image 2 is analyzing and reconstructing your image.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5">
                  <FaSpinner className="animate-spin text-[10px] text-indigo-400" />
                  <span className="text-[10px] font-bold text-indigo-300">
                    {elapsedSeconds}s elapsed
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center max-w-xs px-6 py-10">
                <div className="h-20 w-20 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-5">
                  <FaEraser className="text-3xl text-zinc-600" />
                </div>
                <h4 className="text-sm font-bold text-zinc-300">
                  Ready to Remove
                </h4>
                <p className="text-[11px] text-zinc-600 mt-2 leading-relaxed">
                  Upload an image, choose a scenario, and click &quot;Remove
                  Watermark&quot; to get started.
                </p>
              </div>
            )}
          </div>

          {/* Action Footer */}
          {resultImage && (
            <div className="flex gap-3 mt-4 border-t border-zinc-800 pt-4 flex-shrink-0">
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded text-xs font-bold shadow-lg shadow-indigo-500/20 cursor-pointer transition-all"
              >
                <FaDownload />
                <span>Download HD Result</span>
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-3 bg-zinc-800 hover:bg-red-900/30 hover:text-red-400 border border-zinc-700 hover:border-red-500/30 text-zinc-400 rounded text-xs font-bold transition-all cursor-pointer"
                title="Delete result"
              >
                <FaTrashAlt />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
