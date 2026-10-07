"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import {
  FaPlus, FaTrashAlt, FaEye, FaDownload, FaSpinner,
  FaGoogle, FaImages, FaChevronRight, FaArrowLeft, FaArrowRight,
  FaCoins, FaUser, FaCheck, FaExclamationTriangle
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
  { id: "modern",       name: "Modern Minimal",  emoji: "✨" },
  { id: "scandinavian", name: "Scandinavian",    emoji: "🌿" },
  { id: "bohemian",     name: "Boho Chic",       emoji: "🌻" },
  { id: "industrial",   name: "Industrial Loft", emoji: "🏭" },
  { id: "mid-century",  name: "Mid-Century",     emoji: "🪵" },
  { id: "rustic",       name: "Rustic Cabin",    emoji: "🌲" },
];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  // Modal visual states
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const isDragging = useRef(false);
  const sliderRef = useRef(null);

  useEffect(() => {
    if (session?.user) {
      fetchRooms();
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [session, status]);

  // Dynamic polling for generating rooms in real-time
  useEffect(() => {
    const hasGenerating = rooms.some(r => r.status === "generating");
    if (!hasGenerating) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/rooms");
        if (res.ok) {
          const data = await res.json();
          setRooms(data);
        }
      } catch (e) {
        console.error("Dashboard auto-refresh error:", e);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [rooms]);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rooms");
      if (res.ok) {
        const data = await res.json();
        setRooms(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this staged property? This action cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/rooms?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setRooms(p => p.filter(r => r.id !== id));
        if (selectedRoom?.id === id) setSelectedRoom(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  // Slider controls in full screen modal
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

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isDragging.current = false;
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  const handleDownload = async (room) => {
    if (!room.stagedImage) return;
    try {
      const response = await fetch(room.stagedImage);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `staged-${room.roomType}-${room.designStyle}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error("Download failed, opening in new tab:", e);
      window.open(room.stagedImage, "_blank");
    }
  };

  if (status === "loading" || (loading && rooms.length === 0)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50">
        <FaSpinner className="animate-spin text-3xl text-indigo-600 mb-4" />
        <p className="text-sm font-medium text-slate-500">Loading your staged properties gallery...</p>
      </div>
    );
  }

  // 1. Logged Out / Unauthorized State
  if (!session?.user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
          <div className="h-14 w-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-inner">
            <FaImages className="text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">My Staging Gallery</h1>
          <p className="text-sm text-slate-500 leading-relaxed mb-8">
            Access your personal property dashboard, review before/after comparisons, and download photorealistic virtually staged spaces in high resolution.
          </p>
          <button
            onClick={() => signIn("google")}
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all cursor-pointer"
          >
            <FaGoogle className="text-xs" />
            <span>Sign in with Google</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">My Staging Gallery</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Review, share, and manage virtually staged rooms</p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all w-fit cursor-pointer"
          >
            <FaPlus className="text-[10px]" /> Stage New Property
          </Link>
        </div>

        {/* 2. Empty State */}
        {rooms.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm max-w-xl mx-auto my-12">
            <div className="h-16 w-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <FaImages className="text-3xl" />
            </div>
            <h2 className="text-lg font-bold text-slate-950 mb-2">No staged properties found</h2>
            <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto mb-8">
              It looks like you haven't virtually staged any properties yet. Upload empty house photos and generate high-fidelity designs with our AI decorator!
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-100 hover:shadow-lg transition-all cursor-pointer"
            >
              <FaPlus className="text-xs" /> Virtually Stage a Room
            </Link>
          </div>
        ) : (
          /* 3. Grid of staged rooms */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => {
              const matchedRoom = ROOM_TYPES.find(t => t.id === room.roomType) || { name: "Custom Room", emoji: "🏠" };
              const matchedStyle = STYLES.find(s => s.id === room.designStyle) || { name: "Custom Style", emoji: "✨" };
              return (
                <div
                  key={room.id}
                  className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:scale-[1.01] transition-all flex flex-col h-full group"
                >
                  {/* Miniature Staged Thumbnail */}
                  <div className="relative aspect-video bg-slate-900 border-b border-slate-100 overflow-hidden flex items-center justify-center shadow-inner">
                    {room.status === "generating" ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={room.originalImage} alt={room.roomType} className="w-full h-full object-cover blur-sm opacity-50" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-955/40 text-white gap-2">
                          <FaSpinner className="animate-spin text-lg text-indigo-400" />
                          <span className="text-[10px] font-bold tracking-wider uppercase">Staging in Progress...</span>
                        </div>
                      </>
                    ) : room.status === "failed" ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={room.originalImage} alt={room.roomType} className="w-full h-full object-cover opacity-30 grayscale" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-955/50 text-red-200 gap-1.5 p-4 text-center">
                          <span className="text-[10px] font-bold tracking-wider uppercase bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30">Staging Failed</span>
                          <span className="text-[8px] text-red-300 leading-tight line-clamp-2">Error during virtual staging</span>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={room.stagedImage} alt={room.roomType} className="w-full h-full object-cover" />
                      </>
                    )}
                    
                    {/* Floating Status Badge */}
                    <span className="absolute top-3 left-3 text-[10px] font-bold text-indigo-600 bg-white/95 backdrop-blur-sm border border-indigo-100/50 px-2.5 py-1 rounded-md shadow-sm">
                      {matchedRoom.emoji} {matchedRoom.name}
                    </span>
                  </div>

                  {/* Room metadata */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Staged Layout</span>
                        <span className="font-semibold text-slate-700 flex items-center gap-1 bg-slate-55 shadow-inner border border-slate-100 px-2 py-0.5 rounded-full text-[10px]">
                          <span>{matchedStyle.emoji}</span>
                          <span>{matchedStyle.name}</span>
                        </span>
                      </div>
                      
                      {room.userPrompt && (
                        <p className="text-[11px] text-slate-500 italic line-clamp-2 bg-slate-50/50 rounded-lg p-2.5 border border-slate-100/30 mb-4">
                          "{room.userPrompt}"
                        </p>
                      )}
                    </div>

                    {/* Quick Action Rows */}
                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      <button
                        onClick={() => { setSelectedRoom(room); setSliderPosition(50); }}
                        disabled={room.status !== "completed"}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm shadow-slate-100 disabled:opacity-40 disabled:hover:bg-slate-950 disabled:cursor-not-allowed"
                      >
                        <FaEye className="text-[10px]" /> View Split
                      </button>
                      <button
                        onClick={() => handleDownload(room)}
                        disabled={room.status !== "completed"}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:hover:bg-indigo-50 disabled:cursor-not-allowed"
                      >
                        <FaDownload className="text-[10px]" /> Download
                      </button>
                    </div>
                  </div>

                  {/* Card bottom meta */}
                  <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span>
                      {new Date(room.createTime).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    
                    <button
                      onClick={() => handleDelete(room.id)}
                      disabled={deletingId === room.id}
                      className="text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1 font-bold disabled:opacity-50 cursor-pointer"
                      title="Delete Staged Room"
                    >
                      {deletingId === room.id ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <FaTrashAlt />
                      )}
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── FULL SCREEN Draggable Slider Modal ────────────────────── */}
        {selectedRoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-2xl max-w-4xl w-full p-5 sm:p-6 border border-slate-100 shadow-2xl relative animate-in fade-in zoom-in duration-250 flex flex-col overflow-hidden max-h-[90vh]">
              
              {/* Modal header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 flex-shrink-0">
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-950 flex items-center gap-2">
                    <span>Staged Staging: {ROOM_TYPES.find(t => t.id === selectedRoom.roomType)?.name}</span>
                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded">
                      {STYLES.find(s => s.id === selectedRoom.designStyle)?.name} Style
                    </span>
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedRoom(null)}
                  className="text-slate-400 hover:text-slate-700 font-extrabold text-sm p-1.5 hover:bg-slate-50 rounded-lg transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Modal Interactive Split Slider */}
              <div className="flex-1 flex items-center justify-center overflow-hidden min-h-0 relative select-none">
                <div
                  ref={sliderRef}
                  onMouseMove={handleMouseMove}
                  onTouchMove={handleTouchMove}
                  className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 bg-slate-900 shadow-md select-none max-h-[60vh] max-w-2xl"
                  style={{ touchAction: "none" }}
                >
                  {/* Staged Furnished image (Behind) */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedRoom.stagedImage}
                    alt="Furnished"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  />

                  {/* Empty room image (In front, clipped) */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedRoom.originalImage}
                    alt="Vacant"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    style={{
                      clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`
                    }}
                  />

                  {/* Draggable separation bar handle */}
                  <div
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleMouseDown}
                    className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize select-none z-10 slider-handle shadow flex items-center justify-center"
                    style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
                  >
                    <div className="h-8 w-8 rounded-full bg-indigo-600 border-2 border-white shadow flex items-center justify-center text-white text-[9px] gap-1 hover:scale-105 transition-transform">
                      <FaArrowLeft />
                      <FaArrowRight />
                    </div>
                  </div>

                  {/* Label badges */}
                  <div className="absolute top-3 left-3 bg-slate-900/60 backdrop-blur-sm border border-slate-800 text-white text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded z-20">
                    Before
                  </div>
                  <div className="absolute top-3 right-3 bg-indigo-600/80 backdrop-blur-sm border border-indigo-500 text-white text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded z-20">
                    After
                  </div>
                </div>
              </div>

              {/* Modal actions footer */}
              <div className="border-t border-slate-100 pt-4 mt-4 flex justify-between items-center gap-3 flex-shrink-0">
                <button
                  onClick={() => handleDelete(selectedRoom.id)}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition-all cursor-pointer border border-red-100 flex items-center gap-1.5"
                >
                  <FaTrashAlt className="text-[10px]" /> Delete Staging
                </button>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(selectedRoom)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <FaDownload className="text-[10px]" /> Download High-Res
                  </button>
                  <button
                    onClick={() => setSelectedRoom(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    Close Gallery
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
