"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import TEMPLATES_DATA from "@/data/templates.json";
import CATEGORY_MAPPING from "@/data/id_category_mapping.json";
import {
  FaUpload,
  FaMagic,
  FaDownload,
  FaImage,
  FaKeyboard,
  FaSpinner,
  FaTrash,
  FaArrowRight,
  FaChevronDown,
  FaChevronRight,
} from "react-icons/fa";

// Priority order for category display (matches reference site)
const CATEGORY_ORDER = [
  "Food",
  "Nature",
  "Minimalism",
  "Indoor",
  "Studio",
  "Display",
  "Outdoor",
  "Plant",
  "Floral",
  "Surfaces",
  "Tabletop",
  "Texture",
  "Darkness",
  "Events",
  "SolidColor",
  "Gradient",
];

// Group templates by category
const groupedTemplates = TEMPLATES_DATA.reduce((acc, t) => {
  const cat = CATEGORY_MAPPING[t.id.toString()] || "Other";
  const withCat = {
    ...t,
    category: cat,
    thumbnail_url: t.image_url, // Use the main image as its own thumbnail
  };
  if (!acc[cat]) acc[cat] = [];
  acc[cat].push(withCat);
  return acc;
}, {});

// Sorted categories
const CATEGORIES = [
  ...CATEGORY_ORDER.filter((c) => groupedTemplates[c]),
  ...Object.keys(groupedTemplates)
    .filter((c) => !CATEGORY_ORDER.includes(c))
    .sort(),
];

const ASPECT_RATIOS = ["1:1", "4:3", "3:4", "16:9", "9:16"];

