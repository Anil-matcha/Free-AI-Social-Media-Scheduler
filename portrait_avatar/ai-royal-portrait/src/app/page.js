"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  FaCrown,
  FaUpload,
  FaTrash,
  FaSpinner,
  FaMagic,
  FaDownload,
  FaCheckCircle,
  FaExclamationCircle,
  FaImages,
  FaChevronDown,
  FaChevronUp,
  FaGoogle,
  FaLock,
} from "react-icons/fa";

const STYLE_CATEGORIES = {
  Hair: [
    { name: "Voluminous Frizzy Hair", emoji: "💇" },
    { name: "Platinum Blonde Hair", emoji: "👱" },
    { name: "Deep Burgundy Hair", emoji: "🔴" },
    { name: "Jet Black Hair", emoji: "🖤" },
    { name: "Bold Hair Highlights", emoji: "✨" },
  ],
  Makeup: [
    { name: "Bold Red Lipstick", emoji: "💄" },
    { name: "Smokey Eye Makeup", emoji: "👁️" },
    { name: "Glossy Nude Makeup", emoji: "🌸" },
    { name: "Winged Eyeliner", emoji: "🪶" },
    { name: "Party Glam Makeup", emoji: "🎉" },
  ],
  Accessories: [
    { name: "Aviator Sunglasses", emoji: "🕶️" },
    { name: "Oversized Sunglasses", emoji: "😎" },
    { name: "Modern Transparent Glasses", emoji: "👓" },
    { name: "Bold Fashion Hat", emoji: "🎩" },
  ],
  Outfit: [
    { name: "Bright Pink Outfit", emoji: "🩷" },
    { name: "Black Leather Jacket", emoji: "🖤" },
    { name: "White Formal Shirt", emoji: "👔" },
    { name: "Neon Green Hoodie", emoji: "🟢" },
  ],
  Lighting: [
    { name: "Cinematic Lighting", emoji: "🎬" },
    { name: "Cyberpunk Lighting", emoji: "⚡" },
  ],
};

const ASPECT_RATIOS = [
  { value: "auto", label: "Auto" },
  { value: "1:1", label: "Square (1:1)" },
  { value: "4:3", label: "Landscape (4:3)" },
  { value: "3:4", label: "Portrait (3:4)" },
  { value: "16:9", label: "Wide (16:9)" },
  { value: "9:16", label: "Story (9:16)" },
];

const EXAMPLE_IMAGES = [
  "https://cdn.muapi.ai/outputs/64ba772a57304aca9e821983e0b34f20.jpg",
  "https://cdn.muapi.ai/outputs/4f16cb2c852a46abafa38e7e6bfc5e79.jpg",
  "https://cdn.muapi.ai/outputs/f9146e3f94f041d9896e5c3763d8b4f5.jpg",
  "https://cdn.muapi.ai/outputs/68858dd55541485e828901fe2ca009a3.jpg",
  "https://cdn.muapi.ai/outputs/06ba5d3a38654e3897c5031a8c4cc728.jpg",
  "https://cdn.muapi.ai/outputs/f5d8f63bc5ea4dfa8337ef30530527a9.jpg",
];

function StatusBadge({ status }) {
  if (status === "processing")
    return (
      <span className="flex items-center gap-1.5 text-xs text-yellow-400 font-medium">
        <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse-dot" />
        Processing…
      </span>
    );
  if (status === "completed")
    return (
      <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
        <FaCheckCircle className="text-[10px]" />
        Completed
      </span>
    );
  return (
    <span className="flex items-center gap-1.5 text-xs text-red-400 font-medium">
      <FaExclamationCircle className="text-[10px]" />
      Failed
    </span>
  );
}

