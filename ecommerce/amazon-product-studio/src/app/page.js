"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import {
  FaUpload,
  FaMagic,
  FaDownload,
  FaImage,
  FaTrash,
  FaSpinner,
  FaPlus,
  FaChevronDown,
  FaCheck,
} from "react-icons/fa";

const DEFAULT_PROMPT =
  "A professional product photograph of the product sitting on a clean minimalist white marble block pedestal, soft shadows, warm natural studio light, blurred plants in the background, commercial advertisement style.";

const PRESETS = [
  {
    name: "Minimalist Marble",
    prompt:
      "A professional product photograph of the product sitting on a clean minimalist white marble block pedestal, soft shadows, warm natural studio light, blurred plants in the background, commercial advertisement style.",
    description: "Elegant block with natural daylight",
  },
  {
    name: "Luxury Spotlight",
    prompt:
      "A professional product photograph of the product sitting on a black reflective glossy surface, dark moody backdrop, dramatic violet spotlight, professional studio commercial lighting, premium design aesthetic.",
    description: "Moody highlight with dark reflection",
  },
  {
    name: "Rustic Wood",
    prompt:
      "A professional product photograph of the product sitting on a rustic warm wood table, cozy sunny kitchen background, blurred sunlight through a window, green leaves, natural homeware lifestyle style.",
    description: "Cozy home table with window light",
  },
  {
    name: "Granite Countertop",
    prompt:
      "A professional product photograph of the product sitting on a modern clean dark granite kitchen countertop, blurred modern high-end kitchen background, bright direct sun rays, elegant look.",
    description: "Modern granite kitchen surface",
  },
  {
    name: "Sunny Beach",
    prompt:
      "A professional product photograph of the product resting on golden sea sand, beach seashore background, warm sunny afternoon light, blurry turquoise tropical ocean waves, summer commercial vibe.",
    description: "Warm golden sand & blurred ocean",
  },
  {
    name: "Forest Moss",
    prompt:
      "A professional product photograph of the product placed on a wet mossy green stone, lush magical forest backdrop, warm sun rays breaking through tree canopy, clean soft shadows, organic nature style.",
    description: "Organic stone in green woods",
  },
  {
    name: "Modern Office",
    prompt:
      "A professional product photograph of the product placed on a clean modern office desk, blurry keyboard, office plant and mug, bright corporate home office background, corporate professional style.",
    description: "Corporate office workspace desk",
  },
];

const ASPECT_RATIOS = ["1:1", "4:3", "3:4", "16:9", "9:16"];

