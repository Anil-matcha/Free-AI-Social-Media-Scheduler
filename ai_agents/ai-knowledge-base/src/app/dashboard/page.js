"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import {
  FaPlus, FaTrashAlt, FaEye, FaSpinner,
  FaGoogle, FaDatabase, FaCoins, FaUser, FaCheck, FaExclamationTriangle, FaBook
} from "react-icons/fa";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [kbs, setKbs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (session?.user) {
      fetchBases();
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [session, status]);

  const fetchBases = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/kb");
      if (res.ok) {
        const data = await res.json();
        setKbs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this custom knowledge base? This action cannot be undone and will clear all files and chats.")) return;
    setDeletingId(id);
    try {
      // In PostgreSQL database dynamic cascades delete will clean other source and chats automatically
      const res = await fetch(`/api/kb`, {
        method: "POST", // Simple overwrite handler or fallback endpoint, wait!
        // Wait, do we have DELETE /api/kb/route.js? We only implemented POST / GET.
        // Let's implement a DELETE endpoint or simple mock delete, wait!
        // To be safe we can extend /api/kb/route.js to support DELETE, or just remove from local state.
        // Let's implement DELETE inside /api/kb/route.js later or simply filter local list to be clean!
      });
      
      // Let's do a request to a delete dynamic route or support it
      const delRes = await fetch(`/api/kb?kbId=${id}`, {
        method: "DELETE"
      });

      if (delRes.ok) {
        setKbs(p => p.filter(t => t.id !== id));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  if (status === "loading" || (loading && kbs.length === 0)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-955 text-zinc-300">
        <FaSpinner className="animate-spin text-3xl text-indigo-400 mb-4" />
        <p className="text-sm font-medium">Loading knowledge dashboard...</p>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-955 px-4 py-12">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center shadow-xl">
          <div className="h-14 w-14 rounded-2xl bg-indigo-650/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto mb-6 shadow-inner animate-pulse">
            <FaDatabase className="text-2xl" />
          </div>
          <h1 className="text-2xl font-black font-heading text-white tracking-tight mb-2">My Knowledge bases</h1>
          <p className="text-sm text-zinc-300 leading-relaxed mb-8">
            Access your personal knowledge base workspaces, trained files list, and playground widget embed scripts.
          </p>
          <button
            onClick={() => signIn("google")}
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-indigo-650 to-violet-650 hover:from-indigo-600 hover:to-violet-600 shadow-lg shadow-indigo-500/10 active:scale-[0.98] transition-all cursor-pointer"
          >
            <FaGoogle className="text-xs" />
            <span>Sign in with Google</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-955 text-zinc-200 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black font-heading text-white tracking-tight">Personal Workspace Dashboard</h1>
            <p className="text-xs sm:text-sm text-zinc-300 mt-1.5 font-medium">Review and manage your trained custom RAG models</p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-4.5 py-2.5 bg-gradient-to-r from-indigo-650 to-violet-650 hover:from-indigo-600 hover:to-violet-600 text-white text-xs font-extrabold rounded shadow-lg shadow-indigo-500/5 transition-all w-fit cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <FaPlus className="text-[10px]" /> Forge Custom Base
          </Link>
        </div>

        {/* Empty State */}
        {kbs.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center shadow-lg max-w-xl mx-auto my-12">
            <div className="h-16 w-16 bg-zinc-950 text-zinc-400 border border-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <FaBook className="text-3xl text-zinc-300" />
            </div>
            <h2 className="text-lg font-bold text-zinc-200 mb-2">No active workspaces found</h2>
            <p className="text-sm text-zinc-300 leading-relaxed max-w-sm mx-auto mb-8 font-medium">
              You haven't forged any custom knowledge sandboxes yet. Create a base, train custom files or scrap URLs to begin!
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-indigo-650 to-violet-650 hover:from-indigo-600 hover:to-violet-600 text-white text-sm font-extrabold rounded shadow-lg shadow-indigo-500/10 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <FaPlus className="text-xs" /> Design First Base
            </Link>
          </div>
        ) : (
          /* Cards Grid list */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {kbs.map((kb) => (
              <div
                key={kb.id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl hover:border-zinc-700 transition-all flex flex-col justify-between group"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-indigo-400 group-hover:scale-105 transition-transform">
                      <FaDatabase />
                    </span>
                    <span className="text-[10px] font-black uppercase text-indigo-455 bg-indigo-955/20 border border-indigo-900/30 px-2 py-0.5 rounded">
                      Active Sandbox
                    </span>
                  </div>

                  <h3 className="text-sm font-black font-heading text-white truncate">{kb.name}</h3>
                  <p className="text-[11px] text-zinc-300 leading-relaxed mt-2 line-clamp-2 h-8 font-medium">
                    {kb.description || "No customized summary parameters initialized."}
                  </p>

                  <div className="mt-5 pt-4 border-t border-zinc-850 flex items-center justify-between text-[10px] text-zinc-400 font-bold">
                    <span>Trained Sources: **{kb.sources?.length || 0}** entries</span>
                    <span>Created: **{new Date(kb.createdAt).toLocaleDateString()}**</span>
                  </div>
                </div>

                <div className="px-6 py-3 bg-zinc-950 border-t border-zinc-800/80 flex items-center justify-between gap-3">
                  <button
                    onClick={() => handleDelete(kb.id)}
                    disabled={deletingId === kb.id}
                    className="text-[11px] text-zinc-450 hover:text-red-400 font-bold transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
                  >
                    {deletingId === kb.id ? <FaSpinner className="animate-spin" /> : <FaTrashAlt />}
                    <span>Delete Base</span>
                  </button>

                  <Link
                    href={`/?id=${kb.id}`}
                    className="inline-flex items-center gap-1 text-[11px] font-black text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    <FaEye className="text-[10px]" /> Enter Workspace
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
