"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  FaImages,
  FaSpinner,
  FaDownload,
  FaTrashAlt,
  FaTimes,
  FaExpand,
  FaHome,
} from "react-icons/fa";

export default function GalleryPage() {
  const { data: session } = useSession();
  const [creations, setCreations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [compareMode, setCompareMode] = useState("result");

  const fetchCreations = async () => {
    try {
      const res = await fetch("/api/creations");
      if (res.ok) {
        const data = await res.json();
        setCreations(
          Array.isArray(data) ? data.filter((c) => c.resultImage) : []
        );
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    if (session?.user) {
      setTimeout(() => {
        fetchCreations();
      }, 0);
      const interval = setInterval(fetchCreations, 4000);
      return () => clearInterval(interval);
    } else {
      setTimeout(() => {
        setLoading(false);
      }, 0);
    }
  }, [session?.user]);

  const handleDownload = (imageUrl, id) => {
    const url = `/api/download?url=${encodeURIComponent(imageUrl)}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `declutter-${id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this decluttered creation?")) return;
    await fetch(`/api/creations?id=${id}`, { method: "DELETE" });
    setCreations((prev) => prev.filter((c) => c.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  if (!session?.user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 p-8">
        <div className="text-center max-w-sm">
          <div className="h-16 w-16 rounded bg-white border border-slate-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <FaImages className="text-2xl text-indigo-500" />
          </div>
          <h2 className="text-base font-bold text-slate-800">
            Sign in to view Gallery
          </h2>
          <p className="text-xs text-slate-500 mt-2">
            Your photorealistic cleaned and decluttered room snapshots will appear here once generated.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            My Room Gallery
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            All your generated clean room layouts — ready to download or delete.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <FaSpinner className="animate-spin text-2xl text-indigo-600" />
          </div>
        ) : creations.length === 0 ? (
          <div className="text-center py-20">
            <div className="h-20 w-20 bg-white border border-slate-200 flex items-center justify-center mx-auto mb-5 rounded shadow-sm">
              <FaHome className="text-3xl text-slate-400 animate-pulse" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No rooms decluttered yet</h3>
            <p className="text-xs text-slate-500 mt-2">
              Head to the Studio and pick an interior style or room preset to render your first clean view.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {creations.map((c) => (
              <div
                key={c.id}
                className="group bg-white border border-slate-200 rounded overflow-hidden hover:border-indigo-500/40 transition-all hover:shadow-lg hover:shadow-indigo-500/5"
              >
                <div
                  className="relative aspect-square bg-slate-100 cursor-pointer overflow-hidden"
                  onClick={() => {
                    setSelected(c);
                    setCompareMode("result");
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.resultImage}
                    alt="Decluttered Room"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <FaExpand className="text-white text-xl drop-shadow-lg" />
                  </div>
                  {/* Original thumbnail overlay */}
                  {c.inputImage && (
                    <div className="absolute bottom-2 left-2 h-10 w-10 border border-slate-300 overflow-hidden shadow-md bg-slate-100 rounded">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={c.inputImage}
                        alt="Original Cluttered"
                        className="w-full h-full object-cover opacity-80"
                      />
                    </div>
                  )}
                  {/* Room Type Tag */}
                  {c.roomType && (
                    <span className="absolute top-2 right-2 text-[8px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50/90 border border-indigo-100 px-2 py-0.5 rounded shadow-sm">
                      {c.roomType}
                    </span>
                  )}
                </div>
                <div className="p-3 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400 font-medium truncate">
                    {new Date(c.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleDownload(c.resultImage, c.id)}
                      className="p-1.5 rounded bg-slate-100 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer text-slate-600"
                      title="Download"
                    >
                      <FaDownload className="text-[10px]" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-1.5 rounded bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 transition-all cursor-pointer"
                      title="Delete"
                    >
                      <FaTrashAlt className="text-[10px]" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-bold text-slate-900">Room Details</h3>
                <div className="flex bg-slate-100 rounded p-0.5 border border-slate-200">
                  {["result", "original"].map((m) => (
                    <button
                      key={m}
                      onClick={() => setCompareMode(m)}
                      className={`text-[10px] font-semibold px-2.5 py-1 rounded transition-all cursor-pointer ${
                        compareMode === m
                          ? "bg-indigo-600 text-white font-black shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {m === "result" ? "After" : "Before"}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Image */}
            <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-50/60 p-4 min-h-[300px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  compareMode === "result"
                    ? selected.resultImage
                    : selected.inputImage
                }
                alt={compareMode === "result" ? "Decluttered Room" : "Original Messy Room"}
                className="max-w-full max-h-[60vh] object-contain rounded shadow-lg"
              />
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-4 border-t border-slate-200 flex items-center gap-3">
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">{selected.roomType}</span>
                <p className="text-[10px] text-slate-500 truncate leading-snug mt-0.5">
                  {selected.prompt}
                </p>
              </div>
              <button
                onClick={() => handleDownload(selected.resultImage, selected.id)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded text-xs font-black cursor-pointer shadow-md shadow-indigo-500/10 transition-all shrink-0 hover:scale-[1.01]"
              >
                <FaDownload />
                Download HD
              </button>
              <button
                onClick={() => handleDelete(selected.id)}
                className="px-3 py-2.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 border border-slate-200 hover:border-red-200 text-slate-500 rounded text-xs font-bold transition-all cursor-pointer shrink-0"
                title="Delete"
              >
                <FaTrashAlt />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
