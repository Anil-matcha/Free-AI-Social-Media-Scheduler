"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { FaDownload, FaSpinner, FaTrash, FaImage } from "react-icons/fa";

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
      const filename = `amazon-listing-${id}.jpg`;
      const downloadUrl = `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error("Failed to download image");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Error downloading file:", err);
      alert("Failed to download directly. Opening in a new tab instead.");
      window.open(url, "_blank");
    } finally {
      setDownloading(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center bg-zinc-950 text-zinc-100">
        <FaSpinner className="animate-spin text-2xl text-violet-500 mb-3" />
        <p className="text-sm text-zinc-400 font-medium">Loading gallery...</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 px-6 text-center">
        <div className="h-12 w-12 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center text-zinc-500 mb-4 shadow-inner">
          <FaImage className="text-md" />
        </div>
        <h2 className="text-lg font-bold text-white">Access Denied</h2>
        <p className="text-xs text-zinc-500 max-w-sm mt-2 leading-relaxed">
          Please sign in to view your personal Amazon listing creations gallery.
        </p>
        <button
          onClick={() => signIn("google")}
          className="mt-6 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded transition-all cursor-pointer"
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
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Creations Gallery
            </h1>
            <p className="mt-1.5 text-xs text-zinc-500">
              View and download all your previously generated Amazon product ad listings.
            </p>
          </div>
          <button
            onClick={fetchCreations}
            className="px-4 py-2 border border-zinc-800 hover:bg-zinc-900 text-xs font-semibold rounded text-zinc-300 transition-all cursor-pointer self-start"
          >
            Refresh
          </button>
        </div>

        {creations.length === 0 ? (
          <div className="border border-dashed border-zinc-800 rounded-lg bg-zinc-900/10 p-12 text-center max-w-md mx-auto my-12">
            <div className="h-10 w-10 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center text-zinc-500 mb-3 mx-auto">
              <FaImage className="text-xs" />
            </div>
            <p className="text-xs font-semibold text-zinc-300">No creations found</p>
            <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
              You haven't generated any completed product ad listings yet. Head over to the Product Studio to start creating.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {creations.map((item) => (
              <div
                key={item.id}
                className="bg-zinc-900 border border-zinc-800 rounded overflow-hidden flex flex-col group transition-all hover:border-zinc-700 relative"
              >
                {/* Image display */}
                <div 
                  onClick={() => setSelectedCreation(item)}
                  className="aspect-square bg-zinc-950 relative overflow-hidden cursor-pointer"
                >
                  <img
                    src={item.outputUrl}
                    alt={item.prompt}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-[11px] font-bold text-white uppercase tracking-wider bg-violet-600 px-3 py-1.5 rounded-sm shadow-md">
                      View details
                    </span>
                  </div>
                </div>

                {/* Info block */}
                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{item.prompt}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] text-zinc-500 font-bold uppercase">Aspect: {item.aspectRatio || "1:1"}</span>
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
                    onClick={() => handleDownload(item.outputUrl, item.id)}
                    disabled={downloading === item.id}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-800 text-white rounded font-bold text-[11px] transition-all cursor-pointer"
                  >
                    {downloading === item.id ? (
                      <FaSpinner className="animate-spin text-[10px]" />
                    ) : (
                      <FaDownload className="text-[10px]" />
                    )}
                    {downloading === item.id ? "Downloading..." : "Download image"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Dialog for View Details */}
      {selectedCreation && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            
            {/* Modal header */}
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-widest">Creation Details</span>
              <button
                onClick={() => setSelectedCreation(null)}
                className="text-zinc-500 hover:text-zinc-300 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal content */}
            <div className="overflow-y-auto p-5 flex flex-col md:flex-row gap-5">
              {/* Output Image */}
              <div className="w-full md:w-1/2 aspect-square bg-zinc-950 border border-zinc-800 rounded overflow-hidden">
                <img
                  src={selectedCreation.outputUrl}
                  alt="detail"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Text metadata */}
              <div className="w-full md:w-1/2 flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Generated Prompt</span>
                    <p className="text-xs text-zinc-200 leading-relaxed bg-zinc-950 p-3 rounded border border-zinc-800">{selectedCreation.prompt}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Aspect Ratio</span>
                      <span className="text-xs text-zinc-200 font-semibold">{selectedCreation.aspectRatio || "1:1"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Created On</span>
                      <span className="text-xs text-zinc-200 font-medium">
                        {new Date(selectedCreation.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {selectedCreation.inputUrls && (Array.isArray(selectedCreation.inputUrls) ? selectedCreation.inputUrls : JSON.parse(selectedCreation.inputUrls)).length > 0 && (
                    <div>
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Original Product Inputs</span>
                      <div className="flex gap-2">
                        {(Array.isArray(selectedCreation.inputUrls) ? selectedCreation.inputUrls : JSON.parse(selectedCreation.inputUrls)).map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt="input detail"
                            className="w-10 h-10 rounded border border-zinc-800 object-cover"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-5 border-t border-zinc-800 mt-5 flex gap-2.5">
                  <button
                    onClick={() => handleDownload(selectedCreation.outputUrl, selectedCreation.id)}
                    disabled={downloading === selectedCreation.id}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded font-bold text-xs transition-all cursor-pointer"
                  >
                    {downloading === selectedCreation.id ? (
                      <FaSpinner className="animate-spin text-xs" />
                    ) : (
                      <FaDownload className="text-xs" />
                    )}
                    Download HD Image
                  </button>
                  <button
                    onClick={() => setSelectedCreation(null)}
                    className="px-4 py-2 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded text-xs font-semibold transition-all cursor-pointer"
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
