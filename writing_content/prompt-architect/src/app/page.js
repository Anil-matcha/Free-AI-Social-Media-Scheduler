"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import FeaturesSection from "@/components/FeaturesSection";
import PricingSection from "@/components/PricingSection";
import FooterSection from "@/components/FooterSection";
import CustomSelect from "@/components/CustomSelect";
import { TARGET_MODELS, PROMPT_STYLES, ANY_LLM_MODELS } from "@/lib/config";
import { FaBrain, FaCoins, FaPaperPlane, FaMagic, FaSlidersH, FaBolt } from "react-icons/fa";

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();
  const [promptText, setPromptText] = useState("");
  const [targetModel, setTargetModel] = useState("chatgpt");
  const [promptStyle, setPromptStyle] = useState("professional");
  const [mode, setMode] = useState("refinement");
  const [generatorModel, setGeneratorModel] = useState("google/gemini-2.5-flash");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const textareaRef = useRef(null);

  // Auto-resize textarea as text grows
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        280
      )}px`;
    }
  }, [promptText]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!promptText.trim()) return;

    if (!session) {
      signIn("google");
      return;
    }

    // Check credits
    if (session.user.credits < 4) {
      setError("Insufficient credits. You need at least 4 credits to start a prompt refinement session.");
      // Scroll to pricing
      const pricingSec = document.getElementById("pricing");
      if (pricingSec) {
        pricingSec.scrollIntoView({ behavior: "smooth" });
      }
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: promptText,
          targetModel: mode === "refinement" ? targetModel : null,
          promptStyle: mode === "refinement" ? promptStyle : null,
          mode,
          generatorModel,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Failed to start session");
      }

      const data = await res.json();
      if (data.sessionId) {
        router.push(`/chat?sessionId=${data.sessionId}`);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to initiate AI prompt engineering. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Prepare custom select options formatted as required
  const targetOptions = TARGET_MODELS.map(m => ({
    id: m.id,
    name: m.name,
    emoji: m.id === "chatgpt" ? "🤖" : m.id === "claude" ? "🧠" : m.id === "midjourney" ? "🎨" : "📷"
  }));

  const styleOptions = PROMPT_STYLES.map(s => ({
    id: s.id,
    name: s.name,
    emoji: s.emoji
  }));

  return (
    <div className="flex flex-col min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-violet-600/30 selection:text-white">
      <Navbar />

      <main className="flex-1 z-10 flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full max-w-5xl px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-300 text-xs font-semibold uppercase tracking-wider mb-6">
            <FaMagic className="w-3.5 h-3.5" />
            <span>AI Prompt Engineer Studio</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 max-w-4xl leading-tight">
            Build Elite Prompts for <span className="text-gradient">Any AI Model</span>
          </h1>

          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mb-12 leading-relaxed">
            Stop guessing your prompt structure. Input a rough idea, converse to refine context, and generate production-ready instructions instantly.
          </p>

          {/* Kinetic Prompt Generator Workspace */}
          <div className="w-full max-w-3xl glass border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl shadow-black/60 mb-20 text-left relative">
            
            <form onSubmit={handleSubmit} className="relative space-y-6">
              {/* Textarea container */}
              <div className="space-y-2">
                <label htmlFor="prompt-idea" className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  What prompt idea do you want to optimize?
                </label>
                <textarea
                  id="prompt-idea"
                  ref={textareaRef}
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="e.g., Optimize a Python scraper to bypass cloudflare, or a copywriter prompt for LinkedIn that captures user attention..."
                  rows={3}
                  className="w-full glass-input rounded-2xl p-4 text-white placeholder-zinc-500 focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 text-base leading-relaxed resize-none transition-all duration-200"
                />
              </div>

              {/* Mode Selection Tab bar - Clean & Minimal */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                  Workspace Mode
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMode("refinement")}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      mode === "refinement"
                        ? "bg-violet-600/10 border-violet-500/30 text-violet-300 shadow-sm"
                        : "bg-white/5 border-white/5 text-zinc-400 hover:text-zinc-300"
                    }`}
                  >
                    <FaMagic className="w-3.5 h-3.5" />
                    <span>Architect (Refine Prompt)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("normal")}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      mode === "normal"
                        ? "bg-violet-600/10 border-violet-500/30 text-violet-300 shadow-sm"
                        : "bg-white/5 border-white/5 text-zinc-400 hover:text-zinc-300"
                    }`}
                  >
                    <FaBolt className="w-3.5 h-3.5" />
                    <span>Direct (Send Normally)</span>
                  </button>
                </div>
              </div>

              {/* Custom Selector Grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                <CustomSelect
                  label="LLM Engine"
                  options={ANY_LLM_MODELS.map((m) => ({
                    id: m.id,
                    name: `${m.name}${m.premium ? " (Premium)" : ""}`,
                    emoji: m.icon,
                  }))}
                  value={generatorModel}
                  onChange={setGeneratorModel}
                />
                
                {mode === "refinement" ? (
                  <CustomSelect
                    label="Target AI Model"
                    options={targetOptions}
                    value={targetModel}
                    onChange={setTargetModel}
                  />
                ) : (
                  <div className="flex flex-col justify-center text-xs text-zinc-500 p-2 leading-relaxed border border-white/5 rounded-xl bg-white/2">
                    ⚡ Direct mode sends your raw prompt straight to the LLM to get an immediate reply. No templates or intermediate refinement loops.
                  </div>
                )}
              </div>

              {mode === "refinement" && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <CustomSelect
                    label="Prompt Formatting Style"
                    options={styleOptions}
                    value={promptStyle}
                    onChange={setPromptStyle}
                  />
                  <div className="hidden sm:block" />
                </div>
              )}

              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Launch / Submit */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
                <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-medium">
                  <FaCoins className="w-3.5 h-3.5 text-amber-500/60" />
                  <span>Cost: 4 credits per design execution</span>
                </div>

                <button
                  type="submit"
                  disabled={loading || !promptText.trim()}
                  className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white shadow-lg shadow-violet-500/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base shrink-0"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Architecting...</span>
                    </>
                  ) : (
                    <>
                      <FaPaperPlane className="w-3.5 h-3.5" />
                      <span>Design Prompt</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Feature Cards Section */}
        <div className="w-full border-t border-white/5 bg-slate-950/20">
          <FeaturesSection />
        </div>

        {/* Pricing/Credits Section */}
        <div className="w-full border-t border-white/5 bg-slate-950/40">
          <PricingSection />
        </div>
      </main>

      <FooterSection />
    </div>
  );
}
