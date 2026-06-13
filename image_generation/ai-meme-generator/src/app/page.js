"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { FaCloudUploadAlt, FaMagic, FaSpinner, FaPlay, FaExclamationCircle, FaPlus, FaCoins } from "react-icons/fa";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { computeVideoCost } from "@/lib/creditCost";

export default function VideoGenerationPage() {
  const { data: session } = useSession();
  const [prompt, setPrompt] = useState("Create a short, funny meme-style video based on the uploaded image. Keep the character’s appearance consistent while adding exaggerated expressions, cartoon-like distortions, and playful comedic motion. The video should feel like a humorous reaction meme with simple background and over-the-top animation.");
  const [model, setModel] = useState("veo3.1");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [duration, setDuration] = useState("8");
  const [resolution, setResolution] = useState("720p");
  const [mode, setMode] = useState("normal");
  const [generateAudio, setGenerateAudio] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [lastImageUrl, setLastImageUrl] = useState("");
  const [uploadedImages, setUploadedImages] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [currentGeneration, setCurrentGeneration] = useState(null);
  const [history, setHistory] = useState([]);

  const getMaxImages = (m) => {
    if (m === "veo3.1") return 2;
    if (m === "kling-v3.0") return 4;
    if (m === "gemini-omni") return 5;
    if (m === "grok-imagine") return 7;
    return 4;
  };

  const getAspectRatios = () => {
    switch (model) {
      case "grok-imagine":
        return ["9:16", "16:9", "2:3", "3:2", "1:1"];
      case "kling-v3.0":
        return ["16:9", "9:16", "1:1"];
      case "gemini-omni":
      case "veo3.1":
      default:
        return ["16:9", "9:16"];
    }
  };

  const getResolutions = () => {
    switch (model) {
      case "grok-imagine":
        return ["480p", "720p"];
      case "gemini-omni":
        return ["720p", "1080p", "4k"];
      case "veo3.1":
      default:
        return ["720p", "1080p", "4k"];
    }
  };

  const getDurations = () => {
    switch (model) {
      case "kling-v3.0":
        return [
          { value: "3", label: "3 seconds" },
          { value: "4", label: "4 seconds" },
          { value: "5", label: "5 seconds" },
          { value: "6", label: "6 seconds" },
          { value: "7", label: "7 seconds" },
          { value: "8", label: "8 seconds" },
          { value: "9", label: "9 seconds" },
          { value: "10", label: "10 seconds" },
          { value: "11", label: "11 seconds" },
          { value: "12", label: "12 seconds" },
          { value: "13", label: "13 seconds" },
          { value: "14", label: "14 seconds" },
          { value: "15", label: "15 seconds" }
        ];
      case "gemini-omni":
        return [
          { value: "4", label: "4 seconds" },
          { value: "6", label: "6 seconds" },
          { value: "8", label: "8 seconds" },
          { value: "10", label: "10 seconds" }
        ];
      case "veo3.1":
      default:
        return [{ value: "8", label: "8 seconds" }];
    }
  };

  // Fetch past video creations
  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/creations");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.filter((item) => item.type === "video"));
      }
    } catch (e) {
      console.error("Failed to fetch history", e);
    }
  };

  useEffect(() => {
    if (session) {
      fetchHistory();
    }
  }, [session]);

  const handleFileUpload = async (e, type = "start") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErrorMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to upload file");
      }

      const data = await res.json();
      if (data.url) {
        if (type === "start") {
          setImageUrl(data.url);
          setUploadedImages(prev => {
            const next = [...prev];
            next[0] = data.url;
            return next;
          });
        } else {
          setImageUrl(prev => prev || data.url); // Ensure start is set
          setLastImageUrl(data.url);
          setUploadedImages(prev => {
            const next = [...prev];
            next[1] = data.url;
            return next;
          });
        }
      }
    } catch (err) {
      setErrorMessage(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleModelChange = (val) => {
    setModel(val);
    const maxImgs = getMaxImages(val);
    let nextImages = [...uploadedImages];
    if (nextImages.length > maxImgs) {
      nextImages = nextImages.slice(0, maxImgs);
      setUploadedImages(nextImages);
    }

    // Reset/adjust options to model defaults
    if (val === "veo3.1") {
      setAspectRatio("16:9");
      setDuration("8");
      setResolution("720p");
    } else if (val === "gemini-omni") {
      setAspectRatio("16:9");
      setDuration("8");
      setResolution("1080p");
    } else if (val === "kling-v3.0") {
      setAspectRatio("16:9");
      setDuration("5");
      setGenerateAudio(false);
    } else if (val === "grok-imagine") {
      setAspectRatio("2:3");
      setDuration("6");
      setResolution("480p");
      setMode("normal");
    }
  };

  const handleMultiImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    // Reset the input value immediately so the same file can be selected again
    e.target.value = "";

    const maxImgs = getMaxImages(model);
    // Use a snapshot of current length to avoid stale closure issues
    const currentCount = uploadedImages.length;
    if (currentCount + files.length > maxImgs) {
      alert(`You can upload a maximum of ${maxImgs} images.`);
      return;
    }

    setUploading(true);
    setErrorMessage("");

    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        return data.url;
      });

      const urls = await Promise.all(uploadPromises);
      setUploadedImages((prev) => {
        const nextImages = [...prev, ...urls].slice(0, maxImgs);
        if (nextImages.length > 0) setImageUrl(nextImages[0]);
        if (nextImages.length > 1) setLastImageUrl(nextImages[nextImages.length - 1]);
        return nextImages;
      });
    } catch (err) {
      setErrorMessage(err.message || "Failed to upload file(s)");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveMultiImage = (index) => {
    const nextImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(nextImages);
    setImageUrl(nextImages.length > 0 ? nextImages[0] : "");
    setLastImageUrl(nextImages.length > 1 ? nextImages[nextImages.length - 1] : "");
  };

  const handleGenerate = async () => {
    if (!session) {
      signIn("google");
      return;
    }

    if (uploadedImages.length === 0) {
      setErrorMessage("Please upload at least one image.");
      return;
    }

    if (!prompt) {
      setErrorMessage("Please enter a prompt describing the meme.");
      return;
    }

    setGenerating(true);
    setErrorMessage("");
    setStatusMessage("Submitting generation request...");
    setCurrentGeneration(null);

    try {
      const payload = {
        model,
        prompt,
        aspectRatio,
        duration,
        resolution,
        imagesList: uploadedImages,
        imageUrl: uploadedImages[0] || "",
        lastImageUrl: uploadedImages.length > 1 ? uploadedImages[uploadedImages.length - 1] : "",
        mode,
        generateAudio
      };

      const res = await fetch("/api/generate/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Generation failed");
      }

      const data = await res.json();
      setCurrentGeneration(data);
      pollStatus(data.requestId);
    } catch (err) {
      setErrorMessage(err.message || "Something went wrong");
      setGenerating(false);
    }
  };

  const pollStatus = (requestId) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      setStatusMessage(`Generating video (Polling attempt ${attempts})...`);

      try {
        const res = await fetch(`/api/creations?requestId=${requestId}`);
        if (!res.ok) throw new Error("Failed to fetch status");

        const data = await res.json();
        if (data.status === "completed") {
          clearInterval(interval);
          setGenerating(false);
          setStatusMessage("");
          setCurrentGeneration((prev) => ({ ...prev, status: "completed", url: data.url }));
          fetchHistory();
        } else if (data.status === "failed") {
          clearInterval(interval);
          setGenerating(false);
          setStatusMessage("");
          setErrorMessage(data.error || "API generation failed");
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 4000);
  };

  return (
    <div className="flex flex-1 h-full w-full overflow-y-hidden">
      {/* Sidebar Controls */}
      <div className="w-80 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col gap-4 h-full overflow-y-auto">
        <div className="flex flex-col gap-4 w-full h-full overflow-y-auto p-6">
          <h2 className="text-xl font-bold text-black dark:text-white">Create Meme Video</h2>

          {/* Upload Image Section */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Upload meme images (Max {getMaxImages(model)} {getMaxImages(model) === 1 ? "image" : "images"}) *
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {uploadedImages.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 group shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="Uploaded" className="object-cover w-full h-full" />
                  <div className="absolute bottom-1 left-1 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-bold text-white">
                    {model === "veo3.1" ? (i === 0 ? "Start" : "End") : `@image${i + 1}`}
                  </div>
                  <button
                    onClick={() => handleRemoveMultiImage(i)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors shadow-sm"
                  >
                    &times;
                  </button>
                </div>
              ))}
              {uploadedImages.length < getMaxImages(model) && (
                <label
                  key={`upload-slot-${uploadedImages.length}`}
                  className="aspect-square rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  {uploading ? (
                    <FaSpinner className="animate-spin text-zinc-400" />
                  ) : (
                    <FaPlus className="text-zinc-400 text-sm" />
                  )}
                  <input
                    type="file"
                    key={`file-input-${uploadedImages.length}`}
                    multiple={getMaxImages(model) - uploadedImages.length > 1}
                    accept="image/*"
                    onChange={handleMultiImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Meme Prompt */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Meme Prompt *</label>
            <textarea
              className="w-full h-24 p-3 text-sm bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none text-black dark:text-white placeholder:text-zinc-400"
              placeholder={
                model === "grok-imagine"
                  ? "Describe the video motion... Reference images with @image1, @image2, etc."
                  : model === "kling-v3.0"
                    ? "Describe the video motion... Reference images with <<<image_1>>>, etc."
                    : "Describe the video motion..."
              }
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          {/* Model Selection */}
          <CustomDropdown
            label="Model"
            value={model}
            options={[
              { value: "veo3.1", label: "Veo 3.1" },
              { value: "gemini-omni", label: "Gemini Omni" },
              { value: "kling-v3.0", label: "Kling V3.0 Omni Pro" },
              { value: "grok-imagine", label: "Grok Imagine" }
            ]}
            onChange={handleModelChange}
          />

          {/* Aspect Ratio */}
          <CustomDropdown
            label="Aspect Ratio"
            value={aspectRatio}
            options={getAspectRatios()}
            onChange={setAspectRatio}
          />

          {/* Grok Imagine specific Mode */}
          {model === "grok-imagine" && (
            <div className="flex flex-col gap-2">
              <CustomDropdown
                label="Mode"
                value={mode}
                options={[
                  { value: "normal", label: "Normal" },
                  { value: "fun", label: "Fun" },
                  { value: "spicy", label: "Spicy (No ext images)" }
                ]}
                onChange={setMode}
              />
              {mode === "spicy" && uploadedImages.length > 0 && (
                <span className="text-[10px] text-orange-500 leading-tight">
                  Note: Spicy mode is not supported with image inputs (automatically Normal).
                </span>
              )}
            </div>
          )}

          {/* Kling v3.0 specific Audio */}
          {model === "kling-v3.0" && (
            <div className="flex items-center justify-between py-1 bg-white dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Generate Audio
              </span>
              <button
                type="button"
                onClick={() => setGenerateAudio(!generateAudio)}
                className={`w-11 h-6 rounded-full transition-colors relative ${generateAudio ? "bg-orange-500" : "bg-zinc-300 dark:bg-zinc-700"
                  }`}
              >
                <span
                  className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${generateAudio ? "translate-x-5" : "translate-x-0"
                    }`}
                />
              </button>
            </div>
          )}

          {/* Duration Slider/Dropdown & Resolution Grid */}
          <div className="flex flex-col gap-4">
            {/* Duration */}
            {model === "grok-imagine" ? (
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  <span>Duration</span>
                  <span className="text-orange-500 font-bold">{duration} seconds</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="30"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full accent-orange-500 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none h-1.5 cursor-pointer"
                />
                <span className="text-[10px] text-zinc-400">Cost: $0.025/s at 480p, $0.05/s at 720p</span>
              </div>
            ) : (
              <CustomDropdown
                label="Duration"
                value={duration}
                options={getDurations()}
                onChange={setDuration}
              />
            )}

            {/* Resolution */}
            {(model === "veo3.1" || model === "gemini-omni" || model === "grok-imagine") && (
              <CustomDropdown
                label="Resolution"
                value={resolution}
                options={getResolutions()}
                onChange={setResolution}
              />
            )}
          </div>
        </div>
        <div className="px-6 pb-2 flex flex-col gap-4">
          {errorMessage && (
            <div className="text-xs text-red-500 flex items-center gap-1.5 bg-red-500/10 p-3 rounded-lg">
              <FaExclamationCircle className="flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={generating || uploading}
            className="mt-auto w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-zinc-400 disabled:to-zinc-500 text-white font-medium rounded-lg shadow-lg shadow-orange-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {generating ? <FaSpinner className="animate-spin" /> : null}
            {generating ? "Generating..." : (
              <span className="flex items-center gap-2">
                Generate Meme Video
                <span className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-0.5 text-xs font-bold">
                  <FaCoins className="text-yellow-300 text-[10px]" />
                  {computeVideoCost({ model, resolution, duration, generateAudio }).toLocaleString()} cr
                </span>
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8 bg-zinc-50 dark:bg-black overflow-y-auto">
        <div className="max-w-6xl mx-auto h-full flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-black dark:text-white">Meme Video Preview</h1>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 p-6 min-h-[400px]">
            {generating ? (
              <div className="text-center">
                <FaSpinner className="text-4xl text-orange-500 animate-spin mx-auto mb-4" />
                <p className="text-sm font-medium text-black dark:text-white mb-1">{statusMessage}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Do not close this page during generation.</p>
              </div>
            ) : currentGeneration && currentGeneration.status === "completed" ? (
              <div className="w-full max-w-2xl">
                <video
                  src={currentGeneration.url}
                  className="w-full h-auto rounded-lg border border-zinc-200 dark:border-zinc-800"
                  controls
                  autoPlay
                  loop
                />
                <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                  <h4 className="text-sm font-semibold text-black dark:text-white">Generation Prompt</h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">{currentGeneration.prompt}</p>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaPlay className="text-2xl text-zinc-400" />
                </div>
                <h3 className="text-lg font-medium text-black dark:text-white mb-2">No Video Preview</h3>
                <p className="text-zinc-500 dark:text-zinc-400 max-w-sm">
                  Your generated meme video preview will show here. Check the history or upload a starting frame to generate.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
