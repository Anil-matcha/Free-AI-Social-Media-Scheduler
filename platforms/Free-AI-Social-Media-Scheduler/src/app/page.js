"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { FaYoutube, FaExclamationTriangle, FaClock, FaCheckCircle, FaTimesCircle, FaGlobe, FaLock, FaChevronDown, FaInstagram, FaFacebook, FaLinkedin, FaPinterest } from "react-icons/fa";
import { FaXTwitter, FaThreads } from "react-icons/fa6";
import { SiTiktok } from "react-icons/si";
import { FiUploadCloud, FiTrash2, FiRefreshCw, FiExternalLink, FiPlay, FiFileText } from "react-icons/fi";
import Link from "next/link";
import clsx from "clsx";

const YOUTUBE_CATEGORIES = [
  { label: "People & Blogs", value: "22" },
  { label: "Film & Animation", value: "1" },
  { label: "Autos & Vehicles", value: "2" },
  { label: "Music", value: "10" },
  { label: "Pets & Animals", value: "15" },
  { label: "Sports", value: "17" },
  { label: "Travel & Events", value: "19" },
  { label: "Gaming", value: "20" },
  { label: "Comedy", value: "23" },
  { label: "Entertainment", value: "24" },
  { label: "News & Politics", value: "25" },
  { label: "Howto & Style", value: "26" },
  { label: "Education", value: "27" },
  { label: "Science & Technology", value: "28" },
  { label: "Nonprofits & Activism", value: "29" }
];

const SOCIAL_PLATFORMS = [
  { key: "youtube", name: "YouTube Video", Icon: FaYoutube, iconColor: "text-red-500", active: true },
  { key: "tiktok", name: "TikTok Video", Icon: SiTiktok, iconColor: "text-cyan-400", active: true },
  { key: "instagram", name: "Instagram Reels", Icon: FaInstagram, iconColor: "text-pink-500", active: false },
  { key: "facebook", name: "Facebook Reels", Icon: FaFacebook, iconColor: "text-blue-600", active: false },
  { key: "x_twitter", name: "X (Twitter) Post", Icon: FaXTwitter, iconColor: "text-zinc-300", active: false },
  { key: "linkedin", name: "LinkedIn Post", Icon: FaLinkedin, iconColor: "text-sky-600", active: false },
  { key: "threads", name: "Threads Post", Icon: FaThreads, iconColor: "text-zinc-200", active: false },
  { key: "pinterest", name: "Pinterest Pin", Icon: FaPinterest, iconColor: "text-red-600", active: false },
];

