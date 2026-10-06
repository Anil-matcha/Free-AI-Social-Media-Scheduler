"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  PageIcon,
  PlusIcon,
  SearchIcon,
  GridIcon,
  ListIcon,
  ArrowUpRightIcon,
  TrashIcon,
  CloseIcon,
  ClockIcon,
} from "./Icons";
import { LuUsers, LuActivity, LuUserPlus, LuCheck } from "react-icons/lu";
import CustomDropdown from "./CustomDropdown";

const API_BASE = "http://localhost:8000/api";

const SORT_OPTIONS = [
  { label: "Recently edited", value: "recent" },
  { label: "Name A–Z", value: "name" },
];

const ROLE_OPTIONS = [
  { label: "Editor (Can edit & create)", value: "editor" },
  { label: "Commenter (Can comment)", value: "commenter" },
  { label: "Viewer (Read-only)", value: "viewer" },
];

// Helper to extract clean plaintext preview from Markdown content
export function pageExcerpt(content = "") {
  if (!content) return "";
  return content
    .replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/^\s*(?:[-+*]|\d+[.)])\s+(?:\[[ xX]\]\s+)?/gm, "")
    .replace(/```[\s\S]*?```/g, "Code block")
    .replace(/!?\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`|~]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);
}

export default function SpaceLibrary({
  space,
  pages = [],
  onSelectPage,
  onNewPage,
  onDeletePage,
  isCreatingPage = false,
  onSpaceUpdated,
  authHeaders = {},
  currentUser = null,
  onRequireLogin,
}) {
  const [activeTab, setActiveTab] = useState("pages"); // 'pages' | 'activity'
  const [query, setQuery] = useState("");
  const [layout, setLayout] = useState("grid"); // 'grid' | 'list'
  const [sort, setSort] = useState("recent"); // 'recent' | 'name'

  // Members modal & invitation state
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [members, setMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteNotice, setInviteNotice] = useState("");

  // Activity Feed state
  const [activities, setActivities] = useState([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);

  // Fetch members
  const fetchMembers = async () => {
    if (!space?.id) return;
    try {
      const res = await fetch(`${API_BASE}/spaces/${space.id}/members`, {
        headers: authHeaders,
      });
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (err) {
      console.error("Error loading members:", err);
    }
  };

  // Fetch activities
  const fetchActivities = async () => {
    if (!space?.id) return;
    setIsLoadingActivities(true);
    try {
      const res = await fetch(`${API_BASE}/spaces/${space.id}/activity?limit=30`, {
        headers: authHeaders,
      });
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      }
    } catch (err) {
      console.error("Error loading activity log:", err);
    } finally {
      setIsLoadingActivities(false);
    }
  };

  useEffect(() => {
    if (space?.id) {
      fetchMembers();
      if (activeTab === "activity") {
        fetchActivities();
      }
    }
  }, [space?.id, activeTab]);

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      if (onRequireLogin) onRequireLogin("invite team members");
      return;
    }
    if (!inviteEmail.trim() || !space?.id) return;

    setIsInviting(true);
    setInviteNotice("");
    try {
      const res = await fetch(`${API_BASE}/spaces/${space.id}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      });

      if (res.ok) {
        const newMember = await res.json();
        setMembers((prev) => {
          const filtered = prev.filter((m) => m.user_id !== newMember.user_id);
          return [...filtered, newMember];
        });
        setInviteNotice(`Invited ${newMember.name} as ${inviteRole}!`);
        setInviteEmail("");
        if (onSpaceUpdated) onSpaceUpdated();
      } else {
        const errText = await res.text();
        setInviteNotice(`Failed to invite: ${errText}`);
      }
    } catch (err) {
      setInviteNotice(`Error: ${err.message}`);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!currentUser) {
      if (onRequireLogin) onRequireLogin("remove team members");
      return;
    }
    if (!space?.id || !userId) return;
    try {
      const res = await fetch(`${API_BASE}/spaces/${space.id}/members/${userId}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.user_id !== userId));
        if (onSpaceUpdated) onSpaceUpdated();
      }
    } catch (err) {
      console.error("Error removing member:", err);
    }
  };

  const handleUpdateMemberRole = async (userId, newRole) => {
    if (!currentUser) {
      if (onRequireLogin) onRequireLogin("change member roles");
      return;
    }
    if (!space?.id || !userId) return;
    try {
      const res = await fetch(`${API_BASE}/spaces/${space.id}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({ user_id: userId, role: newRole }),
      });
      if (res.ok) {
        setMembers((prev) =>
          prev.map((m) => (m.user_id === userId ? { ...m, role: newRole } : m))
        );
        if (onSpaceUpdated) onSpaceUpdated();
      }
    } catch (err) {
      console.error("Error updating member role:", err);
    }
  };

  const filtered = useMemo(() => {
    return pages
      .filter((page) =>
        `${page.title} ${page.content || ""}`
          .toLowerCase()
          .includes(query.toLowerCase().trim())
      )
      .sort((a, b) => {
        if (sort === "name") {
          return (a.title || "").localeCompare(b.title || "");
        }
        const timeA = new Date(a.updated_at || a.created_at || 0).getTime();
        const timeB = new Date(b.updated_at || b.created_at || 0).getTime();
        return timeB - timeA || (a.title || "").localeCompare(b.title || "");
      });
  }, [pages, query, sort]);

  const formatDate = (dateString) => {
    if (!dateString) return "Recently";
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fbfbfa] dark:bg-[#141416] text-zinc-900 dark:text-zinc-100 overflow-y-auto select-none transition-colors duration-150">
      <div className="max-w-5xl mx-auto w-full p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1 flex items-center gap-1.5">
              <span>{space?.icon || "📁"}</span>
              <span>SPACE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {space?.name || "Space Library"}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl leading-relaxed">
              {space?.description ||
                "A persistent home for living pages, autonomous agent research, and collaborative documents."}
            </p>

            {/* Team Members Pill & Invite Button */}
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center -space-x-1.5">
                {(members.length > 0 ? members : space?.members || []).slice(0, 4).map((m, idx) => (
                  <div
                    key={m.id || idx}
                    className="w-6 h-6 rounded-full bg-indigo-600 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-[10px] font-bold text-white shadow-xs"
                    title={`${m.name || "Member"} (${m.role || "member"})`}
                  >
                    {(m.name || "U")[0].toUpperCase()}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  fetchMembers();
                  setShowMemberModal(true);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
              >
                <LuUserPlus className="w-3.5 h-3.5 text-indigo-500" />
                <span>Invite & Members ({members.length || space?.members?.length || 1})</span>
              </button>
            </div>
          </div>

          <button
            onClick={!isCreatingPage ? onNewPage : undefined}
            disabled={isCreatingPage}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium text-xs shadow-sm transition-all shrink-0 ${
              isCreatingPage
                ? "bg-zinc-800 text-zinc-400 dark:bg-zinc-200 dark:text-zinc-500 cursor-wait opacity-70"
                : "bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 hover:scale-[1.02] cursor-pointer"
            }`}
          >
            {isCreatingPage ? (
              <div className="w-3.5 h-3.5 border-2 border-white dark:border-zinc-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <PlusIcon className="w-4 h-4" />
            )}
            <span>{isCreatingPage ? "Creating..." : "New page"}</span>
          </button>
        </div>

        {/* View Switcher Tabs: Pages vs Activity Feed */}
        <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("pages")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === "pages"
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-2xs"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              <PageIcon className="w-3.5 h-3.5" />
              <span>Pages ({filtered.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("activity")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === "activity"
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-2xs"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              <LuActivity className="w-3.5 h-3.5 text-indigo-500" />
              <span>Activity Log</span>
            </button>
          </div>
        </div>

        {activeTab === "pages" ? (
          <>
            {/* Toolbar: Search, Sort, View Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <div className="relative w-full">
                  <SearchIcon className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search pages in this space..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-white dark:bg-[#1a1a20] border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors shadow-2xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <CustomDropdown
                  value={sort}
                  onChange={setSort}
                  options={SORT_OPTIONS}
                  size="sm"
                  buttonClassName="bg-white dark:bg-[#1a1a20] border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 py-1.5 px-3 rounded-xl shadow-2xs text-xs"
                  align="right"
                />

                <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-xl border border-zinc-200 dark:border-zinc-700/80">
                  <button
                    type="button"
                    onClick={() => setLayout("grid")}
                    title="Grid view"
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      layout === "grid"
                        ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-2xs"
                        : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    }`}
                  >
                    <GridIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setLayout("list")}
                    title="List view"
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      layout === "list"
                        ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-2xs"
                        : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    }`}
                  >
                    <ListIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Pages Grid or List */}
            {filtered.length > 0 ? (
              layout === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map((page) => (
                    <div
                      key={page.id}
                      onClick={() => onSelectPage(page.id)}
                      className="group relative flex flex-col justify-between p-4 rounded-2xl bg-white dark:bg-[#1a1a20] border border-zinc-200/90 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all hover:shadow-md cursor-pointer select-none text-left"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center text-sm font-semibold">
                            {page.icon || "📄"}
                          </span>
                          <ArrowUpRightIcon className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors opacity-0 group-hover:opacity-100" />
                        </div>

                        <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 tracking-tight line-clamp-1">
                          {page.title || "Untitled page"}
                        </h3>

                        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                          {pageExcerpt(page.content) ||
                            "An empty page, ready to write and edit."}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px] text-zinc-400">
                        <span>Edited {formatDate(page.updated_at)}</span>

                        {onDeletePage && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeletePage(page.id);
                            }}
                            title="Delete page"
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-red-500 transition-opacity cursor-pointer"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-[#1a1a20] border border-zinc-200/90 dark:border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filtered.map((page) => (
                    <div
                      key={page.id}
                      onClick={() => onSelectPage(page.id)}
                      className="group flex items-center justify-between p-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
                        <span className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-sm shrink-0">
                          {page.icon || "📄"}
                        </span>
                        <div className="min-w-0">
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {page.title || "Untitled page"}
                          </div>
                          <div className="text-zinc-400 truncate text-[11px]">
                            {pageExcerpt(page.content) || "No additional text"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 text-zinc-400 text-[11px]">
                        <span>Edited {formatDate(page.updated_at)}</span>
                        <ArrowUpRightIcon className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 opacity-0 group-hover:opacity-100 transition-opacity" />
                        {onDeletePage && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeletePage(page.id);
                            }}
                            title="Delete page"
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 hover:text-red-500 transition-opacity cursor-pointer"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="p-12 text-center border border-dashed border-zinc-300 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-[#18181c]/50">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-400">
                  <PageIcon className="w-6 h-6" />
                </div>
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {query ? "No matching pages found" : "No pages in this Space yet"}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  {query
                    ? "Try searching for a different title or keyword."
                    : "Create your first page to start writing, organizing research, and collaborating with Dot agents."}
                </p>
                {!query && (
                  <button
                    onClick={onNewPage}
                    className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-medium shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                    <span>Create page</span>
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          /* Activity Feed View */
          <div className="space-y-3">
            {isLoadingActivities ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-400 gap-2">
                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs">Loading activity timeline...</span>
              </div>
            ) : activities.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-zinc-300 dark:border-zinc-800 rounded-3xl text-xs text-zinc-400">
                <LuActivity className="w-6 h-6 mx-auto mb-2 text-zinc-400" />
                <p className="font-semibold text-zinc-700 dark:text-zinc-300">No activity logged yet.</p>
                <p className="mt-1">Edits, new members, and page updates will appear here.</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#1a1a20] border border-zinc-200/90 dark:border-zinc-800 rounded-2xl divide-y divide-zinc-100 dark:divide-zinc-800 p-2">
                {activities.map((act) => (
                  <div key={act.id} className="p-3 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs shrink-0 mt-0.5">
                      <LuActivity className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-zinc-900 dark:text-zinc-100 font-medium">
                        {act.summary}
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">
                        {new Date(act.created_at).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Invite & Members Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in">
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-100"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <LuUsers className="w-5 h-5 text-indigo-500" />
                <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100">
                  Space Members & Permissions
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMemberModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Invite by Email Form */}
            <form onSubmit={handleInviteSubmit} className="space-y-3">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Invite teammate by email
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-indigo-500 shadow-2xs"
                />
                <CustomDropdown
                  value={inviteRole}
                  onChange={setInviteRole}
                  options={[
                    { label: "Editor", value: "editor", description: "Can edit and create pages" },
                    { label: "Commenter", value: "commenter", description: "Can comment and discuss" },
                    { label: "Viewer", value: "viewer", description: "Read-only access" },
                  ]}
                  size="md"
                  buttonClassName="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs"
                />
                <button
                  type="submit"
                  disabled={isInviting || !inviteEmail.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isInviting ? "Inviting..." : "Invite"}
                </button>
              </div>

              {inviteNotice && (
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  {inviteNotice}
                </p>
              )}
            </form>

            {/* Current Members List */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                Current Members ({members.length})
              </span>
              <div className="max-h-56 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1">
                {members.map((m) => (
                  <div key={m.id || m.user_id} className="p-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white shadow-2xs">
                        {(m.name || "U")[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                          {m.name}
                        </div>
                        <div className="text-[10px] text-zinc-400">{m.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {m.role === "owner" ? (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                          Owner
                        </span>
                      ) : (
                        <CustomDropdown
                          value={m.role}
                          onChange={(newRole) => handleUpdateMemberRole(m.user_id, newRole)}
                          options={[
                            { label: "Editor", value: "editor" },
                            { label: "Commenter", value: "commenter" },
                            { label: "Viewer", value: "viewer" },
                          ]}
                          size="xs"
                          align="right"
                          buttonClassName="bg-zinc-100 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-md"
                        />
                      )}

                      {m.role !== "owner" && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(m.user_id)}
                          className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                          title="Remove member"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
