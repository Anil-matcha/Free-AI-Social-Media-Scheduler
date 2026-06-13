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
    a.download = `tattoo-${creation.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this tattoo try-on? This action cannot be undone.")) return;
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
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 text-zinc-300">
        <FaSpinner className="animate-spin text-3xl text-violet-400 mb-4" />
        <p className="text-sm font-medium">Loading showroom gallery...</p>
      </div>
    );
  }

  // Logged out state
  if (!session?.user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-955 px-4 py-12">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center shadow-xl">
          <div className="h-14 w-14 rounded-2xl bg-violet-600/10 border border-violet-500/30 text-violet-400 flex items-center justify-center mx-auto mb-6 shadow-inner animate-pulse">
            <FaImages className="text-2xl" />
          </div>
          <h1 className="text-2xl font-bold font-heading text-white tracking-tight mb-2">Showroom Gallery</h1>
          <p className="text-sm text-zinc-400 leading-relaxed mb-8">
            Please sign in to access your HD gallery, view detail comparisons, and download completed tattoo mockups.
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
            <h1 className="text-2xl font-black font-heading text-white tracking-tight">Showroom Gallery</h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 font-medium font-sans">Browse your completed high-resolution AI tattoo try-ons</p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-4.5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs font-extrabold rounded-lg shadow-lg shadow-violet-500/5 transition-all w-fit cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <FaPlus className="text-[10px]" /> Tattoo Studio
          </Link>
        </div>

        {/* Empty State */}
        {creations.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center shadow-lg max-w-xl mx-auto my-12">
            <div className="h-16 w-16 bg-zinc-950 text-zinc-400 border border-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <FaImages className="text-3xl text-zinc-300" />
            </div>
            <h2 className="text-lg font-bold text-zinc-200 mb-2">No completed try-ons yet</h2>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-sm mx-auto mb-8 font-medium">
              You don't have any successfully finished tattoo mockups in your showroom yet. Design one in the studio!
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-sm font-extrabold rounded-lg shadow-lg shadow-violet-500/10 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <FaPlus className="text-xs" /> Design New Tattoo
            </Link>
          </div>
        ) : (
          /* Gallery Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {creations.map((creation) => (
              <div
                key={creation.id}
                onClick={() => setSelectedCreation(creation)}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl hover:border-zinc-700 transition-all flex flex-col h-full group cursor-pointer"
              >
                
                {/* Image Showcase */}
                <div className="relative aspect-[4/5] bg-zinc-950 overflow-hidden flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={creation.resultImage}
                    alt="Simulated Tattoo"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Hover Eye indicator */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <div className="h-10 w-10 bg-zinc-900 border border-zinc-700 rounded-full flex items-center justify-center text-white shadow-lg">
                      <FaEye />
                    </div>
                  </div>

                  {/* Floating parameters badge */}
                  <span className="absolute top-3 left-3 text-[8px] font-bold text-violet-300 bg-zinc-950 border border-zinc-800 px-2 py-0.5 rounded-lg shadow uppercase">
                    AI TRY-ON
                  </span>
                </div>

                {/* Card footer details */}
                <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-400 font-bold">
                  <span>
                    {new Date(creation.createTime).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(creation);
                      }}
                      className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1 font-bold cursor-pointer"
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
                      className="text-zinc-400 hover:text-red-400 transition-colors flex items-center gap-1 font-bold disabled:opacity-50 cursor-pointer"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md transition-opacity" onClick={() => setSelectedCreation(null)}>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200 flex flex-col overflow-hidden max-h-[95vh]" onClick={(e) => e.stopPropagation()}>
              
              {/* Modal header */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4 flex-shrink-0">
                <div>
                  <h3 className="text-sm sm:text-base font-bold font-heading text-white flex items-center gap-2">
                    <span>Tattoo Try-On Details</span>
                    <span className="text-[9px] font-bold text-violet-400 bg-violet-955 border border-violet-850 px-2 py-0.5 rounded-lg uppercase">
                      24 Credits Used
                    </span>
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedCreation(null)}
                  className="text-zinc-400 hover:text-white font-bold text-sm p-1.5 hover:bg-zinc-800 rounded-lg transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Modal Display Area */}
              <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-y-auto min-h-0 items-center justify-center">
                
                {/* Result image */}
                <div className="relative w-full max-w-[340px] aspect-[4/5] rounded-xl overflow-hidden border border-zinc-800 bg-zinc-955 shadow-md flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedCreation.resultImage}
                    alt="Tattoo Try-On Result"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-zinc-950/90 backdrop-blur border border-zinc-800 text-violet-400 text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg">
                    Applied Placement
                  </div>
                </div>

                {/* Input references */}
                <div className="flex flex-col gap-4 flex-1 w-full max-w-[320px]">
                  <div className="bg-zinc-950/60 p-4 border border-zinc-800 rounded-xl space-y-3">
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider block">Input Assets</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[8px] text-zinc-500 font-bold block mb-1">Body/Person</span>
                        <div className="aspect-[1/1] rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={selectedCreation.personImage} alt="Person" className="w-full h-full object-cover" />
                        </div>
                      </div>
                      <div>
                        <span className="text-[8px] text-zinc-500 font-bold block mb-1">Tattoo Design</span>
                        <div className="aspect-[1/1] rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={selectedCreation.tattooImage} alt="Tattoo design" className="w-full h-full object-cover animate-pulse" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-950/40 p-4 border border-zinc-800 rounded-xl">
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider block mb-1.5">Prompt Applied</span>
                    <p className="text-[11px] text-zinc-300 leading-relaxed font-medium bg-zinc-900/60 p-2.5 rounded border border-zinc-850 max-h-[120px] overflow-y-auto">
                      {selectedCreation.prompt}
                    </p>
                  </div>
                </div>

              </div>

              {/* Modal Actions Footer */}
              <div className="border-t border-zinc-800 pt-4 mt-4 flex justify-between items-center gap-3 flex-shrink-0">
                <button
                  onClick={() => handleDelete(selectedCreation.id)}
                  disabled={deletingId === selectedCreation.id}
                  className="px-4 py-2 bg-red-955/20 hover:bg-red-900/30 text-red-400 border border-red-900/30 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <FaTrashAlt className="text-[10px]" /> Delete Try-On
                </button>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(selectedCreation)}
                    className="px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-lg text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center gap-1.5 hover:scale-[1.02]"
                  >
                    <FaDownload className="text-[10px]" /> Download HD
                  </button>
                  <button
                    onClick={() => setSelectedCreation(null)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
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
