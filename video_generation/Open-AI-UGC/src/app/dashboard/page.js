"use client"

import { useSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiPlus, FiVideo, FiImage, FiSettings, FiBarChart2, 
  FiArrowRight, FiClock, FiAlertCircle, FiCheckCircle, 
  FiDownload, FiMaximize2, FiCalendar, FiX, FiInfo
} from "react-icons/fi";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [creations, setCreations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCreation, setSelectedCreation] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      signIn();
    }
  }, [status]);

  useEffect(() => {
    const fetchCreations = async () => {
      try {
        const response = await fetch('/api/creations');
        const data = await response.json();
        setCreations(data);
      } catch (error) {
        console.error("Failed to fetch creations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchCreations();
    }
  }, [session]);

  if (status === "loading") return null;
  if (!session) return null;

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12">
      <header className="max-w-7xl mx-auto mb-4 space-y-4">
        <div className="flex items-center gap-3 text-muted">
          <FiCalendar className="text-xs" />
          <span className="text-xs font-bold">
            Studio Archive
          </span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-foreground">
              MY CREATIONS
            </h1>
            <p className="text-muted font-medium text-xs leading-loose max-w-xl">
              Your generative manifestations, stored and managed.
            </p>
          </div>
          <Button 
            onClick={() => router.push("/")} 
            size="lg" 
            className="!rounded-full !bg-primary-500 !text-white hover:!bg-primary-600 px-6 py-4 font-bold text-sm shadow-xl shadow-primary-500/20"
          >
            <FiPlus className="mr-2" /> New Creation
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="py-32 flex flex-col items-center justify-center gap-4">
            <FiClock className="text-4xl text-primary-200 animate-spin" />
            <span className="text-xs font-medium text-muted animate-pulse">Syncing Archive...</span>
          </div>
        ) : creations.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center text-center space-y-8">
            <div className="w-20 h-20 rounded bg-glass-bg border border-glass-border flex items-center justify-center shadow-inner">
              <FiVideo className="text-3xl text-muted" />
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-medium text-foreground">Gallery Empty</h3>
              <Button onClick={() => router.push("/")} variant="primary" className="!rounded-full px-8">
                Start Manifesting
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {creations.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative rounded bg-solid-bg border border-glass-border aspect-[3/4] cursor-pointer overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
                  onClick={() => setSelectedCreation(item)}
                >
                  {item.status === "completed" ? (
                    <video
                      src={item.url}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      muted
                      autoPlay
                      loop
                      playsInline
                    />
                  ) : item.status === "failed" ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-rose-500 gap-3">
                      <FiAlertCircle className="text-rose-500 text-2xl" />
                      <span className="text-xs font-medium text-rose-500">Failed</span>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-glass-hover gap-4">
                      <FiClock className="text-2xl text-primary-300 animate-spin" />
                      <span className="text-xs font-medium text-muted animate-pulse">Processing...</span>
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 p-6 flex flex-col justify-end">
                    <p className="text-white text-xs font-bold leading-tight line-clamp-2 mb-3">
                      {item.prompt}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-white">
                          {item.aspectRatio || "9:16"}
                        </span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                        <FiMaximize2 className="text-xs" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedCreation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black backdrop-blur-sm p-4 md:p-12 flex flex-col items-center justify-center"
            onClick={() => setSelectedCreation(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="relative max-w-5xl w-full h-full bg-glass-bg backdrop-blur-3xl rounded border border-glass-border overflow-hidden flex flex-col md:flex-row shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Media Side */}
              <div className="flex w-full md:w-[60%] h-[50%] md:h-full bg-glass-bg border-b md:border-b-0 md:border-r border-glass-border items-center justify-center">
                {selectedCreation.status === "completed" ? (
                  <video
                    src={selectedCreation.url}
                    className="h-full w-full object-contain"
                    controls
                    autoPlay
                    loop
                    playsInline
                  />
                ) : selectedCreation.status === "failed" ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                    <FiAlertCircle className="text-rose-500 text-6xl opacity-20" />
                    <div className="text-center space-y-2">
                      <h3 className="text-sm font-bold text-rose-500">Manifestation Failed</h3>
                      <p className="text-xs text-muted max-w-xs">{selectedCreation.error || "Model error during generation."}</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-6">
                    <FiClock className="text-6xl text-primary-200 animate-spin" />
                    <span className="text-xs font-medium text-muted animate-pulse">Syncing manifesting...</span>
                  </div>
                )}
              </div>

              {/* Details Side */}
              <div className="flex w-full md:w-[40%] h-[50%] md:h-full p-8 flex flex-col overflow-y-auto no-scrollbar">
                <div className="flex-1 space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-muted">
                      <FiInfo className="text-xs" />
                      <span className="text-xs font-medium">Metadata</span>
                    </div>
                    <p className="text-sm font-medium text-foreground leading-relaxed">
                      {selectedCreation.prompt}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-8 pt-8 border-t border-glass-border">
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted">Model</div>
                      <div className="text-xs text-foreground font-bold">{selectedCreation.modelId || "Grok Video"}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted">Ratio</div>
                      <div className="text-xs text-foreground font-bold">{selectedCreation.aspectRatio || "9:16"}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted">Length</div>
                      <div className="text-xs text-foreground font-bold">{selectedCreation.duration ? `${selectedCreation.duration}s` : "6s"}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted">Resolution</div>
                      <div className="text-xs text-foreground font-bold">{selectedCreation.resolution || "720p"}</div>
                    </div>
                  </div>

                  {selectedCreation.inputImages?.length > 0 && (
                    <div className="space-y-4 pt-8 border-t border-glass-border">
                      <div className="text-xs font-medium text-muted">Source Assets</div>
                      <div className="grid grid-cols-4 gap-2">
                        {selectedCreation.inputImages.map((img, i) => (
                          <div key={i} className="aspect-square rounded border border-glass-border overflow-hidden bg-glass-hover">
                            <img src={img} className="w-full h-full object-cover" alt={`Source ${i+1}`} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-12">
                  {selectedCreation.url && (
                    <a
                      href={selectedCreation.url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-4 bg-primary-500 text-white rounded-full font-bold text-xs flex items-center justify-center gap-3 transition-all hover:bg-primary-600 active:scale-[0.98] shadow-xl shadow-primary-500/20"
                    >
                      <FiDownload size={14} /> Download Asset
                    </a>
                  )}
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedCreation(null)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-glass-bg hover:bg-glass-hover flex items-center justify-center text-foreground transition-colors border border-glass-border shadow-sm"
              >
                <FiX />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
