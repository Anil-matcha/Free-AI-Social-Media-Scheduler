"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import {
  FaUpload, FaSpinner, FaMagic, FaDownload,
  FaCut, FaCoins, FaCheck, FaExclamationTriangle, FaTimes, FaChevronDown
} from "react-icons/fa";
import clsx from "clsx";

const GENDERS = [
  { id: "unisex", name: "Unisex / Neutral" },
  { id: "female", name: "Female" },
  { id: "male", name: "Male" }
];

const HAIR_STYLES = [
  { id: "short", name: "Short Hair Cut", desc: "Clean and neat short trim" },
  { id: "medium", name: "Medium Length", desc: "Shoulder-length cut" },
  { id: "long", name: "Long Hair", desc: "Flowing long tresses" },
  { id: "curly", name: "Curly Hair", desc: "Bouncy, defined curls" },
  { id: "pixie", name: "Pixie Cut", desc: "Short, trendy crop" },
  { id: "bob", name: "Classic Bob", desc: "Sleek bob cut" },
  { id: "buzzcut", name: "Buzz Cut", desc: "Very short shaved look" },
  { id: "bald", name: "Bald / Clean Shaved", desc: "No hair look" },
  { id: "undercut", name: "Undercut", desc: "Shaved sides with styled top" }
];

const HAIR_COLORS = [
  { id: "black", name: "Natural Black", desc: "Deep dark hair color" },
  { id: "dark brown", name: "Dark Brown", desc: "Rich chocolate brown" },
  { id: "light brown", name: "Light Brown", desc: "Warm chestnut brown" },
  { id: "blonde", name: "Golden Blonde", desc: "Bright blonde highlights" },
  { id: "platinum blonde", name: "Platinum Blonde", desc: "Cool silver-blonde" },
  { id: "auburn", name: "Auburn / Red", desc: "Fiery ginger-red" },
  { id: "pink", name: "Pastel Pink", desc: "Soft neon pink shade" },
  { id: "blue", name: "Midnight Blue", desc: "Vibrant electric blue" },
  { id: "silver", name: "Silver Grey", desc: "Trendy metallic silver" },
  { id: "purple", name: "Lavender Purple", desc: "Rich royal purple" }
];

