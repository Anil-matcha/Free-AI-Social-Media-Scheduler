"use client";

import { useState, useMemo } from "react";
import {
  IoImageOutline,
  IoSparklesOutline,
  IoCreateOutline,
} from "react-icons/io5";
import { FaAngleDown } from "react-icons/fa6";
import { TEMPLATES } from "@/lib/templates";

export default function BackgroundTemplateSelector({
  activeTab,
  onTabChange,
  selectedTemplate,
  onTemplateSelect,
  customPrompt,
  onPromptChange,
  customBgUrl,
  onBgUpload,
  aspectRatio,
  onAspectRatioChange,
  settings,
  onSettingsChange,
}) {
  const [templateCategory, setTemplateCategory] = useState("Couple");
  const [aspectRatioDropdownOpen, setAspectRatioDropdownOpen] = useState(false);

  const ASPECT_RATIOS = [
    { id: "1:1", label: "1:1 (Square)" },
    { id: "3:4", label: "3:4 (Portrait)" },
    { id: "4:3", label: "4:3 (Landscape)" },
  ];

  const currentAspectRatioLabel = useMemo(() => {
    return (
      ASPECT_RATIOS.find((r) => r.id === aspectRatio)?.label || "1:1 (Square)"
    );
  }, [aspectRatio]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Direct Base64 representation locally
    const reader = new FileReader();
    reader.onloadend = () => {
      onBgUpload(reader.result, file);
    };
    reader.readAsDataURL(file);
  };

  const toggleSetting = (key) => {
    onSettingsChange({
      ...settings,
      [key]: !settings[key],
    });
  };

  return (
    <div className="w-full space-y-6">
      {/* Tab Selector */}
      <div className="flex bg-zinc-900/60 p-1 rounded border border-zinc-800 gap-1">
        <button
          onClick={() => onTabChange("template")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded transition-all ${
            activeTab === "template"
              ? "bg-zinc-800 text-white shadow"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Template
        </button>
        <button
          onClick={() => onTabChange("image")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded transition-all ${
            activeTab === "image"
              ? "bg-zinc-800 text-white shadow"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Upload Background
        </button>
        <button
          onClick={() => onTabChange("custom")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded transition-all ${
            activeTab === "custom"
              ? "bg-zinc-800 text-white shadow"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Text Prompt
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "template" && (
        <div className="space-y-4">
          {/* Sub categories */}
          <div className="flex gap-2 border-b border-zinc-800 pb-1">
            {Object.keys(TEMPLATES).map((cat) => (
              <button
                key={cat}
                onClick={() => setTemplateCategory(cat)}
                className={`pb-2 text-xs font-bold transition-all relative ${
                  templateCategory === cat
                    ? "text-fuchsia-400"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {cat}
                {templateCategory === cat && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-fuchsia-500 rounded-full"></div>
                )}
              </button>
            ))}
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1">
            {TEMPLATES[templateCategory].map((tmpl) => (
              <button
                key={tmpl.name}
                onClick={() => onTemplateSelect(tmpl)}
                className={`relative aspect-[3/4] rounded overflow-hidden border-2 transition-all group ${
                  selectedTemplate?.url === tmpl.url
                    ? "border-fuchsia-500 ring-2 ring-fuchsia-500/20"
                    : "border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <img
                  src={tmpl.url}
                  alt={tmpl.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-1.5 text-left">
                  <p className="text-[10px] font-bold text-white truncate">
                    {tmpl.name}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === "image" && (
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-zinc-300">
            Upload custom wedding scene template
          </label>

          {customBgUrl ? (
            <div className="relative rounded overflow-hidden border-2 border-fuchsia-500 aspect-video bg-zinc-950">
              <img
                src={customBgUrl}
                alt="Custom background"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => onBgUpload(null, null)}
                className="absolute top-2 right-2 rounded bg-red-600 hover:bg-red-700 text-white p-1 text-xs font-bold transition-colors"
              >
                Remove
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 hover:border-zinc-700 rounded cursor-pointer p-6 bg-zinc-900/20 transition-all duration-200">
              <IoImageOutline className="w-8 h-8 text-zinc-500 mb-2" />
              <span className="text-xs text-zinc-400 font-bold text-center">
                Click to browse template image
              </span>
              <span className="text-[10px] text-zinc-600 mt-1">
                Supports JPG, PNG, WEBP (Max 10MB)
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}
        </div>
      )}

      {activeTab === "custom" && (
        <div className="space-y-3">
          <label
            className="block text-xs font-semibold text-zinc-300"
            htmlFor="prompt-input"
          >
            Describe your custom wedding scene
          </label>
          <textarea
            id="prompt-input"
            rows="4"
            value={customPrompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="E.g., A romantic couple holding hands on a white sand beach at sunset, elegant wedding dress, photorealistic..."
            className="w-full rounded bg-zinc-900 border border-zinc-800 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 p-3.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none resize-none transition-all duration-200"
          ></textarea>
        </div>
      )}

      {/* Advanced Settings */}
      <div className="border-t border-zinc-800 pt-5 space-y-5">
        {/* Custom Aspect Ratio Select (Upward opening) */}
        <div className="relative">
          <label className="block text-xs font-bold text-zinc-300 mb-2">
            Output Aspect Ratio
          </label>
          <button
            onClick={() => setAspectRatioDropdownOpen(!aspectRatioDropdownOpen)}
            className="w-full flex items-center justify-between rounded bg-zinc-900 border border-zinc-800 p-3.5 text-xs font-semibold text-zinc-200 outline-none hover:bg-zinc-850 transition-colors"
          >
            <span>{currentAspectRatioLabel}</span>
            <span
              className={`transition-transform duration-200 ${aspectRatioDropdownOpen ? "rotate-180" : ""}`}
            >
              <FaAngleDown />
            </span>
          </button>

          {aspectRatioDropdownOpen && (
            <>
              {/* Overlay backdrop to close dropdown */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setAspectRatioDropdownOpen(false)}
              ></div>
              <div className="absolute bottom-14 left-0 right-0 z-50 bg-zinc-900 border border-zinc-800 shadow-2xl rounded overflow-hidden overscroll-contain">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.id}
                    onClick={() => {
                      onAspectRatioChange(ratio.id);
                      setAspectRatioDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-xs font-semibold transition-colors duration-200 ${
                      aspectRatio === ratio.id
                        ? "bg-fuchsia-600 text-white"
                        : "text-zinc-300 hover:bg-zinc-800"
                    }`}
                  >
                    {ratio.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Tactile Sliding Toggle Switches */}
        <div className="space-y-4">
          <label className="block text-xs font-bold text-zinc-300">
            Generation Settings
          </label>

          {/* Toggle 1 */}
          <div className="flex items-center justify-between bg-zinc-900/40 p-3 rounded border border-zinc-800">
            <div>
              <p className="text-xs font-semibold text-zinc-200">
                Strict Face Align
              </p>
              <p className="text-[10px] text-zinc-500">
                Pose aligned strictly to template
              </p>
            </div>
            <button
              onClick={() => toggleSetting("strictAlign")}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-all duration-300 ${
                settings.strictAlign ? "bg-fuchsia-600" : "bg-zinc-700"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-all duration-300 ${
                  settings.strictAlign ? "translate-x-5" : "translate-x-0"
                }`}
              ></div>
            </button>
          </div>

          {/* Toggle 2 */}
          <div className="flex items-center justify-between bg-zinc-900/40 p-3 rounded border border-zinc-800">
            <div>
              <p className="text-xs font-semibold text-zinc-200">
                HD Face Restoration
              </p>
              <p className="text-[10px] text-zinc-500">
                Enhance final face characteristics
              </p>
            </div>
            <button
              onClick={() => toggleSetting("hdRestore")}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-all duration-300 ${
                settings.hdRestore ? "bg-fuchsia-600" : "bg-zinc-700"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-all duration-300 ${
                  settings.hdRestore ? "translate-x-5" : "translate-x-0"
                }`}
              ></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
