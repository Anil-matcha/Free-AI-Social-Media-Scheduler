"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { Node, mergeAttributes } from "@tiptap/core";
import {
  LuSparkles,
  LuImage,
  LuArrowUp,
  LuX,
  LuLoader2,
  LuRefreshCw,
  LuWand,
} from "react-icons/lu";
import CustomDropdown from "../CustomDropdown";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";

const ASPECT_RATIO_OPTIONS = [
  { label: "1:1 Square", value: "1:1" },
  { label: "16:9 Landscape", value: "16:9" },
  { label: "9:16 Portrait", value: "9:16" },
  { label: "4:3 Classic", value: "4:3" },
];

const RESOLUTION_OPTIONS = [
  { label: "2K High Res", value: "2K" },
  { label: "4K Ultra HD", value: "4K" },
  { label: "1K Preview", value: "1K" },
];

const QUICK_IMAGE_CHIPS = [
  { label: "Concept illustration", prompt: "A sleek conceptual editorial 3D illustration with glowing soft lighting" },
  { label: "Architecture / Tech", prompt: "Modern futuristic architecture diagram with clean isometric perspective" },
  { label: "Minimalist banner", prompt: "Minimalist geometric banner with deep violet accents and soft studio backdrop" },
];

export function AiImageComponent({ editor, node, getPos, deleteNode }) {
  const [promptText, setPromptText] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [resolution, setResolution] = useState("2K");
  const [loading, setLoading] = useState(false);
  const [analyzingContext, setAnalyzingContext] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Auto focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Dismiss on Escape
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      handleDismiss();
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (promptText.trim() && !loading) {
        handleGenerate(promptText);
      }
    }
  };

  const handleDismiss = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (typeof deleteNode === "function") {
      deleteNode();
    }
  };

  // Generate prompt automatically from existing content
  const handleSuggestFromContent = async () => {
    if (analyzingContext || loading || !editor) return;
    setAnalyzingContext(true);
    setErrorMsg("");

    try {
      const currentPos = typeof getPos === "function" ? getPos() : 0;
      const doc = editor.state.doc;
      const totalSize = doc.content.size;

      // Extract surrounding context (before and after)
      const beforeContext = doc.textBetween(Math.max(0, currentPos - 1200), currentPos, "\n");
      const fullDoc = editor.getMarkdown ? editor.getMarkdown() : editor.getText();
      const pageTitle = editor.storage?.pageContext?.title || "Document";

      const contextToSend = beforeContext.trim().length > 40 ? beforeContext : fullDoc;

      const res = await fetch(`${API_BASE}/images/suggest-prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: contextToSend || "Creative AI collaboration document",
          title: pageTitle,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.suggested_prompt) {
          setPromptText(data.suggested_prompt);
        }
      }
    } catch (err) {
      console.warn("Failed to suggest image prompt:", err);
    } finally {
      setAnalyzingContext(false);
      inputRef.current?.focus();
    }
  };

  const handleGenerate = useCallback(
    async (customPrompt) => {
      const activePrompt = (customPrompt || promptText).trim();
      if (!activePrompt || loading || !editor) return;

      setLoading(true);
      setErrorMsg("");
      setStatusMsg("Generating image with GPT-Image-2…");

      const currentPos = typeof getPos === "function" ? getPos() : null;
      if (currentPos === null || isNaN(currentPos)) {
        setErrorMsg("Unable to locate insertion point.");
        setLoading(false);
        return;
      }

      abortControllerRef.current = new AbortController();

      try {
        const res = await fetch(`${API_BASE}/images/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortControllerRef.current.signal,
          body: JSON.stringify({
            prompt: activePrompt,
            aspect_ratio: aspectRatio,
            resolution: resolution,
            model: "gpt-image-2-text-to-image",
          }),
        });

        if (!res.ok) {
          throw new Error(`Image service responded with status ${res.status}`);
        }

        const data = await res.json();
        const imageUrl = data?.image_url;
        if (!imageUrl) {
          throw new Error("No image was returned from the generator.");
        }

        // Replace this node with the generated image at that exact place
        let targetPos = null;
        if (typeof getPos === "function") {
          try {
            const p = getPos();
            if (typeof p === "number" && !isNaN(p)) {
              targetPos = p;
            }
          } catch (e) {}
        }
        if (targetPos === null || typeof targetPos === "undefined" || isNaN(targetPos)) {
          targetPos = currentPos;
        }

        const targetNodeSize = node?.nodeSize || 1;

        let replaced = false;
        if (typeof targetPos === "number" && !isNaN(targetPos)) {
          try {
            replaced = editor
              .chain()
              .focus()
              .insertContentAt(
                { from: targetPos, to: targetPos + targetNodeSize },
                [
                  {
                    type: "image",
                    attrs: {
                      src: imageUrl,
                      alt: activePrompt || "AI generated image",
                    },
                  },
                  {
                    type: "paragraph",
                  },
                ]
              )
              .run();
          } catch (e) {
            console.warn("insertContentAt range failed:", e);
          }
        }

        if (!replaced) {
          if (typeof deleteNode === "function") {
            try {
              deleteNode();
            } catch (e) {}
          }
          editor
            .chain()
            .focus()
            .setImage({
              src: imageUrl,
              alt: activePrompt || "AI generated image",
            })
            .run();
        }
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Image generation failed:", err);
        setErrorMsg(err.message || "Failed to generate image. Please try again.");
        setLoading(false);
      }
    },
    [promptText, aspectRatio, resolution, loading, editor, getPos, node, deleteNode]
  );

  return (
    <NodeViewWrapper
      className="ai-image-node-wrapper my-2 select-none"
      contentEditable={false}
    >
      <div className="ai-image-card rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-2.5 shadow-sm transition-all">
        {/* State 1: Generating Image Loader AT THIS PLACE ONLY */}
        {loading ? (
          <div className="ai-loader-container flex flex-col gap-2 py-0.5 px-0.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-purple-600 dark:text-purple-400">
                <LuWand className="animate-spin text-xs" />
                <span>{statusMsg || "Generating with GPT-Image-2…"}</span>
              </div>
              <button
                type="button"
                onClick={handleDismiss}
                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                title="Cancel generation"
              >
                <LuX size={11} />
                <span>Cancel</span>
              </button>
            </div>

            {/* Shimmering Image Skeleton Loader */}
            <div className="h-40 w-full rounded-lg bg-gradient-to-r from-purple-200/40 via-zinc-200/60 to-purple-200/40 dark:from-purple-950/30 dark:via-zinc-800/60 dark:to-purple-950/30 animate-pulse flex flex-col items-center justify-center gap-2 text-zinc-400 dark:text-zinc-500">
              <LuImage size={24} className="opacity-50 animate-bounce" />
              <span className="text-[11px] font-medium">Rendering pixels with GPT-Image-2…</span>
            </div>
          </div>
        ) : (
          /* State 2: Image Prompt Input & Content Context Trigger */
          <div className="flex flex-col gap-2">
            {/* Header: Badge, Context Generator button, Close */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/50 text-[10px] font-medium text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/40">
                  <LuImage size={10} className="text-purple-500" />
                  <span>GPT-Image-2</span>
                </div>

                {/* Option to generate prompt from existing page content */}
                <button
                  type="button"
                  onClick={handleSuggestFromContent}
                  disabled={analyzingContext}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-purple-600 dark:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition-all cursor-pointer"
                  title="Analyze existing content and generate an ideal image prompt"
                >
                  <LuSparkles size={10} className={analyzingContext ? "animate-spin" : ""} />
                  <span>{analyzingContext ? "Reading content…" : "Use page content"}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleDismiss}
                className="p-0.5 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                title="Dismiss (Esc)"
              >
                <LuX size={12} />
              </button>
            </div>

            {/* Prompt Input Pill */}
            <div className="relative flex items-center w-full rounded-full border border-zinc-200 dark:border-zinc-700/70 bg-zinc-50/80 dark:bg-[#202024] focus-within:border-purple-500/80 dark:focus-within:border-purple-400/80 focus-within:ring-1 focus-within:ring-purple-500/20 transition-all">
              <input
                ref={inputRef}
                type="text"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe image to generate with GPT-Image-2…"
                className="w-full bg-transparent pl-3 pr-8 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none"
              />
              <button
                type="button"
                disabled={!promptText.trim() || loading}
                onClick={() => handleGenerate(promptText)}
                className={`absolute right-1 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                  promptText.trim() && !loading
                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
                    : "bg-zinc-200/70 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                }`}
                title="Generate Image"
              >
                <LuArrowUp size={12} className="stroke-[2.5]" />
              </button>
            </div>

            {/* Error Banner if any */}
            {errorMsg && (
              <div className="flex items-center justify-between text-[11px] text-rose-500 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-md px-2 py-1">
                <span>{errorMsg}</span>
                <button
                  type="button"
                  onClick={() => handleGenerate(promptText)}
                  className="flex items-center gap-1 font-semibold underline hover:text-rose-600 ml-2"
                >
                  <LuRefreshCw size={10} />
                  <span>Retry</span>
                </button>
              </div>
            )}

            {/* Controls: Aspect Ratio + Quick Chips */}
            <div className="flex items-center justify-between flex-wrap gap-1.5 pt-0.5">
              {/* Custom Dropdowns for Aspect Ratio & Resolution */}
              <div className="flex items-center gap-1.5">
                <CustomDropdown
                  value={aspectRatio}
                  onChange={setAspectRatio}
                  options={ASPECT_RATIO_OPTIONS}
                  size="xs"
                  buttonClassName="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-md py-0.5 px-2 text-[10px]"
                />
                <CustomDropdown
                  value={resolution}
                  onChange={setResolution}
                  options={RESOLUTION_OPTIONS}
                  size="xs"
                  buttonClassName="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-md py-0.5 px-2 text-[10px]"
                />
              </div>

              {/* Quick style inspiration */}
              <div className="flex items-center gap-1">
                {QUICK_IMAGE_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPromptText(chip.prompt);
                      handleGenerate(chip.prompt);
                    }}
                    className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 hover:bg-purple-100 hover:text-purple-700 dark:hover:bg-purple-900/40 dark:hover:text-purple-200 transition-colors cursor-pointer"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

export const AiImageNode = Node.create({
  name: "aiImagePrompt",
  group: "block",
  atom: true,
  selectable: true,
  draggable: false,

  parseHTML() {
    return [
      {
        tag: 'div[data-type="ai-image-prompt"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "ai-image-prompt" })];
  },

  addStorage() {
    return {
      markdown: {
        serialize() {
          return "";
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(AiImageComponent);
  },
});
