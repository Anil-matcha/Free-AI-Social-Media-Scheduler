"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { IoDownloadOutline, IoTrashOutline, IoSparkles, IoCalendarOutline, IoClose } from "react-icons/io5";

export default function Gallery() {
  const { data: session, status } = useSession();
  const [creations, setCreations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCreation, setActiveCreation] = useState(null);

  const fetchCreations = async () => {
    try {
      const res = await fetch("/api/creations");
      if (res.ok) {
        const data = await res.json();
        setCreations(data);
      }
    } catch (err) {
      console.error("Error fetching creations:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (status === "authenticated") {
      fetchCreations();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status]);

  // Polling fetch if any creations are "processing"
  useEffect(() => {
    if (status !== "authenticated") return;

    const hasProcessing = creations.some((c) => c.status === "processing");
    if (!hasProcessing) return;

    const timer = setInterval(() => {
      fetchCreations();
    }, 4000);

    return () => clearInterval(timer);
  }, [creations, status]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this creation?")) return;

    try {
      const res = await fetch(`/api/creations?id=${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setCreations(creations.filter((c) => c.id !== id));
        if (activeCreation?.id === id) {
          setActiveCreation(null);
        }
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleDownload = async (imageUrl, filename) => {
    if (!imageUrl) return;
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || `enhanced-photo-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      window.open(imageUrl, "_blank");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-transparent">
        <div className="h-10 w-10 rounded-full border-4 border-divider border-t-primary animate-spin"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-6 bg-transparent">
        <div className="max-w-md text-center space-y-6">
          <div className="rounded-2xl bg-bg-card p-4 border border-divider inline-block text-secondary-text">
            <IoSparkles className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold text-primary-text tracking-tight">Creations Gallery</h1>
          <p className="text-secondary-text text-sm leading-relaxed">
            Please sign in to view your collection of enhanced resale product photos.
          </p>
          <button
            onClick={() => signIn("google")}
            className="px-8 py-3.5 bg-primary hover:bg-primary-hover text-primary-btn-text font-bold rounded-full shadow-lg shadow-primary/10 hover:brightness-110 active:scale-98 transition-all duration-200"
          >
            Sign In with Google
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full bg-transparent overflow-y-auto scrollbar-subtle">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-divider pb-6 mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-primary-text tracking-tight">Your Creations</h1>
          <p className="text-xs text-secondary-text mt-1 font-medium">A portfolio of all your AI enhanced product listings.</p>
        </div>
        
        {creations.some((c) => c.status === "processing") && (
          <div className="flex items-center gap-2 rounded-xl bg-bg-card border border-divider px-4 py-2 text-xs font-semibold text-secondary-text">
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></div>
            <span>Syncing active generations...</span>
          </div>
        )}
      </div>

      {creations.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center border border-divider rounded-2xl bg-bg-card/20">
          <div className="rounded-2xl bg-bg-card p-4 border border-divider mb-4 text-secondary-text">
            <IoSparkles className="w-8 h-8" />
          </div>
          <span className="text-sm font-bold text-primary-text">No enhanced photos yet</span>
          <p className="text-xs text-secondary-text mt-2 max-w-[200px] leading-relaxed">
            Head to the workspace editor and start replacing backgrounds and enhancing photos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {creations.map((item) => (
            <div
              key={item.id}
              onClick={() => item.status === "completed" && setActiveCreation(item)}
              className={`relative rounded-xl overflow-hidden bg-bg-card border border-divider cursor-pointer group transition-all duration-200 hover:scale-[1.02] hover:border-primary/50 hover:shadow-xl ${
                item.status === "processing" ? "pointer-events-none" : ""
              }`}
            >
              <div className="aspect-[3/4] w-full relative overflow-hidden bg-black/40">
                {item.status === "processing" ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-black/40">
                    <div className="w-7 h-7 rounded-full border border-primary/20 border-t-primary animate-spin mb-3"></div>
                    <span className="text-[10px] text-secondary-text font-bold uppercase tracking-wider">Processing...</span>
                  </div>
                ) : item.status === "failed" ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-black/40">
                    <span className="text-red-500 font-bold text-xs mb-2">Enhancement Failed</span>
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      className="text-[10px] text-secondary-text hover:text-primary-text font-bold underline"
                    >
                      Delete record
                    </button>
                  </div>
                ) : (
                  <img
                    src={item.outputUrl}
                    alt={item.prompt}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}

                {/* Hover overlay controls */}
                {item.status === "completed" && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3">
                    <div className="flex justify-end">
                      <button
                        onClick={(e) => handleDelete(item.id, e)}
                        className="rounded-lg bg-black/80 hover:bg-red-900/85 text-secondary-text hover:text-white p-1.5 transition-colors border border-divider/50"
                        title="Delete creation"
                      >
                        <IoTrashOutline className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex justify-center mb-4">
                      <span className="text-[10px] font-bold bg-primary text-primary-btn-text px-2.5 py-1.5 rounded-lg shadow-lg">
                        View Photo
                      </span>
                    </div>

                    <div className="text-[9px] text-secondary-text flex items-center gap-1">
                      <IoCalendarOutline />
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Viewer Modal */}
      {activeCreation && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setActiveCreation(null)}
        >
          <div
            className="relative bg-bg-card border border-divider rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setActiveCreation(null)}
              className="absolute top-4 right-4 rounded-xl bg-black border border-divider text-secondary-text hover:text-primary-text p-2 transition-colors z-10"
            >
              <IoClose className="w-5 h-5" />
            </button>

            {/* Display Image */}
            <div className="aspect-[3/4] max-h-[460px] rounded-xl overflow-hidden border border-divider relative bg-black/40">
              <img
                src={activeCreation.outputUrl}
                alt={activeCreation.prompt}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Creation description and actions */}
            <div className="space-y-4 pt-2">
              <div>
                <p className="text-secondary-text text-[10px] font-bold uppercase tracking-wider">Prompt & Details</p>
                <p className="text-xs text-primary-text leading-relaxed mt-1">{activeCreation.prompt}</p>
                <div className="flex gap-4 text-[10px] text-secondary-text mt-2 font-semibold">
                  <span>Template: {activeCreation.templateName || "Custom"}</span>
                  <span>Ratio: {activeCreation.aspectRatio}</span>
                  <span>Created: {new Date(activeCreation.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleDownload(activeCreation.outputUrl, `enhanced-photo-${activeCreation.id}.png`)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary-hover text-primary-btn-text text-xs font-bold rounded-xl hover:brightness-110 transition-all shadow-md"
                >
                  <IoDownloadOutline className="w-4 h-4" />
                  Download HD
                </button>
                <button
                  onClick={(e) => {
                    handleDelete(activeCreation.id, e);
                  }}
                  className="px-4 py-3 bg-black border border-divider text-red-500 hover:bg-red-950/20 text-xs font-bold rounded-xl transition-all"
                >
                  Delete
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </main>
  );
}
