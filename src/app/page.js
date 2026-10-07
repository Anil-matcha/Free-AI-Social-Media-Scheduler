"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { 
  FaYoutube, 
  FaInstagram, 
  FaLinkedin, 
  FaCheckCircle, 
  FaClock, 
  FaExclamationTriangle,
  FaCalendarAlt,
  FaShareAlt,
  FaRocket,
  FaGoogle,
  FaBolt
} from "react-icons/fa";
import { FaXTwitter, FaThreads } from "react-icons/fa6";
import { SiTiktok } from "react-icons/si";
import { FiPlus, FiTrash2, FiEdit2, FiExternalLink, FiRefreshCw, FiX } from "react-icons/fi";
import Link from "next/link";
import ContentCalendar from "@/components/calendar/ContentCalendar";
import PostComposerModal from "@/components/composer/PostComposerModal";

export default function WorkspaceDashboard() {
  const { data: session, status } = useSession();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectedAccounts, setConnectedAccounts] = useState([]);

  // Composer Modal State
  const [composerOpen, setComposerOpen] = useState(false);
  const [openWithAi, setOpenWithAi] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [editingPost, setEditingPost] = useState(null);

  // Post Detail Modal State
  const [viewingPost, setViewingPost] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch posts from API
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/posts");
      if (res.ok) {
        const data = await res.json();
        setPosts(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn("Error fetching posts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch real connected accounts
  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/social/accounts");
      if (res.ok) {
        const data = await res.json();
        setConnectedAccounts(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn("Error fetching accounts:", err);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchPosts();
      fetchAccounts();
    }
  }, [status, fetchPosts, fetchAccounts]);

  // Handlers for Calendar Actions
  const handleDateClick = (date) => {
    setSelectedDate(date);
    setEditingPost(null);
    setOpenWithAi(false);
    setComposerOpen(true);
  };

  const handlePostClick = (post) => {
    setViewingPost(post);
  };

  const handleNewPost = () => {
    setSelectedDate(null);
    setEditingPost(null);
    setOpenWithAi(false);
    setComposerOpen(true);
  };

  const handleWriteWithAi = () => {
    setSelectedDate(null);
    setEditingPost(null);
    setOpenWithAi(true);
    setComposerOpen(true);
  };

  const handleEditPost = (post) => {
    setViewingPost(null);
    setEditingPost(post);
    setOpenWithAi(false);
    setComposerOpen(true);
  };

  const handleDeletePost = async (postId) => {
    if (!confirm("Are you sure you want to delete this scheduled post?")) return;

    try {
      setActionLoading(true);
      const res = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        setViewingPost(null);
      }
    } catch (err) {
      console.error("Failed to delete post:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublishNow = async (postId) => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish_now" })
      });
      if (res.ok) {
        const updated = await res.json();
        setViewingPost(updated);
        fetchPosts();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to publish post.");
      }
    } catch (err) {
      console.error(err);
      alert("Error publishing post");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePostSaved = (savedPost) => {
    setPosts((prev) => {
      const idx = prev.findIndex((p) => p.id === savedPost.id);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = savedPost;
        return updated;
      }
      return [savedPost, ...prev];
    });
  };

  // Stats calculation
  const scheduledCount = posts.filter((p) => p.status === "scheduled").length;
  const publishedCount = posts.filter((p) => p.status === "completed").length;
  const uniqueChannels = new Set(posts.map((p) => p.platform)).size;
  const userCredits = session?.user?.credits ?? 0;

  // Unauthenticated Welcome View
  if (status === "unauthenticated") {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-16 bg-zinc-950 text-zinc-100">
        <div className="max-w-2xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-medium">
            <FaRocket className="text-[11px] text-zinc-300" />
            <span>Social Media Scheduling Studio</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-zinc-100 leading-tight">
            Schedule, preview & publish across all your channels
          </h1>

          <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed">
            Manage YouTube, TikTok, Instagram, X (Twitter), and LinkedIn from a clean interactive content calendar with real-time feed previews.
          </p>

          <div className="flex items-center justify-center pt-2">
            <button
              onClick={() => signIn("google")}
              className="px-5 py-2.5 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <FaGoogle className="text-xs text-red-500" />
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-10 text-left">
            <div className="p-4 rounded-lg bg-zinc-900/40 border border-zinc-800/80 space-y-1.5">
              <div className="w-8 h-8 rounded-md bg-zinc-800/60 text-zinc-300 flex items-center justify-center text-xs">
                <FaCalendarAlt />
              </div>
              <h4 className="text-xs font-medium text-zinc-200">
                Content Calendar
              </h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Month & week views with slot clicking and multi-channel post tracking.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-zinc-900/40 border border-zinc-800/80 space-y-1.5">
              <div className="w-8 h-8 rounded-md bg-zinc-800/60 text-zinc-300 flex items-center justify-center text-xs">
                <FaShareAlt />
              </div>
              <h4 className="text-xs font-medium text-zinc-200">
                Live Feed Mockups
              </h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Real-time previews for YouTube, TikTok, Instagram, X, and LinkedIn.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-zinc-900/40 border border-zinc-800/80 space-y-1.5">
              <div className="w-8 h-8 rounded-md bg-zinc-800/60 text-zinc-300 flex items-center justify-center text-xs">
                <FaRocket />
              </div>
              <h4 className="text-xs font-medium text-zinc-200">
                Automated Publishing
              </h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Scheduled background queues publish automatically to connected accounts.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-page text-zinc-100 p-4 sm:p-6 lg:p-8 space-y-6 pb-20">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Studio Active Status & Header */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/80 animate-pulse" />
                <span className="text-[11px] font-bold text-emerald-400 tracking-widest uppercase font-mono">
                  CREATOR STUDIO ACTIVE
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
                SOCIAL MEDIA SCHEDULING CALENDAR
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchPosts}
                className="w-9 h-9 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer flex items-center justify-center shadow-sm"
                title="Refresh calendar"
              >
                <FiRefreshCw className={`text-xs ${loading ? "animate-spin text-white" : ""}`} />
              </button>

              <button
                onClick={handleWriteWithAi}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border border-violet-400/30 transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-violet-600/25 active:scale-95"
                title="Compose post with AI"
              >
                <FaBolt className="text-[11px] text-amber-300" />
                <span>Write with AI</span>
              </button>

              <button
                onClick={handleNewPost}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-600/30 active:scale-95"
              >
                <FiPlus className="text-xs font-bold" />
                <span>CREATE POST</span>
              </button>
            </div>
          </div>

          {/* 4 Prominent Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Card 1: Scheduled */}
            <div className="p-3.5 rounded-lg bg-zinc-900/70 border border-zinc-800/80 flex items-center justify-between shadow-sm">
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-zinc-400 tracking-wider uppercase">
                  SCHEDULED
                </span>
                <p className="text-2xl font-bold text-blue-500 font-mono">
                  {scheduledCount}
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center text-xs shadow-sm shadow-blue-500/20">
                <FaClock />
              </div>
            </div>

            {/* Card 2: Published */}
            <div className="p-3.5 rounded-lg bg-zinc-900/70 border border-zinc-800/80 flex items-center justify-between shadow-sm">
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-zinc-400 tracking-wider uppercase">
                  PUBLISHED
                </span>
                <p className="text-2xl font-bold text-emerald-500 font-mono">
                  {publishedCount}
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-xs shadow-sm shadow-emerald-500/20">
                <FaCheckCircle />
              </div>
            </div>

            {/* Card 3: Connected Channels */}
            <div className="p-3.5 rounded-lg bg-zinc-900/70 border border-zinc-800/80 flex items-center justify-between shadow-sm">
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-zinc-400 tracking-wider uppercase">
                  CONNECTED CHANNELS
                </span>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-purple-500 font-mono">
                    {connectedAccounts.length > 0 ? connectedAccounts.length : uniqueChannels}
                  </p>
                  <Link
                    href="/integrations"
                    className="text-[11px] font-medium text-purple-400 hover:text-purple-300 hover:underline"
                  >
                    + Add
                  </Link>
                </div>
              </div>
              <Link
                href="/integrations"
                className="w-8 h-8 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-400 flex items-center justify-center text-xs shadow-sm shadow-purple-500/20 transition-colors"
                title="Manage Connected Channels"
              >
                <FaShareAlt />
              </Link>
            </div>

            {/* Card 4: Credits Balance */}
            <div className="p-3.5 rounded-lg bg-zinc-900/70 border border-zinc-800/80 flex items-center justify-between shadow-sm">
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-zinc-400 tracking-wider uppercase">
                  CREDITS BALANCE
                </span>
                <p className="text-2xl font-bold text-amber-400 font-mono">
                  {userCredits}
                </p>
              </div>
              <Link
                href="/pricing"
                className="px-3 py-1 rounded-md text-xs font-semibold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 transition-all shadow-sm"
              >
                Top Up
              </Link>
            </div>
          </div>
        </div>

        {/* Content Calendar Main Component */}
        <ContentCalendar
          posts={posts}
          onDateClick={handleDateClick}
          onPostClick={handlePostClick}
          onNewPostClick={handleNewPost}
        />
      </div>

      {/* Post Details / Quick Actions Modal */}
      {viewingPost && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setViewingPost(null)}
        >
          <div 
            className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-lg p-5 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider ${
                  viewingPost.platform === "youtube" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                  viewingPost.platform === "instagram" ? "bg-pink-500/20 text-pink-400 border border-pink-500/30" :
                  viewingPost.platform === "tiktok" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" :
                  viewingPost.platform === "linkedin" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" :
                  viewingPost.platform === "threads" ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" :
                  "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                }`}>
                  {viewingPost.platform}
                </span>
                <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded ${
                  viewingPost.status === "completed" 
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                    : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                }`}>
                  {viewingPost.status}
                </span>
              </div>
              <button
                onClick={() => setViewingPost(null)}
                className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <FiX className="text-base" />
              </button>
            </div>

            {/* Media & Title */}
            {viewingPost.mediaUrl && (
              <div className="aspect-video rounded-lg overflow-hidden border border-zinc-800 bg-black">
                <img
                  src={viewingPost.mediaUrl}
                  alt="Post thumbnail"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <h3 className="text-sm font-semibold text-zinc-100">
                {viewingPost.title || "Untitled Post"}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-line">
                {viewingPost.description || "No description provided."}
              </p>
              {viewingPost.tags && (
                <p className="text-xs text-indigo-400 font-mono">
                  {viewingPost.tags.split(",").map(t => `#${t.trim()}`).join(" ")}
                </p>
              )}
            </div>

            {/* Scheduled Date Info */}
            <div className="p-2.5 bg-zinc-900/60 rounded-lg border border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <FaClock className="text-zinc-400 text-xs" />
                Scheduled for:
              </span>
              <span className="font-medium text-zinc-200 font-mono">
                {viewingPost.scheduledAt ? new Date(viewingPost.scheduledAt).toLocaleString() : "Immediate"}
              </span>
            </div>

            {/* Error Banner if any */}
            {viewingPost.error && (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-start gap-2">
                <FaExclamationTriangle className="text-red-400 text-xs shrink-0 mt-0.5" />
                <span className="leading-normal">{viewingPost.error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleDeletePost(viewingPost.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <FiTrash2 /> Delete
              </button>

              <div className="flex items-center gap-2">
                {viewingPost.status !== "completed" && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handlePublishNow(viewingPost.id)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/25 active:scale-95 disabled:opacity-50"
                  >
                    <FaBolt className="text-[10px]" />
                    <span>{actionLoading ? "Publishing..." : "Publish Now"}</span>
                  </button>
                )}
                {viewingPost.publishedUrl && (
                  <a
                    href={viewingPost.publishedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors flex items-center gap-1.5"
                  >
                    <FiExternalLink /> View Live
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => handleEditPost(viewingPost)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-200 bg-zinc-800 hover:bg-zinc-700 transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <FiEdit2 /> Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Post Composer & Multi-Channel Modal */}
      <PostComposerModal
        isOpen={composerOpen}
        onClose={() => {
          setComposerOpen(false);
          setSelectedDate(null);
          setEditingPost(null);
          setOpenWithAi(false);
        }}
        initialDate={selectedDate}
        initialPost={editingPost}
        onPostSaved={handlePostSaved}
        initialOpenAiWriter={openWithAi}
      />
    </div>
  );
}
