"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { FaCloudUploadAlt, FaMagic, FaSpinner, FaPlus, FaImage, FaExclamationCircle, FaCoins } from "react-icons/fa";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { computeImageCost } from "@/lib/creditCost";

export default function ImageGenerationPage() {
  const { data: session } = useSession();
  const [prompt, setPrompt] = useState("Turn this person into an absolutely legendary meme! Give them exaggerated reactions, epic facial expressions, and over-the-top gestures. Make it so funny and relatable that everyone will want to share it instantly. Add dramatic zoom-ins, reaction shots, and that perfect comedic timing that makes memes go viral.");
  const [modelFamily, setModelFamily] = useState("wan2.7");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [resolution, setResolution] = useState("2K"); // For GPT and Nano Banana
  const [quality, setQuality] = useState("high"); // For GPT
  const [googleSearch, setGoogleSearch] = useState(false); // For Nano Banana
  const [uploadedImages, setUploadedImages] = useState([]); // Array of strings (URLs)
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [currentGeneration, setCurrentGeneration] = useState(null);
  const [history, setHistory] = useState([]);

  // Fetch past image creations
  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/creations");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.filter((item) => item.type === "image"));
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

  const getAspectRatios = () => {
    switch (modelFamily) {
      case "wan2.7":
        return ["1:1", "4:3", "3:4", "16:9", "9:16", "21:9", "9:21", "3:2", "2:3"];
      case "gpt-image-2":
        return ["auto", "1:1", "16:9", "9:16", "4:3", "3:4"];
      case "nano-banana-2":
        return ["1:1", "1:4", "1:8", "2:3", "3:2", "3:4", "4:1", "4:3", "4:5", "5:4", "8:1", "9:16", "16:9", "21:9", "Auto"];
      default:
        return ["1:1"];
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (uploadedImages.length + files.length > 4) {
      alert("You can upload a maximum of 4 images.");
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
      setUploadedImages((prev) => [...prev, ...urls].slice(0, 4));
    } catch (err) {
      setErrorMessage(err.message || "Failed to upload file(s)");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (!session) {
      signIn("google");
      return;
    }

    if (!prompt) {
      setErrorMessage("Please enter a prompt describing the image.");
      return;
    }

    setGenerating(true);
    setErrorMessage("");
    setStatusMessage("Submitting generation request...");
    setCurrentGeneration(null);

    try {
      const res = await fetch("/api/generate/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelFamily,
          prompt,
          imagesList: uploadedImages,
          aspectRatio,
          resolution,
          quality,
          googleSearch,
        }),
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
      setStatusMessage(`Generating image (Polling attempt ${attempts})...`);

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
    }, 3000);
  };

  return (
    <div className="flex flex-1 h-[calc(100vh-73px)]">
      {/* Sidebar Controls */}
      <div className="w-80 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col gap-6 overflow-y-auto">
        <div className="flex flex-col gap-4 w-full h-full overflow-y-auto p-6">
          <h2 className="text-xl font-bold text-black dark:text-white">Create Meme Image</h2>


          {/* Upload Images Section */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Upload meme image (Max 4 images)
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {uploadedImages.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="Uploaded" className="object-cover w-full h-full" />
                  <button
                    onClick={() => handleRemoveImage(i)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                  >
                    &times;
                  </button>
                </div>
              ))}
              {uploadedImages.length < 4 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                  {uploading ? (
                    <FaSpinner className="animate-spin text-zinc-400" />
                  ) : (
                    <FaPlus className="text-zinc-400 text-sm" />
                  )}
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
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
              placeholder="Describe the meme image..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          {/* Model Selection */}
          <CustomDropdown
            label="Model"
            value={modelFamily}
            options={[
              { value: "wan2.7", label: "Wan 2.7 Pro" },
              { value: "gpt-image-2", label: "GPT-Image-2" },
              { value: "nano-banana-2", label: "Nano Banana 2" }
            ]}
            onChange={(val) => {
              setModelFamily(val);
              setAspectRatio(val === "gpt-image-2" ? "auto" : "1:1");
            }}
          />

          {/* Resolution Selector (GPT & Nano Banana) */}
          {(modelFamily === "gpt-image-2" || modelFamily === "nano-banana-2") && (
            <CustomDropdown
              label="Resolution"
              value={resolution}
              options={[
                { value: "1k", label: "1K" },
                { value: "2k", label: "2K" },
                ...(aspectRatio !== "1:1" ? [{ value: "4k", label: "4K" }] : [])
              ]}
              onChange={setResolution}
            />
          )}

          {/* Quality Selector (GPT only) */}
          {modelFamily === "gpt-image-2" && (
            <CustomDropdown
              label="Quality"
              value={quality}
              options={[
                { value: "low", label: "Low (Fast, Cheap)" },
                { value: "medium", label: "Medium" },
                { value: "high", label: "High (Fidelity)" }
              ]}
              onChange={setQuality}
            />
          )}

          {/* Google Search (Nano Banana only) */}
          {modelFamily === "nano-banana-2" && (
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Google Search Enhancement
              </label>
              <button
                onClick={() => setGoogleSearch(!googleSearch)}
                className={`w-11 h-6 rounded-full transition-colors relative ${googleSearch ? "bg-orange-500" : "bg-zinc-300 dark:bg-zinc-700"
                  }`}
              >
                <span
                  className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${googleSearch ? "translate-x-5" : "translate-x-0"
                    }`}
                />
              </button>
            </div>
          )}

          {/* Aspect Ratio */}
          <CustomDropdown
            label="Aspect Ratio"
            value={aspectRatio}
            options={getAspectRatios()}
            onChange={setAspectRatio}
          />
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
                  {computeImageCost({ modelFamily, resolution, quality }).toLocaleString()} cr
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
            <h1 className="text-2xl font-bold text-black dark:text-white">Meme Image Preview</h1>
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentGeneration.url}
                  alt="Generated Meme"
                  className="w-full h-auto rounded-lg border border-zinc-200 dark:border-zinc-800"
                />
                <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                  <h4 className="text-sm font-semibold text-black dark:text-white">Generation Prompt</h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">{currentGeneration.prompt}</p>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaImage className="text-2xl text-zinc-400" />
                </div>
                <h3 className="text-lg font-medium text-black dark:text-white mb-2">No Image Preview</h3>
                <p className="text-zinc-500 dark:text-zinc-400 max-w-sm">
                  Your generated meme image preview will show here. Check the history or type a prompt to generate.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
