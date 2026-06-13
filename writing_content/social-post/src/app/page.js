"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect, useRef, useCallback } from "react";
import Navbar from "@/components/Navbar";
import {
  FaCrown,
  FaMagic,
  FaCopy,
  FaCheck,
  FaSpinner,
  FaRegClipboard,
  FaHistory,
  FaGlobe,
  FaLinkedin,
  FaTwitter,
  FaFacebook,
  FaInstagram,
  FaReddit,
  FaLine,
  FaChevronDown,
  FaChevronUp,
  FaGoogle,
} from "react-icons/fa";
import { SOCIAL_PLATFORMS, SOCIAL_TONES, LANGUAGES, LENGTHS } from "@/lib/config";

const PLATFORM_ICONS = {
  FaLinkedin,
  FaTwitter,
  FaFacebook,
  FaInstagram,
  FaReddit,
  FaLine,
};

function PlatformIcon({ iconName, className = "" }) {
  const Icon = PLATFORM_ICONS[iconName] || FaGlobe;
  return <Icon className={className} />;
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

function StatusBadge({ status }) {
  if (status === "processing")
    return (
      <span className="flex items-center gap-1.5 text-xs text-purple-400 font-medium">
        <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse-dot" />
        Processing…
      </span>
    );
  if (status === "completed")
    return (
      <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
        <FaCheck className="text-[10px]" />
        Completed
      </span>
    );
  return (
    <span className="flex items-center gap-1.5 text-xs text-red-400 font-medium">
      Failed
    </span>
  );
}

export default function WorkspacePage() {
  const { data: session, status: authStatus, update: updateSession } = useSession();

  const [topic, setTopic] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState(SOCIAL_PLATFORMS[0]);
  const [selectedTone, setSelectedTone] = useState(SOCIAL_TONES[0]);
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0]);
  const [selectedLength, setSelectedLength] = useState(LENGTHS[1]);
  const [includeEmojis, setIncludeEmojis] = useState(true);
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [includeTitle, setIncludeTitle] = useState(true);

  const [platformOpen, setPlatformOpen] = useState(false);
  const [toneOpen, setToneOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [lenOpen, setLenOpen] = useState(false);

  const platformRef = useRef(null);
  const toneRef = useRef(null);
  const languageRef = useRef(null);
  const lengthRef = useRef(null);

  // Publishing mode state
  const [publishingMode, setPublishingMode] = useState("manual"); // "manual" or "direct"
  const [showDirectPublishModal, setShowDirectPublishModal] = useState(false);
  const [publishingStep, setPublishingStep] = useState(0);
  const [publishingError, setPublishingError] = useState("");
  const [publishTimers, setPublishTimers] = useState([]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (platformRef.current && !platformRef.current.contains(event.target)) {
        setPlatformOpen(false);
      }
      if (toneRef.current && !toneRef.current.contains(event.target)) {
        setToneOpen(false);
      }
      if (languageRef.current && !languageRef.current.contains(event.target)) {
        setLangOpen(false);
      }
      if (lengthRef.current && !lengthRef.current.contains(event.target)) {
        setLenOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [currentCreation, setCurrentCreation] = useState(null);
  const [recentCreations, setRecentCreations] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pollingId, setPollingId] = useState(null);
  
  const pollingRef = useRef(null);
  const creditCost = 4;

  // Fetch recent creations
  const fetchCreations = useCallback(async () => {
    if (!session?.user) return;
    try {
      const res = await fetch("/api/creations");
      if (res.ok) {
        const data = await res.json();
        setRecentCreations(data.slice(0, 6));
        const any = data.some((c) => c.status === "processing");
        return any;
      }
    } catch {}
    return false;
  }, [session]);

  useEffect(() => {
    if (!session?.user) return;
    setLoadingHistory(true);
    fetchCreations().finally(() => setLoadingHistory(false));
    const interval = setInterval(async () => {
      const anyProcessing = await fetchCreations();
      if (anyProcessing) updateSession();
    }, 4000);
    return () => clearInterval(interval);
  }, [session, fetchCreations, updateSession]);

  // Poll for current job
  useEffect(() => {
    if (!pollingId) return;
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/creations?requestId=${pollingId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "completed") {
            // Find creation
            const updatedCreation = data.creation;
            setCurrentCreation(updatedCreation);
            setPollingId(null);
            clearInterval(pollingRef.current);
            fetchCreations();
            updateSession();
          } else if (data.status === "failed") {
            setError(data.error || "Generation failed. Credits refunded.");
            setPollingId(null);
            clearInterval(pollingRef.current);
            fetchCreations();
            updateSession();
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 3000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [pollingId, fetchCreations, updateSession]);

  const handleGenerate = async () => {
    if (!session?.user) return;
    if (!topic || topic.trim() === "") {
      setError("Please describe what your post is about.");
      return;
    }

    setGenerating(true);
    setError("");
    setCopied(false);

    try {
      const res = await fetch("/api/creations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          platformId: selectedPlatform.id,
          toneId: selectedTone.id,
          includeEmojis,
          includeHashtags,
          language: selectedLanguage.id,
          charLength: selectedLength.id,
          includeTitle,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      const creation = await res.json();
      setCurrentCreation(creation);

      if (creation.status === "processing" && creation.requestId) {
        setPollingId(creation.requestId);
      } else {
        setGenerating(false);
        fetchCreations();
        updateSession();
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (currentCreation && currentCreation.status === "completed") {
      setGenerating(false);
    }
  }, [currentCreation]);

  const getParsedText = (creation) => {
    if (!creation || !creation.resultText) return null;
    try {
      return JSON.parse(creation.resultText);
    } catch {
      return { postText: creation.resultText, headline: "AI Social Post", suggestedHashtags: [] };
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDirectPublish = () => {
    setShowDirectPublishModal(true);
    setPublishingStep(0);
    setPublishingError("");

    const timers = [
      setTimeout(() => setPublishingStep(1), 1200),
      setTimeout(() => setPublishingStep(2), 2400),
      setTimeout(() => setPublishingStep(3), 3600),
      setTimeout(() => setPublishingStep(4), 4800)
    ];
    setPublishTimers(timers);
  };

  const closePublishModal = () => {
    publishTimers.forEach(clearTimeout);
    setShowDirectPublishModal(false);
  };

  const currentParsed = getParsedText(currentCreation);
  const canGenerate = topic && topic.trim() !== "" && !generating && (session?.user?.credits ?? 0) >= creditCost;  // Render platform specific preview mock card
  const renderPreviewMock = () => {
    if (!currentCreation || currentCreation.status === "processing") {
      // Shimmer Skeleton
      return (
        <div className="border border-zinc-800 bg-zinc-900/40 rounded-2xl p-6 glow-purple animate-float max-w-lg mx-auto w-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-zinc-800 shimmer" />
            <div className="flex-1">
              <div className="h-3 bg-zinc-800 rounded shimmer w-1/3 mb-2" />
              <div className="h-2 bg-zinc-800 rounded shimmer w-1/5" />
            </div>
          </div>
          <div className="space-y-3 mb-4">
            <div className="h-3 bg-zinc-800 rounded shimmer w-full" />
            <div className="h-3 bg-zinc-800 rounded shimmer w-5/6" />
            <div className="h-3 bg-zinc-800 rounded shimmer w-4/5" />
          </div>
          <div className="h-36 bg-zinc-800/50 rounded-xl shimmer w-full" />
        </div>
      );
    }

    const data = currentParsed;
    if (!data) return null;

    const userAvatar = session?.user?.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200";
    const userName = session?.user?.name || "AI Copywriter";

    if (currentCreation.platform === "LinkedIn") {
      return (
        <div className="border border-zinc-800 bg-zinc-900 rounded-xl p-4 max-w-lg mx-auto w-full text-zinc-100 text-left text-sm animate-slide-up shadow-2xl">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex gap-2">
              <img src={userAvatar} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-zinc-700" />
              <div>
                <h4 className="font-semibold text-xs text-white hover:text-purple-400 transition-colors cursor-pointer">{userName}</h4>
                <p className="text-[10px] text-zinc-400">Social Media Expert • 1st</p>
                <p className="text-[9px] text-zinc-500">2h • Edited • 🌐</p>
              </div>
            </div>
            <span className="text-zinc-500 text-xs font-bold hover:bg-zinc-800 px-2 py-1 rounded cursor-pointer">•••</span>
          </div>
          {/* Body */}
          <div className="whitespace-pre-wrap leading-relaxed text-zinc-200 text-xs mb-3">
            {data.postText}
          </div>
          {/* Footer stats */}
          <div className="border-t border-zinc-800 pt-2 flex items-center justify-between text-[10px] text-zinc-400">
            <span className="flex items-center gap-1">
              <span className="flex -space-x-1">
                <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[8px] text-white">👍</span>
                <span className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center text-[8px] text-white">💡</span>
              </span>
              42 likes
            </span>
            <span>12 comments • 3 shares</span>
          </div>
        </div>
      );
    }

    if (currentCreation.platform === "Twitter / X") {
      const textLen = data.postText.length;
      return (
        <div className="border border-zinc-800 bg-black rounded-xl p-4 max-w-lg mx-auto w-full text-zinc-100 text-left text-sm animate-slide-up shadow-2xl">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex gap-2">
              <img src={userAvatar} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-zinc-700" />
              <div>
                <h4 className="font-semibold text-xs text-white flex items-center gap-1">
                  {userName} 
                  <span className="w-3.5 h-3.5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[7px]">✔</span>
                </h4>
                <p className="text-[10px] text-zinc-500">@{userName.toLowerCase().replace(/\s+/g, "")}</p>
              </div>
            </div>
            <span className="text-zinc-500 font-bold text-xs hover:bg-zinc-900 px-2 py-1 rounded cursor-pointer">•••</span>
          </div>
          {/* Body */}
          <div className="whitespace-pre-wrap leading-relaxed text-zinc-200 text-xs mb-3 font-sans">
            {data.postText}
          </div>
          {/* Timestamp */}
          <p className="text-[9px] text-zinc-500 mb-3 border-b border-zinc-800 pb-2">5:24 PM • May 26, 2026 • 12.4K Views</p>
          {/* Action Footer */}
          <div className="flex justify-between px-2 text-zinc-500 text-xs">
            <span>💬 24</span>
            <span>🔁 18</span>
            <span>❤️ 152</span>
            <span>🔖 8</span>
          </div>
          {textLen > 280 && (
            <div className="mt-3 text-[10px] text-amber-500 bg-amber-500/10 border border-amber-500/20 p-2 rounded">
              ⚠️ Warning: Post is {textLen} characters and exceeds Twitter's 280-character limit. Consider shortening or posting as a thread.
            </div>
          )}
        </div>
      );
    }

    if (currentCreation.platform === "Instagram") {
      return (
        <div className="border border-zinc-800 bg-zinc-900 rounded-xl max-w-lg mx-auto w-full text-zinc-100 text-left text-sm overflow-hidden animate-slide-up shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-zinc-800/60">
            <div className="flex items-center gap-2">
              <img src={userAvatar} alt="avatar" className="w-8 h-8 rounded-full object-cover border border-zinc-700" />
              <div>
                <h4 className="font-semibold text-xs text-white">{userName}</h4>
                <p className="text-[8px] text-zinc-400">Original Audio</p>
              </div>
            </div>
            <span className="text-zinc-400 font-bold text-xs cursor-pointer">•••</span>
          </div>
          {/* Mock Visual Banner */}
          <div className="aspect-video bg-gradient-to-tr from-purple-900/60 to-indigo-900/60 flex flex-col items-center justify-center p-6 border-b border-zinc-800 text-center relative">
            <div className="absolute top-2 right-2 bg-black/60 text-[9px] px-2 py-0.5 rounded-full text-zinc-300 font-medium">1/1</div>
            <FaMagic className="text-3xl text-purple-400 mb-2 animate-float" />
            <h5 className="font-bold text-sm text-white drop-shadow">{data.headline}</h5>
            <p className="text-[9px] text-zinc-300 mt-1 max-w-xs">{topic}</p>
          </div>
          {/* Actions */}
          <div className="p-3">
            <div className="flex justify-between mb-2 text-zinc-300 text-xs">
              <div className="flex gap-3">
                <span>❤️</span>
                <span>💬</span>
                <span>📤</span>
              </div>
              <span>🔖</span>
            </div>
            <p className="font-bold text-[10px] text-white mb-1.5">85 likes</p>
            {/* Caption */}
            <div className="whitespace-pre-wrap leading-relaxed text-zinc-200 text-xs">
              <span className="font-bold text-white mr-1">{userName.toLowerCase().replace(/\s+/g, "")}</span>
              {data.postText}
            </div>
          </div>
        </div>
      );
    }

    if (currentCreation.platform === "Reddit") {
      return (
        <div className="border border-zinc-800 bg-[#1a1a1b] rounded-xl p-4 max-w-lg mx-auto w-full text-zinc-200 text-left text-sm animate-slide-up shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-[#ff4500] flex items-center justify-center text-white shrink-0">
              <FaReddit className="text-xs" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-semibold text-xs text-zinc-100 hover:underline cursor-pointer">r/socialpost</span>
              <span className="text-[10px] text-zinc-500 ml-2">Posted by u/copywriter 2h ago</span>
            </div>
          </div>
          {/* Title */}
          {data.headline && (
            <h3 className="font-bold text-sm text-zinc-100 mb-2 leading-snug">
              {data.headline}
            </h3>
          )}
          {/* Body */}
          <div className="whitespace-pre-wrap leading-relaxed text-zinc-300 text-xs mb-3 font-sans">
            {data.postText}
          </div>
          {/* Action Bar */}
          <div className="flex items-center gap-3 pt-2 border-t border-zinc-800 text-xs text-zinc-400 font-semibold">
            <div className="flex items-center gap-1 bg-[#272729] hover:bg-[#343437] px-2.5 py-1 rounded-full cursor-pointer transition-colors">
              <span className="text-[#ff4500]">▲</span>
              <span className="text-zinc-200 text-xs font-bold">142</span>
              <span>▼</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#272729] hover:bg-[#343437] px-3 py-1 rounded-full cursor-pointer transition-colors text-[10px]">
              <span>💬</span>
              <span>28 Comments</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#272729] hover:bg-[#343437] px-3 py-1 rounded-full cursor-pointer transition-colors text-[10px]">
              <span>📤</span>
              <span>Share</span>
            </div>
          </div>
        </div>
      );
    }

    if (currentCreation.platform === "Line") {
      return (
        <div className="border border-zinc-800 bg-[#8cabd9] rounded-xl p-4 max-w-lg mx-auto w-full text-zinc-800 text-left text-sm animate-slide-up shadow-2xl relative overflow-hidden min-h-[300px] flex flex-col justify-between">
          {/* Chat header */}
          <div className="bg-[#2d3a4d]/95 text-white px-4 py-2.5 flex items-center gap-2 absolute top-0 left-0 right-0 z-10 border-b border-black/10">
            <FaLine className="text-[#06c755] text-xl shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-xs truncate">Broadcast Channel</h4>
              <p className="text-[8px] text-zinc-400">4,204 Friends</p>
            </div>
            <span className="text-zinc-400 text-xs cursor-pointer">🔍 ☰</span>
          </div>

          {/* Chat area */}
          <div className="flex-1 pt-12 pb-3 flex flex-col justify-end">
            <div className="flex items-start gap-2 max-w-[90%]">
              <img src={userAvatar} alt="avatar" className="w-8 h-8 rounded-full object-cover border border-zinc-300/40 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] font-semibold text-zinc-700 mb-0.5 ml-1">{userName}</span>
                <div className="flex items-end gap-1">
                  {/* Chat bubble */}
                  <div className="bg-white text-zinc-900 rounded-2xl rounded-tl-none p-3 shadow-sm text-[11px] leading-relaxed whitespace-pre-wrap select-all font-sans">
                    {data.headline && <p className="font-bold text-[11px] border-b border-zinc-100 pb-1 mb-1 text-zinc-950">{data.headline}</p>}
                    {data.postText}
                  </div>
                  <span className="text-[8px] text-zinc-600 shrink-0 whitespace-nowrap mb-1">5:24 PM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action button inside bubble */}
          <div className="bg-white border-t border-zinc-200 p-2.5 text-center text-xs font-bold text-[#06c755] hover:bg-zinc-50 transition-colors cursor-pointer select-none rounded-lg shadow-sm">
            Share Broadcast Update
          </div>
        </div>
      );
    }

    // Facebook / generic
    return (
      <div className="border border-zinc-800 bg-zinc-900 rounded-xl p-4 max-w-lg mx-auto w-full text-zinc-100 text-left text-sm animate-slide-up shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex gap-2">
            <img src={userAvatar} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-zinc-700" />
            <div>
              <h4 className="font-semibold text-xs text-white">{userName}</h4>
              <p className="text-[9px] text-zinc-400">2h • 🌐</p>
            </div>
          </div>
          <span className="text-zinc-500 text-xs font-bold hover:bg-zinc-800 px-2 py-1 rounded cursor-pointer">•••</span>
        </div>
        {/* Body */}
        <div className="whitespace-pre-wrap leading-relaxed text-zinc-200 text-xs mb-3">
          {data.postText}
        </div>
        {/* Reactions */}
        <div className="border-t border-zinc-800 pt-2 flex items-center justify-between text-[10px] text-zinc-400">
          <span>👍❤️ 89 reactions</span>
          <span>14 comments</span>
        </div>
      </div>
    );
  };

  // Simulated OAuth & Publication Modal
  const renderDirectPublishModal = () => {
    if (!showDirectPublishModal) return null;

    const platform = currentCreation?.platform || "LinkedIn";

    const getPlatformDomain = () => {
      switch (platform) {
        case "LinkedIn":
          return "linkedin.com";
        case "Twitter / X":
          return "x.com";
        case "Facebook":
          return "facebook.com";
        case "Instagram":
          return "instagram.com";
        case "Reddit":
          return "reddit.com";
        case "Line":
          return "line.me";
        default:
          return "x.com";
      }
    };

    const getPlatformIntentUrl = () => {
      const text = currentParsed?.postText || "";
      const headline = currentParsed?.headline || "AI Social Post";
      const shareUrl = "https://socialpost-sites.easysite.ai/generator";

      switch (platform) {
        case "Twitter / X":
          return `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
        case "LinkedIn":
          return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        case "Facebook":
          return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        case "Reddit":
          return `https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(headline)}`;
        case "Line":
          return `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
        default:
          return `https://${getPlatformDomain()}`;
      }
    };
    
    // Connect Platform Icon
    const getPlatformBrandIcon = () => {
      switch (platform) {
        case "LinkedIn":
          return <FaLinkedin className="text-5xl text-[#0a66c2] animate-bounce" />;
        case "Twitter / X":
          return <FaTwitter className="text-5xl text-zinc-300 animate-bounce" />;
        case "Facebook":
          return <FaFacebook className="text-5xl text-[#1877f2] animate-bounce" />;
        case "Instagram":
          return <FaInstagram className="text-5xl text-[#e1306c] animate-bounce" />;
        case "Reddit":
          return <FaReddit className="text-5xl text-[#ff4500] animate-bounce" />;
        case "Line":
          return <FaLine className="text-5xl text-[#06c755] animate-bounce" />;
        default:
          return <FaGlobe className="text-5xl text-purple-400 animate-bounce" />;
      }
    };

    const steps = [
      "Establishing connection to " + platform + " servers...",
      "Exchanging OAuth 2.0 security credentials...",
      "Formatting payload and validating terms policies...",
      "Publishing to your broadcast stream live...",
      "Success! Post published to your " + platform + " account."
    ];

    return (
      <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative animate-scale-up text-center select-none">
          <button
            onClick={closePublishModal}
            className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 text-sm cursor-pointer focus:outline-none"
          >
            ✕
          </button>

          {publishingStep < 4 ? (
            <div className="py-6 flex flex-col items-center">
              {/* Dynamic Connecting Icons */}
              <div className="flex items-center gap-6 mb-6">
                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/30">
                  <FaMagic className="text-xl text-purple-400 animate-pulse" />
                </div>
                <div className="flex gap-1.5 items-center">
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
                  <span className="w-2 h-2 rounded-full bg-purple-500/60 animate-ping [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-purple-500/30 animate-ping [animation-delay:0.4s]" />
                </div>
                <div className="w-12 h-12 rounded-full bg-zinc-950 flex items-center justify-center border border-zinc-800">
                  {getPlatformBrandIcon()}
                </div>
              </div>

              <h3 className="text-sm font-bold text-zinc-200 mb-2">Simulating Direct Connection</h3>
              <p className="text-xs text-purple-400 font-semibold mb-6 animate-pulse min-h-[16px]">
                {steps[publishingStep]}
              </p>

              {/* Progress Stepper UI */}
              <div className="w-full space-y-3.5 text-left max-w-xs mx-auto">
                {[0, 1, 2, 3].map((stepIdx) => {
                  const stepLabel = [
                    "Connect Channel Gateway",
                    "OAuth Secure Handshake",
                    "Syntactic Verification",
                    "Publish Broadcast Live"
                  ][stepIdx];

                  const isActive = publishingStep === stepIdx;
                  const isCompleted = publishingStep > stepIdx;

                  return (
                    <div key={stepIdx} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${
                        isCompleted
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                          : isActive
                            ? "bg-purple-600/30 border-purple-500 text-purple-400 animate-pulse"
                            : "bg-zinc-950 border-zinc-800 text-zinc-650"
                      }`}>
                        {isCompleted ? "✓" : stepIdx + 1}
                      </div>
                      <span className={`text-[11px] font-medium transition-colors ${
                        isCompleted
                          ? "text-zinc-500 line-through"
                          : isActive
                            ? "text-purple-400 font-bold"
                            : "text-zinc-600"
                      }`}>
                        {stepLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-6 flex flex-col items-center animate-slide-up">
              {/* Completed Celebration screen */}
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4 animate-bounce">
                <FaCheck className="text-2xl text-emerald-400" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Published Successfully!</h3>
              <p className="text-xs text-zinc-400 max-w-xs leading-relaxed mb-6">
                Your post was compiled for <span className="font-semibold text-zinc-200">{platform}</span>. Click the button below to pre-fill the composer window live!
              </p>

              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 w-full text-left max-w-xs mx-auto mb-6">
                <div className="flex items-center justify-between text-[9px] text-zinc-500 uppercase font-semibold mb-1">
                  <span>Intent URL Gateway</span>
                  <span className="text-emerald-400 font-bold">Ready</span>
                </div>
                <div className="text-[10px] text-zinc-350 font-mono truncate select-all">
                  https://{getPlatformDomain()}/share-intent-gateway
                </div>
              </div>

              <div className="flex gap-3 w-full justify-center">
                <button
                  type="button"
                  onClick={closePublishModal}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-350 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Close Window
                </button>
                <a
                  href={getPlatformIntentUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-emerald-500/15 cursor-pointer text-center flex items-center justify-center"
                >
                  Launch & Post
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col md:flex-row md:overflow-hidden overflow-y-auto max-w-7xl w-full mx-auto px-4 py-4 gap-4">
        {/* ─────────────── LEFT CONTROL PANEL ─────────────── */}
        <div className="w-full md:w-[400px] shrink-0 flex flex-col gap-4 md:overflow-y-auto overflow-visible pb-4">
          
          {/* Scaffolding Form Card */}
          <div className="rounded bg-zinc-900 border border-zinc-800 p-4">
            <h2 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
              <FaMagic className="text-purple-500 text-xs" />
              Describe Your Post
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">What is this post about?</label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. 3 strategies we used to scale our startup to 10k users in a month using dynamic automation..."
                  rows={4}
                  className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all resize-none"
                />
              </div>

              {/* Platform Selector Dropdown */}
              <div className="relative" ref={platformRef}>
                <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Choose Platform</label>
                <button
                  type="button"
                  onClick={() => setPlatformOpen(prev => !prev)}
                  className="w-full flex items-center justify-between gap-2 p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-left text-zinc-200 hover:border-purple-500/40 focus:outline-none transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <PlatformIcon iconName={selectedPlatform.iconName} className={`${selectedPlatform.color} text-sm shrink-0`} />
                    <span className="text-xs font-semibold">{selectedPlatform.name}</span>
                  </div>
                  {platformOpen ? <FaChevronUp className="text-zinc-500 text-xs" /> : <FaChevronDown className="text-zinc-500 text-xs" />}
                </button>
                {platformOpen && (
                  <div className="absolute z-50 w-full bg-zinc-900 border border-zinc-800 rounded-lg mt-1.5 py-1 shadow-2xl animate-slide-up overscroll-contain max-h-60 overflow-y-auto">
                    {SOCIAL_PLATFORMS.map((platform) => {
                      const isSelected = selectedPlatform.id === platform.id;
                      return (
                        <button
                          key={platform.id}
                          type="button"
                          onClick={() => {
                            setSelectedPlatform(platform);
                            setPlatformOpen(false);
                          }}
                          className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-zinc-800 transition-colors cursor-pointer ${
                            isSelected ? "bg-purple-500/10 text-purple-400 font-semibold" : "text-zinc-400"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <PlatformIcon iconName={platform.iconName} className={`${platform.color} text-sm shrink-0`} />
                            <span className="text-xs">{platform.name}</span>
                          </div>
                          {isSelected && <FaCheck className="text-[10px] text-purple-400" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tone Selector Dropdown */}
              <div className="relative" ref={toneRef}>
                <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Select Tone of Voice</label>
                <button
                  type="button"
                  onClick={() => setToneOpen(prev => !prev)}
                  className="w-full flex items-center justify-between gap-2 p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-left text-zinc-200 hover:border-purple-500/40 focus:outline-none transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{selectedTone.emoji}</span>
                    <span className="text-xs font-semibold">{selectedTone.name}</span>
                  </div>
                  {toneOpen ? <FaChevronUp className="text-zinc-500 text-xs" /> : <FaChevronDown className="text-zinc-500 text-xs" />}
                </button>
                {toneOpen && (
                  <div className="absolute z-50 w-full bg-zinc-900 border border-zinc-800 rounded-lg mt-1.5 py-1 shadow-2xl animate-slide-up overscroll-contain max-h-60 overflow-y-auto">
                    {SOCIAL_TONES.map((tone) => {
                      const isSelected = selectedTone.id === tone.id;
                      return (
                        <button
                          key={tone.id}
                          type="button"
                          onClick={() => {
                            setSelectedTone(tone);
                            setToneOpen(false);
                          }}
                          className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-zinc-800 transition-colors cursor-pointer ${
                            isSelected ? "bg-purple-500/10 text-purple-400 font-semibold" : "text-zinc-400"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{tone.emoji}</span>
                            <span className="text-xs">{tone.name}</span>
                          </div>
                          {isSelected && <FaCheck className="text-[10px] text-purple-400" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Language Selector Dropdown */}
              <div className="relative" ref={languageRef}>
                <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Select Language</label>
                <button
                  type="button"
                  onClick={() => setLangOpen(prev => !prev)}
                  className="w-full flex items-center justify-between gap-2 p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-left text-zinc-200 hover:border-purple-500/40 focus:outline-none transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{selectedLanguage.flag}</span>
                    <span className="text-xs font-semibold">{selectedLanguage.name}</span>
                  </div>
                  {langOpen ? <FaChevronUp className="text-zinc-500 text-xs" /> : <FaChevronDown className="text-zinc-500 text-xs" />}
                </button>
                {langOpen && (
                  <div className="absolute z-50 w-full bg-zinc-900 border border-zinc-800 rounded-lg mt-1.5 py-1 shadow-2xl animate-slide-up overscroll-contain max-h-60 overflow-y-auto">
                    {LANGUAGES.map((lang) => {
                      const isSelected = selectedLanguage.id === lang.id;
                      return (
                        <button
                          key={lang.id}
                          type="button"
                          onClick={() => {
                            setSelectedLanguage(lang);
                            setLangOpen(false);
                          }}
                          className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-zinc-800 transition-colors cursor-pointer ${
                            isSelected ? "bg-purple-500/10 text-purple-400 font-semibold" : "text-zinc-400"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{lang.flag}</span>
                            <span className="text-xs">{lang.name}</span>
                          </div>
                          {isSelected && <FaCheck className="text-[10px] text-purple-400" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Character Length Selector Dropdown */}
              <div className="relative" ref={lengthRef}>
                <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Character Length</label>
                <button
                  type="button"
                  onClick={() => setLenOpen(prev => !prev)}
                  className="w-full flex items-center justify-between gap-2 p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-left text-zinc-200 hover:border-purple-500/40 focus:outline-none transition-all cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold block truncate">{selectedLength.name}</span>
                  </div>
                  {lenOpen ? <FaChevronUp className="text-zinc-500 text-xs" /> : <FaChevronDown className="text-zinc-500 text-xs" />}
                </button>
                {lenOpen && (
                  <div className="absolute z-50 w-full bg-zinc-900 border border-zinc-800 rounded-lg mt-1.5 py-1 shadow-2xl animate-slide-up overscroll-contain max-h-60 overflow-y-auto">
                    {LENGTHS.map((len) => {
                      const isSelected = selectedLength.id === len.id;
                      return (
                        <button
                          key={len.id}
                          type="button"
                          onClick={() => {
                            setSelectedLength(len);
                            setLenOpen(false);
                          }}
                          className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-zinc-850 transition-colors cursor-pointer ${
                            isSelected ? "bg-purple-500/10 text-purple-400 font-semibold" : "text-zinc-400"
                          }`}
                        >
                          <span className="text-xs text-left leading-normal">{len.name}</span>
                          {isSelected && <FaCheck className="text-[10px] text-purple-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Custom Sliding Toggle Switches */}
              <div className="border-t border-zinc-800 pt-3 flex flex-col gap-3">
                <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => setIncludeEmojis(p => !p)}>
                  <span className="text-xs text-zinc-400 font-medium">Include Emojis</span>
                  <button
                    type="button"
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors relative focus:outline-none cursor-pointer ${
                      includeEmojis ? "bg-purple-600 shadow-md shadow-purple-500/10" : "bg-zinc-800"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-all shadow-sm ${
                        includeEmojis ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => setIncludeHashtags(p => !p)}>
                  <span className="text-xs text-zinc-400 font-medium">Include Hashtags</span>
                  <button
                    type="button"
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors relative focus:outline-none cursor-pointer ${
                      includeHashtags ? "bg-purple-600 shadow-md shadow-purple-500/10" : "bg-zinc-800"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-all shadow-sm ${
                        includeHashtags ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => setIncludeTitle(p => !p)}>
                  <span className="text-xs text-zinc-400 font-medium">Include Title / Headline</span>
                  <button
                    type="button"
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors relative focus:outline-none cursor-pointer ${
                      includeTitle ? "bg-purple-600 shadow-md shadow-purple-500/10" : "bg-zinc-800"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-all shadow-sm ${
                        includeTitle ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Action Button */}
              <div className="border-t border-zinc-800 pt-3">
                {session ? (
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-2">
                      <span>Cost per generation</span>
                      <span>Your balance</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold mb-3">
                      <span className="text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-lg">⚡ {creditCost} credits</span>
                      <span className={`px-2.5 py-1 rounded-lg border ${
                        (session.user.credits ?? 0) >= creditCost 
                          ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" 
                          : "text-rose-400 bg-rose-500/10 border-rose-500/20 animate-pulse"
                      }`}>
                        {session.user.credits ?? 0} credits
                      </span>
                    </div>

                    {error && (
                      <div className="mb-3 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2">
                        <span>⚠️</span>
                        <span className="flex-1 leading-normal">{error}</span>
                      </div>
                    )}

                    <button
                      onClick={handleGenerate}
                      disabled={!canGenerate}
                      className={`w-full py-2.5 rounded text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        canGenerate
                          ? "bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:via-fuchsia-500 hover:to-indigo-500 text-white shadow-xl hover:shadow-purple-500/30 hover:scale-[1.01] active:scale-[0.99] border-t border-purple-400/20"
                          : "bg-zinc-850 text-zinc-600 border border-zinc-800/80 cursor-not-allowed"
                      }`}
                    >
                      {generating ? (
                        <>
                          <FaSpinner className="animate-spin text-sm" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FaMagic className="text-[10px]" />
                          Generate Social Post
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-zinc-500 text-center mb-3">Please sign in with Google to generate high-engagement social media posts.</p>
                    <button
                      onClick={() => signIn("google")}
                      className="w-full py-2.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-bold transition-all flex items-center justify-center gap-2 border border-zinc-700 cursor-pointer"
                    >
                      <FaGoogle />
                      Sign in with Google
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─────────────── RIGHT PREVIEW PANEL ─────────────── */}
        <div className="flex-1 flex flex-col gap-4 md:overflow-hidden overflow-visible">
          
          {/* Main Showcase Preview */}
          <div className="flex-1 rounded bg-zinc-900 border border-zinc-800 overflow-hidden flex flex-col min-h-[400px]">
            {currentCreation ? (
              <div className="flex flex-col h-full">
                {/* Preview Header */}
                <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-300">Social Media Live Feed Preview</span>
                    <StatusBadge status={currentCreation.status} />
                  </div>
                  {currentCreation.status === "completed" && currentParsed && (
                    <button
                      onClick={() => handleCopy(currentParsed.postText)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold hover:bg-purple-500/20 transition-all cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <FaCheck className="text-[10px] text-emerald-400" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <FaCopy className="text-[10px]" />
                          Copy Post
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Preview Frame */}
                <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center bg-zinc-950/40">
                  {generating && currentCreation.status === "processing" ? (
                    <div className="flex flex-col items-center justify-center gap-4 text-center">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full border-2 border-purple-500/10 border-t-purple-500 animate-spin" />
                        <div className="absolute -inset-1 rounded-full border-2 border-purple-500/30 animate-ping" />
                      </div>
                      <div>
                        <p className="text-sm text-zinc-300 font-semibold">Creating your high-impact social post…</p>
                        <p className="text-[10px] text-zinc-500 mt-1 max-w-xs leading-normal">MuAPI is running predictions using large language models. This takes 5-10 seconds.</p>
                      </div>
                    </div>
                  ) : (
                    renderPreviewMock()
                  )}
                </div>

                {/* Publishing Controls Panel */}
                {currentCreation.status === "completed" && currentParsed && (
                  <div className="border-t border-zinc-800 bg-zinc-950 p-4 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
                    {/* Method Selector */}
                    <div className="flex items-center gap-2 bg-zinc-900 p-1 rounded-lg border border-zinc-800 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setPublishingMode("manual")}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
                          publishingMode === "manual"
                            ? "bg-zinc-800 text-white shadow-md border border-zinc-700/50"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        <FaRegClipboard className="text-[10px]" />
                        Manual Copy
                      </button>
                      <button
                        type="button"
                        onClick={() => setPublishingMode("direct")}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
                          publishingMode === "direct"
                            ? "bg-purple-600/25 border border-purple-500/40 text-purple-300 shadow-md"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        <FaCrown className="text-[10px] text-purple-400" />
                        Direct Publish
                      </button>
                    </div>

                    {/* Action Button */}
                    {publishingMode === "manual" ? (
                      <button
                        onClick={() => handleCopy(currentParsed.postText)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-bold transition-all cursor-pointer"
                      >
                        {copied ? (
                          <>
                            <FaCheck className="text-xs text-emerald-400" />
                            Copied to Clipboard!
                          </>
                        ) : (
                          <>
                            <FaCopy className="text-xs text-purple-400" />
                            Copy to Clipboard
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={handleDirectPublish}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:via-fuchsia-500 hover:to-indigo-500 text-white text-xs font-bold transition-all hover:shadow-lg hover:shadow-purple-500/20 active:scale-[0.99] border-t border-purple-400/20 cursor-pointer"
                      >
                        <FaMagic className="text-xs animate-pulse" />
                        Directly Publish to {currentCreation.platform}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Static Placeholder Showcase */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-zinc-950/20 animate-slide-up">
                <div className="w-16 h-16 rounded-full bg-zinc-800/80 flex items-center justify-center shadow-lg border border-zinc-700/50 mb-4 animate-float">
                  <FaRegClipboard className="text-xl text-purple-500" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-300 mb-1">Generate High-Engagement Copies</h3>
                <p className="text-xs text-zinc-500 max-w-sm leading-relaxed mb-6">
                  Input your topic on the left, choose your platform and tone of voice, and generate optimized social posts in seconds.
                </p>
                <div className="grid grid-cols-2 gap-3 max-w-md w-full">
                  {SOCIAL_PLATFORMS.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-2.5 rounded-lg text-left">
                      <PlatformIcon iconName={p.iconName} className={`${p.color} text-sm shrink-0`} />
                      <div>
                        <h4 className="text-[10px] font-semibold text-zinc-300">{p.name} Format</h4>
                        <p className="text-[8px] text-zinc-600">Optimized structure</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* History Gallery list */}
          {recentCreations.length > 0 && (
            <div className="rounded bg-zinc-900 border border-zinc-800 p-4">
              <div className="flex items-center justify-between mb-3 border-b border-zinc-850 pb-2">
                <h3 className="text-xs font-bold text-zinc-400 flex items-center gap-2">
                  <FaHistory className="text-purple-500 text-xs" />
                  Recent Generations
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {recentCreations.map((c) => {
                  const data = getParsedText(c);
                  return (
                    <div
                      key={c.id}
                      onClick={() => c.status === "completed" && setCurrentCreation(c)}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-all hover:scale-[1.01] ${
                        currentCreation?.id === c.id
                          ? "bg-purple-500/5 border-purple-500/40"
                          : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-bold text-zinc-200 flex items-center gap-1.5">
                          {getPlatformIcon(c.platform)}
                          {c.platform}
                        </span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-semibold">{c.tone}</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed mb-1.5">
                        {c.topic}
                      </p>
                      <p className="text-[8px] text-zinc-600">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
      {renderDirectPublishModal()}
    </div>
  );
}
