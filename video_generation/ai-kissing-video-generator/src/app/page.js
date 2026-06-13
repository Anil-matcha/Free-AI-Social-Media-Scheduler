"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { calculateCreditCost } from "@/lib/utils/pricing";
import {
  FaHeart,
  FaUpload,
  FaTrash,
  FaSpinner,
  FaMagic,
  FaDownload,
  FaPlay,
  FaVideo,
  FaExchangeAlt,
  FaUserAlt,
  FaCheckCircle,
  FaExclamationCircle,
  FaChevronDown,
  FaChevronUp,
  FaCheck,
} from "react-icons/fa";

function ImageUploadZone({
  label,
  url,
  uploading,
  disabled,
  inputRef,
  onClearClick,
  onFileChange,
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] text-zinc-400 font-semibold mb-1 text-center flex items-center justify-center gap-1">
        <FaUserAlt className="text-rose-400 text-[8px]" /> {label}
      </span>
      <div
        onClick={() => !uploading && !disabled && inputRef.current?.click()}
        className={`h-36 rounded border border-dashed flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden group ${
          url
            ? "border-rose-500/20 bg-zinc-900/20"
            : "border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/50 hover:border-rose-500/30"
        }`}
      >
        {uploading && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center space-y-2 p-3 text-center z-10">
            <FaSpinner className="animate-spin text-rose-500 text-lg" />
            <span className="text-[9px] text-zinc-300 font-semibold uppercase tracking-wider animate-pulse">
              Uploading...
            </span>
          </div>
        )}
        {url ? (
          <>
            <img src={url} alt={label} className="w-full h-full object-cover" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClearClick();
              }}
              className="absolute top-1.5 right-1.5 p-1.5 bg-black/60 hover:bg-rose-600 text-white rounded text-[10px] transition-colors"
            >
              <FaTrash />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center p-3 text-center">
            <FaUpload className="text-zinc-500 text-sm group-hover:text-rose-400 group-hover:animate-bounce transition-colors mb-2" />
            <span className="text-[10px] font-semibold text-zinc-400 group-hover:text-zinc-200">
              {label}
            </span>
          </div>
        )}
        <input
          type="file"
          ref={inputRef}
          onChange={onFileChange}
          accept="image/*"
          className="hidden"
        />
      </div>
    </div>
  );
}

