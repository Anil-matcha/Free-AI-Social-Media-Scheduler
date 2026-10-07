"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import { generateCardDocument } from "@/lib/templates";
import {
  FaMagic,
  FaSave,
  FaPlus,
  FaCheck,
  FaGlobe,
  FaArrowRight,
  FaTrashAlt,
  FaRobot,
  FaSpinner,
  FaChevronDown,
  FaQrcode,
  FaDownload,
  FaCopy,
  FaExternalLinkAlt,
  FaIdCard,
  FaShareAlt,
  FaPencilAlt,
  FaEye,
} from "react-icons/fa";
import QRCode from "qrcode";

const TEMPLATES = [
  { id: "neumorphism", name: "Neumorphism", emoji: "🫧" },
  { id: "cyberpunk-glitch", name: "Cyberpunk Glitch", emoji: "⚡" },
  { id: "holographic-glass", name: "Holographic Glassmorphism", emoji: "🌈" },
  { id: "interactive-3d", name: "Interactive 3D Tilt", emoji: "🎯" },
  { id: "swiss-style", name: "Swiss International Style", emoji: "🇨🇭" },
  { id: "classic", name: "Classic Minimal", emoji: "✨" },
  { id: "brutalist-marquee", name: "Brutalist Marquee", emoji: "🔆" },
];

const SOCIAL_FIELDS = [
  "github",
  "linkedin",
  "twitter",
  "instagram",
  "facebook",
  "youtube",
  "dribbble",
  "behance",
];

const EMPTY_FORM = {
  name: "",
  title: "",
  company: "",
  bio: "",
  phone: "",
  email: "",
  website: "",
  address: "",
  avatar: "",
  backgroundImage: "",
  socialLinks: {},
  showAiAssistant: true,
  templateId: "neumorphism",
  htmlContent: "",
  userPrompt: "",
};

// Shared input/label styles
const inp =
  "w-full bg-bg-card border border-divider/50 rounded px-3 py-2 text-sm text-primary-text placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all";
const lbl =
  "block text-[11px] font-semibold text-secondary-text mb-1 uppercase tracking-wider";

