"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import {
  FiArrowUp,
  FiVideo,
  FiLogOut,
  FiLayout,
  FiX,
  FiSearch,
  FiChevronDown,
  FiCamera,
  FiZap,
  FiImage,
  FiPlus,
  FiLoader,
  FiTrash2,
} from "react-icons/fi";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaCoins } from "react-icons/fa";
import Link from "next/link";
import { useRouter } from "next/navigation";

const MODELS = [
  {
    id: "grok-video",
    name: "Grok Video",
    type: "MODEL",
    icon: FiVideo,
    description:
      "xAI's Grok video generation model with text-to-video and image-to-video modes.",
    api: "https://api.muapi.ai/api/v1/grok-imagine-image-to-video",
    params: {
      aspect_ratio: {
        options: ["9:16", "16:9", "2:3", "3:2", "1:1"],
        default: "2:3",
      },
      mode: { options: ["fun", "normal", "spicy"], default: "normal" },
      resolution: { options: ["480p", "720p"], default: "480p" },
      duration: { min: 6, max: 30, default: 6 },
    },
  },
  {
    id: "veo-3-1",
    name: "Veo 3.1",
    type: "MODEL",
    icon: FiVideo,
    description:
      "Google's high-fidelity video generation model with realistic movement.",
    api: "https://api.muapi.ai/api/v1/veo3.1-image-to-video",
    params: {
      aspect_ratio: { options: ["16:9", "9:16"], default: "16:9" },
      duration: { options: [8], default: 8 },
      resolution: { options: ["720p", "1080p", "4k"], default: "720p" },
    },
  },
  {
    id: "happy-horse",
    name: "Happy Horse 1",
    type: "MODEL",
    icon: FiZap,
    description: "Fast and expressive animation model for lifelike motion.",
    api: "https://api.muapi.ai/api/v1/happy-horse-1-image-to-video-720p",
    params: {
      aspect_ratio: {
        options: ["16:9", "9:16", "1:1", "4:3", "3:4"],
        default: "16:9",
      },
      duration: { min: 3, max: 15, default: 5 },
    },
  },
  {
    id: "seedance-2",
    name: "Seedance 2",
    type: "MODEL",
    icon: FiVideo,
    description: "Advanced video animation with character reference support.",
    api: "https://api.muapi.ai/api/v1/seedance-2-image-to-video",
    params: {
      aspect_ratio: {
        options: ["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"],
        default: "16:9",
      },
      duration: { min: 4, max: 15, default: 5 },
    },
  }
];

