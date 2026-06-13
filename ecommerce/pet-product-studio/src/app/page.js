"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import {
  FaUpload, FaMagic, FaDownload, FaImage, FaKeyboard,
  FaSpinner, FaTrash, FaArrowRight, FaChevronRight, FaPlus
} from "react-icons/fa";

const DEFAULT_PROMPT = "Create a photorealistic ad image featuring ONE pet product in use with ONE pet. The scene must be safe, logical, and brand-agnostic (no logos/text unless specified). Prioritize clarity of product, correct pet species, and a believable environment.";

const ASPECT_RATIOS = ["1:1", "4:3", "3:4", "16:9", "9:16"];

export default function HomePage() {
  const { data: session, update: updateSession } = useSession();
  const [inputUrls, setInputUrls] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [downloadingImage, setDownloadingImage] = useState(false);
  const [customPrompt, setCustomPrompt] = useState(DEFAULT_PROMPT);
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [currentCreation, setCurrentCreation] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

  const fileInputRef = useRef(null);
  const pollRef = useRef(null);

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

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/creations");
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
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

        if (!res.ok) throw new Error(`Upload failed for ${file.name}`);
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
    setInputUrls(prev => prev.filter((_, i) => i !== index));
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
            setCurrentCreation((prev) => ({ ...prev, status: "failed" }));
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
      alert("Please upload at least one image of your pet product.");
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

  const activeDisplay = selectedHistoryItem || currentCreation;

  return (
    <main className="flex-1 flex justify-center overflow-hidden bg-white">
      <div className="flex h-full w-full max-w-[95%] lg:max-w-7xl overflow-hidden">

        {/* ── Left Sidebar Control Panel ── */}
        <aside className="w-[360px] flex-shrink-0 border-r border-neutral-100 flex flex-col overflow-hidden">

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

            {/* Input Images List Section */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="relative"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Reference Images ({inputUrls.length}/14)
                </span>
                {inputUrls.length > 0 && (
                  <button
                    onClick={() => !uploading && setInputUrls([])}
                    disabled={uploading}
                    className="text-[10px] text-neutral-400 hover:text-red-500 disabled:text-neutral-200 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Image list preview grid */}
              {inputUrls.length > 0 && (
                <div 
                  className={`grid grid-cols-4 gap-2 mb-3 p-1.5 rounded-sm border transition-all ${
                    isDragging 
                      ? "border-dashed border-neutral-950 bg-neutral-100/50 scale-[1.01]" 
                      : "border-transparent"
                  }`}
                >
                  {inputUrls.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-sm border border-neutral-200 overflow-hidden group bg-neutral-50">
                      <img src={url} alt={`input-${idx}`} className="w-full h-full object-cover" />
                      {!uploading && (
                        <button
                          onClick={() => handleDeleteUrl(idx)}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white hover:text-red-400 transition-opacity cursor-pointer text-xs"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  ))}
                  {inputUrls.length < 14 && (
                    uploading ? (
                      <div className="aspect-square flex flex-col items-center justify-center border border-dashed border-neutral-200 rounded-sm bg-neutral-50 text-neutral-400">
                        <FaSpinner className="animate-spin text-xs" />
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square flex flex-col items-center justify-center border border-dashed border-neutral-200 hover:border-neutral-300 rounded-sm bg-neutral-50 text-neutral-400 hover:text-neutral-600 transition-all cursor-pointer"
                      >
                        <FaPlus className="text-xs" />
                      </button>
                    )
                  )}
                </div>
              )}

              {inputUrls.length === 0 && (
                <div
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center gap-1.5 p-5 border border-dashed rounded-sm cursor-pointer transition-all ${
                    isDragging
                      ? "border-neutral-950 bg-neutral-100/50 scale-[1.01]"
                      : "border-neutral-200 hover:border-neutral-300 bg-neutral-50"
                  }`}
                >
                  {uploading ? (
                    <>
                      <FaSpinner className="animate-spin text-neutral-400 text-xs" />
                      <span className="text-[11px] text-neutral-500">Uploading assets...</span>
                    </>
                  ) : isDragging ? (
                    <>
                      <FaUpload className="text-neutral-900 text-xs animate-bounce" />
                      <span className="text-[11px] font-semibold text-neutral-900">Drop to upload!</span>
                      <span className="text-[10px] text-neutral-500">Release to add files</span>
                    </>
                  ) : (
                    <>
                      <FaUpload className="text-neutral-400 text-xs" />
                      <span className="text-[11px] font-medium text-neutral-700">Upload product images</span>
                      <span className="text-[10px] text-neutral-400">Drag & drop or click to upload</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Creative Prompt Input */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                Creative Prompt
              </span>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Describe your pet product setting..."
                rows={5}
                className="w-full p-2.5 text-xs text-neutral-800 border border-neutral-200 focus:border-neutral-400 focus:outline-none rounded-sm resize-none leading-relaxed bg-neutral-50"
              />
              <button
                onClick={() => setCustomPrompt(DEFAULT_PROMPT)}
                className="text-[10px] text-neutral-400 hover:text-neutral-600 block cursor-pointer"
              >
                Reset to default
              </button>
            </div>

            {/* Aspect Ratio Config */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                Aspect Ratio
              </span>
              <div className="grid grid-cols-4 gap-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`py-1.5 text-xs font-medium rounded-sm border transition-all cursor-pointer ${aspectRatio === ratio
                      ? "bg-neutral-900 border-neutral-900 text-white shadow-sm"
                      : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300"
                      }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* CTA Generate Footer Button */}
          <div className="p-4 border-t border-neutral-100 bg-white">
            {session ? (
              <button
                onClick={handleGenerate}
                disabled={generating || uploading}
                className="w-full py-2 bg-neutral-950 hover:bg-neutral-800 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {generating ? (
                  <>
                    <FaSpinner className="animate-spin text-[10px]" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FaMagic className="text-[10px]" />
                    Generate Ad Image (12 Credits)
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => signIn("google")}
                className="w-full py-2 bg-neutral-950 hover:bg-neutral-800 text-white font-semibold text-xs rounded-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Sign In to Generate
              </button>
            )}
          </div>

        </aside>

        {/* ── Right Workspace Canvas & Gallery ── */}
        <section className="flex-1 flex flex-col overflow-hidden bg-neutral-50/50">

          {/* Main Showcase Canvas */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-0">
            {activeDisplay ? (
              <div className="w-full h-full max-w-xl max-h-[80%] flex flex-col items-center justify-center gap-3">

                <div className="relative w-full flex-1 min-h-0 bg-white rounded-sm border border-neutral-200 shadow-sm overflow-hidden flex items-center justify-center">

                  {activeDisplay.status === "processing" ? (
                    <div className="flex flex-col items-center gap-2.5">
                      <FaSpinner className="animate-spin text-neutral-400 text-lg" />
                      <div className="text-center">
                        <p className="text-xs font-semibold text-neutral-800">Generating Ad Creative...</p>
                        <p className="text-[10px] text-neutral-400 mt-0.5">Usually takes 20-30 seconds</p>
                      </div>
                    </div>
                  ) : activeDisplay.status === "failed" ? (
                    <div className="text-center p-4">
                      <p className="text-xs font-semibold text-red-500">Generation Failed</p>
                      <p className="text-[10px] text-neutral-400 mt-1">{activeDisplay.error || "Unknown error occurred"}</p>
                    </div>
                  ) : (
                    <img
                      src={activeDisplay.outputUrl}
                      alt="Output"
                      className="w-full h-full object-contain"
                    />
                  )}

                </div>

                {/* Show Details and Action below preview */}
                {activeDisplay.status === "completed" && (
                  <div className="w-full flex items-center justify-between bg-white border border-neutral-200 rounded-sm p-3 shadow-xs">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-neutral-800 truncate">
                        {activeDisplay.prompt.slice(0, 70)}...
                      </p>
                      <span className="text-[9px] text-neutral-400 font-medium">
                        Aspect: {activeDisplay.aspectRatio || "1:1"}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDownload(activeDisplay.outputUrl, `pet-creative-${activeDisplay.id}.jpg`)}
                      disabled={downloadingImage}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 text-white rounded-sm text-[11px] font-medium transition-all cursor-pointer"
                    >
                      {downloadingImage ? (
                        <FaSpinner className="animate-spin text-[9px]" />
                      ) : (
                        <FaDownload className="text-[9px]" />
                      )}
                      {downloadingImage ? "Downloading..." : "Download"}
                    </button>
                  </div>
                )}

              </div>
            ) : (
              <div className="w-full h-full max-w-xl max-h-[80%] border border-dashed border-neutral-200 rounded-sm bg-white flex flex-col items-center justify-center p-6 text-center">
                <div className="h-10 w-10 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-400 mb-3 border border-neutral-100">
                  <FaImage className="text-sm" />
                </div>
                <p className="text-xs font-semibold text-neutral-800">Ready to Create</p>
                <p className="text-[10px] text-neutral-400 max-w-xs mt-1 leading-relaxed">
                  Upload your pet product photos, adjust settings, and generate a photorealistic ad scene.
                </p>
              </div>
            )}
          </div>

          {/* User History Gallery */}
          {history.length > 0 && (
            <div className="h-36 border-t border-neutral-100 bg-white flex flex-col overflow-hidden">
              <div className="px-4 py-2 flex items-center justify-between border-b border-neutral-50">
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Creations Gallery ({history.length})
                </span>
              </div>
              <div className="flex-1 flex gap-3 overflow-x-auto px-4 py-3 items-center">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedHistoryItem(item)}
                    className={`h-20 w-20 flex-shrink-0 rounded-sm border overflow-hidden transition-all bg-neutral-50 cursor-pointer relative ${activeDisplay?.id === item.id
                      ? "border-neutral-900 ring-1 ring-neutral-900 shadow-sm"
                      : "border-neutral-200 hover:border-neutral-400"
                      }`}
                  >
                    {item.status === "processing" ? (
                      <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400">
                        <FaSpinner className="animate-spin text-xs" />
                        <span className="text-[8px] mt-1 font-medium">Pending</span>
                      </div>
                    ) : item.status === "failed" ? (
                      <div className="w-full h-full flex flex-col items-center justify-center text-red-400 p-1 text-center">
                        <span className="text-[8px] font-semibold uppercase">Failed</span>
                      </div>
                    ) : (
                      <img
                        src={item.outputUrl}
                        alt="Thumbnail"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

        </section>

      </div>

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
