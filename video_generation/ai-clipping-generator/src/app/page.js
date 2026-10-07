"use client";

import { useSession, signIn } from "next-auth/react";
import { downloadMedia } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import {
  FaYoutube,
  FaCut,
  FaChevronDown,
  FaExpand,
  FaFilm,
  FaBolt,
  FaCheckCircle,
} from "react-icons/fa";
import { FiDownload } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

const YT_FORMATS = [
  { label: "1080p (FHD)", value: "1080" },
  { label: "720p (HD)", value: "720" },
  { label: "480p", value: "480" },
  { label: "360p", value: "360" },
  { label: "4K (UHD)", value: "4k" },
  { label: "MP3 Audio", value: "mp3" },
];

const ASPECT_RATIOS = [
  { label: "9:16 (TikTok, Reels, Shorts)", value: "9:16" },
  { label: "16:9 (YouTube, TV)", value: "16:9" },
  { label: "1:1 (Instagram Square)", value: "1:1" },
  { label: "4:5 (Instagram Portrait)", value: "4:5" },
  { label: "4:3 (Classic Video)", value: "4:3" },
  { label: "3:4 (Portrait)", value: "3:4" },
];

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Tab State: "download" | "clip"
  const [activeTab, setActiveTab] = useState("download");

  // YouTube Download State
  const [ytUrl, setYtUrl] = useState("");
  const [ytFormat, setYtFormat] = useState(YT_FORMATS[1]);
  const [isYtFormatOpen, setIsYtFormatOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [ytResult, setYtResult] = useState(null); // stores the resulting video URL

  // AI Clipping State
  const [clipUrl, setClipUrl] = useState("");
  const [numHighlights, setNumHighlights] = useState(3);
  const [clipAspectRatio, setClipAspectRatio] = useState(ASPECT_RATIOS[0]);
  const [isClipRatioOpen, setIsClipRatioOpen] = useState(false);
  const [isClipping, setIsClipping] = useState(false);
  const [clipResult, setClipResult] = useState(null);
  const [clippingCost, setClippingCost] = useState(0);

  const [error, setError] = useState(null);

  const formatRef = useRef(null);
  const ratioRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (formatRef.current && !formatRef.current.contains(event.target)) {
        setIsYtFormatOpen(false);
      }
      if (ratioRef.current && !ratioRef.current.contains(event.target)) {
        setIsClipRatioOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const calculateCost = async () => {
      if (!clipUrl) {
        setClippingCost(0);
        return;
      }

      let duration = 300; // Default 5 mins

      try {
        // Simple JS logic using video tag as requested
        const video = document.createElement("video");
        video.preload = "metadata";
        
        const getDuration = () => new Promise((resolve) => {
          video.onloadedmetadata = () => resolve(video.duration);
          video.onerror = () => resolve(300);
          // Set a timeout in case it hangs
          setTimeout(() => resolve(300), 5000);
          video.src = clipUrl;
        });

        duration = await getDuration();
      } catch (err) {
        console.warn("Duration calculation failed, using fallback", err);
      }

      const minutes = Math.round(duration / 60);
      const cost = Math.round(((minutes * 0.05) + (numHighlights * 0.05)) * 200);
      setClippingCost(cost);
    };

    calculateCost();
  }, [clipUrl, numHighlights]);

  const handleYtDownload = async () => {
    if (!session) return signIn();
    if (!ytUrl) return setError("Please enter a YouTube URL.");

    try {
      setIsDownloading(true);
      setError(null);
      setYtResult(null);

      const res = await fetch("/api/youtube-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_url: ytUrl, format: ytFormat.value }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Failed to download YouTube video");

      if (data.request_id) {
        await pollYtStatus(data.request_id);
      } else {
        const downloadedUrl = data.url || data.video_url || data.download_url;
        if (downloadedUrl) {
          setYtResult(downloadedUrl);
          setClipUrl(downloadedUrl); // pass link to clipping tab
          setActiveTab("clip"); // switch tab
          setIsDownloading(false);
        } else {
          throw new Error("No URL returned from download API");
        }
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
      setIsDownloading(false);
    }
  };

  const pollYtStatus = async (requestId) => {
    try {
      const res = await fetch("/api/youtube-download/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Status check failed.");

      if (data.status === "completed") {
        const downloadedUrl = Array.isArray(data.clips)
          ? data.clips[0]
          : data.clips;
        setYtResult(downloadedUrl);
        setClipUrl(downloadedUrl); // pass link to clipping tab
        setActiveTab("clip"); // switch tab
        setIsDownloading(false);
      } else if (data.status === "failed") {
        throw new Error(data.error || "Download failed.");
      } else {
        setTimeout(() => pollYtStatus(requestId), 3000);
      }
    } catch (err) {
      setError(err.message || "An error occurred during verification.");
      setIsDownloading(false);
    }
  };

  const handleAiClipping = async () => {
    if (!session) return signIn();
    if (!clipUrl) return setError("Please enter a video URL to clip.");

    try {
      setIsClipping(true);
      setError(null);
      setClipResult(null);

      const res = await fetch("/api/ai-clipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video_url: clipUrl,
          num_highlights: numHighlights,
          aspect_ratio: clipAspectRatio.value,
        }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Failed to initiate AI Clipping");

      if (data.request_id) {
        await pollStatus(data.request_id);
      } else if (data.clips) {
        setClipResult(data.clips);
        setIsClipping(false);
      } else {
        setClipResult(data);
        setIsClipping(false);
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
      setIsClipping(false);
    }
  };

  const pollStatus = async (requestId) => {
    try {
      const res = await fetch("/api/ai-clipping/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Status check failed.");

      if (data.status === "completed") {
        setClipResult(data.clips);
        setIsClipping(false);
      } else if (data.status === "failed") {
        throw new Error(data.error || "Generation failed.");
      } else {
        setTimeout(() => pollStatus(requestId), 3000);
      }
    } catch (err) {
      setError(err.message || "An error occurred during verification.");
      setIsClipping(false);
    }
  };

  return (
    <div className="flex flex-col-reverse lg:flex-row flex-1 h-full w-full overflow-y-auto custom-scrollbar">
      <div className="flex-1 w-full max-w-2xl mx-auto px-6 py-10 flex flex-col space-y-10">
        {/* Header Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            AICLIP Studio
          </h1>
          <p className="text-sm text-muted">
            Download YouTube videos and extract viral highlights.
          </p>
        </div>

        {/* Custom Tabs Navigation */}
        <div className="flex items-center gap-2 border-b border-divider/50 pb-px">
          <button
            onClick={() => setActiveTab("download")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${
              activeTab === "download"
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            <FaYoutube
              className={
                activeTab === "download" ? "text-primary" : "text-muted"
              }
            />
            1. Download
          </button>
          <button
            onClick={() => setActiveTab("clip")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${
              activeTab === "clip"
                ? "border-secondary text-secondary"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            <FaCut
              className={
                activeTab === "clip" ? "text-secondary" : "text-muted"
              }
            />
            2. AI Clipping
          </button>
        </div>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-lg text-sm mb-6 font-medium">
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="bg-bg-card border border-divider/50 rounded-2xl p-6 sm:p-10 shadow-md">
          <AnimatePresence mode="wait">
            {activeTab === "download" ? (
              <motion.div
                key="download"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="space-y-1">
                  <h2 className="text-lg font-medium text-foreground">
                    Extract Video
                  </h2>
                  <p className="text-muted text-sm">
                    Paste a YouTube link to download the source video.
                  </p>
                </div>

                <div className="space-y-5">
                  {/* URL Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted uppercase tracking-widest">
                      YouTube URL
                    </label>
                    <div className="relative flex items-center">
                      <FaYoutube className="absolute left-3 text-muted" />
                      <input
                        type="text"
                        value={ytUrl}
                        onChange={(e) => setYtUrl(e.target.value)}
                        placeholder="https://youtube.com/watch?v=..."
                        className="w-full bg-bg-elevated border border-divider/50 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-shadow text-foreground placeholder-muted"
                      />
                    </div>
                  </div>

                  {/* Format Selector */}
                  <div className="space-y-1.5 relative" ref={formatRef}>
                    <label className="text-xs font-semibold text-muted uppercase tracking-widest">
                      Format
                    </label>
                    <button
                      onClick={() => setIsYtFormatOpen(!isYtFormatOpen)}
                      className="w-full flex items-center justify-between px-4 py-2.5 bg-bg-elevated border border-divider/50 rounded-lg text-sm transition-colors text-foreground hover:bg-bg-card-hover"
                    >
                      <div className="flex items-center gap-2">
                        <FaFilm className="text-muted" />
                        {ytFormat.label}
                      </div>
                      <FaChevronDown
                        className={`text-muted transition-transform duration-200 ${isYtFormatOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    <AnimatePresence>
                      {isYtFormatOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          className="absolute bottom-12 left-0 right-0 max-h-60 bg-bg-elevated border border-divider/50 rounded-lg overflow-y-auto custom-scrollbar shadow-2xl z-[100] p-1"
                        >
                          {YT_FORMATS.map((format) => (
                            <button
                              key={format.value}
                              onClick={() => {
                                setYtFormat(format);
                                setIsYtFormatOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center hover:bg-bg-card-hover ${
                                ytFormat.value === format.value
                                  ? "text-primary-500 font-medium bg-primary-500/10"
                                  : "text-muted"
                              }`}
                            >
                              {format.label}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleYtDownload}
                    disabled={isDownloading || !ytUrl}
                    className="w-full mt-2 bg-primary hover:bg-primary-hover text-white rounded-lg py-3 text-sm font-bold tracking-wide flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20"
                  >
                    {isDownloading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FaBolt className="text-yellow-400" />
                        Download Video — 5 Credits
                      </>
                    )}
                  </button>

                  {ytResult && (
                    <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2 text-green-500 font-medium text-sm">
                      <FaCheckCircle className="shrink-0" />
                      <span className="truncate">
                        Download complete! Link passed to AI Clipping.
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="clip"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="space-y-1">
                  <h2 className="text-lg font-medium text-foreground">
                    AI Clipping
                  </h2>
                  <p className="text-muted text-sm">
                    Extract viral highlights from your video instantly.
                  </p>
                </div>

                <div className="space-y-5">
                  {/* Video URL Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted uppercase tracking-widest">
                      Source Video URL
                    </label>
                    <div className="relative flex items-center">
                      <FaFilm className="absolute left-3 text-muted" />
                      <input
                        type="text"
                        value={clipUrl}
                        onChange={(e) => setClipUrl(e.target.value)}
                        placeholder="Direct video URL..."
                        className="w-full bg-bg-elevated border border-divider/50 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-secondary-500 focus:ring-1 focus:ring-secondary-500 transition-shadow text-foreground placeholder-muted"
                      />
                    </div>
                  </div>

                  {/* Settings Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Number of Highlights */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted uppercase tracking-widest flex justify-between">
                        <span>Highlights</span>
                        <span className="text-secondary-500 font-bold">
                          {numHighlights}
                        </span>
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="60"
                        value={numHighlights}
                        onChange={(e) =>
                          setNumHighlights(Number(e.target.value))
                        }
                        className="w-full accent-secondary-500 h-1.5 bg-divider/30 rounded-lg appearance-none cursor-pointer mt-2"
                      />
                    </div>

                    {/* Aspect Ratio */}
                    <div className="space-y-1.5 relative" ref={ratioRef}>
                      <label className="text-xs font-semibold text-muted uppercase tracking-widest">
                        Aspect Ratio
                      </label>
                      <button
                        onClick={() => setIsClipRatioOpen(!isClipRatioOpen)}
                        className="w-full flex items-center justify-between px-4 py-2.5 bg-bg-elevated border border-divider/50 rounded-lg text-sm transition-colors text-foreground hover:bg-bg-card-hover"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FaExpand className="text-muted shrink-0" />
                          <span className="truncate">
                            {clipAspectRatio.label}
                          </span>
                        </div>
                        <FaChevronDown
                          className={`text-muted shrink-0 transition-transform duration-200 ${isClipRatioOpen ? "rotate-180" : ""}`}
                        />
                      </button>

                      <AnimatePresence>
                        {isClipRatioOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            className="absolute bottom-14 left-0 right-0 max-h-60 bg-bg-elevated border border-divider/50 rounded-lg overflow-y-auto custom-scrollbar shadow-2xl z-[100] p-1"
                          >
                            {ASPECT_RATIOS.map((ratio) => (
                              <button
                                key={ratio.value}
                                onClick={() => {
                                  setClipAspectRatio(ratio);
                                  setIsClipRatioOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center hover:bg-bg-card-hover ${
                                  clipAspectRatio.value === ratio.value
                                    ? "text-secondary-500 font-medium bg-secondary-500/10"
                                    : "text-muted"
                                }`}
                              >
                                {ratio.label}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleAiClipping}
                    disabled={isClipping || !clipUrl}
                    className="w-full mt-2 bg-secondary hover:bg-secondary-hover text-white rounded-lg py-3 text-sm font-bold tracking-wide flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-secondary/20"
                  >
                    {isClipping ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Generating Clips...
                      </>
                    ) : (
                      <>
                        <FaCut />
                        Generate Highlights {clippingCost > 0 ? `— ${clippingCost} Credits` : ""}
                      </>
                    )}
                  </button>

                  {/* Results Display */}
                  {clipResult && (
                    <div className="mt-6 p-4 bg-bg-elevated border border-divider/50 rounded-lg space-y-2">
                      <h3 className="text-xs font-semibold text-foreground uppercase tracking-widest">
                        Task Dispatched
                      </h3>
                      <p className="text-sm text-muted">
                        Your clips are being generated. Check the My Clips tab
                        to view them once finished.
                      </p>
                      <pre className="text-xs text-muted overflow-auto pt-2 mt-2 border-t border-divider/30 font-mono">
                        {JSON.stringify(clipResult, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
          border-radius: 10px;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }
      `}</style>
    </div>
  );
}
