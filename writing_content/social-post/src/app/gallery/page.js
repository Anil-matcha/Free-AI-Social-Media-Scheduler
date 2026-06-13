"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import {
  FaImages,
  FaMagic,
  FaCopy,
  FaCheck,
  FaSpinner,
  FaTimes,
  FaGoogle,
  FaShare,
  FaLinkedin,
  FaTwitter,
  FaFacebook,
  FaInstagram,
  FaReddit,
  FaLine,
  FaGlobe,
} from "react-icons/fa";

function StatusDot({ status }) {
  if (status === "processing")
    return <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse-dot inline-block" />;
  if (status === "completed")
    return <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />;
  return <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />;
}

const getPlatformIcon = (platformName) => {
  switch (platformName) {
    case "LinkedIn":
      return <FaLinkedin className="text-[#0a66c2]" />;
    case "Twitter / X":
      return <FaTwitter className="text-zinc-300" />;
    case "Facebook":
      return <FaFacebook className="text-[#1877f2]" />;
    case "Instagram":
      return <FaInstagram className="text-[#e1306c]" />;
    case "Reddit":
      return <FaReddit className="text-[#ff4500]" />;
    case "Line":
      return <FaLine className="text-[#06c755]" />;
    default:
      return <FaGlobe className="text-zinc-400" />;
  }
};

