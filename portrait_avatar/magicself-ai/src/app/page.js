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
  FaMagic,
  FaChevronDown,
  FaChevronUp,
  FaSlidersH,
  FaExchangeAlt,
} from "react-icons/fa";

// ── Style Preset Prompts ──────────────────────────────────────────────────────
const STYLE_PRESETS = [
  {
    id: "oil-painting",
    label: "Oil Painting",
    description: "Rich textures & classic brushstrokes",
    prompt:
      "Transform this selfie into a beautiful oil painting masterpiece, fine brushstrokes, rich textures, classic artistic style, highly detailed",
    color: "from-amber-500/20 to-orange-500/20 hover:border-amber-500/50",
    borderActive: "border-amber-500 text-amber-300 bg-amber-500/10",
  },
  {
    id: "watercolor",
    label: "Watercolor",
    description: "Soft color washes & paper grain",
    prompt:
      "Convert this selfie into an elegant watercolor painting, soft color washes, delicate paper textures, artistic splatters, fluid transitions",
    color: "from-blue-500/20 to-teal-500/20 hover:border-blue-500/50",
    borderActive: "border-blue-500 text-blue-300 bg-blue-500/10",
  },
  {
    id: "digital-art",
    label: "Digital Art",
    description: "Vibrant gradients & modern polish",
    prompt:
      "Transform this selfie into stunning digital artwork, vibrant color gradients, clean lines, modern fantasy concept art, high-tech polish",
    color: "from-purple-500/20 to-fuchsia-500/20 hover:border-purple-500/50",
    borderActive: "border-purple-500 text-purple-300 bg-purple-500/10",
  },
  {
    id: "anime",
    label: "Anime Style",
    description: "Dynamic lines & studio Ghibli feel",
    prompt:
      "Convert this selfie into anime style artwork, expressive big eyes, colorful dynamic hair, cell-shaded lighting, beautiful studio ghibli or makoto shinkai aesthetic",
    color: "from-pink-500/20 to-rose-500/20 hover:border-pink-500/50",
    borderActive: "border-pink-500 text-pink-300 bg-pink-500/10",
  },
  {
    id: "pencil-sketch",
    label: "Pencil Sketch",
    description: "Intricate graphite & hand-drawn lines",
    prompt:
      "Transform this selfie into a detailed pencil sketch, intricate graphite shading, hand-drawn crosshatching, realistic paper grain, artistic line work",
    color: "from-zinc-500/20 to-slate-500/20 hover:border-zinc-500/50",
    borderActive: "border-zinc-300 text-zinc-200 bg-zinc-700/10",
  },
  {
    id: "pop-art",
    label: "Pop Art",
    description: "Bold halftone patterns & Warhol style",
    prompt:
      "Convert this selfie into vibrant pop art style, bold halftone patterns, retro comic book aesthetic, high contrast saturated colors, Andy Warhol style",
    color: "from-red-500/20 to-yellow-500/20 hover:border-red-500/50",
    borderActive: "border-red-500 text-red-300 bg-red-500/10",
  },
];

