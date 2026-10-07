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
  FaHome,
  FaChevronDown,
  FaChevronUp,
  FaSlidersH,
  FaExchangeAlt,
  FaChevronLeft,
} from "react-icons/fa";

// ── 12 Gorgeous Interior Room Presets ─────────────────────────────────────────
const PRESETS = [
  {
    id: "modern-living",
    label: "Modern Living Room",
    type: "Living Room",
    image:
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=600",
    description:
      "Declutter and organize living room into a sleek, clean, modern design.",
    prompt:
      "Declutter this messy living room. Remove all toys, trash, excess cables, and visual clutter from the floor and tables. Render a beautiful, tidy, minimalist modern living room. Bright sunny daylight, photorealistic interior design, clean hardwood floor, sophisticated styling, natural shadows and reflections.",
  },
  {
    id: "cozy-bedroom",
    label: "Cozy Bedroom",
    type: "Bedroom",
    image:
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=600",
    description: "Remove messy clothes and tidy up bedroom surfaces.",
    prompt:
      "Declutter this bedroom. Clear away all piles of clothes, messy blankets, and loose objects. Make the bed neatly with clean white sheets. Create a cozy, clean, and organized bedroom atmosphere. Warm evening ambient lighting, photorealistic interior design, photorealistic fabric textures.",
  },
  {
    id: "minimal-office",
    label: "Minimalist Office",
    type: "Office",
    image:
      "https://images.unsplash.com/photo-1493934558415-9d19f0b2b4d2?q=80&w=600",
    description: "Clear desk clutter and cables for a productive study space.",
    prompt:
      "Declutter this home office desk. Remove scattered papers, coffee mugs, and loose cables. Render a neat, clean, minimalist study workspace. Modern desk setup, warm desk lamp lighting, clean shelves, professional productivity vibe, photorealistic.",
  },
  {
    id: "boho-dining",
    label: "Bohemian Dining",
    type: "Dining Room",
    image:
      "https://images.unsplash.com/photo-1617806118233-18e1de247200?q=80&w=600",
    description: "Clean dining table and set up elegant bohemian dining ware.",
    prompt:
      "Declutter this dining room table. Remove all dirty plates, leftover food, and trash. Render a clean dining area with a polished wooden table, elegant bohemian tableware, and natural plant decorations. Soft window light, photorealistic.",
  },
  {
    id: "industrial-loft",
    label: "Industrial Loft",
    type: "Loft",
    image:
      "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?q=80&w=600",
    description: "Declutter loft space with brick accents and clean furniture.",
    prompt:
      "Declutter this loft space. Remove excess boxes, scattered objects, and clutter. Render a spacious, clean industrial loft apartment. Exposed brick wall, large clean windows, minimalist industrial furniture, warm lighting, photorealistic.",
  },
  {
    id: "scandi-study",
    label: "Scandinavian Study",
    type: "Study",
    image:
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=600",
    description: "Organize bookshelves and desks into a bright Nordic theme.",
    prompt:
      "Declutter this study room. Remove messy papers and organize the bookshelves. Render a clean, bright Scandinavian study room with white walls, light wood textures, minimalist chair, and green house plants. Bright natural light, photorealistic.",
  },
  {
    id: "sleek-kitchen",
    label: "Sleek Kitchen",
    type: "Kitchen",
    image:
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=600",
    description: "Remove dishes and clean countertops for a modern kitchen.",
    prompt:
      "Declutter this kitchen counter. Remove all dirty dishes, sponges, and clutter. Render a clean, sleek, modern kitchen with polished marble countertops, clean cabinets, and built-in appliances. Bright daylight reflections, photorealistic.",
  },
  {
    id: "rustic-den",
    label: "Rustic Den",
    type: "Den",
    image:
      "https://images.unsplash.com/photo-1595428774223-ef52624120d2?q=80&w=600",
    description: "Tidy up cozy reading corners and wooden hearths.",
    prompt:
      "Declutter this den reading corner. Clear away scattered magazines and cushions on the floor. Render a clean, tidy rustic den with a comfortable leather armchair, organized bookshelves, and warm fireplace glow. Photorealistic.",
  },
  {
    id: "luxury-suite",
    label: "Contemporary Suite",
    type: "Suite",
    image:
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=600",
    description: "Declutter luxury hotel-style suites for a clean look.",
    prompt:
      "Declutter this master bedroom suite. Clear all personal belongings and clutter. Render a premium, clean contemporary suite with neat bedding, soft velvet accents, and luxury hotel lighting. Elegant and photorealistic.",
  },
  {
    id: "classic-lounge",
    label: "Classic Lounge",
    type: "Lounge",
    image:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=600",
    description: "Clear visual noise from classic lobby layouts.",
    prompt:
      "Declutter this lounge seating area. Remove scattered trash and messy pillows. Render a clean, classic lounge with pristine armchairs, tidy side tables, and clean carpets. Bright welcoming atmosphere, photorealistic.",
  },
  {
    id: "kids-nursery",
    label: "Airy Nursery",
    type: "Nursery",
    image:
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=600",
    description: "Organize children toys into beautiful, tidy storage bins.",
    prompt:
      "Declutter this kids nursery. Gather scattered toys off the floor and place them neatly in storage bins. Render a clean, airy, bright baby nursery. Pastel colors, neat crib, soft carpet, safe and organized environment, photorealistic.",
  },
  {
    id: "zen-studio",
    label: "Zen Studio",
    type: "Studio",
    image:
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=600",
    description: "Tidy up creative studio spaces for a clean zen look.",
    prompt:
      "Declutter this studio space. Remove clutter and visual mess. Render a calm, clean Zen yoga and meditation studio with polished wooden flooring, simple cushions, and soft ambient light. Clean and photorealistic.",
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
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
        {label}
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between text-xs text-slate-700 bg-white border border-slate-200 rounded px-3.5 py-2.5 outline-none hover:border-indigo-500/50 transition-colors w-full cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
      >
        <span>{value}</span>
        <FaChevronDown
          className={`text-[10px] text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && !disabled && (
        <div
          className={`absolute ${openUpwards ? "bottom-full mb-1" : "top-full mt-1"} left-0 right-0 z-[150] bg-white border border-slate-200 rounded shadow-xl max-h-56 overflow-y-auto overscroll-contain`}
        >
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-xs transition-colors hover:bg-indigo-600 hover:text-white ${
                value === opt
                  ? "bg-indigo-50 text-indigo-600 font-bold"
                  : "text-slate-700"
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
      className={`flex items-center justify-between bg-slate-50 border border-slate-200 rounded p-4 ${disabled ? "opacity-35" : ""}`}
    >
      <div className="flex flex-col">
        <span className="text-xs font-bold text-slate-800">{label}</span>
        {description && (
          <span className="text-[10px] text-slate-400 mt-0.5">
            {description}
          </span>
        )}
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none disabled:cursor-not-allowed ${
          checked ? "bg-indigo-600" : "bg-slate-200"
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
        Cluttered Messy Room
      </div>
      <div className="absolute top-3 right-3 bg-indigo-950/60 backdrop-blur-sm border border-indigo-800 text-[10px] text-indigo-300 font-bold px-2 py-1 rounded select-none pointer-events-none">
        AI Decluttered Clean
      </div>
    </div>
  );
}

export default function StudioPage() {
  const { data: session, update: updateSession } = useSession();

  // Input states
  const [inputImage, setInputImage] = useState("");
  const [inputPreview, setInputPreview] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState("modern-living");
  const [customPrompt, setCustomPrompt] = useState(PRESETS[0].prompt);
  const [modelName, setModelName] = useState("nano-banana-2-edit");
  const [aspectRatio, setAspectRatio] = useState("Auto");
  const [resolution, setResolution] = useState("1k");
  const [outputFormat, setOutputFormat] = useState("jpg");
  const [googleSearch, setGoogleSearch] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
            setCustomPrompt(last.prompt || PRESETS[0].prompt);
            setModelName(last.modelName || "nano-banana-2-edit");
            const matchedPreset = PRESETS.find(
              (p) =>
                p.type.includes(last.roomType) ||
                last.roomType.includes(p.type) ||
                last.roomType.includes(p.label),
            );
            if (matchedPreset) setSelectedPresetId(matchedPreset.id);
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
              "Room decluttering generation failed. Please try again.",
            );
            setGeneratingStatus("error");
          }
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [generatingStatus, creationId, updateSession]);

  const handleSelectPreset = (preset) => {
    if (!session?.user) {
      signIn("google");
      return;
    }
    setSelectedPresetId(preset.id);
    setCustomPrompt(preset.prompt);
  };

  const handleUpload = async (e) => {
    if (!session?.user) {
      signIn("google");
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
      setGeneratingError("Please upload a messy room photo first.");
      setGeneratingStatus("error");
      return;
    }

    setElapsedSeconds(0);
    setGeneratingStatus("generating");
    setGeneratingError("");
    setResultImage("");

    const activePreset = PRESETS.find((p) => p.id === selectedPresetId);

    try {
      const res = await fetch("/api/generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: inputImage,
          prompt: customPrompt,
          roomType: activePreset?.type || "Living Room",
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
    a.download = `declutter-${creationId}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = async () => {
    if (!creationId || !confirm("Delete this decluttered creation?")) return;
    await fetch(`/api/creations?id=${creationId}`, { method: "DELETE" });
    setResultImage("");
    setCreationId("");
    setGeneratingStatus("idle");
  };

  const activePreset =
    PRESETS.find((p) => p.id === selectedPresetId) || PRESETS[0];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 font-sans py-8 px-4 sm:px-6 relative">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        {/* Header Title */}
        <div className="text-center max-w-2xl mx-auto flex flex-col gap-2 mb-2">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-600">
            Declutter and Clean Messy Rooms
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Upload your cluttered interior photo, choose a preset styling
            concept, and generate a photorealistic clean view instantly.
          </p>
        </div>

        {/* Lightroom-style 2-Column Studio Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* COLUMN 1: Full-featured Left Sidebar (lg:col-span-5) */}
          <div className="lg:col-span-5 flex flex-col gap-5 bg-white border border-slate-200/80 rounded p-5 sm:p-6 shadow-sm justify-between">
            <div className="flex flex-col gap-5">
              {/* Model selection */}
              <div className="flex flex-col gap-2">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                  Select AI Scenic Model
                </span>
                <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 border border-slate-200 rounded">
                  <button
                    type="button"
                    onClick={() => {
                      if (!session?.user) {
                        signIn("google");
                        return;
                      }
                      setModelName("nano-banana-2-edit");
                    }}
                    className={`py-1.5 text-[10px] font-black rounded transition-all cursor-pointer ${
                      modelName === "nano-banana-2-edit"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Standard (v2 Edit)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!session?.user) {
                        signIn("google");
                        return;
                      }
                      setModelName("nano-banana-pro-edit");
                    }}
                    className={`py-1.5 text-[10px] font-black rounded transition-all cursor-pointer ${
                      modelName === "nano-banana-pro-edit"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Pro (Enhanced)
                  </button>
                </div>
              </div>

              {/* Step 1: Upload Cluttered Room Photo */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    Step 1
                  </span>
                  <span className="text-[10px] text-slate-600 font-bold">
                    Upload Cluttered Room Photo
                  </span>
                </div>

                {inputPreview ? (
                  <div className="relative aspect-video rounded overflow-hidden border border-slate-200 bg-slate-50 group shadow-inner">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={inputPreview}
                      alt="Room Input Preview"
                      className="w-full h-full object-cover opacity-90"
                    />
                    <button
                      onClick={handleRemoveImage}
                      className="absolute top-2.5 right-2.5 p-1.5 bg-white/90 hover:bg-red-50 hover:text-red-600 text-slate-600 border border-slate-200 rounded-full opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-md"
                      title="Remove photo"
                    >
                      <FaTimes className="text-[9px]" />
                    </button>
                    {isUploading && (
                      <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                        <FaSpinner className="animate-spin text-xl text-indigo-600" />
                      </div>
                    )}
                  </div>
                ) : (
                  <label className="aspect-video border border-dashed border-slate-300 hover:border-indigo-500/50 rounded flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all hover:bg-indigo-50/5 group relative bg-slate-50/50">
                    <input
                      id="room-file-input"
                      type="file"
                      accept="image/*"
                      onClick={(e) => {
                        if (!session?.user) {
                          e.preventDefault();
                          signIn("google");
                        }
                      }}
                      onChange={handleUpload}
                      disabled={isUploading}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    {isUploading ? (
                      <>
                        <FaSpinner className="animate-spin text-2xl text-indigo-600 mb-2" />
                        <span className="text-[10px] font-semibold text-slate-600">
                          Uploading to Storage...
                        </span>
                      </>
                    ) : (
                      <>
                        <FaUpload className="text-sm text-indigo-600 mb-2 group-hover:scale-105 transition-transform duration-300" />
                        <span className="text-[10px] font-bold text-slate-700">
                          Drag & Drop room image
                        </span>
                        <span className="text-[8px] text-slate-400 mt-0.5">
                          JPG, PNG, WebP
                        </span>
                      </>
                    )}
                  </label>
                )}
              </div>

              {/* Step 2: Select Room Preset Styling Grid directly in Sidebar */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      Step 2
                    </span>
                    <span className="text-[10px] text-slate-600 font-bold">
                      Select Room Preset
                    </span>
                  </div>
                  <span className="text-[8px] text-slate-400 font-bold">
                    12 Styles Inline
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pr-1 py-1">
                  {PRESETS.map((preset) => {
                    const active = selectedPresetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className={`aspect-[4/3] flex-shrink-0 relative w-full text-left border rounded overflow-hidden shadow-sm transition-all cursor-pointer group hover:scale-[1.02] outline-none ${
                          active
                            ? "border-indigo-600 ring-2 ring-indigo-600/10"
                            : "border-slate-200 bg-slate-50 hover:border-slate-300"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={preset.image}
                          alt={preset.label}
                          className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                        {active && (
                          <div className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse shadow-lg" />
                        )}

                        {/* Name indication directly on the image */}
                        <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/20 flex flex-col">
                          <span className="text-[10px] font-bold text-slate-100 truncate">
                            {preset.label}
                          </span>
                          <span className="text-[6px] text-blue-200 font-medium truncate mt-0.5">
                            {preset.type}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Prompt Text Input */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    Step 3
                  </span>
                  <span className="text-[10px] text-slate-600 font-bold">
                    Declutter Prompt (Editable)
                  </span>
                </div>
                <textarea
                  id="declutter-prompt-input"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  onFocus={() => {
                    if (!session?.user) {
                      signIn("google");
                    }
                  }}
                  rows={3}
                  placeholder="Specify clutter removal and design details..."
                  className="w-full text-[11px] text-slate-800 bg-white border border-slate-200 focus:border-indigo-500 rounded p-3 outline-none resize-none transition-all leading-relaxed shadow-sm"
                />
              </div>

              {/* Advanced Dashboard Drawer */}
              <div className="border border-slate-200 rounded bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => {
                    if (!session?.user) {
                      signIn("google");
                      return;
                    }
                    setShowAdvanced((v) => !v);
                  }}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-[10px] font-black text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <span className="uppercase tracking-wider flex items-center gap-1.5">
                    <FaSlidersH className="text-indigo-600" /> Advanced Options
                  </span>
                  {showAdvanced ? (
                    <FaChevronUp className="text-[9px] text-slate-400" />
                  ) : (
                    <FaChevronDown className="text-[9px] text-slate-400" />
                  )}
                </button>

                {showAdvanced && (
                  <div className="px-4 pb-4 flex flex-col gap-3">
                    <div className="grid grid-cols-3 gap-2">
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

                    <CustomToggle
                      checked={googleSearch}
                      onChange={setGoogleSearch}
                      label="Google Concept Search"
                      description="Enhance details via global staging checks (Standard only)"
                      disabled={modelName === "nano-banana-pro-edit"}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-4">
              <button
                id="generate-declutter-btn"
                onClick={handleGenerate}
                disabled={
                  generatingStatus === "generating" ||
                  isUploading ||
                  (session?.user && !inputImage)
                }
                className="w-full flex items-center justify-center gap-2 py-3.5 text-xs font-black text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-755 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed rounded shadow-md shadow-indigo-500/10 transition-all cursor-pointer font-black"
              >
                {generatingStatus === "generating" ? (
                  <>
                    <FaSpinner className="animate-spin text-xs" />
                    <span>Processing ({elapsedSeconds}s)...</span>
                  </>
                ) : (
                  <>
                    <FaHome className="text-[10px]" />
                    <span>
                      Generate Clean View (
                      {modelName === "nano-banana-pro-edit"
                        ? resolution === "4k"
                          ? 36
                          : 24
                        : resolution === "4k"
                          ? 24
                          : resolution === "2k"
                            ? 18
                            : 12}{" "}
                      Credits)
                    </span>
                  </>
                )}
              </button>

              {generatingError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded p-3">
                  <FaTimesCircle className="text-red-600 flex-shrink-0 mt-0.5 text-xs" />
                  <p className="text-[10px] text-red-800 font-bold leading-normal">
                    {generatingError}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 2: Output Showcase Canvas (lg:col-span-7) */}
          <div className="lg:col-span-7 flex flex-col bg-white border border-slate-200 rounded p-5 sm:p-6 shadow-sm justify-between min-h-[440px] lg:min-h-0">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-shrink-0 mb-4">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Showcase Canvas
                </h3>
                <p className="text-[8px] text-slate-500 font-bold mt-0.5">
                  Wipe vertical slider to compare messy vs. clean room options
                </p>
              </div>

              {generatingStatus === "generating" && (
                <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping" />
                  Cleaning
                </span>
              )}
              {generatingStatus === "success" && (
                <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  Ready
                </span>
              )}
            </div>

            {/* Display Canvas area */}
            <div className="flex-1 min-h-[300px] flex items-center justify-center relative rounded border border-slate-200 bg-slate-50/50 p-2 overflow-hidden shadow-inner">
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
                    alt="Room Input preview"
                    className="max-w-full max-h-full object-contain rounded opacity-90"
                  />
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-full px-3.5 py-1.5 text-[9px] text-indigo-600 font-bold whitespace-nowrap shadow-md">
                    Press &quot;Generate Clean View&quot; to declutter
                  </div>
                </div>
              ) : generatingStatus === "generating" ? (
                <div className="text-center max-w-xs px-4">
                  <div className="relative mx-auto w-12 h-12 mb-3">
                    <div className="absolute inset-0 rounded bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-sm">
                      <FaSpinner className="animate-spin text-xl text-indigo-600" />
                    </div>
                  </div>
                  <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wider">
                    Cleaning Room...
                  </h4>
                  <p className="text-[8px] text-slate-500 mt-1 leading-normal">
                    Removing objects and rendering interior details with{" "}
                    {activePreset.label}...
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1 bg-indigo-50 border border-indigo-100 rounded-full px-2.5 py-0.5">
                    <FaSpinner className="animate-spin text-[6px] text-indigo-600" />
                    <span className="text-[8px] font-black text-indigo-600">
                      {elapsedSeconds}s elapsed
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center max-w-xs px-4 py-8">
                  <div className="h-12 w-12 rounded bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-3 shadow-sm">
                    <FaHome className="text-lg text-slate-400 animate-pulse" />
                  </div>
                  <h4 className="text-[10px] font-bold text-slate-700">
                    Empty Studio Canvas
                  </h4>
                  <p className="text-[9px] text-slate-500 mt-1 leading-relaxed">
                    Upload your cluttered room photo, select a room style preset
                    in the left sidebar, and watch it clean instantly.
                  </p>
                </div>
              )}
            </div>

            {/* Actions for output */}
            {resultImage && (
              <div className="flex gap-2.5 mt-4 border-t border-slate-200 pt-3.5 flex-shrink-0">
                <button
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-755 text-white rounded text-xs font-black shadow-md cursor-pointer transition-all hover:scale-[1.01]"
                >
                  <FaDownload className="text-[10px]" />
                  <span>Download Clean View</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="px-3.5 py-2.5 bg-white hover:bg-red-50 hover:text-red-600 border border-slate-200 hover:border-red-200 text-slate-500 rounded text-xs font-bold transition-all cursor-pointer shadow-sm"
                  title="Delete creation"
                >
                  <FaTrashAlt className="text-[10px]" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
