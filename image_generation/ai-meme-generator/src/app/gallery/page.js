"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { FaPlay, FaImage, FaTrash, FaTimes, FaCopy, FaExternalLinkAlt, FaDownload } from "react-icons/fa";

export default function GalleryPage() {
  const { data: session } = useSession();
  const [creations, setCreations] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [copied, setCopied] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    if (!session) return;

    const fetchCreations = async () => {
      try {
        const res = await fetch("/api/creations");
        const data = await res.json();
        setCreations(data);
      } catch (error) {
        console.error("Failed to fetch creations", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCreations();
  }, [session]);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this creation?")) return;
    try {
      await fetch(`/api/creations/${id}`, { method: "DELETE" });
      setCreations((prev) => prev.filter((item) => item.id !== id));
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
    } catch (error) {
      console.error("Failed to delete creation", error);
    }
  };

  const handleCopyPrompt = (promptText) => {
    navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async (item) => {
    const url = item.url || item.imageUrl;
    if (!url) return;

    setDownloadingId(item.id);
    try {
      const downloadUrl = `/api/download?url=${encodeURIComponent(url)}`;
      const res = await fetch(downloadUrl);
      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const extension = url.split("?")[0].split(".").pop() || (item.type === "video" ? "mp4" : "png");
      a.download = `creation-${item.id}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error(err);
      window.open(url, "_blank");
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredCreations = creations.filter((item) => {
    if (filter === "all") return true;
    return item.type === filter;
  });

  if (!session) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-black min-h-screen">
        <h2 className="text-xl font-bold mb-2">Please Sign In</h2>
        <p className="text-zinc-500 dark:text-zinc-400">You must be logged in to view your gallery.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 bg-zinc-50 dark:bg-black min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-black dark:text-white">Meme Gallery</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Your AI generated meme images and videos</p>
          </div>
          <div className="flex gap-2">
            {["all", "video", "image"].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 text-sm font-medium rounded-lg capitalize border transition-all ${filter === type
                  ? "bg-orange-500 border-orange-500 text-white"
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-orange-500"
                  }`}
              >
                {type}s
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-square rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            ))}
          </div>
        ) : filteredCreations.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
            <h3 className="text-lg font-medium mb-1">No Creations Found</h3>
            <p className="text-zinc-500 dark:text-zinc-400">Start generating memes to fill your gallery!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredCreations.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="group relative rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 duration-200 flex flex-col cursor-pointer"
              >
                <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                  {item.type === "video" ? (
                    <div className="relative w-full h-full">
                      <video
                        src={item.url || item.imageUrl}
                        className="w-full h-full object-cover pointer-events-none"
                        preload="metadata"
                      />
                      <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                        <FaPlay className="text-white text-2xl drop-shadow-md" />
                      </div>
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.url || item.imageUrl}
                      alt={item.prompt || "Generated Meme"}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 text-white">
                    {item.type === "video" ? <FaPlay className="text-[10px]" /> : <FaImage className="text-[10px]" />}
                    {item.type.toUpperCase()}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                    className="absolute top-3 right-3 bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 line-clamp-2 mb-2">
                    {item.prompt || "No prompt provided"}
                  </p>
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    {item.aspectRatio && (
                      <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-600 dark:text-zinc-400">
                        {item.aspectRatio}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal / Popup */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="relative w-full max-w-5xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col md:flex-row max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 z-10 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-orange-500 hover:border-orange-500/30 p-2.5 rounded-full transition-all"
            >
              <FaTimes className="text-sm" />
            </button>

            {/* Media Area (Left/Top) */}
            <div className="flex-1 bg-black flex items-center justify-center p-6 min-h-[300px] md:min-h-[500px]">
              {selectedItem.type === "video" ? (
                <video
                  src={selectedItem.url || selectedItem.imageUrl}
                  className="max-w-full max-h-[40vh] md:max-h-[70vh] rounded-lg object-contain"
                  controls
                  autoPlay
                  loop
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedItem.url || selectedItem.imageUrl}
                  alt={selectedItem.prompt}
                  className="max-w-full max-h-[40vh] md:max-h-[70vh] rounded-lg object-contain"
                />
              )}
            </div>

            {/* Info Area (Right/Bottom) */}
            <div className="w-full md:w-96 p-6 flex flex-col justify-between border-t md:border-t-0 md:border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
              <div className="flex flex-col gap-6 overflow-y-auto max-h-[35vh] md:max-h-full">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-500 border border-orange-500/20 capitalize">
                    {selectedItem.type === "video" ? <FaPlay className="text-[10px]" /> : <FaImage className="text-[10px]" />}
                    {selectedItem.type} Meme
                  </span>
                  <span className="text-xs text-zinc-400 block mt-2">
                    Generated on {new Date(selectedItem.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Prompt</label>
                  <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 text-sm text-zinc-800 dark:text-zinc-200 shadow-inner max-h-40 overflow-y-auto leading-relaxed">
                    {selectedItem.prompt}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Metadata</label>
                  <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 flex flex-col gap-2.5 text-xs">
                    <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-900 pb-2">
                      <span className="text-zinc-500">ID</span>
                      <span className="font-mono text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded">
                        #{selectedItem.id.slice(0, 8)}
                      </span>
                    </div>
                    {selectedItem.aspectRatio && (
                      <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-900 pb-2">
                        <span className="text-zinc-500">Aspect Ratio</span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">{selectedItem.aspectRatio}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500">Status</span>
                      <span className="flex items-center gap-1 font-semibold text-green-500">
                        ✅ Completed
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 mt-6">
                <button
                  onClick={() => handleCopyPrompt(selectedItem.prompt)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold rounded-lg transition-all text-sm active:scale-[0.98]"
                >
                  <FaCopy />
                  {copied ? "Copied Prompt!" : "Copy Prompt"}
                </button>

                <a
                  href={selectedItem.url || selectedItem.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold rounded-lg transition-all text-sm active:scale-[0.98]"
                >
                  <FaExternalLinkAlt />
                  Open in New Tab
                </a>

                <button
                  onClick={() => handleDownload(selectedItem)}
                  disabled={downloadingId === selectedItem.id}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-lg shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all text-sm active:scale-[0.98] disabled:from-zinc-400 disabled:to-zinc-500"
                >
                  <FaDownload className={downloadingId === selectedItem.id ? "animate-bounce" : ""} />
                  {downloadingId === selectedItem.id ? "Downloading..." : "Download"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