export default function WorkspacePage() {
  const { data: session, status: authStatus, update: updateSession } = useSession();

  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [aspectRatio, setAspectRatio] = useState("auto");
  const [arDropOpen, setArDropOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [currentCreation, setCurrentCreation] = useState(null);
  const [recentCreations, setRecentCreations] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [pollingId, setPollingId] = useState(null);
  const fileInputRef = useRef(null);
  const pollingRef = useRef(null);

  const creditCost = 2;

  // Fetch recent creations
  const fetchCreations = useCallback(async () => {
    if (!session?.user) return;
    try {
      const res = await fetch("/api/creations");
      if (res.ok) {
        const data = await res.json();
        setRecentCreations(data.slice(0, 6));
        const any = data.some((c) => c.status === "processing");
        return any;
      }
    } catch {}
    return false;
  }, [session]);

  useEffect(() => {
    if (!session?.user) return;
    setLoadingHistory(true);
    fetchCreations().finally(() => setLoadingHistory(false));
    const interval = setInterval(async () => {
      const anyProcessing = await fetchCreations();
      if (anyProcessing) updateSession();
    }, 4000);
    return () => clearInterval(interval);
  }, [session, fetchCreations, updateSession]);

  // Poll for current job
  useEffect(() => {
    if (!pollingId) return;
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/creations?requestId=${pollingId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "completed") {
            setCurrentCreation((prev) => ({ ...prev, resultImage: data.resultImage, status: "completed" }));
            setGenerating(false);
            setPollingId(null);
            updateSession();
            fetchCreations();
          } else if (data.status === "failed") {
            setCurrentCreation((prev) => ({ ...prev, status: "failed" }));
            setGenerating(false);
            setPollingId(null);
            fetchCreations();
          }
        }
      } catch {}
    }, 4000);
    return () => clearInterval(pollingRef.current);
  }, [pollingId, fetchCreations, updateSession]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
    setCurrentCreation(null);
    setError("");

    // Upload
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      setImageUrl(url);
    } catch (err) {
      setError("Failed to upload image. Please try again.");
      setImageUrl("");
      setImageFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (!imageUrl || !selectedStyle) return;
    setGenerating(true);
    setError("");
    setCurrentCreation({ status: "processing", styleName: selectedStyle.name });

    try {
      const res = await fetch("/api/creations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputImage: imageUrl,
          styleName: selectedStyle.name,
          aspectRatio,
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg);
      }

      const creation = await res.json();
      setCurrentCreation(creation);

      if (creation.status === "completed") {
        setGenerating(false);
        updateSession();
        fetchCreations();
      } else {
        setPollingId(creation.requestId);
      }
    } catch (err) {
      setError(err.message || "Generation failed. Please try again.");
      setCurrentCreation(null);
      setGenerating(false);
    }
  };

  const handleDownload = async (url, filename = "royal-portrait.jpg") => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const canGenerate =
    imageUrl && !uploading && selectedStyle && !generating && (session?.user?.credits ?? 0) >= creditCost;

  
  return (
    <div className="flex-1 flex flex-col lg:min-h-0 min-h-0">
      <main className="flex-1 flex flex-col md:flex-row md:overflow-hidden overflow-y-auto max-w-7xl w-full mx-auto px-4 py-4 gap-4 lg:min-h-0 min-h-0">
        {/* ─────────────── LEFT PANEL ─────────────── */}
        <div className="w-full md:w-[400px] shrink-0 flex flex-col gap-4 md:overflow-y-auto overflow-visible pb-4">

          {/* Upload Card */}
          <div className="rounded bg-zinc-900 border border-zinc-800 p-4">
            <h2 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
              <FaUpload className="text-yellow-500 text-xs" />
              Upload Your Portrait
            </h2>
            <div
              id="upload-zone"
              onClick={() => !uploading && !generating && fileInputRef.current?.click()}
              className={`relative h-52 rounded border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group ${
                imageUrl
                  ? "border-yellow-500/30 bg-zinc-950/40"
                  : "border-zinc-700 bg-zinc-950/30 hover:border-yellow-500/40 hover:bg-zinc-950/50"
              }`}
            >
              {uploading && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-10">
                  <FaSpinner className="animate-spin text-yellow-500 text-xl" />
                  <span className="text-xs text-zinc-300 font-semibold uppercase tracking-wider animate-pulse">
                    Uploading…
                  </span>
                </div>
              )}
              {imageUrl ? (
                <>
                  <img src={imageUrl} alt="Portrait" className="w-full h-full object-cover" />
                  <button
                    id="clear-image-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageUrl("");
                      setImageFile(null);
                      setCurrentCreation(null);
                      setError("");
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-red-600 text-white rounded text-xs transition-all"
                  >
                    <FaTrash />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 p-4 text-center">
                  <div className="w-12 h-12 rounded bg-zinc-800 group-hover:bg-yellow-500/10 flex items-center justify-center transition-all">
                    <FaUpload className="text-zinc-500 group-hover:text-yellow-500 text-lg transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-300 group-hover:text-white transition-colors">
                      Drop your portrait here
                    </p>
                    <p className="text-xs text-zinc-600 mt-0.5">JPG, PNG, WEBP up to 10MB</p>
                  </div>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>

          {/* Style Selector */}
          <div className="rounded bg-zinc-900 border border-zinc-800 p-4">
            <h2 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
              <FaMagic className="text-yellow-500 text-xs" />
              Choose Your Style
              <span className="ml-auto text-xs text-zinc-600">20 styles</span>
            </h2>
            <div className="flex flex-col gap-3">
              {Object.entries(STYLE_CATEGORIES).map(([category, styles]) => (
                <div key={category}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-2">{category}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {styles.map((style) => {
                      const isSelected = selectedStyle?.name === style.name;
                      return (
                        <button
                          key={style.name}
                          id={`style-${style.name.replace(/\s+/g, "-").toLowerCase()}`}
                          onClick={() => setSelectedStyle(style)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium transition-all border ${
                            isSelected
                              ? "bg-yellow-500/15 border-yellow-500/40 text-yellow-300 shadow-lg shadow-yellow-500/5"
                              : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600"
                          }`}
                        >
                          <span>{style.emoji}</span>
                          <span>{style.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Aspect Ratio */}
          <div className="rounded bg-zinc-900 border border-zinc-800 p-4 relative">
            <h2 className="text-sm font-semibold text-zinc-300 mb-3">Aspect Ratio</h2>
            <button
              id="aspect-ratio-dropdown-btn"
              onClick={() => setArDropOpen((p) => !p)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded bg-zinc-800 border border-zinc-700 hover:border-zinc-600 text-sm text-zinc-300 transition-all"
            >
              <span>{ASPECT_RATIOS.find((a) => a.value === aspectRatio)?.label}</span>
              {arDropOpen ? <FaChevronUp className="text-zinc-500 text-xs" /> : <FaChevronDown className="text-zinc-500 text-xs" />}
            </button>
            {arDropOpen && (
              <div className="absolute bottom-16 left-4 right-4 bg-zinc-900 border border-zinc-700 rounded shadow-2xl z-50 overflow-hidden overscroll-contain">
                {ASPECT_RATIOS.map((ar) => (
                  <button
                    key={ar.value}
                    onClick={() => { setAspectRatio(ar.value); setArDropOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 text-sm transition-all hover:bg-zinc-800 ${
                      aspectRatio === ar.value ? "text-yellow-400 bg-yellow-500/5" : "text-zinc-400"
                    }`}
                  >
                    {ar.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Generate Button */}
          <div className="rounded bg-zinc-900 border border-zinc-800 p-4">
            {/* Cost info */}
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-3">
              <span>Cost per portrait</span>
              <span className="text-yellow-400 font-semibold">⚡ {creditCost} credits</span>
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-4">
              <span>Your balance</span>
              <span className={`font-semibold ${(session?.user?.credits ?? 0) >= creditCost ? "text-emerald-400" : "text-red-400"}`}>
                {session?.user?.credits ?? 0} credits
              </span>
            </div>

            {error && (
              <div className="mb-3 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2">
                <FaExclamationCircle className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              id="generate-portrait-btn"
              onClick={handleGenerate}
              disabled={!canGenerate}
              className={`w-full py-3 rounded font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                canGenerate
                  ? "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-zinc-950 shadow-lg hover:shadow-yellow-500/25 hover:scale-[1.01] active:scale-[0.99]"
                  : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              }`}
            >
              {generating ? (
                <><FaSpinner className="animate-spin" /> Generating Portrait…</>
              ) : !imageUrl ? (
                <><FaUpload /> Upload Photo First</>
              ) : !selectedStyle ? (
                <><FaMagic /> Select a Style</>
              ) : (session?.user?.credits ?? 0) < creditCost ? (
                <><FaLock /> Insufficient Credits</>
              ) : (
                <><FaCrown /> Generate Royal Portrait</>
              )}
            </button>
          </div>
        </div>

        {/* ─────────────── RIGHT PANEL ─────────────── */}
        <div className="flex-1 flex flex-col gap-4 md:overflow-hidden overflow-visible">

          {/* Current Result */}
          <div className="flex-1 rounded bg-zinc-900 border border-zinc-800 overflow-hidden flex flex-col min-h-[400px]">
            {currentCreation ? (
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
                  <div className="flex items-center gap-2">
                    <FaCrown className="text-yellow-500 text-xs" />
                    <span className="text-sm font-semibold text-zinc-300">{currentCreation.styleName}</span>
                  </div>
                  <StatusBadge status={currentCreation.status} />
                </div>

                {/* Result image area */}
                <div className="flex-1 relative overflow-hidden bg-zinc-950">
                  {currentCreation.status === "processing" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded bg-zinc-800 flex items-center justify-center">
                          <FaCrown className="text-yellow-500 text-2xl animate-pulse" />
                        </div>
                        <div className="absolute -inset-1 rounded border-2 border-yellow-500/30 animate-ping" />
                      </div>
                      <div>
                        <p className="text-sm text-zinc-300 font-semibold text-center">Creating your royal portrait…</p>
                        <p className="text-xs text-zinc-600 text-center mt-1">Applying {currentCreation.styleName}</p>
                      </div>
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="w-2 h-2 rounded-full bg-yellow-500/60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                    </div>
                  )}
                  {currentCreation.status === "completed" && currentCreation.resultImage && (
                    <div className="h-full relative group">
                      <img
                        src={currentCreation.resultImage}
                        alt="Royal Portrait"
                        className="w-full h-full object-contain animate-slide-up"
                      />
                      {/* Overlay with original */}
                      <div className="absolute bottom-3 left-3 p-2 rounded bg-black/70 backdrop-blur-sm border border-zinc-700 flex items-center gap-2">
                        {imageUrl && <img src={imageUrl} alt="Original" className="w-10 h-10 rounded object-cover border border-zinc-600" />}
                        <div>
                          <p className="text-[10px] text-zinc-400">Original</p>
                          <p className="text-[10px] text-yellow-400 font-semibold">→ {currentCreation.styleName}</p>
                        </div>
                      </div>
                      {/* Download */}
                      <button
                        id="download-result-btn"
                        onClick={() => handleDownload(currentCreation.resultImage)}
                        className="absolute top-3 right-3 p-2.5 rounded bg-black/70 hover:bg-yellow-500 text-white hover:text-zinc-950 backdrop-blur-sm transition-all border border-zinc-700 hover:border-yellow-500 opacity-0 group-hover:opacity-100"
                      >
                        <FaDownload className="text-sm" />
                      </button>
                    </div>
                  )}
                  {currentCreation.status === "failed" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center p-8">
                      <FaExclamationCircle className="text-3xl text-red-500" />
                      <p className="text-sm font-semibold text-red-400">Generation Failed</p>
                      <p className="text-xs text-zinc-600">Your credits have been refunded. Please try again.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Placeholder */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 rounded bg-zinc-800 flex items-center justify-center mb-4 animate-float">
                  <FaCrown className="text-4xl text-zinc-700" />
                </div>
                <p className="text-sm font-semibold text-zinc-500">Your royal portrait will appear here</p>
                <p className="text-xs text-zinc-700 mt-1">Upload a photo → Choose a style → Generate</p>

                {/* Example grid */}
                <div className="grid grid-cols-3 gap-2 mt-6 w-full max-w-xs">
                  {EXAMPLE_IMAGES.slice(0, 6).map((url, i) => (
                    <div key={i} className="aspect-square rounded overflow-hidden border border-zinc-800 hover:border-yellow-500/30 transition-all">
                      <img src={url} alt={`Example ${i + 1}`} className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-all" />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-zinc-700 mt-2">Sample outputs</p>
              </div>
            )}
          </div>

          {/* Recent Creations */}
          {recentCreations.length > 0 && (
            <div className="rounded bg-zinc-900 border border-zinc-800 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                  <FaImages className="text-yellow-500 text-xs" />
                  Recent Portraits
                </h3>
                <a href="/gallery" className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors">
                  View all →
                </a>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {recentCreations.map((c) => (
                  <div
                    key={c.id}
                    className="aspect-square rounded overflow-hidden border border-zinc-800 relative group hover:border-yellow-500/30 transition-all cursor-pointer"
                    onClick={() => c.status === "completed" && c.resultImage && setCurrentCreation(c)}
                  >
                    {c.status === "processing" && (
                      <div className="absolute inset-0 shimmer" />
                    )}
                    {c.status === "completed" && c.resultImage ? (
                      <>
                        <img src={c.resultImage} alt={c.styleName} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDownload(c.resultImage, `${c.styleName}.jpg`); }}
                            className="p-1.5 rounded bg-yellow-500 text-zinc-950"
                          >
                            <FaDownload className="text-xs" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                        <FaExclamationCircle className="text-red-500 text-sm" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
