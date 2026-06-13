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
  { label: "4:3", value: "4:3" },
  { label: "3:4", value: "3:4" },
];

const RESOLUTIONS = [
  { value: "480p", label: "480p" },
  { value: "720p", label: "720p" },
];

const DURATIONS = [
  { value: 5, label: "5 Seconds" },
  { value: 10, label: "10 Seconds" },
  { value: 15, label: "15 Seconds" },
];

const QUALITIES = [
  { value: "basic", label: "Basic" },
  { value: "high", label: "High" },
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
  const [resolution, setResolution] = useState(RESOLUTIONS[1].value); // 720p default
  const [duration, setDuration] = useState(DURATIONS[0].value);
  const [quality, setQuality] = useState(QUALITIES[0].value);
  const [imagesList, setImagesList] = useState([]); // Max 9 URLs for I2V/Reference
  const [videoFiles, setVideoFiles] = useState([]); // Max 3 URLs for Reference
  const [audioFiles, setAudioFiles] = useState([]); // Max 3 URLs for Reference
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newAudioUrl, setNewAudioUrl] = useState("");

  // UI State
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [resultUrl, setResultUrl] = useState(null);
  const [error, setError] = useState(null);

  const MODES = [
    { id: "text-to-video", label: "Text", fullLabel: "Text to Video", icon: FaBolt },
    { id: "image-to-video", label: "Image", fullLabel: "Image to Video", icon: IoImageOutline },
    { id: "reference-to-video", label: "Reference", fullLabel: "Reference to Video", icon: FaSyncAlt },
  ];

  const addImageToList = () => {
    if (newImageUrl && imagesList.length < 9) {
      setImagesList([...imagesList, newImageUrl]);
      setNewImageUrl("");
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (imagesList.length >= 9) return;

    try {
      setIsUploading(true);
      setError(null);
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed.");
      const data = await res.json();
      if (data.url) setImagesList([...imagesList, data.url]);
    } catch (err) {
      setError("Upload failed.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileUploadVideo = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (videoFiles.length >= 3) return;

    try {
      setIsUploadingVideo(true);
      setError(null);
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Video upload failed.");
      const data = await res.json();
      if (data.url) setVideoFiles([...videoFiles, data.url]);
    } catch (err) {
      setError("Video upload failed.");
    } finally {
      setIsUploadingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  const handleFileUploadAudio = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (audioFiles.length >= 3) return;

    try {
      setIsUploadingAudio(true);
      setError(null);
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Audio upload failed.");
      const data = await res.json();
      if (data.url) setAudioFiles([...audioFiles, data.url]);
    } catch (err) {
      setError("Audio upload failed.");
    } finally {
      setIsUploadingAudio(false);
      if (audioInputRef.current) audioInputRef.current.value = "";
    }
  };

  const handleGenerate = async () => {
    if (!session) {
      signIn();
      return;
    }
    if (mode === "text-to-video" && !prompt.trim()) return;
    if (
      mode !== "text-to-video" &&
      imagesList.length === 0 &&
      mode !== "reference-to-video"
    ) {
      setError("Please add at least one reference image.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResultUrl(null);
      setStatusMessage("Starting generation...");

      const res = await fetch("/api/seedance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          prompt,
          aspect_ratio: aspectRatio,
          resolution,
          duration,
          quality,
          images_list: imagesList,
          video_files: videoFiles,
          audio_files: audioFiles,
        }),
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
      const res = await fetch("/api/seedance/check-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, metadata }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Status check failed.");

      if (data.status === "completed") {
        setResultUrl(data.imageUrl);
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
    if (mode === "reference-to-video") {
      return Array.from({ length: 8 }, (_, i) => ({
        value: i + 8,
        label: `${i + 8} Seconds`,
      }));
    }
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
    const is720p = resolution === "720p";
    let rate;

    if (isReference) {
      if (is720p) {
        rate = quality === "high" ? 60 : 42;
      } else {
        rate = quality === "high" ? 48 : 36;
      }
    } else {
      if (is720p) {
        rate = quality === "high" ? 50 : 30;
      } else {
        rate = quality === "high" ? 30 : 24;
      }
    }
    return Math.ceil(duration * rate);
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
          Seedance v2.0 Playground
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-sm md:text-base text-muted max-w-2xl mx-auto leading-relaxed"
        >
          Experience the next generation of AI video creation. Transform your
          text and images into high-quality cinematic videos using our advanced
          Seedance v2.0 engine.
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
                Seedance Generator
              </h2>
              <p className="text-[10px] text-muted">Minimal Video Engine</p>
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
                    ? "Use @image1, @video1, @audio1 to reference your files... \nExample: @video1 in the style of @image1 with @audio1"
                    : "Describe your video..."
                }
                className="w-full h-32 bg-glass-bg border border-glass-border rounded-md p-2 text-sm outline-none focus:border-primary-500/40 resize-none transition-colors custom-scrollbar"
              />
            </div>

            {mode !== "text-to-video" && (
              <div className="space-y-3">
                <label className="text-[10px] font-medium text-muted uppercase tracking-wider">
                  Images ({imagesList.length}/9)
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
                    onChange={handleFileUpload}
                  />
                  <button
                    onClick={() => {
                      if (!session) {
                        signIn();
                        return;
                      }
                      fileInputRef.current?.click();
                    }}
                    disabled={isUploading || imagesList.length >= 9}
                    className="w-9 h-9 bg-primary-500/10 border border-primary-500/20 text-primary-500 rounded-md flex items-center justify-center hover:bg-primary-500 hover:text-white transition-colors"
                  >
                    {isUploading ? (
                      <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <IoImageOutline />
                    )}
                  </button>
                  <button
                    onClick={addImageToList}
                    disabled={!newImageUrl || imagesList.length >= 9}
                    className="w-9 h-9 bg-glass-bg border border-glass-border text-primary-500 rounded-md flex items-center justify-center hover:bg-primary-500 hover:text-white transition-colors"
                  >
                    <FaPlus />
                  </button>
                </div>
                {imagesList.length > 0 && (
                  <div className="grid grid-cols-5 gap-2">
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
                          @image{idx + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {mode === "reference-to-video" && (
              <div className="space-y-6 pt-4 border-t border-glass-border">
                <div className="space-y-3">
                  <label className="text-[10px] font-medium text-muted uppercase tracking-wider">
                    Video Clips ({videoFiles.length}/3)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newVideoUrl}
                      onChange={(e) => setNewVideoUrl(e.target.value)}
                      placeholder="Video URL..."
                      className="flex-1 bg-glass-bg border border-glass-border rounded-md px-3 py-2 text-xs outline-none focus:border-primary-500/40"
                    />
                    <input
                      type="file"
                      ref={videoInputRef}
                      hidden
                      accept=".mp4"
                      onChange={handleFileUploadVideo}
                    />
                    <button
                      onClick={() => {
                        if (!session) {
                          signIn();
                          return;
                        }
                        videoInputRef.current?.click();
                      }}
                      disabled={isUploadingVideo || videoFiles.length >= 3}
                      className="w-9 h-9 bg-primary-500/10 border border-primary-500/20 text-primary-500 rounded-md flex items-center justify-center hover:bg-primary-500 hover:text-white transition-colors"
                    >
                      {isUploadingVideo ? (
                        <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <FaVideo />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        if (newVideoUrl && videoFiles.length < 3) {
                          setVideoFiles([...videoFiles, newVideoUrl]);
                          setNewVideoUrl("");
                        }
                      }}
                      disabled={!newVideoUrl || videoFiles.length >= 3}
                      className="w-9 h-9 bg-glass-bg border border-glass-border text-primary-500 rounded-md flex items-center justify-center hover:bg-primary-500 hover:text-white transition-colors"
                    >
                      <FaPlus />
                    </button>
                  </div>
                  {videoFiles.length > 0 && (
                    <div className="grid grid-cols-5 gap-2">
                      {videoFiles.map((url, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-square rounded-md bg-glass-bg overflow-hidden group border border-glass-border"
                        >
                          <video
                            src={url}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() =>
                              setVideoFiles(
                                videoFiles.filter((_, i) => i !== idx),
                              )
                            }
                            className="absolute top-2 right-2 p-1 rounded bg-red-500/80 items-center justify-center hidden group-hover:flex"
                          >
                            <FaTrash className="text-white text-[10px]" />
                          </button>
                          <div className="absolute bottom-1 right-1 bg-black/60 px-1 rounded text-[8px] text-white">
                            @video{idx + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-medium text-muted uppercase tracking-wider">
                    Audio Clips ({audioFiles.length}/3)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newAudioUrl}
                      onChange={(e) => setNewAudioUrl(e.target.value)}
                      placeholder="Audio URL..."
                      className="flex-1 bg-glass-bg border border-glass-border rounded-md px-3 py-2 text-xs outline-none focus:border-primary-500/40"
                    />
                    <input
                      type="file"
                      ref={audioInputRef}
                      hidden
                      accept=".mp3,.wav"
                      onChange={handleFileUploadAudio}
                    />
                    <button
                      onClick={() => {
                        if (!session) {
                          signIn();
                          return;
                        }
                        audioInputRef.current?.click();
                      }}
                      disabled={isUploadingAudio || audioFiles.length >= 3}
                      className="w-9 h-9 bg-primary-500/10 border border-primary-500/20 text-primary-500 rounded-md flex items-center justify-center hover:bg-primary-500 hover:text-white transition-colors"
                    >
                      {isUploadingAudio ? (
                        <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <FaMusic />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        if (newAudioUrl && audioFiles.length < 3) {
                          setAudioFiles([...audioFiles, newAudioUrl]);
                          setNewAudioUrl("");
                        }
                      }}
                      disabled={!newAudioUrl || audioFiles.length >= 3}
                      className="w-9 h-9 bg-glass-bg border border-glass-border text-primary-500 rounded-md flex items-center justify-center hover:bg-primary-500 hover:text-white transition-colors"
                    >
                      <FaPlus />
                    </button>
                  </div>
                  {audioFiles.length > 0 && (
                    <div className="space-y-2">
                      {audioFiles.map((url, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-md bg-glass-bg border border-glass-border group"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FaMusic className="text-muted text-[10px]" />
                            <span className="text-[10px] text-foreground truncate">
                              {url.split("/").pop()}
                            </span>
                            <span className="text-[8px] text-primary-500 font-bold">
                              @audio{idx + 1}
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              setAudioFiles(
                                audioFiles.filter((_, i) => i !== idx),
                              )
                            }
                            className="text-muted hover:text-red-500"
                          >
                            <FaTrash className="text-[10px]" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <CustomSelect
                label="Aspect Ratio"
                value={aspectRatio}
                options={ASPECT_RATIOS}
                onChange={setAspectRatio}
              />
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
              <CustomSelect
                label="Quality"
                value={quality}
                options={QUALITIES}
                onChange={setQuality}
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={
              loading ||
              (mode === "text-to-video" && !prompt.trim()) ||
              (mode !== "text-to-video" && imagesList.length === 0)
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
                        downloadMedia(resultUrl, `seedance-${Date.now()}.mp4`)
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
