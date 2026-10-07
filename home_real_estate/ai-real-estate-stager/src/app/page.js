"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import {
  FaUpload, FaSpinner, FaMagic, FaDownload, FaShareAlt,
  FaHome, FaImages, FaChevronRight, FaArrowLeft, FaArrowRight,
  FaCoins, FaGoogle, FaUser, FaCheck, FaExclamationTriangle
} from "react-icons/fa";

const ROOM_TYPES = [
  { id: "living-room", name: "Living Room", emoji: "🛋️" },
  { id: "bedroom",     name: "Bedroom",     emoji: "🛏️" },
  { id: "kitchen",     name: "Kitchen",     emoji: "🍳" },
  { id: "office",      name: "Office",      emoji: "💼" },
  { id: "dining-room", name: "Dining Room", emoji: "🍽️" },
  { id: "bathroom",    name: "Bathroom",    emoji: "🚿" },
];

const STYLES = [
  { id: "modern",       name: "Modern Minimal",  emoji: "✨", desc: "Clean lines, neutral colors" },
  { id: "scandinavian", name: "Scandinavian",    emoji: "🌿", desc: "Warm wood, airy, cozy rugs" },
  { id: "bohemian",     name: "Boho Chic",       emoji: "🌻", desc: "Rich textures, plants, warm tones" },
  { id: "industrial",   name: "Industrial Loft", emoji: "🏭", desc: "Exposed brick, metal accents" },
  { id: "mid-century",  name: "Mid-Century",     emoji: "🪵", desc: "Retro wood legs, organic curves" },
  { id: "rustic",       name: "Rustic Cabin",    emoji: "🌲", desc: "Rough timbers, natural stone" },
];

const EXAMPLES = [
  {
    id: "scandinavian-living",
    name: "Scandinavian Living Room",
    type: "Living Room",
    style: "Scandinavian",
    before: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=800",
    after: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=800"
  },
  {
    id: "boho-bedroom",
    name: "Bohemian Bedroom",
    type: "Bedroom",
    style: "Bohemian",
    before: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?q=80&w=800",
    after: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=800"
  },
  {
    id: "modern-study",
    name: "Modern Study / Office",
    type: "Office",
    style: "Modern",
    before: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=800",
    after: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=800"
  }
];

