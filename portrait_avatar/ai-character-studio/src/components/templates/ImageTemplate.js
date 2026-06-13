"use client";

import { useState } from "react";
import { FaImage, FaMagic, FaDownload, FaExclamationTriangle, FaVideo, FaMicrophone } from "react-icons/fa";
import { FiRefreshCw } from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";
import config from "@/lib/config";

const ASPECT_RATIOS = [
  { id: "1:1", label: "1:1 Square", width: "w-16 h-16" },
  { id: "16:9", label: "16:9 Landscape", width: "w-20 h-12" },
  { id: "9:16", label: "9:16 Portrait", width: "w-12 h-20" }
];

function CustomSelect({ value, onChange, options, placeholder = "Select option", className = "" }) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value) || { label: placeholder, value };
  
  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full bg-bg-page border border-divider/60 rounded py-2.5 px-3 text-xs outline-none focus:border-primary/60 transition-all font-semibold text-primary-text flex items-center justify-between cursor-pointer select-none active:scale-[0.99] min-h-[38px]"
      >
        <span>{selectedOption.label}</span>
        <span className={`text-[8px] transition-transform duration-200 ${open ? "rotate-180" : ""}`}>▼</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 mt-1 bg-bg-card border border-divider rounded shadow-2xl z-50 py-1 max-h-48 overflow-y-auto scrollbar-subtle animate-scale-up">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-primary/10 hover:text-primary cursor-pointer ${
                  value === opt.value ? "text-primary font-bold bg-primary/5" : "text-primary-text"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function ImageTemplate({ appInstance, userCredits, activeCreation, onCreationCompleted }) {
  const parsedConfig = appInstance.config ? JSON.parse(appInstance.config) : {};
  const userParams = parsedConfig.userParams || [];

  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(parsedConfig.aspectRatio || "1:1");
  const [generating, setGenerating] = useState(false);
  const [beforeAfterSlider, setBeforeAfterSlider] = useState(50);

  // Dynamic Parameter State
  const [customValues, setCustomValues] = useState(() => {
    const initial = {};
    userParams.forEach(p => {
      initial[p.key] = p.defaultValue !== undefined ? p.defaultValue : "";
    });
    return initial;
  });

  // Calculate dynamic credit cost in real-time
  const getDynamicCost = () => {
    let baseCost = parsedConfig.creditCost !== undefined ? Number(parsedConfig.creditCost) : config.ai.generationCost;
    let totalCost = baseCost;

    userParams.forEach(p => {
      const val = customValues[p.key] !== undefined ? customValues[p.key] : p.defaultValue;
      
      if (p.type === "enum") {
        if (p.costModifiers && p.costModifiers[val] !== undefined) {
          totalCost += Number(p.costModifiers[val]) || 0;
        } else if (Array.isArray(p.costModifiers) && p.options) {
          const optIndex = p.options.indexOf(val);
          if (optIndex !== -1 && p.costModifiers[optIndex] !== undefined) {
            totalCost += Number(p.costModifiers[optIndex]) || 0;
          }
        }
      } else if (p.type === "boolean") {
        const isTrue = val === true || val === "true" || val === 1 || val === "1";
        if (isTrue && p.costIfTrue !== undefined) {
          totalCost += Number(p.costIfTrue) || 0;
        }
      } else if (p.type === "number" || p.type === "slider") {
        if (p.costPerUnit !== undefined) {
          const numVal = Number(val) || 0;
          totalCost += numVal * (Number(p.costPerUnit) || 0);
        }
      }
    });

    return Math.max(0, totalCost);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await axios.post("/api/upload", formData);
      setImage(data.url);
      toast.success("Reference image uploaded!");
    } catch (err) {
      toast.error("Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const handleDynamicFileUpload = async (e, key, maxInputs = 1, fileTypeLabel = "File") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await axios.post("/api/upload", formData);
      setCustomValues(prev => {
        const currentList = Array.isArray(prev[key]) ? prev[key] : [];
        return {
          ...prev,
          [key]: [...currentList, data.url].slice(0, maxInputs)
        };
      });
      toast.success(`${fileTypeLabel} uploaded successfully!`);
    } catch (err) {
      toast.error(`Failed to upload ${fileTypeLabel.toLowerCase()}.`);
    } finally {
      setUploading(false);
    }
  };

  const removeDynamicFile = (key, idx) => {
    setCustomValues(prev => {
      const currentList = Array.isArray(prev[key]) ? prev[key] : [];
      return {
        ...prev,
        [key]: currentList.filter((_, i) => i !== idx)
      };
    });
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    
    // Resolve dynamic prompt if configured, otherwise fallback to local prompt state
    let finalPrompt = prompt;
    if (userParams.length > 0) {
      const promptParam = userParams.find(p => p.key === "prompt");
      if (promptParam) {
        finalPrompt = customValues["prompt"] || "";
      }
    }

    if (!finalPrompt.trim()) {
      toast.error("Please enter a prompt.");
      return;
    }

    setGenerating(true);
    const toastId = toast.loading("Generating image prediction...");

    try {
      // Gather other custom fields
      const customParams = {};
      let inputImageVal = image;
      let aspectRatioVal = aspectRatio;

      if (userParams.length > 0) {
        userParams.forEach(p => {
          if (p.key !== "prompt") {
            const isUploadType = ["image_list", "video_list", "audio_list"].includes(p.type);
            if (isUploadType) {
              const fileList = Array.isArray(customValues[p.key]) ? customValues[p.key] : [];
              const isListKey = p.key.endsWith("_list") || (p.maxInputs && p.maxInputs > 1);

              if (isListKey) {
                customParams[p.key] = fileList;
              } else {
                customParams[p.key] = fileList[0] || "";
              }

              if (p.type === "image_list" && !inputImageVal) {
                inputImageVal = fileList[0] || null;
              }
            } else {
              customParams[p.key] = customValues[p.key];
            }
            if (p.key === "aspect_ratio") {
              aspectRatioVal = customValues[p.key];
            }
          }
        });
      }

      const { data } = await axios.post("/api/generation", {
        prompt: `${parsedConfig.systemPrompt || ""} ${finalPrompt}`.trim(),
        inputImage: inputImageVal,
        aspectRatio: aspectRatioVal,
        appId: appInstance.id,
        modelEndpoint: "predictions",
        ...customParams
      });

      if (data.status === "failed") {
        toast.error("Generation failed. Credits refunded.", { id: toastId });
      } else {
        toast.success("Generation completed!", { id: toastId });
      }
      onCreationCompleted();
    } catch (err) {
      toast.error(err.response?.data?.error || "Generation failed.", { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = (url) => {
    const downloadUrl = `/api/download?url=${encodeURIComponent(url)}`;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `image_${appInstance.id}_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-7xl items-stretch">
      {/* Configuration Form */}
      <div className="w-full lg:w-[400px] shrink-0 border border-divider/40 bg-bg-card/30 p-6 rounded-lg flex flex-col gap-6">
        <div>
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-primary">Studio Settings</h2>
          <p className="text-[11px] text-secondary-text">Tweak aspect ratios and inputs for {appInstance.name}.</p>
        </div>

        <form onSubmit={handleGenerate} className="space-y-6">
          {userParams.length > 0 ? (
            userParams.map((param) => {
              if (["image_list", "video_list", "audio_list"].includes(param.type)) {
                const urls = Array.isArray(customValues[param.key]) ? customValues[param.key] : (customValues[param.key] ? [customValues[param.key]] : []);
                const maxInps = param.maxInputs || 1;

                let fileAccept = "image/*";
                let icon = <FaImage className="text-xl" />;
                let labelText = "Image";
                if (param.type === "video_list") {
                  fileAccept = "video/*";
                  icon = <FaVideo className="text-xl" />;
                  labelText = "Video";
                } else if (param.type === "audio_list") {
                  fileAccept = "audio/*";
                  icon = <FaMicrophone className="text-xl" />;
                  labelText = "Audio";
                }

                return (
                  <div key={param.key} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-secondary-text uppercase tracking-wider">{param.label}</label>
                      <span className="text-[10px] text-secondary-text font-bold bg-bg-page px-2 py-0.5 rounded border border-divider">
                        {urls.length}/{maxInps} {maxInps > 1 ? "Files" : "File"}
                      </span>
                    </div>

                    {urls.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {urls.map((url, idx) => (
                          <div key={idx} className="relative aspect-square border border-divider rounded bg-bg-page/80 overflow-hidden group">
                            {param.type === "image_list" ? (
                              <img src={url} alt="Uploaded source" className="w-full h-full object-cover" />
                            ) : param.type === "video_list" ? (
                              <div className="w-full h-full flex items-center justify-center bg-black">
                                <FaVideo size={16} className="text-primary" />
                              </div>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-bg-card">
                                <FaMicrophone size={16} className="text-primary" />
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => removeDynamicFile(param.key, idx)}
                              className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold cursor-pointer transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {urls.length < maxInps && (
                      <div className="relative border-2 border-dashed border-divider hover:border-primary/50 transition-colors rounded-lg h-24 flex flex-col items-center justify-center bg-bg-page/40 p-2">
                        <label className="cursor-pointer flex flex-col items-center gap-1.5 text-xs font-semibold text-secondary-text">
                          {icon}
                          <span className="text-[10px]">{uploading ? "Uploading..." : `Upload ${labelText}`}</span>
                          <input
                            type="file"
                            onChange={(e) => handleDynamicFileUpload(e, param.key, maxInps, labelText)}
                            className="hidden"
                            accept={fileAccept}
                            disabled={uploading}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                );
              }

              if (param.type === "boolean") {
                return (
                  <div key={param.key} className="flex items-center justify-between py-2 border-b border-divider/20">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-primary-text block">{param.label}</span>
                      <span className="text-[10px] text-secondary-text">Toggle control</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={!!customValues[param.key]} 
                        onChange={(e) => setCustomValues(prev => ({ ...prev, [param.key]: e.target.checked }))}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-bg-page peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-secondary-text peer-checked:after:bg-white after:border-none after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary border border-divider"></div>
                    </label>
                  </div>
                );
              }

              if (param.type === "enum") {
                const options = param.options || [];
                return (
                  <div key={param.key} className="space-y-2">
                    <label className="text-xs font-bold text-secondary-text uppercase tracking-wider block">{param.label}</label>
                    <CustomSelect
                      value={customValues[param.key]}
                      onChange={(val) => setCustomValues(prev => ({ ...prev, [param.key]: val }))}
                      options={options.map(opt => ({ label: opt, value: opt }))}
                    />
                  </div>
                );
              }

              if (param.type === "slider") {
                const val = customValues[param.key] !== undefined ? customValues[param.key] : param.defaultValue;
                return (
                  <div key={param.key} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-secondary-text uppercase tracking-wider">{param.label}</label>
                      <span className="text-xs font-bold text-primary">{val}</span>
                    </div>
                    <input 
                      type="range" 
                      min={param.min !== undefined ? param.min : 0} 
                      max={param.max !== undefined ? param.max : 100} 
                      step={param.step !== undefined ? param.step : 1}
                      value={val}
                      onChange={(e) => setCustomValues(prev => ({ ...prev, [param.key]: Number(e.target.value) }))}
                      className="w-full accent-primary h-1.5 bg-bg-page rounded-lg appearance-none cursor-pointer border border-divider"
                    />
                  </div>
                );
              }

              if (param.type === "textarea") {
                return (
                  <div key={param.key} className="space-y-2">
                    <label className="text-xs font-bold text-secondary-text uppercase tracking-wider block">{param.label}</label>
                    <textarea
                      value={customValues[param.key]}
                      onChange={(e) => setCustomValues(prev => ({ ...prev, [param.key]: e.target.value }))}
                      placeholder={`Enter ${param.label.toLowerCase()}...`}
                      className="w-full bg-bg-page border border-divider rounded p-3 text-xs outline-none focus:border-primary/60 transition-colors h-24 resize-none font-medium placeholder-secondary-text leading-relaxed"
                    />
                  </div>
                );
              }

              if (param.type === "number") {
                return (
                  <div key={param.key} className="space-y-2">
                    <label className="text-xs font-bold text-secondary-text uppercase tracking-wider block">{param.label}</label>
                    <input
                      type="number"
                      value={customValues[param.key]}
                      onChange={(e) => setCustomValues(prev => ({ ...prev, [param.key]: Number(e.target.value) }))}
                      className="w-full bg-bg-page border border-divider rounded py-2.5 px-3 text-xs outline-none focus:border-primary/60 transition-colors font-medium text-primary-text"
                    />
                  </div>
                );
              }

              return (
                <div key={param.key} className="space-y-2">
                  <label className="text-xs font-bold text-secondary-text uppercase tracking-wider block">{param.label}</label>
                  <input
                    type="text"
                    value={customValues[param.key]}
                    onChange={(e) => setCustomValues(prev => ({ ...prev, [param.key]: e.target.value }))}
                    placeholder={`Enter ${param.label.toLowerCase()}...`}
                    className="w-full bg-bg-page border border-divider rounded py-2.5 px-3 text-xs outline-none focus:border-primary/60 transition-colors font-medium text-primary-text"
                  />
                </div>
              );
            })
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-xs font-bold text-secondary-text uppercase tracking-wider">Reference Image (Optional)</label>
                <div className="relative border-2 border-dashed border-divider hover:border-primary/50 transition-colors rounded-lg h-32 flex flex-col items-center justify-center bg-bg-page/40 p-4">
                  {image ? (
                    <div className="w-full h-full relative group">
                      <img src={image} alt="Uploaded source" className="w-full h-full object-contain rounded" />
                      <button
                        type="button"
                        onClick={() => setImage(null)}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-white font-bold transition-opacity rounded"
                      >
                        Remove Reference
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-2 text-xs font-semibold text-secondary-text">
                      <FaImage className="text-xl" />
                      <span>{uploading ? "Uploading..." : "Upload Image"}</span>
                      <input type="file" onChange={handleImageUpload} className="hidden" accept="image/*" disabled={uploading} />
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-secondary-text uppercase tracking-wider">Aspect Ratio</label>
                <div className="grid grid-cols-3 gap-2">
                  {ASPECT_RATIOS.map((ratio) => (
                    <button
                      key={ratio.id}
                      type="button"
                      onClick={() => setAspectRatio(ratio.id)}
                      className={`py-2 rounded border text-xs font-bold flex flex-col items-center gap-2 transition-all ${
                        aspectRatio === ratio.id ? "border-primary bg-primary/10 text-primary-text" : "border-divider bg-bg-page/20 text-secondary-text hover:bg-bg-card"
                      }`}
                    >
                      <div className={`border-2 ${ratio.width} ${aspectRatio === ratio.id ? "border-primary" : "border-divider"} rounded-sm`} />
                      <span>{ratio.id}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-secondary-text uppercase tracking-wider">Custom Prompt</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your vision..."
                  className="w-full bg-bg-page border border-divider rounded p-3 text-xs outline-none focus:border-primary/60 transition-colors h-24 resize-none font-medium placeholder-secondary-text leading-relaxed"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={generating || uploading}
            className="w-full bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-white font-bold py-3 rounded-full text-xs shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
          >
            {generating ? (
              <>
                <FiRefreshCw className="animate-spin text-sm" />
                <span>Generating Output...</span>
              </>
            ) : (
              <>
                <FaMagic className="text-xs" />
                <span>
                  Generate Image (Cost: {getDynamicCost()} credit{getDynamicCost() !== 1 ? "s" : ""})
                </span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Output Panel / Workspace */}
      <div className="flex-1 border border-divider/30 bg-bg-card/10 rounded-lg p-6 flex flex-col items-center justify-center min-h-[400px]">
        {activeCreation ? (
          <div className="w-full max-w-lg space-y-6">
            {activeCreation.inputImage && activeCreation.resultImage && activeCreation.status === "completed" ? (
              <div className="relative h-96 w-full rounded overflow-hidden shadow-2xl">
                <img src={activeCreation.inputImage} alt="Input" className="absolute inset-0 w-full h-full object-cover" />
                <div 
                  className="absolute inset-y-0 right-0 left-0 h-full overflow-hidden"
                  style={{ clipPath: `polygon(${beforeAfterSlider}% 0%, 100% 0%, 100% 100%, ${beforeAfterSlider}% 100%)` }}
                >
                  <img src={activeCreation.resultImage} alt="Output" className="absolute inset-0 w-full h-full object-cover" />
                </div>

                <div className="absolute inset-y-0 w-1 bg-white cursor-ew-resize z-10 flex items-center justify-center" style={{ left: `${beforeAfterSlider}%` }}>
                  <div className="w-8 h-8 rounded-full bg-white shadow-lg text-neutral-900 text-xs flex items-center justify-center font-bold">&harr;</div>
                </div>

                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={beforeAfterSlider} 
                  onChange={(e) => setBeforeAfterSlider(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                />
              </div>
            ) : (
              <div className="relative h-96 w-full rounded overflow-hidden bg-bg-page border border-divider shadow-xl flex items-center justify-center">
                {activeCreation.status === "processing" ? (
                  <div className="flex flex-col items-center gap-4 text-xs font-semibold text-secondary-text">
                    <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="animate-pulse">MuAPI processing image...</span>
                  </div>
                ) : activeCreation.status === "completed" ? (
                  <img src={activeCreation.resultImage} alt="AI output" className="w-full h-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-xs text-red-500 font-bold">
                    <span>Generation failed.</span>
                    <span className="text-[10px] text-secondary-text font-normal">{activeCreation.error || "MuAPI error occurred."}</span>
                  </div>
                )}
              </div>
            )}

            <div className="bg-bg-card border border-divider p-4 rounded-lg flex items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <p className="text-xs font-bold text-primary-text truncate">{activeCreation.prompt}</p>
                <div className="flex items-center gap-3 text-[10px] text-secondary-text">
                  <span className="uppercase font-bold tracking-widest text-primary">{activeCreation.status}</span>
                  <span>•</span>
                  <span>Aspect: {activeCreation.aspectRatio}</span>
                </div>
              </div>
              {activeCreation.status === "completed" && (
                <button
                  onClick={() => handleDownload(activeCreation.resultImage)}
                  className="bg-bg-page hover:bg-bg-card border border-divider rounded-full p-3 text-primary transition-all active:scale-95 flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <FaDownload className="text-xs" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-xs text-secondary-text font-bold uppercase tracking-wider">
            <FaImage className="text-3xl opacity-30 mb-2" />
            <span>Studio Workspace Empty</span>
            <span className="text-[10px] text-secondary-text font-normal capitalize">Configure settings and generate dynamic assets.</span>
          </div>
        )}
      </div>
    </div>
  );
}
