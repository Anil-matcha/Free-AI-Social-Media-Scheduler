"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { FaDownload, FaSpinner, FaTrash, FaVideo, FaHeart, FaPlay } from "react-icons/fa";

export default function GalleryPage() {
  const { data: session, status } = useSession();
  const [creations, setCreations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [selectedCreation, setSelectedCreation] = useState(null);

  useEffect(() => {
    if (session?.user) {
      fetchCreations();
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [session, status]);

  const fetchCreations = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/creations");
      if (res.ok) {
        const data = await res.json();
        // Filter only completed generations
        setCreations(data.filter(c => c.status === "completed"));
      }
    } catch (err) {
      console.error("Error fetching creations:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (url, id) => {
    if (downloading) return;
    setDownloading(id);
    try {
      const filename = `kissing-video-${id}.mp4`;
      // Open in a new tab for direct browser saving/playing
      window.open(url, "_blank");
    } catch (err) {
      console.error("Error downloading file:", err);
    } finally {
      setDownloading(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center bg-zinc-950 text-zinc-100">
        <FaSpinner className="animate-spin text-2xl text-rose-500 mb-3" />
        <p className="text-sm text-zinc-400 font-medium animate-pulse">Loading gallery...</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 px-6 text-center">
        <div className="h-12 w-12 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center text-rose-500 mb-4 shadow-lg shadow-rose-500/10">
          <FaVideo className="text-md" />
        </div>
        <h2 className="text-lg font-bold text-white">Access Denied</h2>
        <p className="text-xs text-zinc-500 max-w-sm mt-2 leading-relaxed">
          Please sign in to view your personal AI Kissing Video creations gallery.
        </p>
        <button
          onClick={() => signIn("google")}
          className="mt-6 px-6 py-2.5 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-xs rounded-lg transition-all cursor-pointer shadow-lg shadow-rose-500/20"
        >
          Sign In
        </button>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto bg-zinc-950 px-6 py-12 text-zinc-100">
      <div className="mx-auto max-w-7xl">
        <div className="border-b border-zinc-800 pb-5 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl bg-gradient-to-r from-pink-300 via-rose-400 to-rose-600 bg-clip-text text-transparent">
              Creations Gallery
            </h1>
            <p className="mt-1.5 text-xs text-zinc-500">
              View and replay all your previously generated romantic kissing videos.
            </p>
          </div>
          <button
            onClick={fetchCreations}
            className="px-4 py-2 border border-zinc-800 hover:bg-zinc-900 text-xs font-semibold rounded-lg text-zinc-300 transition-all cursor-pointer self-start"
          >
            Refresh Feed
          </button>
        </div>

        {creations.length === 0 ? (
          <div className="border border-dashed border-zinc-850 rounded-2xl bg-zinc-900/10 p-12 text-center max-w-md mx-auto my-12">
            <div className="h-10 w-10 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center text-zinc-500 mb-3 mx-auto">
              <FaVideo className="text-xs" />
            </div>
            <p className="text-xs font-semibold text-zinc-300">No creations found</p>
            <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
              You haven't generated any completed kissing videos yet. Head over to the Generator workspace to create your first masterpiece!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {creations.map((item) => (
              <div
                key={item.id}
                className="bg-zinc-900/40 backdrop-blur-md border border-zinc-850 rounded-2xl overflow-hidden flex flex-col group transition-all hover:border-rose-500/20 hover:shadow-2xl hover:shadow-rose-950/5 relative"
              >
                {/* Video hover preview */}
                <div 
                  onClick={() => setSelectedCreation(item)}
                  className="aspect-video bg-zinc-950 relative overflow-hidden cursor-pointer"
                >
                  <video
                    src={item.resultVideo}
                    muted
                    playsInline
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-[11px] font-bold text-white uppercase tracking-wider bg-gradient-to-r from-pink-500 to-rose-600 px-3.5 py-2 rounded-lg shadow-lg flex items-center gap-1.5">
                      <FaPlay className="text-[9px]" /> Play Video
                    </span>
                  </div>
                </div>

                {/* Info block */}
                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{item.prompt}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] text-zinc-500 font-bold uppercase">{item.modelId || "Veo 3.1"}</span>
                      <span className="text-[9px] text-zinc-500">•</span>
                      <span className="text-[9px] text-zinc-500 font-medium">
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownload(item.resultVideo, item.id)}
                    disabled={downloading === item.id}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 text-white rounded-lg font-bold text-[11px] transition-all cursor-pointer"
                  >
                    {downloading === item.id ? (
                      <FaSpinner className="animate-spin text-[10px]" />
                    ) : (
                      <FaDownload className="text-[10px]" />
                    )}
                    {downloading === item.id ? "Downloading..." : "Download Video"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Dialog for View Details */}
      {selectedCreation && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl rose-glow">
            
            {/* Modal header */}
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                <FaHeart className="text-[10px]" /> Kissing Masterpiece Details
              </span>
              <button
                onClick={() => setSelectedCreation(null)}
                className="text-zinc-500 hover:text-zinc-300 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal content */}
            <div className="overflow-y-auto p-5 flex flex-col md:flex-row gap-5">
              {/* Output Video */}
              <div className="w-full md:w-1/2 aspect-video md:aspect-square bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden flex items-center justify-center">
                <video
                  src={selectedCreation.resultVideo}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Text metadata */}
              <div className="w-full md:w-1/2 flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Generated Prompt</span>
                    <p className="text-xs text-zinc-200 leading-relaxed bg-zinc-950 p-3 rounded-xl border border-zinc-850">{selectedCreation.prompt}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">AI Model</span>
                      <span className="text-xs text-zinc-200 font-semibold uppercase">{selectedCreation.modelId || "Veo 3.1"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Created On</span>
                      <span className="text-xs text-zinc-200 font-medium">
                        {new Date(selectedCreation.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Original Inputs</span>
                    <div className="flex gap-2">
                      <div className="relative">
                        <img
                          src={selectedCreation.maleImage}
                          alt="male input"
                          className="w-12 h-12 rounded-lg border border-zinc-800 object-cover"
                        />
                        <span className="absolute bottom-0 inset-x-0 text-[7px] text-center bg-black/60 font-bold text-zinc-400 rounded-b-lg">Male</span>
                      </div>
                      <div className="relative">
                        <img
                          src={selectedCreation.femaleImage}
                          alt="female input"
                          className="w-12 h-12 rounded-lg border border-zinc-800 object-cover"
                        />
                        <span className="absolute bottom-0 inset-x-0 text-[7px] text-center bg-black/60 font-bold text-zinc-400 rounded-b-lg">Female</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-5 border-t border-zinc-800 mt-5 flex gap-2.5">
                  <button
                    onClick={() => handleDownload(selectedCreation.resultVideo, selectedCreation.id)}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white rounded-lg font-bold text-xs transition-all cursor-pointer shadow-lg"
                  >
                    Download HD Video
                  </button>
                  <button
                    onClick={() => setSelectedCreation(null)}
                    className="px-4 py-2 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </main>
  );
}
