"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import {
  IoSparkles,
  IoWalletOutline,
  IoCloudUploadOutline,
  IoTrashOutline,
} from "react-icons/io5";
import BackgroundTemplateSelector from "@/components/BackgroundTemplateSelector";
import ProductCanvas from "@/components/ProductCanvas";

export default function Home() {
  const { data: session, status } = useSession();

  // Workspace settings states
  const [activeTab, setActiveTab] = useState("template");
  const [selectedTemplate, setSelectedTemplate] = useState({
    name: "Pexels 10733295",
    url: "https://cdn.easysite.ai/AutoDev/11407/ai-wedding-photos/Couple/pexels_10733295.jpg",
  });
  const [customPrompt, setCustomPrompt] = useState("");
  const [portraitUrl, setPortraitUrl] = useState(null);
  const [customBgUrl, setCustomBgUrl] = useState(null);
  const [aspectRatio, setAspectRatioChange] = useState("1:1");
  const [settings, setSettings] = useState({
    strictAlign: true,
    hdRestore: true,
  });

  // Generation status states
  const [resultImage, setResultImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handlePortraitUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPortraitUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!session) {
      signIn("google");
      return;
    }

    if (!portraitUrl) {
      setErrorMessage("Please upload a portrait image first.");
      return;
    }

    if (activeTab === "template" && !selectedTemplate) {
      setErrorMessage("Please select a wedding template.");
      return;
    }

    if (activeTab === "image" && !customBgUrl) {
      setErrorMessage("Please upload a wedding background image.");
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      // 1. Upload portrait to CDN if it is base64
      let portraitCdnUrl = portraitUrl;
      if (portraitUrl.startsWith("data:")) {
        const formData = new FormData();
        const responseBlob = await fetch(portraitUrl);
        const blob = await responseBlob.blob();
        formData.append("file", blob, "portrait.png");

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) throw new Error("Failed to upload portrait.");
        const uploadJson = await uploadRes.json();
        portraitCdnUrl = uploadJson.url;
      }

      // 2. Upload custom background to CDN if base64 and tab is image
      let templateCdnUrl = null;
      if (activeTab === "image" && customBgUrl) {
        if (customBgUrl.startsWith("data:")) {
          const formData = new FormData();
          const responseBlob = await fetch(customBgUrl);
          const blob = await responseBlob.blob();
          formData.append("file", blob, "background.png");

          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });
          if (!uploadRes.ok)
            throw new Error("Failed to upload custom background.");
          const uploadJson = await uploadRes.json();
          templateCdnUrl = uploadJson.url;
        } else {
          templateCdnUrl = customBgUrl;
        }
      } else if (activeTab === "template") {
        templateCdnUrl = selectedTemplate.url;
      }

      // 3. Assemble Prompt
      let generationPrompt = "";
      if (activeTab === "custom") {
        generationPrompt = customPrompt || "A gorgeous wedding portrait.";
      } else if (activeTab === "image") {
        generationPrompt =
          "Apply the style of the template wedding photo to the user's portrait, keeping the user's facial features and body intact, photorealistic, soft natural lighting, elegant atmosphere, detailed textures, realistic skin and hair, seamless integration with template scene, cinematic mood.";
      } else {
        generationPrompt = `Replace the face in Image 2 with the face from Image 1.
Preserve Image 2's original hairstyle, pose, body, clothing (including wedding attire if present), and background.
Apply Image 1's skin tone and hair color to the replaced face.
Only modify the facial features, expression, and identity to match Image 1.
Ensure the new face blends seamlessly into Image 2 with realistic lighting, shadows, and proportions.
Do not alter Image 2's body, clothing, pose, or background.`;
      }

      // 4. Trigger generation
      const genRes = await fetch("/api/generation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: generationPrompt,
          inputImage: portraitCdnUrl,
          templateImage: templateCdnUrl,
          aspectRatio,
          activeTab,
        }),
      });

      if (genRes.status === 402) {
        throw new Error(
          "Insufficient credits. Please purchase more credits to continue.",
        );
      }

      if (!genRes.ok) {
        throw new Error("AI generation server error. Please try again.");
      }

      const genJson = await genRes.json();
      if (genJson.resultImage) {
        setResultImage(genJson.resultImage);
      } else {
        throw new Error(
          "Generation timed out. Refreshing history might retrieve it later.",
        );
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(
        err.message || "An unexpected error occurred during generation.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#09090b]">
      {/* Sidebar Controls (Left) */}
      <div className="w-full md:w-[350px] shrink-0 border-r border-zinc-900 bg-zinc-950 p-6 overflow-y-auto max-h-[none] md:max-h-[calc(100vh-64px)] flex flex-col gap-6">
        {/* Header Title Section */}
        <div>
          <h1 className="text-lg font-bold text-zinc-100 tracking-tight">
            Wedding Studio
          </h1>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Pick a template and upload your portrait.
          </p>
        </div>

        {/* Compact Portrait Uploader Section */}
        <div className="border border-zinc-900 bg-[#0d0d10]/40 rounded p-4 space-y-2.5">
          <label className="block text-[11px] font-bold text-zinc-400">
            1. Face Portrait
          </label>

          {portraitUrl ? (
            <div className="flex items-center justify-between bg-zinc-900/40 border border-zinc-900 p-2 rounded">
              <div className="flex items-center gap-2.5">
                <img
                  src={portraitUrl}
                  alt="Uploaded Face"
                  className="w-9 h-9 rounded object-cover border border-zinc-800"
                />
                <div>
                  <p className="text-xs font-semibold text-zinc-200">
                    Face Portrait
                  </p>
                  <p className="text-[10px] text-zinc-500">Ready</p>
                </div>
              </div>
              <div className="flex gap-1">
                <label className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-zinc-300 text-[10px] font-bold cursor-pointer transition-all">
                  Change
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePortraitUpload}
                    className="hidden"
                    disabled={isGenerating}
                  />
                </label>
                <button
                  onClick={() => setPortraitUrl(null)}
                  disabled={isGenerating}
                  className="p-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-zinc-400 hover:text-red-400 transition-all"
                >
                  <IoTrashOutline className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center border border-dashed border-zinc-800 hover:border-zinc-700 rounded cursor-pointer p-4 bg-transparent hover:bg-zinc-900/10 transition-all duration-200">
              <IoCloudUploadOutline className="w-5 h-5 text-zinc-400 mb-1" />
              <span className="text-[11px] text-zinc-300 font-semibold">
                Upload Front Portrait
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePortraitUpload}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Template / Background Selector Section */}
        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-zinc-400">
            2. Choose Template / Scene
          </label>
          <BackgroundTemplateSelector
            activeTab={activeTab}
            onTabChange={setActiveTab}
            selectedTemplate={selectedTemplate}
            onTemplateSelect={setSelectedTemplate}
            customPrompt={customPrompt}
            onPromptChange={setCustomPrompt}
            customBgUrl={customBgUrl}
            onBgUpload={setCustomBgUrl}
            aspectRatio={aspectRatio}
            onAspectRatioChange={setAspectRatioChange}
            settings={settings}
            onSettingsChange={setSettings}
          />
        </div>

        {errorMessage && (
          <div className="p-2.5 bg-red-950/20 border border-red-900/30 rounded">
            <p className="text-[11px] text-red-400 font-semibold">
              {errorMessage}
            </p>
          </div>
        )}

        {/* Generate Trigger Button */}
        <div className="space-y-2.5 pt-1">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-1.5 bg-white hover:bg-zinc-100 disabled:opacity-50 text-zinc-950 font-bold py-3 rounded transition-all duration-200 text-xs shadow-sm"
          >
            <IoSparkles
              className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`}
            />
            {isGenerating
              ? "Generating..."
              : session
                ? "Generate Photo"
                : "Sign In to Generate"}
          </button>

          {session && (
            <div className="flex items-center justify-center gap-1.5 text-zinc-600 text-[10px]">
              <IoWalletOutline className="w-3.5 h-3.5" />
              <span>Costs 18 credits.</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Canvas (Right) */}
      <div className="flex-1 bg-transparent overflow-y-auto max-h-[none] md:max-h-[calc(100vh-64px)] flex items-center justify-center">
        <ProductCanvas
          portraitUrl={portraitUrl}
          onPortraitSelected={setPortraitUrl}
          resultImage={resultImage}
          isGenerating={isGenerating}
          status={
            resultImage ? "completed" : isGenerating ? "processing" : "idle"
          }
          selectedTemplate={selectedTemplate}
          customBgUrl={customBgUrl}
          activeTab={activeTab}
          aspectRatio={aspectRatio}
        />
      </div>
    </div>
  );
}
