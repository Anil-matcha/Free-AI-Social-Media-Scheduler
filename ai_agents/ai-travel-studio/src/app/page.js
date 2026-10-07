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
  FaGlobe,
  FaChevronDown,
  FaChevronUp,
  FaSlidersH,
  FaExchangeAlt,
} from "react-icons/fa";

// ── 12 Iconic Global Landmark Presets ──────────────────────────────────────────
const DESTINATIONS = [
  {
    id: "paris-eiffel",
    label: "Eiffel Tower",
    location: "Paris, France",
    image:
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=600",
    description:
      "Charming sunset golden hour view in front of the Eiffel Tower.",
    prompt:
      "Place this person standing in front of the iconic Eiffel Tower in Paris, France. High-quality professional travel photograph, warm sunset golden hour lighting, cinematic background blur, photorealistic skin and textures, natural blending.",
  },
  {
    id: "tokyo-cherry",
    label: "Cherry Blossoms",
    location: "Tokyo, Japan",
    image:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=600",
    description:
      "Stunning spring scenery under blooming sakura trees in Tokyo.",
    prompt:
      "Place this person walking in a historic street in Kyoto/Tokyo, surrounded by blooming pink cherry blossom sakura trees. Sunny spring day, soft daylight, premium tourist snapshot look, clean facial geometry, natural lighting integration.",
  },
  {
    id: "rome-colosseum",
    label: "Colosseum",
    location: "Rome, Italy",
    image:
      "https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=600",
    description: "Classic travel blogger posture before the ancient Colosseum.",
    prompt:
      "Place this person posing in front of the ancient Colosseum in Rome, Italy. Bright sunny morning, vibrant blue sky, travel blogger photo style, high fidelity, naturally integrated portrait, detailed ambient shadows.",
  },
  {
    id: "maldives-beach",
    label: "Sandy Beach",
    location: "Maldives",
    image:
      "https://images.unsplash.com/photo-1506929562872-bb421503ef21?q=80&w=600",
    description:
      "Crystal clear turquoise ocean waves and pristine white sands.",
    prompt:
      "Place this person relaxing on a white sand beach in the Maldives, turquoise crystal-clear tropical ocean in the background, swaying palm trees. Sunny warm summer day, professional luxury holiday capture, realistic ambient reflections.",
  },
  {
    id: "egypt-pyramids",
    label: "Pyramids",
    location: "Cairo, Egypt",
    image:
      "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?q=80&w=600",
    description: "Adventurous desert skyline beside the Pyramids of Giza.",
    prompt:
      "Place this person standing in the golden desert dunes with the majestic Pyramids of Giza in Cairo, Egypt in the background. Soft warm sun, desert adventure aesthetic, natural lighting blend, crisp facial details.",
  },
  {
    id: "swiss-alps",
    label: "Swiss Alps",
    location: "Zermatt, Switzerland",
    image:
      "https://images.unsplash.com/photo-1502784444187-359ac186c5bb?q=80&w=600",
    description: "Cozy winter mountain peaks with pure snow in Zermatt.",
    prompt:
      "Place this person wearing cozy winter gear in front of the snowy Swiss Alps mountain range in Zermatt, Switzerland. Cozy alpine village in the background, crisp bright snow reflection, cinematic photography, high detail skin rendering.",
  },
  {
    id: "ny-times-square",
    label: "Times Square",
    location: "New York, USA",
    image:
      "https://images.unsplash.com/photo-1534430480872-3498386e7856?q=80&w=600",
    description: "Vibrant city night life surrounded by glowing billboards.",
    prompt:
      "Place this person walking at night in Times Square, New York City, surrounded by bright glowing neon billboards, yellow taxi cabs, and city lights. Vibrant urban evening, detailed reflections, realistic skin texture.",
  },
  {
    id: "india-taj-mahal",
    label: "Taj Mahal",
    location: "Agra, India",
    image:
      "https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=600",
    description: "Pastel sunrise reflection over the white marble wonder.",
    prompt:
      "Place this person standing in front of the majestic white marble Taj Mahal in Agra, India. Soft morning fog, sunrise pastel skies, reflection pool, professional travel photography, warm soft volumetric lighting.",
  },
  {
    id: "sydney-opera",
    label: "Opera House",
    location: "Sydney, Australia",
    image:
      "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?q=80&w=600",
    description: "Sunny harbour snapshot at the iconic Circular Quay.",
    prompt:
      "Place this person standing at Circular Quay with the Sydney Opera House and harbour bridge in the background. Bright sunny day, crisp water reflections, modern tourist travel snapshot look, natural ambient lighting.",
  },
  {
    id: "london-big-ben",
    label: "Big Ben",
    location: "London, UK",
    image:
      "https://images.unsplash.com/photo-1486299267070-83823f5448dd?q=80&w=600",
    description: "Classic double-decker bus passing along Westminster bridge.",
    prompt:
      "Place this person walking along the Westminster Bridge with Big Ben and a red double-decker bus behind them. Slightly overcast classic London afternoon, photorealistic cinematic travel photograph, soft cool ambient shadows.",
  },
  {
    id: "bali-waterfall",
    label: "Jungle Waterfall",
    location: "Bali, Indonesia",
    image:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=600",
    description: "Vibrant tropical jungle streams and mist adventure.",
    prompt:
      "Place this person in a lush tropical jungle in Bali, next to a spectacular rushing Tegenungan waterfall. Soft sunlight filtering through green palm leaves, mist, adventure travel portrait, realistic skin tones, high detail background.",
  },
  {
    id: "venice-canal",
    label: "Gondola Canal",
    location: "Venice, Italy",
    image:
      "https://images.unsplash.com/photo-1527631746610-bca00a040d60?q=80&w=600",
    description: "Romantic gondola ride floating by pastel buildings.",
    prompt:
      "Place this person sitting in a traditional gondola floating down a scenic canal in Venice, Italy. Historic pastel-colored buildings, gentle water ripples, romantic summer day capture, warm sunny atmosphere.",
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
        className="flex items-center justify-between text-xs text-zinc-200 bg-zinc-950/80 border border-zinc-800 rounded px-3.5 py-2.5 outline-none hover:border-teal-500/50 transition-colors w-full cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          borderWidth: "1px",
          borderStyle: "solid",
        }}
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
              className={`w-full text-left px-4 py-2.5 text-xs transition-colors hover:bg-teal-500 hover:text-zinc-950 ${
                value === opt
                  ? "bg-teal-500/20 text-teal-400 font-bold"
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
          checked ? "bg-teal-500" : "bg-zinc-800"
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
        Original Selfie
      </div>
      <div className="absolute top-3 right-3 bg-teal-950/60 backdrop-blur-sm border border-teal-800 text-[10px] text-teal-300 font-bold px-2 py-1 rounded select-none pointer-events-none">
        AI Travel Swapped
      </div>
    </div>
  );
}

export default function StudioPage() {
  const { data: session, update: updateSession } = useSession();

  // Input states
  const [inputImage, setInputImage] = useState("");
  const [inputPreview, setInputPreview] = useState("");
  const [selectedDestId, setSelectedDestId] = useState("paris-eiffel");
  const [customPrompt, setCustomPrompt] = useState(DESTINATIONS[0].prompt);
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
            setCustomPrompt(last.prompt || DESTINATIONS[0].prompt);
            setModelName(last.modelName || "nano-banana-2-edit");
            const matchedDest = DESTINATIONS.find(
              (d) =>
                d.label.includes(last.destination) ||
                last.destination.includes(d.label) ||
                last.destination.includes(d.location),
            );
            if (matchedDest) setSelectedDestId(matchedDest.id);
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
              "Scenic travel background generation failed. Please try again.",
            );
            setGeneratingStatus("error");
          }
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [generatingStatus, creationId, updateSession]);

  const handleSelectDestination = (dest) => {
    setSelectedDestId(dest.id);
    setCustomPrompt(dest.prompt);
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
      setGeneratingError("Please upload a portrait photo first.");
      setGeneratingStatus("error");
      return;
    }

    setElapsedSeconds(0);
    setGeneratingStatus("generating");
    setGeneratingError("");
    setResultImage("");

    const activeDest = DESTINATIONS.find((d) => d.id === selectedDestId);

    try {
      const res = await fetch("/api/generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: inputImage,
          prompt: customPrompt,
          destination: activeDest?.label || "Paris",
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
    a.download = `travel-${creationId}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = async () => {
    if (!creationId || !confirm("Delete this travel creation?")) return;
    await fetch(`/api/creations?id=${creationId}`, { method: "DELETE" });
    setResultImage("");
    setCreationId("");
    setGeneratingStatus("idle");
  };

  const activeDest =
    DESTINATIONS.find((d) => d.id === selectedDestId) || DESTINATIONS[0];

  return (
    <div className="flex-1 overflow-y-auto bg-bg-page font-sans py-8 px-4 sm:px-6 relative">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        {/* Sleek Header */}
        <div className="text-center max-w-2xl mx-auto flex flex-col gap-2 mb-2">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-2 bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-teal-400">
            Generate Photorealistic Travel Snapshots
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
            Upload your portrait selfie, pick a landmark in the sidebar grid,
            and teleport yourself there instantly.
          </p>
        </div>

        {/* Lightroom-style 2-Column Studio Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* COLUMN 1: Full-featured Left Sidebar (lg:col-span-5) */}
          <div className="lg:col-span-5 flex flex-col gap-5 bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md rounded p-5 sm:p-6 shadow-2xl justify-between">
            <div className="flex flex-col gap-5">
              {/* Model Selection Selector */}
              <div className="flex flex-col gap-2">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">
                  Select AI Scenic Model
                </span>
                <div className="grid grid-cols-2 gap-1 bg-zinc-950 p-1 border border-zinc-800/80 rounded">
                  <button
                    type="button"
                    onClick={() => setModelName("nano-banana-2-edit")}
                    className={`py-1.5 text-[10px] font-black rounded transition-all cursor-pointer ${
                      modelName === "nano-banana-2-edit"
                        ? "bg-teal-500 text-zinc-950 shadow-md"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    Standard (v2 Edit)
                  </button>
                  <button
                    type="button"
                    onClick={() => setModelName("nano-banana-pro-edit")}
                    className={`py-1.5 text-[10px] font-black rounded transition-all cursor-pointer ${
                      modelName === "nano-banana-pro-edit"
                        ? "bg-teal-500 text-zinc-950 shadow-md"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    Pro (Enhanced)
                  </button>
                </div>
              </div>

              {/* Step 1: Upload Portrait */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-wider text-teal-400 bg-teal-950/40 px-2 py-0.5 rounded border border-teal-900/40">
                    Step 1
                  </span>
                  <span className="text-[10px] text-zinc-400 font-bold">
                    Upload Portrait Selfie
                  </span>
                </div>

                {inputPreview ? (
                  <div className="relative aspect-video rounded overflow-hidden border border-zinc-800 bg-zinc-950 group shadow-inner">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={inputPreview}
                      alt="Selfie Input Preview"
                      className="w-full h-full object-cover opacity-80"
                    />
                    <button
                      onClick={handleRemoveImage}
                      className="absolute top-2.5 right-2.5 p-1.5 bg-black/70 hover:bg-red-600 text-white rounded-full opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-lg border border-zinc-800"
                      title="Remove photo"
                    >
                      <FaTimes className="text-[9px]" />
                    </button>
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <FaSpinner className="animate-spin text-xl text-teal-400" />
                      </div>
                    )}
                  </div>
                ) : (
                  <label className="aspect-video border border-dashed border-zinc-800 hover:border-teal-500/50 rounded flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all hover:bg-teal-950/5 group relative bg-zinc-950/30">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUpload}
                      disabled={isUploading}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    {isUploading ? (
                      <>
                        <FaSpinner className="animate-spin text-2xl text-teal-400 mb-2" />
                        <span className="text-[10px] font-semibold text-zinc-300">
                          Uploading to Storage...
                        </span>
                      </>
                    ) : (
                      <>
                        <FaUpload className="text-sm text-teal-400 mb-2 group-hover:scale-105 transition-transform duration-300" />
                        <span className="text-[10px] font-bold text-zinc-200">
                          Drag & Drop selfie image
                        </span>
                        <span className="text-[8px] text-zinc-500 mt-0.5">
                          JPG, PNG, WebP
                        </span>
                      </>
                    )}
                  </label>
                )}
              </div>

              {/* Step 2: Select Travel Destination Grid directly in Sidebar */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between border-b border-zinc-800/60 pb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-teal-400 bg-teal-950/40 px-2 py-0.5 rounded border border-teal-900/40">
                      Step 2
                    </span>
                    <span className="text-[10px] text-zinc-400 font-bold">
                      Select Landmark Presets
                    </span>
                  </div>
                  <span className="text-[8px] text-zinc-500 font-bold">
                    12 Places Inline
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 overflow-y-auto overscroll-contain pr-1 py-1">
                  {DESTINATIONS.map((dest) => {
                    const active = selectedDestId === dest.id;
                    return (
                      <button
                        key={dest.id}
                        type="button"
                        onClick={() => handleSelectDestination(dest)}
                        className={`relative text-left border rounded overflow-hidden shadow aspect-[4/3] flex flex-col transition-all cursor-pointer group hover:scale-[1.02] outline-none ${
                          active
                            ? "border-teal-500 ring-2 ring-teal-500/20"
                            : "border-zinc-800 bg-zinc-950/30 hover:border-zinc-700"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={dest.image}
                          alt={dest.label}
                          className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />

                        {active && (
                          <div className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse shadow-lg" />
                        )}

                        {/* Name indication directly on the image */}
                        <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/60 backdrop-blur-[3px] flex flex-col">
                          <span className="text-[8px] font-black text-white leading-tight truncate">
                            {dest.label}
                          </span>
                          <span className="text-[6px] text-teal-400 font-medium truncate mt-0.5">
                            {dest.location.split(",")[0]}
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
                  <span className="text-[9px] font-black uppercase tracking-wider text-teal-400 bg-teal-950/40 px-2 py-0.5 rounded border border-teal-900/40">
                    Step 3
                  </span>
                  <span className="text-[10px] text-zinc-400 font-bold">
                    Background Swap Prompt (Editable)
                  </span>
                </div>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  rows={3}
                  placeholder="Modify travel setting (warm sun, blogger style, soft golden hour lighting etc.)"
                  className="w-full text-[11px] text-zinc-200 bg-zinc-950/80 border border-zinc-800 focus:border-teal-500/50 rounded p-3 outline-none resize-none transition-all leading-relaxed shadow-inner"
                />
              </div>

              {/* Advanced Dashboard Drawer */}
              <div className="border border-zinc-800/80 rounded bg-zinc-950/20">
                <button
                  type="button"
                  onClick={() => setShowAdvanced((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-[10px] font-black text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  <span className="uppercase tracking-wider flex items-center gap-1.5">
                    <FaSlidersH className="text-teal-400" /> Advanced Options
                  </span>
                  {showAdvanced ? (
                    <FaChevronUp className="text-[9px] text-zinc-400" />
                  ) : (
                    <FaChevronDown className="text-[9px] text-zinc-400" />
                  )}
                </button>

                {showAdvanced && (
                  <div className="px-4 pb-4 flex flex-col gap-3">
                    {/* Custom dropdowns grid */}
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

                    {/* Google Search Custom Toggle */}
                    <CustomToggle
                      checked={googleSearch}
                      onChange={setGoogleSearch}
                      label="Google Concept Search"
                      description="Enhance landmarks via global checks (Standard only)"
                      disabled={modelName === "nano-banana-pro-edit"}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-4">
              {/* Action Trigger */}
              <button
                onClick={handleGenerate}
                disabled={
                  generatingStatus === "generating" ||
                  isUploading ||
                  (session?.user && !inputImage)
                }
                className="w-full flex items-center justify-center gap-2 py-3.5 text-xs font-black text-zinc-950 bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-500 hover:to-emerald-600 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed rounded shadow-lg shadow-teal-500/25 transition-all cursor-pointer font-black"
              >
                {generatingStatus === "generating" ? (
                  <>
                    <FaSpinner className="animate-spin text-xs" />
                    <span>Synthesizing ({elapsedSeconds}s)...</span>
                  </>
                ) : (
                  <>
                    <FaGlobe className="text-[10px]" />
                    <span>
                      Generate Travel Portrait (
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

              {/* Error messaging */}
              {generatingError && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/35 rounded p-3">
                  <FaTimesCircle className="text-red-400 flex-shrink-0 mt-0.5 text-xs" />
                  <p className="text-[10px] text-red-300 font-bold leading-normal">
                    {generatingError}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 2: Output Showcase Canvas (lg:col-span-7) */}
          <div className="lg:col-span-7 flex flex-col bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md rounded- p-5 sm:p-6 shadow-2xl justify-between min-h-[440px] lg:min-h-0">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3 flex-shrink-0 mb-4">
              <div>
                <h3 className="text-xs font-black text-zinc-100 uppercase tracking-wider">
                  Showcase Canvas
                </h3>
                <p className="text-[8px] text-zinc-500 font-bold mt-0.5">
                  Wipe vertical slider to compare selfie vs. travel photo
                </p>
              </div>

              {generatingStatus === "generating" && (
                <span className="text-[8px] font-black text-teal-400 bg-teal-400/10 border border-teal-400/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="h-1 w-1 rounded-full bg-teal-400 animate-ping" />
                  Swapping
                </span>
              )}
              {generatingStatus === "success" && (
                <span className="text-[8px] font-black text-teal-400 bg-teal-400/10 border border-teal-400/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="h-1 w-1 rounded-full bg-teal-400" />
                  Ready
                </span>
              )}
            </div>

            {/* Display Canvas area */}
            <div className="flex-1 min-h-[300px] flex items-center justify-center relative rounded border border-zinc-800 bg-zinc-950/60 p-2 overflow-hidden shadow-inner">
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
                    alt="Selfie Input preview"
                    className="max-w-full max-h-full object-contain rounded opacity-70"
                  />
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-zinc-900/95 border border-zinc-800 rounded-full px-3 py-1 text-[9px] text-teal-400 font-bold whitespace-nowrap shadow-lg">
                    Press &quot;Generate Travel Portrait&quot; to teleport
                  </div>
                </div>
              ) : generatingStatus === "generating" ? (
                <div className="text-center max-w-xs px-4">
                  <div className="relative mx-auto w-12 h-12 mb-3">
                    <div className="absolute inset-0 rounded bg-teal-500/15 border border-teal-500/30 flex items-center justify-center">
                      <FaSpinner className="animate-spin text-xl text-teal-400" />
                    </div>
                  </div>
                  <h4 className="text-[10px] font-black text-zinc-200 uppercase tracking-wider">
                    Teleporting...
                  </h4>
                  <p className="text-[8px] text-zinc-500 mt-1 leading-normal">
                    Blending shadows and lighting with {activeDest.label}...
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1 bg-teal-500/10 border border-teal-500/20 rounded-full px-2.5 py-0.5">
                    <FaSpinner className="animate-spin text-[6px] text-teal-400" />
                    <span className="text-[8px] font-black text-teal-300">
                      {elapsedSeconds}s elapsed
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center max-w-xs px-4 py-8">
                  <div className="h-12 w-12 rounded bg-zinc-900/80 border border-zinc-800/80 flex items-center justify-center mx-auto mb-3 shadow">
                    <FaGlobe className="text-lg text-zinc-700 animate-pulse" />
                  </div>
                  <h4 className="text-[10px] font-bold text-zinc-300">
                    Empty Canvas
                  </h4>
                  <p className="text-[9px] text-zinc-500 mt-1 leading-relaxed">
                    Upload your portrait selfie, click on a landmark card in
                    Step 2, and teleport yourself there with AI.
                  </p>
                </div>
              )}
            </div>

            {/* Actions for output */}
            {resultImage && (
              <div className="flex gap-2.5 mt-4 border-t border-zinc-800/60 pt-3.5 flex-shrink-0">
                <button
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-500 hover:to-emerald-600 text-zinc-950 rounded text-xs font-black shadow-lg shadow-teal-500/20 cursor-pointer transition-all hover:scale-[1.01]"
                >
                  <FaDownload className="text-[10px]" />
                  <span>Download Snapshot</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="px-3.5 py-2.5 bg-zinc-950 hover:bg-red-950/40 hover:text-red-400 border border-zinc-800 hover:border-red-500/20 text-zinc-500 rounded text-xs font-bold transition-all cursor-pointer"
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
