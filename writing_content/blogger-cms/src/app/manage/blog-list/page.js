"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { 
  FaFolder, FaFolderPlus, FaTrashAlt, FaPen, FaPlus, FaSpinner, 
  FaExclamationCircle, FaUserLock, FaFolderOpen, FaRegFileAlt, FaGlobe, FaEye
} from "react-icons/fa";

function BlogListContent() {
  const { data: session } = useSession();
  const router = useRouter();

  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [blogs, setBlogs] = useState([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingBlogs, setLoadingBlogs] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch groups
  const fetchGroups = async () => {
    setLoadingGroups(true);
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
      console.error(e);
    } finally {
      setLoadingGroups(false);
    }
  };

  // Fetch blogs for selected group
  const fetchBlogs = async (groupId) => {
    if (!groupId) return;
    setLoadingBlogs(true);
    try {
      const res = await fetch(`/api/blogs?groupId=${groupId}`);
      if (res.ok) {
        const data = await res.json();
        setBlogs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBlogs(false);
    }
  };

  // Load initial groups
  useEffect(() => {
    if (session) {
      fetchGroups();
    }
  }, [session]);

  // Load blogs when group selection changes
  useEffect(() => {
    if (session && selectedGroupId) {
      fetchBlogs(selectedGroupId);
    }
  }, [session, selectedGroupId]);

  // Create group
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setGroups((prev) => [data, ...prev]);
        setSelectedGroupId(data.id);
        setNewGroupName("");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete group
  const handleDeleteGroup = async (groupId, event) => {
    event.stopPropagation();
    if (!confirm("Are you sure you want to delete this group and all its blog posts? This cannot be undone.")) return;

    try {
      const res = await fetch(`/api/groups?id=${groupId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setGroups((prev) => prev.filter((g) => g.id !== groupId));
        if (selectedGroupId === groupId) {
          setSelectedGroupId(groups.length > 1 ? groups[0].id : "");
          setBlogs([]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete blog post
  const handleDeleteBlog = async (blogId) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;

    try {
      const res = await fetch(`/api/blogs?id=${blogId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setBlogs((prev) => prev.filter((b) => b.id !== blogId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Quick toggle status (publish / unpublish)
  const handleTogglePublish = async (blog) => {
    const nextStatus = blog.status === "published" ? "draft" : "published";
    try {
      const res = await fetch("/api/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: blog.id,
          groupId: blog.groupId,
          title: blog.title,
          status: nextStatus,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setBlogs((prev) => prev.map((b) => (b.id === blog.id ? updated : b)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="max-w-md w-full text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
            <FaUserLock className="text-2xl" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2">Access Denied</h3>
          <p className="text-slate-500 text-sm mb-6">Please sign in to organize, edit, and publish blog articles.</p>
          <button
            onClick={() => signIn("google")}
            className="w-full py-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all cursor-pointer"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 h-full w-full overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Sidebar - Blog Group Management */}
      <div className="w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full overflow-hidden">
        {/* Create Group Form */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Blog Groups</h3>
          <form onSubmit={handleCreateGroup} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Personal Blog"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer"
              title="Add Group"
            >
              <FaFolderPlus className="text-sm" />
            </button>
          </form>
        </div>

        {/* Groups List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
          {loadingGroups ? (
            <div className="flex justify-center p-6">
              <FaSpinner className="animate-spin text-indigo-600 text-lg" />
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center p-6 text-slate-400 text-xs">
              No groups created yet. Add one above.
            </div>
          ) : (
            groups.map((group) => {
              const isSelected = selectedGroupId === group.id;
              return (
                <div
                  key={group.id}
                  onClick={() => setSelectedGroupId(group.id)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? "bg-indigo-50 dark:bg-slate-800/40 text-indigo-700 dark:text-indigo-400 font-bold border border-indigo-100 dark:border-slate-700"
                      : "text-slate-600 hover:bg-slate-100/50 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800/20"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {isSelected ? (
                      <FaFolderOpen className="text-indigo-600 text-sm flex-shrink-0" />
                    ) : (
                      <FaFolder className="text-slate-400 text-sm flex-shrink-0" />
                    )}
                    <span className="text-xs truncate">{group.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 font-bold">
                      {group._count?.blogs || 0}
                    </span>
                    <button
                      onClick={(e) => handleDeleteGroup(group.id, e)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                      title="Delete Group"
                    >
                      <FaTrashAlt className="text-[10px]" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Panel - Blogs in Selected Group */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 md:p-8">
        <div className="max-w-5xl mx-auto w-full flex flex-col gap-6">
          {/* Header Action Bar */}
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h1 className="text-xl font-extrabold text-slate-950 dark:text-white">
                {groups.find((g) => g.id === selectedGroupId)?.name || "Blog Dashboard"}
              </h1>
              <p className="text-xs text-slate-500">Manage and publish articles inside this folder group.</p>
            </div>

            {selectedGroupId && (
              <button
                onClick={() => router.push(`/?groupId=${selectedGroupId}`)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md active:scale-[0.98] transition-all cursor-pointer"
              >
                <FaPlus className="text-xs" />
                <span>New Blog</span>
              </button>
            )}
          </div>

          {/* Blogs list */}
          {loadingBlogs ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500">
              <FaSpinner className="animate-spin text-3xl text-indigo-600 mb-2" />
              <span className="text-xs font-semibold">Loading blogs...</span>
            </div>
          ) : blogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-12 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl gap-4">
              <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                <FaRegFileAlt className="text-xl" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">No articles yet</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">Write an article from scratch or generate content using AI writer cards.</p>
              </div>
              {selectedGroupId && (
                <button
                  onClick={() => router.push(`/?groupId=${selectedGroupId}`)}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md cursor-pointer"
                >
                  Create first blog post
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {blogs.map((blog) => (
                <div 
                  key={blog.id} 
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                        blog.status === "published"
                          ? "bg-indigo-50 border border-indigo-200 text-indigo-600"
                          : blog.status === "processing"
                            ? "bg-violet-50 border border-violet-200 text-violet-600 animate-pulse"
                            : "bg-slate-100 border border-slate-200 text-slate-600"
                      }`}>
                        {blog.status}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Updated {new Date(blog.updateTime).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-sm font-extrabold text-slate-950 dark:text-white truncate">
                      {blog.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                      By {blog.author} {blog.keyword ? `• Keyword: ${blog.keyword}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {blog.status !== "processing" && (
                      <>
                        <button
                          onClick={() => router.push(`/?id=${blog.id}`)}
                          className="p-2 text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-950 dark:hover:bg-indigo-950/20 border border-slate-200 dark:border-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Edit Post"
                        >
                          <FaPen className="text-xs" />
                        </button>
                        <button
                          onClick={() => handleTogglePublish(blog)}
                          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border rounded-lg transition-all cursor-pointer ${
                            blog.status === "published"
                              ? "bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-600"
                              : "bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-600"
                          }`}
                          title={blog.status === "published" ? "Unpublish Post" : "Publish Post"}
                        >
                          <FaGlobe className="text-[10px]" />
                          <span>{blog.status === "published" ? "Withdraw" : "Publish"}</span>
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDeleteBlog(blog.id)}
                      className="p-2 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 dark:bg-slate-950 dark:hover:bg-red-950/20 border border-slate-200 dark:border-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Delete Post"
                    >
                      <FaTrashAlt className="text-xs" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BlogDashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <FaSpinner className="text-4xl text-indigo-600 animate-spin" />
      </div>
    }>
      <BlogListContent />
    </Suspense>
  );
}
