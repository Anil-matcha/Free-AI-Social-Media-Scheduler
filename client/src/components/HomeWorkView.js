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
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
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
      const nextHeight = Math.min(textareaRef.current.scrollHeight, 180);
      textareaRef.current.style.height = `${Math.max(nextHeight, 28)}px`;
    }
  }, [promptText]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedFile({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + " KB",
        content: event.target.result,
        type: file.type,
      });
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleSend = (e) => {
    if (e) e.preventDefault();
    if ((!promptText.trim() && !attachedFile) || isLoading) return;

    let finalPrompt = promptText.trim();
    if (attachedFile) {
      finalPrompt = finalPrompt
        ? `[Attached File: ${attachedFile.name}]\n${attachedFile.content}\n\n${finalPrompt}`
        : `[Attached File: ${attachedFile.name}]\nPlease analyze this attached document:\n${attachedFile.content}`;
    }

    onSubmitPrompt(finalPrompt);
    setPromptText("");
    setAttachedFile(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "28px";
    }
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  // Reusable Pill / Capsule Input Box complying with THEME_PLAN.md
  const renderInputBar = () => {
    const isMultiline =
      (promptText.match(/\n/g) || []).length > 0 || promptText.length > 80;

    return (
      <div className="w-full max-w-3xl mx-auto relative select-none">
        {/* Models Switcher Popover Menu */}
        {showModelMenu && (
          <div className="absolute right-12 bottom-full mb-2 w-64 bg-white dark:bg-[#1f1f23] text-zinc-900 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700/80 rounded-xl shadow-xl p-1.5 z-40 backdrop-blur-md">
            <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 px-2.5 py-1.5 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700/60 mb-1">
              <span>ChatGPT 6 Series (MuAPI)</span>
            </div>
            <div className="space-y-0.5">
              {models.map((m) => {
                const isSelected = selectedModel === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      onSelectModel(m.id);
                      setShowModelMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium shadow-2xs"
                        : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{m.icon}</span>
                      <div>
                        <div className="leading-snug">{m.name}</div>
                        <div className="text-[10px] text-zinc-400">{m.tag}</div>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckIcon className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Outer Capsule / Pill conforming to THEME_PLAN */}
        <div
          className={`flex items-end gap-2 bg-[#f4f4f5] dark:bg-[#212121] border border-zinc-200 dark:border-zinc-700/70 p-2 px-3 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-600 transition-all ${
            isMultiline || attachedFile ? "rounded-3xl" : "rounded-full"
          }`}
        >
          {/* Left: Upload + Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach file or image"
            className="w-8 h-8 rounded-full text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/50 flex items-center justify-center transition-colors shrink-0 mb-0.5 cursor-pointer"
          >
            <PlusIcon className="w-4 h-4" />
          </button>

          {/* Middle: Attached file chip + Expandable Textarea */}
          <div className="flex-1 flex flex-col min-w-0">
            {attachedFile && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 mb-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg text-xs w-fit text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700">
                <PageIcon className="w-3 h-3 text-indigo-500" />
                <span className="truncate max-w-xs text-[11px] font-medium">
                  {attachedFile.name}
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  ({attachedFile.size})
                </span>
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white ml-0.5"
                >
                  <CloseIcon className="w-3 h-3" />
                </button>
              </div>
            )}

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
              className="w-full bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 resize-none focus:outline-none leading-relaxed py-1.5 px-1 max-h-48 overflow-y-auto"
            />
          </div>

          {/* Right: Models button & Send Arrow button */}
          <div className="flex items-center gap-1.5 shrink-0 mb-0.5">
            {/* Models Dropdown Button */}
            <button
              type="button"
              onClick={() => setShowModelMenu(!showModelMenu)}
              title={`Switch Model: ${currentModelObj.name}`}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border cursor-pointer ${
                showModelMenu
                  ? "bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white"
                  : "bg-transparent hover:bg-zinc-200/80 dark:hover:bg-zinc-800/80 border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300"
              }`}
            >
              <span>{currentModelObj.icon}</span>
              <span className="truncate max-w-[130px]">
                {currentModelObj.name}
              </span>
              <ChevronDownIcon className="w-3 h-3 text-zinc-400 ml-0.5" />
            </button>

            {/* Send Arrow Button */}
            <button
              type="button"
              onClick={handleSend}
              disabled={isLoading || (!promptText.trim() && !attachedFile)}
              title="Send message"
              className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 flex items-center justify-center transition-transform hover:scale-105 shadow-sm shrink-0 cursor-pointer disabled:opacity-30 disabled:hover:scale-100"
            >
              <ArrowUpIcon className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fbfbfa] dark:bg-[#141416] text-zinc-900 dark:text-zinc-100 overflow-hidden transition-colors duration-150 select-none">
      {/* Hidden File Input for the upload + button */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept=".txt,.md,.json,.js,.py,.csv,.html,.css,.doc,.pdf"
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
                      <div className="bg-[#f4f4f5] dark:bg-[#1a402d] text-zinc-900 dark:text-zinc-100 border border-zinc-200/80 dark:border-transparent px-4 py-2.5 rounded-3xl text-sm leading-relaxed max-w-xl shadow-xs select-text">
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
                              title="Bad response"
                              className="p-1.5 rounded-md hover:bg-zinc-200/60 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                            >
                              <ThumbsDownIcon className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              title="Share"
                              className="p-1.5 rounded-md hover:bg-zinc-200/60 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                            >
                              <ShareIcon className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              title="Read aloud"
                              className="p-1.5 rounded-md hover:bg-zinc-200/60 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                            >
                              <VolumeIcon className="w-3.5 h-3.5" />
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

                            <button
                              type="button"
                              title="More options"
                              className="p-1.5 rounded-md hover:bg-zinc-200/60 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                            >
                              <MoreIcon className="w-3.5 h-3.5" />
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
          <div className="shrink-0 p-3 sm:p-4 bg-transparent border-t border-transparent">
            {renderInputBar()}
          </div>
        </>
      ) : (
        /* 2. Initial Centered "What should we work on?" view */
        <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-12">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mb-8 text-center">
            What should we work on?
          </h1>

          {/* Capsule Input Field */}
          {renderInputBar()}
        </div>
      )}
    </div>
  );
}
