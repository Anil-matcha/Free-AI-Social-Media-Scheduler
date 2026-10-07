"use client";

import { useState, useEffect } from "react";
import { FaYoutube, FaInstagram, FaFacebook, FaLinkedin, FaPinterest, FaCheckCircle, FaGlobeAmericas } from "react-icons/fa";
import { FaXTwitter, FaThreads } from "react-icons/fa6";
import { SiTiktok } from "react-icons/si";
import { 
  FiHeart, 
  FiMessageCircle, 
  FiShare2, 
  FiBookmark, 
  FiRepeat, 
  FiMoreHorizontal, 
  FiPlay, 
  FiThumbsUp, 
  FiThumbsDown,
  FiSend,
  FiPlus,
  FiMusic,
  FiBarChart2
} from "react-icons/fi";

export default function LiveDevicePreview({
  platform = "youtube",
  selectedPlatforms = null,
  onSelectPlatform = null,
  title = "",
  description = "",
  tags = "",
  mediaUrl = "",
  accountName = "Creator Studio",
}) {
  const [activePreviewTab, setActivePreviewTab] = useState(platform);

  // Synchronize active preview tab whenever the composer's selected platform changes
  useEffect(() => {
    if (platform) {
      setActivePreviewTab(platform);
    }
  }, [platform]);

  const displayTitle = title || "Your engaging post title goes here...";
  const displayDescription = description || "Write an engaging description, hook your audience, and add hashtags to boost reach!";
  const displayMedia = mediaUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60";
  const displayAccount = accountName || "Creator Studio";
  const handle = "@" + displayAccount.toLowerCase().replace(/[^a-z0-9_]/g, "");

  const previewTabs = [
    { key: "youtube", name: "YouTube", Icon: FaYoutube, color: "text-red-500", activeStyle: "bg-red-500/20 text-red-400 border border-red-500/40 shadow-sm shadow-red-500/20" },
    { key: "tiktok", name: "TikTok", Icon: SiTiktok, color: "text-cyan-400", activeStyle: "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm shadow-cyan-500/20" },
    { key: "instagram", name: "Instagram", Icon: FaInstagram, color: "text-pink-500", activeStyle: "bg-pink-500/20 text-pink-400 border border-pink-500/40 shadow-sm shadow-pink-500/20" },
    { key: "x_twitter", name: "X", Icon: FaXTwitter, color: "text-sky-400", activeStyle: "bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-sm shadow-sky-500/20" },
    { key: "facebook", name: "Facebook", Icon: FaFacebook, color: "text-blue-600", activeStyle: "bg-blue-600/20 text-blue-400 border border-blue-600/40 shadow-sm shadow-blue-600/20" },
    { key: "linkedin", name: "LinkedIn", Icon: FaLinkedin, color: "text-blue-500", activeStyle: "bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-sm shadow-blue-500/20" },
    { key: "threads", name: "Threads", Icon: FaThreads, color: "text-purple-400", activeStyle: "bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-sm shadow-purple-500/20" },
    { key: "pinterest", name: "Pinterest", Icon: FaPinterest, color: "text-rose-500", activeStyle: "bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm shadow-rose-500/20" },
  ];

  return (
    <div className="flex flex-col h-full bg-zinc-950/50 rounded-lg border border-zinc-800 p-3.5 sm:p-4 overflow-hidden">
      {/* Header & Platform Switcher Tabs */}
      <div className="flex flex-col justify-between pb-3 mb-3 border-b border-zinc-800/80 gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse" />
            <span className="text-[11px] font-semibold text-zinc-300">
              Live Feed Mockup
            </span>
          </div>
          {selectedPlatforms && selectedPlatforms.length > 1 && (
            <span className="text-[10px] text-zinc-500 font-mono">
              Previewing {activePreviewTab}
            </span>
          )}
        </div>

        {/* Multi-Platform Preview Switcher Tabs */}
        {selectedPlatforms && selectedPlatforms.length > 1 && (
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
            {previewTabs
              .filter((tab) => selectedPlatforms.includes(tab.key))
              .map((tab) => {
                const Icon = tab.Icon;
                const isActive = activePreviewTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setActivePreviewTab(tab.key);
                      if (onSelectPlatform) onSelectPlatform(tab.key);
                    }}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                      isActive
                        ? tab.activeStyle
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                    }`}
                    title={`Preview on ${tab.name}`}
                  >
                    <Icon className={`text-xs ${isActive ? "text-current" : tab.color}`} />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
          </div>
        )}
      </div>

      {/* Device Mockup Canvas */}
      <div className="flex-1 flex justify-center items-start overflow-y-auto w-full py-1">
        {/* YOUTUBE MOCKUP */}
        {activePreviewTab === "youtube" && (
          <div className="w-full max-w-[340px] mx-auto bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden text-zinc-100 shadow-xl animate-fade-in">
            {/* Video Thumbnail */}
            <div className="relative aspect-video bg-black overflow-hidden group">
              <img
                src={displayMedia}
                alt="YouTube Thumbnail"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg">
                  <FiPlay className="text-base ml-0.5 fill-current" />
                </div>
              </div>
              <span className="absolute bottom-1.5 right-1.5 bg-black/85 text-white text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold">
                12:45
              </span>
            </div>

            {/* Video Content & Metadata */}
            <div className="p-3 space-y-2.5">
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-zinc-100 line-clamp-2 leading-snug">
                  {displayTitle}
                </h4>
                <p className="text-[10px] text-zinc-400 flex items-center gap-1.5">
                  <span>14K views</span>
                  <span>•</span>
                  <span>2 hours ago</span>
                </p>
              </div>

              {/* Channel Profile Row */}
              <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-sm">
                    {displayAccount.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 truncate">
                    <p className="text-xs font-medium text-zinc-200 truncate leading-tight">
                      {displayAccount}
                    </p>
                    <p className="text-[9px] text-zinc-400 leading-tight">
                      24.5K subscribers
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="px-2.5 py-1 rounded-full bg-white text-zinc-950 font-bold text-[10px] hover:bg-zinc-200 transition-colors shrink-0"
                >
                  Subscribe
                </button>
              </div>

              {/* Description Preview Box */}
              <div className="bg-zinc-950/70 p-2.5 rounded-md text-[11px] text-zinc-300 border border-zinc-800/70 leading-relaxed">
                <p className="line-clamp-2">{displayDescription}</p>
                {tags && (
                  <p className="text-sky-400 font-mono mt-1 text-[10px] truncate">
                    {tags.split(",").map(t => `#${t.trim()}`).join(" ")}
                  </p>
                )}
              </div>

              {/* YouTube Pill Action Bar */}
              <div className="flex items-center gap-1.5 pt-0.5 text-zinc-300 text-xs overflow-x-auto">
                <div className="flex items-center bg-zinc-800/80 rounded-full px-2.5 py-1 text-[11px] gap-1.5 shrink-0">
                  <FiThumbsUp className="text-[10px]" />
                  <span>1.2K</span>
                  <span className="text-zinc-600">|</span>
                  <FiThumbsDown className="text-[10px]" />
                </div>
                <div className="flex items-center bg-zinc-800/80 rounded-full px-2.5 py-1 text-[11px] gap-1 shrink-0">
                  <FiShare2 className="text-[10px]" />
                  <span>Share</span>
                </div>
                <div className="flex items-center bg-zinc-800/80 rounded-full px-2.5 py-1 text-[11px] gap-1 shrink-0">
                  <FiBookmark className="text-[10px]" />
                  <span>Save</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TIKTOK MOCKUP */}
        {activePreviewTab === "tiktok" && (
          <div className="relative w-[260px] h-[450px] mx-auto bg-black rounded-lg border border-zinc-800 overflow-hidden flex flex-col justify-between p-3.5 shadow-2xl animate-fade-in text-white">
            {/* Background Media */}
            <img
              src={displayMedia}
              alt="TikTok Media"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/95 pointer-events-none" />

            {/* Top Navigation */}
            <div className="relative z-10 flex items-center justify-center gap-4 text-[11px] font-medium text-white/70 pt-1">
              <span className="hover:text-white cursor-pointer">Following</span>
              <span className="text-white border-b-2 border-white pb-0.5 font-bold">For You</span>
            </div>

            {/* Right Action Sidebar */}
            <div className="absolute right-2.5 bottom-12 z-10 flex flex-col items-center gap-3">
              {/* Creator Avatar with Follow Plus Badge */}
              <div className="relative mb-1">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 to-fuchsia-500 p-0.5">
                  <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center font-bold text-xs">
                    {displayAccount.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[9px] font-black shadow">
                  <FiPlus />
                </div>
              </div>

              {/* Heart */}
              <div className="flex flex-col items-center gap-0.5">
                <div className="w-7 h-7 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm">
                  <FiHeart className="text-sm text-red-500 fill-red-500" />
                </div>
                <span className="text-[9px] font-mono font-medium">28.4K</span>
              </div>

              {/* Comment */}
              <div className="flex flex-col items-center gap-0.5">
                <div className="w-7 h-7 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm">
                  <FiMessageCircle className="text-sm" />
                </div>
                <span className="text-[9px] font-mono font-medium">1,240</span>
              </div>

              {/* Bookmark */}
              <div className="flex flex-col items-center gap-0.5">
                <div className="w-7 h-7 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm">
                  <FiBookmark className="text-sm" />
                </div>
                <span className="text-[9px] font-mono font-medium">3,820</span>
              </div>

              {/* Share */}
              <div className="flex flex-col items-center gap-0.5">
                <div className="w-7 h-7 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm">
                  <FiShare2 className="text-sm" />
                </div>
                <span className="text-[9px] font-mono font-medium">840</span>
              </div>

              {/* Spinning Vinyl Record */}
              <div className="relative mt-1">
                <div className="w-7 h-7 rounded-full bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center animate-spin" style={{ animationDuration: "4s" }}>
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-800 border border-zinc-600" />
                </div>
                <span className="absolute -top-1 -right-1 text-[8px]">🎵</span>
              </div>
            </div>

            {/* Bottom Caption & Audio Info */}
            <div className="relative z-10 space-y-1.5 pr-12 pb-1">
              <span className="text-xs font-bold block drop-shadow-md">{handle}</span>
              <p className="text-[11px] leading-snug line-clamp-2 text-zinc-100 drop-shadow-md">
                {displayTitle} - {displayDescription}
              </p>
              {tags && (
                <p className="text-[10px] text-cyan-300 font-mono drop-shadow">
                  {tags.split(",").map(t => `#${t.trim()}`).join(" ")}
                </p>
              )}
              <div className="flex items-center gap-1.5 text-[9px] text-zinc-300 pt-0.5 drop-shadow">
                <FiMusic className="text-[10px]" />
                <span className="truncate">{displayAccount} • Original Audio</span>
              </div>
            </div>
          </div>
        )}

        {/* INSTAGRAM MOCKUP */}
        {activePreviewTab === "instagram" && (
          <div className="w-full max-w-[340px] mx-auto bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden text-zinc-100 shadow-xl animate-fade-in">
            {/* Post Header with Story Ring */}
            <div className="flex items-center justify-between p-2.5 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <div className="p-[1.5px] bg-gradient-to-tr from-amber-500 via-rose-500 to-fuchsia-600 rounded-full">
                  <div className="w-6 h-6 rounded-full bg-zinc-950 border border-zinc-900 flex items-center justify-center font-bold text-[10px] text-white">
                    {displayAccount.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-semibold block leading-tight">{handle.replace("@", "")}</span>
                  <span className="text-[9px] text-zinc-400 leading-tight">Original Audio</span>
                </div>
              </div>
              <FiMoreHorizontal className="text-zinc-400 text-xs cursor-pointer hover:text-white" />
            </div>

            {/* Media Canvas */}
            <div className="aspect-square bg-black relative overflow-hidden">
              <img
                src={displayMedia}
                alt="Instagram Media"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Engagement Action Row */}
            <div className="p-3 space-y-1.5">
              <div className="flex items-center justify-between text-base">
                <div className="flex items-center gap-3 text-zinc-200">
                  <FiHeart className="hover:text-red-500 transition-colors cursor-pointer" />
                  <FiMessageCircle className="hover:text-zinc-400 transition-colors cursor-pointer" />
                  <FiSend className="hover:text-zinc-400 transition-colors cursor-pointer" />
                </div>
                <FiBookmark className="text-zinc-200 hover:text-zinc-400 transition-colors cursor-pointer" />
              </div>

              {/* Likes Count */}
              <p className="text-xs font-semibold text-zinc-200">
                Liked by <span className="font-bold">creator_hub</span> and <span className="font-bold">3,429 others</span>
              </p>

              {/* Post Caption */}
              <p className="text-xs text-zinc-300 leading-snug line-clamp-2">
                <span className="font-bold mr-1.5 text-zinc-100">{handle.replace("@", "")}</span>
                {displayTitle} - {displayDescription}
              </p>

              {/* Tags */}
              {tags && (
                <p className="text-[10px] text-indigo-400 font-mono">
                  {tags.split(",").map(t => `#${t.trim()}`).join(" ")}
                </p>
              )}

              {/* Comment Link & Timestamp */}
              <p className="text-[10px] text-zinc-500 cursor-pointer hover:text-zinc-400 pt-0.5">
                View all 48 comments
              </p>
              <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-medium">
                2 HOURS AGO
              </p>
            </div>
          </div>
        )}

        {/* X / TWITTER MOCKUP */}
        {activePreviewTab === "x_twitter" && (
          <div className="w-full max-w-[340px] mx-auto bg-zinc-950 border border-zinc-800 rounded-lg p-3.5 text-zinc-100 space-y-2.5 shadow-xl animate-fade-in">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs shrink-0 border border-zinc-700">
                {displayAccount.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                {/* Author row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 truncate">
                    <span className="text-xs font-bold text-zinc-100 truncate">{displayAccount}</span>
                    <FaCheckCircle className="text-sky-400 text-[11px] shrink-0" />
                    <span className="text-[11px] text-zinc-500 truncate">{handle}</span>
                    <span className="text-[11px] text-zinc-500">· 2h</span>
                  </div>
                  <FiMoreHorizontal className="text-zinc-500 shrink-0 text-xs cursor-pointer hover:text-zinc-300" />
                </div>

                {/* Tweet Body */}
                <p className="text-xs text-zinc-200 mt-1 leading-relaxed whitespace-pre-line line-clamp-4">
                  {displayTitle}
                  {"\n"}
                  {displayDescription}
                </p>

                {tags && (
                  <p className="text-[11px] text-sky-400 font-mono mt-1">
                    {tags.split(",").map(t => `#${t.trim()}`).join(" ")}
                  </p>
                )}

                {/* Media Attachment */}
                {displayMedia && (
                  <div className="mt-2 rounded-md overflow-hidden border border-zinc-800/90 aspect-video bg-zinc-900">
                    <img
                      src={displayMedia}
                      alt="Tweet Media"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* X Engagement Metrics Bar */}
                <div className="flex items-center justify-between mt-2.5 text-zinc-500 text-[11px]">
                  <div className="flex items-center gap-1 hover:text-sky-400 transition-colors cursor-pointer">
                    <FiMessageCircle className="text-xs" />
                    <span>34</span>
                  </div>
                  <div className="flex items-center gap-1 hover:text-emerald-400 transition-colors cursor-pointer">
                    <FiRepeat className="text-xs" />
                    <span>56</span>
                  </div>
                  <div className="flex items-center gap-1 hover:text-rose-500 transition-colors cursor-pointer">
                    <FiHeart className="text-xs" />
                    <span>412</span>
                  </div>
                  <div className="flex items-center gap-1 hover:text-sky-400 transition-colors cursor-pointer">
                    <FiBarChart2 className="text-xs" />
                    <span>12.8K</span>
                  </div>
                  <div className="flex items-center gap-1 hover:text-zinc-300 transition-colors cursor-pointer">
                    <FiBookmark className="text-xs" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FACEBOOK MOCKUP */}
        {activePreviewTab === "facebook" && (
          <div className="w-full max-w-[340px] mx-auto bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden text-zinc-100 shadow-xl animate-fade-in">
            {/* Post Header */}
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-600 border border-blue-400/30 flex items-center justify-center font-bold text-xs text-white shrink-0">
                  {displayAccount.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-zinc-100 leading-tight">{displayAccount}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-400 leading-tight mt-0.5">
                    <span>3h</span>
                    <span>·</span>
                    <FaGlobeAmericas className="text-[9px]" />
                  </div>
                </div>
              </div>
              <FiMoreHorizontal className="text-zinc-400 text-xs cursor-pointer hover:text-white" />
            </div>

            {/* Post Text */}
            <div className="px-3 pb-2 text-xs text-zinc-200 leading-relaxed whitespace-pre-line">
              {displayTitle && <p className="font-semibold mb-1 text-zinc-100">{displayTitle}</p>}
              <p className="line-clamp-3">{displayDescription}</p>
              {tags && (
                <p className="text-[11px] text-blue-400 font-mono mt-1">
                  {tags.split(",").map(t => `#${t.trim()}`).join(" ")}
                </p>
              )}
            </div>

            {/* Media Canvas */}
            {displayMedia && (
              <div className="aspect-video bg-black overflow-hidden border-t border-b border-zinc-800">
                <img
                  src={displayMedia}
                  alt="Facebook Post Media"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Reactions & Engagement Summary */}
            <div className="px-3 py-2 flex items-center justify-between text-[11px] text-zinc-400 border-b border-zinc-800">
              <div className="flex items-center gap-1.5">
                <div className="flex items-center -space-x-1">
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[8px]">👍</span>
                  <span className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[8px]">❤️</span>
                </div>
                <span>1.4K</span>
              </div>
              <div className="flex items-center gap-2">
                <span>94 comments</span>
                <span>·</span>
                <span>28 shares</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-2 py-1 flex items-center justify-around text-zinc-400 text-xs">
              <button type="button" className="flex items-center gap-1.5 py-1 px-3 hover:text-blue-400 transition-colors cursor-pointer">
                <FiThumbsUp className="text-xs" />
                <span>Like</span>
              </button>
              <button type="button" className="flex items-center gap-1.5 py-1 px-3 hover:text-zinc-200 transition-colors cursor-pointer">
                <FiMessageCircle className="text-xs" />
                <span>Comment</span>
              </button>
              <button type="button" className="flex items-center gap-1.5 py-1 px-3 hover:text-zinc-200 transition-colors cursor-pointer">
                <FiShare2 className="text-xs" />
                <span>Share</span>
              </button>
            </div>
          </div>
        )}

        {/* LINKEDIN MOCKUP */}
        {activePreviewTab === "linkedin" && (
          <div className="w-full max-w-[340px] mx-auto bg-zinc-900 border border-zinc-800 rounded-lg p-3.5 text-zinc-100 space-y-2.5 shadow-xl animate-fade-in">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs border border-blue-500/40 shrink-0">
                  {displayAccount.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <h5 className="text-xs font-bold leading-tight text-zinc-100">{displayAccount}</h5>
                    <span className="text-[10px] text-zinc-500 font-medium">• 1st</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-tight">Creator & AI Strategist</p>
                  <p className="text-[9px] text-zinc-500 leading-tight flex items-center gap-1 mt-0.5">
                    <span>2h</span>
                    <span>•</span>
                    <FaGlobeAmericas className="text-[8px]" />
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="text-blue-400 hover:text-blue-300 font-semibold text-xs flex items-center gap-0.5"
              >
                <FiPlus className="text-xs" /> Follow
              </button>
            </div>

            {/* Post Content */}
            <p className="text-xs text-zinc-300 leading-relaxed line-clamp-3">
              <span className="font-semibold text-zinc-100">{displayTitle}</span>
              {" "}
              {displayDescription}
            </p>

            {tags && (
              <p className="text-[10px] text-blue-400 font-mono">
                {tags.split(",").map(t => `#${t.trim()}`).join(" ")}
              </p>
            )}

            {/* Media */}
            {displayMedia && (
              <div className="rounded-md overflow-hidden border border-zinc-800 aspect-video bg-black">
                <img
                  src={displayMedia}
                  alt="LinkedIn Media"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* LinkedIn Reactions Counter */}
            <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-b border-zinc-800/80 pb-2">
              <div className="flex items-center gap-1">
                <div className="flex items-center -space-x-1">
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[8px]">👍</span>
                  <span className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[8px]">❤️</span>
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[8px]">💡</span>
                </div>
                <span className="ml-1">482</span>
              </div>
              <span>38 comments • 12 reposts</span>
            </div>

            {/* LinkedIn Action Bar */}
            <div className="flex items-center justify-around text-zinc-400 text-[11px] pt-0.5">
              <div className="flex items-center gap-1 hover:text-zinc-200 cursor-pointer py-1">
                <FiThumbsUp className="text-xs" />
                <span>Like</span>
              </div>
              <div className="flex items-center gap-1 hover:text-zinc-200 cursor-pointer py-1">
                <FiMessageCircle className="text-xs" />
                <span>Comment</span>
              </div>
              <div className="flex items-center gap-1 hover:text-zinc-200 cursor-pointer py-1">
                <FiRepeat className="text-xs" />
                <span>Repost</span>
              </div>
              <div className="flex items-center gap-1 hover:text-zinc-200 cursor-pointer py-1">
                <FiSend className="text-xs" />
                <span>Send</span>
              </div>
            </div>
          </div>
        )}

        {/* THREADS MOCKUP */}
        {activePreviewTab === "threads" && (
          <div className="w-full max-w-[340px] mx-auto bg-zinc-950 border border-zinc-800 rounded-lg p-3.5 text-zinc-100 shadow-xl animate-fade-in">
            <div className="flex items-start gap-3">
              {/* Left Column: Avatar + Thread Connector Line */}
              <div className="flex flex-col items-center shrink-0 self-stretch">
                <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-xs text-zinc-200">
                  {displayAccount.charAt(0).toUpperCase()}
                </div>
                {/* Vertical thread connection line */}
                <div className="w-0.5 flex-1 bg-zinc-800 my-1.5 min-h-[36px]" />
                {/* Second mini reply avatar indicator */}
                <div className="w-4 h-4 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[8px] text-zinc-400 font-bold">
                  +
                </div>
              </div>

              {/* Right Column: Thread Content */}
              <div className="flex-1 min-w-0 space-y-2">
                {/* Author & Timestamp */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-xs font-bold text-zinc-100 truncate">
                      {handle.replace("@", "")}
                    </span>
                    <span className="text-[10px] text-zinc-500">1h</span>
                  </div>
                  <FiMoreHorizontal className="text-zinc-500 text-xs shrink-0 cursor-pointer hover:text-zinc-300" />
                </div>

                {/* Thread Body */}
                <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-line">
                  {displayTitle ? `${displayTitle}\n\n` : ""}{displayDescription}
                </p>

                {/* Tags */}
                {tags && (
                  <p className="text-[11px] text-purple-400 font-mono">
                    {tags.split(",").map(t => `#${t.trim()}`).join(" ")}
                  </p>
                )}

                {/* Media Attachment */}
                {displayMedia && (
                  <div className="rounded-md overflow-hidden border border-zinc-850 aspect-video bg-zinc-900 mt-2">
                    <img
                      src={displayMedia}
                      alt="Threads Media"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Threads Action Row */}
                <div className="flex items-center gap-4 pt-1 text-zinc-300 text-sm">
                  <FiHeart className="hover:text-rose-500 transition-colors cursor-pointer" />
                  <FiMessageCircle className="hover:text-zinc-100 transition-colors cursor-pointer" />
                  <FiRepeat className="hover:text-emerald-400 transition-colors cursor-pointer" />
                  <FiSend className="hover:text-zinc-100 transition-colors cursor-pointer" />
                </div>

                {/* Thread Replies & Likes Summary */}
                <div className="flex items-center gap-1.5 pt-0.5 text-[10px] text-zinc-500">
                  <span>18 replies</span>
                  <span>•</span>
                  <span>142 likes</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PINTEREST MOCKUP */}
        {activePreviewTab === "pinterest" && (
          <div className="w-[260px] mx-auto bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden text-zinc-100 shadow-xl animate-fade-in flex flex-col">
            {/* Pin Media Card with Red Save Badge */}
            <div className="relative aspect-[3/4] bg-black overflow-hidden group">
              <img
                src={displayMedia}
                alt="Pinterest Pin"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-2.5 right-2.5">
                <button
                  type="button"
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-full shadow-lg transition-colors cursor-pointer"
                >
                  Save
                </button>
              </div>
              <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-sm text-[10px] text-zinc-200 truncate max-w-[150px]">
                  muapi.ai
                </span>
                <div className="w-6 h-6 rounded-full bg-white/90 text-zinc-950 flex items-center justify-center text-[10px] shadow">
                  <FiShare2 />
                </div>
              </div>
            </div>

            {/* Pin Details */}
            <div className="p-3 space-y-2">
              <h4 className="text-xs font-bold text-white line-clamp-2 leading-tight">
                {displayTitle}
              </h4>
              <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                {displayDescription}
              </p>
              {tags && (
                <p className="text-[10px] text-rose-400 font-mono truncate">
                  {tags.split(",").map(t => `#${t.trim()}`).join(" ")}
                </p>
              )}

              {/* Creator row */}
              <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-5 h-5 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                    {displayAccount.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[11px] font-medium text-zinc-300 truncate">
                    {displayAccount}
                  </span>
                </div>
                <button
                  type="button"
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                >
                  Follow
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