// ── Custom Dropdown Component ────────────────────────────────────────────────
function CustomSelect({
  value,
  onChange,
  options,
  label,
  openUpwards = false,
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
      <span className="text-[10px] font-bold text-secondary-text uppercase tracking-wider">
        {label}
      </span>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between text-xs text-primary-text bg-bg-page/80 border border-divider/50 rounded px-3.5 py-2.5 outline-none cursor-pointer hover:border-primary/50 transition-colors w-full"
      >
        <span>{value}</span>
        <FaChevronDown
          className={`text-[10px] text-secondary-text transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div
          className={`absolute ${openUpwards ? "bottom-10" : "top-10"} left-0 right-0 z-[150] bg-bg-page/95 border border-divider/50 rounded shadow-xl max-h-56 overflow-y-auto overscroll-contain`}
        >
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-xs transition-colors hover:bg-primary hover:text-white ${
                value === opt
                  ? "bg-primary/15 text-primary font-bold"
                  : "text-secondary-text"
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
function CustomStyleSelect({ value, onChange, presets, label }) {
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
        <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded">
          Step 2
        </span>
        <span className="text-[11px] text-secondary-text font-bold">
          {label}
        </span>
      </div>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between text-xs text-primary-text bg-bg-page/80 border border-divider/50 rounded px-4 py-3.5 outline-none cursor-pointer hover:border-primary/50 transition-all w-full text-left"
      >
        <div className="flex flex-col text-left">
          <span className="font-black text-primary-text">
            {selectedPreset.label}
          </span>
          <span className="text-[10px] text-secondary-text font-medium mt-0.5">
            {selectedPreset.description}
          </span>
        </div>
        <FaChevronDown
          className={`text-xs text-secondary-text transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="absolute top-full mt-1 left-0 right-0 z-[150] bg-bg-page/95 border border-divider/50 rounded shadow-xl max-h-64 overflow-y-auto overscroll-contain p-2 flex flex-col gap-1">
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
                    ? "bg-primary text-white font-bold"
                    : "text-secondary-text hover:bg-bg-card-hover"
                }`}
              >
                <span className="text-xs font-bold">{preset.label}</span>
                <span
                  className={`text-[9px] mt-0.5 ${active ? "text-primary-btn-text" : "text-secondary-text"}`}
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
function CustomToggle({ checked, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between bg-bg-card/50 border border-divider/50 rounded p-4">
      <div className="flex flex-col">
        <span className="text-xs font-bold text-primary-text">{label}</span>
        {description && (
          <span className="text-[10px] text-secondary-text mt-0.5">
            {description}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
          checked ? "bg-primary" : "bg-divider/50"
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
      className="relative w-full h-full select-none overflow-hidden rounded bg-bg-page flex items-center justify-center cursor-ew-resize"
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
        <div className="h-8 w-8 rounded-full flex-shrink-0 bg-bg-card text-primary-text shadow-xl border border-divider/50 flex items-center justify-center text-xs font-bold pointer-events-none hover:scale-105 active:scale-95 transition-all">
          <FaExchangeAlt className="rotate-0 text-[10px]" />
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm border border-divider/50 text-[10px] text-secondary-text font-bold px-2 py-1 rounded select-none pointer-events-none">
        Original
      </div>
      <div className="absolute top-3 right-3 bg-primary/20 backdrop-blur-sm border border-primary/30 text-[10px] text-primary font-bold px-2 py-1 rounded select-none pointer-events-none">
        AI Artwork
      </div>
    </div>
  );
}

export default function StudioPage() {
  const { data: session, update: updateSession } = useSession();

  // Input states
  const [inputImage, setInputImage] = useState("");
  const [inputPreview, setInputPreview] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("oil-painting");
  const [customPrompt, setCustomPrompt] = useState(STYLE_PRESETS[0].prompt);
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
            setCustomPrompt(last.prompt || STYLE_PRESETS[0].prompt);
            const matchingStyle = STYLE_PRESETS.find(
              (s) => s.label === last.style,
            );
            if (matchingStyle) setSelectedStyle(matchingStyle.id);
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
            setGeneratingError("AI art generation failed. Please try again.");
            setGeneratingStatus("error");
          }
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [generatingStatus, creationId, updateSession]);

  const handleSelectStyle = (styleId) => {
    const s = STYLE_PRESETS.find((x) => x.id === styleId);
    if (s) {
      setSelectedStyle(styleId);
      setCustomPrompt(s.prompt);
    }
  };

  const handleUpload = async (e) => {
    if (!session?.user) {
      setGeneratingError("Please sign in with Google to upload selfies.");
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
      setGeneratingError("Please upload a selfie image first.");
      setGeneratingStatus("error");
      return;
    }

    setElapsedSeconds(0);
    setGeneratingStatus("generating");
    setGeneratingError("");
    setResultImage("");

    const sPreset = STYLE_PRESETS.find((x) => x.id === selectedStyle);
    const styleLabel = sPreset ? sPreset.label : "Oil Painting";

    try {
      const res = await fetch("/api/generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: inputImage,
          prompt: customPrompt,
          style: styleLabel,
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
    a.download = `magicself-${creationId}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = async () => {
    if (!creationId || !confirm("Delete this artwork?")) return;
    await fetch(`/api/creations?id=${creationId}`, { method: "DELETE" });
    setResultImage("");
    setCreationId("");
    setGeneratingStatus("idle");
  };

  const activePreset = STYLE_PRESETS.find((s) => s.id === selectedStyle);

  return (
    <div className="flex-1 overflow-y-auto bg-bg-page font-sans py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        {/* Sleek Centered Glass Header */}
        <div className="text-center max-w-2xl mx-auto flex flex-col gap-2">
          <h1 className="text-3xl sm:text-4xl font-black text-primary-text tracking-tight mt-2 bg-clip-text text-transparent bg-gradient-to-r from-primary-text via-secondary-text to-primary">
            MagicSelf AI Studio
          </h1>
          <p className="text-sm text-secondary-text max-w-md mx-auto leading-relaxed">
            Convert your portrait selfie photos into beautiful, styled artwork
            using advanced neural style transfers.
          </p>
        </div>

        {/* Main Fluid Glass Card Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form & Controls Panel: Left (Takes 7 cols on lg) */}
          <div className="lg:col-span-5 flex flex-col gap-6 bg-bg-card/60 border border-divider/50 backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-2xl relative">
            {/* Step 1: Upload */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded">
                  Step 1
                </span>
                <span className="text-[11px] text-secondary-text font-bold">
                  Upload Portrait Selfie
                </span>
              </div>

              {inputPreview ? (
                <div className="relative aspect-video sm:aspect-[21/9] rounded overflow-hidden border border-divider/50 bg-bg-page group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={inputPreview}
                    alt="Selfie Preview"
                    className="w-full h-full object-cover opacity-80"
                  />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute top-3.5 right-3.5 p-2 bg-black/70 hover:bg-red-650 text-white rounded-full opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-lg"
                    title="Remove selfie"
                  >
                    <FaTimes className="text-xs" />
                  </button>
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <FaSpinner className="animate-spin text-2xl text-primary" />
                    </div>
                  )}
                </div>
              ) : (
                <label className="border-2 border-dashed border-divider/50 hover:border-primary/50 rounded flex flex-col items-center justify-center p-8 sm:p-12 text-center cursor-pointer transition-all hover:bg-primary/5 group relative bg-bg-page/30">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    disabled={isUploading}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {isUploading ? (
                    <>
                      <FaSpinner className="animate-spin text-3xl text-primary mb-3" />
                      <span className="text-xs font-semibold text-primary-text">
                        Uploading to MuAPI CDN...
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="h-12 w-12 rounded bg-primary/10 border border-primary/20 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-300">
                        <FaUpload className="text-lg text-primary" />
                      </div>
                      <span className="text-xs font-bold text-primary-text">
                        Drag & Drop portrait selfie
                      </span>
                      <span className="text-[10px] text-secondary-text mt-1 font-medium">
                        or click to select file — JPG, PNG, WebP
                      </span>
                    </>
                  )}
                </label>
              )}
            </div>

            {/* Step 2: Select Style Dropdown */}
            <div className="flex flex-col gap-3">
              <CustomStyleSelect
                value={selectedStyle}
                onChange={handleSelectStyle}
                presets={STYLE_PRESETS}
                label="Select Masterpiece Style"
              />
            </div>

            {/* Step 3: Prompt Guidance */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded">
                  Step 3
                </span>
                <span className="text-[11px] text-secondary-text font-bold">
                  Refine Style Prompt (Editable)
                </span>
              </div>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={3}
                placeholder="Custom guide instructions for the AI model..."
                className="w-full text-xs text-primary-text bg-bg-page/80 border border-divider/50 focus:border-primary/50 rounded p-4 outline-none resize-none transition-all leading-relaxed shadow-inner"
              />
            </div>

            {/* Advanced Dashboard Drawer */}
            <div className="border border-divider/50 rounded-2xl bg-bg-page/20">
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="w-full flex items-center justify-between px-5 py-4 text-xs font-bold text-secondary-text hover:text-primary-text transition-colors cursor-pointer"
              >
                <span className="uppercase tracking-wider flex items-center gap-2">
                  <FaSlidersH className="text-primary" /> Model Configurations
                </span>
                {showAdvanced ? (
                  <FaChevronUp className="text-xs text-secondary-text" />
                ) : (
                  <FaChevronDown className="text-xs text-secondary-text" />
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
                      options={["Auto", "1:1", "3:4", "4:3", "9:16", "16:9"]}
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
                    />
                  </div>

                  {/* Google Search Custom Toggle */}
                  <CustomToggle
                    checked={googleSearch}
                    onChange={setGoogleSearch}
                    label="Search Concept Tuning"
                    description="Augment generation details using search indexing query references"
                  />
                </div>
              )}
            </div>

            {/* Action Trigger */}
            <button
              onClick={handleGenerate}
              disabled={
                generatingStatus === "generating" || isUploading || !inputImage
              }
              className="w-full flex items-center justify-center gap-2.5 py-4 text-sm font-black text-white bg-primary hover:bg-primary-hover active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed rounded shadow-lg shadow-primary/25 transition-all cursor-pointer"
            >
              {generatingStatus === "generating" ? (
                <>
                  <FaSpinner className="animate-spin text-sm" />
                  <span>Generating Artwork ({elapsedSeconds}s)...</span>
                </>
              ) : (
                <>
                  <FaMagic className="text-xs" />
                  <span>Create AI Artwork (12 Credits)</span>
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

          {/* Interactive Artwork Showcase Panel: Right (Takes 5 cols on lg) */}
          <div className="lg:col-span-7 flex flex-col bg-bg-card/60 border border-divider/50 backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-2xl relative min-h-[420px] lg:h-full justify-between">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-divider/50 pb-4 mb-4">
              <div>
                <h3 className="text-sm font-black text-primary-text">
                  Showcase Canvas
                </h3>
                <p className="text-[10px] text-secondary-text font-bold mt-0.5">
                  Interactive compare view
                </p>
              </div>

              {generatingStatus === "generating" && (
                <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
                  Rendering
                </span>
              )}
              {generatingStatus === "success" && (
                <span className="text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Finished
                </span>
              )}
            </div>

            {/* Display Canvas area */}
            <div className="flex-1 min-h-[280px] flex items-center justify-center relative rounded border border-divider/50 bg-bg-page/60 p-2 overflow-hidden shadow-inner">
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
                    alt="Selfie Input"
                    className="max-w-full max-h-full object-contain rounded opacity-75"
                  />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-bg-card/90 border border-divider/50 rounded-full px-4 py-1.5 text-[10px] text-secondary-text font-bold whitespace-nowrap shadow-lg">
                    Click &quot;Create AI Artwork&quot; to begin rendering
                  </div>
                </div>
              ) : generatingStatus === "generating" ? (
                <div className="text-center max-w-xs px-6">
                  <div className="relative mx-auto w-16 h-16 mb-4">
                    <div className="absolute inset-0 rounded bg-primary/15 border border-primary/30 flex items-center justify-center">
                      <FaSpinner className="animate-spin text-2xl text-primary" />
                    </div>
                  </div>
                  <h4 className="text-xs font-black text-primary-text">
                    Rendering Canvas
                  </h4>
                  <p className="text-[10px] text-secondary-text mt-1 leading-normal">
                    Transforming your portrait photo into a stylized{" "}
                    {activePreset?.label || "art"} masterpiece...
                  </p>
                  <div className="mt-4 inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-3 py-1">
                    <FaSpinner className="animate-spin text-[8px] text-primary" />
                    <span className="text-[9px] font-black text-primary">
                      {elapsedSeconds}s elapsed
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center max-w-xs px-6 py-10">
                  <div className="h-16 w-16 rounded bg-bg-card/80 border border-divider/50 flex items-center justify-center mx-auto mb-4">
                    <FaMagic className="text-2xl text-secondary-text" />
                  </div>
                  <h4 className="text-xs font-bold text-primary-text">
                    Canvas Empty
                  </h4>
                  <p className="text-[10px] text-secondary-text mt-1.5 leading-relaxed">
                    Upload your portrait selfie and choose a custom style to
                    render your artwork.
                  </p>
                </div>
              )}
            </div>

            {/* Actions for output */}
            {resultImage && (
              <div className="flex gap-3 mt-5 border-t border-divider/50 pt-4 flex-shrink-0">
                <button
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary-hover text-white rounded text-xs font-black shadow-lg shadow-primary/20 cursor-pointer transition-all hover:scale-[1.01]"
                >
                  <FaDownload />
                  <span>Download Masterpiece</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-3 bg-bg-page hover:bg-red-955/20 hover:text-red-400 border border-divider/50 hover:border-red-500/20 text-secondary-text rounded text-xs font-bold transition-all cursor-pointer"
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
