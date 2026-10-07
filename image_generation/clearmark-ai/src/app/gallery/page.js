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
  FaEraser,
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
          Array.isArray(data) ? data.filter((c) => c.resultImage) : [],
        );
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    if (session?.user) {
      fetchCreations();
      const interval = setInterval(fetchCreations, 4000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [session?.user]);

  const handleDownload = (imageUrl, id) => {
    const url = `/api/download?url=${encodeURIComponent(imageUrl)}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `clearmark-${id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this result?")) return;
    await fetch(`/api/creations?id=${id}`, { method: "DELETE" });
    setCreations((prev) => prev.filter((c) => c.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  if (!session?.user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-page p-8">
        <div className="text-center max-w-sm">
          <div className="h-16 w-16 rounded bg-bg-card border border-divider/50 flex items-center justify-center mx-auto mb-4">
            <FaImages className="text-2xl text-secondary-text" />
          </div>
          <h2 className="text-base font-bold text-primary-text">
            Sign in to view Gallery
          </h2>
          <p className="text-xs text-secondary-text mt-2">
            Your watermark-removed images will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-bg-page py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-primary-text tracking-tight">
            My Gallery
          </h1>
          <p className="text-xs text-secondary-text mt-1">
            All your watermark-removed images — ready to download or delete.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <FaSpinner className="animate-spin text-2xl text-primary" />
          </div>
        ) : creations.length === 0 ? (
          <div className="text-center py-20">
            <div className="h-20 w-20 rounded bg-bg-card border border-divider/50 flex items-center justify-center mx-auto mb-5">
              <FaEraser className="text-3xl text-secondary-text" />
            </div>
            <h3 className="text-sm font-bold text-primary-text">
              No results yet
            </h3>
            <p className="text-xs text-secondary-text mt-2">
              Head to the Studio to remove your first watermark.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {creations.map((c) => (
              <div
                key={c.id}
                className="group bg-bg-card border border-divider/50 rounded overflow-hidden hover:border-primary/45 transition-all hover:shadow-xl hover:shadow-primary/5"
              >
                <div
                  className="relative aspect-square bg-bg-page cursor-pointer overflow-hidden"
                  onClick={() => {
                    setSelected(c);
                    setCompareMode("result");
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.resultImage}
                    alt="Result"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <FaExpand className="text-white text-xl drop-shadow-lg" />
                  </div>
                  {/* Original thumbnail overlay */}
                  {c.inputImage && (
                    <div className="absolute bottom-2 left-2 h-10 w-10 rounded border border-divider/50 overflow-hidden shadow-lg bg-bg-page">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={c.inputImage}
                        alt="Original"
                        className="w-full h-full object-cover opacity-70"
                      />
                    </div>
                  )}
                </div>
                <div className="p-3 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-secondary-text font-medium truncate">
                    {new Date(c.createTime).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleDownload(c.resultImage, c.id)}
                      className="p-1.5 rounded bg-bg-card-hover hover:bg-primary text-secondary-text hover:text-white transition-all cursor-pointer"
                      title="Download"
                    >
                      <FaDownload className="text-[10px]" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-1.5 rounded bg-bg-card-hover hover:bg-red-900/50 hover:text-red-400 text-secondary-text transition-all cursor-pointer"
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
          className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-bg-card border border-divider/50 rounded max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-divider/50">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-bold text-primary-text">
                  Result Details
                </h3>
                <div className="flex bg-bg-page rounded p-0.5 border border-divider/50">
                  {["result", "original"].map((m) => (
                    <button
                      key={m}
                      onClick={() => setCompareMode(m)}
                      className={`text-[10px] font-semibold px-2.5 py-1 rounded transition-all cursor-pointer ${
                        compareMode === m
                          ? "bg-primary text-white"
                          : "text-secondary-text hover:text-primary-text"
                      }`}
                    >
                      {m === "result" ? "After" : "Before"}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-2 rounded bg-bg-card-hover hover:bg-bg-elevated text-secondary-text hover:text-primary-text transition-all cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Image */}
            <div className="flex-1 overflow-auto flex items-center justify-center bg-bg-page p-4 min-h-[300px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  compareMode === "result"
                    ? selected.resultImage
                    : selected.inputImage
                }
                alt={compareMode === "result" ? "Result" : "Original"}
                className="max-w-full max-h-[60vh] object-contain rounded shadow-xl"
              />
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-4 border-t border-divider/50 flex items-center gap-3">
              <p className="text-[10px] text-secondary-text flex-1 truncate">
                {selected.prompt?.slice(0, 80)}…
              </p>
              <button
                onClick={() =>
                  handleDownload(selected.resultImage, selected.id)
                }
                className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded text-xs font-bold cursor-pointer shadow-lg shadow-primary/20 transition-all"
              >
                <FaDownload />
                Download HD
              </button>
              <button
                onClick={() => handleDelete(selected.id)}
                className="px-3 py-2.5 bg-bg-card-hover hover:bg-red-900/30 hover:text-red-400 border border-divider/50 hover:border-red-500/30 text-secondary-text rounded text-xs font-bold transition-all cursor-pointer"
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