export default function Home() {
  const { data: session } = useSession();
  const [cards, setCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [aiStatus, setAiStatus] = useState("");
  const [aiError, setAiError] = useState("");
  const [aiTimer, setAiTimer] = useState(15);
  const [urlHash, setUrlHash] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);
  // Mobile tab: "edit" | "preview" | "share"
  const [mobileTab, setMobileTab] = useState("edit");
  // Desktop right panel toggle on md screens
  const [shareOpen, setShareOpen] = useState(false);
  const templateDropRef = useRef(null);
  const iframeRef = useRef(null);

  const [formData, setFormData] = useState({
    ...EMPTY_FORM,
    name: "John Doe",
    title: "Senior Product Designer",
    company: "Acme Corporation",
    bio: "Passionate about creating modern user interfaces and building scalable design systems.",
    phone: "+1 (555) 019-2834",
    email: "john.doe@example.com",
    website: "https://johndoe.design",
    address: "San Francisco, CA",
    socialLinks: {
      github: "https://github.com",
      linkedin: "https://linkedin.com",
      twitter: "https://twitter.com",
    },
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        templateDropRef.current &&
        !templateDropRef.current.contains(e.target)
      ) {
        setTemplateOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (session?.user) fetchCards();
  }, [session]);

  useEffect(() => {
    if (cards.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const idParam = params.get("id");
      const newParam = params.get("new");
      if (idParam) {
        const matching = cards.find((c) => c.id === idParam);
        if (matching && selectedCardId !== idParam) {
          loadCard(matching);
        }
      } else if (newParam && selectedCardId !== "") {
        handleCreateNew();
      }
    }
  }, [cards]);

  useEffect(() => {
    if (urlHash) {
      const url = `${window.location.origin}/card/${urlHash}`;
      QRCode.toDataURL(url, {
        width: 220,
        margin: 2,
        color: { dark: "#111827", light: "#ffffff" },
      })
        .then(setQrDataUrl)
        .catch(() => {});
    } else {
      setQrDataUrl("");
    }
  }, [urlHash]);

  const fetchCards = async () => {
    try {
      const res = await fetch("/api/cards");
      if (res.ok) {
        const data = await res.json();
        setCards(data);

        const params = new URLSearchParams(window.location.search);
        const idParam = params.get("id");
        const newParam = params.get("new");

        if (idParam) {
          const matching = data.find((c) => c.id === idParam);
          if (matching) {
            loadCard(matching);
          } else if (data.length > 0) {
            loadCard(data[0]);
          }
        } else if (newParam) {
          handleCreateNew();
        } else {
          if (data.length > 0 && !selectedCardId) {
            loadCard(data[0]);
          }
        }
      }
    } catch (e) {}
  };

  const loadCard = (card) => {
    setSelectedCardId(card.id);
    setUrlHash(card.urlHash);
    let socials = {};
    try {
      socials =
        typeof card.socialLinks === "string"
          ? JSON.parse(card.socialLinks)
          : card.socialLinks || {};
    } catch (e) {}
    setFormData({
      name: card.name || "",
      title: card.title || "",
      company: card.company || "",
      bio: card.bio || "",
      phone: card.phone || "",
      email: card.email || "",
      website: card.website || "",
      address: card.address || "",
      avatar: card.avatar || "",
      backgroundImage: card.backgroundImage || "",
      socialLinks: socials,
      showAiAssistant: card.showAiAssistant !== false,
      templateId: card.templateId || "neumorphism",
      htmlContent: card.htmlContent || "",
      userPrompt: card.userPrompt || "",
    });
  };

  const handleCreateNew = () => {
    setSelectedCardId("");
    setUrlHash("");
    setFormData({ ...EMPTY_FORM });
  };
  const handleInput = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((p) => ({
      ...p,
      [name]: type === "checkbox" ? checked : value,
    }));
  };
  const handleSocialInput = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({
      ...p,
      socialLinks: { ...p.socialLinks, [name]: value },
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const d = await res.json();
        if (d.url) setFormData((p) => ({ ...p, avatar: d.url }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (asNew = false) => {
    if (!session?.user) {
      signIn("google");
      return;
    }
    setSaveStatus("saving");
    try {
      const cardIdToSave = asNew ? undefined : selectedCardId || undefined;
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cardIdToSave, ...formData }),
      });
      if (res.ok) {
        const saved = await res.json();
        setSaveStatus("saved");
        setSelectedCardId(saved.id);
        setUrlHash(saved.urlHash);

        if (typeof window !== "undefined") {
          window.history.replaceState({}, "", `/?id=${saved.id}`);
        }

        fetchCards();
        setTimeout(() => setSaveStatus(""), 3000);
      } else {
        setSaveStatus("error");
      }
    } catch (e) {
      setSaveStatus("error");
    }
  };

  const handleDelete = async () => {
    if (!selectedCardId || !confirm("Delete this card?")) return;
    try {
      const res = await fetch(`/api/cards?id=${selectedCardId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        handleCreateNew();
        fetchCards();
      }
    } catch (e) {}
  };

  const handleGenerateAI = async () => {
    if (!session?.user) {
      signIn("google");
      return;
    }
    if ((session.user.credits ?? 0) < 5) {
      alert("You need at least 5 credits.");
      return;
    }
    setAiStatus("generating");
    setAiError("");
    try {
      const saveRes = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedCardId || undefined, ...formData }),
      });
      if (!saveRes.ok) throw new Error("Save failed");
      const savedCard = await saveRes.json();
      setSelectedCardId(savedCard.id);
      setUrlHash(savedCard.urlHash);
      const genRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: savedCard.id,
          userPrompt: formData.userPrompt,
        }),
      });
      if (!genRes.ok) throw new Error(await genRes.text());
      const { requestId } = await genRes.json();
      setAiStatus("polling");
      setAiTimer(15);
      const tick = setInterval(
        () => setAiTimer((p) => (p > 1 ? p - 1 : 1)),
        1000,
      );
      let tries = 0;
      const poll = setInterval(async () => {
        tries++;
        if (tries > 20) {
          clearInterval(poll);
          clearInterval(tick);
          setAiStatus("error");
          setAiError("Timed out.");
          return;
        }
        try {
          const st = await fetch(
            `/api/generate/status?cardId=${savedCard.id}&requestId=${requestId}`,
          );
          if (st.ok) {
            const d = await st.json();
            if (d.status === "completed") {
              clearInterval(poll);
              clearInterval(tick);
              setAiStatus("completed");
              loadCard(d.card);
              fetchCards();
              setTimeout(() => setAiStatus(""), 4000);
            } else if (d.status === "failed") {
              clearInterval(poll);
              clearInterval(tick);
              setAiStatus("error");
              setAiError(d.error || "Failed");
            }
          }
        } catch (e) {}
      }, 2000);
    } catch (err) {
      setAiStatus("error");
      setAiError(err.message);
    }
  };

  // Download card as PNG via canvas
  const handleDownload = async () => {
    if (!iframeRef.current) return;
    try {
      const html2canvasMod = await import("html2canvas");
      const html2canvas = html2canvasMod.default || html2canvasMod;
      const iframeDoc = iframeRef.current.contentDocument;
      if (!iframeDoc) return;
      const canvas = await html2canvas(iframeDoc.body, {
        useCORS: true,
        scale: 2,
      });
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `${formData.name || "card"}-business-card.png`;
      a.click();
    } catch (e) {
      // Fallback: open card page for manual save
      if (urlHash) window.open(`/card/${urlHash}`, "_blank");
    }
  };

  const cardUrl = urlHash
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/card/${urlHash}`
    : "";
  const selectedTemplate =
    TEMPLATES.find((t) => t.id === formData.templateId) || TEMPLATES[0];
  const handleCopyUrl = () => {
    if (cardUrl) {
      navigator.clipboard.writeText(cardUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ─── Sub-components ──────────────────────────────────────
  const FormPanel = () => (
    <div className="flex flex-col h-full">
      {/* Saved cards list */}
      {session?.user && cards.length > 0 && (
        <div className="px-4 py-3 border-b border-divider/50">
          <div className="flex items-center justify-between mb-2">
            <span className={lbl}>My Cards</span>
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-1 text-[11px] text-primary font-semibold hover:text-primary-hover"
            >
              <FaPlus className="text-[9px]" /> New
            </button>
          </div>
          <div className="flex flex-col gap-1 max-h-28 overflow-y-auto scrollbar-subtle">
            {cards.map((c) => (
              <div
                key={c.id}
                role="button"
                onClick={() => loadCard(c)}
                className={`w-full cursor-pointer flex items-center gap-2.5 px-3 py-2 rounded text-left text-xs transition-all ${
                  selectedCardId === c.id
                    ? "bg-primary/10 border border-primary/20 text-primary"
                    : "border border-transparent hover:bg-bg-card-hover text-secondary-text"
                }`}
              >
                <FaIdCard
                  className={`flex-shrink-0 ${selectedCardId === c.id ? "text-primary" : "text-secondary-text/50"}`}
                />
                <div className="min-w-0">
                  <p className="font-semibold truncate text-primary-text">
                    {c.name || "Untitled"}
                  </p>
                  <p className="text-[10px] text-secondary-text truncate">
                    {c.company || "—"}
                  </p>
                </div>
                {selectedCardId === c.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete();
                    }}
                    className="ml-auto text-secondary-text/50 hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <FaTrashAlt className="text-[10px]" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scrollable form */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 scrollbar-subtle">
        {/* Template picker */}
        <div>
          <label className={lbl}>
            Template{" "}
            <span className="normal-case font-normal text-secondary-text/60">
              (optional)
            </span>
          </label>
          <div className="relative" ref={templateDropRef}>
            <button
              type="button"
              onClick={() => setTemplateOpen((o) => !o)}
              className="w-full flex items-center justify-between bg-bg-card border border-divider/50 rounded px-3 py-2.5 text-sm font-medium text-primary-text hover:border-primary focus:outline-none transition-all"
            >
              <div className="flex items-center gap-2">
                <span>{selectedTemplate.emoji}</span>
                <span className="truncate">{selectedTemplate.name}</span>
              </div>
              <FaChevronDown
                className={`text-secondary-text text-[10px] flex-shrink-0 transition-transform ${templateOpen ? "rotate-180" : ""}`}
              />
            </button>
            {templateOpen && (
              <div className="absolute z-[100] top-full mt-1 left-0 right-0 bg-bg-card border border-divider rounded shadow-xl overflow-hidden">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setFormData((p) => ({ ...p, templateId: t.id }));
                      setTemplateOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-bg-card-hover transition-colors ${
                      formData.templateId === t.id
                        ? "bg-primary/10 text-primary"
                        : "text-primary-text"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span>{t.emoji}</span>
                      <span className="font-medium text-sm">{t.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                        Free
                      </span>
                      {formData.templateId === t.id && (
                        <FaCheck className="text-primary text-[10px]" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {formData.templateId === "custom" && (
            <p className="mt-1 text-[11px] text-primary font-medium">
              ✨ Custom AI layout active
            </p>
          )}
        </div>

        {/* Identity */}
        <div className="space-y-2.5">
          <p className={lbl}>Identity</p>
          <div>
            <label className="text-[11px] text-secondary-text block mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInput}
              placeholder="John Doe"
              className={inp}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-secondary-text block mb-1">
                Job Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInput}
                placeholder="Designer"
                className={inp}
              />
            </div>
            <div>
              <label className="text-[11px] text-secondary-text block mb-1">
                Company
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleInput}
                placeholder="Acme Corp"
                className={inp}
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-secondary-text block mb-1">
              Bio
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInput}
              rows={3}
              placeholder="Short professional bio..."
              className={`${inp} resize-none`}
            />
          </div>
        </div>

        {/* Photo */}
        <div>
          <label className={lbl}>Profile Photo</label>
          <div className="flex items-center gap-3 p-3 bg-bg-page/50 rounded border border-dashed border-divider/50">
            <div className="w-11 h-11 rounded overflow-hidden border border-divider bg-bg-card flex items-center justify-center text-secondary-text flex-shrink-0">
              {isUploading ? (
                <FaSpinner className="animate-spin text-primary text-sm" />
              ) : formData.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={formData.avatar}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUploading}
                className="text-[11px] text-secondary-text w-full file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[11px] file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer disabled:opacity-50"
              />
              <p className="text-[10px] text-secondary-text/60 mt-0.5">
                PNG, JPG · max 5MB
              </p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="space-y-2.5">
          <p className={lbl}>Contact</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-secondary-text block mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInput}
                placeholder="you@email.com"
                className={inp}
              />
            </div>
            <div>
              <label className="text-[11px] text-secondary-text block mb-1">
                Phone
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInput}
                placeholder="+1 555 000"
                className={inp}
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-secondary-text block mb-1">
              Website
            </label>
            <input
              type="text"
              name="website"
              value={formData.website}
              onChange={handleInput}
              placeholder="https://yoursite.com"
              className={inp}
            />
          </div>
          <div>
            <label className="text-[11px] text-secondary-text block mb-1">
              Location
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInput}
              placeholder="City, Country"
              className={inp}
            />
          </div>
        </div>

        {/* Social Links */}
        <div className="space-y-2">
          <p className={lbl}>Social Links</p>
          {SOCIAL_FIELDS.map((field) => (
            <div key={field} className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-secondary-text uppercase w-14 flex-shrink-0 text-right">
                {field}
              </span>
              <input
                type="text"
                name={field}
                value={formData.socialLinks[field] || ""}
                onChange={handleSocialInput}
                placeholder="https://..."
                className={inp}
              />
            </div>
          ))}
        </div>

        {/* AI Assistant toggle */}
        <div className="flex items-center justify-between py-2.5 px-3 bg-bg-page/50 rounded border border-divider/50">
          <div className="flex items-center gap-2">
            <FaRobot className="text-primary text-sm" />
            <div>
              <p className="text-xs font-semibold text-primary-text">
                AI Visitor Assistant
              </p>
              <p className="text-[10px] text-secondary-text">
                Let visitors chat with your AI clone
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
            <input
              type="checkbox"
              name="showAiAssistant"
              checked={formData.showAiAssistant}
              onChange={handleInput}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-divider/50 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-primary-btn-text after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
          </label>
        </div>
      </div>

      {/* Save button */}
      <div className="p-4 border-t border-divider/50 bg-bg-card">
        {selectedCardId ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleSave(false)}
              disabled={saveStatus === "saving"}
              className="bg-primary hover:bg-primary-hover text-white rounded py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              {saveStatus === "saving" ? (
                <>
                  <FaSpinner className="animate-spin text-[10px]" />
                  <span>Saving…</span>
                </>
              ) : saveStatus === "saved" ? (
                <>
                  <FaCheck className="text-emerald-400 text-[10px]" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <FaSave className="text-[10px]" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saveStatus === "saving"}
              className="bg-bg-card hover:bg-bg-card-hover text-primary border border-divider rounded py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              <FaPlus className="text-[9px]" />
              <span>Save as New Copy</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => handleSave(false)}
            disabled={saveStatus === "saving"}
            className="w-full bg-primary hover:bg-primary-hover text-white rounded py-2.5 text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {saveStatus === "saving" ? (
              <>
                <FaSpinner className="animate-spin text-xs" />
                <span>Saving…</span>
              </>
            ) : saveStatus === "saved" ? (
              <>
                <FaCheck className="text-emerald-400 text-xs" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <FaSave className="text-xs" />
                <span>Save Card</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );

  const PreviewPanel = () => (
    <div className="flex-1 flex flex-col overflow-hidden bg-bg-page">
      {/* Preview toolbar */}
      <div className="px-4 py-3 bg-bg-card border-b border-divider/50 flex items-center justify-between gap-3 flex-shrink-0">
        <div className="min-w-0">
          <h1 className="text-sm font-bold text-primary-text leading-none">
            Live Preview
          </h1>
          <p className="text-[11px] text-secondary-text mt-0.5">
            Updates as you type
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {urlHash && (
            <>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary-text bg-bg-card border border-divider px-2.5 py-1.5 rounded hover:bg-bg-card-hover transition-all cursor-pointer"
              >
                <FaDownload className="text-[10px]" />
                <span className="hidden sm:inline">Download</span>
              </button>
              <a
                href={`/card/${urlHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1.5 rounded hover:bg-primary/20 transition-all"
              >
                <FaGlobe className="text-[10px]" />
                <span className="hidden sm:inline">Open</span>
                <FaArrowRight className="text-[9px]" />
              </a>
            </>
          )}
          {/* Share button on md screens (toggles right panel) */}
          <button
            onClick={() => setShareOpen((o) => !o)}
            className="lg:hidden flex items-center gap-1.5 text-xs font-semibold text-primary-text bg-bg-card border border-divider px-2.5 py-1.5 rounded hover:bg-bg-card-hover transition-all cursor-pointer"
          >
            <FaShareAlt className="text-[10px]" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 relative overflow-hidden min-h-0">
        <div className="absolute inset-0 bg-[radial-gradient(#3f3f46_1px,transparent_1px)] [background-size:20px_20px] opacity-15 pointer-events-none" />

        {/* AI overlay */}
        {(aiStatus === "generating" || aiStatus === "polling") && (
          <div className="absolute inset-0 bg-bg-card/85 backdrop-blur-sm flex flex-col items-center justify-center z-20 gap-3">
            <div className="w-9 h-9 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <div className="text-center px-4">
              <p className="text-sm font-bold text-primary-text">
                Generating your card…
              </p>
              <p className="text-xs text-secondary-text mt-1">
                AI crafting custom design · {aiTimer}s
              </p>
            </div>
          </div>
        )}
        {aiStatus === "completed" && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5">
            <FaCheck className="text-[10px]" /> AI design applied!
          </div>
        )}

        {/* Responsive card frame */}
        <div className="relative z-10 w-full max-w-xs sm:max-w-sm md:max-w-md h-[460px] sm:h-[520px] md:h-[600px] bg-bg-card rounded-2xl border border-divider shadow-xl overflow-hidden flex flex-col">
          <iframe
            ref={iframeRef}
            title="Card Preview"
            className="w-full h-full border-none"
            srcDoc={generateCardDocument(formData)}
            sandbox="allow-scripts"
          />
        </div>
      </div>
    </div>
  );

  const SharePanel = () => (
    <div className="h-full flex flex-col bg-bg-card">
      <div className="px-4 py-3 border-b border-divider/50 flex-shrink-0">
        <h3 className="text-sm font-bold text-primary-text">Share Your Card</h3>
        <p className="text-[11px] text-secondary-text mt-0.5">
          Copy link or download QR code
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-subtle">
        {/* URL */}
        <div>
          <label className={lbl}>Card URL</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={cardUrl || ""}
              readOnly
              placeholder="Save your card first…"
              className="flex-1 min-w-0 bg-bg-page/50 border border-divider/50 rounded px-3 py-2 text-xs text-secondary-text focus:outline-none cursor-default"
            />
            {cardUrl && (
              <button
                onClick={handleCopyUrl}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-2 text-xs font-semibold bg-bg-card border border-divider/50 rounded hover:bg-bg-card-hover transition-all text-primary-text cursor-pointer"
              >
                {copied ? <FaCheck className="text-emerald-500" /> : <FaCopy />}
                <span className="hidden sm:inline">
                  {copied ? "Copied" : "Copy"}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Open / Download actions */}
        {urlHash && (
          <div className="grid grid-cols-2 gap-2">
            <a
              href={cardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-primary bg-primary/10 border border-primary/20 rounded hover:bg-primary/20 transition-all text-center"
            >
              <FaExternalLinkAlt className="text-[10px]" /> Open
            </a>
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-primary-text bg-bg-card border border-divider/50 rounded hover:bg-bg-card-hover transition-all cursor-pointer"
            >
              <FaDownload className="text-[10px]" /> Download
            </button>
          </div>
        )}

        {/* QR */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={lbl}>QR Code</label>
            {qrDataUrl && (
              <a
                href={qrDataUrl}
                download="card-qr.png"
                className="text-[10px] font-semibold text-secondary-text hover:text-primary-text flex items-center gap-1 transition-colors"
              >
                <FaDownload className="text-[9px]" /> Save QR
              </a>
            )}
          </div>
          {qrDataUrl ? (
            <div className="bg-white border border-divider rounded p-4 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                alt="QR Code"
                className="w-36 h-36 sm:w-44 sm:h-44"
              />
            </div>
          ) : (
            <div className="bg-bg-page/50 border border-dashed border-divider rounded p-8 flex flex-col items-center justify-center gap-2">
              <FaQrcode className="text-3xl text-secondary-text/30" />
              <p className="text-xs text-secondary-text text-center">
                Save your card to generate a QR code
              </p>
            </div>
          )}
        </div>

        {/* Sign in */}
        {!session?.user && (
          <div className="bg-bg-page/50 border border-divider/50 rounded p-4 text-center space-y-3">
            <p className="text-xs text-secondary-text leading-relaxed">
              Sign in to save, share, and manage multiple cards
            </p>
            <button
              onClick={() => signIn("google")}
              className="w-full bg-primary hover:bg-primary-hover text-white rounded py-2.5 text-xs font-bold transition-all cursor-pointer"
            >
              Sign in with Google
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // ─── Main Render ──────────────────────────────────────────
  return (
    <div
      className="flex-1 flex flex-col overflow-hidden bg-bg-page text-primary-text"
      style={{ minHeight: 0 }}
    >
      {/* ══ MOBILE: tab bar ══════════════════════════════════ */}
      <div className="lg:hidden flex border-b border-divider/50 bg-bg-card flex-shrink-0">
        {[
          { id: "edit", label: "Edit", icon: FaPencilAlt },
          { id: "preview", label: "Preview", icon: FaEye },
          { id: "share", label: "Share", icon: FaShareAlt },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMobileTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-all border-b-2 cursor-pointer ${
              mobileTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-secondary-text hover:text-primary-text"
            }`}
          >
            <tab.icon className="text-[11px]" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══ MOBILE: single panel based on tab ════════════════ */}
      <div className="lg:hidden flex-1 overflow-hidden flex flex-col min-h-0">
        {mobileTab === "edit" && (
          <div className="flex-1 overflow-hidden flex flex-col bg-bg-card min-h-0">
            {FormPanel()}
          </div>
        )}
        {mobileTab === "preview" && (
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {PreviewPanel()}
          </div>
        )}
        {mobileTab === "share" && (
          <div className="flex-1 overflow-y-auto bg-bg-card min-h-0 scrollbar-subtle">
            {SharePanel()}
          </div>
        )}
      </div>

      {/* ══ DESKTOP: 3-column layout ═════════════════════════ */}
      <div className="hidden lg:flex flex-1 overflow-hidden min-h-0">
        {/* Left — Form */}
        <aside className="w-72 xl:w-80 flex-shrink-0 bg-bg-card border-r border-divider/50 flex flex-col overflow-hidden">
          {FormPanel()}
        </aside>

        {/* Center — Preview */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          {PreviewPanel()}
        </main>

        {/* Right — Share (always visible on lg+) */}
        <aside className="w-60 xl:w-64 flex-shrink-0 bg-bg-card border-l border-divider/50 overflow-hidden flex flex-col">
          {SharePanel()}
        </aside>
      </div>

      {/* ══ TABLET md: share drawer overlay ═════════════════ */}
      {shareOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShareOpen(false)}
          />
          <div className="relative w-72 max-w-full bg-bg-card border-l border-divider shadow-2xl overflow-hidden flex flex-col">
            {SharePanel()}
          </div>
        </div>
      )}
    </div>
  );
}
