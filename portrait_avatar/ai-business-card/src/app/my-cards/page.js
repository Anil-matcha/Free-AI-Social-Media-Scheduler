"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import {
  FaPlus, FaTrashAlt, FaPencilAlt, FaEye, FaQrcode,
  FaDownload, FaSpinner, FaIdCard, FaGoogle, FaUser,
  FaCopy, FaCheck, FaExclamationTriangle
} from "react-icons/fa";
import QRCode from "qrcode";

const TEMPLATES = [
  { id: "neumorphism",       name: "Neumorphism",               emoji: "🫧" },
  { id: "cyberpunk-glitch",  name: "Cyberpunk Glitch",          emoji: "⚡" },
  { id: "holographic-glass", name: "Holographic Glassmorphism", emoji: "🌈" },
  { id: "interactive-3d",    name: "Interactive 3D Tilt",       emoji: "🎯" },
  { id: "swiss-style",       name: "Swiss International Style", emoji: "🇨🇭" },
  { id: "classic",           name: "Classic Minimal",           emoji: "✨" },
  { id: "brutalist-marquee", name: "Brutalist Marquee",         emoji: "🔆" },
];

export default function MyCardsPage() {
  const { data: session, status } = useSession();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [qrModalCard, setQrModalCard] = useState(null);
  const [modalQrUrl, setModalQrUrl] = useState("");

  useEffect(() => {
    if (session?.user) {
      fetchCards();
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [session, status]);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cards");
      if (res.ok) {
        const data = await res.json();
        setCards(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this business card? This action cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/cards?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setCards(p => p.filter(c => c.id !== id));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyLink = (hash, id) => {
    const url = `${window.location.origin}/card/${hash}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShowQr = async (card) => {
    setQrModalCard(card);
    const url = `${window.location.origin}/card/${card.urlHash}`;
    try {
      const qrData = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: { dark: "#111827", light: "#ffffff" }
      });
      setModalQrUrl(qrData);
    } catch (err) {
      console.error(err);
    }
  };

  if (status === "loading" || (loading && cards.length === 0)) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50">
        <FaSpinner className="animate-spin text-3xl text-violet-600 mb-4" />
        <p className="text-sm font-medium text-gray-500">Loading your business cards...</p>
      </div>
    );
  }

  // 1. Logged Out / Unauthorized State
  if (!session?.user) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="h-14 w-14 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mx-auto mb-6">
            <FaIdCard className="text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">My Digital Cards</h1>
          <p className="text-sm text-gray-500 leading-relaxed mb-8">
            Create, customize, and manage all your premium AI-designed interactive business cards in one central place. Sign in to get started.
          </p>
          <button
            onClick={() => signIn("google")}
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 active:bg-violet-800 shadow-md shadow-violet-100 hover:shadow-lg transition-all cursor-pointer"
          >
            <FaGoogle className="text-xs" />
            <span>Sign in with Google</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-950 tracking-tight">My Business Cards</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Manage and edit your interactive AI business cards</p>
          </div>
          <Link
            href="/?new=true"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all w-fit cursor-pointer"
          >
            <FaPlus className="text-[10px]" /> Create New Card
          </Link>
        </div>

        {/* 2. Empty State */}
        {cards.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center shadow-sm max-w-xl mx-auto my-12">
            <div className="h-16 w-16 bg-gray-50 text-gray-300 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FaIdCard className="text-3xl" />
            </div>
            <h2 className="text-lg font-bold text-gray-950 mb-2">No business cards found</h2>
            <p className="text-sm text-gray-500 leading-relaxed max-w-sm mx-auto mb-8">
              It looks like you haven't saved any business cards yet. Customize beautiful templates or generate custom designs with our AI writer!
            </p>
            <Link
              href="/?new=true"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl shadow-md shadow-violet-100 hover:shadow-lg transition-all cursor-pointer"
            >
              <FaPlus className="text-xs" /> Design Your First Card
            </Link>
          </div>
        ) : (
          /* 3. Grid of saved cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((c) => {
              const matchedTemplate = TEMPLATES.find(t => t.id === c.templateId) || { name: "Custom AI Style", emoji: "🪄" };
              return (
                <div
                  key={c.id}
                  className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:scale-[1.01] transition-all flex flex-col h-full group"
                >
                  {/* Top template badge visual */}
                  <div className="h-2 bg-gradient-to-r from-violet-500 via-fuchsia-400 to-indigo-500" />
                  
                  {/* Card content body */}
                  <div className="p-6 flex-1 flex flex-col">
                    {/* User profile preview header */}
                    <div className="flex items-start gap-4 mb-5">
                      <div className="h-12 w-12 rounded-xl bg-violet-50 border border-violet-100/50 flex-shrink-0 overflow-hidden flex items-center justify-center shadow-inner">
                        {c.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.avatar} alt={c.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="text-lg font-bold text-violet-600">
                            {c.name ? c.name.charAt(0) : <FaUser className="text-sm" />}
                          </div>
                        )}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <h2 className="text-sm sm:text-base font-bold text-gray-900 truncate leading-snug group-hover:text-violet-600 transition-colors">
                          {c.name || "Untitled Card"}
                        </h2>
                        <p className="text-xs text-gray-500 font-medium truncate mt-0.5">{c.title || "—"}</p>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider truncate mt-0.5">{c.company || "—"}</p>
                      </div>
                    </div>

                    {/* Meta stats / template descriptor */}
                    <div className="bg-gray-50/70 border border-gray-100 rounded-xl px-4 py-3 text-xs space-y-2 mb-6">
                      <div className="flex justify-between items-center text-gray-500">
                        <span>Theme Layout</span>
                        <span className="font-semibold text-gray-800 flex items-center gap-1.5 bg-white border border-gray-200 px-2 py-0.5 rounded-full text-[10px]">
                          <span>{matchedTemplate.emoji}</span>
                          <span>{matchedTemplate.name}</span>
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-gray-500">
                        <span>Created On</span>
                        <span className="font-medium text-gray-700">
                          {new Date(c.createTime).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-gray-500">
                        <span>Status</span>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          Active Link
                        </span>
                      </div>
                    </div>

                    {/* Action buttons (Grid of quick edits) */}
                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      <Link
                        href={`/?id=${c.id}`}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        <FaPencilAlt className="text-[9px]" /> Edit Card
                      </Link>
                      
                      <a
                        href={`/card/${c.urlHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-violet-50 hover:bg-violet-100 border border-violet-100 text-violet-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        <FaEye className="text-[10px]" /> View Card
                      </a>
                    </div>
                  </div>

                  {/* Footer panel items: delete, copy link, and QR show */}
                  <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
                    <button
                      onClick={() => handleShowQr(c)}
                      className="text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-1 font-medium cursor-pointer"
                      title="Show QR Code"
                    >
                      <FaQrcode className="text-xs" />
                      <span>QR Code</span>
                    </button>

                    <button
                      onClick={() => handleCopyLink(c.urlHash, c.id)}
                      className="text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-1 font-medium cursor-pointer"
                      title="Copy Public Link"
                    >
                      {copiedId === c.id ? (
                        <>
                          <FaCheck className="text-emerald-500 text-[10px]" />
                          <span className="text-emerald-600 font-semibold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <FaCopy className="text-xs" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={deletingId === c.id}
                      className="text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 font-medium disabled:opacity-50 cursor-pointer"
                      title="Delete Card"
                    >
                      {deletingId === c.id ? (
                        <FaSpinner className="animate-spin text-xs" />
                      ) : (
                        <FaTrashAlt className="text-xs" />
                      )}
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* QR Code Dialog Modal */}
        {qrModalCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-2xl max-w-xs w-full p-6 text-center border border-gray-100 shadow-xl relative animate-in fade-in zoom-in duration-200">
              <h3 className="text-sm font-bold text-gray-950 truncate mb-1">
                {qrModalCard.name || "Business Card"}
              </h3>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-4">
                Scan or Download
              </p>

              {/* QR Image Frame */}
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center justify-center mx-auto mb-5 max-w-[200px] aspect-square shadow-inner">
                {modalQrUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={modalQrUrl} alt="QR Code" className="w-full h-full object-contain" />
                ) : (
                  <FaSpinner className="animate-spin text-xl text-gray-300" />
                )}
              </div>

              {/* Action Rows */}
              <div className="space-y-2">
                <a
                  href={modalQrUrl}
                  download={`${qrModalCard.name.replace(/\s+/g, "-")}-qr.png`}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gray-950 hover:bg-gray-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <FaDownload className="text-[10px]" /> Download QR PNG
                </a>
                <button
                  onClick={() => { setQrModalCard(null); setModalQrUrl(""); }}
                  className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