export default function HomePage() {
  const { data: session, update: updateSession } = useSession();
  const [activeTab, setActiveTab] = useState("templates");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [expandedCats, setExpandedCats] = useState({});
  const [customPrompt, setCustomPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [uploading, setUploading] = useState(false);
  const [inputUrl, setInputUrl] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [currentCreation, setCurrentCreation] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => {
    if (session?.user) fetchHistory();
  }, [session]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/creations");
      if (res.ok) setHistory(await res.json());
    } catch (err) {
      console.error("History fetch error:", err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!session) {
      signIn("google");
      return;
    }
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      if (data.url) setInputUrl(data.url);
    } catch (err) {
      console.error(err);
      alert("Error uploading. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleEnhance = async () => {
    if (!session) {
      signIn("google");
      return;
    }
    if (!inputUrl) {
      alert("Please upload a product photo first.");
      return;
    }

    const isTemplate = activeTab === "templates";
    if (isTemplate && !selectedTemplate) {
      alert("Please select a background template.");
      return;
    }
    const prompt = isTemplate
      ? selectedTemplate.default_prompt
      : customPrompt.trim();
    if (!prompt) {
      alert("Please enter a custom prompt or choose a template.");
      return;
    }

    try {
      setGenerating(true);
      setSelectedHistoryItem(null);
      setCurrentCreation({
        status: "processing",
        inputUrl,
        prompt,
        templateName: isTemplate ? selectedTemplate.category : "Custom",
      });

      const res = await fetch("/api/creations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputUrl,
          templateImageUrl: isTemplate ? selectedTemplate.image_url : null,
          prompt,
          aspectRatio,
          templateName: isTemplate
            ? `${selectedTemplate.category} #${selectedTemplate.id}`
            : null,
        }),
      });

      if (!res.ok) throw new Error((await res.text()) || "Generation failed");

      const creation = await res.json();
      setCurrentCreation(creation);
      updateSession();
      startPolling(creation.requestId);
    } catch (err) {
      console.error(err);
      alert(err.message || "An error occurred.");
      setGenerating(false);
      setCurrentCreation(null);
    }
  };

  const startPolling = (requestId) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/creations?requestId=${requestId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "completed") {
            clearInterval(pollRef.current);
            setCurrentCreation((prev) => ({
              ...prev,
              status: "completed",
              outputUrl: data.outputUrl,
            }));
            setGenerating(false);
            fetchHistory();
            updateSession();
          } else if (data.status === "failed") {
            clearInterval(pollRef.current);
            setCurrentCreation((prev) => ({ ...prev, status: "failed" }));
            setGenerating(false);
            updateSession();
            alert(`Generation failed: ${data.error || "Unknown error"}`);
          }
        }
      } catch (e) {
        console.error("Poll error:", e);
      }
    }, 3000);
  };

  const toggleCat = (cat) =>
    setExpandedCats((prev) => ({ ...prev, [cat]: !prev[cat] }));

  const activeDisplay = selectedHistoryItem || currentCreation;

  return (
    <main className="flex-1 flex justify-center overflow-hidden bg-white">
      <div className="flex h-full w-full max-w-[90%] lg:max-w-7xl overflow-hidden">
        {/* ── Left Sidebar ── */}
        <aside className="w-[340px] flex-shrink-0 border-r border-neutral-100 flex flex-col overflow-hidden">
          {/* Upload Area */}
          <div className="px-4 pt-4 pb-3 border-b border-neutral-100">
            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              Product Photo
            </p>
            {inputUrl ? (
              <div className="flex items-center gap-3 p-2 border border-neutral-100 rounded-sm bg-neutral-50">
                <img
                  src={inputUrl}
                  alt="product"
                  className="h-10 w-10 object-cover rounded-sm border border-neutral-200 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-neutral-800 truncate">
                    Product Photo
                  </p>
                  <span className="text-[10px] text-emerald-500 font-medium">
                    Ready to enhance
                  </span>
                </div>
                <button
                  onClick={() => setInputUrl(null)}
                  className="p-1 text-neutral-300 hover:text-red-400 transition-colors cursor-pointer flex-shrink-0"
                >
                  <FaTrash className="text-[10px]" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-1.5 p-4 border border-dashed border-neutral-200 hover:border-neutral-300 rounded-sm bg-neutral-50 cursor-pointer transition-colors">
                {uploading ? (
                  <>
                    <FaSpinner className="animate-spin text-neutral-400 text-base" />
                    <span className="text-xs text-neutral-500">
                      Uploading...
                    </span>
                  </>
                ) : (
                  <>
                    <FaUpload className="text-neutral-400 text-base" />
                    <span className="text-xs font-medium text-neutral-700">
                      Upload Product Image
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      PNG, JPG up to 10MB
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
            )}
          </div>

          {/* Aspect Ratio */}
          <div className="px-4 py-3 border-b border-neutral-100">
            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              Output Ratio
            </p>
            <div className="flex gap-1">
              {ASPECT_RATIOS.map((r) => (
                <button
                  key={r}
                  onClick={() => setAspectRatio(r)}
                  className={`flex-1 text-[10px] font-medium py-1 rounded-sm border transition-all cursor-pointer ${aspectRatio === r ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 text-neutral-500 hover:border-neutral-400"}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-neutral-100">
            {[
              ["templates", "Template", FaImage],
              ["custom", "Custom Prompt", FaKeyboard],
            ].map(([id, label, Icon]) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold border-b-2 transition-all cursor-pointer ${activeTab === id ? "border-neutral-900 text-neutral-900" : "border-transparent text-neutral-400 hover:text-neutral-600"}`}
              >
                <Icon className="text-[9px]" />
                {label}
              </button>
            ))}
          </div>

          {/* Template list or Custom Prompt */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "templates" ? (
              <div className="px-3 py-3 space-y-4">
                {CATEGORIES.map((cat) => {
                  const items = groupedTemplates[cat] || [];
                  const isExpanded = expandedCats[cat];
                  const displayed = isExpanded ? items : items.slice(0, 3);
                  const catLabel = cat === "SolidColor" ? "Solid Color" : cat;

                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className="text-[11px] font-semibold text-neutral-700">
                          {catLabel}
                        </h4>
                        {items.length > 3 && (
                          <button
                            onClick={() => toggleCat(cat)}
                            className="text-[10px] text-neutral-400 hover:text-neutral-600 flex items-center gap-0.5 transition-colors cursor-pointer"
                          >
                            {isExpanded ? "Less" : `See all (${items.length})`}
                            {isExpanded ? (
                              <FaChevronDown className="text-[8px]" />
                            ) : (
                              <FaChevronRight className="text-[8px]" />
                            )}
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {displayed.map((tpl) => (
                          <button
                            key={tpl.id}
                            onClick={() => setSelectedTemplate(tpl)}
                            className={`relative aspect-square rounded-sm overflow-hidden border-2 transition-all cursor-pointer group ${selectedTemplate?.id === tpl.id ? "border-neutral-900" : "border-transparent hover:border-neutral-300"}`}
                          >
                            <img
                              src={tpl.thumbnail_url}
                              alt={`${catLabel} template`}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            {selectedTemplate?.id === tpl.id && (
                              <div className="absolute inset-0 bg-neutral-900/20 flex items-center justify-center">
                                <div className="w-4 h-4 rounded-full bg-neutral-900 flex items-center justify-center">
                                  <svg
                                    viewBox="0 0 10 8"
                                    className="w-2.5 h-2.5 text-white fill-current"
                                  >
                                    <path
                                      d="M1 4l2.5 2.5L9 1"
                                      stroke="white"
                                      strokeWidth="1.5"
                                      fill="none"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </div>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4">
                <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                  Describe the Background
                </p>
                <textarea
                  placeholder="e.g. Place the product on a rustic wooden table under warm golden hour sunlight with blurred garden foliage in the background..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="w-full h-28 p-2.5 text-xs border border-neutral-200 rounded-sm bg-neutral-50 focus:bg-white focus:border-neutral-900 outline-none resize-none transition-colors leading-relaxed"
                />
                <p className="text-[10px] text-neutral-400 mt-1.5 leading-relaxed">
                  Describe the surface, lighting, and background scene. Be as
                  specific as possible for best results.
                </p>
              </div>
            )}
          </div>

          {/* Enhance CTA */}
          <div className="p-3 border-t border-neutral-100">
            {session ? (
              <button
                onClick={handleEnhance}
                disabled={generating || !inputUrl}
                className="w-full py-2 bg-accent hover:bg-accent-hover disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed text-neutral-900 font-semibold text-xs rounded-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {generating ? (
                  <>
                    <FaSpinner className="animate-spin text-[10px]" />
                    Enhancing...
                  </>
                ) : (
                  <>
                    <FaMagic className="text-[10px]" />
                    Enhance Photo (12 Credits)
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => signIn("google")}
                className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs rounded-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Sign in to Enhance <FaArrowRight className="text-[10px]" />
              </button>
            )}
          </div>
        </aside>

        {/* ── Main Canvas ── */}
        <section className="flex-1 flex flex-col overflow-hidden">
          {/* Canvas preview */}
          <div className="flex-1 flex items-center justify-center p-6 bg-neutral-50/40">
            {activeDisplay ? (
              <div className="w-full max-w-[480px] bg-white border border-neutral-200 shadow-sm rounded-sm overflow-hidden">
                <div
                  className="relative bg-neutral-100"
                  style={{ aspectRatio: aspectRatio.replace(":", "/") }}
                >
                  {activeDisplay.status === "processing" ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <FaSpinner className="animate-spin text-neutral-400 text-2xl" />
                      <div className="text-center px-6">
                        <p className="text-xs font-semibold text-neutral-700">
                          Swapping background…
                        </p>
                        <p className="text-[10px] text-neutral-400 mt-1">
                          This usually takes 20–60 seconds
                        </p>
                      </div>
                    </div>
                  ) : activeDisplay.status === "failed" ? (
                    <div className="absolute inset-0 flex items-center justify-center p-6">
                      <div className="text-center">
                        <p className="text-xs font-semibold text-red-500">
                          Enhancement failed
                        </p>
                        <p className="text-[10px] text-neutral-400 mt-1">
                          Your credit has been refunded.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={activeDisplay.outputUrl}
                      alt="Enhanced result"
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  )}
                </div>

                {activeDisplay.status === "completed" && (
                  <div className="flex items-center justify-between px-4 py-2.5 border-t border-neutral-100">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-neutral-800 truncate">
                        {activeDisplay.templateName || "Custom Generation"}
                      </p>
                      <p className="text-[10px] text-neutral-400">
                        {activeDisplay.aspectRatio || aspectRatio}
                      </p>
                    </div>
                    <a
                      href={activeDisplay.outputUrl}
                      download={`enhanced-${activeDisplay.id}.jpg`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-sm transition-all flex-shrink-0 ml-3"
                    >
                      <FaDownload className="text-[9px]" /> Download
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center">
                <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-400">
                  <FaImage className="text-xl" />
                </div>
                <p className="text-sm font-semibold text-neutral-700">
                  Preview Canvas
                </p>
                <p className="text-[11px] text-neutral-400 mt-1 max-w-[200px] mx-auto leading-relaxed">
                  Select a template, upload a photo and click Enhance to see
                  results here.
                </p>
              </div>
            )}
          </div>

          {/* History strip */}
          <div className="h-[120px] border-t border-neutral-100 bg-white px-4 flex flex-col justify-center flex-shrink-0">
            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              Recent Enhancements
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {history.length > 0 ? (
                history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedHistoryItem(item);
                      setCurrentCreation(null);
                    }}
                    className={`h-16 w-16 flex-shrink-0 border-2 rounded-sm overflow-hidden transition-all cursor-pointer ${activeDisplay?.id === item.id ? "border-neutral-900" : "border-neutral-200 hover:border-neutral-400"}`}
                  >
                    <img
                      src={item.outputUrl || item.inputUrl}
                      alt="history"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))
              ) : (
                <div className="flex-1 flex items-center justify-center border border-dashed border-neutral-200 rounded-sm h-16">
                  <p className="text-[10px] text-neutral-400">
                    No enhancements yet
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
