"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  IoAlbumsOutline, IoCreateOutline, IoTrashOutline, 
  IoCopyOutline, IoShareSocialOutline, IoTimeOutline, IoSparkles 
} from "react-icons/io5";

export default function Gallery() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState("");

  const fetchResumes = async () => {
    try {
      const res = await fetch("/api/creations");
      if (res.ok) {
        const data = await res.json();
        setResumes(data);
      }
    } catch (err) {
      console.error("Failed to fetch creations:", err);
    } finally {
      setLoading(false);
    }
  };

  // Main list fetch
  useEffect(() => {
    if (status === "unauthenticated") {
      signIn("google");
      return;
    }

    if (status === "authenticated") {
      fetchResumes();
    }
  }, [status]);

  // Periodic polling check (every 4 seconds) if there are any processing records
  useEffect(() => {
    if (status !== "authenticated") return;

    const hasProcessing = resumes.some(r => r.status === "processing");
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      fetchResumes();
    }, 4000);

    return () => clearInterval(interval);
  }, [resumes, status]);

  const handleEdit = (id) => {
    router.push(`/?id=${id}`);
  };

  const handleDuplicate = async (id) => {
    setActionId(id);
    try {
      const res = await fetch("/api/creations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        fetchResumes();
      }
    } catch (err) {
      console.error("Duplication failed:", err);
    } finally {
      setActionId("");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this resume? This cannot be undone.")) return;
    setActionId(id);
    try {
      const res = await fetch(`/api/creations?id=${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setResumes(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error("Deletion failed:", err);
    } finally {
      setActionId("");
    }
  };

  const handleShare = (id) => {
    const url = `${window.location.origin}/resume/share/${id}`;
    navigator.clipboard.writeText(url);
    alert("Shareable resume link copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-emerald-500 animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="flex-1 py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      
      {/* Workspace Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6 mb-10">
        <div>
          <h1 className="font-outfit text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <IoAlbumsOutline className="h-8 w-8 text-emerald-600" />
            Creations Gallery
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Manage your previously generated professional documents, duplicate templates, or host shareable links.
          </p>
        </div>

        <button
          onClick={() => router.push("/")}
          className="rounded bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 text-xs uppercase tracking-wider shadow-md transition cursor-pointer"
        >
          Create New Document
        </button>
      </div>

      {resumes.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded max-w-md mx-auto bg-white shadow-sm">
          <div className="rounded-full bg-slate-50 p-4 border border-slate-100 inline-flex mb-4">
            <IoAlbumsOutline className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 mb-1">No Resumes Found</h3>
          <p className="text-xs text-slate-500 px-8 mb-6">
            You haven&apos;t built any resume creations yet. Let our AI writer help you craft your professional identity.
          </p>
          <button
            onClick={() => router.push("/")}
            className="rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-5 py-2 text-xs font-semibold transition"
          >
            Start Generating
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {resumes.map((resume) => (
            <div
              key={resume.id}
              className="relative rounded border border-slate-200 bg-white p-5 flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition duration-300"
            >
              
              {/* Loader Overlay for active duplicate/delete */}
              {actionId === resume.id && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-sm rounded flex items-center justify-center z-10">
                  <div className="h-6 w-6 rounded-full border-2 border-slate-200 border-t-emerald-500 animate-spin"></div>
                </div>
              )}

              <div className="space-y-4">
                {/* Status Badges */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold font-mono text-slate-400 uppercase">
                    {new Date(resume.createdAt).toLocaleDateString()}
                  </span>

                  {resume.status === "processing" ? (
                    <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 animate-pulse">
                      <IoTimeOutline className="h-3 w-3" />
                      Processing
                    </span>
                  ) : resume.status === "failed" ? (
                    <span className="text-[10px] font-extrabold uppercase tracking-wide text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                      Failed
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <IoSparkles className="h-2.5 w-2.5 text-emerald-600" />
                      Completed
                    </span>
                  )}
                </div>

                {/* Title & Prompt Details */}
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-800 truncate" title={resume.title}>
                    {resume.title}
                  </h3>
                  <p className="text-slate-500 text-[11px] truncate">
                    Style: <span className="text-slate-600 font-semibold uppercase">{resume.templateId}</span> &nbsp;|&nbsp; Font: <span className="text-slate-600 font-semibold">{resume.fontFamily}</span>
                  </p>
                </div>
              </div>

              {/* Lower Action bar */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(resume.id)}
                    className="p-2 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                    title="Edit Document"
                  >
                    <IoCreateOutline className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(resume.id)}
                    className="p-2 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                    title="Duplicate Template"
                  >
                    <IoCopyOutline className="h-4 w-4" />
                  </button>
                  {resume.status === "completed" && (
                    <button
                      onClick={() => handleShare(resume.id)}
                      className="p-2 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                      title="Copy Share Link"
                    >
                      <IoShareSocialOutline className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleDelete(resume.id)}
                  className="p-2 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                  title="Delete Document"
                >
                  <IoTrashOutline className="h-4 w-4" />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </main>
  );
}
