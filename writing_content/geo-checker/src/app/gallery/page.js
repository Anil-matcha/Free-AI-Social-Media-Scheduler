"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import {
  FaSpinner,
  FaGoogle,
  FaImages,
  FaEye,
  FaPlus,
  FaTrashAlt,
  FaGlobe,
  FaCoins,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import clsx from "clsx";

export default function GalleryPage() {
  const { data: session, status } = useSession();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal details state
  const [selectedReport, setSelectedReport] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (session?.user) {
      fetchCompletedReports();
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [session, status]);

  const fetchCompletedReports = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/creations");
      if (res.ok) {
        const data = await res.json();
        // Only display successfully completed entries
        const completed = data.filter((c) => c.status === "completed");
        setReports(completed);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (
      !confirm(
        "Are you sure you want to delete this AI visibility report? This action cannot be undone.",
      )
    )
      return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/creations?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setReports((p) => p.filter((t) => t.id !== id));
        if (selectedReport?.id === id) setSelectedReport(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  if (status === "loading" || (loading && reports.length === 0)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-bg-page text-secondary-text">
        <FaSpinner className="animate-spin text-3xl text-primary mb-4" />
        <p className="text-sm font-medium">Loading audit showroom gallery...</p>
      </div>
    );
  }

  // Logged out state
  if (!session?.user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-page px-4 py-12">
        <div className="max-w-md w-full bg-bg-card border border-divider/50 rounded-2xl p-8 text-center shadow-xl">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto mb-6 shadow-inner animate-pulse">
            <FaGlobe className="text-2xl" />
          </div>
          <h1 className="text-2xl font-bold font-heading text-primary-text tracking-tight mb-2">
            Showroom Gallery
          </h1>
          <p className="text-sm text-secondary-text leading-relaxed mb-8">
            Please sign in to access your audit showroom, view detail report
            parameters, and download completed GEO recommendations.
          </p>
          <button
            onClick={() => signIn("google")}
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl text-sm font-extrabold text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            <FaGoogle className="text-xs" />
            <span>Sign in with Google</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-bg-page text-primary-text py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black font-heading text-primary-text tracking-tight">
              Audit Gallery
            </h1>
            <p className="text-xs sm:text-sm text-secondary-text mt-1.5 font-medium font-sans">
              Browse your completed website AI search optimization reviews
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-4.5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-extrabold rounded-lg shadow-lg shadow-primary/10 transition-all w-fit cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <FaPlus className="text-[10px]" /> Audit Studio
          </Link>
        </div>

        {/* Empty State */}
        {reports.length === 0 ? (
          <div className="bg-bg-card border border-divider/50 rounded-2xl p-12 text-center shadow-lg max-w-xl mx-auto my-12">
            <div className="h-16 w-16 bg-bg-page text-secondary-text border border-divider/50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <FaGlobe className="text-3xl text-primary-text" />
            </div>
            <h2 className="text-lg font-bold text-primary-text mb-2">
              No completed audits yet
            </h2>
            <p className="text-sm text-secondary-text leading-relaxed max-w-sm mx-auto mb-8 font-medium">
              You don't have any successfully finished AI search visibility
              audits in your showroom yet. Audit a site in the studio!
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-primary hover:bg-primary-hover text-white text-sm font-extrabold rounded-lg shadow-lg shadow-primary/10 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <FaPlus className="text-xs" /> Audit Website Now
            </Link>
          </div>
        ) : (
          /* Gallery Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {reports.map((creation) => {
              let enginesChecked = [];
              try {
                enginesChecked = JSON.parse(creation.engines);
              } catch (e) {}

              return (
                <div
                  key={creation.id}
                  onClick={() => {
                    let parsed = null;
                    try {
                      parsed = JSON.parse(creation.reportData);
                    } catch (e) {}
                    setSelectedReport({ ...creation, parsed });
                  }}
                  className="bg-bg-card border border-divider/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl hover:border-divider transition-all flex flex-col h-full group cursor-pointer"
                >
                  {/* Gauge Display Showcase */}
                  <div className="relative aspect-[4/3] bg-bg-page overflow-hidden flex flex-col items-center justify-center p-4 border-b border-divider/50">
                    <div className="relative h-20 w-20 flex items-center justify-center">
                      <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                        <circle
                          cx="40"
                          cy="40"
                          r="32"
                          className="stroke-divider/30"
                          strokeWidth="6"
                          fill="transparent"
                        />
                        <circle
                          cx="40"
                          cy="40"
                          r="32"
                          className="stroke-primary"
                          strokeWidth="6"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 32}
                          strokeDashoffset={
                            2 * Math.PI * 32 -
                            (creation.score / 100) * (2 * Math.PI * 32)
                          }
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="flex flex-col items-center justify-center z-10">
                        <span className="text-lg font-black text-primary-text">
                          {creation.score}%
                        </span>
                        <span className="text-[6px] font-bold text-secondary-text uppercase tracking-widest mt-0.5">
                          Score
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 text-center min-w-0 px-2">
                      <div className="text-xs font-black text-primary-text truncate">
                        {creation.url}
                      </div>
                      <div className="text-[10px] text-secondary-text truncate mt-1">
                        "{creation.keyword}"
                      </div>
                    </div>

                    {/* Hover eye indicator */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <div className="h-10 w-10 bg-bg-card border border-divider/50 rounded-full flex items-center justify-center text-white shadow-lg">
                        <FaEye />
                      </div>
                    </div>

                    {/* Floating parameters badge */}
                    <span className="absolute top-3 left-3 text-[7px] font-bold text-primary bg-bg-page border border-divider/50 px-2 py-0.5 rounded-lg shadow uppercase">
                      GEO Report
                    </span>
                  </div>

                  {/* Card footer details */}
                  <div className="p-4 bg-bg-card flex items-center justify-between text-[10px] text-secondary-text font-bold">
                    <span>
                      {new Date(creation.createTime).toLocaleDateString(
                        undefined,
                        { month: "short", day: "numeric" },
                      )}
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(creation.id);
                        }}
                        disabled={deletingId === creation.id}
                        className="text-secondary-text hover:text-red-450 transition-colors flex items-center gap-1 font-bold disabled:opacity-50 cursor-pointer"
                        title="Delete Report"
                      >
                        {deletingId === creation.id ? (
                          <FaSpinner className="animate-spin text-[9px]" />
                        ) : (
                          <FaTrashAlt />
                        )}
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── Detail Modal overlay ────────────────────── */}
        {selectedReport && selectedReport.parsed && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md transition-opacity"
            onClick={() => setSelectedReport(null)}
          >
            <div
              className="bg-bg-card border border-divider/50 rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200 flex flex-col overflow-hidden max-h-[95vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between border-b border-divider/50 pb-3 mb-4 flex-shrink-0">
                <div>
                  <h3 className="text-sm sm:text-base font-bold font-heading text-primary-text flex items-center gap-2">
                    <span>GEO Audit Details: {selectedReport.url}</span>
                    <span className="text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-lg uppercase">
                      18 Credits Used
                    </span>
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-secondary-text hover:text-primary-text font-bold text-sm p-1.5 hover:bg-bg-card-hover rounded-lg transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Modal Display Area */}
              <div className="flex-1 overflow-y-auto min-h-0 space-y-5 pr-1">
                {/* Score gauge grids */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-bg-page p-4 border border-divider/50 rounded-xl items-center justify-center">
                  <div className="sm:col-span-1 flex justify-center">
                    <div className="relative h-20 w-20 flex items-center justify-center">
                      <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                        <circle
                          cx="40"
                          cy="40"
                          r="32"
                          className="stroke-divider/30"
                          strokeWidth="6"
                          fill="transparent"
                        />
                        <circle
                          cx="40"
                          cy="40"
                          r="32"
                          className="stroke-primary"
                          strokeWidth="6"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 32}
                          strokeDashoffset={
                            2 * Math.PI * 32 -
                            (selectedReport.score / 100) * (2 * Math.PI * 32)
                          }
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="flex flex-col items-center justify-center z-10">
                        <span className="text-lg font-black text-primary-text">
                          {selectedReport.score}%
                        </span>
                        <span className="text-[6px] font-bold text-secondary-text uppercase tracking-widest mt-0.5">
                          Visibility
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-3 grid grid-cols-3 gap-2">
                    <div className="bg-bg-card/60 p-2.5 border border-divider/50 rounded-lg text-center">
                      <div className="text-sm font-black text-primary">
                        {selectedReport.parsed.eeat_score}%
                      </div>
                      <div className="text-[7px] font-bold text-secondary-text uppercase tracking-widest mt-0.5">
                        E-E-A-T
                      </div>
                    </div>
                    <div className="bg-bg-card/60 p-2.5 border border-divider/50 rounded-lg text-center">
                      <div className="text-sm font-black text-primary">
                        {selectedReport.parsed.citation_likelihood}%
                      </div>
                      <div className="text-[7px] font-bold text-secondary-text uppercase tracking-widest mt-0.5">
                        Citation
                      </div>
                    </div>
                    <div className="bg-bg-card/60 p-2.5 border border-divider/50 rounded-lg text-center">
                      <div className="text-sm font-black text-primary">
                        {selectedReport.parsed.readability_score}%
                      </div>
                      <div className="text-[7px] font-bold text-secondary-text uppercase tracking-widest mt-0.5">
                        Readability
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-bg-page/40 p-4 border border-divider/50 rounded-xl">
                  <span className="text-[8px] font-bold text-secondary-text uppercase tracking-wider block mb-1">
                    Audit Summary
                  </span>
                  <p className="text-xs text-primary-text leading-relaxed font-medium">
                    {selectedReport.parsed.summary}
                  </p>
                </div>

                {/* Strengths & Weaknesses */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-bg-page/20 border border-divider/50 p-4 rounded-xl space-y-2">
                    <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-wider block">
                      AI Strengths
                    </span>
                    <ul className="space-y-1.5">
                      {selectedReport.parsed.strengths?.map((str, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-primary-text flex items-start gap-2 leading-relaxed font-medium"
                        >
                          <span className="text-emerald-500 font-bold">✓</span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-bg-page/20 border border-divider/50 p-4 rounded-xl space-y-2">
                    <span className="text-[8px] font-bold text-red-400 uppercase tracking-wider block">
                      AI Gaps
                    </span>
                    <ul className="space-y-1.5">
                      {selectedReport.parsed.weaknesses?.map((weak, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-primary-text flex items-start gap-2 leading-relaxed font-medium"
                        >
                          <span className="text-red-500 font-bold">✕</span>
                          <span>{weak}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Technical Audit Signals */}
                {selectedReport.parsed.technical_audit && (
                  <div className="bg-bg-page/30 border border-divider/50 rounded-xl overflow-hidden">
                    <div className="px-4 py-2 border-b border-divider/50 bg-bg-page">
                      <span className="text-[8px] font-bold text-secondary-text uppercase tracking-wider block">
                        Technical Signals Audit
                      </span>
                    </div>
                    <div className="p-3.5 space-y-1.5 text-xs font-semibold">
                      <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-divider/30 items-center">
                        <span className="text-secondary-text">robots.txt</span>
                        <span className="col-span-2 text-primary-text">
                          {selectedReport.parsed.technical_audit.robots_txt}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-divider/30 items-center">
                        <span className="text-secondary-text">schema.org</span>
                        <span className="col-span-2 text-primary-text">
                          {selectedReport.parsed.technical_audit.schema_markup}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 py-1.5 items-center">
                        <span className="text-secondary-text">XML sitemap</span>
                        <span className="col-span-2 text-primary-text">
                          {selectedReport.parsed.technical_audit.sitemap}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recommendations roadmap */}
                <div className="space-y-2">
                  <span className="text-[8px] font-bold text-secondary-text uppercase tracking-wider block">
                    Recommendations Roadmap
                  </span>
                  <div className="space-y-2">
                    {selectedReport.parsed.recommendations?.map((rec, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-bg-page border border-divider/50 rounded-xl flex items-start gap-3"
                      >
                        <div
                          className={clsx(
                            "text-[8px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded text-center flex-shrink-0 mt-0.5",
                            rec.priority === "High"
                              ? "bg-red-950/20 text-red-400 border border-red-900/30"
                              : rec.priority === "Medium"
                                ? "bg-amber-950/20 text-amber-300 border border-amber-800/30"
                                : "bg-bg-card-hover text-secondary-text border border-divider/50",
                          )}
                        >
                          {rec.priority}
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-xs font-black text-primary-text">
                            {rec.area}
                          </div>
                          <div className="text-xs text-secondary-text leading-relaxed font-medium">
                            {rec.tips}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Actions Footer */}
              <div className="border-t border-divider/50 pt-4 mt-4 flex justify-between items-center gap-3 flex-shrink-0">
                <button
                  onClick={() => handleDelete(selectedReport.id)}
                  disabled={deletingId === selectedReport.id}
                  className="px-4 py-2 bg-red-950/20 hover:bg-red-900/30 text-red-400 border border-red-900/30 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <FaTrashAlt className="text-[10px]" /> Delete Report
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const downloadUrl = `/api/download?url=${encodeURIComponent(
                        `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(selectedReport.parsed, null, 2))}`,
                      )}`;
                      const a = document.createElement("a");
                      a.href = downloadUrl;
                      a.download = `geo_audit_${selectedReport.id}.json`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }}
                    className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center gap-1.5 hover:scale-[1.02]"
                  >
                    Download JSON
                  </button>
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="px-4 py-2 bg-bg-card-hover hover:bg-bg-elevated text-primary-text rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
