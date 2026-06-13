"use client";
import { standaloneConfig } from "@/lib/standaloneConfig";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FaImage, FaDownload, FaRobot, FaUser, FaMicrophone, FaFileAlt, FaCopy } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

export default function Gallery() {
  const { data: session, status } = useSession();
  const [creations, setCreations] = useState([]);
  const [selectedCreation, setSelectedCreation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      axios
        .get(`/api/creations?appId=${standaloneConfig.appId}`)
        .then(({ data }) => {
          // Filter to only completed generations
          setCreations(data.filter(c => c.status === "completed") || []);
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status]);

  const handleDownload = (url, name) => {
    const downloadUrl = `/api/download?url=${encodeURIComponent(url)}`;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = name || `creation_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadTxt = (text, name) => {
    const element = document.createElement("a");
    const file = new Blob([text], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = name || `transcript_${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="flex min-h-dvh flex-col bg-bg-page select-none text-primary-text overflow-hidden">
      <Toaster position="top-right" />
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8 flex flex-col gap-6 overflow-y-auto scrollbar-subtle">
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight uppercase">{standaloneConfig.name} Gallery</h1>
          <p className="text-xs text-secondary-text">Browse and retrieve your completed predictions, custom chats, and speech transcripts.</p>
        </div>

        {status === "unauthenticated" ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-20 bg-bg-card/20 rounded border border-divider/30">
            <FaImage className="text-4xl opacity-20 mb-4" />
            <h3 className="text-sm font-extrabold uppercase">Access Denied</h3>
            <p className="text-xs text-secondary-text max-w-xs mt-2">
              You must sign in with your Google account to view your generation gallery history.
            </p>
          </div>
        ) : loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : creations.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-20 bg-bg-card/20 rounded border border-divider/30">
            <FaImage className="text-4xl opacity-20 mb-4" />
            <h3 className="text-sm font-extrabold uppercase">No creations saved</h3>
            <p className="text-xs text-secondary-text max-w-xs mt-2">
              Your completed generations will automatically appear here once generated in the workspace.
            </p>
          </div>
        ) : (
          /* Responsive CSS Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {creations.map((creation) => {
              const templateId = creation.app?.templateId || "ai-image";
              const appName = creation.app?.name || "AI Image Studio";

              if (templateId === "ai-chat") {
                return (
                  <div
                    key={creation.id}
                    className="group relative bg-bg-card border border-divider/50 rounded p-5 flex flex-col justify-between h-56 shadow-lg hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                    onClick={() => setSelectedCreation(creation)}
                  >
                    <div className="space-y-3 flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          {appName}
                        </span>
                        <FaRobot className="text-amber-500 text-xs" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] text-secondary-text font-semibold truncate">Prompt: {creation.prompt}</p>
                        <p className="text-xs text-primary-text font-medium line-clamp-4 leading-relaxed bg-bg-page/40 p-2.5 rounded border border-divider/30">
                          {creation.resultImage}
                        </p>
                      </div>
                    </div>
                    
                    <div className="border-t border-divider/30 pt-3 flex items-center justify-between text-[10px] text-secondary-text">
                      <span>{new Date(creation.createdAt).toLocaleDateString()}</span>
                      <span className="text-primary font-bold">View Chat &rarr;</span>
                    </div>
                  </div>
                );
              }

              if (templateId === "audio-transcribe") {
                const fileName = creation.inputImage ? creation.inputImage.split("/").pop() : "audio_recording";
                return (
                  <div
                    key={creation.id}
                    className="group relative bg-bg-card border border-divider/50 rounded p-5 flex flex-col justify-between h-56 shadow-lg hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                    onClick={() => setSelectedCreation(creation)}
                  >
                    <div className="space-y-3 flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">
                          {appName}
                        </span>
                        <FaMicrophone className="text-blue-500 text-xs" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] text-secondary-text font-semibold truncate">Audio: {fileName}</p>
                        <p className="text-xs text-primary-text font-medium line-clamp-4 leading-relaxed bg-bg-page/40 p-2.5 rounded border border-divider/30">
                          {creation.resultImage}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-divider/30 pt-3 flex items-center justify-between text-[10px] text-secondary-text">
                      <span>{new Date(creation.createdAt).toLocaleDateString()}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadTxt(creation.resultImage, `transcript_${creation.id}.txt`);
                        }}
                        className="text-primary hover:text-primary-hover font-bold flex items-center gap-1"
                      >
                        <FaDownload size={9} /> Download
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={creation.id}
                  className="group relative bg-bg-card border border-divider/50 rounded overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                  onClick={() => setSelectedCreation(creation)}
                >
                  <div className="aspect-square bg-bg-page overflow-hidden">
                    <img
                      src={creation.resultImage}
                      alt={creation.prompt}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  
                  {/* Overlay Card on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end space-y-2">
                    <span className="self-start text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                      {appName}
                    </span>
                    <p className="text-xs font-bold text-white truncate">{creation.prompt}</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-primary">Aspect: {creation.aspectRatio}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(creation.resultImage, `art_${creation.id}.png`);
                        }}
                        className="bg-primary hover:bg-primary-hover text-white rounded-full p-2 transition-colors active:scale-95 flex items-center justify-center"
                      >
                        <FaDownload size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Detail View Modal */}
      {selectedCreation && (() => {
        const templateId = selectedCreation.app?.templateId || "ai-image";
        const isChat = templateId === "ai-chat";
        const isAudio = templateId === "audio-transcribe";

        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedCreation(null)} />
            <div className="relative bg-bg-card border border-divider max-w-3xl w-full rounded-lg overflow-hidden shadow-2xl animate-scale-up">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-divider/50">
                <span className="text-xs font-extrabold uppercase tracking-widest text-primary">
                  {selectedCreation.app?.name || "Workspace"} Output
                </span>
                <button onClick={() => setSelectedCreation(null)} className="p-1 hover:bg-bg-page rounded-full text-secondary-text hover:text-primary-text transition-colors">
                  <IoClose size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex flex-col md:flex-row max-h-[75vh] overflow-y-auto">
                {isChat ? (
                  <div className="flex-1 bg-bg-page flex flex-col gap-4 p-6 min-h-[300px] overflow-y-auto max-h-[50vh]">
                    <div className="flex items-start gap-3 max-w-[85%] ml-auto flex-row-reverse">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shrink-0">
                        <FaUser size={12} />
                      </div>
                      <div className="rounded-xl p-3 text-xs leading-relaxed font-medium bg-primary/10 border border-primary/20 text-primary-text">
                        {selectedCreation.prompt}
                      </div>
                    </div>
                    <div className="flex items-start gap-3 max-w-[85%] mr-auto">
                      <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-white shrink-0">
                        <FaRobot size={12} />
                      </div>
                      <div className="rounded-xl p-3 text-xs leading-relaxed font-medium bg-bg-card border border-divider/40 text-secondary-text whitespace-pre-wrap">
                        {selectedCreation.resultImage}
                      </div>
                    </div>
                  </div>
                ) : isAudio ? (
                  <div className="flex-1 bg-bg-page flex flex-col gap-4 p-6 min-h-[300px] overflow-y-auto max-h-[50vh]">
                    <span className="text-[10px] uppercase font-bold text-secondary-text tracking-widest">Source Audio</span>
                    <audio controls src={selectedCreation.inputImage} className="w-full accent-primary bg-bg-card border border-divider/40 rounded p-1" />
                    <span className="text-[10px] uppercase font-bold text-secondary-text tracking-widest mt-2">Transcript</span>
                    <div className="bg-bg-card border border-divider/40 rounded p-4 text-xs leading-relaxed font-medium text-secondary-text whitespace-pre-wrap overflow-y-auto flex-1 max-h-[240px]">
                      {selectedCreation.resultImage}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 bg-black flex items-center justify-center p-4">
                    <img
                      src={selectedCreation.resultImage}
                      alt={selectedCreation.prompt}
                      className="max-h-[50vh] object-contain rounded"
                    />
                  </div>
                )}

                <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-divider/50 p-6 flex flex-col justify-between gap-6">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-secondary-text tracking-widest">Prompt / Config</span>
                      <p className="text-xs font-semibold leading-relaxed line-clamp-3">{selectedCreation.prompt}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 border-t border-divider/30 pt-4 text-xs">
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-secondary-text tracking-wider">Type</span>
                        <span className="font-bold uppercase tracking-wider">{templateId.replace("ai-", "")}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-secondary-text tracking-wider">Cost Charge</span>
                        <span className="font-bold">{selectedCreation.creditCost} credits</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {isChat || isAudio ? (
                      <>
                        <button
                          onClick={() => handleCopyToClipboard(selectedCreation.resultImage)}
                          className="w-full bg-bg-page hover:bg-bg-card text-primary-text border border-divider py-3 rounded-full text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.98]"
                        >
                          <FaCopy className="text-xs" />
                          <span>Copy Output Text</span>
                        </button>
                        <button
                          onClick={() => handleDownloadTxt(selectedCreation.resultImage, `output_${selectedCreation.id}.txt`)}
                          className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-full text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.98]"
                        >
                          <FaDownload className="text-xs" />
                          <span>Download Transcript (.txt)</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleDownload(selectedCreation.resultImage, `art_${selectedCreation.id}.png`)}
                        className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-full text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.98]"
                      >
                        <FaDownload className="text-xs" />
                        <span>Download High-Definition</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <Footer />
    </div>
  );
}
