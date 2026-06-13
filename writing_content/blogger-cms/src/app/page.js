"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { 
  FaSave, FaEye, FaArrowLeft, FaBrain, FaSearchPlus, FaCog, 
  FaFileAlt, FaSpinner, FaPlusCircle, FaRegCheckCircle, FaGlobe, FaChevronRight, FaTimes,
  FaQuestionCircle, FaInfoCircle
} from "react-icons/fa";
import { RichTextEditor } from "@/components/RichTextEditor";
import clsx from "clsx";

function BlogEditorContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const blogId = searchParams.get("id");

  // Editor fields
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [status, setStatus] = useState("draft");

  // SEO fields
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");

  // AI prompt fields
  const [keyword, setKeyword] = useState("");
  const [blogTopic, setBlogTopic] = useState("");

  // System states
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [showNewGroupInput, setShowNewGroupInput] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [activeTab, setActiveTab] = useState("basic"); // "basic", "seo"
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  // Preview modal state
  const [showPreview, setShowPreview] = useState(false);

  // Fetch groups
  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/groups");
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
        if (data.length > 0 && !selectedGroupId) {
          setSelectedGroupId(data[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to load groups", e);
    }
  };

  // Load blog post details if in edit mode
  useEffect(() => {
    if (session) {
      fetchGroups();
      if (blogId) {
        fetch(`/api/blogs?id=${blogId}`)
          .then((res) => {
            if (res.ok) return res.json();
            throw new Error("Failed to load blog post");
          })
          .then((data) => {
            setTitle(data.title || "");
            setContent(data.content || "");
            setAuthor(data.author || "");
            setCoverImage(data.coverImage || "");
            setStatus(data.status || "draft");
            setSeoTitle(data.seoTitle || "");
            setSeoDescription(data.seoDescription || "");
            setSeoKeywords(data.seoKeywords || "");
            setCanonicalUrl(data.canonicalUrl || "");
            setKeyword(data.keyword || "");
            setBlogTopic(data.blogTopic || "");
            setSelectedGroupId(data.groupId || "");
          })
          .catch((err) => {
            setErrorMessage(err.message);
          });
      }
    }
  }, [session, blogId]);

  // Create quick blog group from editor
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName }),
      });
      if (res.ok) {
        const data = await res.json();
        setGroups((prev) => [data, ...prev]);
        setSelectedGroupId(data.id);
        setNewGroupName("");
        setShowNewGroupInput(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Trigger Save
  const handleSave = async () => {
    if (!session) {
      signIn("google");
      return;
    }

    if (!title.trim()) {
      setErrorMessage("Please enter a blog post title.");
      return;
    }

    if (!selectedGroupId) {
      setErrorMessage("Please select or create a blog group first.");
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const payload = {
        id: blogId || undefined,
        groupId: selectedGroupId,
        title,
        content,
        author: author || session.user.name,
        coverImage,
        status,
        seoTitle,
        seoDescription,
        seoKeywords,
        canonicalUrl,
        keyword,
        blogTopic,
      };

      const res = await fetch("/api/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Failed to save blog post");
      }

      const saved = await res.json();
      setSuccessMessage("Blog post saved successfully!");
      if (!blogId) {
        router.push(`/?id=${saved.id}`);
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Trigger AI Generation
  const handleGenerate = async () => {
    if (!session) {
      signIn("google");
      return;
    }

    if (!keyword.trim() || !blogTopic.trim()) {
      setErrorMessage("Please enter both primary keyword and blog topic focus.");
      return;
    }

    if (!selectedGroupId) {
      setErrorMessage("Please select or create a blog group first.");
      return;
    }

    if ((session.user.credits || 0) < 5) {
      setErrorMessage("Insufficient credits. Each AI write costs 5 credits.");
      return;
    }

    setGenerating(true);
    setErrorMessage("");
    setSuccessMessage("");
    setStatusMessage("Submitting generation request...");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: selectedGroupId,
          keyword: keyword.trim(),
          blogTopic: blogTopic.trim(),
        }),
      });

      if (!res.ok) {
        const errText = await res.ok ? "" : await res.text();
        throw new Error(errText || "Failed to start AI generation");
      }

      const data = await res.json();
      pollStatus(data.requestId);
    } catch (err) {
      setErrorMessage(err.message);
      setGenerating(false);
    }
  };

  // Poll status from backend
  const pollStatus = (requestId) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      setStatusMessage(`Writing blog post content (Polling attempt ${attempts})...`);

      try {
        const res = await fetch(`/api/generate/status?requestId=${requestId}`);
        if (!res.ok) throw new Error("Failed to check status");

        const data = await res.json();
        if (data.status === "completed") {
          clearInterval(interval);
          setGenerating(false);
          setStatusMessage("");
          
          // Populate fields with generated content
          const blog = data.blog;
          setTitle(blog.title);
          setContent(blog.content);
          setSeoTitle(blog.seoTitle || "");
          setSeoDescription(blog.seoDescription || "");
          setSeoKeywords(blog.seoKeywords || "");
          setSuccessMessage("AI blog content generated and populated successfully!");
          
          // Update local session credit balance (subtract 5)
          session.user.credits = Math.max(0, (session.user.credits || 5) - 5);

          // Redirect to the new blog editor id if created
          if (blog.id && blog.id !== blogId) {
            router.push(`/?id=${blog.id}`);
          }
        } else if (data.status === "failed") {
          clearInterval(interval);
          setGenerating(false);
          setStatusMessage("");
          setErrorMessage(data.error || "AI generation failed. Credits refunded.");
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-5xl space-y-6 flex flex-col">
        {/* Header Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 font-outfit">
              <span>{blogId ? "Edit Blog Post" : "Create New Blog Post"}</span>
              {blogId && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded dark:bg-indigo-950/40 dark:border-indigo-900/50">
                  Edit Mode
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500 mt-1">Write, generate with AI, and optimize your blogs in one premium dashboard.</p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => router.push("/manage/blog-list")}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-600 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 rounded shadow-sm active:scale-[0.98] transition-all cursor-pointer"
            >
              <FaArrowLeft className="text-[10px]" />
              <span>Back to List</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (!title.trim()) {
                  setErrorMessage("Please enter a title before previewing.");
                  return;
                }
                setShowPreview(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-600 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 rounded shadow-sm active:scale-[0.98] transition-all cursor-pointer"
            >
              <FaEye className="text-xs" />
              <span>Preview</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-750 disabled:bg-slate-400 rounded shadow-md hover:shadow-indigo-500/10 active:scale-[0.98] transition-all cursor-pointer"
            >
              {saving ? <FaSpinner className="animate-spin text-xs" /> : <FaSave className="text-xs" />}
              <span>{saving ? "Saving..." : "Save Blog"}</span>
            </button>
          </div>
        </div>

        {/* Error and Success alerts */}
        {errorMessage && (
          <div className="p-4 bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 rounded-r text-sm text-red-700 dark:text-red-300 flex items-start gap-2 shadow-sm animate-pulse">
            <FaTimes className="mt-0.5 flex-shrink-0 cursor-pointer" onClick={() => setErrorMessage("")} />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-emerald-500 rounded-r text-sm text-emerald-700 dark:text-emerald-300 flex items-start gap-2 shadow-sm">
            <FaRegCheckCircle className="mt-0.5 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* AI Loader */}
        {generating && (
          <div className="p-5 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/20 dark:to-violet-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded flex flex-col items-center justify-center text-center shadow-inner gap-2">
            <FaSpinner className="text-3xl text-indigo-600 dark:text-indigo-400 animate-spin" />
            <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-200">{statusMessage}</h4>
            <p className="text-xs text-indigo-700 dark:text-indigo-300">Please do not refresh this page. Your blog article is being built in the background.</p>
          </div>
        )}

        {/* Tabs selector */}
        <div className="border-b border-slate-200 dark:border-slate-800">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab("basic")}
              className={clsx(
                "pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer",
                activeTab === "basic"
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-slate-400 hover:text-slate-650"
              )}
            >
              Basic Info
            </button>
            <button
              onClick={() => setActiveTab("seo")}
              className={clsx(
                "pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer",
                activeTab === "seo"
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-slate-400 hover:text-slate-650"
              )}
            >
              SEO Settings
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-white dark:bg-slate-900 border border-slate-600 dark:border-slate-850 p-6 md:p-8 rounded shadow-sm space-y-6 pb-14">
          {/* TAB 1: BASIC INFO */}
          {activeTab === "basic" && (
            <div className="space-y-6">
              {/* AI Blog Generator Card */}
              <div className="border border-purple-100 dark:border-purple-900/50 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 p-5 rounded space-y-4">
                <div className="flex items-center gap-2">
                  <FaBrain className="text-purple-600 dark:text-purple-400 text-lg" />
                  <h3 className="text-sm font-extrabold text-purple-900 dark:text-purple-200">AI Blog Generator</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Primary Keyword</label>
                      <div className="group relative">
                        <FaQuestionCircle className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350 text-xs cursor-help" />
                        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 rounded bg-slate-850 dark:bg-slate-800 p-2 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100 shadow-lg text-center z-10 leading-normal">
                          The main keyword to generate the blog post
                        </span>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      placeholder="e.g., sustainable living"
                      className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-950 dark:text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Blog Topic</label>
                      <div className="group relative">
                        <FaQuestionCircle className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350 text-xs cursor-help" />
                        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 rounded bg-slate-850 dark:bg-slate-800 p-2 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100 shadow-lg text-center z-10 leading-normal">
                          The main topic or title for the blog post
                        </span>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={blogTopic}
                      onChange={(e) => setBlogTopic(e.target.value)}
                      placeholder="e.g., 10 tips for eco-friendly lifestyle"
                      className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-950 dark:text-white"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating}
                  className="py-2.5 px-5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-400 text-white text-xs font-bold rounded shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {generating ? <FaSpinner className="animate-spin text-xs" /> : <FaBrain className="text-xs" />}
                  <span>{generating ? "Generating..." : "Generate Blog with AI"}</span>
                </button>
              </div>

              {/* Title & Author Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter blog title"
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-950 dark:text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Author *</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Author name"
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-950 dark:text-white"
                    required
                  />
                </div>
              </div>

              {/* Cover Image Input & Live Preview */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Cover Image URL</label>
                <input
                  type="text"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-950 dark:text-white"
                />
                {coverImage && (
                  <div className="mt-2 rounded overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm max-h-48">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverImage}
                      alt="Cover preview"
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Category Group & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Blog Group / Category *</label>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedGroupId}
                      onChange={(e) => setSelectedGroupId(e.target.value)}
                      className="flex-1 px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-950 dark:text-white"
                    >
                      <option value="">-- Select a Group --</option>
                      {groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowNewGroupInput(!showNewGroupInput)}
                      className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 rounded transition-colors cursor-pointer"
                      title="Create new group"
                    >
                      <FaPlusCircle className="text-sm" />
                    </button>
                  </div>

                  {showNewGroupInput && (
                    <div className="flex items-center gap-2 mt-2 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded">
                      <input
                        type="text"
                        placeholder="New group name..."
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleCreateGroup}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-colors cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2 flex flex-col justify-end">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Publication Status</label>
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-1 rounded border border-slate-200 dark:border-slate-800 h-[46px]">
                    <button
                      type="button"
                      onClick={() => setStatus("draft")}
                      className={clsx(
                        "flex-1 h-full text-xs font-bold rounded transition-all cursor-pointer",
                        status === "draft"
                          ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-655"
                      )}
                    >
                      Draft
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus("published")}
                      className={clsx(
                        "flex-1 h-full text-xs font-bold rounded transition-all cursor-pointer",
                        status === "published"
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/10"
                          : "text-slate-400 hover:text-slate-655"
                      )}
                    >
                      Published
                    </button>
                  </div>
                </div>
              </div>

              {/* Rich Text Editor */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Content *</label>
                <RichTextEditor value={content} onChange={setContent} />
              </div>
            </div>
          )}

          {/* TAB 2: SEO SETTINGS */}
          {activeTab === "seo" && (
            <div className="space-y-6">
              {/* SEO Title */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">SEO Title</label>
                  <span className={clsx(
                    "text-xs font-semibold",
                    seoTitle.length > 60 ? "text-red-500 font-bold animate-pulse" : "text-slate-400"
                  )}>
                    {seoTitle.length}/60 (recommended)
                  </span>
                </div>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="SEO optimized title (leave empty to use blog title)"
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-950 dark:text-white"
                />
                <p className="text-xs text-slate-400">This will appear in search engine results. Keep it under 60 characters.</p>
              </div>

              {/* SEO Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">SEO Description</label>
                  <span className={clsx(
                    "text-xs font-semibold",
                    seoDescription.length > 160 ? "text-red-500 font-bold animate-pulse" : "text-slate-400"
                  )}>
                    {seoDescription.length}/160 (recommended)
                  </span>
                </div>
                <textarea
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="Meta description shown in search result details..."
                  rows={4}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-950 dark:text-white resize-none"
                />
                <p className="text-xs text-slate-400">A brief summary of the post for search engines. Keep it under 160 characters.</p>
              </div>

              {/* SEO Keywords */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">SEO Keywords</label>
                <input
                  type="text"
                  value={seoKeywords}
                  onChange={(e) => setSeoKeywords(e.target.value)}
                  placeholder="comma, separated, keywords"
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-950 dark:text-white"
                />
                <p className="text-xs text-slate-400">Keywords that help search engines understand your content.</p>
              </div>

              {/* Canonical URL */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Canonical URL</label>
                <input
                  type="text"
                  value={canonicalUrl}
                  onChange={(e) => setCanonicalUrl(e.target.value)}
                  placeholder="https://example.com/blog/post-slug"
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-950 dark:text-white"
                />
                <p className="text-xs text-slate-400">The preferred URL for this content (helps prevent duplicate content issues).</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview Dialog Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl max-h-[85vh] bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Blog Article Preview</h3>
                <p className="text-xs text-slate-500">Live preview representation of your article.</p>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Scroll Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10">
              <article className="prose prose-slate max-w-none dark:prose-invert">
                {coverImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={coverImage} 
                    alt="Cover" 
                    className="w-full max-h-[350px] object-cover rounded mb-6 shadow-sm border border-slate-100 dark:border-slate-800" 
                  />
                )}
                
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-2 leading-tight">
                  {title || "Untitled Blog Post"}
                </h1>
                
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-8 border-b border-slate-100 pb-4">
                  <span>By <strong>{author || session?.user?.name || "AI Writer"}</strong></span>
                  <span>•</span>
                  <span>Status: <strong className={status === "published" ? "text-indigo-600" : "text-amber-600"}>{status.toUpperCase()}</strong></span>
                </div>

                <div 
                  dangerouslySetInnerHTML={{ __html: content || "<p className='text-slate-400 italic'>No content written yet.</p>" }} 
                  className="text-slate-800 dark:text-slate-200 leading-relaxed text-base"
                />
              </article>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BlogEditorPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <FaSpinner className="text-4xl text-indigo-600 animate-spin" />
      </div>
    }>
      <BlogEditorContent />
    </Suspense>
  );
}