export default function RoomStagerPage() {
  const { data: session } = useSession();

  // Selection state
  const [selectedRoom, setSelectedRoom] = useState(ROOM_TYPES[0].id);
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0].id);
  const [userPrompt, setUserPrompt] = useState("");
  const [originalImage, setOriginalImage] = useState("");
  const [stagedImage, setStagedImage] = useState("");
  
  // Slider interaction
  const [sliderPosition, setSliderPosition] = useState(50);
  const isDragging = useRef(false);
  const sliderRef = useRef(null);

  // Uploading / Staging states
  const [isUploading, setIsUploading] = useState(false);
  const [stagingStatus, setStagingStatus] = useState(""); // "", "staging", "success", "error"
  const [stagingError, setStagingError] = useState("");
  const [stagingTimer, setStagingTimer] = useState(15);
  const [stagedRoomId, setStagedRoomId] = useState("");

  // Loading default example on mount, or parsing query parameters to load generated details
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get("id");
    
    if (idParam) {
      const loadSavedRoom = async () => {
        try {
          const res = await fetch(`/api/rooms?id=${idParam}`);
          if (res.ok) {
            const room = await res.json();
            setOriginalImage(room.originalImage);
            setStagedImage(room.stagedImage);
            setStagedRoomId(room.id);
            setSelectedRoom(room.roomType);
            setSelectedStyle(room.designStyle);
            setUserPrompt(room.userPrompt || "");
            setSliderPosition(50);
          } else {
            loadExample(EXAMPLES[0]);
          }
        } catch (e) {
          console.error("Error loading saved room:", e);
          loadExample(EXAMPLES[0]);
        }
      };
      loadSavedRoom();
    } else {
      loadExample(EXAMPLES[0]);
    }
  }, []);

  const lastGenerated = useRef("");

  const resetPrompt = () => {
    const roomName = ROOM_TYPES.find(t => t.id === selectedRoom)?.name || "Room";
    const styleName = STYLES.find(s => s.id === selectedStyle)?.name || "Modern Minimal";
    const newPrompt = `Virtually stage this empty vacant space, transforming it into a photorealistic, fully furnished ${roomName} with a premium ${styleName} design. Include elegant matching furniture, wall decor, indoor plants, and warm ambient lighting. Professional interior design, high resolution, clean architectural staging.`;
    setUserPrompt(newPrompt);
    lastGenerated.current = newPrompt;
  };

  useEffect(() => {
    const roomName = ROOM_TYPES.find(t => t.id === selectedRoom)?.name || "Room";
    const styleName = STYLES.find(s => s.id === selectedStyle)?.name || "Modern Minimal";
    const newPrompt = `Virtually stage this empty vacant space, transforming it into a photorealistic, fully furnished ${roomName} with a premium ${styleName} design. Include elegant matching furniture, wall decor, indoor plants, and warm ambient lighting. Professional interior design, high resolution, clean architectural staging.`;
    
    if (!userPrompt || userPrompt === lastGenerated.current) {
      setUserPrompt(newPrompt);
      lastGenerated.current = newPrompt;
    }
  }, [selectedRoom, selectedStyle]);

  const loadExample = (ex) => {
    setOriginalImage(ex.before);
    setStagedImage(ex.after);
    setSliderPosition(50);
    // Find matched IDs
    const matchedType = ROOM_TYPES.find(t => t.name === ex.type)?.id || ROOM_TYPES[0].id;
    const matchedStyle = STYLES.find(s => s.name === ex.style)?.id || STYLES[0].id;
    setSelectedRoom(matchedType);
    setSelectedStyle(matchedStyle);
    setUserPrompt("");
    setStagedRoomId("");
  };

  // Draggable Slider logic
  const handleMove = (clientX) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current) return;
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    handleMove(e.clientX);
  };

  const handleMouseDown = () => {
    isDragging.current = true;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isDragging.current = false;
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  // Image Uploading logic
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const d = await res.json();
        if (d.url) {
          setOriginalImage(d.url);
          setStagedImage(""); // Clear previous staged image
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  // Staging trigger logic
  const handleStageRoom = async () => {
    if (!session?.user) { signIn("google"); return; }
    if (!originalImage) { alert("Please upload a room photo first!"); return; }
    if ((session.user.credits ?? 0) < 6) { alert("You need at least 6 credits to stage a room."); return; }

    setStagingStatus("staging");
    setStagingError("");
    setStagingTimer(15);

    // Dynamic timer ticker
    const timerInterval = setInterval(() => {
      setStagingTimer(t => (t > 1 ? t - 1 : 1));
    }, 1000);

    try {
      const res = await fetch("/api/stage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomType: selectedRoom,
          designStyle: selectedStyle,
          originalImage,
          userPrompt
        })
      });

      if (res.ok) {
        const data = await res.json();
        
        const pollInterval = setInterval(async () => {
          try {
            const statusRes = await fetch(`/api/rooms?id=${data.roomId}`);
            if (statusRes.ok) {
              const room = await statusRes.json();
              if (room.status === "completed") {
                clearInterval(pollInterval);
                clearInterval(timerInterval);
                setStagedImage(room.stagedImage);
                setStagedRoomId(room.id);
                setStagingStatus("success");
                
                // Update URL parameters and reload to refresh credits cleanly while keeping custom details visible!
                setTimeout(() => {
                  window.history.pushState(null, "", `/?id=${room.id}`);
                  window.location.reload();
                }, 1500);
              } else if (room.status === "failed") {
                clearInterval(pollInterval);
                clearInterval(timerInterval);
                setStagingStatus("error");
                setStagingError("Virtual staging failed on the AI server.");
              }
            }
          } catch (e) {
            console.error("Client polling error:", e);
          }
        }, 2000);
      } else {
        clearInterval(timerInterval);
        const errText = await res.text();
        setStagingStatus("error");
        setStagingError(errText || "Failed to stage room");
      }
    } catch (e) {
      clearInterval(timerInterval);
      setStagingStatus("error");
      setStagingError(e.message);
    }
  };

  const handleDownload = async () => {
    if (!stagedImage) return;
    try {
      const response = await fetch(stagedImage);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `staged-${selectedRoom}-${selectedStyle}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error("Download failed, opening in new tab:", e);
      window.open(stagedImage, "_blank");
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row md:overflow-hidden overflow-y-auto bg-slate-50">
      {/* ─── LEFT: Form Controls ────────────────────────────────────── */}
      <div className="w-full md:w-[400px] border-r border-slate-200 bg-white flex flex-col overflow-y-auto flex-shrink-0">
        {/* Workspace Title */}
        <div className="px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-1.5 leading-none">
            <FaMagic className="text-indigo-600 text-xs" /> Design Studio
          </h1>
          <p className="text-[11px] text-slate-400 mt-1">Configure parameters to stage vacant spaces</p>
        </div>
        {/* Form Body */}
        <div className="p-5 flex-1 space-y-6">
          {/* 1. Upload Room Photo */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-2">
              1. Upload Room Photo
            </label>
            <div className="relative border-2 border-dashed border-slate-200 rounded p-4 text-center hover:border-indigo-400 transition-colors bg-slate-50/50 flex flex-col items-center justify-center min-h-[140px] group">
              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <FaSpinner className="animate-spin text-xl text-indigo-600" />
                  <span className="text-xs text-slate-500 font-semibold">Uploading photo...</span>
                </div>
              ) : originalImage ? (
                <div className="relative w-full aspect-video rounded overflow-hidden border border-slate-200 shadow-inner group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={originalImage} alt="Uploaded Empty Room" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <label className="px-3 py-1.5 bg-white rounded text-[10px] font-bold text-slate-700 shadow hover:bg-slate-50 cursor-pointer">
                      Change Photo
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="w-full h-full flex flex-col items-center justify-center gap-2 cursor-pointer py-4">
                  <div className="h-10 w-10 rounded bg-indigo-50 border border-indigo-100/50 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
                    <FaUpload className="text-xs" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-slate-700">Drag photo here, or browse</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Supports PNG, JPG (vacant room preferred)</p>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </div>
          </div>
          {/* 2. Select Room Type */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-2">
              2. Select Room Type
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {ROOM_TYPES.map((type) => {
                const isSelected = selectedRoom === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedRoom(type.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded text-left border text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-sm">{type.emoji}</span>
                    <span className="truncate">{type.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {/* 3. Select Staging Style */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-2">
              3. Staging Style
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {STYLES.map((style) => {
                const isSelected = selectedStyle === style.id;
                return (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`flex flex-col items-start px-3 py-2.5 rounded text-left border text-xs transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-bold"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                    title={style.desc}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{style.emoji}</span>
                      <span className="font-bold truncate">{style.name}</span>
                    </div>
                    <span className={`text-[9px] truncate mt-0.5 max-w-full ${isSelected ? "text-indigo-500 font-medium" : "text-slate-400"}`}>
                      {style.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          {/* 4. Dynamic AI Staging Prompt (Editable) */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[11px] font-bold text-slate-400">
                4. AI Staging Prompt (Editable)
              </label>
              <button 
                onClick={resetPrompt} 
                className="text-[9px] font-bold text-indigo-600 hover:text-indigo-850 cursor-pointer"
                type="button"
              >
                Reset Default
              </button>
            </div>
            <textarea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              rows={4}
              className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none transition-all leading-normal"
              placeholder="e.g. Virtually stage this empty space..."
            />
          </div>
        </div>
        {/* Staging Trigger footer CTA */}
        <div className="p-5 border-t border-slate-100 bg-white flex-shrink-0 space-y-3">
          <button
            onClick={handleStageRoom}
            disabled={stagingStatus === "staging" || isUploading}
            className="w-full bg-slate-950 hover:bg-slate-800 text-white rounded py-3 text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-slate-100"
          >
            {stagingStatus === "staging" ? (
              <>
                <FaSpinner className="animate-spin text-xs text-white" />
                <span>Staging Room… ({stagingTimer}s)</span>
              </>
            ) : (
              <>
                <FaMagic className="text-xs text-indigo-400" />
                <span>Stage Room with AI</span>
              </>
            )}
          </button>
          <div className="flex items-center justify-between text-[9px] font-semibold text-slate-400 px-1">
            <span>Staging Cost: 6 Credits</span>
            <span className="flex items-center gap-1 font-bold text-amber-600 bg-amber-50 border border-amber-100 rounded-full px-1.5 py-0.5">
              <FaCoins className="text-amber-400" /> Free with active credits
            </span>
          </div>
          {/* Staging status flags */}
          {stagingStatus === "error" && (
            <p className="text-[10px] text-red-600 bg-red-50 border border-red-100 rounded px-3.5 py-2.5 flex items-start gap-2 shadow-inner">
              <FaExclamationTriangle className="text-red-400 flex-shrink-0 mt-0.5" />
              <span>{stagingError || "Database / Staging error occurred."}</span>
            </p>
          )}
        </div>
      </div>
      {/* ─── RIGHT: Before/After Sliding Viewer ────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Preview Toolbar */}
        <div className="px-5 py-3.5 bg-white border-b border-slate-200 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 leading-none">Before &amp; After Staged Viewer</h2>
            <p className="text-[10px] text-slate-400 mt-1">Drag the vertical bar horizontally to preview furnishings</p>
          </div>
          {/* Quick Download / Share */}
          {stagedImage && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded hover:bg-slate-100 hover:text-slate-800 transition-all cursor-pointer"
            >
              <FaDownload className="text-[10px]" /> Download
            </button>
          )}
        </div>
        {/* Main interactive panel */}
        <div className="flex-1 p-5 flex flex-col justify-center items-center overflow-y-auto max-w-4xl mx-auto w-full space-y-2">
          {/* Interactive Draggable Slider */}
          <div
            ref={sliderRef}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            className="relative w-full aspect-[1/1] rounded overflow-hidden border border-slate-200 bg-slate-900 shadow-xl select-none"
            style={{ touchAction: "none" }}
          >
            {/* 1. Behind Layer: Staged (After) Image */}
            {stagedImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={stagedImage}
                alt="Staged Furnished Room"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />
            ) : stagingStatus === "staging" ? (
              /* If staging is in progress, show generating loading screen */
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-slate-900 text-slate-300">
                <FaSpinner className="animate-spin text-3xl text-indigo-500 mb-4" />
                <p className="text-sm font-bold text-white">Generating staged layout...</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">Our AI agent is analyzing the vacant space dimensions to stage custom premium furnishings matching {selectedStyle} style...</p>
              </div>
            ) : (
              /* If not staging yet, show original image as placeholder on the right side as well */
              originalImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={originalImage}
                  alt="Empty Room Placeholder"
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-40 filter grayscale"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-slate-900 text-slate-300">
                  <p className="text-sm font-bold text-white">No room photo uploaded</p>
                  <p className="text-xs text-slate-400 mt-1">Upload a vacant room photo to begin staging</p>
                </div>
              )
            )}
            {/* 2. Top Layer: Original (Before) Image, polygon clipped */}
            {originalImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={originalImage}
                alt="Empty Vacant Room"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                style={{
                  clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`
                }}
              />
            )}
            {/* Draggable vertical bar separator handle */}
            <div
              onMouseDown={handleMouseDown}
              onTouchStart={handleMouseDown}
              className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize select-none z-10 slider-handle shadow-2xl flex items-center justify-center"
              style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
            >
              <div className="h-9 w-9 rounded-full flex-shrink-0 bg-indigo-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-[10px] gap-1 hover:scale-105 active:scale-95 transition-transform">
                <FaArrowLeft />
                <FaArrowRight />
              </div>
            </div>
            {/* Before / After Label Badges */}
            <div className="absolute top-4 left-4 bg-slate-900/60 backdrop-blur-sm border border-slate-800 text-white text-[9px] font-bold px-2.5 py-1 rounded-md z-20 shadow">
              Before (Empty)
            </div>
            <div className="absolute top-4 right-4 bg-indigo-600/80 backdrop-blur-sm border border-indigo-500 text-white text-[9px] font-bold px-2.5 py-1 rounded-md z-20 shadow">
              After (Staged)
            </div>
          </div>
          {/* 3. Example Staged Showcase gallery */}
          <div className="w-full bg-white border border-slate-100 rounded p-5 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 mb-3.5">
              Interactive Examples Gallery
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => loadExample(ex)}
                  className="flex items-center gap-3 p-2.5 border border-slate-150 rounded hover:border-indigo-300 hover:bg-slate-50/50 text-left transition-all group cursor-pointer"
                >
                  <div className="h-10 w-10 bg-slate-100 rounded overflow-hidden border border-slate-200/50 flex-shrink-0 flex items-center justify-center font-bold text-slate-400">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ex.after} alt={ex.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  
                  <div className="min-w-0">
                    <h4 className="text-[11px] font-bold text-slate-800 truncate leading-snug group-hover:text-indigo-600">
                      {ex.name}
                    </h4>
                    <p className="text-[9px] text-slate-400 mt-0.5">{ex.type} • {ex.style}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
