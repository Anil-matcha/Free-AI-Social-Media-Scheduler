"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import {
  FaUpload,
  FaSpinner,
  FaMagic,
  FaDownload,
  FaCoins,
  FaCheck,
  FaExclamationTriangle,
  FaTimes,
  FaHandSparkles
} from "react-icons/fa";
import clsx from "clsx";

export default function StudioPage() {
  const { data: session, update: updateSession } = useSession();

  // Inputs
  const [portraitImage, setPortraitImage] = useState("");
  const [referenceImage, setReferenceImage] = useState("");
  const [customPrompt, setCustomPrompt] = useState(
    "Apply the makeup look from the reference makeup photo (second image) onto the person's face in the target portrait image (first image). Replicate the eyeshadow color, lipstick shade, blush tone, contouring, and overall style exactly while preserving the original facial structure, expression, identity, and background of the person in the target portrait."
  );
  const [resultImage, setResultImage] = useState("");
  const [creationId, setCreationId] = useState("");

  // Status
  const [isUploadingPortrait, setIsUploadingPortrait] = useState(false);
  const [isUploadingReference, setIsUploadingReference] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState(""); // "", "generating", "success", "error"
  const [generatingError, setGeneratingError] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const timerIntervalRef = useRef(null);

  // Load saved creation if URL has ?id=
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const savedId = params.get("id");

    if (savedId) {
      const loadSavedCreation = async () => {
        try {
          const res = await fetch(`/api/creations?id=${savedId}`);
          if (res.ok) {
            const data = await res.json();
            setPortraitImage(data.portraitImage);
            setReferenceImage(data.referenceImage);
            setResultImage(data.resultImage);
            setCreationId(data.id);
            setCustomPrompt(data.prompt);
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
      setElapsedSeconds(0);
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

  const handleUploadPortrait = async (e) => {
    if (!session?.user) {
      setGeneratingError("Please sign in with Google to upload photos.");
      setGeneratingStatus("error");
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPortrait(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setPortraitImage(data.url);
      setResultImage("");
      if (
        generatingError.toLowerCase().includes("portrait") ||
        generatingError.toLowerCase().includes("photo") ||
        generatingError.toLowerCase().includes("upload")
      ) {
        setGeneratingError("");
        setGeneratingStatus("");
      }
    } catch (err) {
      console.error(err);
      setGeneratingError("Failed to upload portrait photo. Please try again.");
      setGeneratingStatus("error");
    } finally {
      setIsUploadingPortrait(false);
    }
  };

  const handleUploadReference = async (e) => {
    if (!session?.user) {
      setGeneratingError("Please sign in with Google to upload photos.");
      setGeneratingStatus("error");
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingReference(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setReferenceImage(data.url);
      setResultImage("");
      if (
        generatingError.toLowerCase().includes("reference") ||
        generatingError.toLowerCase().includes("makeup") ||
        generatingError.toLowerCase().includes("upload")
      ) {
        setGeneratingError("");
        setGeneratingStatus("");
      }
    } catch (err) {
      console.error(err);
      setGeneratingError("Failed to upload reference makeup photo. Please try again.");
      setGeneratingStatus("error");
    } finally {
      setIsUploadingReference(false);
    }
  };

  const handleGenerate = async () => {
    if (!session?.user) {
      signIn("google");
      return;
    }

    if (!portraitImage) {
      setGeneratingError("Please upload a portrait photo of the face first.");
      setGeneratingStatus("error");
      return;
    }

    if (!referenceImage) {
      setGeneratingError("Please upload a reference makeup photo first.");
      setGeneratingStatus("error");
      return;
    }

    setGeneratingStatus("generating");
    setGeneratingError("");
    setResultImage("");

    try {
      const res = await fetch("/api/generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portraitImage,
          referenceImage,
          prompt: customPrompt,
        }),
      });

      if (res.status === 402) {
        setGeneratingError(
          "Insufficient credits. Please purchase a credit pack on the pricing page."
        );
        setGeneratingStatus("error");
        return;
      }

      if (!res.ok) throw new Error("Generation request failed");
      const data = await res.json();

      updateSession(); // refresh credits

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
        "An error occurred during generation. Please try again."
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
              "AI makeup generation failed. Please review your photos and try again."
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
        "Generation is taking longer than expected. It will complete in the background and show in your gallery."
      );
      setGeneratingStatus("error");
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const downloadUrl = `/api/download?url=${encodeURIComponent(resultImage)}`;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `makeup_generation_${creationId || Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getButtonContent = () => {
    if (!session?.user) {
      return {
        text: "Sign in with Google",
        className:
          "w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded py-3.5 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-[0.99]",
        icon: <FaMagic className="text-xs text-white animate-pulse" />,
        disabled: false,
      };
    }

    if (isUploadingPortrait || isUploadingReference) {
      return {
        text: "Uploading assets...",
        className:
          "w-full bg-zinc-50 border border-zinc-200 text-zinc-400 rounded py-3.5 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-not-allowed opacity-60",
        icon: <FaSpinner className="animate-spin text-xs text-zinc-400" />,
        disabled: true,
      };
    }

    if (generatingStatus === "generating") {
      return {
        text: `Applying Makeup... (${elapsedSeconds}s)`,
        className:
          "w-full bg-zinc-50 border border-zinc-200 text-zinc-400 rounded py-3.5 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-not-allowed opacity-60",
        icon: <FaSpinner className="animate-spin text-xs text-zinc-400" />,
        disabled: true,
      };
    }

    if (!portraitImage && !referenceImage) {
      return {
        text: "Upload Photos to Begin",
        className:
          "w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 rounded py-3.5 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99]",
        icon: <FaUpload className="text-xs text-zinc-500" />,
        disabled: false,
      };
    }

    if (!portraitImage) {
      return {
        text: "Upload Target Portrait",
        className:
          "w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 rounded py-3.5 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99]",
        icon: <FaUpload className="text-xs text-zinc-500" />,
        disabled: false,
      };
    }

    if (!referenceImage) {
      return {
        text: "Upload Reference Makeup",
        className:
          "w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 rounded py-3.5 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99]",
        icon: <FaUpload className="text-xs text-zinc-500" />,
        disabled: false,
      };
    }

    return {
      text: "Apply Makeup (12 Credits)",
      className:
        "w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded py-3.5 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-[0.99]",
      icon: <FaMagic className="text-xs text-white animate-pulse" />,
      disabled: false,
    };
  };

  const btn = getButtonContent();

  return (
    <div className="flex-1 flex flex-col md:flex-row md:overflow-hidden overflow-y-auto bg-zinc-50 text-zinc-800 font-sans">
      {/* ─── LEFT PANEL: OPTIONS ────────────────────────────────────────── */}
      <div className="w-full md:w-[420px] border-r border-zinc-200 bg-white flex flex-col md:h-full md:overflow-hidden overflow-visible flex-shrink-0">
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 flex-shrink-0 bg-zinc-50/80">
          <h1 className="text-lg font-heading font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <FaHandSparkles className="text-emerald-600" /> AI Professional Makeup Generator
          </h1>
          <p className="text-xs text-zinc-550 mt-1.5 font-medium leading-relaxed">
            Upload your target portrait selfie and a makeup style reference photo to simulate a professional makeup overlay instantly.
          </p>
        </div>

        {/* Form controls */}
        <div className="p-5 space-y-6 flex-1 md:overflow-y-auto overflow-visible bg-zinc-50/30">
          {/* Dual Upload Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* 1. Target Portrait Upload */}
            <div className="flex flex-col">
              <label className="block text-[10px] font-bold text-zinc-550 uppercase tracking-wider mb-2">
                1. Target Portrait
              </label>
              <div
                className={clsx(
                  "relative group border border-dashed rounded overflow-hidden bg-zinc-50 transition-all duration-200",
                  generatingStatus === "error" &&
                    !portraitImage &&
                    generatingError.toLowerCase().includes("portrait")
                    ? "border-red-500 bg-red-50 shadow-lg animate-pulse"
                    : "border-zinc-300 hover:border-emerald-500",
                )}
              >
                {portraitImage ? (
                  <div className="relative aspect-[4/5] w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={portraitImage}
                      alt="Target Portrait"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => {
                        setPortraitImage("");
                        setResultImage("");
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 hover:bg-zinc-100 hover:text-red-600 border border-zinc-200 cursor-pointer transition-colors"
                      title="Remove image"
                    >
                      <FaTimes className="text-[10px]" />
                    </button>
                  </div>
                ) : (
                  <label
                    onClick={(e) => {
                      if (!session?.user) {
                        e.preventDefault();
                        signIn("google");
                      }
                    }}
                    className="flex flex-col items-center justify-center p-4 text-center cursor-pointer aspect-[4/5]"
                  >
                    {isUploadingPortrait ? (
                      <FaSpinner className="animate-spin text-xl text-emerald-600 mb-2" />
                    ) : (
                      <FaUpload className="text-zinc-400 mb-2 group-hover:text-emerald-600 transition-colors" />
                    )}
                    <span className="text-xs font-bold text-zinc-700 group-hover:text-zinc-900">
                      {isUploadingPortrait ? "Uploading..." : "Upload Face"}
                    </span>
                    <span className="text-[9px] text-zinc-500 font-semibold mt-1.5 leading-tight">
                      Portrait selfie
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadPortrait}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* 2. Reference Makeup Upload */}
            <div className="flex flex-col">
              <label className="block text-[10px] font-bold text-zinc-550 uppercase tracking-wider mb-2">
                2. Makeup Style
              </label>
              <div
                className={clsx(
                  "relative group border border-dashed rounded overflow-hidden bg-zinc-50 transition-all duration-200",
                  generatingStatus === "error" &&
                    !referenceImage &&
                    generatingError.toLowerCase().includes("reference")
                    ? "border-red-500 bg-red-50 shadow-lg animate-pulse"
                    : "border-zinc-300 hover:border-emerald-500",
                )}
              >
                {referenceImage ? (
                  <div className="relative aspect-[4/5] w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={referenceImage}
                      alt="Makeup Reference"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => {
                        setReferenceImage("");
                        setResultImage("");
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 hover:bg-zinc-100 hover:text-red-650 border border-zinc-200 cursor-pointer transition-colors"
                      title="Remove image"
                    >
                      <FaTimes className="text-[10px]" />
                    </button>
                  </div>
                ) : (
                  <label
                    onClick={(e) => {
                      if (!session?.user) {
                        e.preventDefault();
                        signIn("google");
                      }
                    }}
                    className="flex flex-col items-center justify-center p-4 text-center cursor-pointer aspect-[4/5]"
                  >
                    {isUploadingReference ? (
                      <FaSpinner className="animate-spin text-xl text-emerald-600 mb-2" />
                    ) : (
                      <FaUpload className="text-zinc-400 mb-2 group-hover:text-emerald-600 transition-colors" />
                    )}
                    <span className="text-xs font-bold text-zinc-700 group-hover:text-zinc-900">
                      {isUploadingReference ? "Uploading..." : "Upload Style"}
                    </span>
                    <span className="text-[9px] text-zinc-500 font-semibold mt-1.5 leading-tight">
                      Makeup reference
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadReference}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Inline Errors */}
          {generatingStatus === "error" &&
            (generatingError.toLowerCase().includes("portrait") ||
              generatingError.toLowerCase().includes("reference") ||
              generatingError.toLowerCase().includes("photo") ||
              generatingError.toLowerCase().includes("makeup") ||
              generatingError.toLowerCase().includes("upload")) && (
              <div className="text-[11px] text-red-800 bg-red-50 border border-red-200 rounded p-3 flex items-start gap-2.5 shadow-inner">
                <FaExclamationTriangle className="text-red-600 flex-shrink-0 mt-0.5 text-xs animate-bounce" />
                <div className="flex-1 leading-tight font-medium">
                  {generatingError}
                </div>
              </div>
            )}

          {/* 3. Editable Prompt */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
              3. Prompt (Editable)
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={6}
              className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-2.5 text-xs font-medium text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 resize-none transition-all leading-relaxed"
              placeholder="Prompt describing how to transfer and map the makeup look..."
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="py-3.5 px-5 border-t border-zinc-200 bg-white flex-shrink-0 space-y-3">
          {!session?.user && (
            <div className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 rounded p-3 flex items-start gap-2 shadow-inner">
              <FaExclamationTriangle className="text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                You are playing as a guest. Please sign in with Google to enable professional makeup simulations.
              </span>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={btn.disabled}
            className={btn.className}
          >
            {btn.icon}
            <span>{btn.text}</span>
          </button>

          {generatingStatus === "error" &&
            !(
              generatingError.toLowerCase().includes("portrait") ||
              generatingError.toLowerCase().includes("reference") ||
              generatingError.toLowerCase().includes("photo") ||
              generatingError.toLowerCase().includes("makeup") ||
              generatingError.toLowerCase().includes("upload")
            ) && (
              <p className="text-[10px] text-red-800 bg-red-50 border border-red-200 rounded px-3 py-2 flex items-start gap-2 shadow-inner animate-pulse">
                <FaExclamationTriangle className="text-red-650 flex-shrink-0 mt-0.5" />
                <span>{generatingError}</span>
              </p>
            )}
        </div>
      </div>

      {/* ─── RIGHT PANEL: OUTPUT PREVIEW ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col md:overflow-hidden bg-zinc-100/50">
        {/* Output Header */}
        <div className="px-5 py-3.5 bg-white border-b border-zinc-200 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-zinc-900 tracking-tight leading-none">
              Makeup Outcome Preview
            </h2>
            <p className="text-[10px] text-zinc-500 mt-1 font-medium font-sans">
              View your simulated professional makeup look overlay
            </p>
          </div>
          {resultImage && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 px-3.5 py-2 rounded hover:bg-zinc-50 hover:border-zinc-300 transition-all cursor-pointer shadow-sm"
            >
              <FaDownload className="text-[10px]" /> Download HD
            </button>
          )}
        </div>

        {/* Main preview body */}
        <div className="flex-1 p-5 flex flex-col justify-center items-center overflow-y-auto max-w-4xl mx-auto w-full">
          <div className="relative w-full aspect-[4/5] rounded overflow-hidden border border-zinc-200 bg-white shadow-xl flex items-center justify-center max-h-[75vh]">
            {resultImage ? (
              <div className="relative w-full h-full group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resultImage}
                  alt="AI Makeup Overlay Result"
                  className="w-full h-full object-cover"
                />

                {/* Floating original assets overlay badge */}
                <div className="absolute bottom-4 right-4 bg-white/95 border border-zinc-200 p-2.5 rounded flex flex-col gap-2.5 z-20 shadow-xl max-w-[130px] backdrop-blur-sm">
                  <div className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">
                    Before Assets
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="h-10 w-8 rounded overflow-hidden border border-zinc-200 bg-zinc-150">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={portraitImage}
                        alt="Portrait"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="h-10 w-8 rounded overflow-hidden border border-zinc-200 bg-zinc-150">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={referenceImage}
                        alt="Reference Makeup"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : generatingStatus === "generating" ? (
              <div className="flex flex-col items-center justify-center text-center p-8 bg-zinc-50 text-zinc-700">
                <div className="relative flex items-center justify-center mb-6">
                  <div className="h-16 w-16 rounded-full border-2 border-dashed border-emerald-500 animate-spin" />
                  <FaHandSparkles className="absolute text-xl text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500 animate-bounce" />
                </div>
                <p className="text-sm font-heading font-bold text-zinc-900">
                  Simulating Makeup Fitting...
                </p>
                <p className="text-xs text-zinc-500 mt-2.5 max-w-xs leading-relaxed font-medium">
                  Mapping facial coordinates, matching eyeliner values, coloring lipstick boundaries, and blending cosmetic textures onto skin. Estimated time: 10-15s...
                </p>
              </div>
            ) : portraitImage || referenceImage ? (
              <div className="flex flex-col items-center justify-center gap-6 p-6 w-full h-full max-h-[70vh]">
                <div className="grid grid-cols-2 gap-4 max-w-[360px] w-full">
                  <div>
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 text-center">
                      Portrait
                    </div>
                    <div className="aspect-[4/5] w-full rounded overflow-hidden border border-zinc-200 bg-zinc-100 shadow-md">
                      {portraitImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={portraitImage}
                          alt="Portrait Upload Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-400 font-bold">
                          No Image
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 text-center">
                      Makeup Style
                    </div>
                    <div className="aspect-[4/5] w-full rounded overflow-hidden border border-zinc-200 bg-zinc-100 shadow-md">
                      {referenceImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={referenceImage}
                          alt="Makeup Style Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-400 font-bold">
                          No Image
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-center max-w-xs">
                  <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                    Configure your prompt and click the button to apply the makeup reference onto the target face.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 bg-zinc-50 rounded-2xl max-w-md border border-zinc-200/60 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
                  <FaHandSparkles className="text-2xl text-emerald-600 animate-pulse" />
                </div>
                <h3 className="text-sm sm:text-base font-heading font-bold text-zinc-900 tracking-tight">
                  Virtual Fitting Workspace
                </h3>
                <p className="text-xs text-zinc-500 mt-2.5 leading-relaxed font-medium">
                  Upload portrait and makeup reference images on the left. The simulated HD result will render here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
