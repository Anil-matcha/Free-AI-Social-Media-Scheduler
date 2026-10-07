"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import {
  FaCoins,
  FaSpinner,
  FaDownload,
  FaSlidersH,
  FaHandSparkles,
  FaTrashAlt,
  FaChevronDown,
  FaCheck,
  FaInfoCircle,
  FaPlus,
  FaSearch,
  FaImage,
  FaSyncAlt,
  FaHistory,
} from "react-icons/fa";
import clsx from "clsx";

const ASPECT_RATIOS = [
  { label: "1:1 Square", value: "1:1" },
  { label: "16:9 Widescreen", value: "16:9" },
  { label: "9:16 Story", value: "9:16" },
  { label: "4:3 Classic", value: "4:3" },
  { label: "3:4 Portrait", value: "3:4" },
  { label: "21:9 UltraWide", value: "21:9" },
];

const RESOLUTIONS = [
  { value: "1k", label: "1K Standard", cost: 18 },
  { value: "2k", label: "2K High-Res", cost: 18 },
  { value: "4k", label: "4K Studio", cost: 36 },
];

export default function WorkstationPage() {
  const { data: session, update: updateSession } = useSession();

  // Inputs
  const [prompt, setPrompt] = useState(
    "A minimalist vector logo of a soaring eagle, clean sharp geometry, high contrast, flat color theme, corporate luxury style, dark background.",
  );
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [resolution, setResolution] = useState("1k");
  const [inputImage, setInputImage] = useState(null);
  const [smartSearch, setSmartSearch] = useState(false);

  // UI state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isRatioOpen, setIsRatioOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState(""); // "", "generating", "success", "error"
  const [generatingError, setGeneratingError] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // History & Active Output
  const [history, setHistory] = useState([]);
  const [activeLogo, setActiveLogo] = useState(null);

  const fileInputRef = useRef(null);
  const ratioDropdownRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Load history & sync status
  useEffect(() => {
    if (session?.user) {
      fetchHistory();
    }
  }, [session]);

  // Polling for processing creations in history
  useEffect(() => {
    const hasProcessing = history.some((item) => item.status === "processing");
    if (!hasProcessing) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/logos");
        if (res.ok) {
          const data = await res.json();
          setHistory(data);

          // Update active logo if it finishes
          if (activeLogo && activeLogo.status === "processing") {
            const updatedActive = data.find((l) => l.id === activeLogo.id);
            if (updatedActive && updatedActive.status !== "processing") {
              setActiveLogo(updatedActive);
              if (generatingStatus === "generating") {
                setGeneratingStatus(
                  updatedActive.status === "completed" ? "success" : "error",
                );
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to sync processing history:", err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [history, activeLogo, generatingStatus]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        ratioDropdownRef.current &&
        !ratioDropdownRef.current.contains(e.target)
      ) {
        setIsRatioOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Timer logic for generation
  useEffect(() => {
    if (generatingStatus === "generating") {
      setElapsedSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [generatingStatus]);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/logos");
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate type
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      setGeneratingError("Please upload only PNG or JPG images.");
      setGeneratingStatus("error");
      return;
    }

    if (!session?.user) {
      signIn("google");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setGeneratingError("Sketch file size exceeds 5MB limit.");
      setGeneratingStatus("error");
      return;
    }

    setIsUploading(true);
    setGeneratingError("");
    setGeneratingStatus("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      if (data.url) {
        setInputImage(data.url);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setGeneratingError("Failed to upload sketch. Please try again.");
      setGeneratingStatus("error");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleGenerate = async () => {
    if (!session?.user) {
      signIn("google");
      return;
    }

    if (!prompt.trim()) {
      setGeneratingError("Please write a prompt describing the logo.");
      setGeneratingStatus("error");
      return;
    }

    setGeneratingStatus("generating");
    setGeneratingError("");

    try {
      const res = await fetch("/api/logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          aspectRatio,
          resolution,
          inputImage,
          smartSearch,
        }),
      });

      if (res.status === 402) {
        setGeneratingError(
          "Insufficient credits. Please purchase a package in pricing page.",
        );
        setGeneratingStatus("error");
        return;
      }

      if (!res.ok) {
        throw new Error("Logo generation trigger failed");
      }

      const data = await res.json();
      setActiveLogo(data);
      updateSession();
      fetchHistory();

      if (data.status === "completed" && data.resultImage) {
        setGeneratingStatus("success");
      } else {
        pollLogoResult(data.id);
      }
    } catch (err) {
      console.error(err);
      setGeneratingError(
        "An error occurred during logo generation. Please try again.",
      );
      setGeneratingStatus("error");
    }
  };

  const pollLogoResult = async (id) => {
    let completed = false;

    while (!completed) {
      await new Promise((resolve) => setTimeout(resolve, 2500));

      try {
        const res = await fetch(`/api/logos?id=${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "completed" && data.resultImage) {
            setActiveLogo(data);
            setGeneratingStatus("success");
            completed = true;
            fetchHistory();
          } else if (data.status === "failed") {
            setGeneratingError(
              "AI logo generation failed. Please refine your prompt and try again.",
            );
            setGeneratingStatus("error");
            completed = true;
            fetchHistory();
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (
      !confirm(
        "Are you sure you want to delete this logo? This action cannot be undone.",
      )
    )
      return;

    try {
      const res = await fetch(`/api/logos?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setHistory((prev) => prev.filter((item) => item.id !== id));
        if (activeLogo?.id === id) {
          setActiveLogo(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete logo:", err);
    }
  };

  const selectHistoryItem = (item) => {
    setActiveLogo(item);
    setGeneratingStatus("");
    setPrompt(item.prompt);
    setAspectRatio(item.aspectRatio);
    setResolution(item.resolution);
    setInputImage(item.inputImage);
  };

  const currentCost = resolution === "4k" ? 36 : 18;

  return (
    <div className="flex-1 flex flex-col md:flex-row md:overflow-hidden overflow-y-auto bg-zinc-950 text-zinc-100 font-sans">
      {/* ─── LEFT WORKSPACE: SIDEBAR CONFIGURATION ────────────────────────────────────────── */}
      <div className="w-full md:w-[460px] border-r border-zinc-800 bg-zinc-900/60 flex flex-col md:overflow-y-auto overflow-visible flex-shrink-0">
        {/* Header Title */}
        <div className="p-5 border-b border-zinc-800 flex-shrink-0 bg-zinc-900/85 flex items-center justify-between">
          <div>
            <h1 className="text-base font-heading font-extrabold text-white tracking-tight flex items-center gap-2">
              <FaHandSparkles className="text-violet-400" /> Logo Design Engine
            </h1>
            <p className="text-[11px] text-zinc-400 mt-1 font-medium">
              Input directives, upload sketches, and generate professional brand
              vector graphics.
            </p>
          </div>
        </div>

        {/* Input Form Fields */}
        <div className="p-5 space-y-6 flex-1 bg-zinc-900/30">
          {/* 1. Prompt Script */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-[11px] font-black text-zinc-200 uppercase tracking-wider">
                1. Logo Prompt Directive
              </label>
              <span className="text-[10px] text-zinc-550 font-black">
                {prompt.length} / 1,000
              </span>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value.slice(0, 1000))}
              rows={4}
              className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-violet-500 rounded px-3 py-2.5 text-xs font-medium text-white placeholder-zinc-650 focus:outline-none focus:ring-1 focus:ring-violet-500/30 resize-none transition-all leading-normal"
              placeholder="Describe the logo elements, colors, symbols, styles..."
            />
          </div>

          {/* 2. Sketch/Reference Image Dropzone */}
          <div>
            <label className="block text-[11px] font-black text-zinc-200 uppercase tracking-wider mb-2">
              2. Sketch Concept (Optional)
            </label>

            <div className="relative group border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/45 hover:border-zinc-750 transition-all duration-200">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".png,.jpg,.jpeg"
                className="hidden"
              />

              {isUploading ? (
                <div className="flex flex-col items-center justify-center py-7 text-center">
                  <FaSpinner className="animate-spin text-xl text-violet-400 mb-2" />
                  <span className="text-[10px] font-black text-zinc-300 uppercase tracking-wider">
                    Uploading Sketch...
                  </span>
                </div>
              ) : inputImage ? (
                <div className="relative w-full aspect-[16/10] bg-zinc-950 flex items-center justify-center p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={inputImage}
                    alt="Sketch Reference"
                    className="max-h-full max-w-full object-contain rounded"
                  />
                  <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity duration-200">
                    <button
                      type="button"
                      onClick={() => {
                        if (!session?.user) {
                          signIn("google");
                          return;
                        }
                        fileInputRef.current?.click();
                      }}
                      className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-white rounded text-[10px] font-black uppercase transition-all cursor-pointer"
                    >
                      Change Sketch
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputImage(null)}
                      className="px-3 py-1.5 bg-red-950/80 border border-red-900/30 text-red-400 rounded text-[10px] font-black uppercase hover:bg-red-900 hover:text-white transition-all cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => {
                    if (!session?.user) {
                      signIn("google");
                      return;
                    }
                    fileInputRef.current?.click();
                  }}
                  className="flex flex-col items-center justify-center py-7 cursor-pointer hover:bg-zinc-950/20 transition-all border-2 border-dashed border-zinc-800 hover:border-zinc-750 rounded-xl"
                >
                  <FaImage className="text-lg text-zinc-500 mb-2" />
                  <span className="text-[10px] font-black text-zinc-300 uppercase tracking-wider">
                    Upload Draft Sketch
                  </span>
                  <span className="text-[9px] text-zinc-550 mt-1 font-bold">
                    PNG or JPG (Max 5MB)
                  </span>
                </div>
              )}
            </div>

            {inputImage && (
              <p className="text-[9px] text-violet-400 font-bold mt-2 flex items-center gap-1.5 leading-relaxed">
                <FaInfoCircle className="text-xs" />
                <span>
                  Sketch present: Workspace will automatically use image
                  refinement model (nano-banana-pro-edit).
                </span>
              </p>
            )}
          </div>

          {/* 3. Custom Aspect Ratio Selector */}
          <div ref={ratioDropdownRef}>
            <label className="block text-[11px] font-black text-zinc-200 uppercase tracking-wider mb-2">
              3. Aspect Ratio Selection
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsRatioOpen(!isRatioOpen)}
                className={clsx(
                  "w-full bg-zinc-950 border rounded px-3.5 py-3 text-left text-xs font-black text-white flex justify-between items-center cursor-pointer transition-all",
                  isRatioOpen
                    ? "border-violet-500 ring-1 ring-violet-500/20"
                    : "border-zinc-800 hover:border-zinc-700",
                )}
              >
                <span>
                  {ASPECT_RATIOS.find((r) => r.value === aspectRatio)?.label ||
                    aspectRatio}
                </span>
                <FaChevronDown
                  className={clsx(
                    "text-zinc-500 text-[9px] transition-transform duration-200",
                    isRatioOpen && "transform rotate-180",
                  )}
                />
              </button>

              {/* Upward opening dropdown list overlay */}
              {isRatioOpen && (
                <div className="absolute bottom-full mb-1 left-0 right-0 z-30 bg-zinc-900 border border-zinc-800 rounded shadow-2xl max-h-48 overflow-y-auto py-1 overscroll-contain animate-in fade-in slide-in-from-bottom-1 duration-150">
                  {ASPECT_RATIOS.map((ratio) => {
                    const isSelected = ratio.value === aspectRatio;
                    return (
                      <button
                        key={ratio.value}
                        type="button"
                        onClick={() => {
                          setAspectRatio(ratio.value);
                          setIsRatioOpen(false);
                        }}
                        className={clsx(
                          "w-full text-left px-3.5 py-2 text-xs transition-colors flex items-center justify-between cursor-pointer",
                          isSelected
                            ? "bg-violet-950/40 text-violet-400 font-extrabold"
                            : "text-zinc-300 hover:bg-zinc-800 hover:text-white",
                        )}
                      >
                        <span>{ratio.label}</span>
                        {isSelected && (
                          <FaCheck className="text-violet-400 text-[10px]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 4. Tiered Resolution & Costs Cards */}
          <div>
            <label className="block text-[11px] font-black text-zinc-200 uppercase tracking-wider mb-2.5">
              4. Target Resolution & Quality
            </label>

            <div className="grid grid-cols-3 gap-2">
              {RESOLUTIONS.map((res) => {
                const isSelected = res.value === resolution;
                return (
                  <button
                    key={res.value}
                    type="button"
                    onClick={() => setResolution(res.value)}
                    className={clsx(
                      "flex flex-col items-center py-2.5 border rounded transition-all cursor-pointer",
                      isSelected
                        ? "bg-violet-950/20 border-violet-500 text-white shadow-md shadow-violet-500/10"
                        : "bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-450 hover:text-zinc-200",
                    )}
                  >
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      {res.label.split(" ")[0]}
                    </span>
                    <span className="text-[11px] font-bold mt-1 font-heading text-white">
                      {res.label.split(" ")[1]}
                    </span>
                    <span className="text-[8px] text-zinc-500 mt-1 font-bold">
                      {res.cost} credits
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Google Smart Search Switch */}
          <div className="border-t border-zinc-800 pt-5 mt-2">
            <button
              type="button"
              onClick={() => setSmartSearch(!smartSearch)}
              className={clsx(
                "w-full flex items-center justify-between p-3 rounded border transition-all cursor-pointer",
                smartSearch
                  ? "bg-violet-950/10 border-violet-550/40 text-violet-400"
                  : "bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-350",
              )}
            >
              <div className="flex items-center gap-2.5">
                <FaSearch
                  className={smartSearch ? "text-violet-400" : "text-zinc-500"}
                />
                <span className="text-[10px] font-black uppercase tracking-wider">
                  Smart Search Prompt Enhancer
                </span>
              </div>

              {/* Beautiful custom switch track */}
              <div
                className={clsx(
                  "w-8 h-4 rounded-full relative p-0.5 transition-colors duration-250 flex items-center",
                  smartSearch ? "bg-violet-600" : "bg-zinc-800",
                )}
              >
                <div
                  className={clsx(
                    "h-3 w-3 rounded-full bg-white transition-transform duration-200 ease-in-out shadow-sm",
                    smartSearch ? "translate-x-4" : "translate-x-0",
                  )}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Generate triggers panel */}
        <div className="p-5 border-t border-zinc-800 bg-zinc-900/90 flex-shrink-0">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generatingStatus === "generating" || isUploading}
            className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50 text-white py-3.5 rounded text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-violet-600/10 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
          >
            {generatingStatus === "generating" ? (
              <FaSpinner className="animate-spin text-sm" />
            ) : (
              <FaHandSparkles className="text-sm" />
            )}

            <span>
              {generatingStatus === "generating"
                ? "Generating..."
                : `Manifest Logo — ${currentCost} Credits`}
            </span>
          </button>

          {generatingStatus === "error" && (
            <div className="mt-3 bg-red-950/20 border border-red-900/40 rounded p-3 text-[10.5px] text-red-400 font-bold leading-normal font-sans text-center">
              {generatingError}
            </div>
          )}
        </div>
      </div>

      {/* ─── RIGHT PANEL: MAIN CANVAS & PREVIEW ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col md:overflow-hidden overflow-visible min-w-0 bg-transparent relative">
        {/* Absolute Background Graphics */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-[60%] h-[60%] bg-violet-650/[0.04] rounded-full blur-[140px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[50%] h-[50%] bg-fuchsia-650/[0.04] rounded-full blur-[120px]" />
        </div>

        <div className="flex-1 p-6 md:p-8 flex flex-col md:overflow-y-auto overflow-visible z-10 max-h-full">
          <div className="flex-1 flex items-center justify-center min-h-[300px]">
            {generatingStatus === "generating" ? (
              /* Loading manifestation state */
              <div className="text-center space-y-4 max-w-sm">
                <div className="relative h-20 w-20 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 border-2 border-violet-600/10 rounded-full border-t-violet-500 animate-spin" />
                  <FaHandSparkles className="text-2xl text-violet-400 animate-pulse" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-xs font-black uppercase text-white tracking-widest">
                    Generating Brand Graphic
                  </h3>
                  <p className="text-[10px] text-zinc-400 font-medium">
                    Est. queue wait: 15 seconds. Active time elapsed:{" "}
                    {elapsedSeconds}s
                  </p>
                </div>
              </div>
            ) : activeLogo ? (
              /* Manifestation completed result state */
              <div className="relative group rounded-2xl overflow-hidden border border-zinc-800/80 bg-zinc-900/60 shadow-2xl flex items-center justify-center max-w-md w-full aspect-square p-3">
                {activeLogo.resultImage ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeLogo.resultImage}
                      alt={activeLogo.prompt}
                      className="max-h-full max-w-full object-contain rounded-xl shadow-inner bg-zinc-950"
                    />

                    {/* Sketch reference overlay if user generated with sketch */}
                    {activeLogo.inputImage && (
                      <div className="absolute bottom-6 left-6 bg-zinc-900/90 border border-zinc-800 p-2 rounded-xl shadow-2xl max-w-24 sm:max-w-28 pointer-events-auto">
                        <span className="text-[7.5px] font-black text-violet-400 block uppercase mb-1 tracking-wider text-center">
                          Reference Sketch
                        </span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={activeLogo.inputImage}
                          alt="sketch reference"
                          className="aspect-square w-full object-contain rounded border border-zinc-800 bg-zinc-950"
                        />
                      </div>
                    )}

                    {/* Download & details button layer on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-6 flex flex-col justify-end pointer-events-none">
                      <div className="flex items-end justify-between pointer-events-auto">
                        <div className="space-y-1 pr-4 min-w-0">
                          <span className="text-[9px] font-black uppercase text-violet-400 block tracking-wider">
                            Generated logo result
                          </span>
                          <h4 className="text-xs font-bold text-white truncate max-w-[200px] italic">
                            "{activeLogo.prompt}"
                          </h4>
                        </div>
                        <a
                          href={activeLogo.resultImage}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={`logo_${activeLogo.id}.jpg`}
                          className="h-9 w-9 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                          title="Download HD design"
                        >
                          <FaDownload className="text-xs" />
                        </a>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-10 text-red-400 font-bold flex flex-col gap-2">
                    <span>Model execution failed.</span>
                    <button
                      onClick={handleGenerate}
                      className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded border border-zinc-750"
                    >
                      Retry
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Engine standby state */
              <div className="max-w-md w-full text-center space-y-6">
                <div className="relative h-20 w-20 mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center shadow-md">
                  <div className="absolute inset-0 bg-violet-600/5 blur-[20px] rounded-full" />
                  <FaHandSparkles className="text-2xl text-zinc-400" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-sm font-black uppercase text-zinc-300 tracking-wider">
                    Engine Standby.
                  </h2>
                  <p className="text-[10px] text-zinc-450 uppercase tracking-widest leading-loose max-w-xs mx-auto font-medium font-sans">
                    Submit prompts on the left workspace sidebar or drop
                    sketches to manifest custom logos.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
