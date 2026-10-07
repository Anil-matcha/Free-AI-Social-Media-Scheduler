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
  FaChevronDown,
  FaPenNib,
  FaLock,
} from "react-icons/fa";
import clsx from "clsx";

const PLACEMENTS = [
  {
    id: "forearm",
    name: "Forearm Placement",
    desc: "Inner or outer lower arm",
  },
  {
    id: "shoulder",
    name: "Shoulder Cap",
    desc: "Top of the arm/shoulder joint",
  },
  {
    id: "upper_arm",
    name: "Bicep / Upper Arm Sleeve",
    desc: "Outer upper arm wrap",
  },
  {
    id: "chest",
    name: "Chest / Pectoral",
    desc: "Upper front torso placement",
  },
  { id: "back", name: "Full Back / Upper Back", desc: "Back torso area" },
  { id: "wrist", name: "Wrist Band", desc: "Lower wrist cuff style" },
  { id: "leg", name: "Thigh Placement", desc: "Upper leg wrap" },
  { id: "calf", name: "Calf / Lower Leg", desc: "Back lower leg placement" },
  { id: "neck", name: "Side Neck / Behind Ear", desc: "Subtle neck placement" },
];

export default function StudioPage() {
  const { data: session, update: updateSession } = useSession();

  // Inputs
  const [personImage, setPersonImage] = useState("");
  const [tattooImage, setTattooImage] = useState("");
  const [placement, setPlacement] = useState("forearm");
  const [customPrompt, setCustomPrompt] = useState(
    "Apply the tattoo design from the second image onto the person's forearm in the first image, making it wrap naturally around the arm shape, follow skin contours and shading, and blend perfectly with natural skin texture, keeping the person and background otherwise unchanged.",
  );
  const [optimizeBlending, setOptimizeBlending] = useState(true);
  const [resultImage, setResultImage] = useState("");
  const [creationId, setCreationId] = useState("");

  // Dropdown States
  const [isPlacementOpen, setIsPlacementOpen] = useState(false);
  const placementRef = useRef(null);

  // Status
  const [isUploadingPerson, setIsUploadingPerson] = useState(false);
  const [isUploadingTattoo, setIsUploadingTattoo] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState(""); // "", "generating", "success", "error"
  const [generatingError, setGeneratingError] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const timerIntervalRef = useRef(null);

  // Load saved tattoo if URL has ?id=
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const savedId = params.get("id");

    if (savedId) {
      const loadSavedCreation = async () => {
        try {
          const res = await fetch(`/api/creations?id=${savedId}`);
          if (res.ok) {
            const data = await res.json();
            setPersonImage(data.personImage);
            setTattooImage(data.tattooImage);
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

  // Update prompt template on placement change
  const handlePlacementChange = (newPlacementId) => {
    setPlacement(newPlacementId);
    const placementName = PLACEMENTS.find((p) => p.id === newPlacementId)
      ?.name.toLowerCase()
      .replace(" placement", "")
      .replace(" cap", "");
    setCustomPrompt(
      `Apply the tattoo design from the second image onto the person's ${placementName} in the first image, making it wrap naturally around the body shape, follow skin contours and shading, and blend perfectly with natural skin texture, keeping the person and background otherwise unchanged.`,
    );
  };

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

  // Click outside listener to close dropdowns
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (placementRef.current && !placementRef.current.contains(e.target))
        setIsPlacementOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleUploadPerson = async (e) => {
    if (!session?.user) {
      setGeneratingError("Please sign in with Google to upload photos.");
      setGeneratingStatus("error");
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPerson(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setPersonImage(data.url);
      setResultImage("");
      if (
        generatingError.toLowerCase().includes("person") ||
        generatingError.toLowerCase().includes("photo") ||
        generatingError.toLowerCase().includes("upload")
      ) {
        setGeneratingError("");
        setGeneratingStatus("");
      }
    } catch (err) {
      console.error(err);
      setGeneratingError("Failed to upload person photo. Please try again.");
      setGeneratingStatus("error");
    } finally {
      setIsUploadingPerson(false);
    }
  };

  const handleUploadTattoo = async (e) => {
    if (!session?.user) {
      setGeneratingError("Please sign in with Google to upload photos.");
      setGeneratingStatus("error");
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingTattoo(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setTattooImage(data.url);
      setResultImage("");
      if (
        generatingError.toLowerCase().includes("tattoo") ||
        generatingError.toLowerCase().includes("design") ||
        generatingError.toLowerCase().includes("upload")
      ) {
        setGeneratingError("");
        setGeneratingStatus("");
      }
    } catch (err) {
      console.error(err);
      setGeneratingError("Failed to upload tattoo design. Please try again.");
      setGeneratingStatus("error");
    } finally {
      setIsUploadingTattoo(false);
    }
  };

  const handleGenerate = async () => {
    if (!session?.user) {
      signIn("google");
      return;
    }

    if (!personImage) {
      setGeneratingError("Please upload a photo of the person first.");
      setGeneratingStatus("error");
      return;
    }

    if (!tattooImage) {
      setGeneratingError("Please upload a tattoo design image first.");
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
          personImage,
          tattooImage,
          prompt: `${customPrompt}${optimizeBlending ? ", highly detailed, realistic skin texture, realistic ink overlay, natural lighting, shadow integration" : ""}`,
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
        "An error occurred during generation. Please try again.",
      );
      setGeneratingStatus("error");
    }
  };

  const pollResult = async (id) => {
    let completed = false;

    while (!completed) {
      await new Promise((resolve) => setTimeout(resolve, 2500));

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
              "AI tattoo fitting failed. Please review your photos and try again.",
            );
            setGeneratingStatus("error");
            completed = true;
          }
        }
      } catch (err) {
        console.error("Error polling database status:", err);
      }
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const downloadUrl = `/api/download?url=${encodeURIComponent(resultImage)}`;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `tattoo_tryon_${creationId || Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getButtonContent = () => {
    if (!session?.user) {
      return {
        text: "Sign in with Google",
        className:
          "w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded py-3.5 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-violet-500/20 active:scale-[0.99]",
        icon: <FaMagic className="text-xs text-white animate-pulse" />,
        disabled: false,
      };
    }

    if (isUploadingPerson || isUploadingTattoo) {
      return {
        text: "Uploading assets...",
        className:
          "w-full bg-zinc-900 border border-zinc-800 text-zinc-500 rounded py-3.5 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-not-allowed opacity-60",
        icon: <FaSpinner className="animate-spin text-xs text-zinc-500" />,
        disabled: true,
      };
    }

    if (generatingStatus === "generating") {
      return {
        text: `Simulating Tattoo... (${elapsedSeconds}s)`,
        className:
          "w-full bg-zinc-900 border border-zinc-800 text-zinc-500 rounded py-3.5 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-not-allowed opacity-60",
        icon: <FaSpinner className="animate-spin text-xs text-zinc-500" />,
        disabled: true,
      };
    }

    if (!personImage && !tattooImage) {
      return {
        text: "Upload Photos to Begin",
        className:
          "w-full bg-zinc-850 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60 rounded py-3.5 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99]",
        icon: <FaUpload className="text-xs text-zinc-400" />,
        disabled: false,
      };
    }

    if (!personImage) {
      return {
        text: "Upload Person Photo",
        className:
          "w-full bg-zinc-850 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60 rounded py-3.5 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99]",
        icon: <FaUpload className="text-xs text-zinc-400" />,
        disabled: false,
      };
    }

    if (!tattooImage) {
      return {
        text: "Upload Tattoo Design",
        className:
          "w-full bg-zinc-850 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60 rounded py-3.5 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99]",
        icon: <FaUpload className="text-xs text-zinc-400" />,
        disabled: false,
      };
    }

    return {
      text: "Try On Tattoo (24 Credits)",
      className:
        "w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded py-3.5 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-violet-500/20 active:scale-[0.99]",
      icon: <FaMagic className="text-xs text-white animate-pulse" />,
      disabled: false,
    };
  };

  const btn = getButtonContent();

  return (
    <div className="flex-1 flex flex-col md:flex-row md:overflow-hidden overflow-y-auto bg-zinc-950 text-zinc-100 font-sans">
      {/* ─── LEFT PANEL: OPTIONS ────────────────────────────────────────── */}
      <div className="w-full md:w-[420px] border-r border-zinc-800 bg-zinc-900/60 flex flex-col md:h-full md:overflow-hidden overflow-visible flex-shrink-0">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex-shrink-0 bg-zinc-900/80">
          <h1 className="text-lg font-heading font-bold text-white tracking-tight flex items-center gap-2">
            <FaPenNib className="text-violet-400 rotate-45" /> AI Tattoo Studio
          </h1>
          <p className="text-xs text-zinc-300 mt-1.5 font-medium">
            Upload a person's photo and a tattoo design to preview it on their
            skin instantly.
          </p>
        </div>

        {/* Form controls */}
        <div className="p-5 space-y-6 flex-1 md:overflow-y-auto overflow-visible bg-zinc-900/30">
          {/* Dual Upload Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* 1. Body/Person Upload */}
            <div className="flex flex-col">
              <label className="block text-[10px] font-bold text-zinc-300 uppercase tracking-wider mb-2">
                1. Upload Person Photo
              </label>
              <div
                className={clsx(
                  "relative group border border-dashed rounded overflow-hidden bg-zinc-950 transition-all duration-200",
                  generatingStatus === "error" &&
                    !personImage &&
                    generatingError.toLowerCase().includes("person")
                    ? "border-red-500/80 bg-red-950/10 shadow-lg shadow-red-950/20 animate-pulse"
                    : "border-zinc-700 hover:border-violet-500",
                )}
              >
                {personImage ? (
                  <div className="relative aspect-[4/3] w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={personImage}
                      alt="Input Portrait"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => {
                        setPersonImage("");
                        setResultImage("");
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 hover:text-red-400 border border-zinc-800 cursor-pointer transition-colors"
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
                    className="flex flex-col items-center justify-center p-4 text-center cursor-pointer aspect-[4/3]"
                  >
                    {isUploadingPerson ? (
                      <FaSpinner className="animate-spin text-xl text-violet-400 mb-2" />
                    ) : (
                      <FaUpload className="text-zinc-500 mb-2 group-hover:text-violet-400 transition-colors" />
                    )}
                    <span className="text-xs font-bold text-zinc-200 group-hover:text-white">
                      {isUploadingPerson
                        ? "Uploading..."
                        : "Person / Body Photo"}
                    </span>
                    <span className="text-[9px] text-zinc-500 font-bold mt-1">
                      Clear shot of the target body part works best
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadPerson}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* 2. Tattoo Design Upload */}
            <div className="flex flex-col">
              <label className="block text-[10px] font-bold text-zinc-300 uppercase tracking-wider mb-2">
                2. Upload Tattoo Design
              </label>
              <div
                className={clsx(
                  "relative group border border-dashed rounded overflow-hidden bg-zinc-950 transition-all duration-200",
                  generatingStatus === "error" &&
                    !tattooImage &&
                    generatingError.toLowerCase().includes("tattoo")
                    ? "border-red-500/80 bg-red-950/10 shadow-lg shadow-red-950/20 animate-pulse"
                    : "border-zinc-700 hover:border-violet-500",
                )}
              >
                {tattooImage ? (
                  <div className="relative aspect-[4/3] w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={tattooImage}
                      alt="Input Tattoo"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => {
                        setTattooImage("");
                        setResultImage("");
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 hover:text-red-400 border border-zinc-800 cursor-pointer transition-colors"
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
                    className="flex flex-col items-center justify-center p-4 text-center cursor-pointer aspect-[4/3]"
                  >
                    {isUploadingTattoo ? (
                      <FaSpinner className="animate-spin text-xl text-violet-400 mb-2" />
                    ) : (
                      <FaUpload className="text-zinc-500 mb-2 group-hover:text-violet-400 transition-colors" />
                    )}
                    <span className="text-xs font-bold text-zinc-200 group-hover:text-white">
                      {isUploadingTattoo
                        ? "Uploading..."
                        : "Tattoo Artwork / Sketch"}
                    </span>
                    <span className="text-[9px] text-zinc-500 font-bold mt-1">
                      Black & white line art or color PNG
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadTattoo}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Inline Upload/Asset-Related Errors */}
          {generatingStatus === "error" &&
            (generatingError.toLowerCase().includes("person") ||
              generatingError.toLowerCase().includes("tattoo") ||
              generatingError.toLowerCase().includes("photo") ||
              generatingError.toLowerCase().includes("design") ||
              generatingError.toLowerCase().includes("upload")) && (
              <div className="text-[11px] text-red-400 bg-red-950/40 border border-red-900/40 rounded p-3 flex items-start gap-2.5 shadow-inner">
                <FaExclamationTriangle className="text-red-500 flex-shrink-0 mt-0.5 text-xs animate-bounce" />
                <div className="flex-1 leading-tight font-medium">
                  {generatingError}
                </div>
              </div>
            )}

          {/* 3. Custom Select Dropdown: Placement */}
          <div ref={placementRef} className="relative">
            <label className="block text-[10px] font-bold text-zinc-300 uppercase tracking-wider mb-2">
              3. Body Placement Preset
            </label>
            <button
              type="button"
              onClick={() => setIsPlacementOpen(!isPlacementOpen)}
              className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded px-4 py-3.5 text-left text-xs font-bold text-white flex justify-between items-center cursor-pointer transition-all focus:outline-none focus:ring-1 focus:ring-violet-500/50"
            >
              <span>{PLACEMENTS.find((p) => p.id === placement)?.name}</span>
              <FaChevronDown
                className={clsx(
                  "text-zinc-500 text-[10px] transition-transform duration-200",
                  isPlacementOpen && "transform rotate-180",
                )}
              />
            </button>

            {isPlacementOpen && (
              <div className="absolute z-30 bottom-12 w-full bg-zinc-900 border border-zinc-800 rounded shadow-xl max-h-60 overflow-y-auto overscroll-contain">
                {PLACEMENTS.map((p) => {
                  const isSelected = placement === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        handlePlacementChange(p.id);
                        setIsPlacementOpen(false);
                      }}
                      className={clsx(
                        "w-full text-left px-4 py-2.5 text-xs transition-colors flex justify-between items-center cursor-pointer",
                        isSelected
                          ? "bg-violet-600/20 text-white font-bold border-l-2 border-violet-500"
                          : "text-zinc-300 hover:bg-zinc-800 hover:text-white",
                      )}
                    >
                      <div>
                        <div className="font-bold">{p.name}</div>
                        <div className="text-[9px] text-zinc-400 mt-0.5">
                          {p.desc}
                        </div>
                      </div>
                      {isSelected && (
                        <FaCheck className="text-violet-400 text-xs" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Custom Toggle Switch: Skin Texture Blending */}
          <div className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded">
            <div>
              <span className="text-xs font-bold text-white block">
                Optimize Ink Shading & Blending
              </span>
              <span className="text-[9px] text-zinc-400">
                Fits ink details dynamically to skin curvature
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOptimizeBlending(!optimizeBlending)}
              className={clsx(
                "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                optimizeBlending ? "bg-violet-600" : "bg-zinc-800",
              )}
            >
              <span
                className={clsx(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                  optimizeBlending ? "translate-x-5" : "translate-x-0",
                )}
              />
            </button>
          </div>

          {/* 5. Editable Prompt */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-300 uppercase tracking-wider mb-2">
              4. Editing Prompt (Default & Customisable)
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={4}
              className="w-full bg-zinc-955 border border-zinc-800 rounded px-3 py-2.5 text-xs font-medium text-white placeholder-zinc-650 focus:outline-none focus:ring-1 focus:ring-violet-500/50 resize-none transition-all leading-relaxed"
              placeholder="Prompt describing how to transfer and place the tattoo..."
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="py-2 px-5 border-t border-zinc-800 bg-zinc-900 flex-shrink-0 space-y-3">
          {!session?.user && (
            <div className="text-[10px] text-amber-400 bg-amber-955/20 border border-amber-900/40 rounded p-3 flex items-start gap-2 shadow-inner">
              <FaExclamationTriangle className="text-amber-500 flex-shrink-0 mt-0.5" />
              <span>
                You are playing as a guest. Please sign in with Google to enable
                tattoo simulations.
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
              generatingError.toLowerCase().includes("person") ||
              generatingError.toLowerCase().includes("tattoo") ||
              generatingError.toLowerCase().includes("photo") ||
              generatingError.toLowerCase().includes("design") ||
              generatingError.toLowerCase().includes("upload")
            ) && (
              <p className="text-[10px] text-red-400 bg-red-955/30 border border-red-900/40 rounded px-3 py-2 flex items-start gap-2 shadow-inner animate-pulse">
                <FaExclamationTriangle className="text-red-500 flex-shrink-0 mt-0.5" />
                <span>{generatingError}</span>
              </p>
            )}
        </div>
      </div>

      {/* ─── RIGHT PANEL: OUTPUT PREVIEW ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col md:overflow-hidden bg-zinc-950">
        {/* Output Header */}
        <div className="px-5 py-3.5 bg-zinc-900/40 border-b border-zinc-800 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight leading-none">
              Try-On Outcome Preview
            </h2>
            <p className="text-[10px] text-zinc-400 mt-1 font-medium font-sans">
              View your newly simulated tattoos placed on body shapes
            </p>
          </div>
          {resultImage && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-zinc-900 border border-zinc-800 px-3.5 py-2 rounded hover:bg-zinc-800 hover:border-zinc-700 transition-all cursor-pointer"
            >
              <FaDownload className="text-[10px]" /> Download HD
            </button>
          )}
        </div>

        {/* Main preview body */}
        <div className="flex-1 p-5 flex flex-col justify-center items-center overflow-y-auto max-w-4xl mx-auto w-full">
          <div className="relative w-full aspect-[4/5] rounded overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl flex items-center justify-center max-h-[75vh]">
            {resultImage ? (
              <div className="relative w-full h-full group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resultImage}
                  alt="AI Tattoo Try-On Result"
                  className="w-full h-full object-cover"
                />

                {/* Floating original assets overlay badge */}
                <div className="absolute bottom-4 right-4 bg-zinc-900/90 border border-zinc-800 p-2.5 rounded flex flex-col gap-2.5 z-20 shadow-xl max-w-[130px] backdrop-blur">
                  <div className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">
                    Before Assets
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="h-10 w-8 rounded overflow-hidden border border-zinc-850 bg-zinc-950">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={personImage}
                        alt="Person"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="h-10 w-8 rounded overflow-hidden border border-zinc-850 bg-zinc-950">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={tattooImage}
                        alt="Tattoo Design"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : generatingStatus === "generating" ? (
              <div className="flex flex-col items-center justify-center text-center p-8 bg-zinc-955 text-zinc-200">
                <div className="relative flex items-center justify-center mb-6">
                  <div className="h-16 w-16 rounded-full border-2 border-dashed border-violet-500 animate-spin" />
                  <FaPenNib className="absolute text-xl text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 animate-bounce rotate-45" />
                </div>
                <p className="text-sm font-heading font-bold text-white">
                  Simulating Tattoo Fitting...
                </p>
                <p className="text-xs text-zinc-400 mt-2.5 max-w-xs leading-relaxed font-medium">
                  Mapping tattoo vector structures, adjusting line curves to
                  muscles, and blending ink pigmentation values onto the skin.
                  Estimated time: 10-15s...
                </p>
              </div>
            ) : personImage || tattooImage ? (
              <div className="flex flex-col items-center justify-center gap-6 p-6 w-full h-full max-h-[70vh]">
                <div className="grid grid-cols-2 gap-4 max-w-[360px] w-full">
                  <div>
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 text-center">
                      Body Portrait
                    </div>
                    <div className="aspect-[4/5] w-full rounded overflow-hidden border border-zinc-800 bg-zinc-900 shadow-md">
                      {personImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={personImage}
                          alt="Person Upload Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-550 font-bold">
                          No Image
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 text-center">
                      Tattoo Design
                    </div>
                    <div className="aspect-[4/5] w-full rounded overflow-hidden border border-zinc-800 bg-zinc-900 shadow-md">
                      {tattooImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={tattooImage}
                          alt="Tattoo Upload Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-550 font-bold">
                          No Image
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-400 text-center font-bold">
                  {personImage && tattooImage
                    ? "Click 'Try On Tattoo' on the left to start AI rendering."
                    : "Please upload both images on the left side panel to proceed."}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 bg-zinc-950 text-zinc-400">
                <FaPenNib className="text-zinc-650 text-3xl mb-3 rotate-45 animate-pulse" />
                <p className="text-sm font-bold text-white">No Assets Loaded</p>
                <p className="text-xs text-zinc-400 mt-1.5 font-medium">
                  Upload a body portrait and a tattoo design in the left panel
                  to begin
                </p>
              </div>
            )}

            {/* Status badge overlay */}
            {resultImage && (
              <div className="absolute top-4 left-4 bg-zinc-950/95 border border-zinc-850 text-violet-400 text-[9px] font-bold px-2.5 py-1 rounded z-20 shadow-md flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping" />
                <span>Simulated Look</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
