"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  FaImages,
  FaCrown,
  FaDownload,
  FaSpinner,
  FaExclamationCircle,
  FaTimes,
  FaCheckCircle,
  FaGoogle,
} from "react-icons/fa";

function StatusDot({ status }) {
  if (status === "processing")
    return <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse-dot inline-block" />;
  if (status === "completed")
    return <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />;
  return <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />;
}

export default function GalleryPage() {
  const { data: session, status: authStatus } = useSession();
  const [creations, setCreations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    if (!session?.user) return;
    const fetchAll = async () => {
      try {
        const res = await fetch("/api/creations");
        if (res.ok) setCreations(await res.json());
      } catch {}
      setLoading(false);
    };
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, [session]);

  const handleDownload = (url, name) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name || "royal-portrait"}.jpg`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (authStatus === "unauthenticated") {
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center gap-6">
          <FaImages className="text-5xl text-zinc-700" />
          <div>
            <h1 className="text-2xl font-bold text-zinc-300 mb-2">Your Gallery</h1>
            <p className="text-zinc-500 text-sm mb-6">Sign in to see all your royal portrait creations.</p>
          </div>
          <button
            onClick={() => signIn("google")}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 text-zinc-950 font-bold text-sm"
          >
            <FaGoogle />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  const completed = creations.filter((c) => c.status === "completed");
  const processing = creations.filter((c) => c.status === "processing");
  const failed = creations.filter((c) => c.status === "failed");

  return (
    <div className="flex-1 flex flex-col bg-bg-page overflow-y-auto">
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <FaImages className="text-yellow-500" />
              My Gallery
            </h1>
            <p className="text-zinc-500 text-sm mt-1">{creations.length} portrait{creations.length !== 1 ? "s" : ""} created</p>
          </div>
          {/* Stats */}
          <div className="hidden sm:flex items-center gap-3">
            {processing.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-medium">
                <FaSpinner className="animate-spin text-[10px]" />
                {processing.length} processing
              </div>
            )}
            {completed.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <FaCheckCircle className="text-[10px]" />
                {completed.length} completed
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <FaSpinner className="animate-spin text-yellow-500 text-2xl" />
              <p className="text-zinc-500 text-sm">Loading your portraits…</p>
            </div>
          </div>
        ) : creations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
              <FaCrown className="text-3xl text-zinc-700" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-400 mb-2">No portraits yet</h2>
            <p className="text-zinc-600 text-sm mb-6">Generate your first royal portrait in the Studio.</p>
            <a
              href="/"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 text-zinc-950 text-sm font-bold"
            >
              Go to Studio →
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {creations.map((c) => (
              <div
                key={c.id}
                className="group relative rounded-2xl overflow-hidden border border-zinc-800 hover:border-yellow-500/40 transition-all cursor-pointer bg-zinc-900 aspect-square"
                onClick={() => c.status === "completed" && c.resultImage && setSelectedItem(c)}
              >
                {c.status === "processing" && (
                  <div className="absolute inset-0 shimmer flex flex-col items-center justify-center gap-2">
                    <FaSpinner className="animate-spin text-yellow-500 text-lg" />
                    <span className="text-[10px] text-zinc-400 font-medium text-center px-2">{c.styleName}</span>
                  </div>
                )}
                {c.status === "completed" && c.resultImage && (
                  <>
                    <img src={c.resultImage} alt={c.styleName} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-end p-2">
                      <p className="text-[10px] text-white font-medium leading-tight mb-1">{c.styleName}</p>
                      <button
                        id={`download-${c.id}`}
                        onClick={(e) => { e.stopPropagation(); handleDownload(c.resultImage, c.styleName); }}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-500 text-zinc-950 text-[10px] font-bold w-fit"
                      >
                        <FaDownload className="text-[8px]" /> Save
                      </button>
                    </div>
                  </>
                )}
                {c.status === "failed" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-zinc-950">
                    <FaExclamationCircle className="text-red-500 text-xl" />
                    <span className="text-[10px] text-zinc-600 text-center px-2">{c.styleName}</span>
                  </div>
                )}
                {/* Status dot */}
                <div className="absolute top-2 left-2">
                  <StatusDot status={c.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Lightbox Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="relative max-w-2xl w-full rounded-3xl overflow-hidden border border-zinc-700 shadow-2xl bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-3 right-3 z-10 p-2 rounded-xl bg-black/70 hover:bg-red-600 text-white transition-all"
            >
              <FaTimes className="text-sm" />
            </button>
            <img src={selectedItem.resultImage} alt={selectedItem.styleName} className="w-full object-contain max-h-[70vh]" />
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                  <FaCrown className="text-yellow-500 text-xs" />
                  {selectedItem.styleName}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {new Date(selectedItem.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>
              </div>
              <button
                onClick={() => handleDownload(selectedItem.resultImage, selectedItem.styleName)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 text-zinc-950 text-sm font-bold hover:from-yellow-400 hover:to-yellow-500 transition-all"
              >
                <FaDownload className="text-xs" />
                Download HD
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
