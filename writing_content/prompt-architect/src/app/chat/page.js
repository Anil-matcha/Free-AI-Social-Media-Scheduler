"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  FaBrain,
  FaCoins,
  FaPaperPlane,
  FaArrowLeft,
  FaTimes,
  FaBars,
  FaPlus,
  FaTrash,
  FaRegClipboard,
  FaCheck,
  FaExternalLinkAlt,
  FaMagic,
  FaComments,
  FaCheckCircle,
  FaChevronLeft,
  FaBolt,
} from "react-icons/fa";
import { ANY_LLM_MODELS } from "@/lib/config";
import confetti from "canvas-confetti";
import CustomToggle from "@/components/CustomToggle";

function ChatPageContent() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const querySessionId = searchParams.get("sessionId");

  // State
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(querySessionId || null);
  const [messages, setMessages] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [pollingActive, setPollingActive] = useState(false);
  const [mode, setMode] = useState("refinement");
  const [generatorModel, setGeneratorModel] = useState("google/gemini-2.5-flash");

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-resize input textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        150
      )}px`;
    }
  }, [inputText]);

  // Redirect if unauthenticated
  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      signIn("google");
    }
  }, [sessionStatus]);

  // Fetch all sessions belonging to user
  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/chat");
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (err) {
      console.error("Error fetching sessions:", err);
    }
  };

  useEffect(() => {
    if (session) {
      fetchSessions();
    }
  }, [session]);

  // Fetch messages when currentSessionId changes
  const fetchMessages = async (id) => {
    if (!id) {
      setMessages([]);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/chat?sessionId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);

        // Check if any message is still processing to activate polling
        const hasPending = data.some((msg) => msg.status === "processing");
        if (hasPending) {
          setPollingActive(true);
        }
      }
    } catch (err) {
      console.error("Error loading messages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentSessionId) {
      fetchMessages(currentSessionId);
    } else {
      setMessages([]);
    }
  }, [currentSessionId]);

  // Auto-scroll timeline to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Active Polling Loop for pending assistant predictions
  useEffect(() => {
    if (!pollingActive || !currentSessionId) return;

    let intervalId = setInterval(async () => {
      // Find the latest processing message
      const pendingMessage = messages.find(
        (msg) => msg.status === "processing" && msg.role === "assistant"
      );

      if (!pendingMessage || !pendingMessage.requestId) {
        setPollingActive(false);
        return;
      }

      try {
        const res = await fetch(`/api/chat?requestId=${pendingMessage.requestId}`);
        if (res.ok) {
          const statusData = await res.json();

          if (statusData.status === "completed") {
            // Update messages list
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === pendingMessage.id ? statusData.message : msg
              )
            );
            setPollingActive(false);
            fetchSessions(); // Refresh list to update title/timestamps

            // Parse message content to check if it has finalPrompt
            try {
              const parsed = JSON.parse(statusData.message.content);
              if (parsed.finalPrompt) {
                // Trigger celebratory confetti!
                confetti({
                  particleCount: 150,
                  spread: 80,
                  origin: { y: 0.6 },
                });
              }
            } catch (e) {
              // Ignore parse errors
            }
          } else if (statusData.status === "failed") {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === pendingMessage.id
                  ? { ...msg, status: "failed", content: JSON.stringify({ text: "Generation failed." }) }
                  : msg
              )
            );
            setPollingActive(false);
            fetchSessions();
          }
        }
      } catch (err) {
        console.error("Error polling state:", err);
      }
    }, 2500);

    return () => clearInterval(intervalId);
  }, [pollingActive, messages, currentSessionId]);

  // Submitting a new message
  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim() || pollingActive) return;

    if (!textToSend) {
      setInputText("");
    }

    // Pessimistically check if user has credits (4 credits)
    if (session?.user?.credits < 4) {
      alert("You need at least 4 credits to generate or refine your prompts.");
      return;
    }

    // Optimistically create the user message bubble in UI first
    const tempUserMsg = {
      id: `temp_user_${Date.now()}`,
      role: "user",
      content: text,
      status: "completed",
      createdAt: new Date().toISOString(),
    };

    // Optimistically create the loading assistant bubble
    const tempAssistantMsg = {
      id: `temp_assistant_${Date.now()}`,
      role: "assistant",
      content: "",
      status: "processing",
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg, tempAssistantMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          sessionId: currentSessionId,
          mode,
          generatorModel,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to submit message");
      }

      const data = await res.json();

      // If it's a new session, update route search parameters
      if (!currentSessionId && data.sessionId) {
        setCurrentSessionId(data.sessionId);
        router.replace(`/chat?sessionId=${data.sessionId}`);
        fetchSessions();
      }

      // Update assistant message with request details and activate polling
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id.startsWith("temp_assistant_")
            ? {
                ...msg,
                id: data.message.id,
                requestId: data.message.requestId,
                status: "processing",
              }
            : msg
        )
      );

      setPollingActive(true);
    } catch (err) {
      console.error(err);
      // Remove optimistic bubbles and display error
      setMessages((prev) => prev.filter((m) => !m.id.startsWith("temp_")));
      alert(err.message || "Failed to send message. Please try again.");
    }
  };

  const handleRefineFurther = () => {
    handleSendMessage("I'd like to refine this prompt further. Can you ask me more questions or adjust it?");
  };

  // Delete a session
  const handleDeleteSession = async (e, id) => {
    e.stopPropagation();
    e.preventDefault();

    if (!confirm("Are you sure you want to delete this prompt engineering session?")) return;

    try {
      const res = await fetch(`/api/chat?sessionId=${id}`, { method: "DELETE" });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== id));
        if (currentSessionId === id) {
          setCurrentSessionId(null);
          router.replace("/chat");
        }
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  const startNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    router.replace("/chat");
  };

  const handleSelectSession = (id) => {
    setCurrentSessionId(id);
    router.replace(`/chat?sessionId=${id}`);
  };

  // Helper to parse Assistant messages
  const parseAssistantContent = (content) => {
    if (!content) return { text: "", finalPrompt: null };

    // Check if it's already JSON
    try {
      const parsed = JSON.parse(content);
      if (parsed.text || parsed.finalPrompt) {
        return { text: parsed.text || "", finalPrompt: parsed.finalPrompt || null };
      }
    } catch (e) {
      // Ignore and fallback
    }

    // Try finding JSON inside text
    if (content.includes("finalPrompt")) {
      try {
        const start = content.indexOf("{");
        const end = content.lastIndexOf("}");
        if (start !== -1 && end !== -1) {
          const parsed = JSON.parse(content.substring(start, end + 1));
          return { text: parsed.text || "", finalPrompt: parsed.finalPrompt || null };
        }
      } catch (e) {
        // Ignore
      }
    }

    return { text: content, finalPrompt: null };
  };

  if (sessionStatus === "loading") {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-zinc-300">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wide text-zinc-400">Loading workspace...</p>
      </div>
    );
  }

  const currentSession = sessions.find((s) => s.id === currentSessionId);
  const activeTitle = currentSession?.title || "New Prompt Architect Workspace";

  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-[#09090b] text-zinc-100 flex flex-col md:flex-row relative">
      
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* LEFT: COLLAPSIBLE SIDEBAR */}
      <aside
        className={`fixed md:relative inset-y-0 left-0 z-40 bg-[#0c0c0f]/95 md:bg-[#121215]/90 backdrop-blur-xl border-r border-white/5 flex flex-col h-full overflow-hidden transition-all duration-300 ${
          sidebarOpen
            ? "translate-x-0 w-80"
            : "-translate-x-full md:translate-x-0 md:w-0 md:border-r-0"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-pink-500 flex items-center justify-center">
              <FaBrain className="w-4 h-4 text-white" />
            </div>
            <span className="text-md font-bold text-white">Prompt<span className="text-violet-400">Architect</span></span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer"
            title="Collapse Sidebar"
          >
            <FaChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={startNewChat}
            className="w-full py-3 px-4 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 font-bold hover:bg-violet-600/30 transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-600/5 cursor-pointer"
          >
            <FaPlus className="w-3.5 h-3.5" />
            <span>New Prompt Architect</span>
          </button>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto prevent-scroll-chaining px-2 py-2 space-y-1.5">
          <span className="px-3 text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">
            Refinement Sessions
          </span>
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-sm">No active sessions yet.</div>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => handleSelectSession(s.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelectSession(s.id);
                  }
                }}
                role="button"
                tabIndex={0}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group cursor-pointer ${
                  s.id === currentSessionId
                    ? "bg-white/10 text-white font-semibold"
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                }`}
              >
                <div className="flex items-center gap-2.5 truncate max-w-[85%]">
                  <FaComments className="w-4 h-4 text-violet-400 shrink-0" />
                  <span className="truncate text-sm">{s.title}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteSession(e, s.id)}
                  className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete Session"
                >
                  <FaTrash className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/5 bg-[#050119] flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <FaCoins className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-semibold text-zinc-400">{session?.user?.credits ?? 0} Credits</span>
          </div>
          <Link href="/pricing" className="text-violet-400 hover:underline">
            Buy Credits
          </Link>
        </div>
      </aside>

      {/* RIGHT: CHAT PANEL */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#09090b] relative w-full">
        
        {/* Chat Header */}
        <header className="h-16 border-b border-white/5 bg-slate-950/40 backdrop-blur-md flex items-center justify-between px-4 md:px-6 z-10 shrink-0">
          <div className="flex items-center gap-2">
            {!sidebarOpen && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer mr-1"
                title="Expand Sidebar"
              >
                <FaBars className="w-4 h-4" />
              </button>
            )}
            <Link
              href="/"
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Back to Landing Page"
            >
              <FaArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-md font-bold text-white truncate max-w-[160px] sm:max-w-sm md:max-w-md">
                {activeTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-300 text-xs font-semibold">
              <FaCoins className="w-3.5 h-3.5 text-violet-400" />
              <span>{session?.user?.credits ?? 0} credits</span>
            </div>
          </div>
        </header>

        {/* Chat Timeline (Scrollable Messages Area) */}
        <div className="flex-1 overflow-y-auto prevent-scroll-chaining px-4 py-8 md:px-8 space-y-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.length === 0 ? (
              <div className="text-center py-20 animate-slide-up flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-pink-500 flex items-center justify-center mb-6 shadow-xl shadow-violet-500/20">
                  <FaBrain className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">
                  Architect Elite Prompts
                </h2>
                <p className="text-zinc-400 max-w-md mx-auto text-sm leading-relaxed">
                  Start typing to refine details. The Prompt Architect will structure, refine, and engineer custom roleplay instructions based on your answers.
                </p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isUser = msg.role === "user";
                const isProcessing = msg.status === "processing";
                const { text, finalPrompt } = parseAssistantContent(msg.content);

                return (
                  <div key={msg.id || index} className="space-y-4">
                    {/* Standard Bubble */}
                    <div className={`flex gap-4 ${isUser ? "justify-end" : "justify-start"}`}>
                      {/* Avatar */}
                      {!isUser && (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-pink-500 flex items-center justify-center shrink-0">
                          <FaBrain className="w-4 h-4 text-white" />
                        </div>
                      )}

                      {/* Bubble Body */}
                      <div
                        className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed border ${
                          isUser
                            ? "bg-violet-600 text-white border-violet-500"
                            : "glass text-zinc-200 border-white/5"
                        }`}
                      >
                        {isProcessing ? (
                          <div className="flex items-center gap-1.5 px-2 py-1">
                            <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" />
                            <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                            <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{text || "..."}</p>
                        )}
                      </div>

                      {/* User Avatar */}
                      {isUser && session?.user?.image && (
                        <img
                          src={session.user.image}
                          alt="User Avatar"
                          className="w-8 h-8 rounded-full border border-white/10 shrink-0"
                        />
                      )}
                    </div>

                    {/* Final Prompt Output Card */}
                    {finalPrompt && !isProcessing && (
                      <FinalPromptCard content={finalPrompt} onRefine={handleRefineFurther} />
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Chat Input Sticky Footer */}
        <footer className="border-t border-white/5 bg-slate-950/60 backdrop-blur-md p-4 shrink-0">
          {/* Clean, minimal row selectors above input box */}
          <div className="max-w-3xl mx-auto mb-3 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-white/5 pb-3">
            <div className="flex items-center gap-1">
              <span className="text-zinc-500 mr-1.5">Mode:</span>
              <button
                type="button"
                onClick={() => setMode("refinement")}
                className={`px-2.5 py-1 rounded-md font-semibold border transition-all cursor-pointer ${
                  mode === "refinement"
                    ? "bg-violet-600/10 border-violet-500/25 text-violet-300 shadow-sm"
                    : "bg-transparent border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                ✨ Refine
              </button>
              <button
                type="button"
                onClick={() => setMode("normal")}
                className={`px-2.5 py-1 rounded-md font-semibold border transition-all cursor-pointer ${
                  mode === "normal"
                    ? "bg-violet-600/10 border-violet-500/25 text-violet-300 shadow-sm"
                    : "bg-transparent border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                ⚡ Direct
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">LLM Engine:</span>
              <select
                value={generatorModel}
                onChange={(e) => setGeneratorModel(e.target.value)}
                className="bg-zinc-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-zinc-300 focus:outline-none focus:border-violet-500/40 cursor-pointer"
              >
                {ANY_LLM_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.icon} {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="max-w-3xl mx-auto flex gap-3 items-end">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={
                pollingActive
                  ? "AI is thinking, please wait..."
                  : "Type your message or refinement idea... (Enter to send)"
              }
              disabled={pollingActive}
              rows={1}
              className="flex-1 glass-input rounded-2xl p-3.5 text-sm max-h-[150px] resize-none overflow-y-auto placeholder-zinc-500 transition-all focus:ring-1 focus:ring-violet-500/40"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={pollingActive || !inputText.trim()}
              className="p-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white shadow-lg transition-all shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Send Message"
            >
              <FaPaperPlane className="w-4 h-4" />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

// Sub-Component: FinalPromptCard
function FinalPromptCard({ content, onRefine }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenChatGPT = () => {
    const url = `https://chat.openai.com/?q=${encodeURIComponent(content)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="max-w-3xl mx-auto my-6 rounded-2xl bg-gradient-to-br from-violet-600/10 to-pink-500/10 backdrop-blur-xl border border-violet-500/35 overflow-hidden animate-slide-up shadow-lg shadow-violet-500/5">
      {/* Banner */}
      <div className="bg-gradient-to-r from-violet-600 to-pink-500 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FaMagic className="w-4 h-4 text-amber-300 animate-pulse" />
          <span className="font-bold text-white text-sm tracking-wide">✨ Engineered System Prompt</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-violet-200">
          <FaCheckCircle className="w-3.5 h-3.5 text-emerald-300" />
          <span>Completed & Ready</span>
        </div>
      </div>

      {/* Code Display Area */}
      <div className="p-5 space-y-4">
        <div className="bg-slate-950/70 border border-white/5 rounded-xl p-4.5 font-mono text-xs text-zinc-300 max-h-80 overflow-y-auto select-all leading-relaxed whitespace-pre-wrap">
          {content}
        </div>

        {/* Buttons Controls */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleCopy}
            className="flex-1 min-w-[140px] py-2.5 px-4 rounded-xl border border-white/10 hover:border-violet-500/30 text-white hover:bg-white/5 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <FaCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <FaRegClipboard className="w-3.5 h-3.5 text-zinc-400" />
                <span>Copy to Clipboard</span>
              </>
            )}
          </button>

          <button
            onClick={handleOpenChatGPT}
            className="flex-1 min-w-[140px] py-2.5 px-4 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <FaExternalLinkAlt className="w-3.5 h-3.5" />
            <span>Open in ChatGPT</span>
          </button>

          <button
            onClick={onRefine}
            className="flex-1 min-w-[140px] py-2.5 px-4 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 hover:bg-violet-600/30 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <FaMagic className="w-3.5 h-3.5" />
            <span>Refine Further</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-zinc-300">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wide text-zinc-400">Loading workspace...</p>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}