export default function GalleryPage() {
  const { data: session, status: authStatus } = useSession();
  const [creations, setCreations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const fetchAll = async () => {
    if (!session?.user) return;
    try {
      const res = await fetch("/api/creations");
      if (res.ok) setCreations(await res.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    if (!session?.user) return;
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, [session]);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (authStatus === "unauthenticated") {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center gap-6">
          <FaImages className="text-5xl text-zinc-700" />
          <div>
            <h1 className="text-2xl font-bold text-zinc-300 mb-2">Post Gallery</h1>
            <p className="text-zinc-500 text-sm mb-6">Sign in to see all your generated social media posts.</p>
          </div>
          <button
            onClick={() => signIn("google")}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold text-sm"
          >
            <FaGoogle />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  const completed = creations.filter((c) => c.status === "completed");
  const processing = creations.filter((c) => c.status === "processing");

  const getParsedText = (creation) => {
    if (!creation || !creation.resultText) return null;
    try {
      return JSON.parse(creation.resultText);
    } catch {
      return { postText: creation.resultText, headline: "AI Social Post", suggestedHashtags: [] };
    }
  };

  const renderModalPreview = (item) => {
    const data = getParsedText(item);
    if (!data) return null;

    const userAvatar = session?.user?.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200";
    const userName = session?.user?.name || "AI Copywriter";

    if (item.platform === "LinkedIn") {
      return (
        <div className="border border-zinc-800 bg-zinc-950 rounded-xl p-4 w-full text-zinc-100 text-left text-xs mb-4">
          <div className="flex items-center gap-2 mb-3">
            <img src={userAvatar} alt="avatar" className="w-8 h-8 rounded-full object-cover border border-zinc-700 shrink-0" />
            <div>
              <h4 className="font-semibold text-white">{userName}</h4>
              <p className="text-[9px] text-zinc-500">Social Media Expert • 1st</p>
            </div>
          </div>
          <div className="whitespace-pre-wrap leading-relaxed text-zinc-200 mb-3">
            {data.postText}
          </div>
        </div>
      );
    }

    if (item.platform === "Twitter / X") {
      return (
        <div className="border border-zinc-800 bg-black rounded-xl p-4 w-full text-zinc-100 text-left text-xs mb-4">
          <div className="flex items-center gap-2 mb-3">
            <img src={userAvatar} alt="avatar" className="w-8 h-8 rounded-full object-cover border border-zinc-700 shrink-0" />
            <div>
              <h4 className="font-semibold text-white flex items-center gap-1">
                {userName}
                <span className="w-3 h-3 rounded-full bg-blue-500 text-white flex items-center justify-center text-[6px]">✔</span>
              </h4>
              <p className="text-[9px] text-zinc-500">@{userName.toLowerCase().replace(/\s+/g, "")}</p>
            </div>
          </div>
          <div className="whitespace-pre-wrap leading-relaxed text-zinc-200 mb-3 font-sans">
            {data.postText}
          </div>
        </div>
      );
    }

    if (item.platform === "Instagram") {
      return (
        <div className="border border-zinc-800 bg-zinc-950 rounded-xl w-full text-zinc-100 text-left text-xs overflow-hidden mb-4">
          <div className="flex items-center gap-2 p-2 border-b border-zinc-900">
            <img src={userAvatar} alt="avatar" className="w-6 h-6 rounded-full object-cover shrink-0" />
            <h4 className="font-semibold text-[10px] text-white">{userName}</h4>
          </div>
          <div className="aspect-video bg-gradient-to-tr from-purple-900/60 to-indigo-900/60 flex flex-col items-center justify-center p-4 text-center">
            <h5 className="font-bold text-xs text-white">{data.headline}</h5>
            <p className="text-[8px] text-zinc-400 mt-1 max-w-xs">{item.topic}</p>
          </div>
          <div className="p-3">
            <div className="whitespace-pre-wrap leading-relaxed text-zinc-250">
              <span className="font-bold text-white mr-1">{userName.toLowerCase().replace(/\s+/g, "")}</span>
              {data.postText}
            </div>
          </div>
        </div>
      );
    }

    if (item.platform === "Reddit") {
      return (
        <div className="border border-zinc-800 bg-[#1a1a1b] rounded-xl p-4 w-full text-zinc-200 text-left text-xs mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-full bg-[#ff4500] flex items-center justify-center text-white shrink-0">
              <FaReddit className="text-[10px]" />
            </div>
            <div>
              <span className="font-semibold text-[10px] text-zinc-100 hover:underline cursor-pointer">r/socialpost</span>
              <span className="text-[9px] text-zinc-500 ml-2">Posted by u/copywriter 2h ago</span>
            </div>
          </div>
          {data.headline && (
            <h3 className="font-bold text-xs text-zinc-100 mb-2 leading-snug">
              {data.headline}
            </h3>
          )}
          <div className="whitespace-pre-wrap leading-relaxed text-zinc-300 mb-3 font-sans">
            {data.postText}
          </div>
        </div>
      );
    }

    if (item.platform === "Line") {
      return (
        <div className="border border-zinc-800 bg-[#8cabd9] rounded-xl p-4 w-full text-zinc-800 text-left text-xs relative overflow-hidden min-h-[180px] flex flex-col justify-between mb-4">
          <div className="flex items-start gap-2 max-w-[90%] pt-2">
            <img src={userAvatar} alt="avatar" className="w-6 h-6 rounded-full object-cover shrink-0 border border-zinc-300" />
            <div className="flex flex-col">
              <span className="text-[8px] font-semibold text-zinc-650 mb-0.5 ml-1">{userName}</span>
              <div className="flex items-end gap-1">
                <div className="bg-white text-zinc-900 rounded-xl rounded-tl-none p-2.5 shadow-sm leading-normal whitespace-pre-wrap font-sans text-[10px]">
                  {data.headline && <p className="font-bold text-[10px] border-b border-zinc-100 pb-0.5 mb-0.5 text-zinc-950">{data.headline}</p>}
                  {data.postText}
                </div>
                <span className="text-[7px] text-zinc-600 shrink-0 whitespace-nowrap mb-0.5">5:24 PM</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="border border-zinc-800 bg-zinc-950 rounded-xl p-4 w-full text-zinc-100 text-left text-xs mb-4">
        <div className="whitespace-pre-wrap leading-relaxed text-zinc-200 mb-3">
          {data.postText}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <FaImages className="text-purple-500" />
              Social Post Gallery
            </h1>
            <p className="text-zinc-500 text-sm mt-1">{creations.length} post{creations.length !== 1 ? "s" : ""} created</p>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            {processing.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium">
                <FaSpinner className="animate-spin text-[10px]" />
                {processing.length} generating
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <FaSpinner className="animate-spin text-purple-500 text-2xl" />
              <p className="text-zinc-500 text-sm">Loading your posts…</p>
            </div>
          </div>
        ) : creations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
              <FaMagic className="text-3xl text-zinc-700 animate-float" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-400 mb-2">No posts yet</h2>
            <p className="text-zinc-600 text-sm mb-6">Create your first social media post in the Studio.</p>
            <a
              href="/"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-sm font-bold shadow-lg"
            >
              Go to Studio →
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {creations.map((c) => {
              const data = getParsedText(c);
              const isCopied = copiedId === c.id;
              return (
                <div
                  key={c.id}
                  className="group relative rounded-xl border border-zinc-800 hover:border-purple-500/40 transition-all cursor-pointer bg-zinc-900 flex flex-col p-4"
                  onClick={() => c.status === "completed" && data && setSelectedItem(c)}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-2 shrink-0">
                    <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                      {getPlatformIcon(c.platform)}
                      {c.platform}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <StatusDot status={c.status} />
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-semibold">{c.tone}</span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="flex-1 flex flex-col justify-between min-h-[100px]">
                    {c.status === "processing" ? (
                      <div className="flex-1 flex flex-col items-center justify-center gap-2">
                        <FaSpinner className="animate-spin text-purple-500 text-sm" />
                        <span className="text-[9px] text-zinc-500 font-medium">Generating content...</span>
                      </div>
                    ) : c.status === "completed" && data ? (
                      <>
                        <p className="text-xs text-zinc-400 line-clamp-4 leading-normal mb-3 whitespace-pre-wrap">
                          {data.postText}
                        </p>
                        <div className="flex gap-1.5 justify-end mt-auto pt-3 border-t border-zinc-850 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(c.id, data.postText);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded bg-purple-500 text-white text-[9px] font-bold"
                          >
                            {isCopied ? <FaCheck className="text-[8px]" /> : <FaCopy className="text-[8px]" />}
                            {isCopied ? "Copied" : "Copy"}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center gap-1">
                        <span className="text-red-500 text-xs">⚠️ Generation failed</span>
                        <p className="text-[8px] text-zinc-600 text-center leading-normal mt-1">{c.error || "Model error"}</p>
                      </div>
                    )}
                  </div>

                  {/* Card Footer Date */}
                  <div className="text-[9px] text-zinc-600 mt-2 shrink-0 border-t border-zinc-850 pt-2 flex justify-between">
                    <span>Topic: {c.topic.substring(0, 15)}...</span>
                    <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Detail Lightbox Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="relative max-w-lg w-full rounded-2xl overflow-hidden border border-zinc-700 shadow-2xl bg-zinc-900 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-black/70 hover:bg-red-600 text-white transition-all"
            >
              <FaTimes className="text-xs" />
            </button>
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <FaMagic className="text-purple-500 text-xs" />
              AI Copy Showcase Details
            </h3>

            {renderModalPreview(selectedItem)}

            <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
              <div>
                <p className="text-xs font-semibold text-zinc-300">{selectedItem.platform} Feed Card</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Generated {new Date(selectedItem.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>
              </div>
              <button
                onClick={() => {
                  const data = getParsedText(selectedItem);
                  if (data) handleCopy(selectedItem.id, data.postText);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-xs font-bold hover:from-purple-400 hover:to-indigo-500 transition-all shadow-lg hover:shadow-purple-500/20"
              >
                {copiedId === selectedItem.id ? <FaCheck className="text-xs text-emerald-400" /> : <FaCopy className="text-xs" />}
                {copiedId === selectedItem.id ? "Copied Post!" : "Copy Post"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
