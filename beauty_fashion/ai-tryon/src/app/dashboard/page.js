"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import {
  FaPlus, FaTrashAlt, FaEye, FaDownload, FaSpinner,
  FaGoogle, FaImages, FaCoins, FaUser, FaCheck, FaExclamationTriangle, FaTshirt
} from "react-icons/fa";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [tryons, setTryons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  // Modal details view state
  const [selectedTryOn, setSelectedTryOn] = useState(null);

  useEffect(() => {
    if (session?.user) {
      fetchTryOns();
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [session, status]);

  // Polling database for real-time updates when try-ons are "processing"
  useEffect(() => {
    const hasProcessing = tryons.some(t => t.status === "processing");
    if (!hasProcessing) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/tryons");
        if (res.ok) {
          const data = await res.json();
          setTryons(data);
        }
      } catch (e) {
        console.error("Dashboard refresh error:", e);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [tryons]);

  const fetchTryOns = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tryons");
      if (res.ok) {
        const data = await res.json();
        setTryons(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this outfit try-on? This action cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/tryons?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setTryons(p => p.filter(t => t.id !== id));
        if (selectedTryOn?.id === id) setSelectedTryOn(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (tryon) => {
    if (!tryon.resultImage) return;
    try {
      const response = await fetch(tryon.resultImage);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `tryon-${tryon.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      window.open(tryon.resultImage, "_blank");
    }
  };

  if (status === "loading" || (loading && tryons.length === 0)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 text-zinc-300">
        <FaSpinner className="animate-spin text-3xl text-violet-400 mb-4" />
        <p className="text-sm font-medium">Loading try-on gallery...</p>
      </div>
    );
  }

  // Logged out state
  if (!session?.user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-955 px-4 py-12">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-700 rounded-2xl p-8 text-center shadow-xl">
          <div className="h-14 w-14 rounded-2xl bg-violet-655/10 border border-violet-500/30 text-violet-400 flex items-center justify-center mx-auto mb-6 shadow-inner animate-pulse">
            <FaImages className="text-2xl" />
          </div>
          <h1 className="text-2xl font-bold font-heading text-white tracking-tight mb-2">My Outfit Gallery</h1>
          <p className="text-sm text-zinc-200 leading-relaxed mb-8">
            Access your personal wardrobe dashboard, review outfit fits, and download high-resolution virtual photos.
          </p>
          <button
            onClick={() => signIn("google")}
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-500/10 active:scale-[0.98] transition-all cursor-pointer"
          >
            <FaGoogle className="text-xs" />
            <span>Sign in with Google</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-955 text-zinc-200 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black font-heading text-white tracking-tight">My Outfit Gallery</h1>
            <p className="text-xs sm:text-sm text-zinc-300 mt-1.5 font-medium">Review, share, and delete your AI generated tries</p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-4.5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs font-extrabold rounded shadow-lg shadow-violet-500/5 transition-all w-fit cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <FaPlus className="text-[10px]" /> Design New Outfit
          </Link>
        </div>

        {/* Empty State */}
        {tryons.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-12 text-center shadow-lg max-w-xl mx-auto my-12">
            <div className="h-16 w-16 bg-zinc-950 text-zinc-400 border border-zinc-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <FaTshirt className="text-3xl text-zinc-300" />
            </div>
            <h2 className="text-lg font-bold text-zinc-200 mb-2">No outfit try-ons found</h2>
            <p className="text-sm text-zinc-300 leading-relaxed max-w-sm mx-auto mb-8 font-medium">
              You haven't generated any virtual fits yet. Upload a portrait and garment photo to create styled outfits!
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-sm font-extrabold rounded shadow-lg shadow-violet-500/10 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <FaPlus className="text-xs" /> Design Custom Outfit
            </Link>
          </div>
        ) : (
          /* Tryons Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tryons.map((tryon) => (
              <div
                key={tryon.id}
                className="bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl hover:border-zinc-500 transition-all flex flex-col h-full group"
              >
                {/* Image Showcase */}
                <div className="relative aspect-[4/5] bg-zinc-950 border-b border-zinc-700 overflow-hidden flex items-center justify-center shadow-inner">
                  {tryon.status === "processing" ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={tryon.personImage} alt="Person Original" className="w-full h-full object-cover blur-sm opacity-50" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/60 text-white gap-2">
                        <FaSpinner className="animate-spin text-lg text-violet-455" />
                        <span className="text-[10px] font-bold tracking-wider uppercase">Fitting Outfit...</span>
                      </div>
                    </>
                  ) : tryon.status === "failed" ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={tryon.personImage} alt="Person Original" className="w-full h-full object-cover opacity-20 grayscale" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-955/70 text-red-300 gap-1.5 p-4 text-center">
                        <span className="text-[10px] font-bold tracking-wider uppercase bg-red-950/40 px-2 py-0.5 rounded border border-red-900/40">Failed</span>
                        <span className="text-[9px] text-zinc-300 leading-tight font-medium">Error fitting outfit garment</span>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={tryon.resultImage} alt="Tryon Result" className="w-full h-full object-cover" />
                    </>
                  )}

                  {/* Floating ratio badge */}
                  <span className="absolute top-3 left-3 text-[10px] font-bold text-violet-300 bg-zinc-950 border border-zinc-700 px-2.5 py-1 rounded shadow">
                    Ratio: {tryon.aspectRatio}
                  </span>
                </div>

                {/* Info and Actions */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-350 uppercase tracking-widest block mb-2">AI Output Prompt</span>
                    <p className="text-[11px] text-zinc-200 font-medium italic line-clamp-2 bg-zinc-950/50 rounded p-2.5 border border-zinc-700 mb-4">
                      "{tryon.prompt}"
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-auto">
                    <button
                      onClick={() => { setSelectedTryOn(tryon); }}
                      disabled={tryon.status !== "completed"}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-xs font-bold transition-all cursor-pointer border border-zinc-700 disabled:opacity-40 disabled:hover:bg-zinc-800 disabled:cursor-not-allowed"
                    >
                      <FaEye className="text-[10px]" /> View Outfit
                    </button>
                    <button
                      onClick={() => handleDownload(tryon)}
                      disabled={tryon.status !== "completed"}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-violet-650 hover:bg-violet-600 border border-violet-500 text-white rounded text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:hover:bg-violet-650 disabled:cursor-not-allowed shadow-md"
                    >
                      <FaDownload className="text-[10px]" /> Download
                    </button>
                  </div>
                </div>

                {/* Card footer details */}
                <div className="px-5 py-3 bg-zinc-950 border-t border-zinc-700 flex items-center justify-between text-[11px] text-zinc-300 font-bold">
                  <span>
                    {new Date(tryon.createTime).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </span>

                  <button
                    onClick={() => handleDelete(tryon.id)}
                    disabled={deletingId === tryon.id}
                    className="text-zinc-300 hover:text-red-400 transition-colors flex items-center gap-1 font-bold disabled:opacity-50 cursor-pointer"
                    title="Delete Try-On"
                  >
                    {deletingId === tryon.id ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <FaTrashAlt />
                    )}
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── Detail Modal overlay ────────────────────── */}
        {selectedTryOn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md transition-opacity">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200 flex flex-col overflow-hidden max-h-[90vh]">
              
              {/* Modal header */}
              <div className="flex items-center justify-between border-b border-zinc-700 pb-3 mb-4 flex-shrink-0">
                <div>
                  <h3 className="text-sm sm:text-base font-bold font-heading text-white flex items-center gap-2">
                    <span>Try-On Output Result</span>
                    <span className="text-[10px] font-bold text-violet-400 bg-violet-950 border border-violet-700 px-2 py-0.5 rounded">
                      Ratio: {selectedTryOn.aspectRatio}
                    </span>
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedTryOn(null)}
                  className="text-zinc-300 hover:text-white font-bold text-sm p-1.5 hover:bg-zinc-800 rounded transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Modal Display Area */}
              <div className="flex-1 flex items-center justify-center overflow-hidden min-h-0 relative select-none">
                <div className="relative w-full aspect-[4/5] rounded overflow-hidden border border-zinc-700 bg-zinc-950 shadow-md select-none max-h-[60vh] max-w-sm">
                  {/* Styled result image */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedTryOn.resultImage}
                    alt="After Outfitted"
                    className="w-full h-full object-cover pointer-events-none"
                  />

                  {/* Input references floating card overlay */}
                  <div className="absolute bottom-3 right-3 bg-zinc-900 border border-zinc-700 p-2.5 rounded flex flex-col gap-1.5 z-20 shadow-lg max-w-[100px]">
                    <span className="text-[7px] font-bold text-zinc-300 uppercase tracking-wider">Input Photos</span>
                    <div className="flex gap-1.5">
                      <div className="h-8 w-6 rounded overflow-hidden border border-zinc-700 bg-zinc-950">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={selectedTryOn.personImage} alt="Portrait" className="w-full h-full object-cover" />
                      </div>
                      <div className="h-8 w-6 rounded overflow-hidden border border-zinc-700 bg-zinc-950">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={selectedTryOn.clothesImage} alt="Garment" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  </div>

                  {/* Label badge */}
                  <div className="absolute top-3 left-3 bg-zinc-950/80 backdrop-blur-md border border-zinc-700 text-violet-400 text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded z-20">
                    Try-On Result
                  </div>
                </div>
              </div>

              {/* Modal Actions Footer */}
              <div className="border-t border-zinc-700 pt-4 mt-4 flex justify-between items-center gap-3 flex-shrink-0">
                <button
                  onClick={() => handleDelete(selectedTryOn.id)}
                  className="px-4 py-2 bg-red-955/20 hover:bg-red-900/30 text-red-400 rounded text-xs font-bold transition-all cursor-pointer border border-red-900/30 flex items-center gap-1.5"
                >
                  <FaTrashAlt className="text-[10px]" /> Delete Outfit
                </button>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(selectedTryOn)}
                    className="px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center gap-1.5 hover:scale-[1.02]"
                  >
                    <FaDownload className="text-[10px]" /> Download
                  </button>
                  <button
                    onClick={() => setSelectedTryOn(null)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs font-bold transition-all cursor-pointer"
                  >
                    Close
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
