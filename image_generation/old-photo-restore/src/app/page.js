"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import {
  FaUpload,
  FaMagic,
  FaDownload,
  FaImage,
  FaSpinner,
  FaTrash,
  FaArrowRight,
  FaSlidersH,
  FaCameraRetro
} from "react-icons/fa";

const DEFAULT_PROMPT = "Restore this old photo: enhance face clarity, fix scratches, colorize realistically, high resolution, sharp details, natural lighting, remove grain and noise, maintain original integrity";

export default function RestorePage() {
  const { data: session } = useSession();

  // File upload and processing states
  const [inputUrl, setInputUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState(DEFAULT_PROMPT);
  const [mode, setMode] = useState("full"); // full, colorize, face, scratch
  const [currentRestoration, setCurrentRestoration] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [downloadingImage, setDownloadingImage] = useState(false);

  // Drag and drop states
  const [isDragging, setIsDragging] = useState(false);

  // Comparison slider states
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isSliding, setIsSliding] = useState(false);

  const fileInputRef = useRef(null);
  const pollRef = useRef(null);
  const sliderContainerRef = useRef(null);

  useEffect(() => {
    if (session?.user) {
      fetchHistory();
    }
  }, [session]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Fetch past restorations
  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/creations");
      if (res.ok) {
        setHistory(await res.json());
      }
    } catch (err) {
      console.error("History fetch error:", err);
    }
  };

  // Drag over handler
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  // Drag leave handler
  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Drop handler
  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  // File selection handler
  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  // Upload file to MuAPI storage
  const uploadFile = async (file) => {
    if (!session) {
      signIn("google");
      return;
    }
    setUploading(true);
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
        setInputUrl(data.url);
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload the image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // Trigger restore API
  const handleRestore = async () => {
    if (!session) {
      signIn("google");
      return;
    }
    if (!inputUrl) {
      alert("Please upload an old photo first.");
      return;
    }
    if (!customPrompt.trim()) {
      alert("Please specify restoration instructions or prompt.");
      return;
    }

    setGenerating(true);
    setSelectedHistoryItem(null);
    setCurrentRestoration({
      status: "processing",
      inputUrl,
      prompt: customPrompt,
      mode,
    });

    try {
      const res = await fetch("/api/creations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputUrl,
          prompt: customPrompt.trim(),
          mode,
        }),
      });

      if (!res.ok) throw new Error(await res.text() || "Restoration request failed");
      const data = await res.json();
      setCurrentRestoration(data);
      startPolling(data.requestId);
    } catch (err) {
      console.error("Restoration submission error:", err);
      alert(err.message || "Something went wrong. Please try again.");
      setGenerating(false);
      setCurrentRestoration(null);
    }
  };

  // Poll for completion
  const startPolling = (requestId) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/creations?requestId=${requestId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "completed") {
            clearInterval(pollRef.current);
            setCurrentRestoration((prev) => ({
              ...prev,
              status: "completed",
              outputUrl: data.outputUrl,
            }));
            setGenerating(false);
            fetchHistory();
          } else if (data.status === "failed") {
            clearInterval(pollRef.current);
            setCurrentRestoration((prev) => ({
              ...prev,
              status: "failed",
              error: data.error,
            }));
            setGenerating(false);
            alert(`Restoration failed: ${data.error || "Unknown server error"}`);
          }
        }
      } catch (err) {
        console.error("Poll error:", err);
      }
    }, 4000);
  };

  // CORS-compliant download proxy
  const handleDownload = async (url, filename) => {
    if (downloadingImage) return;
    setDownloadingImage(true);
    try {
      const downloadUrl = `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error("Failed to download image");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Error downloading file:", err);
      alert("Failed to download directly. Opening in a new tab instead.");
      window.open(url, "_blank");
    } finally {
      setDownloadingImage(false);
    }
  };

  // Slide move helpers
  const handleSliderMove = (clientX) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleTouchMove = (e) => {
    if (e.touches && e.touches[0]) {
      handleSliderMove(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e) => {
    if (e.buttons === 1 || isSliding) {
      handleSliderMove(e.clientX);
    }
  };

  const activeDisplay = selectedHistoryItem || currentRestoration;

  return (
    <main className="flex-1 flex justify-center overflow-hidden bg-zinc-950">
      <div className="flex h-full w-full max-w-[95%] lg:max-w-7xl overflow-hidden">
        {/* ── Left Control Sidebar (Right Side) ── */}
        <aside className="w-[360px] flex-shrink-0 border-r border-zinc-900 flex flex-col overflow-hidden bg-zinc-900 text-zinc-100 shadow-2xl">

          {/* Upload Area */}
          <div className="px-5 pt-5 pb-4 border-b border-zinc-900">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2.5">
              Original Damaged Photo
            </p>
            {inputUrl ? (
              <div className="flex items-center gap-3.5 p-2.5 border border-zinc-800 rounded-2xl bg-zinc-950">
                <img
                  src={inputUrl}
                  alt="Original"
                  className="h-12 w-12 object-cover rounded-xl border border-zinc-800 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-zinc-200 truncate">
                    Old Photo Selected
                  </p>
                  <span className="text-[10px] text-indigo-400 font-medium">
                    Ready to restore
                  </span>
                </div>
                <button
                  onClick={() => setInputUrl("")}
                  className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-all cursor-pointer flex-shrink-0"
                >
                  <FaTrash className="text-[10px]" />
                </button>
              </div>
            ) : (
              <label
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${isDragging
                  ? "border-indigo-500 bg-indigo-950/10"
                  : "border-zinc-800 hover:border-zinc-700 bg-zinc-950"
                  }`}
              >
                {uploading ? (
                  <>
                    <FaSpinner className="animate-spin text-indigo-400 text-lg" />
                    <span className="text-xs text-zinc-500 font-medium">
                      Uploading to workspace...
                    </span>
                  </>
                ) : (
                  <>
                    <div className="p-2.5 bg-zinc-900 rounded-full border border-zinc-800 text-zinc-400 shadow-inner">
                      <FaUpload className="text-sm text-zinc-400" />
                    </div>
                    <span className="text-xs font-bold text-zinc-300 mt-1">
                      Upload Old Photo
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      Drag & drop or click to browse
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={uploading}
                  ref={fileInputRef}
                />
              </label>
            )}
          </div>

          {/* Mode Selector */}
          <div className="px-5 py-4 border-b border-zinc-900">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2.5">
              Restoration Mode
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "full", label: "Full Restore" },
                { id: "colorize", label: "Colorize Only" },
                { id: "face", label: "Face Enhance" },
                { id: "scratch", label: "De-scratch" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`text-xs font-semibold py-2 rounded-full border transition-all cursor-pointer ${mode === m.id
                    ? "border-indigo-500 bg-indigo-950/40 text-indigo-400 shadow-sm"
                    : "border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800/40"
                    }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Instructions */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2.5">
                Restoration Instructions
              </p>
              <textarea
                placeholder="e.g. Restore original details, colorize naturally, sharpen faces..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="w-full h-32 p-3 text-xs border border-zinc-800 rounded-2xl bg-zinc-950 text-zinc-300 focus:bg-zinc-950 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 outline-none resize-none transition-all leading-relaxed"
              />
              <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed">
                Provide custom keywords to guide the AI restoration. The default prompt handles scratches, face sharpening, and realistic colorization automatically.
              </p>
            </div>
          </div>

          {/* Restore CTA */}
          <div className="p-4 border-t border-zinc-900 bg-zinc-900">
            {session ? (
              <button
                onClick={handleRestore}
                disabled={generating || !inputUrl || !customPrompt.trim()}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-zinc-950 font-bold text-xs rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-950/20"
              >
                {generating ? (
                  <>
                    <FaSpinner className="animate-spin text-[10px]" />
                    Restoring photo...
                  </>
                ) : (
                  <>
                    <FaMagic className="text-[10px]" />
                    Restore Photo (18 Credits)
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => signIn("google")}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Sign in to Restore <FaArrowRight className="text-[10px]" />
              </button>
            )}
          </div>
        </aside>
        {/* ── Main Canvas (Left Side) ── */}
        <section className="flex-1 flex flex-col overflow-hidden">

          {/* Main Canvas view */}
          <div className="flex-1 flex items-center justify-center p-4 bg-zinc-950">
            {activeDisplay ? (
              <div className="w-full max-w-[500px] bg-zinc-900 border border-zinc-800/80 shadow-2xl rounded-3xl overflow-hidden p-4">
                <div
                  ref={sliderContainerRef}
                  onMouseMove={handleMouseMove}
                  onTouchMove={handleTouchMove}
                  onMouseDown={() => setIsSliding(true)}
                  onTouchStart={() => setIsSliding(true)}
                  onMouseUp={() => setIsSliding(false)}
                  onTouchEnd={() => setIsSliding(false)}
                  onMouseLeave={() => setIsSliding(false)}
                  className="relative aspect-square bg-zinc-900 rounded-2xl overflow-hidden cursor-ew-resize select-none border border-zinc-800"
                >
                  {activeDisplay.status === "processing" ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3.5 bg-zinc-900">
                      <FaSpinner className="animate-spin text-indigo-400 text-3xl" />
                      <div className="text-center px-8">
                        <p className="text-xs font-bold text-zinc-200">
                          Restoring and colorizing details…
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-1">
                          This normally completes within 20–65 seconds
                        </p>
                      </div>
                    </div>
                  ) : activeDisplay.status === "failed" ? (
                    <div className="absolute inset-0 flex items-center justify-center p-8 bg-zinc-900">
                      <div className="text-center">
                        <p className="text-xs font-bold text-red-400">
                          Restoration failed
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                          We couldn't process this image. Your credits have been automatically refunded.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* AFTER (Restored image) - Bottom Layer */}
                      <img
                        src={activeDisplay.outputUrl}
                        alt="Restored"
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                      />

                      {/* BEFORE (Original image) - Top Layer (Clipped) */}
                      <img
                        src={activeDisplay.inputUrl}
                        alt="Original"
                        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                      />

                      {/* Sliding Slider Handle & Dividers */}
                      <div
                        className="absolute inset-y-0 w-[2px] bg-white shadow-lg pointer-events-none z-10"
                        style={{ left: `${sliderPosition}%` }}
                      />

                      <div
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-zinc-950 shadow-xl border border-zinc-800 text-white flex items-center justify-center pointer-events-none z-20"
                        style={{ left: `${sliderPosition}%` }}
                      >
                        <FaSlidersH className="text-zinc-400 text-[10px] rotate-90" />
                      </div>

                      {/* Left/Right labels */}
                      <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 bg-zinc-950/80 backdrop-blur-sm rounded-full text-[9px] text-zinc-300 font-bold pointer-events-none uppercase tracking-wider border border-zinc-800">
                        Before
                      </div>
                      <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 bg-indigo-600/80 backdrop-blur-sm rounded-full text-[9px] text-white font-bold pointer-events-none uppercase tracking-wider border border-indigo-500/20">
                        Restored
                      </div>
                    </>
                  )}
                </div>

                {activeDisplay.status === "completed" && (
                  <div className="flex items-center justify-between mt-3 px-1">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-100 capitalize">
                        {activeDisplay.mode || "Full"} Restoration
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        Drag the slider to compare results
                      </p>
                    </div>
                    <button
                      onClick={() => handleDownload(activeDisplay.outputUrl, `restored-${activeDisplay.id}.jpg`)}
                      disabled={downloadingImage}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white hover:bg-zinc-100 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm"
                    >
                      {downloadingImage ? (
                        <FaSpinner className="animate-spin text-[10px]" />
                      ) : (
                        <FaDownload className="text-[10px]" />
                      )}
                      Download JPG
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center">
                <div className="mx-auto mb-4 w-16 h-16 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl flex items-center justify-center text-zinc-400">
                  <FaCameraRetro className="text-lg text-zinc-500" />
                </div>
                <p className="text-sm font-bold text-zinc-200">
                  Restoration Workspace
                </p>
                <p className="text-[11px] text-zinc-500 mt-1 max-w-[260px] mx-auto leading-relaxed">
                  Select a restoration mode, upload a photo, and click restore to compare your before and after results side-by-side.
                </p>
              </div>
            )}
          </div>

          {/* User History Galleries */}
          <div className="h-[130px] border-t border-zinc-900 bg-zinc-900/50 px-6 flex flex-col justify-center flex-shrink-0">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2.5">
              Recent Restorations
            </p>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {history.length > 0 ? (
                history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedHistoryItem(item);
                      setCurrentRestoration(null);
                    }}
                    className={`h-16 w-16 flex-shrink-0 border-2 rounded-2xl overflow-hidden transition-all cursor-pointer ${activeDisplay?.id === item.id
                      ? "border-indigo-500 shadow-sm"
                      : "border-zinc-800 hover:border-zinc-700"
                      }`}
                  >
                    <img
                      src={item.outputUrl || item.inputUrl}
                      alt="History thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))
              ) : (
                <div className="flex-1 flex items-center justify-center border border-dashed border-zinc-800 rounded-2xl h-16">
                  <p className="text-[10px] text-zinc-500">
                    Your restored photos will appear here
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
