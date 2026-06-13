"use client";

import { IoDownloadOutline, IoSparkles } from "react-icons/io5";
import LoadingTipsCarousel from "./LoadingTipsCarousel";

export default function ProductCanvas({
  portraitUrl,
  resultImage,
  isGenerating,
  selectedTemplate,
  customBgUrl,
  activeTab,
  aspectRatio,
}) {
  const handleDownload = async () => {
    if (!resultImage) return;
    try {
      const res = await fetch(resultImage);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ai-wedding-photo-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      window.open(resultImage, "_blank");
    }
  };

  const getCanvasImage = () => {
    if (resultImage) return resultImage;
    if (activeTab === "template" && selectedTemplate?.url)
      return selectedTemplate.url;
    if (activeTab === "image" && customBgUrl) return customBgUrl;
    return null;
  };

  const canvasImage = getCanvasImage();

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case "3:4":
        return "aspect-[3/4]";
      case "4:3":
        return "aspect-[4/3]";
      case "1:1":
      default:
        return "aspect-square";
    }
  };

  return (
    <div className="relative w-full h-full min-h-[450px] md:h-[calc(100vh-100px)] bg-zinc-950/20 flex flex-col items-center justify-center p-4">
      {/* Minimal Status Indicator */}
      <div className="absolute top-4 left-4 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
        {isGenerating ? "Generating" : resultImage ? "Result" : "Preview"}
      </div>

      {/* Floating Canvas Controls */}
      {resultImage && !isGenerating && (
        <div className="absolute top-4 right-4">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
          >
            <IoDownloadOutline className="w-3.5 h-3.5" />
            Download
          </button>
        </div>
      )}

      {/* Canvas Contents */}
      <div className="w-full h-full flex items-center justify-center">
        {isGenerating ? (
          <div className="max-w-md w-full animate-in fade-in duration-200">
            <LoadingTipsCarousel />
          </div>
        ) : canvasImage ? (
          <div
            className={`relative max-w-full max-h-[85%] w-auto h-auto flex items-center justify-center transition-all duration-300 ${getAspectRatioClass()}`}
          >
            {/* Minimal Preview Image */}
            <img
              src={canvasImage}
              alt="Workspace canvas"
              className="w-full h-full object-cover rounded-xl border border-zinc-800/80 shadow-md"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center max-w-xs">
            <IoSparkles className="w-6 h-6 text-zinc-600 mb-3" />
            <h4 className="text-xs font-semibold text-zinc-400">
              AI Wedding Canvas
            </h4>
            <p className="text-[11px] text-zinc-600 mt-1 leading-relaxed">
              Upload face and pick a template to begin.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
