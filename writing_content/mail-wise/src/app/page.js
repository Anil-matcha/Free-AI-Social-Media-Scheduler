"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import CustomToggle from "@/components/CustomToggle";
import CustomSelect from "@/components/CustomSelect";
import { EMAIL_TEMPLATES, EMAIL_TONES, LANGUAGES, LENGTHS } from "@/lib/config";
import {
  FaPaperPlane,
  FaMagic,
  FaCopy,
  FaCheck,
  FaSpinner,
  FaEnvelopeOpenText,
  FaShare,
  FaCoins,
  FaExclamationTriangle,
  FaRedoAlt,
  FaGoogle,
} from "react-icons/fa";

export default function StudioPage() {
  const { data: session, status: authStatus } = useSession();
  const [activeTemplate, setActiveTemplate] = useState("cold_pitch");
  const [recipient, setRecipient] = useState("");
  const [prompt, setPrompt] = useState("");
  const [toneId, setToneId] = useState("professional");
  const [lengthId, setLengthId] = useState("medium");
  const [languageId, setLanguageId] = useState("english");
  const [includeCta, setIncludeCta] = useState(true);
  const [suggestSubjects, setSuggestSubjects] = useState(true);

  // Studio states
  const [generating, setGenerating] = useState(false);
  const [requestId, setRequestId] = useState(null);
  const [currentCreation, setCurrentCreation] = useState(null);
  const [creationList, setCreationList] = useState([]);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedSubjectId, setCopiedSubjectId] = useState(null);
  const [editableBody, setEditableBody] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  const pollInterval = useRef(null);

  // Fetch creations for context / auto-polling
  const fetchCreations = async () => {
    if (!session?.user) return;
    try {
      const res = await fetch("/api/creations");
      if (res.ok) {
        const data = await res.json();
        setCreationList(data);
      }
    } catch {}
  };

  useEffect(() => {
    if (session?.user) {
      fetchCreations();
    }
  }, [session]);

  // Clean polling on unmount
  useEffect(() => {
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, []);

  // Set template details
  const handleTemplateChange = (id) => {
    setActiveTemplate(id);
    const template = EMAIL_TEMPLATES.find((t) => t.id === id);
    if (template && id !== "custom") {
      setPrompt("");
      setRecipient("");
    }
  };

  const getTemplatePlaceholder = () => {
    return EMAIL_TEMPLATES.find((t) => t.id === activeTemplate)?.placeholder || "Describe what you want to say in your email...";
  };

  // Submit generation
  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!session?.user) return;
    if (generating) return;

    if (!prompt.trim()) return;
    if (!recipient.trim()) return;

    setGenerating(true);
    setRequestId(null);
    setCurrentCreation(null);
    setEditableBody("");
    setSelectedSubject("");

    try {
      const res = await fetch("/api/creations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          recipient,
          toneId,
          lengthId,
          languageId,
          includeCta,
          suggestSubjects,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        alert(errText);
        setGenerating(false);
        return;
      }

      const creation = await res.json();
      setCurrentCreation(creation);
      setRequestId(creation.requestId);

      // Start polling
      startPolling(creation.requestId);
    } catch (err) {
      console.error(err);
      setGenerating(false);
    }
  };

  // Poll status
  const startPolling = (reqId) => {
    if (pollInterval.current) clearInterval(pollInterval.current);

    pollInterval.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/creations?requestId=${reqId}`);
        if (!res.ok) return;

        const data = await res.json();
        if (data.status === "completed") {
          clearInterval(pollInterval.current);
          setGenerating(false);
          const parsed = getParsedResult(data.creation);
          setCurrentCreation(data.creation);
          if (parsed) {
            setEditableBody(parsed.emailBody + "\n\n" + parsed.signature);
            if (parsed.subjectSuggestions && parsed.subjectSuggestions.length > 0) {
              setSelectedSubject(parsed.subjectSuggestions[0]);
            }
          }
          fetchCreations();
          // Update credits in session manually or prompt reload
        } else if (data.status === "failed") {
          clearInterval(pollInterval.current);
          setGenerating(false);
          alert(data.error || "Email generation failed");
        }
      } catch (err) {
        console.error(err);
      }
    }, 3000);
  };

  const getParsedResult = (creation) => {
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

  const handleCopyBody = () => {
    if (!editableBody) return;
    navigator.clipboard.writeText(editableBody);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleCopySubject = (index, text) => {
    navigator.clipboard.writeText(text);
    setCopiedSubjectId(index);
    setTimeout(() => setCopiedSubjectId(null), 2000);
  };

  const handleSendEmail = () => {
    const mailto = `mailto:?subject=${encodeURIComponent(selectedSubject)}&body=${encodeURIComponent(editableBody)}`;
    window.location.href = mailto;
  };

  const activeParsedData = getParsedResult(currentCreation);

  return (
    <div className="flex-1 flex flex-col bg-bg-page select-none overflow-hidden h-full">
      <main className="flex-1 flex flex-col md:flex-row md:overflow-hidden overflow-y-auto">
        
        {/* LEFT PANEL: Form/Composer Panel */}
        <section className="w-full md:w-5/12 border-r border-divider/50 bg-bg-card p-6 md:overflow-y-auto overflow-visible flex flex-col gap-6 scrollbar-subtle">
          <div>
            <h1 className="text-xl font-extrabold text-primary-text tracking-tight flex items-center gap-2">
              <FaPaperPlane className="text-primary text-sm" />
              Email Studio
            </h1>
            <p className="text-secondary-text text-xs mt-1">Compose highly engaging cold pitches, follow-ups, and requests using state-of-the-art AI.</p>
          </div>

          {/* Template Selectors */}
          <CustomSelect
            label="Select Template Preset"
            options={EMAIL_TEMPLATES}
            value={activeTemplate}
            onChange={handleTemplateChange}
          />

          <form onSubmit={handleGenerate} className="flex flex-col gap-4">
            {/* Recipient Input */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-secondary-text">Target Recipient</span>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="e.g. CEO of tech startup, Customer service department..."
                required
                className="w-full px-4 py-2.5 rounded-full border border-divider/50 bg-bg-page text-xs text-primary-text placeholder-secondary-text/50 focus:border-primary focus:outline-none transition-colors"
              />
            </div>

            {/* Prompt/Description */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-secondary-text">Details / Key Points to Cover</span>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={getTemplatePlaceholder()}
                required
                rows={4}
                className="w-full px-4 py-3 rounded-2xl border border-divider/50 bg-bg-page text-xs text-primary-text placeholder-secondary-text/50 focus:border-primary focus:outline-none transition-colors resize-none leading-relaxed"
              />
            </div>

            {/* Selector Grid */}
            <div className="grid grid-cols-2 gap-3">
              <CustomSelect
                label="Tone of Voice"
                options={EMAIL_TONES}
                value={toneId}
                onChange={setToneId}
              />
              <CustomSelect
                label="Email Length"
                options={LENGTHS}
                value={lengthId}
                onChange={setLengthId}
              />
            </div>

            {/* Lang dropdown - set to open upward if near bottom */}
            <CustomSelect
              label="Language"
              options={LANGUAGES}
              value={languageId}
              onChange={setLanguageId}
              upward={true}
            />

            {/* Custom sliding toggles */}
            <div className="border-t border-divider/30 pt-4 flex flex-col gap-3">
              <CustomToggle
                label="Include frictionless Call-to-Action (CTA)"
                checked={includeCta}
                onChange={setIncludeCta}
              />
              <CustomToggle
                label="Suggest 3 catchy subject lines"
                checked={suggestSubjects}
                onChange={setSuggestSubjects}
              />
            </div>

            {/* Submit CTA */}
            {authStatus === "authenticated" ? (
              <button
                type="submit"
                disabled={generating || !prompt.trim() || !recipient.trim()}
                className="w-full flex items-center justify-center gap-2 mt-2 py-3 rounded-full bg-primary hover:bg-primary-hover disabled:bg-bg-page disabled:border-divider/50 disabled:text-secondary-text border border-transparent text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                {generating ? (
                  <>
                    <FaSpinner className="animate-spin text-sm" />
                    Generating Copy...
                  </>
                ) : (
                  <>
                    <FaMagic className="text-[10px]" />
                    Compose AI Email (4 Credits)
                  </>
                )}
              </button>
            ) : authStatus === "loading" ? (
              <button
                type="button"
                disabled
                className="w-full flex items-center justify-center gap-2 mt-2 py-3 rounded-full bg-bg-page text-secondary-text text-xs font-bold border border-divider/50"
              >
                <FaSpinner className="animate-spin" />
                Loading Session...
              </button>
            ) : (
              <button
                type="button"
                onClick={() => signIn("google")}
                className="w-full flex items-center justify-center gap-2 mt-2 py-3 rounded-full bg-bg-page hover:bg-bg-card-hover border border-divider/50 text-primary-text font-bold text-xs transition-colors"
              >
                <FaGoogle className="text-[10px] text-secondary-text" />
                Sign in with Google to Start
              </button>
            )}
          </form>
        </section>

        {/* RIGHT PANEL: Preview & Output Panel */}
        <section className="w-full md:w-7/12 p-6 md:overflow-y-auto overflow-visible bg-bg-page/50 flex flex-col gap-6 scrollbar-subtle">
          <div>
            <h2 className="text-sm font-bold text-primary-text tracking-tight flex items-center gap-2">
              <FaEnvelopeOpenText className="text-primary text-xs animate-float" />
              Generated Workspace Output
            </h2>
            <p className="text-secondary-text text-[10px] mt-0.5">Real-time compilation of subject recommendations, editable drafts, and client linkages.</p>
          </div>

          <div className="flex-1 flex flex-col gap-4 min-h-[300px]">
            {generating && !currentCreation ? (
              /* Shimmer Loading State */
              <div className="flex-1 border border-divider/50 bg-bg-card rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse-dot" />
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">AI Copywriter is drafting...</span>
                </div>
                <div className="h-6 w-2/3 rounded-full shimmer shrink-0" />
                <div className="border-t border-divider/30 my-1 shrink-0" />
                <div className="flex-1 flex flex-col gap-2.5">
                  <div className="h-4 w-full rounded-full shimmer" />
                  <div className="h-4 w-full rounded-full shimmer" />
                  <div className="h-4 w-5/6 rounded-full shimmer" />
                  <div className="h-4 w-full rounded-full shimmer" />
                  <div className="h-4 w-2/3 rounded-full shimmer" />
                </div>
              </div>
            ) : currentCreation && currentCreation.status === "completed" && activeParsedData ? (
              /* Completed Output Layout */
              <div className="flex-1 flex flex-col gap-4 animate-slide-up">
                
                {/* Subject Suggestions */}
                {suggestSubjects && activeParsedData.subjectSuggestions && activeParsedData.subjectSuggestions.length > 0 && (
                  <div className="border border-divider/50 bg-bg-card rounded-2xl p-4 flex flex-col gap-2 shrink-0">
                    <span className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Recommended Subject Lines</span>
                    <div className="flex flex-col gap-2">
                      {activeParsedData.subjectSuggestions.map((subject, idx) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedSubject(subject)}
                          className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-full border text-xs cursor-pointer transition-all ${
                            selectedSubject === subject
                              ? "border-primary bg-primary/10 text-primary font-bold"
                              : "border-divider/50 hover:border-primary/50 bg-bg-page text-secondary-text hover:text-primary-text"
                          }`}
                        >
                          <span className="truncate">{subject}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopySubject(idx, subject);
                            }}
                            className="p-1.5 rounded-full bg-bg-card hover:bg-bg-card-hover border border-divider/50 text-secondary-text hover:text-primary-text text-[10px] transition-colors shrink-0"
                          >
                            {copiedSubjectId === idx ? <FaCheck className="text-emerald-500" /> : <FaCopy />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Email Body Block */}
                <div className="flex-1 border border-divider/50 bg-bg-card rounded-2xl flex flex-col overflow-hidden">
                  {/* Editor Header */}
                  <div className="px-4 py-3 border-b border-divider/30 bg-bg-page flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Active Editor Workspace</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyBody}
                        className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-primary hover:bg-primary-hover text-white text-[10px] font-bold shadow-sm transition-all cursor-pointer"
                      >
                        {copiedText ? <FaCheck className="text-[9px] text-emerald-300" /> : <FaCopy className="text-[9px]" />}
                        {copiedText ? "Copied Email!" : "Copy Full Body"}
                      </button>
                    </div>
                  </div>

                  {/* Body Textarea */}
                  <div className="flex-1 p-4 relative">
                    <textarea
                      value={editableBody}
                      onChange={(e) => setEditableBody(e.target.value)}
                      className="w-full h-full bg-transparent text-xs text-primary-text placeholder-secondary-text/55 focus:outline-none resize-none leading-relaxed font-mono"
                    />

                    {/* Floating contextual overview card overlay */}
                    <div className="absolute bottom-4 right-4 z-10 px-3.5 py-2 rounded-2xl bg-bg-card/90 border border-divider/50 shadow-md backdrop-blur-md flex flex-col gap-0.5 pointer-events-none select-none text-[8px] text-secondary-text font-semibold tracking-wide">
                      <span>TONE: {currentCreation.tone.toUpperCase()}</span>
                      <span>LENGTH: {currentCreation.length.toUpperCase()}</span>
                      <span>RECIPIENT: {currentCreation.recipient.substring(0, 15).toUpperCase()}...</span>
                    </div>
                  </div>
                </div>

                {/* Dispatch Trigger */}
                <button
                  onClick={handleSendEmail}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <FaShare className="text-[10px]" />
                  Dispatch Test Email (via Local Mail App)
                </button>
              </div>
            ) : (
              /* Empty Placeholder State with Float animation */
              <div className="flex-1 border border-dashed border-divider/50 bg-bg-card rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4 animate-float">
                <div className="w-16 h-16 rounded-2xl bg-bg-page border border-divider/50 flex items-center justify-center shadow-sm">
                  <FaEnvelopeOpenText className="text-2xl text-secondary-text" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-primary-text">Workspace is empty</h3>
                  <p className="text-[10px] text-secondary-text mt-1 max-w-xs leading-normal">
                    Enter target recipient and details on the left, choose your parameters, and click compose to generate business copies.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
