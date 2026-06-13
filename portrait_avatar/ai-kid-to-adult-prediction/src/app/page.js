"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import {
  FaUpload,
  FaSpinner,
  FaDownload,
  FaTrashAlt,
  FaExclamationTriangle,
  FaTimesCircle,
  FaTimes,
  FaChild,
  FaChevronDown,
  FaChevronUp,
  FaSlidersH,
  FaExchangeAlt,
} from "react-icons/fa";

// ── Age Style Presets ────────────────────────────────────────────────────────
const AGE_PRESETS = [
  {
    id: "young-adult",
    label: "Young Adult (20-25 Years)",
    description: "Casual style with young facial details",
    prompt:
      "Show this child as a 25-year-old adult, keeping the same unique facial features but matured naturally, smooth adult skin, modern casual clothing, photorealistic rendering.",
    color: "from-yellow-500/20 to-amber-500/20 hover:border-amber-500/50",
    borderActive: "border-amber-500 text-amber-300 bg-amber-500/10",
  },
  {
    id: "professional",
    label: "Career Professional (30-35 Years)",
    description: "Sophisticated styling with professional attire",
    prompt:
      "Show this child as a 30-year-old adult with a professional appearance, matured bone structure, wearing smart corporate office clothing, natural lighting, highly detailed portrait.",
    color: "from-orange-500/20 to-amber-500/20 hover:border-orange-500/50",
    borderActive: "border-orange-500 text-orange-300 bg-orange-500/10",
  },
  {
    id: "distinguished",
    label: "Distinguished Adult (40-45 Years)",
    description: "Mature features and gentle aging lines",
    prompt:
      "Show this child as a 40-year-old distinguished adult, natural aging details, subtle mature character lines, sophisticated clothing, professional photography lighting.",
    color: "from-red-500/20 to-orange-500/20 hover:border-red-500/50",
    borderActive: "border-red-500 text-red-300 bg-red-500/10",
  },
  {
    id: "mature-senior",
    label: "Mature Elder (50-60 Years)",
    description: "Honorable elder style with silver touch",
    prompt:
      "Show this child as a 55-year-old mature senior adult, silvering hair details, gentle expression lines, soft natural lighting, warm portrait photograph.",
    color: "from-zinc-500/20 to-amber-500/20 hover:border-zinc-500/50",
    borderActive: "border-zinc-300 text-zinc-200 bg-zinc-700/10",
  },
];