function CustomDropdown({ label, value, options, onChange, unit = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  return (
    <div
      ref={containerRef}
      className="relative"
      onBlur={(e) => {
        if (!containerRef.current.contains(e.relatedTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1 rounded transition-all hover:bg-slate-100 ${isOpen ? "bg-slate-100" : ""}`}
      >
        <span className="text-xs font-medium text-slate-600 capitalize">
          {label}
        </span>
        <span className="text-xs font-medium text-slate-900">
          {value}
          {unit}
        </span>
        <FiChevronDown
          className={`text-xs text-slate-600 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 bg-white border border-slate-300 rounded shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-[10000]">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-slate-100 transition-colors ${opt === value ? "text-slate-900 bg-slate-50" : "text-slate-500"}`}
            >
              {opt}
              {unit}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function RangeParameter({ label, value, min, max, unit = "", onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  return (
    <div
      ref={containerRef}
      className="relative"
      onBlur={(e) => {
        if (!containerRef.current.contains(e.relatedTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1 rounded transition-all hover:bg-slate-100 ${isOpen ? "bg-slate-100" : ""}`}
      >
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <span className="text-xs font-medium text-slate-900">
          {value}
          {unit}
        </span>
        <FiChevronDown
          className={`text-xs text-slate-600 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-56 bg-white border border-slate-300 rounded shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-5 z-[10000]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-slate-400">{label}</span>
            <span className="text-xs font-medium text-slate-900">
              {value}
              {unit}
            </span>
          </div>
          <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-slate-900"
          />
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const { data: session, status } = useSession();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isModelsModalOpen, setIsModelsModalOpen] = useState(false);

  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [modelSettings, setModelSettings] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [lastGeneration, setLastGeneration] = useState(null);
  const fileInputRef = useRef(null);
  const router = useRouter();

  // Polling for last generation status
  useEffect(() => {
    let interval;
    const activeStatuses = ['processing', 'pending', 'starting', 'queued'];
    if (lastGeneration && activeStatuses.includes(lastGeneration.status)) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/creations/${lastGeneration.id}`);
          if (res.ok) {
            const data = await res.json();
            if (!activeStatuses.includes(data.status)) {
              setLastGeneration(data);
              clearInterval(interval);
            } else if (data.status !== lastGeneration.status) {
              setLastGeneration(data);
            }
          }
        } catch (error) {
          console.error("Polling error:", error);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [lastGeneration]);

  useEffect(() => {
    if (selectedModel.params) {
      const defaults = {};
      Object.keys(selectedModel.params).forEach((key) => {
        defaults[key] = selectedModel.params[key].default;
      });
      setModelSettings(defaults);
    }
  }, [selectedModel]);

  const getRequiredCredits = () => {
    const duration = typeof modelSettings.duration === "number" ? modelSettings.duration : 5;
    const resolution = modelSettings.resolution || "";

    if (selectedModel.id === "grok-video") {
      const grokDuration = typeof modelSettings.duration === "number" ? modelSettings.duration : 6;
      const rate = resolution === "720p" ? 10 : 5;
      return grokDuration * rate;
    }

    if (selectedModel.id === "veo-3-1") {
      const veoDuration = typeof modelSettings.duration === "number" ? modelSettings.duration : 8;
      let rate = 500;
      if (resolution === "1080p") rate = 650;
      else if (resolution === "4k") rate = 740;
      return veoDuration * rate;
    }

    if (selectedModel.id === "happy-horse") {
      return duration * 36;
    }

    if (selectedModel.id === "seedance-2") {
      return duration * 50;
    }

    return 10;
  };


  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (uploadedImages.length + files.length > 7) {
      alert("Maximum 7 images allowed for Grok.");
      return;
    }

    const newImages = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      status: 'uploading'
    }));

    setUploadedImages(prev => [...prev, ...newImages]);

    for (const img of newImages) {
      try {
        const formData = new FormData();
        formData.append("file", img.file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) throw new Error("Upload failed");

        const data = await response.json();
        
        setUploadedImages(prev => prev.map(p => 
          p.id === img.id ? { ...p, status: 'ready', url: data.url } : p
        ));
      } catch (error) {
        console.error("Upload error:", error);
        setUploadedImages(prev => prev.map(p => 
          p.id === img.id ? { ...p, status: 'error' } : p
        ));
      }
    }
  };

  const removeImage = (id) => {
    setUploadedImages(prev => prev.filter(img => img.id !== id));
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (uploadedImages.some(img => img.status === 'uploading')) {
      alert("Please wait for images to finish uploading.");
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: selectedModel.id,
          prompt,
          settings: modelSettings,
          images: uploadedImages.filter(img => img.status === 'ready').map(img => img.url)
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      setLastGeneration({
        id: data.creationId,
        status: 'processing',
        prompt: prompt
      });
      setPrompt("");
    } catch (error) {
      console.error('Generation failed:', error);
      alert(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="h-full w-full flex items-center justify-center bg-solid-bg">
        <FiLoader className="w-6 h-6 animate-spin text-muted" />
      </div>
    );
  }

  const handleModelSelect = (model) => {
    setSelectedModel(model);
    setIsModelsModalOpen(false);
  };

  const updateSetting = (key, value) => {
    setModelSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      <main className="flex-1 flex flex-col relative min-h-0">
        {/* Content Canvas */}
        <div className="flex-1 p-8 relative flex flex-col items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            {!lastGeneration ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center text-center space-y-6 pointer-events-none"
              >
                <p className="text-muted text-xs font-bold max-w-[200px] leading-relaxed pt-4">
                  Reference uploaded images using @image(n) followed by a space
                  — e.g. @image1 a sunset over the ocean.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={lastGeneration.id}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative w-full max-w-lg aspect-[9/16] max-h-[60vh] bg-glass-bg rounded border border-glass-border shadow-2xl overflow-hidden flex flex-col items-center justify-center"
              >
                {['processing', 'pending', 'starting', 'queued'].includes(lastGeneration.status) ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
                    <span className="text-[10px] font-black text-muted uppercase tracking-[0.3em] animate-pulse">
                      Manifesting ({lastGeneration.status})...
                    </span>
                  </div>
                ) : lastGeneration.status === 'failed' ? (
                  <div className="flex flex-col items-center gap-4 p-8 text-center">
                    <FiAlertCircle className="text-rose-500 text-4xl" />
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Failed</h3>
                      <p className="text-[10px] text-muted">{lastGeneration.error || "An unknown error occurred."}</p>
                    </div>
                  </div>
                ) : (
                  <video 
                    src={lastGeneration.url} 
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    playsInline
                    controls
                  />
                )}

                <div className="absolute top-4 right-4 z-10">
                  <button 
                    onClick={() => setLastGeneration(null)}
                    className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md text-white flex items-center justify-center transition-colors"
                  >
                    <FiX />
                  </button>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent text-white">
                  <p className="text-[10px] font-medium leading-relaxed truncate opacity-80 mb-1 uppercase tracking-widest">Latest Result</p>
                  <p className="text-xs font-bold truncate">{lastGeneration.prompt}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Interaction Bar */}
        <div className="p-4 flex-shrink-0 flex flex-col items-center justify-center">
          <div className="w-full max-w-4xl bg-glass-bg rounded border border-glass-border shadow-2xl relative backdrop-blur-3xl">
            
            {/* Image Preview List */}
            <AnimatePresence>
              {uploadedImages.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex items-center gap-3 p-4 border-b border-glass-border overflow-x-auto no-scrollbar"
                >
                  {uploadedImages.map((img, index) => (
                    <motion.div 
                      key={img.id}
                      layout
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="relative group flex-shrink-0"
                    >
                      <img 
                        src={img.preview} 
                        className={`w-8 h-8 rounded object-cover border border-glass-border shadow-sm transition-opacity ${img.status === 'uploading' ? 'opacity-40' : 'opacity-100'}`}
                        alt={`Upload ${index + 1}`}
                      />
                      {img.status === 'uploading' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <FiLoader className="text-primary-500 animate-spin text-sm" />
                        </div>
                      )}
                      <button 
                        onClick={() => removeImage(img.id)}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded"
                      >
                        <FiTrash2 className="text-white text-xs" />
                      </button>
                    </motion.div>
                  ))}
                  
                  {uploadedImages.length < 7 && (
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-8 h-8 rounded border-2 border-dashed border-glass-border flex flex-col items-center justify-center text-muted hover:text-foreground hover:border-primary-500/50 transition-all group"
                    >
                      <FiPlus className="text-lg group-hover:scale-110 transition-transform" />
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-4 flex items-center gap-2 pb-0">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded hover:bg-glass-hover text-muted hover:text-foreground transition-colors"
                title="Upload Image"
              >
                <FiImage size={20} className="text-sm" />
              </button>
              <textarea
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                placeholder={selectedModel.name ? `Using ${selectedModel.name}... Add script...` : "Choose a model and add script..."}
                className="w-full bg-transparent border-none outline-none text-xs font-medium text-foreground placeholder-muted resize-none max-h-[200px] overflow-y-auto no-scrollbar"
                rows={1}
              />
            </div>

            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              multiple
              accept="image/*"
              className="hidden"
            />

            {/* Parameters & Model Selection Bar (Integrated) */}
            <div className="flex items-center justify-between px-4 py-3 bg-glass-bg border-t border-glass-border rounded-b">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsModelsModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded bg-glass-bg border border-glass-border hover:bg-glass-hover transition-colors group"
                >
                  <selectedModel.icon className="text-xs text-muted group-hover:text-foreground" />
                  <span className="text-xs font-medium text-foreground">
                    {selectedModel.name}
                  </span>
                </button>                

                <div className="w-px h-4 bg-glass-border mx-2" />

                {/* Dynamic Parameters */}
                <div className="flex items-center flex-wrap gap-2 max-w-[300px] md:max-w-none">
                  {selectedModel.params &&
                    Object.keys(selectedModel.params).map((key) => {
                      const param = selectedModel.params[key];
                      if (key === "duration" && param.min) {
                        return (
                          <RangeParameter
                            key={key}
                            label="Length"
                            value={modelSettings[key]}
                            min={param.min}
                            max={param.max}
                            unit="s"
                            onChange={(val) => updateSetting(key, val)}
                          />
                        );
                      }
                      if (param.options && param.options.length > 1) {
                        return (
                          <CustomDropdown
                            key={key}
                            label={key.replace("_", " ")}
                            value={modelSettings[key]}
                            options={param.options}
                            onChange={(val) => updateSetting(key, val)}
                          />
                        );
                      }
                      if (param.options && param.options.length === 1) {
                        return (
                          <div
                            key={key}
                            className="flex items-center gap-1.5 px-3 py-1"
                          >
                            <span className="text-xs font-medium text-muted capitalize">
                              {key.replace("_", " ")}:
                            </span>
                            <span className="text-xs font-medium text-foreground">
                              {param.options[0]}
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })}
                </div>
              </div>

              {/* Show credit cost */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f9f9f9] border border-[#ececec] rounded-full mr-2">
                <FaCoins className="text-yellow-600 text-xs" />
                <span className="text-[10px] font-bold text-slate-700">
                  Cost: {getRequiredCredits()}
                </span>
              </div>

              <button 
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-lg shadow-primary-500/20 hover:bg-primary-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
              >
                {isGenerating ? (
                  <FiLoader className="text-lg animate-spin" />
                ) : (
                  <FiArrowUp className="text-lg group-hover:-translate-y-1 group-hover:scale-110 transition-all" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Models Modal */}
        <AnimatePresence>
          {isModelsModalOpen && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModelsModalOpen(false)}
                className="absolute inset-0 bg-black/20 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-5xl h-[80vh] bg-white rounded shadow-2xl flex flex-col overflow-y-auto"
              >
                <div className="p-6 border-b border-[#f5f5f5] flex items-center gap-6">
                  <div className="relative flex-1">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search models..."
                      className="w-full pl-12 pr-4 py-2 bg-[#f9f9f9] border border-[#ececec] rounded text-xs font-bold outline-none focus:bg-white focus:border-slate-300 transition-all"
                    />
                  </div>
                  <button
                    onClick={() => setIsModelsModalOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <FiX className="text-xl text-slate-400" />
                  </button>
                </div>

                <div className="flex-1 p-6 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {MODELS.map((model) => (
                      <div
                        key={model.id}
                        onClick={() => handleModelSelect(model)}
                        className={`p-5 rounded border transition-all cursor-pointer space-y-4 group ${selectedModel.id === model.id ? "border-slate-900 ring-1 ring-slate-900 bg-slate-50" : "border-[#ececec] bg-white hover:border-slate-300 hover:shadow-md"}`}
                      >
                        <div className="flex items-center justify-between">
                          <div
                            className={`w-10 h-10 rounded flex items-center justify-center border border-[#f0f0f0] transition-all ${selectedModel.id === model.id ? "bg-[#1a1a1a] text-white" : "bg-slate-50 text-slate-600 group-hover:bg-[#1a1a1a] group-hover:text-white"}`}
                          >
                            <model.icon className="text-lg" />
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              model.type === "MODEL"
                                ? "bg-amber-100 text-amber-600"
                                : model.type === "TOOL"
                                  ? "bg-purple-100 text-purple-600"
                                  : "bg-emerald-100 text-emerald-600"
                            }`}
                          >
                            {model.type}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-xs font-medium text-slate-900">
                            {model.name}
                          </h4>
                          <p className="text-xs text-slate-400 font-bold leading-relaxed">
                            {model.description}
                          </p>
                        </div>
                        <div className="pt-2 flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-300">
                            {model.params
                              ? Object.keys(model.params).join(" • ")
                              : model.metadata}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
