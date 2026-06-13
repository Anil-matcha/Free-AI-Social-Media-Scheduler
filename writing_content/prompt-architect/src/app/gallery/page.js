"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";
import {
  FaRegClipboard,
  FaCheck,
  FaExternalLinkAlt,
  FaMagic,
  FaCalendarAlt,
  FaChevronRight,
  FaSearch,
} from "react-icons/fa";

export default function GalleryPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [prompts, setPrompts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  // Redirect if unauthenticated
  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      signIn("google");
    }
  }, [sessionStatus]);

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/gallery");
      if (res.ok) {
        const data = await res.json();
        setPrompts(data);
      }
    } catch (err) {
      console.error("Failed to load gallery prompts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchGallery();
    }
  }, [session]);

  const handleCopy = async (id, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenChatGPT = (text) => {
    const url = `https://chat.openai.com/?q=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  // Helper to extract prompt text
  const getPromptText = (content) => {
    try {
      const parsed = JSON.parse(content);
      return parsed.finalPrompt || "";
    } catch (e) {
      // Check if it has markdown wrapper or text inside
      return content;
    }
  };

  const filteredPrompts = prompts.filter((p) => {
    const text = getPromptText(p.content).toLowerCase();
    const title = p.session.title.toLowerCase();
    const query = searchQuery.toLowerCase();
    return text.includes(query) || title.includes(query);
  });

  if (sessionStatus === "loading") {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-zinc-300">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wide text-zinc-400">Loading library...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#09090b] text-zinc-100 font-sans">
      <Navbar />

      <main className="flex-1 z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-12 border-b border-white/5 pb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2">
              Your Prompt Library
            </h1>
            <p className="text-zinc-400 text-sm md:text-base">
              All your optimized instructions. Copy, refine, or deploy them directly to ChatGPT.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative max-w-md w-full shrink-0">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-4 w-4 text-zinc-500" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prompts or session titles..."
              className="w-full pl-10 pr-4 py-2.5 glass-input rounded-xl text-sm text-white placeholder-zinc-500 transition-all focus:ring-1 focus:ring-violet-500/40"
            />
          </div>
        </div>

        {/* Library Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-zinc-400">Loading your prompts...</p>
          </div>
        ) : filteredPrompts.length === 0 ? (
          <div className="text-center py-20 glass border border-white/5 rounded-3xl max-w-3xl mx-auto p-8 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-pink-500 flex items-center justify-center mb-6">
              <FaMagic className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Prompts Found</h3>
            <p className="text-zinc-400 text-sm max-w-md mx-auto mb-8">
              {searchQuery
                ? "No prompts match your current search query. Try adjusting your keywords."
                : "You haven't generated any final prompt frameworks yet. Start a refinement session in the studio!"}
            </p>
            <Link
              href="/chat"
              className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white shadow-lg transition-all"
            >
              <span>Architect a Prompt</span>
              <FaChevronRight className="w-3 h-3" />
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {filteredPrompts.map((p) => {
              const text = getPromptText(p.content);
              const formattedDate = new Date(p.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              });

              return (
                <div
                  key={p.id}
                  className="glass border border-white/5 hover:border-violet-500/30 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1.5 truncate max-w-[240px] sm:max-w-xs">
                          {p.session.title}
                        </h3>
                        <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
                          <FaCalendarAlt className="w-3 h-3 shrink-0" />
                          <span>{formattedDate}</span>
                        </div>
                      </div>
                      <Link
                        href={`/chat?sessionId=${p.sessionId}`}
                        className="py-1.5 px-3 rounded-lg bg-violet-600/10 border border-violet-500/20 text-violet-300 text-xs font-semibold hover:bg-violet-600/25 transition-all flex items-center gap-1 shrink-0"
                      >
                        <FaMagic className="w-3 h-3" />
                        <span>Refine Workspace</span>
                      </Link>
                    </div>

                    {/* Code display */}
                    <div className="bg-slate-950/70 border border-white/5 rounded-xl p-4 font-mono text-xs text-zinc-300 max-h-56 overflow-y-auto mb-6 whitespace-pre-wrap select-all leading-relaxed">
                      {text}
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleCopy(p.id, text)}
                      className="flex-1 py-2 px-3 rounded-xl border border-white/10 hover:border-violet-500/30 text-white hover:bg-white/5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      {copiedId === p.id ? (
                        <>
                          <FaCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <FaRegClipboard className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleOpenChatGPT(text)}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <FaExternalLinkAlt className="w-3.5 h-3.5" />
                      <span>Open in ChatGPT</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <FooterSection />
    </div>
  );
}