// ── Custom Dropdown Component ────────────────────────────────────────────────
function CustomSelect({
  value,
  onChange,
  options,
  label,
  openUpwards = false,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5 w-full">
      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
        {label}
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between text-xs text-zinc-200 bg-zinc-950/80 border border-zinc-800 rounded px-3.5 py-2.5 outline-none hover:border-amber-500/50 transition-colors w-full cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        <span>{value}</span>
        <FaChevronDown
          className={`text-[10px] text-zinc-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && !disabled && (
        <div
          className={`absolute ${openUpwards ? "bottom-10" : "top-10"} left-0 right-0 z-[150] bg-zinc-950/95 border border-zinc-800 rounded shadow-xl max-h-56 overflow-y-auto overscroll-contain`}
        >
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-xs transition-colors hover:bg-amber-500 hover:text-zinc-950 ${
                value === opt
                  ? "bg-amber-500/20 text-amber-400 font-bold"
                  : "text-zinc-300"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Custom Style Select Component ───────────────────────────────────────────
function CustomAgeSelect({ value, onChange, presets, label }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedPreset = presets.find((p) => p.id === value) || presets[0];

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5 w-full">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-950/40 px-2.5 py-1 rounded">
          Step 2
        </span>
        <span className="text-[11px] text-zinc-400 font-bold">{label}</span>
      </div>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between text-xs text-zinc-200 bg-zinc-950/80 border border-zinc-800 rounded px-4 py-3.5 outline-none cursor-pointer hover:border-amber-500/50 transition-all w-full text-left"
      >
        <div className="flex flex-col text-left">
          <span className="font-black text-white">{selectedPreset.label}</span>
          <span className="text-[10px] text-zinc-400 font-medium mt-0.5">
            {selectedPreset.description}
          </span>
        </div>
        <FaChevronDown
          className={`text-xs text-zinc-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="absolute top-full mt-1 left-0 right-0 z-[150] bg-zinc-950/95 border border-zinc-800 rounded shadow-xl max-h-64 overflow-y-auto overscroll-contain p-2 flex flex-col gap-1">
          {presets.map((preset) => {
            const active = value === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  onChange(preset.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded transition-all flex flex-col ${
                  active
                    ? "bg-amber-500 text-zinc-950 font-bold"
                    : "text-zinc-300 hover:bg-zinc-900"
                }`}
              >
                <span className="text-xs font-bold">{preset.label}</span>
                <span
                  className={`text-[9px] mt-0.5 ${active ? "text-amber-950/70" : "text-zinc-500"}`}
                >
                  {preset.description}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Custom Toggle Switch Component ──────────────────────────────────────────
function CustomToggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}) {
  return (
    <div
      className={`flex items-center justify-between bg-zinc-900/50 border border-zinc-800 rounded p-4 ${disabled ? "opacity-35" : ""}`}
    >
      <div className="flex flex-col">
        <span className="text-xs font-bold text-zinc-200">{label}</span>
        {description && (
          <span className="text-[10px] text-zinc-500 mt-0.5">
            {description}
          </span>
        )}
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none disabled:cursor-not-allowed ${
          checked ? "bg-amber-500" : "bg-zinc-800"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

// ── Draggable Before/After Comparison Image Slider ──────────────────────────
function DraggableCompareSlider({ original, result }) {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleMove = (clientX) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPos(percentage);
    };

    const handleMouseMove = (e) => {
      if (!isDragging) return;
      handleMove(e.clientX);
    };

    const handleTouchMove = (e) => {
      if (!isDragging) return;
      if (e.touches && e.touches[0]) {
        handleMove(e.touches[0].clientX);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchend", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none overflow-hidden rounded bg-zinc-950 flex items-center justify-center cursor-ew-resize"
    >
      {/* Before Image (Left background) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={original}
        alt="Before"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
        draggable={false}
      />

      {/* After Image (Right clipped overlay) */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none select-none"
        draggable={false}
        style={{
          clipPath: `polygon(${sliderPos}% 0, 100% 0, 100% 100%, ${sliderPos}% 100%)`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={result}
          alt="After"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
          draggable={false}
        />
      </div>

      {/* Vertical Slider Bar handle */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-30 shadow-2xl flex items-center justify-center"
        style={{ left: `${sliderPos}%` }}
        onMouseDown={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onTouchStart={(e) => {
          setIsDragging(true);
        }}
      >
        <div className="h-8 w-8 rounded-full flex-shrink-0 bg-white text-zinc-900 shadow-xl border border-zinc-200 flex items-center justify-center text-xs font-bold pointer-events-none hover:scale-105 active:scale-95 transition-all">
          <FaExchangeAlt className="rotate-0 text-[10px]" />
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm border border-zinc-800 text-[10px] text-zinc-400 font-bold px-2 py-1 rounded select-none pointer-events-none">
        Original Kid
      </div>
      <div className="absolute top-3 right-3 bg-amber-950/60 backdrop-blur-sm border border-amber-800 text-[10px] text-amber-300 font-bold px-2 py-1 rounded select-none pointer-events-none">
        Adult Prediction
      </div>
    </div>
  );
}

export default function StudioPage() {
  const { data: session, update: updateSession } = useSession();

  // Input states
  const [inputImage, setInputImage] = useState("");
  const [inputPreview, setInputPreview] = useState("");
  const [selectedAge, setSelectedAge] = useState("young-adult");
  const [customPrompt, setCustomPrompt] = useState(AGE_PRESETS[0].prompt);
  const [modelName, setModelName] = useState("nano-banana-2-edit");
  const [aspectRatio, setAspectRatio] = useState("Auto");
  const [resolution, setResolution] = useState("1k");
  const [outputFormat, setOutputFormat] = useState("jpg");
  const [googleSearch, setGoogleSearch] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Upload/generation state
  const [isUploading, setIsUploading] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState("idle");
  const [generatingError, setGeneratingError] = useState("");
  const [resultImage, setResultImage] = useState("");
  const [creationId, setCreationId] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);

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
            setCustomPrompt(last.prompt || AGE_PRESETS[0].prompt);
            setModelName(last.modelName || "nano-banana-2-edit");
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
            setGeneratingError(
              "Future adult appearance prediction failed. Please try again.",
            );
            setGeneratingStatus("error");
          }
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [generatingStatus, creationId, updateSession]);

  const handleSelectAge = (ageId) => {
    const s = AGE_PRESETS.find((x) => x.id === ageId);
    if (s) {
      setSelectedAge(ageId);
      setCustomPrompt(s.prompt);
    }
  };

  const handleUpload = async (e) => {
    if (!session?.user) {
      setGeneratingError("Please sign in with Google to upload photos.");
      setGeneratingStatus("error");
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setGeneratingError("");

    // Local preview
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
      setGeneratingError("Please upload a child's photo first.");
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
          modelName,
          aspectRatio,
          googleSearch,
          resolution,
          outputFormat,
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
      }
    } catch {
      setGeneratingError(
        "An error occurred during AI processing. Please try again.",
      );
      setGeneratingStatus("error");
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const url = `/api/download?url=${encodeURIComponent(resultImage)}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `prediction-${creationId}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = async () => {
    if (!creationId || !confirm("Delete this prediction?")) return;
    await fetch(`/api/creations?id=${creationId}`, { method: "DELETE" });
    setResultImage("");
    setCreationId("");
    setGeneratingStatus("idle");
  };

  const activeAge = AGE_PRESETS.find((s) => s.id === selectedAge);

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 font-sans py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        {/* Sleek Centered Glass Header */}
        <div className="text-center max-w-2xl mx-auto flex flex-col gap-2">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-2 bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-amber-400">
            AI Kid to Adult Prediction Studio
          </h1>
          <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
            See what your child will look like as they mature. Upload a portrait
            and get a photorealistic prediction of their adult years.
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form & Controls Panel: Left */}
          <div className="lg:col-span-5 flex flex-col gap-6 bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md rounded p-6 sm:p-8 shadow-2xl relative">
            {/* Model Selection Selector */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Select Prediction AI Model
              </span>
              <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1 border border-zinc-800 rounded">
                <button
                  type="button"
                  onClick={() => setModelName("nano-banana-2-edit")}
                  className={`py-2 text-xs font-bold rounded transition-all cursor-pointer ${
                    modelName === "nano-banana-2-edit"
                      ? "bg-amber-500 text-zinc-950"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Standard (v2 Edit)
                </button>
                <button
                  type="button"
                  onClick={() => setModelName("nano-banana-pro-edit")}
                  className={`py-2 text-xs font-bold rounded transition-all cursor-pointer ${
                    modelName === "nano-banana-pro-edit"
                      ? "bg-amber-500 text-zinc-950"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Pro (Enhanced)
                </button>
              </div>
            </div>

            {/* Step 1: Upload */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-950/40 px-2.5 py-1 rounded">
                  Step 1
                </span>
                <span className="text-[11px] text-zinc-400 font-bold">
                  Upload Child's Photo
                </span>
              </div>

              {inputPreview ? (
                <div className="relative aspect-video rounded overflow-hidden border border-zinc-800 bg-zinc-950 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={inputPreview}
                    alt="Child Selfie Preview"
                    className="w-full h-full object-cover opacity-80"
                  />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute top-3.5 right-3.5 p-2 bg-black/70 hover:bg-red-600 text-white rounded-full opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-lg"
                    title="Remove photo"
                  >
                    <FaTimes className="text-xs" />
                  </button>
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <FaSpinner className="animate-spin text-2xl text-amber-400" />
                    </div>
                  )}
                </div>
              ) : (
                <label className="border-2 border-dashed border-zinc-800 hover:border-amber-500/50 rounded flex flex-col items-center justify-center p-8 sm:p-12 text-center cursor-pointer transition-all hover:bg-amber-950/5 group relative bg-zinc-950/30">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    disabled={isUploading}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {isUploading ? (
                    <>
                      <FaSpinner className="animate-spin text-3xl text-amber-400 mb-3" />
                      <span className="text-xs font-semibold text-zinc-300">
                        Uploading to CDN...
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="h-12 w-12 rounded bg-amber-500/10 border border-amber-500/25 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-300">
                        <FaUpload className="text-lg text-amber-400" />
                      </div>
                      <span className="text-xs font-bold text-zinc-200">
                        Drag & Drop child's photo
                      </span>
                      <span className="text-[10px] text-zinc-500 mt-1 font-medium">
                        or click to select file — JPG, PNG, WebP
                      </span>
                    </>
                  )}
                </label>
              )}
            </div>

            {/* Step 2: Select Age Preset */}
            <div className="flex flex-col gap-3">
              <CustomAgeSelect
                value={selectedAge}
                onChange={handleSelectAge}
                presets={AGE_PRESETS}
                label="Target Adult Age Group"
              />
            </div>

            {/* Step 3: Prompt Guidance */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-950/40 px-2.5 py-1 rounded">
                  Step 3
                </span>
                <span className="text-[11px] text-zinc-400 font-bold">
                  Appearance Details (Editable)
                </span>
              </div>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={3}
                placeholder="Describe specific features (hair, professional look, lighting etc.)"
                className="w-full text-xs text-zinc-200 bg-zinc-950/80 border border-zinc-800 focus:border-amber-500/50 rounded p-4 outline-none resize-none transition-all leading-relaxed shadow-inner"
              />
            </div>

            {/* Advanced Dashboard Drawer */}
            <div className="border border-zinc-800 rounded bg-zinc-950/20">
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="w-full flex items-center justify-between px-5 py-4 text-xs font-bold text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                <span className="uppercase tracking-wider flex items-center gap-2">
                  <FaSlidersH className="text-amber-400" /> Advanced Options
                </span>
                {showAdvanced ? (
                  <FaChevronUp className="text-xs text-zinc-400" />
                ) : (
                  <FaChevronDown className="text-xs text-zinc-400" />
                )}
              </button>

              {showAdvanced && (
                <div className="px-5 pb-5 flex flex-col gap-4">
                  {/* Custom dropdowns grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <CustomSelect
                      label="Aspect Ratio"
                      value={aspectRatio}
                      onChange={setAspectRatio}
                      options={
                        modelName === "nano-banana-pro-edit"
                          ? [
                              "1:1",
                              "3:4",
                              "4:3",
                              "9:16",
                              "16:9",
                              "3:2",
                              "2:3",
                              "5:4",
                              "4:5",
                              "21:9",
                            ]
                          : ["Auto", "1:1", "3:4", "4:3", "9:16", "16:9"]
                      }
                      openUpwards={true}
                    />
                    <CustomSelect
                      label="Resolution"
                      value={resolution}
                      onChange={setResolution}
                      options={["1k", "2k", "4k"]}
                      openUpwards={true}
                    />
                    <CustomSelect
                      label="Format"
                      value={outputFormat}
                      onChange={setOutputFormat}
                      options={["jpg", "png"]}
                      openUpwards={true}
                      disabled={modelName === "nano-banana-pro-edit"}
                    />
                  </div>

                  {/* Google Search Custom Toggle */}
                  <CustomToggle
                    checked={googleSearch}
                    onChange={setGoogleSearch}
                    label="Google Concept Search"
                    description="Optimize predictions using global lookups (Standard model only)"
                    disabled={modelName === "nano-banana-pro-edit"}
                  />
                </div>
              )}
            </div>

            {/* Action Trigger */}
            <button
              onClick={handleGenerate}
              disabled={
                generatingStatus === "generating" ||
                isUploading ||
                (session?.user && !inputImage)
              }
              className="w-full flex items-center justify-center gap-2.5 py-4 text-sm font-black text-zinc-950 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed rounded shadow-lg shadow-orange-500/25 transition-all cursor-pointer hover:shadow-orange-500/40"
            >
              {generatingStatus === "generating" ? (
                <>
                  <FaSpinner className="animate-spin text-sm" />
                  <span>Simulating Growth ({elapsedSeconds}s)...</span>
                </>
              ) : (
                <>
                  <FaChild className="text-xs" />
                  <span>
                    Predict Future Appearance ({
                      modelName === "nano-banana-pro-edit"
                        ? (resolution === "4k" ? 36 : 24)
                        : (resolution === "4k" ? 24 : resolution === "2k" ? 18 : 12)
                    } Credits)
                  </span>
                </>
              )}
            </button>

            {/* Error messaging */}
            {generatingError && (
              <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/35 rounded p-4">
                <FaTimesCircle className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-300 font-bold leading-relaxed">
                  {generatingError}
                </p>
              </div>
            )}
          </div>

          {/* Interactive Artwork Showcase Panel: Right */}
          <div className="lg:col-span-7 flex flex-col bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md rounded p-6 sm:p-8 shadow-2xl relative min-h-[420px] lg:h-full justify-between">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-4 mb-4">
              <div>
                <h3 className="text-sm font-black text-zinc-100">
                  Showcase Canvas
                </h3>
                <p className="text-[10px] text-zinc-500 font-bold mt-0.5">
                  Drag the slider to compare kids vs. adults appearance
                </p>
              </div>

              {generatingStatus === "generating" && (
                <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
                  Predicting
                </span>
              )}
              {generatingStatus === "success" && (
                <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  Finished
                </span>
              )}
            </div>

            {/* Display Canvas area */}
            <div className="flex-1 min-h-[280px] flex items-center justify-center relative rounded border border-zinc-800 bg-zinc-950/60 p-2 overflow-hidden shadow-inner">
              {resultImage && inputPreview ? (
                <DraggableCompareSlider
                  original={inputPreview}
                  result={resultImage}
                />
              ) : inputPreview ? (
                <div className="w-full h-full flex items-center justify-center p-2 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={inputPreview}
                    alt="Child Input Selfie"
                    className="max-w-full max-h-full object-contain rounded opacity-75"
                  />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-zinc-900/90 border border-zinc-800 rounded-full px-4 py-1.5 text-[10px] text-amber-400 font-bold whitespace-nowrap shadow-lg">
                    Click &quot;Predict Future Appearance&quot; to begin
                    rendering
                  </div>
                </div>
              ) : generatingStatus === "generating" ? (
                <div className="text-center max-w-xs px-6">
                  <div className="relative mx-auto w-16 h-16 mb-4">
                    <div className="absolute inset-0 rounded bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                      <FaSpinner className="animate-spin text-2xl text-amber-400" />
                    </div>
                  </div>
                  <h4 className="text-xs font-black text-zinc-200">
                    Running Predictions
                  </h4>
                  <p className="text-[10px] text-zinc-500 mt-1 leading-normal">
                    Projecting features for{" "}
                    {activeAge?.label || "the target age"} using{" "}
                    {modelName === "nano-banana-pro-edit" ? "Pro" : "Standard"}{" "}
                    AI model...
                  </p>
                  <div className="mt-4 inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1">
                    <FaSpinner className="animate-spin text-[8px] text-amber-400" />
                    <span className="text-[9px] font-black text-amber-300">
                      {elapsedSeconds}s elapsed
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center max-w-xs px-6 py-10">
                  <div className="h-16 w-16 rounded bg-zinc-900/80 border border-zinc-800/80 flex items-center justify-center mx-auto mb-4">
                    <FaChild className="text-2xl text-zinc-700" />
                  </div>
                  <h4 className="text-xs font-bold text-zinc-300">
                    Canvas Empty
                  </h4>
                  <p className="text-[10px] text-zinc-500 mt-1.5 leading-relaxed">
                    Upload your child's selfie, pick a target age preset, and
                    render their predicted adult appearance.
                  </p>
                </div>
              )}
            </div>

            {/* Actions for output */}
            {resultImage && (
              <div className="flex gap-3 mt-5 border-t border-zinc-800 pt-4 flex-shrink-0">
                <button
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-zinc-950 rounded text-xs font-black shadow-lg shadow-orange-500/20 cursor-pointer transition-all hover:scale-[1.01]"
                >
                  <FaDownload />
                  <span>Download Prediction</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-3 bg-zinc-950 hover:bg-red-950/40 hover:text-red-400 border border-zinc-800 hover:border-red-500/20 text-zinc-500 rounded text-xs font-bold transition-all cursor-pointer"
                  title="Delete result"
                >
                  <FaTrashAlt />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
