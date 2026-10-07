"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import {
  FaDownload, FaSpinner, FaGoogle, FaImages, FaEye, FaPlus, FaTrashAlt
} from "react-icons/fa";

export default function GalleryPage() {
  const { data: session, status } = useSession();
  const [creations, setCreations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal details view state
  const [selectedCreation, setSelectedCreation] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (session?.user) {
      fetchCompletedCreations();
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [session, status]);

  const fetchCompletedCreations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/creations");
      if (res.ok) {
        const data = await res.json();
        // Only display successfully completed entries
        const completed = data.filter(c => c.status === "completed");
        setCreations(completed);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (creation) => {
    if (!creation.resultImage) return;
    const downloadUrl = `/api/download?url=${encodeURIComponent(creation.resultImage)}`;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `makeup-${creation.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this makeup generation? This action cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/creations?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setCreations(p => p.filter(t => t.id !== id));
        if (selectedCreation?.id === id) setSelectedCreation(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  if (status === "loading" || (loading && creations.length === 0)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white text-zinc-650">
        <FaSpinner className="animate-spin text-3xl text-emerald-600 mb-4" />
        <p className="text-sm font-medium">Loading makeup gallery showrooms...</p>
      </div>
    );
  }

  // Logged out state
  if (!session?.user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-50 px-4 py-12">
        <div className="max-w-md w-full bg-white border border-zinc-200 rounded-2xl p-8 text-center shadow-xl">
          <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-inner animate-pulse">
            <FaImages className="text-2xl" />
          </div>
          <h1 className="text-2xl font-bold font-heading text-zinc-900 tracking-tight mb-2">Showroom Gallery</h1>
          <p className="text-sm text-zinc-550 leading-relaxed mb-8">
            Please sign in to access your HD gallery, view detail comparisons, and download completed makeup mockups.
          </p>
          <button
            onClick={() => signIn("google")}
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/15 active:scale-[0.98] transition-all cursor-pointer"
          >
            <FaGoogle className="text-xs" />
            <span>Sign in with Google</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-50 text-zinc-800 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black font-heading text-zinc-900 tracking-tight">Showroom Gallery</h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1.5 font-medium font-sans">Browse your completed high-resolution AI makeup simulations</p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-4.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold rounded-lg shadow-lg shadow-emerald-500/5 transition-all w-fit cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <FaPlus className="text-[10px]" /> Makeup Studio
          </Link>
        </div>

        {/* Empty State */}
        {creations.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center shadow-lg max-w-xl mx-auto my-12">
            <div className="h-16 w-16 bg-zinc-50 text-zinc-500 border border-zinc-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <FaImages className="text-3xl text-zinc-400" />
            </div>
            <h2 className="text-lg font-bold text-zinc-800 mb-2">No completed simulations yet</h2>
            <p className="text-sm text-zinc-500 leading-relaxed max-w-sm mx-auto mb-8 font-medium">
              You don't have any successfully finished makeup generations in your showroom yet. Simulate one in the studio!
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-extrabold rounded-lg shadow-lg shadow-emerald-500/10 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <FaPlus className="text-xs" /> Simulate New Makeup
            </Link>
          </div>
        ) : (
          /* Gallery Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {creations.map((creation) => (
              <div
                key={creation.id}
                onClick={() => setSelectedCreation(creation)}
                className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-md hover:shadow-lg hover:border-zinc-350 transition-all flex flex-col h-full group cursor-pointer"
              >
                
                {/* Image Showcase */}
                <div className="relative aspect-[4/5] bg-zinc-100 overflow-hidden flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={creation.resultImage}
                    alt="Simulated Makeup"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Hover Eye indicator */}
                  <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <div className="h-10 w-10 bg-white border border-zinc-250 rounded-full flex items-center justify-center text-zinc-800 shadow-md">
                      <FaEye />
                    </div>
                  </div>

                  {/* Floating parameters badge */}
                  <span className="absolute top-3 left-3 text-[8px] font-bold text-emerald-600 bg-white border border-zinc-200 px-2 py-0.5 rounded-lg shadow uppercase">
                    AI MAKEUP
                  </span>
                </div>

                {/* Card footer details */}
                <div className="p-4 bg-white border-t border-zinc-200 flex items-center justify-between text-[10px] text-zinc-500 font-bold">
                  <span>
                    {new Date(creation.createTime).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(creation);
                      }}
                      className="text-zinc-500 hover:text-zinc-800 transition-colors flex items-center gap-1 font-bold cursor-pointer"
                      title="Download HD"
                    >
                      <FaDownload />
                      <span>HD</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(creation.id);
                      }}
                      disabled={deletingId === creation.id}
                      className="text-zinc-500 hover:text-red-650 transition-colors flex items-center gap-1 font-bold disabled:opacity-50 cursor-pointer"
                      title="Delete Simulation"
                    >
                      {deletingId === creation.id ? (
                        <FaSpinner className="animate-spin text-[9px]" />
                      ) : (
                        <FaTrashAlt />
                      )}
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* ─── Detail Modal overlay ────────────────────── */}
        {selectedCreation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedCreation(null)}>
            <div className="bg-white border border-zinc-200 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200 flex flex-col overflow-hidden max-h-[95vh]" onClick={(e) => e.stopPropagation()}>
              
              {/* Modal header */}
              <div className="flex items-center justify-between border-b border-zinc-200 pb-3 mb-4 flex-shrink-0">
                <div>
                  <h3 className="text-sm sm:text-base font-bold font-heading text-zinc-900 flex items-center gap-2">
                    <span>Makeup Try-On Details</span>
                    <span className="text-[9px] font-bold text-emerald-650 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg uppercase">
                      12 Credits Used
                    </span>
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedCreation(null)}
                  className="text-zinc-400 hover:text-zinc-900 font-bold text-sm p-1.5 hover:bg-zinc-100 rounded-lg transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Modal Display Area */}
              <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-y-auto min-h-0 items-center justify-center">
                
                {/* Result image */}
                <div className="relative w-full max-w-[340px] aspect-[4/5] rounded-xl overflow-hidden border border-zinc-200 bg-zinc-100 shadow-md flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedCreation.resultImage}
                    alt="Makeup Result"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm border border-zinc-200 text-emerald-600 text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg">
                    Applied Makeup Overlay
                  </div>
                </div>

                {/* Input references */}
                <div className="flex flex-col gap-4 flex-1 w-full max-w-[320px]">
                  <div className="bg-zinc-50 p-4 border border-zinc-200 rounded-xl space-y-3">
                    <span className="text-[9px] font-black text-zinc-550 uppercase tracking-wider block">Input Assets</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[8px] text-zinc-450 font-bold block mb-1">Portrait selfie</span>
                        <div className="aspect-[1/1] rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={selectedCreation.portraitImage} alt="Portrait" className="w-full h-full object-cover" />
                        </div>
                      </div>
                      <div>
                        <span className="text-[8px] text-zinc-450 font-bold block mb-1">Makeup Reference</span>
                        <div className="aspect-[1/1] rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={selectedCreation.referenceImage} alt="Reference Makeup" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-50/50 p-4 border border-zinc-200 rounded-xl">
                    <span className="text-[9px] font-black text-zinc-550 uppercase tracking-wider block mb-1.5">Prompt Applied</span>
                    <p className="text-[11px] text-zinc-650 leading-relaxed font-medium bg-white p-2.5 rounded border border-zinc-200 max-h-[120px] overflow-y-auto">
                      {selectedCreation.prompt}
                    </p>
                  </div>
                </div>

              </div>

              {/* Modal Actions Footer */}
              <div className="border-t border-zinc-200 pt-4 mt-4 flex justify-between items-center gap-3 flex-shrink-0">
                <button
                  onClick={() => handleDelete(selectedCreation.id)}
                  disabled={deletingId === selectedCreation.id}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <FaTrashAlt className="text-[10px]" /> Delete Try-On
                </button>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(selectedCreation)}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center gap-1.5 hover:scale-[1.02]"
                  >
                    <FaDownload className="text-[10px]" /> Download HD
                  </button>
                  <button
                    onClick={() => setSelectedCreation(null)}
                    className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
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
