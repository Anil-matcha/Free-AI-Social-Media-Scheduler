"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { 
  FaYoutube, 
  FaInstagram, 
  FaFacebook, 
  FaLinkedin, 
  FaPinterest, 
  FaRobot, 
  FaMagic, 
  FaPaperPlane, 
  FaCheck, 
  FaClock, 
  FaBolt, 
  FaShareAlt 
} from "react-icons/fa";
import { FaXTwitter, FaThreads } from "react-icons/fa6";
import { SiTiktok } from "react-icons/si";
import { 
  FiExternalLink, 
  FiPlus, 
  FiMessageSquare, 
  FiTrash2, 
  FiCalendar, 
  FiSend, 
  FiInfo,
  FiCheckCircle
} from "react-icons/fi";
import PostComposerModal from "@/components/composer/PostComposerModal";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const PLATFORM_ICONS = {
  youtube: { name: "YouTube", Icon: FaYoutube, color: "text-red-500", bg: "bg-red-500/10 border-red-500/30 text-red-400" },
  tiktok: { name: "TikTok", Icon: SiTiktok, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" },
  instagram: { name: "Instagram", Icon: FaInstagram, color: "text-pink-500", bg: "bg-pink-500/10 border-pink-500/30 text-pink-400" },
  x_twitter: { name: "X (Twitter)", Icon: FaXTwitter, color: "text-sky-400", bg: "bg-sky-500/10 border-sky-400/30 text-sky-400" },
  facebook: { name: "Facebook", Icon: FaFacebook, color: "text-blue-600", bg: "bg-blue-600/10 border-blue-600/30 text-blue-400" },
  linkedin: { name: "LinkedIn", Icon: FaLinkedin, color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/30 text-blue-400" },
  threads: { name: "Threads", Icon: FaThreads, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-400/30 text-purple-400" },
  pinterest: { name: "Pinterest", Icon: FaPinterest, color: "text-rose-500", bg: "bg-rose-500/10 border-rose-500/30 text-rose-400" },
};

const PROMPT_SUGGESTIONS = [
  "Draft a viral product launch announcement across YouTube and X.",
  "Write 3 engaging tweet hooks about AI productivity tips.",
  "Create a week-long content calendar theme for our social channels.",
  "Write an insightful LinkedIn post discussing remote work trends.",
];

// Aggressively sanitize any legacy model name mentions or unparsed raw JSON blocks from text
function sanitizeText(str) {
  if (!str) return "";
  return str
    .replace(/powered by \*\*gpt-5-mini\*\* with context memory\.?/gi, "with persistent context memory.")
    .replace(/\*\*gpt-5-mini\*\*/gi, "AI Assistant")
    .replace(/gpt-5-mini/gi, "AI Assistant")
    .replace(/```(?:json)?\s*\[\s*\{\s*"action":\s*"schedule_post"[\s\S]*?```/gi, "")
    .replace(/```(?:json)?\s*\{\s*"action":\s*"schedule_post"[\s\S]*?```/gi, "");
}

// Markdown Message Renderer using react-markdown with remark-gfm
function FormattedMessage({ content }) {
  if (!content) return null;
  const cleaned = sanitizeText(content);

  return (
    <div className="text-xs sm:text-sm text-zinc-200 leading-relaxed break-words space-y-2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h2 className="text-base sm:text-lg font-black text-white mt-4 mb-2 tracking-wide">
              {children}
            </h2>
          ),
          h2: ({ children }) => (
            <h3 className="text-sm sm:text-base font-extrabold text-white mt-3.5 mb-2">
              {children}
            </h3>
          ),
          h3: ({ children }) => (
            <h4 className="text-xs sm:text-sm font-bold text-white mt-3 mb-1.5 flex items-center gap-1.5 tracking-wide uppercase">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed my-1.5">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-white tracking-wide">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-zinc-300">
              {children}
            </em>
          ),
          ul: ({ children }) => (
            <ul className="space-y-1.5 my-2 pl-1 list-none">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="space-y-1.5 my-2 pl-5 list-decimal text-zinc-200 text-xs sm:text-sm">
              {children}
            </ol>
          ),
          li: ({ children, node }) => {
            const isOrdered = node?.parent?.tagName === "ol";
            if (isOrdered) {
              return (
                <li className="text-xs sm:text-sm text-zinc-200 leading-relaxed my-1 pl-1">
                  {children}
                </li>
              );
            }
            return (
              <li className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-200 leading-relaxed my-1">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-2 shrink-0 shadow-sm shadow-violet-400/50" />
                <span className="flex-1">{children}</span>
              </li>
            );
          },
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            return !inline ? (
              <div className="my-3 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950/90 shadow-inner">
                {match && (
                  <div className="px-3 py-1 bg-zinc-900 border-b border-zinc-800 text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                    {match[1]}
                  </div>
                )}
                <pre className="p-3 overflow-x-auto text-xs font-mono text-zinc-300 leading-normal">
                  <code>{children}</code>
                </pre>
              </div>
            ) : (
              <code className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-[11px] text-violet-300" {...props}>
                {children}
              </code>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-violet-500 pl-3 py-1 my-2 text-xs italic text-zinc-400 bg-violet-500/5 rounded-r-lg">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 border border-zinc-800 rounded-lg">
              <table className="min-w-full divide-y divide-zinc-800 text-xs text-zinc-300">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 bg-zinc-900 text-left font-bold text-white text-xs">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 border-t border-zinc-800/60 text-zinc-300 text-xs">
              {children}
            </td>
          ),
          a: ({ children, href }) => (
            <a href={href} className="text-violet-400 hover:text-violet-300 underline font-medium" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {cleaned}
      </ReactMarkdown>
    </div>
  );
}

function PostProposalCard({ proposal, index, total, onOpenComposer }) {
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyJson = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(JSON.stringify(proposal, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-4 rounded-xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-violet-500/40 shadow-xl space-y-3">
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-bold text-violet-300 uppercase tracking-wider">
            {total > 1 ? `PROPOSED POST #${index + 1} READY TO SCHEDULE` : "PROPOSED POST READY TO SCHEDULE"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {proposal.platforms?.map((pKey) => {
            const pInfo = PLATFORM_ICONS[pKey] || { name: pKey, Icon: FaShareAlt, color: "text-zinc-400" };
            const PIcon = pInfo.Icon;
            return (
              <span
                key={pKey}
                className="p-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-300"
                title={pInfo.name}
              >
                <PIcon className="text-xs" />
              </span>
            );
          })}
        </div>
      </div>

      {proposal.title && (
        <div>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
            Title / Headline:
          </span>
          <p className="text-xs font-bold text-zinc-100 mt-0.5">
            {proposal.title}
          </p>
        </div>
      )}

      {proposal.description && (
        <div>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
            Caption / Description:
          </span>
          <p className="text-xs text-zinc-300 mt-0.5 line-clamp-5 whitespace-pre-wrap">
            {proposal.description}
          </p>
        </div>
      )}

      {proposal.tags && (
        <div>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
            Hashtags:
          </span>
          <p className="text-[11px] text-blue-400 font-mono mt-0.5">
            {proposal.tags}
          </p>
        </div>
      )}

      {/* Action Row */}
      <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setShowJson(!showJson)}
          className="text-[11px] font-mono text-zinc-400 hover:text-zinc-200 flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 transition-all cursor-pointer"
        >
          <span>{showJson ? "Hide JSON" : "View JSON"}</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenComposer(proposal)}
          className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-violet-600/30 transition-all cursor-pointer"
        >
          <FiCalendar className="text-xs" />
          <span>Open in Composer & Schedule</span>
        </button>
      </div>

      {/* Collapsible Raw JSON Display */}
      {showJson && (
        <div className="mt-2.5 rounded-lg bg-zinc-950 border border-zinc-800 p-3 relative">
          <div className="flex items-center justify-between mb-1.5 text-[10px] font-mono text-zinc-400">
            <span>Structured Post Payload:</span>
            <button
              type="button"
              onClick={handleCopyJson}
              className="text-violet-400 hover:text-violet-300 text-[10px] font-semibold cursor-pointer"
            >
              {copied ? "Copied!" : "Copy JSON"}
            </button>
          </div>
          <pre className="text-[11px] font-mono text-zinc-300 overflow-x-auto leading-relaxed whitespace-pre">
            <code>{JSON.stringify(proposal, null, 2)}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

const DEFAULT_WELCOME = `Hello! I am your AI Social Media Marketing Agent with persistent context memory.

### What I can do for you:
- ✍️ **Craft Viral Copy**: Generate high-converting hooks, descriptions, and hashtags.
- 📅 **Multi-Channel Scheduling**: Prepare complete post proposals ready to schedule in 1 click.
- 🧠 **Context Memory**: I remember your brand voice and instructions across our conversation.

Select your target channels on the left and tell me what you'd like to plan!`;

export default function AgentWorkspace() {
  const { data: session, status } = useSession();

  // Connected Accounts
  const [accounts, setAccounts] = useState([]);
  const [selectedChannels, setSelectedChannels] = useState([]);

  // Chat & Threads State
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Composer Modal Integration
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerInitialPost, setComposerInitialPost] = useState(null);

  const messagesEndRef = useRef(null);

  // 1. Fetch connected accounts
  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/social/accounts");
      if (res.ok) {
        const data = await res.json();
        const accList = Array.isArray(data) ? data : [];
        setAccounts(accList);

        // Auto-select all connected platforms initially
        const keys = Array.from(
          new Set(
            accList.map((a) => {
              const p = (a.platform_name || "").toLowerCase();
              return p === "x" || p === "twitter" ? "x_twitter" : p;
            })
          )
        );
        setSelectedChannels(keys);
      }
    } catch (err) {
      console.warn("Failed to fetch accounts:", err);
    }
  }, []);

  // 2. Load threads from localStorage and scrub any old model names permanently
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("social_agent_threads");
        if (saved) {
          let parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Extract proposals from content if not already saved, and scrub any legacy model names
            parsed = parsed.map((thread) => ({
              ...thread,
              messages: (thread.messages || []).map((m) => {
                let proposals = Array.isArray(m.postProposals) && m.postProposals.length > 0
                  ? m.postProposals
                  : (m.postProposal ? [m.postProposal] : []);

                if (proposals.length === 0 && m.content) {
                  const jsonMatch = m.content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                  if (jsonMatch && jsonMatch[1]) {
                    try {
                      const pData = JSON.parse(jsonMatch[1]);
                      const norm = (item) => ({
                        platforms: Array.isArray(item.platforms) && item.platforms.length > 0 ? item.platforms : ["x_twitter"],
                        title: item.title || "",
                        description: item.description || "",
                        tags: item.tags || "",
                      });
                      if (Array.isArray(pData) && pData.length > 0) {
                        proposals = pData.map(norm);
                      } else if (pData && (pData.action === "schedule_post" || pData.title || pData.description)) {
                        proposals = [norm(pData)];
                      }
                    } catch (e) {}
                  }
                }

                return {
                  ...m,
                  content: sanitizeText(m.content),
                  postProposals: proposals.length > 0 ? proposals : null,
                  postProposal: proposals.length > 0 ? proposals[0] : null,
                };
              }),
            }));

            // Save cleaned and extracted version back to localStorage
            localStorage.setItem("social_agent_threads", JSON.stringify(parsed));

            setThreads(parsed);
            setActiveThreadId(parsed[0].id);
            setMessages(parsed[0].messages || []);
            return;
          }
        }
      } catch (e) {
        console.warn("Failed to load threads from localStorage:", e);
      }

      // Initialize default new thread
      const newThread = {
        id: "thread_" + Date.now(),
        title: "New Strategy Chat",
        createdAt: new Date().toISOString(),
        messages: [
          {
            id: "welcome",
            role: "assistant",
            content: DEFAULT_WELCOME,
          },
        ],
      };
      setThreads([newThread]);
      setActiveThreadId(newThread.id);
      setMessages(newThread.messages);
      localStorage.setItem("social_agent_threads", JSON.stringify([newThread]));
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchAccounts();
    }
  }, [status, fetchAccounts]);

  // Save current messages to active thread
  const updateThreadMessages = (threadId, newMessages, customTitle = null) => {
    setThreads((prev) => {
      const updated = prev.map((t) => {
        if (t.id === threadId) {
          return {
            ...t,
            title: customTitle || t.title,
            messages: newMessages,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      });
      localStorage.setItem("social_agent_threads", JSON.stringify(updated));
      return updated;
    });
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // Toggle channel selection
  const toggleChannel = (key) => {
    setSelectedChannels((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Switch Thread
  const handleSelectThread = (threadId) => {
    const found = threads.find((t) => t.id === threadId);
    if (found) {
      setActiveThreadId(found.id);
      setMessages(found.messages || []);
      setErrorMsg("");
    }
  };

  // Create New Thread
  const handleNewThread = () => {
    const targetNames = selectedChannels.map(k => PLATFORM_ICONS[k]?.name || k).join(", ") || "All connected channels";
    const newThread = {
      id: "thread_" + Date.now(),
      title: "New Strategy Chat",
      createdAt: new Date().toISOString(),
      messages: [
        {
          id: "welcome_" + Date.now(),
          role: "assistant",
          content: `New conversation started! Target channels: **${targetNames}**.\n\nWhat social campaign or post would you like to create?`,
        },
      ],
    };

    setThreads((prev) => {
      const updated = [newThread, ...prev];
      localStorage.setItem("social_agent_threads", JSON.stringify(updated));
      return updated;
    });
    setActiveThreadId(newThread.id);
    setMessages(newThread.messages);
    setErrorMsg("");
  };

  // Delete Thread
  const handleDeleteThread = (e, threadId) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this thread?")) return;

    setThreads((prev) => {
      const remaining = prev.filter((t) => t.id !== threadId);
      localStorage.setItem("social_agent_threads", JSON.stringify(remaining));

      if (activeThreadId === threadId) {
        if (remaining.length > 0) {
          setActiveThreadId(remaining[0].id);
          setMessages(remaining[0].messages || []);
        } else {
          handleNewThread();
        }
      }
      return remaining;
    });
  };

  // Send message to Agent
  const handleSendMessage = async (customText = null) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend || isThinking) return;

    setInputText("");
    setErrorMsg("");

    // Append user message
    const userMsg = {
      id: "msg_" + Date.now(),
      role: "user",
      content: textToSend,
      createdAt: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    // Auto-update thread title if it's the first user message
    let threadTitle = null;
    const userMsgCount = newMessages.filter((m) => m.role === "user").length;
    if (userMsgCount === 1) {
      threadTitle = textToSend.slice(0, 30) + (textToSend.length > 30 ? "..." : "");
    }

    updateThreadMessages(activeThreadId, newMessages, threadTitle);
    setIsThinking(true);

    try {
      // Build strictly last 10 messages for history
      const historyToSend = newMessages
        .slice(-10)
        .map((m) => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.content || "",
        }));

      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          messages: historyToSend,
          history: historyToSend.slice(0, -1),
          selectedChannels,
          targetChannels: selectedChannels,
          threadId: activeThreadId,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${res.status}`);
      }

      const data = await res.json();
      const assistantReply = data.reply || "I have analyzed your request. How else can I assist your social strategy?";

      const assistantMsg = {
        id: "msg_" + Date.now(),
        role: "assistant",
        content: assistantReply,
        postProposal: data.postProposal || null,
        postProposals: data.postProposals || (data.postProposal ? [data.postProposal] : []),
        createdAt: new Date().toISOString(),
      };

      const finalMessages = [...newMessages, assistantMsg];
      setMessages(finalMessages);
      updateThreadMessages(activeThreadId, finalMessages);
    } catch (err) {
      console.error("Agent chat error:", err);
      setErrorMsg(err.message || "Failed to get response from agent. Please try again.");
    } finally {
      setIsThinking(false);
    }
  };

  // Open Proposed Post in Composer
  const handleOpenProposalInComposer = (proposal) => {
    setComposerInitialPost({
      platform: proposal.platforms?.[0] || "youtube",
      title: proposal.title || "",
      description: proposal.description || "",
      tags: proposal.tags || "",
      platforms: proposal.platforms || selectedChannels,
    });
    setComposerOpen(true);
  };

  if (status === "unauthenticated") {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center p-6 bg-zinc-950 text-zinc-100">
        <div className="max-w-md text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-violet-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-violet-600/30">
            <FaRobot className="text-2xl" />
          </div>
          <h2 className="text-2xl font-bold">Sign In to Use the Agent</h2>
          <p className="text-xs text-zinc-400">
            Authenticate to access your connected social accounts and conversational AI assistant.
          </p>
          <button
            onClick={() => signIn("google")}
            className="px-5 py-2.5 rounded-lg bg-white text-zinc-950 text-xs font-bold transition-all shadow hover:bg-zinc-200 cursor-pointer"
          >
            Sign In with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-68px)] max-h-[calc(100vh-68px)] w-full bg-[#0c0c0e] text-zinc-100 flex flex-col overflow-hidden">
      {/* 3-Panel Main Layout matching reference app proportions */}
      <div className="flex-1 h-full min-h-0 flex overflow-hidden divide-x divide-zinc-800/80">
        
        {/* ========================================================= */}
        {/* LEFT SIDEBAR: Select Channels (w-[260px])                  */}
        {/* ========================================================= */}
        <aside className="w-[260px] min-w-[260px] max-w-[260px] h-full bg-[#121214] flex flex-col shrink-0 relative border-r border-zinc-800/60 select-none overflow-hidden">
          <div className="p-5 flex flex-col h-full min-h-0 overflow-hidden">
            {/* Header with Title & Active Badge */}
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h2 className="text-base font-semibold text-white tracking-tight">
                Select Channels
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-violet-500/15 text-violet-300 border border-violet-500/30">
                {selectedChannels.length} active
              </span>
            </div>

            {/* Channel List */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 -mr-1">
              {accounts.length === 0 ? (
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 text-center space-y-2.5 my-2">
                  <p className="text-xs text-zinc-400">No channels connected yet.</p>
                  <Link
                    href="/integrations"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow transition-all"
                  >
                    <FiPlus className="text-xs" />
                    <span>Connect Channel</span>
                  </Link>
                </div>
              ) : (
                accounts.map((acc) => {
                  const rawPlat = (acc.platform_name || "").toLowerCase();
                  const platKey = rawPlat === "x" || rawPlat === "twitter" ? "x_twitter" : rawPlat;
                  const config = PLATFORM_ICONS[platKey] || { name: acc.platform_name || platKey, Icon: FaShareAlt, color: "text-zinc-400" };
                  const Icon = config.Icon;
                  const isSelected = selectedChannels.includes(platKey);

                  return (
                    <div
                      key={acc.id}
                      onClick={() => toggleChannel(platKey)}
                      className={`group flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all border ${
                        isSelected
                          ? "bg-zinc-800/90 border-zinc-700/60 text-white shadow-sm opacity-100"
                          : "bg-zinc-900/20 border-transparent text-zinc-400 opacity-40 hover:opacity-85 hover:bg-zinc-800/40"
                      }`}
                    >
                      {/* Left vertical indicator bar */}
                      <div
                        className={`w-1 h-8 rounded-full transition-colors shrink-0 ${
                          isSelected ? "bg-violet-500 shadow-sm shadow-violet-500/50" : "bg-transparent"
                        }`}
                      />

                      {/* Avatar with platform badge */}
                      <div className="relative shrink-0">
                        <div className="w-9 h-9 rounded-lg bg-zinc-800/90 flex items-center justify-center border border-zinc-700/70 shadow-inner">
                          <Icon className={`text-base ${config.color}`} />
                        </div>
                        {isSelected && (
                          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-zinc-900 flex items-center justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          </div>
                        )}
                      </div>

                      {/* Text info */}
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-zinc-100 truncate">
                          {config.name}
                        </div>
                        <div className="text-[11px] text-zinc-400 truncate">
                          {acc.account_name || "Connected"}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Add Channel Button */}
            <div className="pt-3 border-t border-zinc-800/80 mt-auto shrink-0">
              <Link
                href="/integrations"
                className="w-full h-10 rounded-xl border border-dashed border-zinc-700 hover:border-violet-500 text-zinc-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all bg-zinc-900/40 hover:bg-violet-500/10"
              >
                <FiPlus className="text-xs" />
                <span>Add Channel</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* ========================================================= */}
        {/* CENTER PANEL: Agent Chat                                  */}
        {/* ========================================================= */}
        <main className="flex-1 h-full min-h-0 flex flex-col bg-[#0c0c0e] overflow-hidden relative">
          {/* Top Bar (No Model Name Mentioned) */}
          <div className="shrink-0 px-6 py-3.5 border-b border-zinc-800/80 bg-[#121214]/60 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-600/25 text-white shrink-0">
                <FaRobot className="text-lg" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold text-white tracking-wide uppercase">
                    Social Marketing Agent
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Active
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/20">
                    Context Memory
                  </span>
                </div>
                {/* Active Channel Pills */}
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className="text-[10px] text-zinc-500 font-medium">Targeting:</span>
                  {selectedChannels.length === 0 ? (
                    <span className="text-[10px] text-amber-400 font-medium">None selected</span>
                  ) : (
                    selectedChannels.map((k) => {
                      const p = PLATFORM_ICONS[k] || { name: k, Icon: FaShareAlt, color: "text-zinc-400" };
                      const PIcon = p.Icon;
                      return (
                        <span key={k} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800/90 border border-zinc-700/80 text-[10px] text-zinc-300 font-medium shadow-xs">
                          <PIcon className={`text-[9px] ${p.color}`} />
                          <span>{p.name}</span>
                        </span>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action: New Chat */}
            <button
              type="button"
              onClick={handleNewThread}
              className="px-3 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/70 text-xs font-semibold text-zinc-200 hover:text-white flex items-center gap-1.5 transition-all shadow-sm cursor-pointer shrink-0"
            >
              <FiPlus className="text-xs text-violet-400" />
              <span>New Chat</span>
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 min-h-0 p-6 overflow-y-auto space-y-4">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-3xl ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                >
                  {/* Avatar */}
                  <div className="shrink-0 mt-0.5">
                    {isUser ? (
                      <div className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-violet-600/30">
                        U
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-violet-500/30">
                        <FaRobot className="text-xs" />
                      </div>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className="space-y-3 min-w-0 max-w-[85%]">
                    <div
                      className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isUser
                          ? "bg-violet-600 text-white rounded-tr-none shadow-md shadow-violet-600/20"
                          : "bg-[#141416] border border-zinc-800/90 text-zinc-200 rounded-tl-none shadow-sm"
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{sanitizeText(msg.content)}</p>
                      ) : (
                        <FormattedMessage content={msg.content} />
                      )}
                    </div>

                    {/* Interactive Post Proposal Cards */}
                    {(() => {
                      const proposals = Array.isArray(msg.postProposals) && msg.postProposals.length > 0
                        ? msg.postProposals
                        : (msg.postProposal ? [msg.postProposal] : []);

                      if (proposals.length === 0) return null;

                      return (
                        <div className="space-y-3 mt-3">
                          {proposals.map((proposal, pIdx) => (
                            <PostProposalCard
                              key={pIdx}
                              proposal={proposal}
                              index={pIdx}
                              total={proposals.length}
                              onOpenComposer={handleOpenProposalInComposer}
                            />
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              );
            })}

            {/* Thinking Indicator */}
            {isThinking && (
              <div className="flex gap-3 max-w-2xl mr-auto">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-violet-500/30 shrink-0">
                  <FaRobot className="text-xs animate-spin" />
                </div>
                <div className="p-3.5 rounded-xl rounded-tl-none bg-[#141416] border border-zinc-800 text-xs text-zinc-400 flex items-center gap-2.5">
                  <div className="w-3.5 h-3.5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                  <span>Agent is strategizing and writing...</span>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
                <FiInfo className="text-sm shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          {messages.length <= 2 && (
            <div className="shrink-0 px-6 pb-2.5">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">
                Suggested Prompts:
              </span>
              <div className="flex flex-wrap gap-2">
                {PROMPT_SUGGESTIONS.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(suggestion)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-800 hover:border-violet-500/40 text-[11px] text-zinc-300 hover:text-white transition-all cursor-pointer text-left flex items-center gap-1.5 shadow-sm"
                  >
                    <FaBolt className="text-[10px] text-amber-400 shrink-0" />
                    <span className="truncate max-w-xs">{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Floating Input Box (Pinned at bottom, never overflows out of view) */}
          <div className="shrink-0 p-4 sm:p-5 border-t border-zinc-800/80 bg-[#121214]/80 backdrop-blur-md">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative flex items-center bg-[#0c0c0e] border border-zinc-800 rounded-2xl focus-within:border-violet-500/70 focus-within:ring-1 focus-within:ring-violet-500/20 transition-all shadow-inner"
            >
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask the agent to write, strategize, or schedule posts (Shift+Enter for newline)..."
                rows={1}
                className="w-full bg-transparent px-5 py-3.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none max-h-32 leading-relaxed"
              />
              <div className="pr-3 flex items-center gap-2 shrink-0">
                <button
                  type="submit"
                  disabled={!inputText.trim() || isThinking}
                  className="w-9 h-9 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-violet-600/30 cursor-pointer active:scale-95"
                  title="Send message"
                >
                  <FaPaperPlane className="text-xs" />
                </button>
              </div>
            </form>
            <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-2 px-1 font-medium">
              <span>Press Enter to send • Context memory active across last 10 messages</span>
              <span>{selectedChannels.length} active target channels</span>
            </div>
          </div>
        </main>

        {/* ========================================================= */}
        {/* RIGHT SIDEBAR: Chat History (w-[260px])                   */}
        {/* ========================================================= */}
        <aside className="w-[260px] min-w-[260px] max-w-[260px] h-full bg-[#121214] flex flex-col shrink-0 relative border-l border-zinc-800/60 select-none overflow-hidden">
          <div className="p-5 flex flex-col h-full min-h-0 overflow-hidden">
            {/* Header with Title */}
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h2 className="text-base font-semibold text-white tracking-tight">
                Chat History
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                {threads.length} {threads.length === 1 ? "chat" : "chats"}
              </span>
            </div>

            {/* Start New Chat Button */}
            <div className="mb-4 shrink-0">
              <button
                type="button"
                onClick={handleNewThread}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-violet-600/25 cursor-pointer active:scale-95"
              >
                <FiPlus size={16} />
                <span>Start a new chat</span>
              </button>
            </div>

            {/* Threads List */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1 -mr-1">
              {threads.map((thread) => {
                const isActive = thread.id === activeThreadId;
                return (
                  <div
                    key={thread.id}
                    onClick={() => handleSelectThread(thread.id)}
                    className={`group px-3 py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between border ${
                      isActive
                        ? "bg-zinc-800/90 text-white font-medium border-violet-500/50 shadow-sm"
                        : "bg-transparent text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FiMessageSquare 
                        size={14} 
                        className={`shrink-0 ${isActive ? "text-violet-400" : "text-zinc-500 group-hover:text-zinc-400"}`} 
                      />
                      <span className="text-xs truncate">
                        {thread.title}
                      </span>
                    </div>

                    {threads.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteThread(e, thread.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-all cursor-pointer shrink-0"
                        title="Delete Thread"
                      >
                        <FiTrash2 size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      {/* Post Composer Modal Integration */}
      {composerOpen && (
        <PostComposerModal
          isOpen={composerOpen}
          onClose={() => {
            setComposerOpen(false);
            setComposerInitialPost(null);
          }}
          initialPost={composerInitialPost}
          onPostSaved={() => {
            setComposerOpen(false);
            setComposerInitialPost(null);
          }}
        />
      )}
    </div>
  );
}
