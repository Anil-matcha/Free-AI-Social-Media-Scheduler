"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import {
  FaCamera,
  FaSpinner,
  FaDownload,
  FaTrashAlt,
  FaUpload,
  FaCoins,
  FaPlus,
  FaCheck,
  FaExclamationTriangle,
  FaTrash,
} from "react-icons/fa";

export default function StudioPage() {
  const { data: session, update: updateSession } = useSession();
  const [petImages, setPetImages] = useState([]);
  const [customPrompt, setCustomPrompt] = useState(
    `Create a beautifully crafted, high-resolution pet portrait with a natural and lifelike appearance. Capture every authentic detail—the fur texture, subtle expressions, and unique personality of the pet—with exceptional accuracy. Use soft, flattering lighting that highlights the pet as the main subject. Replace the background with an elegant, thoughtfully designed scene that harmonizes with the pet's current pose and body movement, ensuring the environment feels natural and complementary. Present the final portrait with refined colors, crisp definition, and a premium visual finish suitable for large-format printing and display.

Negative Prompt (optional):
Low-detail rendering, blurry textures, exaggerated shadows, artificial effects, unnatural color tones, cluttered or mismatched background, cartoon elements, pixelation, visual artifacts, incorrect body proportions, inaccurate fur texture.`,
  );

  // Upload/generation UI states
  const [isUploading, setIsUploading] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState("idle"); // idle, generating, success, error
  const [generatingError, setGeneratingError] = useState("");
  const [resultImage, setResultImage] = useState("");
  const [creationId, setCreationId] = useState("");

  // Timer states
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerIntervalRef = useRef(null);

  // Load last creation on mount (if any exists)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const loadSavedCreation = async () => {
        try {
          const res = await fetch("/api/creations");
          if (res.ok) {
            const list = await res.json();
            const last = list[0]; // get most recent
            if (last) {
              let urls = [];
              try {
                urls = JSON.parse(last.petImages);
              } catch (e) {
                if (last.petImages) urls = [last.petImages];
              }
              setPetImages(urls);
              setResultImage(last.resultImage);
              setCreationId(last.id);
              setCustomPrompt(last.prompt);
            }
          }
        } catch (e) {
          console.error("Error loading saved creation:", e);
        }
      };
      loadSavedCreation();
    }
  }, []);

  // Timer hook
  useEffect(() => {
    if (generatingStatus === "generating") {
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [generatingStatus]);

  const handleUploadPhoto = async (e) => {
    if (!session?.user) {
      setGeneratingError("Please sign in with Google to upload photos.");
      setGeneratingStatus("error");
      return;
    }
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (petImages.length + files.length > 5) {
      setGeneratingError("You can upload a maximum of 5 pet photos.");
      setGeneratingStatus("error");
      return;
    }

    setIsUploading(true);
    setGeneratingError("");

    const newUploadedUrls = [];

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            newUploadedUrls.push(data.url);
          }
        } else {
          throw new Error("Upload failed");
        }
      }

      setPetImages((prev) => {
        const combined = [...prev, ...newUploadedUrls];
        return combined.slice(0, 5);
      });
      setResultImage("");
      setGeneratingStatus("idle");
    } catch (err) {
      console.error(err);
      setGeneratingError("Failed to upload pet photo. Please try again.");
      setGeneratingStatus("error");
    } finally {
      setIsUploading(false);
      try {
        e.target.value = "";
      } catch (err) {
        console.error("Failed to reset input value:", err);
      }
    }
  };

  const removePetImage = (indexToRemove) => {
    setPetImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setGeneratingStatus("idle");
  };

  const handleGenerate = async () => {
    if (!session?.user) {
      signIn("google");
      return;
    }

    if (petImages.length === 0) {
      setGeneratingError("Please upload at least one pet photo first.");
      setGeneratingStatus("error");
      return;
    }

    // Reset timer and set status
    setElapsedSeconds(0);
    setGeneratingStatus("generating");
    setGeneratingError("");
    setResultImage("");

    try {
      const res = await fetch("/api/generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          petImages,
          prompt: customPrompt,
        }),
      });

      if (res.status === 402) {
        setGeneratingError(
          "Insufficient credits. Please purchase a credit pack on the pricing page.",
        );
        setGeneratingStatus("error");
        return;
      }

      if (!res.ok) throw new Error("Generation request failed");
      const data = await res.json();

      updateSession(); // refresh user credits badge

      if (data.status === "completed" && data.resultImage) {
        setResultImage(data.resultImage);
        setCreationId(data.id);
        setGeneratingStatus("success");
      } else {
        pollResult(data.id);
      }
    } catch (err) {
      console.error(err);
      setGeneratingError(
        "An error occurred during generation. Please try again.",
      );
      setGeneratingStatus("error");
    }
  };

  const pollResult = async (id) => {
    let completed = false;
    let attempts = 0;
    const maxAttempts = 20;

    while (!completed && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      attempts++;

      try {
        const res = await fetch(`/api/creations?id=${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "completed" && data.resultImage) {
            setResultImage(data.resultImage);
            setCreationId(data.id);
            setGeneratingStatus("success");
            completed = true;
          } else if (data.status === "failed") {
            setGeneratingError(
              "AI generation failed. Please review your photos and try again.",
            );
            setGeneratingStatus("error");
            completed = true;
          }
        }
      } catch (err) {
        console.error("Error polling database status:", err);
      }
    }

    if (!completed) {
      setGeneratingError(
        "AI processing is taking longer than expected. We will save it in your creations once finished.",
      );
      setGeneratingStatus("idle");
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const downloadUrl = `/api/download?url=${encodeURIComponent(resultImage)}`;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `pet-portrait-${creationId}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = async () => {
    if (!creationId) return;
    if (!confirm("Are you sure you want to delete this pet portrait?")) return;

    try {
      const res = await fetch(`/api/creations?id=${creationId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setResultImage("");
        setCreationId("");
        setGeneratingStatus("idle");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden relative bg-zinc-50 font-sans">
      {/* Main Studio View Container */}
      <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden p-4 sm:p-6 lg:p-8 gap-6 min-h-0">
        {/* Left Input Panel */}
        <div className="w-full md:w-[45%] flex flex-col gap-6 md:overflow-y-auto pr-0 md:pr-1 min-h-0 flex-shrink-0">
          {/* Guest Alert Banner */}
          {!session?.user && (
            <div className="bg-amber-50 border border-amber-200 rounded p-4 flex gap-3 shadow-sm animate-pulse">
              <FaExclamationTriangle className="text-amber-500 text-lg flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900">
                  Playing as Guest
                </h4>
                <p className="text-[11px] text-amber-700 font-medium leading-relaxed mt-0.5">
                  You must sign in with Google to upload files, generate pet
                  portraits, and save creations.
                </p>
              </div>
            </div>
          )}

          {/* Heading */}
          <div className="mt-1">
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mt-2.5">
              AI Pet Portrait Studio
            </h1>
            <p className="text-xs text-zinc-500 mt-1 font-medium leading-relaxed">
              Use advanced AI technology to transform your pet photos into
              stunning art portraits. Upload up to 5 photos for the best
              results.
            </p>
          </div>

          {/* Pet Photo Upload Container */}
          <div className="bg-white border border-zinc-200 rounded p-5 shadow-md flex flex-col gap-4 relative">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-zinc-800">
                  Your Pet Photos
                </h3>
                <p className="text-[10px] text-zinc-450 font-bold mt-0.5">
                  Upload clear, high-resolution pet photos (1-5 images)
                </p>
              </div>
              <span className="text-[10px] font-bold text-zinc-500 bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded shadow-inner">
                {petImages.length}/5
              </span>
            </div>

            {/* Thumbnail grid */}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {petImages.length > 0 &&
                petImages.map((url, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded overflow-hidden border border-zinc-200 bg-zinc-50 group shadow animate-in fade-in duration-205"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Uploaded Pet ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removePetImage(index)}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-650 text-white rounded opacity-0 group-hover:opacity-100 transition-all shadow-md cursor-pointer"
                      title="Remove image"
                    >
                      <FaTrash className="text-[10px]" />
                    </button>
                  </div>
                ))}
              {petImages.length < 5 && (
                <div className="border-2 border-dashed border-zinc-200 hover:border-emerald-400 rounded aspect-square flex flex-col items-center justify-center bg-zinc-50/50 p-6 text-center cursor-pointer transition-colors relative group">
                  <input
                    type="file"
                    onChange={handleUploadPhoto}
                    accept="image/*"
                    multiple
                    disabled={isUploading}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />

                  {isUploading ? (
                    <>
                      <FaSpinner className="animate-spin text-3xl text-emerald-500 mb-3" />
                      <span className="text-xs font-bold text-zinc-650">
                        Uploading photo to CDN...
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="h-12 w-12 rounded bg-emerald-50 border border-emerald-100 text-emerald-500 flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform duration-200">
                        <FaUpload className="text-lg" />
                      </div>
                      <span className="text-xs font-bold text-zinc-800">
                        Upload Pet Photos
                      </span>
                      <span className="text-[10px] text-zinc-450 font-bold max-w-[200px] mt-1.5 leading-relaxed">
                        Select one or multiple photos, or drag & drop (max 5
                        images)
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Uploader Trigger (only show/enable if under 5 images) */}
          </div>

          {/* Editable Prompt */}
          <div className="bg-white border border-zinc-200 rounded p-5 shadow-md flex flex-col gap-4">
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">
                Art Direction Prompt
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Describe specific features for the pet portrait..."
                className="w-full text-xs font-medium text-zinc-700 bg-zinc-50 border border-zinc-200 focus:border-emerald-400 focus:bg-white rounded p-3.5 outline-none resize-none transition-all shadow-inner h-24 leading-relaxed"
              />
            </div>

            {/* Action Trigger Button */}
            <button
              onClick={handleGenerate}
              disabled={
                generatingStatus === "generating" ||
                isUploading ||
                petImages.length === 0
              }
              className="w-full flex items-center justify-center gap-2.5 py-4 text-xs font-extrabold text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-650 active:scale-[0.98] disabled:opacity-50 disabled:scale-100 rounded shadow-lg shadow-emerald-500/20 hover:shadow-emerald-600/30 transition-all cursor-pointer mt-1"
            >
              {generatingStatus === "generating" ? (
                <>
                  <FaSpinner className="animate-spin text-sm" />
                  <span>Generating Pet Portrait...</span>
                </>
              ) : (
                <>
                  <FaCamera className="text-xs" />
                  <span>Generate Pet Portrait (12 Credits)</span>
                </>
              )}
            </button>

            {generatingError && (
              <p className="text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 p-3 rounded mt-1 text-center shadow-sm">
                {generatingError}
              </p>
            )}
          </div>
        </div>

        {/* Right Output Panel */}
        <div className="w-full md:w-[55%] flex flex-col bg-white border border-zinc-200 rounded p-5 shadow-lg relative min-h-[350px] md:h-full overflow-hidden flex-shrink-0">
          <div className="flex justify-between items-center border-b border-zinc-100 pb-3.5 mb-4 flex-shrink-0">
            <div>
              <h3 className="text-sm font-bold text-zinc-800">
                Your Pet Portrait
              </h3>
              <p className="text-[10px] text-zinc-450 font-bold mt-0.5">
                Preview and download your transformation
              </p>
            </div>
            {generatingStatus === "success" && (
              <span className="text-[9px] font-bold text-emerald-650 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded flex items-center gap-1 shadow-sm uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                Completed
              </span>
            )}
            {generatingStatus === "generating" && (
              <span className="text-[9px] font-bold text-emerald-650 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded flex items-center gap-1 shadow-sm uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                Rendering ({elapsedSeconds}s)
              </span>
            )}
          </div>

          {/* Core Display Box */}
          <div className="flex-1 rounded overflow-hidden border border-zinc-150 bg-zinc-50/50 flex flex-col items-center justify-center p-6 relative min-h-[220px]">
            {resultImage ? (
              <div className="relative w-full h-full max-w-[420px] aspect-[4/5] rounded overflow-hidden border border-zinc-200 shadow-md bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resultImage}
                  alt="Simulated Portrait"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : generatingStatus === "generating" ? (
              <div className="text-center max-w-sm px-4">
                <div className="h-16 w-16 bg-emerald-50 border border-emerald-100 rounded flex items-center justify-center mx-auto mb-5 shadow-md">
                  <FaSpinner className="animate-spin text-2xl text-emerald-500" />
                </div>
                <h4 className="text-sm font-bold text-zinc-800">
                  Transforming Pet Photos...
                </h4>
                <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed font-medium">
                  We are blending your uploaded pet photos with your custom
                  prompt. This usually takes around 8-15 seconds.
                </p>
                <div className="mt-5 text-[10px] font-bold text-emerald-650 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full inline-block shadow-inner">
                  Elapsed: {elapsedSeconds} seconds
                </div>
              </div>
            ) : (
              <div className="text-center max-w-sm px-4 py-8">
                <div className="h-16 w-16 bg-zinc-50 text-zinc-400 border border-zinc-200 rounded flex items-center justify-center mx-auto mb-5 shadow-inner">
                  <FaCamera className="text-2xl text-zinc-450" />
                </div>
                <h4 className="text-sm font-bold text-zinc-800">
                  Ready to Start
                </h4>
                <p className="text-[11px] text-zinc-450 mt-2 leading-relaxed font-medium">
                  Upload up to 5 pet photos, customize your art prompt, and hit
                  generate to create a masterpiece.
                </p>
              </div>
            )}
          </div>

          {/* Action Footer */}
          {resultImage && (
            <div className="flex gap-3 mt-4 border-t border-zinc-100 pt-4 flex-shrink-0">
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white rounded text-xs font-semibold shadow-lg shadow-emerald-500/10 cursor-pointer animate-in fade-in slide-in-from-bottom-2 duration-200"
              >
                <FaDownload />
                <span>Download HD Portrait</span>
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-3 bg-zinc-100 hover:bg-red-50 hover:text-red-650 border border-zinc-200 hover:border-red-200 text-zinc-650 rounded text-xs font-bold transition-all cursor-pointer"
                title="Delete portrait"
              >
                <FaTrashAlt />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