export default function WorkspacePage() {
  const {
    data: session,
    status: authStatus,
    update: updateSession,
  } = useSession();

  // File uploading states
  const [maleFile, setMaleFile] = useState(null);
  const [femaleFile, setFemaleFile] = useState(null);
  const [maleUrl, setMaleUrl] = useState("");
  const [femaleUrl, setFemaleUrl] = useState("");

  // Stitched preview canvas state
  const [stitchedUrl, setStitchedUrl] = useState("");
  const [canvasLoading, setCanvasLoading] = useState(false);
  const [maleUploading, setMaleUploading] = useState(false);
  const [femaleUploading, setFemaleUploading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Generator states
  const [modelId, setModelId] = useState("veo3.1-image-to-video");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [duration, setDuration] = useState(8);
  const [resolution, setResolution] = useState("720p");
  const [prompt, setPrompt] = useState(
    "A romantic couple, a handsome man on the left and a beautiful woman on the right, are leaning in and kissing passionately, high quality, realistic cinematic lighting, slow motion, extremely romantic.",
  );

  // Custom dropdown states
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [ratioDropdownOpen, setRatioDropdownOpen] = useState(false);
  const [durationDropdownOpen, setDurationDropdownOpen] = useState(false);
  const [resolutionDropdownOpen, setResolutionDropdownOpen] = useState(false);

  // Generation queue state
  const [generating, setGenerating] = useState(false);
  const [activeCreation, setActiveCreation] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Refs
  const maleInputRef = useRef(null);
  const femaleInputRef = useRef(null);
  const canvasRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const modelDropdownRef = useRef(null);
  const ratioDropdownRef = useRef(null);
  const durationDropdownRef = useRef(null);
  const resolutionDropdownRef = useRef(null);

  const modelParams = {
    "veo3.1-image-to-video": {
      durations: [8],
      resolutions: ["720p", "1080p", "4k"],
      defaultDuration: 8,
      defaultResolution: "720p"
    },
    "wan2.7-image-to-video": {
      durations: [2, 5, 8, 10, 12, 15],
      resolutions: ["720p", "1080p"],
      defaultDuration: 5,
      defaultResolution: "720p"
    },
    "gemini-omni-image-to-video": {
      durations: [4, 6, 8, 10],
      resolutions: ["720p", "1080p", "4k"],
      defaultDuration: 8,
      defaultResolution: "1080p"
    },
    "grok-imagine-image-to-video": {
      durations: [6, 10, 15, 20, 25, 30],
      resolutions: ["480p", "720p"],
      defaultDuration: 6,
      defaultResolution: "480p"
    }
  };

  useEffect(() => {
    const params = modelParams[modelId];
    if (params) {
      setDuration(params.defaultDuration);
      setResolution(params.defaultResolution);
    }
  }, [modelId]);

  const currentCost = calculateCreditCost(modelId, duration, resolution);

  const getModelCost = (mId) => {
    const params = modelParams[mId];
    if (!params) return 0;
    const testDur = params.durations.includes(duration) ? duration : params.defaultDuration;
    const testRes = params.resolutions.includes(resolution) ? resolution : params.defaultResolution;
    return calculateCreditCost(mId, testDur, testRes);
  };

  // Available models matching user instruction and config.js
  const models = [
    {
      id: "veo3.1-image-to-video",
      name: "Veo 3.1 Pro",
      cost: 25,
      description:
        "Google's cinematic generator, produces ultra-realistic 8s videos.",
      tag: "Best Quality",
    },
    {
      id: "gemini-omni-image-to-video",
      name: "Gemini Omni",
      cost: 15,
      description:
        "Highly cohesive Google Gemini model with perfect motion control.",
      tag: "Recommended",
    },
    {
      id: "grok-imagine-image-to-video",
      name: "Grok Imagine",
      cost: 2,
      description:
        "X's Grok video creator, optimized for creative layout animation.",
      tag: "New",
    },
    {
      id: "wan2.7-image-to-video",
      name: "Wan 2.7",
      cost: 1,
      description: "Ultra-fast generation with highly dynamic motion.",
      tag: "Fast & Cheap",
    },
  ];

  // Fetch creations history
  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/creations");
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
        // If there's an active processing creation, resume polling
        const processing = data.find((c) => c.status === "processing");
        if (processing && !generating) {
          startPolling(processing.requestId);
        }
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchHistory();
    } else if (authStatus !== "loading") {
      setLoadingHistory(false);
    }
    return () => stopPolling();
  }, [session, authStatus]);

  // Click outside dropdowns to close them
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        modelDropdownRef.current &&
        !modelDropdownRef.current.contains(event.target)
      ) {
        setModelDropdownOpen(false);
      }
      if (
        ratioDropdownRef.current &&
        !ratioDropdownRef.current.contains(event.target)
      ) {
        setRatioDropdownOpen(false);
      }
      if (
        durationDropdownRef.current &&
        !durationDropdownRef.current.contains(event.target)
      ) {
        setDurationDropdownOpen(false);
      }
      if (
        resolutionDropdownRef.current &&
        !resolutionDropdownRef.current.contains(event.target)
      ) {
        setResolutionDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Periodically refresh history if any item is marked "processing"
  useEffect(() => {
    let interval;
    const hasProcessing = history.some((c) => c.status === "processing");
    if (hasProcessing) {
      interval = setInterval(() => {
        fetchHistory();
      }, 4000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [history]);

  // Handle side-by-side drawing on hidden canvas
  useEffect(() => {
    if (!maleUrl || !femaleUrl) {
      setStitchedUrl("");
      return;
    }

    const stitchImages = async () => {
      setCanvasLoading(true);
      try {
        const loadImg = (src) => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = (e) =>
              reject(new Error("Failed to load image: " + src));
            img.src = src;
          });
        };

        const [imgMale, imgFemale] = await Promise.all([
          loadImg(maleUrl),
          loadImg(femaleUrl),
        ]);

        const canvas = canvasRef.current;
        if (!canvas) return;

        // Set dimensions for high-res 16:9 side-by-side stitch
        canvas.width = 1920;
        canvas.height = 1080;
        const ctx = canvas.getContext("2d");

        // Clear canvas
        ctx.fillStyle = "#09090b";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Left image (Male)
        const leftWidth = canvas.width / 2;
        const leftHeight = canvas.height;

        // Cover aspect ratio logic for Left half
        let scaleLeft = Math.max(
          leftWidth / imgMale.width,
          leftHeight / imgMale.height,
        );
        let wL = imgMale.width * scaleLeft;
        let hL = imgMale.height * scaleLeft;
        let xL = (leftWidth - wL) / 2;
        let yL = (leftHeight - hL) / 2;
        ctx.drawImage(imgMale, xL, yL, wL, hL);

        // Draw Right image (Female)
        const rightWidth = canvas.width / 2;
        const rightHeight = canvas.height;

        // Cover aspect ratio logic for Right half
        let scaleRight = Math.max(
          rightWidth / imgFemale.width,
          rightHeight / imgFemale.height,
        );
        let wR = imgFemale.width * scaleRight;
        let hR = imgFemale.height * scaleRight;
        let xR = leftWidth + (rightWidth - wR) / 2;
        let yR = (rightHeight - hR) / 2;
        ctx.drawImage(imgFemale, xR, yR, wR, hR);

        // Export data URL for local UI preview
        setStitchedUrl(canvas.toDataURL("image/jpeg", 0.9));
      } catch (err) {
        console.error("Canvas stitching error:", err);
      } finally {
        setCanvasLoading(false);
      }
    };

    stitchImages();
  }, [maleUrl, femaleUrl]);

  // Upload an image file securely to MuAPI
  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Upload failed: ${text}`);
    }

    const data = await res.json();
    return data.url;
  };

  // Upload handlers
  const handleMaleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMaleFile(file);
    setMaleUploading(true);
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setMaleUrl(url);
    } catch (err) {
      alert("Male photo upload failed: " + err.message);
      setMaleFile(null);
    } finally {
      setMaleUploading(false);
      setUploading(false);
    }
  };

  const handleFemaleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFemaleFile(file);
    setFemaleUploading(true);
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setFemaleUrl(url);
    } catch (err) {
      alert("Female photo upload failed: " + err.message);
      setFemaleFile(null);
    } finally {
      setFemaleUploading(false);
      setUploading(false);
    }
  };

  // Polling check for generation completion
  const startPolling = (requestId) => {
    stopPolling();
    setGenerating(true);

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/creations?requestId=${requestId}`);
        if (res.ok) {
          const result = await res.json();
          if (result.status === "completed" || result.status === "failed") {
            stopPolling();
            setGenerating(false);
            fetchHistory(); // Refresh history list

            // Re-fetch session to sync user credit hearts
            if (updateSession) updateSession();

            if (result.status === "completed") {
              // Load completed video in preview
              setActiveCreation({
                resultVideo: result.resultVideo,
                status: "completed",
                prompt: prompt,
              });
            } else {
              alert(
                "Video generation failed: " + (result.error || "Unknown error"),
              );
            }
          }
        }
      } catch (err) {
        console.error("Error polling creation status:", err);
      }
    }, 4000);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // Submit Generation
  const handleGenerate = async () => {
    if (!session) {
      signIn("google");
      return;
    }

    if (!maleUrl || !femaleUrl || !stitchedUrl) {
      alert(
        "Please upload both male and female photos to create the composite kissing image.",
      );
      return;
    }

    if (!prompt.trim()) {
      alert("Please input a prompt.");
      return;
    }

    setGenerating(true);
    setUploading(true);

    try {
      // 1. Upload stitched canvas composition to MuAPI
      const canvas = canvasRef.current;
      const stitchedBlob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.9),
      );
      const file = new File([stitchedBlob], "kiss-composition.jpg", {
        type: "image/jpeg",
      });
      const finalStitchedUrl = await uploadImage(file);

      // 2. Submit task to creations route
      const res = await fetch("/api/creations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maleImage: maleUrl,
          femaleImage: femaleUrl,
          stitchedImage: finalStitchedUrl,
          prompt,
          modelId,
          aspectRatio,
          duration,
          resolution,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }

      const creation = await res.json();
      setActiveCreation(creation);
      startPolling(creation.requestId);
    } catch (err) {
      alert(err.message || "Failed to submit creation task.");
      setGenerating(false);
    } finally {
      setUploading(false);
    }
  };

  const activeModel = models.find((m) => m.id === modelId);
  const currentRatio = activeCreation?.aspectRatio || aspectRatio;
  const isVertical = currentRatio === "9:16";

  return (
    <main className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden overflow-y-auto bg-zinc-950 text-zinc-100 h-full relative custom-scrollbar">
      {/* Background ambient light */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pulse-glow-bg pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl pulse-glow-bg pointer-events-none" />

      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Left Column: Input Forms and Configuration */}
      <section className="w-full lg:w-[400px] border-r border-zinc-800 bg-zinc-950/70 backdrop-blur-md lg:overflow-y-auto overflow-visible flex flex-col p-6 space-y-6 flex-shrink-0 z-10 custom-scrollbar">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <FaMagic className="text-rose-500 animate-pulse text-sm" />
            Make Them Kiss
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Upload two photos. We will compose them into a high-fidelity
            cinematic video of them kissing.
          </p>
        </div>

        {/* 1. Model Selector Dropdown */}
        <div className="space-y-2 relative" ref={modelDropdownRef}>
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Select AI Model
          </label>
          <button
            type="button"
            onClick={() =>
              !generating && setModelDropdownOpen(!modelDropdownOpen)
            }
            disabled={generating}
            className={`w-full flex items-center justify-between p-3.5 rounded border transition-all text-left bg-zinc-900/60 border-zinc-800 hover:border-zinc-750 text-white ${
              generating
                ? "cursor-not-allowed opacity-60"
                : "cursor-pointer hover:bg-zinc-900/80"
            }`}
          >
            <div className="flex flex-col pr-4 overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">
                  {activeModel?.name}
                </span>
                {activeModel?.tag && (
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-rose-500/25 text-rose-300">
                    {activeModel.tag}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5 truncate max-w-[280px]">
                {activeModel?.description}
              </p>
            </div>
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-500/25 text-rose-300">
                {currentCost} Hearts
              </span>
              {modelDropdownOpen ? (
                <FaChevronUp className="text-xs text-zinc-400" />
              ) : (
                <FaChevronDown className="text-xs text-zinc-400" />
              )}
            </div>
          </button>

          {modelDropdownOpen && (
            <div className="absolute top-full left-0 right-0 z-50 w-full mt-1.5 bg-zinc-900 border border-zinc-800 rounded shadow-2xl overflow-y-auto overscroll-contain max-h-72 custom-scrollbar">
              <div className="p-1.5 space-y-1">
                {models.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setModelId(m.id);
                      setModelDropdownOpen(false);
                    }}
                    className={`w-full flex items-start justify-between p-3 rounded text-left transition-all ${
                      modelId === m.id
                        ? "bg-rose-500/10 text-white"
                        : "hover:bg-zinc-800/60 text-zinc-300"
                    }`}
                  >
                    <div className="flex flex-col pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold">{m.name}</span>
                        {m.tag && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                              modelId === m.id
                                ? "bg-rose-500/20 text-rose-300"
                                : "bg-zinc-800 text-zinc-400"
                            }`}
                          >
                            {m.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-1 leading-normal max-w-[280px]">
                        {m.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          modelId === m.id
                            ? "bg-rose-500/25 text-rose-300"
                            : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {getModelCost(m.id)} Hearts
                      </span>
                      {modelId === m.id && (
                        <FaCheck className="text-[9px] text-rose-400 ml-1.5" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 2. Double Upload Zones */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Provide Two Photos
          </label>
          <div className="grid grid-cols-2 gap-3">
            <ImageUploadZone
              label="Male / Left Image"
              url={maleUrl}
              uploading={maleUploading}
              disabled={generating}
              inputRef={maleInputRef}
              onClearClick={() => {
                setMaleUrl("");
                setMaleFile(null);
              }}
              onFileChange={handleMaleUpload}
            />

            <ImageUploadZone
              label="Female / Right Image"
              url={femaleUrl}
              uploading={femaleUploading}
              disabled={generating}
              inputRef={femaleInputRef}
              onClearClick={() => {
                setFemaleUrl("");
                setFemaleFile(null);
              }}
              onFileChange={handleFemaleUpload}
            />
          </div>
        </div>

        {/* 3. Stitched Side-by-Side Live Composite Preview */}
        {maleUrl && femaleUrl && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>Merged Composite Preview</span>
              {canvasLoading && (
                <FaSpinner className="animate-spin text-rose-500 text-xs" />
              )}
            </label>
            <div className="relative h-24 rounded border border-zinc-800 bg-zinc-900/50 overflow-hidden flex items-center justify-center">
              {stitchedUrl ? (
                <>
                  <img
                    src={stitchedUrl}
                    alt="Composite Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-black/75 rounded text-[8px] font-bold text-rose-400 flex items-center gap-1">
                    <FaExchangeAlt className="text-[7px]" /> Ready to Kiss
                  </div>
                </>
              ) : (
                <span className="text-xs text-zinc-500 animate-pulse">
                  Composing layout...
                </span>
              )}
            </div>
          </div>
        )}

        {/* 4. Aspect Ratio Selector Dropdown */}
        <div className="space-y-2 relative" ref={ratioDropdownRef}>
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Aspect Ratio
          </label>
          <button
            type="button"
            onClick={() =>
              !generating && setRatioDropdownOpen(!ratioDropdownOpen)
            }
            disabled={generating}
            className={`w-full flex items-center justify-between p-3.5 rounded border transition-all text-left bg-zinc-900/60 border-zinc-800 hover:border-zinc-750 text-white ${
              generating
                ? "cursor-not-allowed opacity-60"
                : "cursor-pointer hover:bg-zinc-900/80"
            }`}
          >
            <div className="flex flex-col pr-4">
              <span className="text-xs font-bold text-white">
                {aspectRatio === "16:9"
                  ? "Widescreen (16:9)"
                  : "Portrait (9:16)"}
              </span>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                {aspectRatio === "16:9"
                  ? "Landscape layout optimized for desktop viewports."
                  : "Vertical layout optimized for mobile screens."}
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {ratioDropdownOpen ? (
                <FaChevronUp className="text-xs text-zinc-400" />
              ) : (
                <FaChevronDown className="text-xs text-zinc-400" />
              )}
            </div>
          </button>

          {ratioDropdownOpen && (
            <div className="absolute bottom-full left-0 right-0 z-50 w-full mb-1.5 bg-zinc-900 border border-zinc-800 rounded shadow-2xl overflow-y-auto overscroll-contain max-h-72 custom-scrollbar animate-fade-in-up">
              <div className="p-1.5 space-y-1">
                {[
                  {
                    id: "16:9",
                    label: "Widescreen (16:9)",
                    desc: "Best for landscape displays.",
                  },
                  {
                    id: "9:16",
                    label: "Portrait (9:16)",
                    desc: "Best for social stories & phone viewing.",
                  },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setAspectRatio(r.id);
                      setRatioDropdownOpen(false);
                    }}
                    className={`w-full flex items-start justify-between p-3 rounded text-left transition-all ${
                      aspectRatio === r.id
                        ? "bg-rose-500/10 text-white"
                        : "hover:bg-zinc-800/60 text-zinc-300"
                    }`}
                  >
                    <div className="flex flex-col pr-4">
                      <span className="text-xs font-bold">{r.label}</span>
                      <p className="text-[10px] text-zinc-400 mt-1 leading-normal">
                        {r.desc}
                      </p>
                    </div>
                    {aspectRatio === r.id && (
                      <FaCheck className="text-[9px] text-rose-400 ml-1.5 mt-1 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 5. Video Duration Dropdown */}
        <div className="space-y-2 relative" ref={durationDropdownRef}>
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Video Duration
          </label>
          <button
            type="button"
            onClick={() =>
              !generating && setDurationDropdownOpen(!durationDropdownOpen)
            }
            disabled={generating || modelParams[modelId]?.durations.length <= 1}
            className={`w-full flex items-center justify-between p-3.5 rounded border transition-all text-left bg-zinc-900/60 border-zinc-800 ${
              generating || modelParams[modelId]?.durations.length <= 1
                ? "cursor-not-allowed opacity-60"
                : "cursor-pointer hover:border-zinc-750 hover:bg-zinc-900/80"
            } text-white`}
          >
            <div className="flex flex-col pr-4">
              <span className="text-xs font-bold text-white">
                {duration} Seconds
              </span>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                {modelId === "veo3.1-image-to-video"
                  ? "Veo 3.1 Pro renders cinematic high-fidelity exactly at 8s."
                  : `Select duration between ${Math.min(...modelParams[modelId]?.durations)}s and ${Math.max(...modelParams[modelId]?.durations)}s.`}
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {modelParams[modelId]?.durations.length > 1 && (
                durationDropdownOpen ? (
                  <FaChevronUp className="text-xs text-zinc-400" />
                ) : (
                  <FaChevronDown className="text-xs text-zinc-400" />
                )
              )}
            </div>
          </button>

          {durationDropdownOpen && modelParams[modelId]?.durations.length > 1 && (
            <div className="absolute bottom-full left-0 right-0 z-50 w-full mb-1.5 bg-zinc-900 border border-zinc-800 rounded shadow-2xl overflow-y-auto overscroll-contain max-h-48 custom-scrollbar">
              <div className="p-1.5 space-y-1">
                {modelParams[modelId]?.durations.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setDuration(d);
                      setDurationDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded text-xs text-left transition-all ${
                      duration === d
                        ? "bg-rose-500/10 text-white font-bold"
                        : "hover:bg-zinc-800/60 text-zinc-300"
                    }`}
                  >
                    <span>{d} Seconds</span>
                    {duration === d && (
                      <FaCheck className="text-[9px] text-rose-400 flex-shrink-0 ml-1.5" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 6. Video Resolution Dropdown */}
        <div className="space-y-2 relative" ref={resolutionDropdownRef}>
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Video Resolution
          </label>
          <button
            type="button"
            onClick={() =>
              !generating && setResolutionDropdownOpen(!resolutionDropdownOpen)
            }
            disabled={generating}
            className={`w-full flex items-center justify-between p-3.5 rounded border transition-all text-left bg-zinc-900/60 border-zinc-800 hover:border-zinc-750 text-white ${
              generating
                ? "cursor-not-allowed opacity-60"
                : "cursor-pointer hover:bg-zinc-900/80"
            }`}
          >
            <div className="flex flex-col pr-4">
              <span className="text-xs font-bold text-white uppercase">
                {resolution}
              </span>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                {resolution === "4k"
                  ? "Ultra-premium output. Yields highest visual clarity."
                  : resolution === "1080p"
                  ? "High-definition output with perfect clarity balance."
                  : resolution === "720p"
                  ? "Standard high-definition render, fast and cost-effective."
                  : "Standard definition, ultra cost-effective render."}
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {resolutionDropdownOpen ? (
                <FaChevronUp className="text-xs text-zinc-400" />
              ) : (
                <FaChevronDown className="text-xs text-zinc-400" />
              )}
            </div>
          </button>

          {resolutionDropdownOpen && (
            <div className="absolute bottom-full left-0 right-0 z-50 w-full mb-1.5 bg-zinc-900 border border-zinc-800 rounded shadow-2xl overflow-y-auto overscroll-contain max-h-48 custom-scrollbar">
              <div className="p-1.5 space-y-1">
                {modelParams[modelId]?.resolutions.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setResolution(r);
                      setResolutionDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded text-xs text-left transition-all ${
                      resolution === r
                        ? "bg-rose-500/10 text-white font-bold"
                        : "hover:bg-zinc-800/60 text-zinc-300"
                    }`}
                  >
                    <span className="uppercase">{r}</span>
                    {resolution === r && (
                      <FaCheck className="text-[9px] text-rose-400 flex-shrink-0 ml-1.5" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 5. Prompt editor */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Edit Romantic Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => !generating && setPrompt(e.target.value)}
            disabled={generating}
            rows={3}
            className="w-full bg-zinc-900/60 border border-zinc-800 rounded p-3 text-xs text-zinc-300 focus:outline-none focus:border-rose-500/40 focus:ring-1 focus:ring-rose-500/20 leading-relaxed resize-none"
            placeholder="Describe the kiss movement..."
          />
        </div>

        {/* 6. Action Submit Button */}
        <button
          onClick={handleGenerate}
          disabled={
            generating || uploading || !maleUrl || !femaleUrl || canvasLoading
          }
          className={`w-full py-3.5 rounded font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xl hover:scale-[1.01] ${
            generating || uploading || !maleUrl || !femaleUrl || canvasLoading
              ? "bg-zinc-900 border border-zinc-850 text-zinc-500 cursor-not-allowed shadow-none"
              : "bg-gradient-to-r from-pink-500 via-rose-500 to-rose-600 text-white hover:from-pink-600 hover:to-rose-700 shadow-rose-500/10 cursor-pointer"
          }`}
        >
          {generating ? (
            <>
              <FaSpinner className="animate-spin text-sm" />
              <span>Generating romantic video...</span>
            </>
          ) : uploading ? (
            <>
              <FaSpinner className="animate-spin text-sm" />
              <span>Uploading composition...</span>
            </>
          ) : (
            <>
              <FaHeart className="text-xs animate-pulse" />
              <span>Generate Kiss Video ({currentCost} Hearts)</span>
            </>
          )}
        </button>
      </section>

      {/* Right Column: Output Showcase & Creation Feeds */}
      <section className="flex-1 flex flex-col lg:overflow-hidden overflow-visible bg-zinc-950/40">
        {/* Top active generation display screen */}
        <div className="flex-1 p-6 flex flex-col justify-center items-center relative overflow-hidden border-b border-zinc-800/80 min-h-[400px]">
          {generating ? (
            // Shimmer processing card
            <div className={`w-full glass-panel rounded flex flex-col items-center justify-center p-8 text-center space-y-4 shadow-2xl relative overflow-hidden shimmer-placeholder transition-all duration-300 ${
              isVertical ? "max-w-[320px] aspect-[9/16]" : "max-w-xl aspect-video"
            }`}>
              <div className="h-10 w-10 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500 text-xs animate-ping" />
              <div className="space-y-2">
                <h3 className="text-md font-bold text-white leading-tight">
                  We are making them kiss...
                </h3>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                  Generating video with{" "}
                  <span className="text-rose-400 font-semibold">
                    {activeModel?.name}
                  </span>
                  . Since this is an advanced high-quality rendering, it can
                  take up to 2-3 minutes. Thank you for your patience!
                </p>
              </div>
              <div className="text-[10px] text-zinc-500 bg-zinc-900/60 px-3 py-1.5 rounded border border-zinc-800">
                🔒 Safe execution: if rendering fails, your Hearts will be fully
                refunded.
              </div>
            </div>
          ) : activeCreation?.resultVideo ? (
            // Finished Output Video Player
            <div className={`w-full flex flex-col space-y-4 transition-all duration-300 ${
              isVertical ? "max-w-[500px]" : "max-w-xl"
            }`}>
              <div className={`glass-panel rounded overflow-hidden shadow-2xl relative border border-zinc-800/50 rose-glow ${
                isVertical ? "" : ""
              }`}>
                <video
                  src={activeCreation.resultVideo}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-center justify-between gap-3 bg-zinc-900/40 border border-zinc-800/80 p-4 rounded">
                <div className="space-y-1 max-w-[70%]">
                  <h4 className="text-xs font-bold text-white truncate">
                    {activeCreation.prompt}
                  </h4>
                  <p className="text-[10px] text-zinc-500 uppercase font-semibold">
                    Generated with {activeCreation.modelId || modelId}
                  </p>
                </div>
                <a
                  href={activeCreation.resultVideo}
                  download="kiss-video.mp4"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
                >
                  <FaDownload className="text-[10px]" />
                  <span>Download</span>
                </a>
              </div>
            </div>
          ) : (
            // Idle empty display placeholder
            <div className={`text-center space-y-4 glass-panel border border-zinc-800/50 rounded relative flex flex-col items-center justify-center transition-all duration-300 ${
              isVertical ? "max-w-[320px] aspect-[9/16] p-6" : "max-w-md p-8"
            }`}>
              <div className="h-12 w-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 text-sm">
                <FaVideo />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-md font-bold text-white leading-tight">
                  Your Kissing Masterpiece awaits
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Upload photos, select a romantic style model on the left
                  panel, and click Generate to see the magic happen in real
                  time.
                </p>
              </div>
              {session?.user && history.length > 0 && (
                <button
                  onClick={() => setActiveCreation(history[0])}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded text-xs font-semibold transition-colors cursor-pointer"
                >
                  <FaPlay className="text-[9px]" />
                  <span>Load Latest Generation</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bottom creations feed gallery */}
        <div className="h-[200px] p-4 bg-zinc-950/60 flex flex-col space-y-3 overflow-hidden">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Creations Feed
          </h3>

          {loadingHistory ? (
            <div className="flex-1 flex items-center justify-center">
              <FaSpinner className="animate-spin text-rose-500 text-sm" />
            </div>
          ) : !session ? (
            <div className="flex-1 flex flex-col items-center justify-center p-4 border border-zinc-800/60 rounded bg-zinc-900/10 text-center">
              <p className="text-xs text-zinc-400">
                Sign in to securely view and save your historical feed
                creations.
              </p>
              <button
                onClick={() => signIn("google")}
                className="mt-3.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-xs font-bold cursor-pointer"
              >
                Sign In With Google
              </button>
            </div>
          ) : history.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-4 border border-zinc-800/60 rounded bg-zinc-900/10 text-center">
              <p className="text-xs text-zinc-500">
                No creations generated yet. Start your first romance project
                now!
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-x-auto flex gap-4 pb-2 items-center">
              {history.map((c) => (
                <div
                  key={c.id}
                  onClick={() => !generating && setActiveCreation(c)}
                  className={`flex-shrink-0 w-64 h-36 glass-panel rounded overflow-hidden cursor-pointer relative border transition-all ${
                    activeCreation?.id === c.id
                      ? "border-rose-500/50 rose-glow scale-[0.98]"
                      : "border-zinc-850 hover:border-zinc-750"
                  }`}
                >
                  {/* Status overlay */}
                  {c.status === "processing" ? (
                    <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center space-y-1.5">
                      <FaSpinner className="animate-spin text-rose-500 text-sm" />
                      <span className="text-[9px] text-zinc-400 uppercase font-semibold tracking-wider">
                        Processing...
                      </span>
                    </div>
                  ) : c.status === "failed" ? (
                    <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center space-y-1.5 p-3 text-center">
                      <FaExclamationCircle className="text-red-500 text-xs" />
                      <span className="text-[9px] text-zinc-400 font-semibold truncate max-w-full">
                        Failed
                      </span>
                    </div>
                  ) : (
                    <>
                      {/* Hover play video preview or thumbnail */}
                      <video
                        src={c.resultVideo}
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2.5">
                        <div className="space-y-0.5 max-w-full">
                          <p className="text-[10px] text-white font-bold truncate max-w-[220px]">
                            {c.prompt}
                          </p>
                          <span className="text-[8px] text-zinc-400 font-semibold uppercase">
                            {c.modelId}
                          </span>
                        </div>
                      </div>
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/60 rounded text-[8px] font-bold text-rose-400 flex items-center gap-0.5">
                        <FaHeart className="text-[6px]" /> Completed
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
