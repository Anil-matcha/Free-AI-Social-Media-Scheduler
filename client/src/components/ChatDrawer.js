"use client";

import React, { useState, useEffect } from "react";
import {
  SendIcon,
  SparklesIcon,
  CloseIcon,
  PageIcon,
  ChatIcon,
  CheckIcon,
  TrashIcon,
} from "./Icons";
import MarkdownRenderer from "./MarkdownRenderer";
import CustomDropdown from "./CustomDropdown";

const API_BASE = "http://localhost:8000/api";

const COMMENT_FILTER_OPTIONS = [
  { label: "All Comments", value: "all" },
  { label: "Unresolved", value: "unresolved" },
  { label: "Resolved", value: "resolved" },
];

export default function ChatDrawer({
  isOpen,
  onClose,
  messages = [],
  onSendMessage,
  agents = [],
  activePageTitle,
  activePageId,
  spaceId,
}) {
  const [activeTab, setActiveTab] = useState("comments"); // 'comments' | 'ai'
  const [inputText, setInputText] = useState("");
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentFilter, setCommentFilter] = useState("all");
  const [selectedAgentName, setSelectedAgentName] = useState("");

  // Fetch comments whenever drawer is opened on a page
  const fetchComments = async () => {
    if (!spaceId || !activePageId) return;
    setIsLoadingComments(true);
    try {
      const res = await fetch(`${API_BASE}/spaces/${spaceId}/pages/${activePageId}/comments`, {
        headers: { "X-User-Id": "usr-1" },
      });
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error("Error loading comments:", err);
    } finally {
      setIsLoadingComments(false);
    }
  };

  useEffect(() => {
    if (isOpen && activePageId && spaceId) {
      fetchComments();
    }
  }, [isOpen, activePageId, spaceId]);

  if (!isOpen) return null;

  const handleAiSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    let textToSend = inputText.trim();
    if (selectedAgentName) {
      textToSend = `@${selectedAgentName}: ${textToSend}`;
    }

    if (onSendMessage) {
      onSendMessage({
        content: textToSend,
        sender_type: "user",
        sender_name: "You",
      });
    }
    setInputText("");
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !spaceId || !activePageId) return;

    try {
      const res = await fetch(`${API_BASE}/spaces/${spaceId}/pages/${activePageId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": "usr-1",
        },
        body: JSON.stringify({ content: commentText.trim() }),
      });
      if (res.ok) {
        const newCmt = await res.json();
        setComments((prev) => [...prev, newCmt]);
        setCommentText("");
      }
    } catch (err) {
      console.error("Error submitting comment:", err);
    }
  };

  const handleToggleResolve = async (commentId, currentResolved) => {
    try {
      const res = await fetch(
        `${API_BASE}/spaces/${spaceId}/pages/${activePageId}/comments/${commentId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-User-Id": "usr-1",
          },
          body: JSON.stringify({ resolved: !currentResolved }),
        }
      );
      if (res.ok) {
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? { ...c, resolved: !currentResolved } : c))
        );
      }
    } catch (err) {
      console.error("Error resolving comment:", err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const res = await fetch(
        `${API_BASE}/spaces/${spaceId}/pages/${activePageId}/comments/${commentId}`,
        {
          method: "DELETE",
          headers: { "X-User-Id": "usr-1" },
        }
      );
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  };

  const filteredComments = comments.filter((c) => {
    if (commentFilter === "unresolved") return !c.resolved;
    if (commentFilter === "resolved") return !!c.resolved;
    return true;
  });

  return (
    <div className="w-80 border-l border-zinc-200/80 dark:border-zinc-800/80 bg-[#fbfbfa] dark:bg-[#18181b] flex flex-col h-full select-none text-xs transition-colors duration-150 shadow-sm">
      {/* Header with Tabs */}
      <div className="p-3 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/90 p-0.5 rounded-lg border border-zinc-200/60 dark:border-zinc-700/60">
          <button
            type="button"
            onClick={() => setActiveTab("comments")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === "comments"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs"
                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            <ChatIcon className="w-3.5 h-3.5 text-indigo-500" />
            <span>Comments ({comments.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ai")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === "ai"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs"
                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            <SparklesIcon className="w-3.5 h-3.5 text-indigo-500" />
            <span>AI Thread</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-zinc-200/60 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
        >
          <CloseIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Context Banner & Comments Filter */}
      <div className="px-3 py-1.5 bg-zinc-100/70 dark:bg-zinc-900/60 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between gap-1.5 text-[11px] text-zinc-500">
        <div className="flex items-center gap-1.5 min-w-0">
          <PageIcon className="w-3 h-3 text-zinc-400 shrink-0" />
          <span className="truncate">{activePageTitle ? `Page: ${activePageTitle}` : "Page Discussion"}</span>
        </div>
        {activeTab === "comments" && comments.length > 0 && (
          <CustomDropdown
            value={commentFilter}
            onChange={setCommentFilter}
            options={COMMENT_FILTER_OPTIONS}
            size="xs"
            align="right"
            buttonClassName="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-md py-0.5 px-2 text-[10px]"
          />
        )}
      </div>

      {/* Tab 1: Comments Feed */}
      {activeTab === "comments" ? (
        <>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {isLoadingComments ? (
              <div className="flex flex-col items-center justify-center py-10 text-zinc-400 gap-2">
                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs">Loading comments...</span>
              </div>
            ) : filteredComments.length === 0 ? (
              <div className="text-center py-12 text-zinc-400 dark:text-zinc-500 text-xs">
                <ChatIcon className="w-6 h-6 mx-auto mb-2 text-zinc-300 dark:text-zinc-600" />
                <p className="font-medium">
                  {comments.length === 0 ? "No comments on this page yet." : "No comments match filter."}
                </p>
                <p className="text-[11px] mt-1 text-zinc-400">Leave feedback, questions, or ideas for teammates.</p>
              </div>
            ) : (
              filteredComments.map((c) => (
                <div
                  key={c.id}
                  className={`p-3 rounded-xl border transition-all ${
                    c.resolved
                      ? "bg-zinc-100/60 dark:bg-zinc-900/40 border-zinc-200/60 dark:border-zinc-800/60 opacity-60"
                      : "bg-white dark:bg-zinc-800/90 border-zinc-200 dark:border-zinc-700/80 shadow-2xs"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-[10px] text-white font-bold">
                        {(c.user_name || "Y")[0].toUpperCase()}
                      </div>
                      <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                        {c.user_name || "User"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleToggleResolve(c.id, c.resolved)}
                        className={`p-1 rounded hover:bg-zinc-200/60 dark:hover:bg-zinc-700 transition-colors cursor-pointer ${
                          c.resolved ? "text-emerald-500" : "text-zinc-400 hover:text-emerald-500"
                        }`}
                        title={c.resolved ? "Unresolve" : "Mark resolved"}
                      >
                        <CheckIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(c.id)}
                        className="p-1 rounded hover:bg-zinc-200/60 dark:hover:bg-zinc-700 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                        title="Delete comment"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed break-words">
                    {c.content}
                  </p>

                  <div className="mt-1.5 text-[10px] text-zinc-400">
                    {new Date(c.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {c.resolved && <span className="ml-2 text-emerald-600 font-medium">✓ Resolved</span>}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Comment input */}
          <form onSubmit={handleCommentSubmit} className="p-3 border-t border-zinc-200/80 dark:border-zinc-800/80">
            <div className="relative">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment to this page..."
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg pl-3 pr-8 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-indigo-500 shadow-2xs"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="absolute right-1.5 top-1.5 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-30 cursor-pointer"
              >
                <SendIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </>
      ) : (
        /* Tab 2: AI Discussion */
        <>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-10 text-zinc-400 dark:text-zinc-500 text-xs">
                <SparklesIcon className="w-6 h-6 mx-auto mb-2 text-indigo-400 opacity-60" />
                <p>No messages yet.</p>
                <p className="text-[11px] mt-1 text-zinc-400">Ask Open Spaces or tag a Dot to iterate on this page.</p>
              </div>
            ) : (
              messages.map((m) => {
                const isUser = m.sender_type === "user";
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                  >
                    <span className="text-[10px] text-zinc-400 mb-0.5 px-1">{m.sender_name}</span>
                    <div
                      className={`max-w-[90%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                        isUser
                          ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium"
                          : "bg-white dark:bg-zinc-800/90 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700/80 shadow-2xs"
                      }`}
                    >
                      {isUser ? m.content : <MarkdownRenderer content={m.content} />}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={handleAiSubmit} className="p-3 border-t border-zinc-200/80 dark:border-zinc-800/80 space-y-2">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] text-zinc-400 font-medium">Direct to:</span>
              <CustomDropdown
                value={selectedAgentName}
                onChange={setSelectedAgentName}
                options={[
                  { label: "General Open Spaces", value: "", icon: "✨" },
                  ...agents.map((a) => ({
                    label: `@${a.name}`,
                    value: a.name,
                    icon: "🤖",
                    tag: a.role,
                  })),
                ]}
                size="xs"
                direction="up"
                align="right"
                buttonClassName="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-md py-0.5 px-2 text-[10px]"
              />
            </div>

            <div className="relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  selectedAgentName
                    ? `Message directed to @${selectedAgentName}...`
                    : "Ask Open Spaces to assist with this page..."
                }
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg pl-3 pr-8 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-500 shadow-2xs"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="absolute right-1.5 top-1.5 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-30 cursor-pointer"
              >
                <SendIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
