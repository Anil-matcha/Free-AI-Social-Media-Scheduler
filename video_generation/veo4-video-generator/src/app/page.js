"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import {
  FaBolt,
  FaMagic,
  FaChevronDown,
  FaPlus,
  FaTrash,
  FaSyncAlt,
  FaVideo,
  FaMusic,
} from "react-icons/fa";
import { IoImageOutline } from "react-icons/io5";
import { FiDownload } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { downloadMedia } from "@/lib/utils";

const ASPECT_RATIOS = [
  { label: "16:9", value: "16:9" },
  { label: "9:16", value: "9:16" },
];

const RESOLUTIONS = [
  { value: "720p", label: "720p" },
  { value: "1080p", label: "1080p" },
  { value: "4k", label: "4K" },
];

const DURATIONS = [{ value: 8, label: "8 Seconds" }];

const MODELS = [
  { value: "lite", label: "Lite" },
  { value: "fast", label: "Fast" },
  { value: "quality", label: "Quality" },
];

function CustomSelect({ label, value, options, onChange, icon: Icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target))
        setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <label className="text-[10px] font-medium text-muted uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2 bg-glass-bg border border-glass-border rounded-md text-xs font-medium text-foreground hover:bg-glass-hover transition-colors outline-none"
        >
          <div className="flex items-center gap-2">
            {Icon && <Icon className="text-primary-500 text-[10px]" />}
            {selectedOption.label}
          </div>
          <FaChevronDown
            className={`text-[10px] text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="absolute bottom-10 left-0 right-0 bg-glass-bg border border-glass-border rounded-md shadow-xl z-[100] overflow-hidden backdrop-blur-xl"
            >
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 text-xs transition-colors ${
                    value === option.value
                      ? "bg-primary-500 text-white"
                      : "text-muted hover:bg-glass-hover hover:text-foreground"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function Home() {
  const { data: session } = useSession();

  // Mode State
  const [mode, setMode] = useState("text-to-video");

  // Form State
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0].value);
  const [resolution, setResolution] = useState(RESOLUTIONS[0].value); // 720p default
  const [duration, setDuration] = useState(DURATIONS[0].value);
  const [model, setModel] = useState(MODELS[0].value);
  const [imageUrl, setImageUrl] = useState("");
  const [lastImage, setLastImage] = useState("");
  const [imagesList, setImagesList] = useState([]); // Max 3 URLs for Reference
  const [newImageUrl, setNewImageUrl] = useState("");

  // UI State
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingLast, setIsUploadingLast] = useState(false);
  const fileInputRef = useRef(null);
  const fileInputLastRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [resultUrl, setResultUrl] = useState(null);
  const [error, setError] = useState(null);

  const MODES = [
    {
      id: "text-to-video",
      label: "Text",
      fullLabel: "Text to Video",
      icon: FaBolt,
    },
    {
      id: "image-to-video",
      label: "Image",
      fullLabel: "Image to Video",
      icon: IoImageOutline,
    },
    {
      id: "reference-to-video",
      label: "Reference",
      fullLabel: "Reference to Video",
      icon: FaSyncAlt,
    },
  ];

  const addImageToList = () => {
    if (newImageUrl && imagesList.length < 3) {
      setImagesList([...imagesList, newImageUrl]);
      setNewImageUrl("");
    }
  };

  const handleFileUpload = async (event, setter, isLast = false) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (isLast) setIsUploadingLast(true);
      else setIsUploading(true);

      setError(null);
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed.");
      const data = await res.json();
      if (data.url) setter(data.url);
    } catch (err) {
      setError("Upload failed.");
    } finally {
      if (isLast) {
        setIsUploadingLast(false);
        if (fileInputLastRef.current) fileInputLastRef.current.value = "";
      } else {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    }
  };

  const handleGenerate = async () => {
    if (!session) {
      signIn();
      return;
    }
    if (mode === "text-to-video" && !prompt.trim()) return;
    if (mode === "image-to-video" && !imageUrl) {
      setError("Please add an initial image.");
      return;
    }
    if (mode === "reference-to-video" && imagesList.length === 0) {
      setError("Please add at least one reference image.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResultUrl(null);
      setStatusMessage("Starting generation...");

      const payload = {
        mode,
        prompt,
        resolution,
        duration,
      };

      if (mode !== "reference-to-video") {
        payload.aspect_ratio = aspectRatio;
        payload.model = model;
      }

      if (mode === "image-to-video") {
        payload.image_url = imageUrl;
        payload.last_image = lastImage;
      }

      if (mode === "reference-to-video") {
        payload.images_list = imagesList;
      }

      const res = await fetch("/api/veo31", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed.");
      await pollStatus(data.request_id, data.metadata);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const pollStatus = async (requestId, metadata) => {
    setStatusMessage("Processing...");
    try {
      const res = await fetch("/api/veo31/check-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, metadata }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Status check failed.");

      if (data.status === "completed") {
        setResultUrl(data.videoUrl);
        setLoading(false);
      } else if (data.status === "failed") {
        throw new Error("Generation failed.");
      } else {
        setTimeout(() => pollStatus(requestId, metadata), 3000);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const getAvailableDurations = () => {
    return DURATIONS;
  };

  useEffect(() => {
    const available = getAvailableDurations();
    if (!available.find((d) => d.value === duration)) {
      setDuration(available[0].value);
    }
  }, [mode]);

  const creditCost = (() => {
    const isReference = mode === "reference-to-video";
    const res = resolution || "720p";
    const mod = model || "lite";

    // Quality pricing
    if (mod === "quality") {
      if (res === "720p") return 500;
      if (res === "1080p") return 650;
      if (res === "4k") return 750;
    }

    // Fast pricing
    if (mod === "fast") {
      if (res === "720p") return 120;
      if (res === "1080p") return 160;
      if (res === "4k") return 360;
    }

    // Lite pricing
    if (mod === "lite") {
      if (res === "720p") return 60;
      if (res === "1080p") return 80;
      if (res === "4k") return 300;
    }

    // Reference pricing (overrides model if mode is reference-to-video)
    if (isReference) {
      if (res === "720p") return 120;
      if (res === "1080p") return 160;
      if (res === "4k") return 360;
    }

    return 60; // Default
  })();

  return (
    <div className="flex-1 w-full flex flex-col items-center p-4 md:p-8 overflow-y-auto custom-scrollbar">
      {/* Playground Header */}
      <div className="max-w-6xl w-full mb-10 text-center space-y-4">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-5xl font-bold text-foreground tracking-tight"
        >
          Veo 3.1 Studio
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-sm md:text-base text-muted max-w-2xl mx-auto leading-relaxed"
        >
          Experience the next generation of AI video creation. Transform your
          text and images into high-quality cinematic videos using the advanced
          Veo 3.1 engine.
        </motion.p>
      </div>

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left: Controls */}
        <div className="bg-glass-bg border border-glass-border rounded-lg p-6 flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-md bg-primary-500/10 flex items-center justify-center text-primary-500">
              <FaMagic />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Veo 3.1 Generator
              </h2>
              <p className="text-[10px] text-muted">Advanced Video Engine</p>
            </div>
          </div>

          <div className="grid grid-cols-3 p-1 bg-glass-hover rounded-md border border-glass-border">
            {MODES.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    mode === m.id
                      ? "bg-primary-500 text-white shadow-sm"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="shrink-0" />{" "}
                  <span className="sm:hidden">{m.label}</span>
                  <span className="hidden sm:inline">{m.fullLabel}</span>
                </button>
              );
            })}
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-medium text-muted uppercase tracking-wider">
                Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  mode === "reference-to-video"
                    ? "Describe the video using your reference images..."
                    : "Describe your video..."
                }
                className="w-full h-32 bg-glass-bg border border-glass-border rounded-md p-2 text-sm outline-none focus:border-primary-500/40 resize-none transition-colors custom-scrollbar"
              />
            </div>

            {mode === "image-to-video" && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <label className="text-[10px] font-medium text-muted uppercase tracking-wider">
                    Initial Image (Required)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Image URL..."
                      className="flex-1 bg-glass-bg border border-glass-border rounded-md px-3 py-2 text-xs outline-none focus:border-primary-500/40"
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      hidden
                      accept=".png, .jpg, .jpeg"
                      onChange={(e) => handleFileUpload(e, setImageUrl)}
                    />
                    <button
                      onClick={() => {
                        if (!session) return signIn();
                        fileInputRef.current?.click();
                      }}
                      disabled={isUploading}
                      className="w-9 h-9 bg-primary-500/10 border border-primary-500/20 text-primary-500 rounded-md flex items-center justify-center hover:bg-primary-500 hover:text-white transition-colors shrink-0"
                    >
                      {isUploading ? (
                        <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <IoImageOutline />
                      )}
                    </button>
                  </div>
                  {imageUrl && (
                    <div className="relative w-24 h-24 rounded-md overflow-hidden border border-glass-border">
                      <img
                        src={imageUrl}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => setImageUrl("")}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded text-[10px]"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-medium text-muted uppercase tracking-wider">
                    Last Image (Optional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={lastImage}
                      onChange={(e) => setLastImage(e.target.value)}
                      placeholder="Ending Image URL..."
                      className="flex-1 bg-glass-bg border border-glass-border rounded-md px-3 py-2 text-xs outline-none focus:border-primary-500/40"
                    />
                    <input
                      type="file"
                      ref={fileInputLastRef}
                      hidden
                      accept=".png, .jpg, .jpeg"
                      onChange={(e) => handleFileUpload(e, setLastImage, true)}
                    />
                    <button
                      onClick={() => {
                        if (!session) return signIn();
                        fileInputLastRef.current?.click();
                      }}
                      disabled={isUploadingLast}
                      className="w-9 h-9 bg-primary-500/10 border border-primary-500/20 text-primary-500 rounded-md flex items-center justify-center hover:bg-primary-500 hover:text-white transition-colors shrink-0"
                    >
                      {isUploadingLast ? (
                        <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <IoImageOutline />
                      )}
                    </button>
                  </div>
                  {lastImage && (
                    <div className="relative w-24 h-24 rounded-md overflow-hidden border border-glass-border">
                      <img
                        src={lastImage}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => setLastImage("")}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded text-[10px]"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {mode === "reference-to-video" && (
              <div className="space-y-3">
                <label className="text-[10px] font-medium text-muted uppercase tracking-wider">
                  Reference Images ({imagesList.length}/3)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Image URL..."
                    className="flex-1 bg-glass-bg border border-glass-border rounded-md px-3 py-2 text-xs outline-none focus:border-primary-500/40"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    hidden
                    accept=".png, .jpg, .jpeg"
                    onChange={(e) =>
                      handleFileUpload(e, (url) => {
                        if (imagesList.length < 3)
                          setImagesList([...imagesList, url]);
                      })
                    }
                  />
                  <button
                    onClick={() => {
                      if (!session) return signIn();
                      fileInputRef.current?.click();
                    }}
                    disabled={isUploading || imagesList.length >= 3}
                    className="w-9 h-9 bg-primary-500/10 border border-primary-500/20 text-primary-500 rounded-md flex items-center justify-center hover:bg-primary-500 hover:text-white transition-colors shrink-0"
                  >
                    {isUploading ? (
                      <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <IoImageOutline />
                    )}
                  </button>
                  <button
                    onClick={addImageToList}
                    disabled={!newImageUrl || imagesList.length >= 3}
                    className="w-9 h-9 bg-glass-bg border border-glass-border text-primary-500 rounded-md flex items-center justify-center hover:bg-primary-500 hover:text-white transition-colors shrink-0"
                  >
                    <FaPlus />
                  </button>
                </div>
                {imagesList.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {imagesList.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square rounded-md bg-glass-bg overflow-hidden group border border-glass-border"
                      >
                        <img src={url} className="w-full h-full object-cover" />
                        <button
                          onClick={() =>
                            setImagesList(
                              imagesList.filter((_, i) => i !== idx),
                            )
                          }
                          className="absolute top-2 right-2 p-1 rounded bg-red-500/90 items-center justify-center hidden group-hover:flex"
                        >
                          <FaTrash className="text-white text-[10px]" />
                        </button>
                        <div className="absolute bottom-1 right-1 bg-black/60 px-1 rounded text-[8px] text-white font-bold">
                          Image {idx + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className={`grid gap-4 ${mode === "reference-to-video" ? "grid-cols-2" : "grid-cols-2"}`}>
              {mode !== "reference-to-video" && (
                <CustomSelect
                  label="Aspect Ratio"
                  value={aspectRatio}
                  options={ASPECT_RATIOS}
                  onChange={setAspectRatio}
                />
              )}
              <CustomSelect
                label="Resolution"
                value={resolution}
                options={RESOLUTIONS}
                onChange={setResolution}
              />
              <CustomSelect
                label="Duration"
                value={duration}
                options={getAvailableDurations()}
                onChange={setDuration}
              />
              {mode !== "reference-to-video" && (
                <CustomSelect
                  label="Model"
                  value={model}
                  options={MODELS}
                  onChange={setModel}
                />
              )}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={
              loading ||
              (mode === "text-to-video" && !prompt.trim()) ||
              (!["text-to-video", "image-to-video"].includes(mode) && imagesList.length === 0)
            }
            className="w-full bg-primary-500 text-white rounded-md py-2 text-sm font-medium hover:bg-primary-600 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
            ) : (
              `Generate (${creditCost} Credits)`
            )}
          </button>

          {error && (
            <p className="text-[10px] text-red-500 font-medium text-center">
              {error}
            </p>
          )}
        </div>

        {/* Right: Preview */}
        <div className="bg-glass-bg border border-glass-border rounded-lg p-6 flex flex-col gap-4 min-h-[500px]">
          <h2 className="text-[10px] font-medium text-muted uppercase tracking-wider">
            Preview
          </h2>
          <div className="flex-1 flex flex-col items-center justify-center bg-glass-hover rounded-md border border-glass-border relative overflow-hidden group">
            {resultUrl ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 gap-4">
                <div className="relative w-full aspect-video rounded-md overflow-hidden bg-black shadow-inner">
                  <video
                    src={resultUrl}
                    className="w-full h-full object-contain"
                    controls
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() =>
                        downloadMedia(resultUrl, `veo31-${Date.now()}.mp4`)
                      }
                      className="p-3 bg-white/90 hover:bg-white text-black rounded-full shadow-2xl transition-all hover:scale-110 active:scale-90"
                    >
                      <FiDownload className="text-xl" />
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-primary-500/10 text-primary-500 text-[10px] font-medium rounded uppercase">
                    {aspectRatio}
                  </span>
                  <span className="px-2 py-1 bg-glass-hover text-muted text-[10px] font-medium rounded uppercase">
                    {resolution}
                  </span>
                </div>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-2 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
                <p className="text-[10px] font-medium text-muted uppercase tracking-widest animate-pulse">
                  {statusMessage}
                </p>
              </div>
            ) : (
              <div className="text-center p-8 space-y-3">
                <FaMagic className="text-2xl opacity-30 mx-auto" />
                <p className="text-[10px] text-muted uppercase tracking-widest font-medium">
                  Video Preview
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 0px;
        }
        .custom-scrollbar {
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