export default function WorkspaceDashboard() {
  const { data: session, update: updateSession } = useSession();
  const [accounts, setAccounts] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  
  // Form State
  const [platform, setPlatform] = useState("youtube");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [privacy, setPrivacy] = useState("public"); // Default public
  
  // YouTube Extra Options
  const [categoryId, setCategoryId] = useState("22");
  const [madeForKids, setMadeForKids] = useState(false);
  
  // TikTok Extra Options
  const [disableComment, setDisableComment] = useState(false);
  const [disableDuet, setDisableDuet] = useState(false);
  const [disableStitch, setDisableStitch] = useState(false);
  
  // Scheduling State
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  
  // Upload State
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Custom Dropdowns Open State
  const [platformDropdownOpen, setPlatformDropdownOpen] = useState(false);
  const [channelDropdownOpen, setChannelDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [privacyDropdownOpen, setPrivacyDropdownOpen] = useState(false);

  // Refs for click outside
  const platformRef = useRef(null);
  const channelRef = useRef(null);
  const categoryRef = useRef(null);
  const privacyRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (platformRef.current && !platformRef.current.contains(event.target)) {
        setPlatformDropdownOpen(false);
      }
      if (channelRef.current && !channelRef.current.contains(event.target)) {
        setChannelDropdownOpen(false);
      }
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setCategoryDropdownOpen(false);
      }
      if (privacyRef.current && !privacyRef.current.contains(event.target)) {
        setPrivacyDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isPlatformActive = platform === "youtube" || platform === "tiktok";
  const currentPlatform = SOCIAL_PLATFORMS.find(p => p.key === platform) || SOCIAL_PLATFORMS[0];
  const CurrentIcon = currentPlatform.Icon;
  
  // Fetch connected accounts & scheduler posts
  useEffect(() => {
    if (!session?.user) return;
    
    // Fetch accounts
    fetch("/api/social/accounts")
      .then(res => res.json())
      .then(data => {
        setAccounts(data);
        if (data.length > 0) {
          // Select first account matching current platform
          const match = data.find(a => a.platform_name === platform);
          if (match) setSelectedAccountId(match.id.toString());
        }
      })
      .catch(err => console.error("Error fetching accounts:", err))
      .finally(() => setLoadingAccounts(false));

    // Fetch posts
    fetchPosts();
  }, [session, platform]);

  const fetchPosts = () => {
    if (!session?.user) return;
    fetch("/api/posts")
      .then(res => res.json())
      .then(data => {
        setPosts(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error("Error fetching posts:", err))
      .finally(() => setLoadingPosts(false));
  };

  // Auto-refresh queue every 4 seconds if there is a processing post
  useEffect(() => {
    if (!session?.user) return;
    const hasProcessing = posts.some(p => p.status === "processing");
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      fetch("/api/posts")
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setPosts(data);
            // Proactively update user session to sync credits balance on complete/fail
            updateSession();
          }
        })
        .catch(err => console.error("Error polling posts:", err));
    }, 4000);

    return () => clearInterval(interval);
  }, [posts, session]);

  // Handle media file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.url) {
        setMediaUrl(data.url);
      } else {
        alert(data.error || "Upload failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading file");
    } finally {
      setUploading(false);
    }
  };

  // Submit Publish/Schedule Task
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session?.user) {
      signIn("google");
      return;
    }

    if (!selectedAccountId) {
      alert("Please select a connected account first.");
      return;
    }

    if (!mediaUrl) {
      alert("Please upload a video file first.");
      return;
    }

    if (!title.trim()) {
      alert("Please provide a title or caption.");
      return;
    }

    if (isScheduled && !scheduledAt) {
      alert("Please specify a scheduling date and time.");
      return;
    }

    setSubmitting(true);
    const account = accounts.find(a => a.id.toString() === selectedAccountId);

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: selectedAccountId,
          platform,
          accountName: account?.account_name || "Social Account",
          mediaUrl,
          title,
          description: platform === "youtube" ? description : undefined,
          tags: platform === "youtube" ? tags : undefined,
          privacy,
          scheduledAt: isScheduled ? scheduledAt : undefined,
          disableComment: platform === "tiktok" ? disableComment : undefined,
          disableDuet: platform === "tiktok" ? disableDuet : undefined,
          disableStitch: platform === "tiktok" ? disableStitch : undefined,
          categoryId: platform === "youtube" ? categoryId : undefined,
          madeForKids: platform === "youtube" ? madeForKids : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Submission failed");
      }

      // Reset form variables
      setTitle("");
      setDescription("");
      setTags("");
      setMediaUrl("");
      setIsScheduled(false);
      setScheduledAt("");
      
      // Refresh posts list
      fetchPosts();
      updateSession();
      alert(isScheduled ? "Post scheduled successfully!" : "Publishing job started!");
    } catch (err) {
      console.error(err);
      alert(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete/Cancel scheduled post
  const handleDeletePost = async (id) => {
    if (!confirm("Are you sure you want to cancel and delete this post?")) return;

    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (res.ok) {
        fetchPosts();
        updateSession();
      } else {
        alert(data.error || "Failed to delete post");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting post");
    }
  };

  // Retry a failed post (reschedules it to run immediately)
  const handleRetryPost = async (post) => {
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledAt: new Date(Date.now() + 10000).toISOString() // schedule in 10 seconds
        })
      });
      if (res.ok) {
        fetchPosts();
        alert("Post queued for retry!");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to retry post");
      }
    } catch (err) {
      console.error(err);
      alert("Error retrying post");
    }
  };

  // Render privacy label
  const getPrivacyIcon = (postPrivacy) => {
    if (postPrivacy === "public" || postPrivacy === "PUBLIC_TO_EVERYONE") {
      return <FaGlobe className="text-zinc-500" />;
    }
    return <FaLock className="text-zinc-500" />;
  };

  const filteredAccounts = accounts.filter(a => a.platform_name === platform);

  return (
    <main className="flex-1 flex flex-col md:flex-row lg:max-w-7xl mx-auto w-full overflow-y-auto md:overflow-hidden bg-zinc-950 lg:border-l lg:border-r lg:border-zinc-900">
      {/* LEFT: Scheduling Form Panel */}
      <section className="w-full md:w-1/2 p-6 overflow-y-visible md:overflow-y-auto border-r border-zinc-900 bg-zinc-950/40 flex flex-col gap-6 shrink-0">
        <div className="flex flex-col gap-1 mt-12 md:mt-0">
          <h2 className="text-xl font-bold tracking-tight text-white">Create New Post</h2>
          <p className="text-xs text-zinc-400">Upload your video and schedule it to publish on connected channels.</p>
        </div>

        {/* Platform Selection (Custom Dropdown) */}
        <div className="flex flex-col gap-1.5 animate-fade-in relative z-50">
          <label className="text-xs font-semibold text-zinc-400">Social Media Platform</label>
          <div className="relative" ref={platformRef}>
            <button
              type="button"
              id="custom-platform-select"
              onClick={() => setPlatformDropdownOpen(!platformDropdownOpen)}
              className="flex items-center justify-between w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 outline-none rounded-lg p-2.5 text-xs text-zinc-100 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <CurrentIcon className={currentPlatform.iconColor} />
                {currentPlatform.name}
              </span>
              <FaChevronDown className={clsx("text-zinc-500 text-[10px] transition-transform duration-200", platformDropdownOpen && "rotate-180")} />
            </button>
            
            {platformDropdownOpen && (
              <div className="absolute left-0 right-0 mt-1 z-50 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl max-h-64 overflow-y-auto p-1 flex flex-col gap-0.5">
                {SOCIAL_PLATFORMS.map((plat) => {
                  const PlatIcon = plat.Icon;
                  const isSelected = platform === plat.key;
                  return (
                    <button
                      type="button"
                      key={plat.key}
                      id={`platform-option-${plat.key}`}
                      onClick={() => {
                        setPlatform(plat.key);
                        if (plat.key === "youtube") {
                          setPrivacy("public");
                        } else if (plat.key === "tiktok") {
                          setPrivacy("PUBLIC_TO_EVERYONE");
                        }
                        setSelectedAccountId("");
                        setPlatformDropdownOpen(false);
                      }}
                      className={clsx(
                        "flex items-center justify-between w-full text-left p-2.5 rounded-lg text-xs font-semibold hover:bg-zinc-800 transition-colors cursor-pointer",
                        isSelected ? "bg-zinc-800 text-white" : "text-zinc-400"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <PlatIcon className={plat.iconColor} />
                        {plat.name}
                      </span>
                      {!plat.active && (
                        <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          Coming Soon
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 relative z-10">
          {!isPlatformActive ? (
            /* Coming Soon Platform State */
            <div className="card-premium p-6 flex flex-col items-center text-center gap-4 bg-zinc-900/10 border-dashed py-10 my-4 animate-fade-in">
              <div className="h-12 w-12 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 border border-zinc-800">
                <CurrentIcon className={`text-xl ${currentPlatform.iconColor}`} />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  {currentPlatform.name} Coming Soon
                </h3>
                <span className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                  Automated scheduling and publishing for {currentPlatform.name.replace(" Reels", "").replace(" Post", "").replace(" Pin", "")} is currently in development.
                </span>
              </div>
              <Link
                href="/integrations"
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-805 text-zinc-200 hover:text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Request Access
              </Link>
            </div>
          ) : (
            <>
              {/* Target Channel (Custom Dropdown) */}
              <div className="flex flex-col gap-1.5 animate-fade-in">
                <label className="text-xs font-semibold text-zinc-400">Target Channel</label>
                {session?.user ? (
                  filteredAccounts.length > 0 ? (
                    <div className="relative z-30" ref={channelRef}>
                      <button
                        type="button"
                        id="custom-channel-select"
                        onClick={() => setChannelDropdownOpen(!channelDropdownOpen)}
                        className="flex items-center justify-between w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 outline-none rounded-lg p-2.5 text-xs text-zinc-100 transition-colors cursor-pointer"
                      >
                        <span>
                          {(() => {
                            const selectedAcc = accounts.find(a => a.id.toString() === selectedAccountId);
                            return selectedAcc 
                              ? `${selectedAcc.account_name} (${selectedAcc.platform_name === "youtube" ? "YouTube" : "TikTok"})` 
                              : "Select a connected account";
                          })()}
                        </span>
                        <FaChevronDown className={clsx("text-zinc-500 text-[10px] transition-transform duration-200", channelDropdownOpen && "rotate-180")} />
                      </button>

                      {channelDropdownOpen && (
                        <div className="absolute left-0 right-0 mt-1 z-50 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl max-h-60 overflow-y-auto p-1 flex flex-col gap-0.5">
                          {filteredAccounts.map((acc) => {
                            const isSelected = selectedAccountId === acc.id.toString();
                            const AccIcon = acc.platform_name === "youtube" ? FaYoutube : SiTiktok;
                            const iconColor = acc.platform_name === "youtube" ? "text-red-500" : "text-cyan-400";
                            return (
                              <button
                                type="button"
                                key={acc.id}
                                id={`channel-option-${acc.id}`}
                                onClick={() => {
                                  setSelectedAccountId(acc.id.toString());
                                  setChannelDropdownOpen(false);
                                }}
                                className={clsx(
                                  "flex items-center gap-2 w-full text-left p-2.5 rounded-lg text-xs font-semibold hover:bg-zinc-800 transition-colors cursor-pointer",
                                  isSelected ? "bg-zinc-800 text-white" : "text-zinc-400"
                                )}
                              >
                                <AccIcon className={iconColor} />
                                <span className="block truncate">{acc.account_name}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/80 text-xs">
                      <span className="text-zinc-400">No connected {platform === "youtube" ? "YouTube" : "TikTok"} accounts found.</span>
                      <Link href="/integrations" className="text-violet-400 font-bold hover:underline">
                        Connect account
                      </Link>
                    </div>
                  )
                ) : (
                  <button
                    type="button"
                    disabled
                    className="w-full bg-zinc-900/40 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-600 outline-none text-left cursor-not-allowed"
                  >
                    Sign in to view accounts
                  </button>
                )}
              </div>

          {/* Video Uploader Container */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-400">Video File</label>
            {mediaUrl ? (
              <div className="flex items-center justify-between bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                <div className="flex items-center gap-2.5 truncate max-w-[80%]">
                  <FiFileText className="text-violet-400 text-lg shrink-0" />
                  <span className="text-xs text-zinc-200 truncate">{mediaUrl}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMediaUrl("")}
                  className="text-zinc-500 hover:text-red-500 transition-colors cursor-pointer"
                >
                  <FiTrash2 className="text-sm" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={clsx(
                  "border border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 hover:bg-zinc-900/50 rounded-xl p-8 flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-all",
                  uploading && "opacity-50 pointer-events-none"
                )}
              >
                <FiUploadCloud className="text-3xl text-zinc-500 animate-pulse" />
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold text-zinc-300">
                    {uploading ? "Uploading file..." : "Click to upload MP4/MOV"}
                  </span>
                  <span className="text-[10px] text-zinc-500 mt-1">Maximum size 100MB</span>
                </div>
                <input
                  type="file"
                  accept="video/mp4,video/quicktime"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Title / Caption */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-400">
              {platform === "youtube" ? "Video Title" : "Video Caption"}
            </label>
            <input
              type="text"
              placeholder={platform === "youtube" ? "My amazing video..." : "Check out my new post! #ai #muapi"}
              maxLength={platform === "youtube" ? 100 : 150}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 focus:border-violet-500 outline-none rounded-lg p-2.5 text-xs text-zinc-100 transition-colors"
            />
            <span className="text-[10px] text-zinc-500 self-end">
              {title.length}/{platform === "youtube" ? 100 : 150}
            </span>
          </div>

          {/* YouTube Specific Fields */}
          {platform === "youtube" && (
            <>
              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-400">Description</label>
                <textarea
                  placeholder="Tell your viewers about your video..."
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 focus:border-violet-500 outline-none rounded-lg p-2.5 text-xs text-zinc-100 transition-colors resize-none"
                />
              </div>

              {/* Tags */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-400">Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="ai, marketing, tech"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 focus:border-violet-500 outline-none rounded-lg p-2.5 text-xs text-zinc-100 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 relative z-30">
                {/* Category ID select (Custom Dropdown) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-400">Category</label>
                  <div className="relative" ref={categoryRef}>
                    <button
                      type="button"
                      id="custom-category-select"
                      onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                      className="flex items-center justify-between w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 outline-none rounded-lg p-2.5 text-xs text-zinc-100 transition-colors cursor-pointer"
                    >
                      <span className="truncate">
                        {YOUTUBE_CATEGORIES.find(c => c.value === categoryId)?.label || "Select Category"}
                      </span>
                      <FaChevronDown className={clsx("text-zinc-500 text-[10px] transition-transform duration-200 shrink-0 ml-1", categoryDropdownOpen && "rotate-180")} />
                    </button>

                    {categoryDropdownOpen && (
                      <div className="absolute left-0 right-0 mt-1 z-50 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl max-h-48 overflow-y-auto p-1 flex flex-col gap-0.5">
                        {YOUTUBE_CATEGORIES.map((c) => (
                          <button
                            type="button"
                            key={c.value}
                            id={`category-option-${c.value}`}
                            onClick={() => {
                              setCategoryId(c.value);
                              setCategoryDropdownOpen(false);
                            }}
                            className={clsx(
                              "w-full text-left py-2 px-3 rounded text-xs transition-colors hover:bg-zinc-800 cursor-pointer flex items-center",
                              categoryId === c.value ? "bg-zinc-800 text-white font-semibold" : "text-zinc-400"
                            )}
                          >
                            <span className="block truncate">{c.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Privacy select (Custom Dropdown) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-400">Privacy</label>
                  <div className="relative" ref={privacyRef}>
                    <button
                      type="button"
                      id="custom-privacy-select"
                      onClick={() => setPrivacyDropdownOpen(!privacyDropdownOpen)}
                      className="flex items-center justify-between w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 outline-none rounded-lg p-2.5 text-xs text-zinc-100 transition-colors cursor-pointer"
                    >
                      <span className="capitalize">{privacy}</span>
                      <FaChevronDown className={clsx("text-zinc-500 text-[10px] transition-transform duration-200", privacyDropdownOpen && "rotate-180")} />
                    </button>

                    {privacyDropdownOpen && (
                      <div className="absolute left-0 right-0 mt-1 z-50 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl p-1 flex flex-col gap-0.5">
                        {["public", "private", "unlisted"].map((p) => (
                          <button
                            type="button"
                            key={p}
                            id={`privacy-option-${p}`}
                            onClick={() => {
                              setPrivacy(p);
                              setPrivacyDropdownOpen(false);
                            }}
                            className={clsx(
                              "w-full text-left py-2 px-3 rounded text-xs transition-colors hover:bg-zinc-800 cursor-pointer flex items-center",
                              privacy === p ? "bg-zinc-800 text-white font-semibold" : "text-zinc-400"
                            )}
                          >
                            <span className="block truncate capitalize">{p}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Made for Kids sliding toggle switch */}
              <div className="flex items-center justify-between p-3 bg-zinc-900/40 rounded-xl border border-zinc-800/80 relative z-10">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-zinc-300">Made for kids</span>
                  <span className="text-[10px] text-zinc-500">COPPA compliance setting</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMadeForKids(prev => !prev)}
                  className={clsx(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    madeForKids ? "bg-violet-500" : "bg-zinc-800"
                  )}
                >
                  <span
                    className={clsx(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      madeForKids ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
            </>
          )}

          {/* TikTok Specific Fields */}
          {platform === "tiktok" && (
            <>
              {/* Privacy Select (Custom Dropdown) */}
              <div className="flex flex-col gap-1.5 relative z-30">
                <label className="text-xs font-semibold text-zinc-400">Privacy</label>
                <div className="relative" ref={privacyRef}>
                  <button
                    type="button"
                    id="custom-tiktok-privacy-select"
                    onClick={() => setPrivacyDropdownOpen(!privacyDropdownOpen)}
                    className="flex items-center justify-between w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 outline-none rounded-lg p-2.5 text-xs text-zinc-100 transition-colors cursor-pointer"
                  >
                    <span>
                      {(() => {
                        if (privacy === "PUBLIC_TO_EVERYONE") return "Everyone";
                        if (privacy === "MUTUAL_FOLLOW_FRIENDS") return "Friends";
                        if (privacy === "FOLLOWER_OF_CREATOR") return "Followers";
                        if (privacy === "SELF_ONLY") return "Private (Self Only)";
                        return privacy;
                      })()}
                    </span>
                    <FaChevronDown className={clsx("text-zinc-500 text-[10px] transition-transform duration-200", privacyDropdownOpen && "rotate-180")} />
                  </button>

                  {privacyDropdownOpen && (
                    <div className="absolute left-0 right-0 mt-1 z-50 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl p-1 flex flex-col gap-0.5">
                      {[
                        { label: "Everyone", value: "PUBLIC_TO_EVERYONE" },
                        { label: "Friends", value: "MUTUAL_FOLLOW_FRIENDS" },
                        { label: "Followers", value: "FOLLOWER_OF_CREATOR" },
                        { label: "Private (Self Only)", value: "SELF_ONLY" }
                      ].map((item) => (
                        <button
                          type="button"
                          key={item.value}
                          id={`privacy-option-${item.value}`}
                          onClick={() => {
                            setPrivacy(item.value);
                            setPrivacyDropdownOpen(false);
                          }}
                          className={clsx(
                            "w-full text-left py-2 px-3 rounded text-xs transition-colors hover:bg-zinc-800 cursor-pointer flex items-center",
                            privacy === item.value ? "bg-zinc-800 text-white font-semibold" : "text-zinc-400"
                          )}
                        >
                          <span className="block truncate">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* TikTok Feature toggles */}
              <div className="flex flex-col gap-3">
                {/* Disable Comments */}
                <div className="flex items-center justify-between p-3 bg-zinc-900/40 rounded-xl border border-zinc-800/80">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-zinc-300">Disable comments</span>
                    <span className="text-[10px] text-zinc-500">Prevent viewers from commenting</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDisableComment(prev => !prev)}
                    className={clsx(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                      disableComment ? "bg-violet-500" : "bg-zinc-800"
                    )}
                  >
                    <span
                      className={clsx(
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        disableComment ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>

                {/* Disable Duet */}
                <div className="flex items-center justify-between p-3 bg-zinc-900/40 rounded-xl border border-zinc-800/80">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-zinc-300">Disable duet</span>
                    <span className="text-[10px] text-zinc-500">Prevent other users from duetting</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDisableDuet(prev => !prev)}
                    className={clsx(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                      disableDuet ? "bg-violet-500" : "bg-zinc-800"
                    )}
                  >
                    <span
                      className={clsx(
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        disableDuet ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>

                {/* Disable Stitch */}
                <div className="flex items-center justify-between p-3 bg-zinc-900/40 rounded-xl border border-zinc-800/80">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-zinc-300">Disable stitch</span>
                    <span className="text-[10px] text-zinc-500">Prevent other users from stitching</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDisableStitch(prev => !prev)}
                    className={clsx(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                      disableStitch ? "bg-violet-500" : "bg-zinc-800"
                    )}
                  >
                    <span
                      className={clsx(
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        disableStitch ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Schedule Toggle card */}
          <div className="flex flex-col gap-3 p-3 bg-zinc-900/40 rounded-xl border border-zinc-800 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-zinc-300">Schedule post</span>
                <span className="text-[10px] text-zinc-500">Delay upload for future time</span>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduled(prev => !prev)}
                className={clsx(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                  isScheduled ? "bg-violet-500" : "bg-zinc-800"
                )}
              >
                <span
                  className={clsx(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    isScheduled ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>
            {isScheduled && (
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full mt-2 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 outline-none rounded-lg p-2 text-xs text-zinc-200 transition-colors"
              />
            )}
          </div>

          {/* Action button */}
          <button
            type="submit"
            disabled={submitting || uploading || !selectedAccountId}
            className="w-full py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-xs text-white rounded-xl shadow-lg shadow-violet-500/10 transition-all active:scale-[0.99] cursor-pointer"
          >
            {submitting ? "Processing..." : isScheduled ? "Schedule Post (1 Credit)" : "Publish Now (1 Credit)"}
          </button>
            </>
          )}
        </form>
      </section>

      {/* RIGHT: Mockup Preview & Scheduler Queue */}
      <section className="w-full md:w-1/2 p-6 overflow-y-visible md:overflow-y-auto flex flex-col gap-8 bg-zinc-950/20 shrink-0">
        
        {/* Mock Post Preview */}
        <div className="flex flex-col gap-3 mt-12 md:mt-0">
          <span className="text-xs font-semibold text-zinc-400">Post Mockup Preview</span>
          
          <div className="card-premium p-4 flex flex-col gap-4 overflow-hidden">
            {/* Player Container */}
            <div className="aspect-video bg-zinc-900 rounded-lg flex items-center justify-center relative overflow-hidden border border-zinc-800">
              {mediaUrl ? (
                <video
                  src={mediaUrl}
                  controls
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center text-zinc-600 gap-1.5">
                  <FiPlay className="text-3xl opacity-50" />
                  <span className="text-[10px]">Upload a video to preview</span>
                </div>
              )}
            </div>

            {/* Mock Layout */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-violet-500/20 border border-violet-500/40 text-[9px] font-bold text-violet-400 flex items-center justify-center">
                  U
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-white leading-none">
                    {session?.user?.name || "Your Channel"}
                  </span>
                  <span className="text-[9px] text-zinc-500">
                    {platform === "youtube" ? "YouTube Creator" : platform === "tiktok" ? "TikTok Creator" : `${currentPlatform.name} Creator`}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <h4 className="text-xs font-bold text-zinc-100 truncate">
                  {title || "Mock Title / Caption"}
                </h4>
                {platform === "youtube" && (
                  <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">
                    {description || "No description provided."}
                  </p>
                )}
                {platform === "youtube" && tags && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {tags.split(",").map((t, i) => (
                      <span key={i} className="text-[9px] font-semibold text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded">
                        #{t.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Scheduler Queue */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Scheduler Queue</span>
            <button
              onClick={fetchPosts}
              className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Refresh Queue"
            >
              <FiRefreshCw className="text-xs" />
            </button>
          </div>

          {loadingPosts ? (
            <div className="flex flex-col gap-2">
              <div className="h-16 w-full bg-zinc-900/60 rounded-xl animate-pulse" />
              <div className="h-16 w-full bg-zinc-900/60 rounded-xl animate-pulse" />
            </div>
          ) : posts.length > 0 ? (
            <div className="flex flex-col gap-3">
              {posts.map((post) => (
                <div key={post.id} className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-900 flex flex-col gap-3">
                  {/* Top line details */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {post.platform === "youtube" ? (
                        <FaYoutube className="text-red-500 text-base shrink-0" />
                      ) : (
                        <SiTiktok className="text-cyan-400 text-xs shrink-0" />
                      )}
                      <span className="text-xs font-bold text-white truncate max-w-[120px]">{post.title}</span>
                    </div>

                    {/* Status badges */}
                    <div className="flex items-center gap-2">
                      <span className={clsx(
                        "text-[9px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1",
                        post.status === "scheduled" && "bg-blue-500/10 text-blue-400 border border-blue-500/20",
                        post.status === "processing" && "bg-violet-500/10 text-violet-400 border border-violet-500/20 animate-pulse",
                        post.status === "completed" && "bg-green-500/10 text-green-400 border border-green-500/20",
                        post.status === "failed" && "bg-red-500/10 text-red-400 border border-red-500/20"
                      )}>
                        {post.status === "processing" && <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-ping" />}
                        {post.status}
                      </span>
                    </div>
                  </div>

                  {/* Body details */}
                  <div className="flex flex-col gap-1 text-[10px] text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-zinc-500">Channel:</span>
                      <span className="text-zinc-300">{post.accountName}</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <FaClock className="text-[10px] text-zinc-500" />
                      {post.status === "scheduled" ? (
                        <span>Scheduled: {new Date(post.scheduledAt).toLocaleString()}</span>
                      ) : (
                        <span>Created: {new Date(post.createdAt).toLocaleString()}</span>
                      )}
                    </div>

                    {post.publishedUrl && (
                      <a
                        href={post.publishedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-violet-400 hover:text-violet-300 hover:underline flex items-center gap-1 mt-1 font-semibold"
                      >
                        View Live Post <FiExternalLink className="text-[9px]" />
                      </a>
                    )}

                    {post.error && (
                      <div className="mt-1 text-red-400 bg-red-500/5 p-2 rounded border border-red-500/10 text-[9px] leading-relaxed">
                        {post.error}
                      </div>
                    )}
                  </div>

                  {/* Actions line */}
                  <div className="flex justify-end gap-2 border-t border-zinc-950 pt-2.5">
                    {post.status === "scheduled" && (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/5 rounded transition-colors text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                        title="Cancel Schedule"
                      >
                        <FiTrash2 /> Cancel
                      </button>
                    )}
                    {post.status === "failed" && (
                      <>
                        <button
                          onClick={() => handleRetryPost(post)}
                          className="p-1.5 text-zinc-400 hover:text-violet-400 hover:bg-violet-500/5 rounded transition-colors text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <FiRefreshCw /> Retry
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/5 rounded transition-colors text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                          title="Delete"
                        >
                          <FiTrash2 /> Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-zinc-900 rounded-xl p-8 flex flex-col items-center justify-center text-zinc-600 text-xs">
              No scheduled or published posts found.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
