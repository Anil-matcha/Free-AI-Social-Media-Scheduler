"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { FaYoutube, FaGlobe, FaLock, FaExclamationTriangle } from "react-icons/fa";
import { SiTiktok } from "react-icons/si";
import { FiDownload, FiExternalLink, FiSearch, FiFilm, FiRefreshCw } from "react-icons/fi";
import Link from "next/link";

export default function GalleryPage() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");

  useEffect(() => {
    if (session?.user) {
      fetchCompletedPosts();
    } else {
      setLoading(false);
    }
  }, [session]);

  const fetchCompletedPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/posts");
      const data = await res.json();
      if (Array.isArray(data)) {
        // We filter for completed posts
        const completed = data.filter((post) => post.status === "completed");
        setPosts(completed);
      }
    } catch (err) {
      console.error("Error fetching completed posts:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.description && post.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPlatform = platformFilter === "all" || post.platform === platformFilter;
    return matchesSearch && matchesPlatform;
  });

  return (
    <main className="flex-1 min-h-screen bg-zinc-950 px-6 py-12 flex flex-col items-center">
      <div className="max-w-6xl w-full flex flex-col gap-8">
        
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-900 pb-6">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-3xl font-bold tracking-tight text-white">Publishing Gallery</h1>
            <p className="text-xs text-zinc-400">
              Browse and retrieve all successfully published videos from your connected social channels.
            </p>
          </div>
          
          {session?.user && (
            <button
              id="gallery-refresh-btn"
              onClick={fetchCompletedPosts}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer self-start md:self-auto"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          )}
        </div>

        {/* Guest Warning */}
        {!session?.user && (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FaExclamationTriangle className="text-amber-500 text-lg shrink-0" />
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-amber-500">Sign in required</span>
                <span className="text-[11px] text-zinc-400">You must sign in with Google to view your published gallery.</span>
              </div>
            </div>
            <button
              onClick={() => signIn("google")}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
            >
              Sign In
            </button>
          </div>
        )}

        {session?.user && (
          <>
            {/* Filters panel */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-zinc-900/30 p-4 rounded-xl border border-zinc-900">
              {/* Search bar */}
              <div className="relative w-full sm:w-80">
                <FiSearch className="absolute left-3 top-3.5 text-zinc-500 text-sm" />
                <input
                  id="gallery-search-input"
                  type="text"
                  placeholder="Search published posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-violet-500 outline-none rounded-lg py-2.5 pl-9 pr-4 text-xs text-zinc-200 transition-colors"
                />
              </div>

              {/* Platform Filter buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  id="gallery-filter-all"
                  onClick={() => setPlatformFilter("all")}
                  className={`flex-1 sm:flex-none px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    platformFilter === "all"
                      ? "bg-zinc-800 text-white border-zinc-700 shadow-inner"
                      : "bg-transparent text-zinc-400 border-zinc-900 hover:text-zinc-200"
                  }`}
                >
                  All Channels
                </button>
                <button
                  id="gallery-filter-youtube"
                  onClick={() => setPlatformFilter("youtube")}
                  className={`flex-1 sm:flex-none px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    platformFilter === "youtube"
                      ? "bg-zinc-800 text-white border-zinc-700 shadow-inner"
                      : "bg-transparent text-zinc-400 border-zinc-900 hover:text-zinc-200"
                  }`}
                >
                  <FaYoutube className="text-red-500" /> YouTube
                </button>
                <button
                  id="gallery-filter-tiktok"
                  onClick={() => setPlatformFilter("tiktok")}
                  className={`flex-1 sm:flex-none px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    platformFilter === "tiktok"
                      ? "bg-zinc-800 text-white border-zinc-700 shadow-inner"
                      : "bg-transparent text-zinc-400 border-zinc-900 hover:text-zinc-200"
                  }`}
                >
                  <SiTiktok className="text-zinc-100 text-[10px]" /> TikTok
                </button>
              </div>
            </div>

            {/* Main content grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="card-premium h-80 bg-zinc-900/60 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : filteredPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-4">
                {filteredPosts.map((post) => (
                  <div key={post.id} className="card-premium overflow-hidden flex flex-col justify-between group">
                    <div>
                      {/* Video Player */}
                      <div className="aspect-video bg-zinc-900 relative border-b border-zinc-900 flex items-center justify-center overflow-hidden">
                        <video
                          src={post.mediaUrl}
                          controls
                          className="h-full w-full object-contain"
                          preload="metadata"
                        />
                        <div className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded-full bg-zinc-950/80 backdrop-blur-sm border border-zinc-800 flex items-center gap-1">
                          {post.platform === "youtube" ? (
                            <FaYoutube className="text-red-500 text-[10px]" />
                          ) : (
                            <SiTiktok className="text-cyan-400 text-[9px]" />
                          )}
                          <span className="text-[9px] font-semibold text-zinc-300 capitalize">{post.platform}</span>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="p-4 flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9px] font-medium text-zinc-500 uppercase tracking-wider truncate max-w-[150px]">
                            {post.accountName || "Channel"}
                          </span>
                          <span className="text-[9px] text-zinc-500">
                            {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-xs font-bold text-white line-clamp-1 group-hover:text-violet-400 transition-colors">
                          {post.title}
                        </h3>
                        {post.description && (
                          <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">
                            {post.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="px-4 pb-4 pt-2 border-t border-zinc-900 bg-zinc-900/10 flex items-center justify-between gap-4">
                      {post.publishedUrl && post.publishedUrl.startsWith("http") ? (
                        <a
                          id={`gallery-view-live-${post.id}`}
                          href={post.publishedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold text-violet-400 hover:text-violet-300 hover:underline flex items-center gap-1"
                        >
                          View Live <FiExternalLink className="text-[9px]" />
                        </a>
                      ) : (
                        <span className="text-[9px] text-zinc-500">Published successfully</span>
                      )}

                      <a
                        id={`gallery-download-btn-${post.id}`}
                        href={`/api/download?url=${encodeURIComponent(post.mediaUrl)}`}
                        className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                        title="Download Video File"
                      >
                        <FiDownload className="text-xs" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-16 card-premium w-full mt-4 bg-zinc-900/10 border-dashed">
                <div className="h-12 w-12 rounded-full bg-zinc-900/80 flex items-center justify-center text-zinc-500 mb-4 border border-zinc-850">
                  <FiFilm className="text-xl" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">No published videos</h3>
                <p className="text-xs text-zinc-400 max-w-sm mb-6 leading-relaxed">
                  {searchQuery || platformFilter !== "all"
                    ? "No completed posts match your current search queries or platform filter settings."
                    : "You haven't successfully published any videos yet. Head over to the workspace to create your first post."}
                </p>
                {(!searchQuery && platformFilter === "all") && (
                  <Link
                    href="/"
                    className="px-4 py-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-bold text-xs rounded-xl shadow-lg transition-colors cursor-pointer"
                  >
                    Go to Workspace
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