export default function HomePage() {
  const { data: session, update: updateSession } = useSession();
  const [inputUrls, setInputUrls] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [downloadingImage, setDownloadingImage] = useState(false);
  const [customPrompt, setCustomPrompt] = useState(DEFAULT_PROMPT);
  const [selectedPreset, setSelectedPreset] = useState("Minimalist Marble");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [currentCreation, setCurrentCreation] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [isPresetDropdownOpen, setIsPresetDropdownOpen] = useState(false);
  const [isRatioDropdownOpen, setIsRatioDropdownOpen] = useState(false);

  const fileInputRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    if (session?.user) {
      fetchHistory();
    }
  }, [session]);

  // Periodic polling for active history items that are still processing
  useEffect(() => {
    const activePoll = setInterval(() => {
      const processingItems = history.filter(
        (item) => item.status === "processing",
      );
      if (processingItems.length > 0) {
        fetchHistory();
      }
    }, 4000);

    return () => {
      clearInterval(activePoll);
    };
  }, [history]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/creations");
      if (res.ok) {
        const data = await res.json();
        setHistory(data);

        // If there's an active display matching a history item, update its status
        if (currentCreation) {
          const matched = data.find(
            (c) => c.requestId === currentCreation.requestId,
          );
          if (matched && matched.status !== currentCreation.status) {
            setCurrentCreation(matched);
            if (matched.status === "completed" || matched.status === "failed") {
              setGenerating(false);
              updateSession();
            }
          }
        }
      }
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  };

  const uploadFiles = async (files) => {
    if (inputUrls.length + files.length > 14) {
      alert("You can upload a maximum of 14 reference images.");
      return;
    }

    if (!session) {
      signIn("google");
      return;
    }

    setUploading(true);
    try {
      const uploaded = [...inputUrls];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(
            `Upload failed for ${file.name}: ${errText || res.statusText}`,
          );
        }
        const data = await res.json();
        if (data.url) {
          uploaded.push(data.url);
        }
      }
      setInputUrls(uploaded);
    } catch (err) {
      console.error(err);
      alert(err.message || "Error uploading file. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    await uploadFiles(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!uploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (uploading) return;

    const files = Array.from(e.dataTransfer.files);
    if (!files.length) return;

    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      alert("Please drop image files only.");
      return;
    }

    await uploadFiles(imageFiles);
  };

  const handleDeleteUrl = (index) => {
    setInputUrls((prev) => prev.filter((_, i) => i !== index));
  };

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

  const startPolling = (requestId) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/creations?requestId=${requestId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "completed") {
            clearInterval(pollRef.current);
            setCurrentCreation((prev) => ({
              ...prev,
              status: "completed",
              outputUrl: data.outputUrl,
            }));
            setGenerating(false);
            fetchHistory();
            updateSession();
          } else if (data.status === "failed") {
            clearInterval(pollRef.current);
            setCurrentCreation((prev) => ({
              ...prev,
              status: "failed",
              error: data.error,
            }));
            setGenerating(false);
            updateSession();
            alert(`Generation failed: ${data.error || "Unknown error"}`);
          }
        }
      } catch (e) {
        console.error("Poll error:", e);
      }
    }, 3000);
  };

  const handleGenerate = async () => {
    if (!session) {
      signIn("google");
      return;
    }
    if (inputUrls.length === 0) {
      alert("Please upload at least one image of your Amazon product.");
      return;
    }
    const finalPrompt = customPrompt.trim() || DEFAULT_PROMPT;

    try {
      setGenerating(true);
      setSelectedHistoryItem(null);
      setCurrentCreation({
        status: "processing",
        inputUrls,
        prompt: finalPrompt,
      });

      const res = await fetch("/api/creations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputUrls,
          prompt: finalPrompt,
          aspectRatio,
        }),
      });

      if (!res.ok) throw new Error((await res.text()) || "Generation failed");

      const creation = await res.json();
      setCurrentCreation(creation);
      updateSession();
      startPolling(creation.requestId);
    } catch (err) {
      console.error(err);
      alert(err.message || "An error occurred.");
      setGenerating(false);
      setCurrentCreation(null);
    }
  };

  const selectPreset = (preset) => {
    setSelectedPreset(preset.name);
    setCustomPrompt(preset.prompt);
  };

  const activeDisplay = selectedHistoryItem || currentCreation;

  return (
    <main className="flex-1 flex flex-col md:flex-row md:overflow-hidden overflow-y-auto bg-zinc-950 text-zinc-100">
      {/* ── Left Sidebar Control Panel ── */}
      <aside className="w-full md:w-[400px] flex-shrink-0 border-b md:border-b-0 md:border-r border-zinc-800 bg-zinc-900/50 flex flex-col md:overflow-hidden overflow-visible">
        <div className="flex-1 overflow-y-auto px-5 pt-5 pb-20 space-y-6">
          {/* Reference Images Upload Block */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Product Photo ({inputUrls.length}/14)
              </span>
              {inputUrls.length > 0 && (
                <button
                  onClick={() => !uploading && setInputUrls([])}
                  disabled={uploading}
                  className="text-[10px] text-zinc-400 hover:text-red-400 disabled:text-zinc-600 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="relative"
            >
              {inputUrls.length > 0 && (
                <div
                  className={`grid grid-cols-4 gap-2 mb-3 p-2 rounded border transition-all ${
                    isDragging
                      ? "border-dashed border-violet-500 bg-violet-950/20 scale-[1.01]"
                      : "border-zinc-800 bg-zinc-900/30"
                  }`}
                >
                  {inputUrls.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square rounded border border-zinc-800 overflow-hidden group bg-zinc-950"
                    >
                      <img
                        src={url}
                        alt={`input-${idx}`}
                        className="w-full h-full object-cover"
                      />
                      {!uploading && (
                        <button
                          onClick={() => handleDeleteUrl(idx)}
                          className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white hover:text-red-400 transition-opacity cursor-pointer text-xs"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  ))}
                  {inputUrls.length < 14 &&
                    (uploading ? (
                      <div className="aspect-square flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded bg-zinc-900/40 text-zinc-500">
                        <FaSpinner className="animate-spin text-xs" />
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square flex flex-col items-center justify-center border border-dashed border-zinc-800 hover:border-zinc-700 rounded bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer"
                      >
                        <FaPlus className="text-xs" />
                      </button>
                    ))}
                </div>
              )}

              {inputUrls.length === 0 && (
                <div
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center gap-2 p-6 border border-dashed rounded cursor-pointer transition-all ${
                    isDragging
                      ? "border-violet-500 bg-violet-950/20 scale-[1.01]"
                      : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/20 hover:bg-zinc-900/40"
                  }`}
                >
                  {uploading ? (
                    <>
                      <FaSpinner className="animate-spin text-violet-400 text-sm" />
                      <span className="text-xs text-zinc-400">
                        Uploading product image...
                      </span>
                    </>
                  ) : isDragging ? (
                    <>
                      <FaUpload className="text-violet-400 text-sm animate-bounce" />
                      <span className="text-xs font-bold text-violet-400">
                        Drop it here!
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        Release files to add
                      </span>
                    </>
                  ) : (
                    <>
                      <FaUpload className="text-zinc-500 text-sm" />
                      <span className="text-xs font-semibold text-zinc-300">
                        Upload product image
                      </span>
                      <span className="text-[10px] text-zinc-500 text-center">
                        Drag & drop or click to upload
                        <br />
                        (Support transparent PNGs)
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Preset Scene Selection */}
          <div className="space-y-2 relative">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
              Preset Scene Templates
            </span>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsPresetDropdownOpen(!isPresetDropdownOpen);
                  setIsRatioDropdownOpen(false); // close other dropdown
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded text-xs text-zinc-200 transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-violet-900"
              >
                <div className="flex flex-col items-start text-left">
                  <span className="font-semibold text-zinc-100">
                    {selectedPreset || "Custom Prompt"}
                  </span>
                  {selectedPreset && (
                    <span className="text-[10px] text-zinc-500 truncate max-w-[280px]">
                      {
                        PRESETS.find((p) => p.name === selectedPreset)
                          ?.description
                      }
                    </span>
                  )}
                </div>
                <FaChevronDown
                  className={`text-zinc-500 text-xs transition-transform duration-200 ${isPresetDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isPresetDropdownOpen && (
                <>
                  {/* Click outside overlay */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsPresetDropdownOpen(false)}
                  />
                  {/* Dropdown Menu */}
                  <div className="absolute left-0 right-0 mt-1 max-h-[220px] overflow-y-auto overscroll-contain bg-zinc-950 border border-zinc-800 rounded shadow-xl z-20 p-1 space-y-0.5 scrollbar-thin">
                    {PRESETS.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => {
                          selectPreset(p);
                          setIsPresetDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left rounded text-xs transition-all cursor-pointer flex flex-col gap-0.5 ${
                          selectedPreset === p.name
                            ? "bg-violet-950/40 text-violet-300 font-semibold"
                            : "hover:bg-zinc-900 text-zinc-300"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{p.name}</span>
                          {selectedPreset === p.name && (
                            <FaCheck className="text-violet-400 text-[10px]" />
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-500 font-normal">
                          {p.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Custom descriptive Prompt Input */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
              Custom Prompt Guidance
            </span>
            <textarea
              value={customPrompt}
              onChange={(e) => {
                setCustomPrompt(e.target.value);
                setSelectedPreset(""); // Clear selected preset if editing directly
              }}
              placeholder="Describe the environment to place your product into..."
              rows={4}
              className="w-full p-3 text-xs text-zinc-200 border border-zinc-800 focus:border-zinc-700 focus:outline-none rounded bg-zinc-950 leading-relaxed resize-none transition-all focus:ring-1 focus:ring-violet-900"
            />
            <button
              onClick={() => {
                setSelectedPreset("Minimalist Marble");
                setCustomPrompt(DEFAULT_PROMPT);
              }}
              className="text-[10px] text-zinc-500 hover:text-zinc-300 block cursor-pointer transition-colors"
            >
              Reset to default template
            </button>
          </div>

          {/* Aspect Ratio Config */}
          <div className="space-y-2 relative">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
              Aspect Ratio
            </span>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsRatioDropdownOpen(!isRatioDropdownOpen);
                  setIsPresetDropdownOpen(false); // close other dropdown
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded text-xs text-zinc-200 transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-violet-900"
              >
                <span className="font-semibold text-zinc-100">
                  {aspectRatio}
                </span>
                <FaChevronDown
                  className={`text-zinc-500 text-xs transition-transform duration-200 ${isRatioDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isRatioDropdownOpen && (
                <>
                  {/* Click outside overlay */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsRatioDropdownOpen(false)}
                  />
                  {/* Dropdown Menu */}
                  <div className="absolute left-0 right-0 bottom-full mb-1 max-h-[280px] overflow-y-auto overscroll-contain bg-zinc-950 border border-zinc-800 rounded shadow-xl z-20 p-1 space-y-0.5 scrollbar-thin">
                    {ASPECT_RATIOS.map((ratio) => (
                      <button
                        key={ratio}
                        type="button"
                        onClick={() => {
                          setAspectRatio(ratio);
                          setIsRatioDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left rounded text-xs transition-all cursor-pointer flex items-center justify-between ${
                          aspectRatio === ratio
                            ? "bg-violet-950/40 text-violet-300 font-semibold"
                            : "hover:bg-zinc-900 text-zinc-300"
                        }`}
                      >
                        <span>{ratio}</span>
                        {aspectRatio === ratio && (
                          <FaCheck className="text-violet-400 text-[10px]" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* CTA Footer Submit Button */}
        <div className="p-5 border-t border-zinc-800 bg-zinc-900/70">
          {session ? (
            <button
              onClick={handleGenerate}
              disabled={generating || uploading}
              className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-white font-bold text-xs rounded transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-violet-950/15 hover:scale-[1.01]"
            >
              {generating ? (
                <>
                  <FaSpinner className="animate-spin text-sm" />
                  Generating listing...
                </>
              ) : (
                <>
                  <FaMagic className="text-xs" />
                  Generate Product Scene (18 Credits)
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Sign In to Start Generating
            </button>
          )}
        </div>
      </aside>

      {/* ── Right Workspace Canvas & Gallery ── */}
      <section className="flex-1 flex flex-col md:overflow-hidden overflow-visible bg-[#0c0c0e]">
        {/* Main Showcase Canvas */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-0">
          {activeDisplay ? (
            <div className="w-full h-full max-w-2xl max-h-[85%] flex flex-col items-center justify-center gap-4">
              {/* Output block display */}
              <div className="relative w-full flex-1 min-h-0 bg-zinc-900 rounded-lg border border-zinc-800/80 shadow-2xl overflow-hidden flex items-center justify-center">
                {activeDisplay.status === "processing" ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative flex items-center justify-center h-12 w-12">
                      <div className="absolute inset-0 rounded-full border-4 border-violet-500/25 animate-ping" />
                      <FaSpinner className="animate-spin text-violet-500 text-2xl relative" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-white">
                        Generating Ad Creative...
                      </p>
                      <p className="text-[11px] text-zinc-500 mt-1">
                        Usually finishes in 15-30 seconds
                      </p>
                    </div>
                  </div>
                ) : activeDisplay.status === "failed" ? (
                  <div className="text-center p-6 max-w-sm">
                    <div className="inline-flex items-center justify-center h-10 w-10 bg-red-950/20 border border-red-800/30 text-red-400 rounded-full mb-3">
                      <span className="text-sm font-bold">!</span>
                    </div>
                    <p className="text-sm font-bold text-red-400">
                      Generation Failed
                    </p>
                    <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                      {activeDisplay.error ||
                        "An error occurred. Your 18 credits have been fully refunded."}
                    </p>
                  </div>
                ) : (
                  <div className="relative w-full h-full">
                    {/* The Full Size Output Image */}
                    <img
                      src={activeDisplay.outputUrl}
                      alt="Output Ad Scene"
                      className="w-full h-full object-contain"
                    />

                    {activeDisplay.inputUrls && (() => {
                      let urls = activeDisplay.inputUrls;
                      if (typeof urls === "string") {
                        try {
                          urls = JSON.parse(urls);
                        } catch (e) {
                          urls = urls.split(",");
                        }
                      }
                      if (!Array.isArray(urls) || urls.length === 0) return null;
                      return (
                        <div className="absolute bottom-4 left-4 p-2 bg-black/80 backdrop-blur border border-zinc-700/50 rounded-lg shadow-lg flex items-center gap-2 max-w-[150px] overflow-hidden">
                          <div className="flex -space-x-2.5 overflow-hidden">
                            {urls.map((url, i) => (
                              <img
                                key={i}
                                src={url}
                                alt="input thumb"
                                className="w-7 h-7 rounded-full object-cover border-2 border-zinc-900 flex-shrink-0"
                              />
                            ))}
                          </div>
                          <span className="text-[9px] text-zinc-300 font-bold uppercase tracking-wider">
                            Product Info
                          </span>
                        </div>
                      );
                    })()}

                    {/* Floating Badge detailing status */}
                    <div className="absolute top-4 right-4 bg-zinc-950/80 backdrop-blur border border-zinc-800/50 px-2.5 py-1 rounded text-[10px] font-bold text-emerald-400 flex items-center gap-1.5 shadow-md">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      COMPLETED
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons Below Showcase */}
              {activeDisplay.status === "completed" && (
                <div className="w-full flex items-center justify-between bg-zinc-900 border border-zinc-800/80 rounded-lg p-4 shadow-lg">
                  <div className="min-w-0 pr-4">
                    <p className="text-xs font-bold text-white truncate max-w-md">
                      {activeDisplay.prompt}
                    </p>
                    <span className="text-[10px] text-zinc-500 font-semibold uppercase mt-0.5 block">
                      Aspect Ratio: {activeDisplay.aspectRatio || "1:1"}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      handleDownload(
                        activeDisplay.outputUrl,
                        `amazon-listing-${activeDisplay.id}.jpg`,
                      )
                    }
                    disabled={downloadingImage}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-800 text-white rounded font-bold text-xs transition-all cursor-pointer whitespace-nowrap shadow-md hover:scale-[1.01]"
                  >
                    {downloadingImage ? (
                      <FaSpinner className="animate-spin text-xs" />
                    ) : (
                      <FaDownload className="text-xs" />
                    )}
                    {downloadingImage ? "Downloading..." : "Download ad image"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full max-w-2xl max-h-[85%] border border-dashed border-zinc-800 rounded-lg bg-zinc-900/20 flex flex-col items-center justify-center p-8 text-center">
              <div className="h-12 w-12 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center text-zinc-500 mb-4 shadow-inner">
                <FaImage className="text-md" />
              </div>
              <p className="text-sm font-bold text-white">
                Create your Amazon ad image
              </p>
              <p className="text-xs text-zinc-500 max-w-sm mt-2 leading-relaxed">
                Upload your Amazon product photo on the left, select a premium
                template preset or enter a custom prompt, and click generate to
                create a professional ad listing scene.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* File input helper element for uploading supplementary files */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
        disabled={uploading}
      />
    </main>
  );
}
