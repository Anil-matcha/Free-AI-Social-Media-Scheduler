"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  PlusIcon,
  WindowIcon,
  CloseIcon,
  PageIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  CopyIcon,
  CheckIcon,
  ThumbsDownIcon,
  VolumeIcon,
  RotateIcon,
  MoreIcon,
  ShareIcon,
} from "./Icons";
import MarkdownRenderer from "./MarkdownRenderer";
import CustomDropdown from "./CustomDropdown";

export default function HomeWorkView({
  activeProject = "General",
  onSelectProject,
  selectedModel = "gpt-6-1-sol",
  onSelectModel,
  onSubmitPrompt,
  conversation = [],
  isLoading = false,
  onOpenCanvas,
}) {
  const [promptText, setPromptText] = useState("");
  const [attachedImage, setAttachedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  const models = [
    {
      id: "gpt-6-1-sol",
      name: "GPT-6.1 Sol Light",
      tag: "Fast & Capable",
      icon: "⚡",
    },
    {
      id: "gpt-6-astra",
      name: "GPT-6 Astra",
      tag: "Deep Reasoning",
      icon: "🧠",
    },
    { id: "gpt-6-sol", name: "GPT-6 Sol", tag: "Balanced", icon: "✨" },
    { id: "gpt-6-luna", name: "GPT-6 Luna", tag: "Ultra Light", icon: "🌙" },
  ];

  const currentModelObj =
    models.find((m) => m.id === selectedModel) || models[0];

  // Auto-scroll to bottom of chat when new message or response appears
  useEffect(() => {
    if (conversation.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation, isLoading]);

  // Expand textarea smoothly based on scrollHeight
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const nextHeight = Math.min(textareaRef.current.scrollHeight, 200);
      textareaRef.current.style.height = `${Math.max(nextHeight, 36)}px`;
    }
  }, [promptText]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    const localPreviewUrl = URL.createObjectURL(file);

    // Show preview thumbnail locally while uploading, url is null until upload returns hosted link
    setAttachedImage({
      name: file.name,
      previewUrl: localPreviewUrl,
      url: null,
    });

    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/api/upload_file", {
        method: "POST",
        headers: { "X-User-Id": "usr-1" },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        // data.url is the hosted public link from MuAPI (https://cdn.muapi.ai/...)
        setAttachedImage((prev) => ({
          ...prev,
          url: data.url,
        }));
        setIsUploading(false);
        e.target.value = "";
        return;
      } else {
        const err = await res.json().catch(() => ({}));
        console.error("Upload failed:", res.status, err);
        alert(`Image upload failed: ${err.detail || res.statusText || res.status}`);
        setAttachedImage(null);
      }
    } catch (err) {
      console.error("Upload to server failed:", err);
      alert("Failed to connect to upload server. Please check your network or server status.");
      setAttachedImage(null);
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (isLoading || isUploading) return;
    if (!promptText.trim() && !attachedImage) return;

    // Must wait for image to upload and obtain its hosted link
    if (attachedImage && !attachedImage.url) {
      return;
    }

    const finalPrompt = promptText.trim();
    // Strictly the hosted public link (https://...), NEVER a local blob
    const imageUrl = attachedImage?.url || null;

    onSubmitPrompt(finalPrompt, imageUrl);
    setPromptText("");
    setAttachedImage(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "36px";
    }
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  // ChatGPT Native Card Input Box matching screenshot
  const renderInputBar = () => {
    return (
      <div className="w-full max-w-3xl mx-auto relative select-none">
        {/* Outer Card Container */}
        <div className="flex flex-col bg-[#f4f4f5] dark:bg-[#212121] border border-zinc-200 dark:border-zinc-700/70 p-3 sm:p-3.5 rounded-3xl shadow-sm hover:border-zinc-300 dark:hover:border-zinc-600 focus-within:border-zinc-300 dark:focus-within:border-zinc-600 transition-all">
          {/* Top Section: Uploaded Image Preview Thumbnail */}
          {attachedImage && (
            <div className="relative group w-20 h-20 mb-3 shrink-0">
              <img
                src={attachedImage.previewUrl || attachedImage.url}
                alt={attachedImage.name || "Preview"}
                className="w-20 h-20 rounded-2xl object-cover border border-zinc-300/60 dark:border-zinc-700/80 shadow-xs"
              />
              {isUploading && (
                <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center backdrop-blur-[1px]">
                  <div className="w-5 h-5 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <button
                type="button"
                onClick={() => setAttachedImage(null)}
                title="Remove image"
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-zinc-800 text-white dark:bg-zinc-700 hover:bg-black dark:hover:bg-zinc-600 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-sm cursor-pointer"
              >
                <CloseIcon className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Middle Section: Expandable Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask ChatGPT"
            className="w-full bg-transparent text-sm sm:text-base text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 resize-none focus:outline-none leading-relaxed py-1 px-1 min-h-[36px] max-h-48 overflow-y-auto"
          />

          {/* Bottom Row: Left (+) and Right (Think, Mic, Green Send Arrow) */}
          <div className="flex items-center justify-between pt-2 select-none">
            {/* Left: Upload Image + Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach image"
              className="w-8 h-8 rounded-full text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/80 dark:hover:bg-zinc-800/80 flex items-center justify-center transition-colors cursor-pointer"
            >
              <PlusIcon className="w-4 h-4" />
            </button>

            {/* Right: Think, Mic, and Circular Green Send Button */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Think Button (Models Dropdown) */}
              <CustomDropdown
                value={selectedModel}
                onChange={onSelectModel}
                options={models.map((m) => ({
                  label: m.name,
                  value: m.id,
                  icon: m.icon,
                  tag: m.tag,
                }))}
                direction="up"
                align="right"
              header="ChatGPT 6 Series (MuAPI)"
                menuClassName="w-64 bg-white dark:bg-[#1f1f23] border-zinc-200 dark:border-zinc-700/80 p-1.5 shadow-2xl backdrop-blur-md"
              buttonClassName="bg-transparent hover:bg-zinc-200/80 dark:hover:bg-zinc-800/80 border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-full px-3 py-1.5"
              />

            {/* Send Arrow Button */}
              <button
                type="button"
                onClick={handleSend}
                disabled={
                  isLoading ||
                  isUploading ||
                  (!promptText.trim() && !attachedImage) ||
                  (attachedImage && !attachedImage.url)
                }
                title="Send message"
                className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 flex items-center justify-center transition-transform hover:scale-105 shadow-sm shrink-0 cursor-pointer disabled:opacity-30 disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                <ArrowUpIcon className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fbfbfa] dark:bg-[#141416] text-zinc-900 dark:text-zinc-100 overflow-hidden transition-colors duration-150 select-none">
      {/* Hidden File Input strictly for images */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept="image/*"
      />

      {/* 1. Chat Conversation Active Mode */}
      {conversation.length > 0 ? (
        <>
          {/* Scrollable messages area (Only this scrolls) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            <div className="max-w-3xl mx-auto w-full space-y-6">
              {conversation.map((msg, idx) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={idx}
                    className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                  >
                    {isUser ? (
                      /* User message styled for both Light and Dark mode */
                      <div className="bg-[#f4f4f5] dark:bg-[#1a402d] text-zinc-900 dark:text-zinc-100 border border-zinc-200/80 dark:border-transparent px-4 py-2.5 rounded-3xl text-sm leading-relaxed max-w-xl shadow-xs select-text space-y-2">
                        {msg.image_url && (
                          <img
                            src={msg.image_url}
                            alt="Attached image"
                            className="max-h-60 rounded-xl object-contain border border-zinc-200 dark:border-zinc-700/60 shadow-xs"
                          />
                        )}
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    ) : (
                      /* Assistant message with markdown and action bar */
                      <div className="w-full max-w-3xl space-y-2 select-text">
                        <div className="text-zinc-900 dark:text-zinc-100 leading-relaxed text-sm">
                          <MarkdownRenderer content={msg.content} />
                        </div>

                        {/* Action buttons under assistant response */}
                        <div className="flex items-center justify-between pt-1 select-none text-zinc-400 dark:text-zinc-500 text-xs">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => copyToClipboard(msg.content, idx)}
                              title="Copy response"
                              className="p-1.5 rounded-md hover:bg-zinc-200/60 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                            >
                              {copiedIdx === idx ? (
                                <CheckIcon className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <CopyIcon className="w-3.5 h-3.5" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                onSubmitPrompt(
                                  conversation[idx - 1]?.content || "Retry",
                                )
                              }
                              title="Regenerate"
                              className="p-1.5 rounded-md hover:bg-zinc-200/60 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                            >
                              <RotateIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {onOpenCanvas && (
                            <button
                              type="button"
                              onClick={() => onOpenCanvas(msg.content)}
                              className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium px-2 py-1 rounded hover:bg-indigo-50 dark:hover:bg-zinc-800/60 cursor-pointer"
                            >
                              <WindowIcon className="w-3 h-3" />
                              <span>Open in Canvas / Page</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs py-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Thinking ({currentModelObj.name})...</span>
                </div>
              )}

              {/* Anchor for auto-scroll */}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Sticky Bottom Bar (Always pinned at bottom, never overflows) */}
          <div className="shrink-0 bg-transparent border-t border-transparent">
            {renderInputBar()}
          </div>
        </>
      ) : (
        /* 2. Initial Centered "What should we work on?" view */
        <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-12">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mb-8 text-center">
            What's on the agenda today?
          </h1>

          {/* Capsule Input Field */}
          {renderInputBar()}
        </div>
      )}
    </div>
  );
}
