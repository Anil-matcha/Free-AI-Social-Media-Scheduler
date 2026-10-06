"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { Node, mergeAttributes } from "@tiptap/core";
import {
  LuSparkles,
  LuArrowUp,
  LuX,
  LuLoader2,
  LuRefreshCw,
  LuFileText,
  LuLightbulb,
} from "react-icons/lu";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";

const QUICK_SUGGESTIONS = [
  { label: "Draft section", prompt: "Draft a comprehensive section expanding on the points above with clear insights" },
  { label: "Add 3 examples", prompt: "Provide 3 concrete, real-world examples illustrating the concepts discussed above" },
  { label: "Add checklist", prompt: "Create an actionable step-by-step checklist of next steps" },
  { label: "Summarize above", prompt: "Write a concise summary callout highlighting the key takeaways from the previous sections" },
];

export function AiPromptComponent({ editor, node, getPos, deleteNode }) {
  const [promptText, setPromptText] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Auto focus input when inserted
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

  const handleGenerate = useCallback(
    async (rawPrompt) => {
      const userPrompt = (rawPrompt || promptText).trim();
      if (!userPrompt || loading || !editor) return;

      setLoading(true);
      setErrorMsg("");
      setStatusMsg("Reading full document context & drafting…");

      const currentPos = typeof getPos === "function" ? getPos() : null;
      if (currentPos === null || isNaN(currentPos)) {
        setErrorMsg("Unable to locate insertion point.");
        setLoading(false);
        return;
      }

      // 1. Gather all document context
      const fullDoc = editor.getMarkdown ? editor.getMarkdown() : editor.getText();
      const pageTitle = editor.storage?.pageContext?.title || "Pages Document";

      // 2. Extract surrounding text (before & after insertion point)
      let beforeContext = "";
      let afterContext = "";
      try {
        const doc = editor.state.doc;
        const totalSize = doc.content.size;
        beforeContext = doc.textBetween(Math.max(0, currentPos - 1500), currentPos, "\n");
        const nodeSize = node.nodeSize || 1;
        afterContext = doc.textBetween(
          Math.min(totalSize, currentPos + nodeSize),
          Math.min(totalSize, currentPos + nodeSize + 1500),
          "\n"
        );
      } catch (err) {
        console.warn("Context extraction error:", err);
      }

      // 3. Construct targeted system prompt
      const systemPrompt = `You are an advanced model in Open Spaces (GPT-6.1 Sol Light).
You are writing content to be inserted directly into an active document at a specific location between existing sections.

DOCUMENT TITLE:
${pageTitle}

FULL DOCUMENT CONTENT (FOR FULL CONTEXT):
"""
${fullDoc || "(Document is currently blank)"}
"""

CONTENT IMMEDIATELY BEFORE THIS INSERTION:
"""
${beforeContext || "(Top of document)"}
"""

CONTENT IMMEDIATELY AFTER THIS INSERTION:
"""
${afterContext || "(Bottom of document)"}
"""

USER'S REQUEST FOR WHAT TO INSERT HERE:
"${userPrompt}"

CRITICAL INSTRUCTIONS:
1. Generate ONLY the markdown content that belongs at this exact insertion point.
2. Maintain perfect stylistic, structural, and topical continuity with the surrounding text.
3. Do NOT repeat or duplicate headings or sentences that already exist before or after.
4. Do NOT include ANY conversational preamble (e.g. "Sure, here's...", "Certainly!", "Here is the section:").
5. Do NOT include sign-offs or meta notes (e.g. "Let me know if you need more...").
6. Format richly using clean Markdown (e.g. headings, bullet points, checklists, quotes, or code blocks where appropriate).
7. Return ONLY the markdown content to insert.`;

      abortControllerRef.current = new AbortController();

      try {
        const res = await fetch(`${API_BASE}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortControllerRef.current.signal,
          body: JSON.stringify({
            prompt: userPrompt,
            system_prompt: systemPrompt,
            model: "gpt-6-1-sol",
            project: pageTitle,
          }),
        });

        if (!res.ok) {
          throw new Error(`AI service responded with status ${res.status}`);
        }

        const data = await res.json();
        let reply = (data?.reply || "").trim();

        // Strip outer code fences if the model wrapped everything in ```markdown ... ```
        if (reply.startsWith("```markdown") && reply.endsWith("```")) {
          reply = reply.slice(11, -3).trim();
        } else if (reply.startsWith("```md") && reply.endsWith("```")) {
          reply = reply.slice(5, -3).trim();
        }

        if (!reply) {
          throw new Error("AI did not generate any content.");
        }

        // 4. Modify at that place only: replace this node with the generated content
        const targetPos = typeof getPos === "function" ? getPos() : currentPos;
        const targetNodeSize = node.nodeSize || 1;

        editor
          .chain()
          .focus()
          .deleteRange({ from: targetPos, to: targetPos + targetNodeSize })
          .insertContentAt(targetPos, reply, {
            contentType: "markdown",
          })
          .run();
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("AI Generation failed:", err);
        setErrorMsg(err.message || "Failed to generate content. Please try again.");
        setLoading(false);
      }
    },
    [promptText, loading, editor, getPos, node]
  );

  return (
    <NodeViewWrapper
      className="ai-prompt-node-wrapper my-2 select-none"
      contentEditable={false}
    >
      <div className="ai-prompt-card rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-2.5 shadow-sm transition-all">
        {/* State 1: Active Loading State AT THIS PLACE ONLY */}
        {loading ? (
          <div className="ai-loader-container flex flex-col gap-2 py-0.5 px-0.5">
            {/* Header with spinner and status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-purple-600 dark:text-purple-400">
                <LuSparkles className="animate-spin text-xs" />
                <span>{statusMsg || "Generating with AI…"}</span>
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

            {/* Shimmering Skeleton Loader at this exact location */}
            <div className="space-y-1.5 pt-0.5">
              <div className="h-2.5 w-4/5 rounded-full bg-gradient-to-r from-purple-200/40 via-zinc-200/60 to-purple-200/40 dark:from-purple-950/30 dark:via-zinc-800/60 dark:to-purple-950/30 animate-pulse" />
              <div className="h-2 w-full rounded-full bg-gradient-to-r from-zinc-200/50 via-zinc-200/80 to-zinc-200/50 dark:from-zinc-800/40 dark:via-zinc-700/60 dark:to-zinc-800/40 animate-pulse delay-75" />
              <div className="h-2 w-2/3 rounded-full bg-gradient-to-r from-zinc-200/50 via-zinc-200/80 to-zinc-200/50 dark:from-zinc-800/40 dark:via-zinc-700/60 dark:to-zinc-800/40 animate-pulse delay-150" />
            </div>
          </div>
        ) : (
          /* State 2: Input & Suggestion Box (Matches Screenshot 2 - Minimal) */
          <div className="flex flex-col gap-2">
            {/* Top Badge & Close button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/50 text-[10px] font-medium text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/40">
                <LuSparkles size={9} className="text-purple-500" />
                <span>Generate</span>
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

            {/* Pill Search / Prompt Input (Matches Screenshot 2) */}
            <div className="relative flex items-center w-full rounded-full border border-zinc-200 dark:border-zinc-700/70 bg-zinc-50/80 dark:bg-[#202024] focus-within:border-purple-500/80 dark:focus-within:border-purple-400/80 focus-within:ring-1 focus-within:ring-purple-500/20 transition-all">
              <input
                ref={inputRef}
                type="text"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What would you like to write?"
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
                title="Generate with AI"
              >
                <LuArrowUp size={12} className="stroke-[2.5]" />
              </button>
            </div>

            {/* Error Message if any */}
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

            {/* Quick Suggestion Chips */}
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mr-0.5">Quick:</span>
              {QUICK_SUGGESTIONS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPromptText(item.prompt);
                    handleGenerate(item.prompt);
                  }}
                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-purple-100 hover:text-purple-700 dark:hover:bg-purple-900/40 dark:hover:text-purple-200 transition-colors cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

export const AiPromptNode = Node.create({
  name: "aiPrompt",
  group: "block",
  atom: true,
  selectable: true,
  draggable: false,

  parseHTML() {
    return [
      {
        tag: 'div[data-type="ai-prompt"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "ai-prompt" })];
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
    return ReactNodeViewRenderer(AiPromptComponent);
  },
});