export default function StudioPage() {
  const { data: session, update: updateSession } = useSession();

  // Inputs
  const [inputImage, setInputImage] = useState("");
  const [gender, setGender] = useState("unisex");
  const [styleName, setStyleName] = useState("short");
  const [colorName, setColorName] = useState("black");
  const [customPrompt, setCustomPrompt] = useState("");
  const [enhanceFace, setEnhanceFace] = useState(true);
  const [resultImage, setResultImage] = useState("");
  const [creationId, setCreationId] = useState("");

  // Dropdown States
  const [isGenderOpen, setIsGenderOpen] = useState(false);
  const [isStyleOpen, setIsStyleOpen] = useState(false);
  const [isColorOpen, setIsColorOpen] = useState(false);

  const genderRef = useRef(null);
  const styleRef = useRef(null);
  const colorRef = useRef(null);

  // Status
  const [isUploading, setIsUploading] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState(""); // "", "generating", "success", "error"
  const [generatingError, setGeneratingError] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const timerIntervalRef = useRef(null);

  // Load saved hairstyle if URL has ?id=
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const savedId = params.get("id");

    if (savedId) {
      const loadSavedCreation = async () => {
        try {
          const res = await fetch(`/api/creations?id=${savedId}`);
          if (res.ok) {
            const data = await res.json();
            setInputImage(data.inputImage);
            setResultImage(data.resultImage);
            setCreationId(data.id);
            setGender(data.gender);
            setStyleName(data.styleName);
            setColorName(data.colorName);
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

  // Click outside listener to close dropdowns
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (genderRef.current && !genderRef.current.contains(e.target)) setIsGenderOpen(false);
      if (styleRef.current && !styleRef.current.contains(e.target)) setIsStyleOpen(false);
      if (colorRef.current && !colorRef.current.contains(e.target)) setIsColorOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setInputImage(data.url);
      setResultImage("");
    } catch (err) {
      console.error(err);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (!session?.user) {
      signIn("google");
      return;
    }

    if (!inputImage) {
      setGeneratingError("Please upload a photo of your face first.");
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
          inputImage,
          gender,
          styleName,
          colorName,
          customPrompt: `${customPrompt}${enhanceFace ? ", highly detailed, realistic skin texture, beautiful studio lighting" : ""}`
        })
      });

      if (res.status === 402) {
        setGeneratingError("Insufficient credits. Please purchase a credit pack on the pricing page.");
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
      setGeneratingError("An error occurred during generation. Please try again.");
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
            setGeneratingError("AI hairstyle fitting failed. Please review your photo and try again.");
            setGeneratingStatus("error");
            completed = true;
          }
        }
      } catch (err) {
        console.error("Error polling database status:", err);
      }
    }

    if (!completed) {
      setGeneratingError("Generation is taking longer than expected. It will complete in the background and show in your gallery.");
      setGeneratingStatus("error");
    }
  };

  const handleDownload = async () => {
    if (!resultImage) return;
    try {
      const response = await fetch(resultImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hairstyle_${creationId || Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      window.open(resultImage, "_blank");
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row md:overflow-hidden overflow-y-auto bg-zinc-950 text-zinc-100 font-sans">
      
      {/* ─── LEFT PANEL: OPTIONS ────────────────────────────────────────── */}
      <div className="w-full md:w-[420px] border-r border-zinc-800 bg-zinc-900/60 flex flex-col md:overflow-y-auto overflow-visible flex-shrink-0">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex-shrink-0 bg-zinc-900/80">
          <h1 className="text-lg font-heading font-extrabold text-white tracking-tight flex items-center gap-2">
            <FaCut className="text-violet-400 rotate-90" /> AI Hairstyle Studio
          </h1>
          <p className="text-xs text-zinc-300 mt-1.5 font-medium">Upload your portrait photo and virtually change your haircut and hair color.</p>
        </div>

        {/* Form controls */}
        <div className="p-5 space-y-6 flex-1 bg-zinc-900/30">
          
          {/* 1. Portrait Upload */}
          <div>
            <label className="block text-[10px] font-black text-zinc-300 uppercase tracking-wider mb-2">
              1. Upload Face Photo
            </label>
            <div className="relative group border border-dashed border-zinc-700 hover:border-violet-500 rounded-lg overflow-hidden bg-zinc-950 transition-all duration-200">
              {inputImage ? (
                <div className="relative aspect-[4/3] w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={inputImage} alt="Input Portrait" className="w-full h-full object-cover" />
                  <button
                    onClick={() => {
                      setInputImage("");
                      setResultImage("");
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 hover:text-red-400 border border-zinc-800 cursor-pointer transition-colors"
                    title="Remove image"
                  >
                    <FaTimes className="text-[10px]" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-4 text-center cursor-pointer aspect-[4/3]">
                  {isUploading ? (
                    <FaSpinner className="animate-spin text-xl text-violet-400 mb-2" />
                  ) : (
                    <FaUpload className="text-zinc-500 mb-2 group-hover:text-violet-400 transition-colors" />
                  )}
                  <span className="text-xs font-bold text-zinc-200 group-hover:text-white">
                    {isUploading ? "Uploading..." : "Click or drop your photo"}
                  </span>
                  <span className="text-[9px] text-zinc-500 font-bold mt-1">Clear front-facing selfie works best</span>
                  <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* 2. Custom Select Dropdown: Gender */}
          <div ref={genderRef} className="relative">
            <label className="block text-[10px] font-black text-zinc-300 uppercase tracking-wider mb-2">
              2. Target Gender / Face Shape Profile
            </label>
            <button
              type="button"
              onClick={() => {
                setIsGenderOpen(!isGenderOpen);
                setIsStyleOpen(false);
                setIsColorOpen(false);
              }}
              className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-lg px-4 py-3.5 text-left text-xs font-extrabold text-white flex justify-between items-center cursor-pointer transition-all focus:outline-none focus:ring-1 focus:ring-violet-500/50"
            >
              <span>{GENDERS.find(g => g.id === gender)?.name}</span>
              <FaChevronDown className={clsx("text-zinc-500 text-[10px] transition-transform duration-200", isGenderOpen && "transform rotate-180")} />
            </button>

            {isGenderOpen && (
              <div className="absolute z-30 top-full mt-1 w-full bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-1.5 overscroll-contain">
                {GENDERS.map((g) => {
                  const isSelected = gender === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => {
                        setGender(g.id);
                        setIsGenderOpen(false);
                      }}
                      className={clsx(
                        "w-full text-left px-4 py-2.5 text-xs transition-colors flex justify-between items-center cursor-pointer",
                        isSelected
                          ? "bg-violet-600/20 text-white font-extrabold border-l-2 border-violet-500"
                          : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                      )}
                    >
                      <span>{g.name}</span>
                      {isSelected && <FaCheck className="text-violet-400 text-xs" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Custom Select Dropdown: Hairstyle Category */}
          <div ref={styleRef} className="relative">
            <label className="block text-[10px] font-black text-zinc-300 uppercase tracking-wider mb-2">
              3. Select Hairstyle Preset
            </label>
            <button
              type="button"
              onClick={() => {
                setIsStyleOpen(!isStyleOpen);
                setIsGenderOpen(false);
                setIsColorOpen(false);
              }}
              className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-lg px-4 py-3.5 text-left text-xs font-extrabold text-white flex justify-between items-center cursor-pointer transition-all focus:outline-none focus:ring-1 focus:ring-violet-500/50"
            >
              <div>
                <div className="font-extrabold">{HAIR_STYLES.find(h => h.id === styleName)?.name}</div>
              </div>
              <FaChevronDown className={clsx("text-zinc-500 text-[10px] transition-transform duration-200", isStyleOpen && "transform rotate-180")} />
            </button>

            {isStyleOpen && (
              <div className="absolute z-30 top-full mt-1 w-full bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-1.5 max-h-60 overflow-y-auto overscroll-contain">
                {HAIR_STYLES.map((h) => {
                  const isSelected = styleName === h.id;
                  return (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => {
                        setStyleName(h.id);
                        setIsStyleOpen(false);
                      }}
                      className={clsx(
                        "w-full text-left px-4 py-2.5 text-xs transition-colors flex justify-between items-center cursor-pointer",
                        isSelected
                          ? "bg-violet-600/20 text-white font-extrabold border-l-2 border-violet-500"
                          : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                      )}
                    >
                      <div>
                        <div className="font-bold">{h.name}</div>
                        <div className="text-[9px] text-zinc-400 mt-0.5">{h.desc}</div>
                      </div>
                      {isSelected && <FaCheck className="text-violet-400 text-xs" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Custom Select Dropdown: Hair Color (Situates near bottom, opens upwards) */}
          <div ref={colorRef} className="relative">
            <label className="block text-[10px] font-black text-zinc-300 uppercase tracking-wider mb-2">
              4. Select Hair Color
            </label>
            <button
              type="button"
              onClick={() => {
                setIsColorOpen(!isColorOpen);
                setIsGenderOpen(false);
                setIsStyleOpen(false);
              }}
              className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-lg px-4 py-3.5 text-left text-xs font-extrabold text-white flex justify-between items-center cursor-pointer transition-all focus:outline-none focus:ring-1 focus:ring-violet-500/50"
            >
              <span>{HAIR_COLORS.find(c => c.id === colorName)?.name}</span>
              <FaChevronDown className={clsx("text-zinc-500 text-[10px] transition-transform duration-200", isColorOpen && "transform rotate-180")} />
            </button>

            {isColorOpen && (
              <div className="absolute z-30 bottom-full mb-1 w-full bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-1.5 max-h-60 overflow-y-auto overscroll-contain">
                {HAIR_COLORS.map((c) => {
                  const isSelected = colorName === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setColorName(c.id);
                        setIsColorOpen(false);
                      }}
                      className={clsx(
                        "w-full text-left px-4 py-2.5 text-xs transition-colors flex justify-between items-center cursor-pointer",
                        isSelected
                          ? "bg-violet-600/20 text-white font-extrabold border-l-2 border-violet-500"
                          : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                      )}
                    >
                      <div>
                        <div className="font-bold">{c.name}</div>
                        <div className="text-[9px] text-zinc-400 mt-0.5">{c.desc}</div>
                      </div>
                      {isSelected && <FaCheck className="text-violet-400 text-xs" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 5. Custom Toggle Switch: Face Details Enhancement */}
          <div className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
            <div>
              <span className="text-xs font-extrabold text-white block">Optimize Face Details</span>
              <span className="text-[9px] text-zinc-400">Maintains high facial photorealism</span>
            </div>
            <button
              type="button"
              onClick={() => setEnhanceFace(!enhanceFace)}
              className={clsx(
                "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                enhanceFace ? "bg-violet-600" : "bg-zinc-850"
              )}
            >
              <span
                className={clsx(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                  enhanceFace ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>

          {/* 6. Custom Prompt Instructions */}
          <div>
            <label className="block text-[10px] font-black text-zinc-300 uppercase tracking-wider mb-2">
              5. Custom / Additional Styling (Optional)
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={2}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs font-medium text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50 resize-none transition-all"
              placeholder="e.g. wet styled look, comb over, business formal cuts..."
            />
          </div>

        </div>

        {/* Footer actions */}
        <div className="p-5 border-t border-zinc-800 bg-zinc-900 flex-shrink-0 space-y-3">
          <button
            onClick={handleGenerate}
            disabled={generatingStatus === "generating" || isUploading}
            className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-lg py-3.5 text-xs font-black flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-violet-500/10 active:scale-[0.99]"
          >
            {generatingStatus === "generating" ? (
              <>
                <FaSpinner className="animate-spin text-xs text-white" />
                <span>Simulating Haircut... ({elapsedSeconds}s)</span>
              </>
            ) : (
              <>
                <FaMagic className="text-xs text-white animate-pulse" />
                <span>{session?.user ? "Generate Hair Transformation" : "Sign in with Google"}</span>
              </>
            )}
          </button>
          <div className="flex items-center justify-between text-[9px] font-black text-zinc-400 px-1">
            <span>Cost: 18 Credits</span>
            <span className="flex items-center gap-1 text-amber-300 bg-amber-955/20 border border-amber-800/40 rounded px-2 py-0.5 font-bold">
              <FaCoins /> Deducts balance live
            </span>
          </div>

          {generatingStatus === "error" && (
            <p className="text-[10px] text-red-400 bg-red-950/30 border border-red-900/40 rounded px-3 py-2 flex items-start gap-2 shadow-inner">
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
            <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight leading-none">Simulation Outcome Preview</h2>
            <p className="text-[10px] text-zinc-400 mt-1 font-medium font-sans">View your newly simulated hairstyles and hair colors</p>
          </div>
          {resultImage && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-zinc-900 border border-zinc-800 px-3.5 py-2 rounded-lg hover:bg-zinc-800 hover:border-zinc-700 transition-all cursor-pointer"
            >
              <FaDownload className="text-[10px]" /> Download HD
            </button>
          )}
        </div>

        {/* Main preview body */}
        <div className="flex-1 p-5 flex flex-col justify-center items-center overflow-y-auto max-w-4xl mx-auto w-full">
          <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl flex items-center justify-center max-h-[75vh]">
            
            {resultImage ? (
              <div className="relative w-full h-full group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resultImage}
                  alt="AI Hairstyle Simulator Result"
                  className="w-full h-full object-cover"
                />

                {/* Floating original overlay badge */}
                {inputImage && (
                  <div className="absolute bottom-4 right-4 bg-zinc-900/90 border border-zinc-800 p-2.5 rounded-lg flex flex-col gap-1.5 z-20 shadow-xl max-w-[130px] backdrop-blur">
                    <div className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Before Photo</div>
                    <div className="h-14 w-11 rounded overflow-hidden border border-zinc-800 bg-zinc-950">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={inputImage} alt="Original Face" className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}
              </div>
            ) : generatingStatus === "generating" ? (
              <div className="flex flex-col items-center justify-center text-center p-8 bg-zinc-950 text-zinc-200">
                <div className="relative flex items-center justify-center mb-6">
                  <div className="h-16 w-16 rounded-full border-2 border-dashed border-violet-500 animate-spin" />
                  <FaCut className="absolute text-xl text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 animate-bounce rotate-90" />
                </div>
                <p className="text-sm font-heading font-black text-white">Simulating Hairstyle...</p>
                <p className="text-xs text-zinc-400 mt-2.5 max-w-xs leading-relaxed font-medium">
                  Blending fibers, adjusting hair volume, and applying the styling tint onto the head contour. Estimated time: 10-15s...
                </p>
              </div>
            ) : (
              inputImage ? (
                <div className="flex flex-col items-center justify-center gap-4 p-6 w-full h-full max-h-[70vh]">
                  <div className="flex flex-col items-center gap-2 max-w-[240px] w-full">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Your Portrait Photo</div>
                    <div className="aspect-[4/5] w-full rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-md">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={inputImage} alt="Face Upload Preview" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-400 text-center font-bold">
                    Click "Generate Hair Transformation" on the left to start AI styling.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-8 bg-zinc-950 text-zinc-400">
                  <FaCut className="text-zinc-600 text-3xl mb-3 rotate-90" />
                  <p className="text-sm font-bold text-white">No Face Photo Loaded</p>
                  <p className="text-xs text-zinc-400 mt-1.5 font-medium">Upload a front-facing portrait selfie in the left panel to begin</p>
                </div>
              )
            )}

            {/* Status badge overlay */}
            {resultImage && (
              <div className="absolute top-4 left-4 bg-zinc-950/95 border border-zinc-850 text-violet-400 text-[9px] font-black px-2.5 py-1 rounded-lg z-20 shadow-md flex items-center gap-1.5">
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
