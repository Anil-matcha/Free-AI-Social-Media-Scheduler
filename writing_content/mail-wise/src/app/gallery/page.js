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
  FaEnvelope,
  FaCalendarAlt,
  FaHistory,
  FaPaperPlane,
  FaGlobe,
  FaQuestion,
  FaHeart,
  FaSadTear,
} from "react-icons/fa";
import Link from "next/link";

function StatusDot({ status }) {
  if (status === "processing")
    return <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse-dot inline-block" />;
  if (status === "completed")
    return <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />;
  return <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />;
}

export default function GalleryPage() {
  const { data: session, status: authStatus } = useSession();
  const [creations, setCreations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [copiedSubjectId, setCopiedSubjectId] = useState(null);

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

  const handleCopyBody = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopySubject = (index, text) => {
    navigator.clipboard.writeText(text);
    setCopiedSubjectId(index);
    setTimeout(() => setCopiedSubjectId(null), 2000);
  };

  if (authStatus === "unauthenticated") {
    return (
      <div className="flex-1 flex flex-col bg-bg-page">
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center gap-6 animate-float">
          <FaImages className="text-5xl text-secondary-text" />
          <div>
            <h1 className="text-2xl font-bold text-primary-text mb-2">Email Gallery</h1>
            <p className="text-secondary-text text-sm mb-6">Sign in to see all your generated email drafts and cold pitches.</p>
          </div>
          <button
            onClick={() => signIn("google")}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-sm transition-all cursor-pointer"
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
      return {
        subjectSuggestions: ["Generated Email Draft"],
        emailBody: creation.resultText,
        signature: "Best regards,\n[Your Name]",
      };
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-bg-page overflow-y-auto scrollbar-subtle">
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary-text flex items-center gap-2">
              <FaImages className="text-primary" />
              Email Draft Gallery
            </h1>
            <p className="text-secondary-text text-sm mt-1">{creations.length} email{creations.length !== 1 ? "s" : ""} generated</p>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            {processing.length > 0 && (
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
                <FaSpinner className="animate-spin text-[10px]" />
                {processing.length} generating
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <FaSpinner className="animate-spin text-primary text-2xl" />
              <p className="text-secondary-text text-sm">Loading your creations…</p>
            </div>
          </div>
        ) : creations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-bg-card border border-divider/50 flex items-center justify-center mb-4">
              <FaMagic className="text-3xl text-secondary-text animate-float" />
            </div>
            <h2 className="text-lg font-semibold text-primary-text mb-2">No drafts generated yet</h2>
            <p className="text-secondary-text text-sm mb-6">Create your first cold outreach or pitch draft in the Studio.</p>
            <Link
              href="/"
              className="px-6 py-2.5 rounded-full bg-primary hover:bg-primary-hover text-white text-sm font-bold shadow-sm"
            >
              Go to Studio →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {creations.map((c) => {
              const data = getParsedText(c);
              const isCopied = copiedId === c.id;
              const defaultSubject = data?.subjectSuggestions?.[0] || "Generated Email Draft";
              return (
                <div
                  key={c.id}
                  className="group relative rounded-2xl border border-divider/50 hover:border-primary/50 transition-all cursor-pointer bg-bg-card flex flex-col p-4 shadow-sm"
                  onClick={() => c.status === "completed" && data && setSelectedItem(c)}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-2 shrink-0">
                    <span className="text-xs font-bold text-primary-text flex items-center gap-1.5 truncate max-w-[70%]">
                      <FaEnvelope className="text-primary text-[10px]" />
                      {c.recipient}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <StatusDot status={c.status} />
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-bg-page border border-divider/30 text-secondary-text font-bold">{c.tone}</span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="flex-1 flex flex-col justify-between min-h-[100px]">
                    {c.status === "processing" ? (
                      <div className="flex-1 flex flex-col items-center justify-center gap-2">
                        <FaSpinner className="animate-spin text-primary text-sm" />
                        <span className="text-[9px] text-secondary-text font-medium">Generating email...</span>
                      </div>
                    ) : c.status === "completed" && data ? (
                      <>
                        <div className="flex flex-col gap-1.5 mb-3">
                          <span className="text-[9px] font-bold text-secondary-text uppercase tracking-widest">Subject Draft</span>
                          <p className="text-xs text-primary font-semibold truncate leading-snug">
                            {defaultSubject}
                          </p>
                          <div className="border-t border-divider/30 my-0.5" />
                          <span className="text-[9px] font-bold text-secondary-text uppercase tracking-widest">Email Body Preview</span>
                          <p className="text-[11px] text-secondary-text line-clamp-3 leading-relaxed whitespace-pre-wrap">
                            {data.emailBody}
                          </p>
                        </div>
                        <div className="flex gap-1.5 justify-end mt-auto pt-3 border-t border-divider/30 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyBody(c.id, data.emailBody + "\n\n" + data.signature);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary hover:bg-primary-hover text-white text-[9px] font-bold shadow-sm cursor-pointer"
                          >
                            {isCopied ? <FaCheck className="text-[8px]" /> : <FaCopy className="text-[8px]" />}
                            {isCopied ? "Copied" : "Copy Body"}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center gap-1">
                        <span className="text-red-500 text-xs font-bold">⚠️ Generation failed</span>
                        <p className="text-[8px] text-secondary-text text-center leading-normal mt-1">{c.error || "Model error"}</p>
                      </div>
                    )}
                  </div>

                  {/* Card Footer Date */}
                  <div className="text-[9px] text-secondary-text mt-2 shrink-0 border-t border-divider/30 pt-2 flex justify-between">
                    <span className="truncate max-w-[60%]">Prompt: {c.prompt.substring(0, 15)}...</span>
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
          className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="relative max-w-lg w-full rounded-2xl overflow-hidden border border-divider/50 shadow-2xl bg-bg-card p-6 flex flex-col gap-4 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-bg-page hover:bg-red-955/20 text-secondary-text hover:text-red-400 border border-divider/50 transition-all cursor-pointer"
            >
              <FaTimes className="text-xs" />
            </button>
            <h3 className="text-sm font-bold text-primary-text mb-1 flex items-center gap-2">
              <FaEnvelope className="text-primary text-xs" />
              AI Showcase Draft Details
            </h3>

            {/* Subject options list */}
            {selectedItem.suggestSubjects && getParsedText(selectedItem)?.subjectSuggestions && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-bold text-secondary-text uppercase tracking-widest">Recommended Subject Lines</span>
                <div className="flex flex-col gap-1.5">
                  {getParsedText(selectedItem)?.subjectSuggestions.map((subject, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-3 px-3.5 py-2 rounded-full border border-divider/50 bg-bg-page text-xs text-primary-text"
                    >
                      <span className="truncate font-medium">{subject}</span>
                      <button
                        onClick={() => handleCopySubject(idx, subject)}
                        className="p-1.5 rounded-full bg-bg-card hover:bg-bg-card-hover border border-divider/50 text-secondary-text hover:text-primary-text"
                      >
                        {copiedSubjectId === idx ? <FaCheck className="text-emerald-500" /> : <FaCopy />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Email body render */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-bold text-secondary-text uppercase tracking-widest">Email Message Body</span>
              <div className="border border-divider/50 bg-bg-page p-4 rounded-2xl max-h-64 overflow-y-auto overscroll-contain text-xs text-primary-text whitespace-pre-wrap leading-relaxed font-mono relative">
                {getParsedText(selectedItem)?.emailBody}
                {"\n\n"}
                {getParsedText(selectedItem)?.signature}

                {/* Floating overlay contextual parameters */}
                <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-full bg-bg-card border border-divider/50 text-[8px] text-secondary-text select-none pointer-events-none font-bold">
                  TONE: {selectedItem.tone.toUpperCase()}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between border-t border-divider/50 pt-4 mt-2">
              <div>
                <p className="text-xs font-bold text-primary-text">Target Recipient: {selectedItem.recipient}</p>
                <p className="text-[9px] text-secondary-text mt-0.5">
                  Generated {new Date(selectedItem.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>
              </div>
              <button
                onClick={() => {
                  const data = getParsedText(selectedItem);
                  if (data) handleCopyBody(selectedItem.id, data.emailBody + "\n\n" + data.signature);
                }}
                className="flex items-center gap-2 px-4.5 py-2.5 rounded-full bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                {copiedId === selectedItem.id ? <FaCheck className="text-xs text-emerald-400" /> : <FaCopy className="text-xs" />}
                {copiedId === selectedItem.id ? "Copied Email!" : "Copy Full Email"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
