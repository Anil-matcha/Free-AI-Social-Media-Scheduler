"use client";

import { useSession, signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import ResumeForm from "../components/ResumeForm";
import ResumePreview from "../components/ResumePreview";
import { IoSparkles, IoWalletOutline, IoClose, IoCopyOutline } from "react-icons/io5";

// Helper to ensure each array item has a unique id
function ensureItemIds(data) {
  if (!data) return data;
  const sections = ["experience", "education", "projects", "skills"];
  const updated = { ...data };
  sections.forEach(sec => {
    if (Array.isArray(updated[sec])) {
      updated[sec] = updated[sec].map(item => {
        if (!item.id) {
          return { ...item, id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9) };
        }
        return item;
      });
    } else {
      updated[sec] = [];
    }
  });
  return updated;
}

function EditorContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  const id = searchParams.get("id");

  // Main Editor States
  const [resumeId, setResumeId] = useState(id || "");
  const [formData, setFormData] = useState({
    base: { name: "", role: "", phone: "", email: "", location: "", summary: "" },
    experience: [],
    education: [],
    projects: [],
    skills: []
  });

  const [userPrompt, setUserPrompt] = useState("");
  const [templateId, setTemplateId] = useState("modern");
  const [themeColor, setThemeColor] = useState("#0f172a");
  const [fontFamily, setFontFamily] = useState("Inter");
  const [fontSize, setFontSize] = useState("14px");

  const [htmlContent, setHtmlContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Share Modal States
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  // Load existing resume data if editing
  useEffect(() => {
    if (status === "unauthenticated") {
      setPageLoading(false);
      return;
    }

    if (status === "authenticated" && id) {
      const fetchResume = async () => {
        try {
          const res = await fetch(`/api/creations?id=${id}`);
          if (res.ok) {
            const data = await res.json();
            setResumeId(data.id);
            setTemplateId(data.templateId || "modern");
            setThemeColor(data.themeColor || "#0f172a");
            setFontFamily(data.fontFamily || "Inter");
            setFontSize(data.fontSize || "14px");
            setUserPrompt(data.userPrompt || "");
            setHtmlContent(data.htmlContent || "");
            if (data.structuredData) {
              const parsed = JSON.parse(data.structuredData);
              const withIds = ensureItemIds(parsed);
              setFormData(withIds);
              if (window.updateResumeFormData) {
                window.updateResumeFormData(withIds);
              }
            }
          }
        } catch (err) {
          console.error("Failed to load resume:", err);
        } finally {
          setPageLoading(false);
        }
      };
      fetchResume();
    } else if (status === "authenticated") {
      setPageLoading(false);
    }
  }, [status, id]);

  const handleFormSave = (updatedData) => {
    setFormData(updatedData);
  };

  const handleImproveWithAi = async () => {
    if (status !== "authenticated") {
      signIn("google");
      return;
    }

    // Check credits first
    const credits = session.user.credits ?? 0;
    if (credits < 18) {
      alert("Insufficient credits. Please purchase more credits on the Pricing page.");
      router.push("/pricing");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId,
          userPrompt,
          structuredData: formData,
          templateId,
          themeColor,
          fontFamily,
          fontSize
        })
      });

      if (res.ok) {
        const data = await res.json();
        setHtmlContent(data.resultHtml);
        setResumeId(data.resumeId);

        // Update form details with AI improved wording
        if (data.structuredData) {
          const withIds = ensureItemIds(data.structuredData);
          setFormData(withIds);
          if (window.updateResumeFormData) {
            window.updateResumeFormData(withIds);
          }
        }

        router.refresh();
      } else if (res.status === 402) {
        alert("Insufficient credits. Please buy credits.");
        router.push("/pricing");
      } else {
        alert("Generation failed. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during generation.");
    } finally {
      setLoading(false);
    }
  };

  const triggerShare = () => {
    if (!resumeId) return;
    const url = `${window.location.origin}/resume/share/${resumeId}`;
    setShareUrl(url);
    setShareModalOpen(true);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    alert("Shareable resume link copied to clipboard!");
  };

  if (pageLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-emerald-500 animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      {/* Editor Workspace Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex flex-col gap-6 overflow-hidden">
        
        {/* Workspace Title & Credits warning */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="font-outfit text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
              AI Document Workspace
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Formulate, edit, and dynamically style your print-ready AI resume.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs text-slate-600 font-semibold shadow-inner">
              <IoWalletOutline className="h-4 w-4 text-emerald-600" />
              <span>Cost: 18 credits</span>
            </div>
            
            <button
              onClick={handleImproveWithAi}
              disabled={loading}
              className="flex items-center gap-2 rounded bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2.5 text-xs uppercase tracking-wider disabled:opacity-50 shadow-md active:scale-95 transition cursor-pointer"
            >
              <IoSparkles className="h-4 w-4 text-lime-400 animate-pulse" />
              {loading ? "Optimizing..." : "Improve with AI"}
            </button>
          </div>
        </div>

        {/* Dual panel Split View Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left panel: accordion forms & options */}
          <div className="h-full">
            <ResumeForm
              initialData={formData}
              userPrompt={userPrompt}
              setUserPrompt={setUserPrompt}
              templateId={templateId}
              setTemplateId={setTemplateId}
              themeColor={themeColor}
              setThemeColor={setThemeColor}
              fontFamily={fontFamily}
              setFontFamily={setFontFamily}
              fontSize={fontSize}
              setFontSize={setFontSize}
              onSave={handleFormSave}
              loading={loading}
            />
          </div>

          {/* Right panel: dynamic sandboxed iframe preview */}
          <div className="h-full">
            <ResumePreview 
              htmlContent={htmlContent} 
              loading={loading} 
              onShare={triggerShare} 
            />
          </div>
        </div>
      </main>

      {/* Share Modal Dialog */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShareModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer"
            >
              <IoClose className="h-5 w-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Shareable Resume Link</h3>
              <p className="text-xs text-slate-500">
                Anyone with this link can view your professionally formatted resume online.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded bg-slate-50 p-2.5 border border-slate-200">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-transparent px-2 text-xs text-slate-700 font-mono select-all outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="p-2 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer"
                title="Copy Link"
              >
                <IoCopyOutline className="h-4 w-4" />
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShareModalOpen(false)}
                className="rounded border border-slate-200 bg-slate-100 px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-emerald-500 animate-spin"></div>
      </div>
    }>
      <EditorContent />
    </Suspense>
  );
}
