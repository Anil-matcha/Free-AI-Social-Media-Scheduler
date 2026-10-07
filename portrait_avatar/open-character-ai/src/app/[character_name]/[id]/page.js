"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import {
  Sparkles,
  Send,
  Sliders,
  Image as ImageIcon,
  Cpu,
  LogOut,
  Loader2,
  ArrowLeft,
  Plus,
  History,
  LogIn,
  Flame,
  X,
  Menu,
} from "lucide-react";

// A simple custom Markdown renderer for premium message layout
function renderMarkdown(text) {
  if (!text) return null;
  const blocks = text.split(/\n\n+/);
  return blocks.map((block, blockIdx) => {
    const trimmed = block.trim();
    if (trimmed === "---") {
      return <hr key={blockIdx} className="my-4 border-t border-zinc-800" />;
    }
    if (trimmed.startsWith("```") && trimmed.endsWith("```")) {
      const codeLines = trimmed.slice(3, -3).trim().split("\n");
      const firstLine = codeLines[0];
      const isLang =
        firstLine && !firstLine.includes(" ") && firstLine.length < 15;
      const code = (isLang ? codeLines.slice(1) : codeLines).join("\n");
      return (
        <pre
          key={blockIdx}
          className="my-3 p-4 bg-zinc-950 rounded border border-zinc-850 overflow-x-auto font-mono text-xs text-blue-300"
        >
          <code>{code}</code>
        </pre>
      );
    }
    if (
      trimmed
        .split("\n")
        .every(
          (line) =>
            line.trim().startsWith("* ") || line.trim().startsWith("- "),
        )
    ) {
      return (
        <ul
          key={blockIdx}
          className="list-disc pl-5 my-3 space-y-1.5 text-zinc-300"
        >
          {trimmed.split("\n").map((line, lineIdx) => {
            const content = line.replace(/^[\*\-]\s+/, "");
            return <li key={lineIdx}>{parseInlineMarkdown(content)}</li>;
          })}
        </ul>
      );
    }
    if (trimmed.split("\n").every((line) => /^\d+\.\s+/.test(line.trim()))) {
      return (
        <ol
          key={blockIdx}
          className="list-decimal pl-5 my-3 space-y-1.5 text-zinc-350"
        >
          {trimmed.split("\n").map((line, lineIdx) => {
            const content = line.replace(/^\d+\.\s+/, "");
            return <li key={lineIdx}>{parseInlineMarkdown(content)}</li>;
          })}
        </ol>
      );
    }
    if (trimmed.startsWith("### ")) {
      return (
        <h4
          key={blockIdx}
          className="text-sm font-black uppercase tracking-wider text-blue-400 mt-4 mb-2"
        >
          {parseInlineMarkdown(trimmed.slice(4))}
        </h4>
      );
    }
    if (trimmed.startsWith("## ")) {
      return (
        <h3
          key={blockIdx}
          className="text-base font-black text-zinc-100 mt-4 mb-2"
        >
          {parseInlineMarkdown(trimmed.slice(3))}
        </h3>
      );
    }
    if (trimmed.startsWith("# ")) {
      return (
        <h2
          key={blockIdx}
          className="text-lg font-black text-zinc-100 mt-4 mb-2"
        >
          {parseInlineMarkdown(trimmed.slice(2))}
        </h2>
      );
    }
    return (
      <p
        key={blockIdx}
        className="mb-2 leading-relaxed text-zinc-200 last:mb-0"
      >
        {parseInlineMarkdown(block)}
      </p>
    );
  });
}

function parseInlineMarkdown(text) {
  if (!text) return "";
  const parts = [];
  let remaining = text;
  while (remaining) {
    const boldIdx = remaining.indexOf("**");
    const codeIdx = remaining.indexOf("`");
    if (boldIdx === -1 && codeIdx === -1) {
      parts.push(remaining);
      break;
    }
    if (boldIdx !== -1 && (codeIdx === -1 || boldIdx < codeIdx)) {
      if (boldIdx > 0) {
        parts.push(remaining.substring(0, boldIdx));
      }
      const nextBold = remaining.indexOf("**", boldIdx + 2);
      if (nextBold === -1) {
        parts.push(remaining.substring(boldIdx));
        break;
      } else {
        const boldText = remaining.substring(boldIdx + 2, nextBold);
        parts.push(
          <strong key={parts.length} className="font-extrabold text-white">
            {boldText}
          </strong>,
        );
        remaining = remaining.substring(nextBold + 2);
      }
    } else {
      if (codeIdx > 0) {
        parts.push(remaining.substring(0, codeIdx));
      }
      const nextCode = remaining.indexOf("`", codeIdx + 1);
      if (nextCode === -1) {
        parts.push(remaining.substring(codeIdx));
        break;
      } else {
        const codeText = remaining.substring(codeIdx + 1, nextCode);
        parts.push(
          <code
            key={parts.length}
            className="px-1.5 py-0.5 bg-zinc-950 text-blue-300 font-mono text-xs rounded border border-zinc-850"
          >
            {codeText}
          </code>,
        );
        remaining = remaining.substring(nextCode + 1);
      }
    }
  }
  return parts;
}

export default function ChatConsole({ params }) {
  // Await the routing parameters per Next.js 16 standards
  const resolvedParams = use(params);
  const chatId = resolvedParams.id;

  const router = useRouter();
  const { data: session, status: authStatus } = useSession();

  // Dialog layers
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarChats, setSidebarChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);

  // Advanced parameters state
  const [showConfig, setShowConfig] = useState(false);
  const [model, setModel] = useState("openai/gpt-4o");
  const [temperature, setTemperature] = useState(1.0);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [reasoning, setReasoning] = useState(false);

  // Vision attachments & global gallery state
  const [attachedImage, setAttachedImage] = useState(null);
  const [attachedImages, setAttachedImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  // Simulated upgrade modal trigger state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [userCredits, setUserCredits] = useState(50);

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load chat conversations and historic dialog details
  useEffect(() => {
    if (authStatus === "authenticated") {
      fetchSidebarChats();
      fetchActiveChatDetails();
      fetchMessages();
    }
  }, [authStatus, chatId]);

  // Handle credits binding from session or custom increments
  useEffect(() => {
    if (session?.user) {
      setUserCredits(session.user.credits);
    }
  }, [session]);

  // Smooth scroll dialogue thread on new messages
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const fetchSidebarChats = async () => {
    try {
      const res = await fetch("/api/chats");
      const data = await res.json();
      if (data.chats) {
        setSidebarChats(data.chats);
      }
    } catch (err) {
      console.error("Failed to load active chats", err);
    }
  };

  const handleStartNewChat = async () => {
    if (!activeChat?.characterId) return;
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character_id: activeChat.characterId,
          forceNew: true,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.chat) {
          fetchSidebarChats();
          router.push(`/${resolvedParams.character_name}/${data.chat.id}`);
        }
      }
    } catch (err) {
      console.error("Failed starting new chat", err);
    }
  };

  const fetchActiveChatDetails = async () => {
    try {
      const res = await fetch("/api/chats");
      const data = await res.json();
      if (data.chats) {
        const matching = data.chats.find((c) => c.id === chatId);
        if (matching) {
          setActiveChat(matching);
        }
      }
    } catch (err) {
      console.error("Failed loading chat room details", err);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/chats/${chatId}/messages`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error("Error retrieving dialog history", err);
    }
  };

  // Upstream vision proxy upload handler
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Proxy upload failed");
      }

      const data = await res.json();
      if (data.url) {
        setAttachedImage(data.url);
        setAttachedImages((prev) => [...prev, data.url]);
        // Refresh the image gallery drawer if open
        if (showGallery) fetchGalleryImages();
      }
    } catch (err) {
      console.error("Failed uploading vision asset", err);
      alert(
        "Vision upload failed. Make sure your credit balance is greater than 0.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Open & populate the cross-chat image gallery selector
  const toggleGallery = async () => {
    const nextState = !showGallery;
    setShowGallery(nextState);
    if (nextState) {
      fetchGalleryImages();
    }
  };

  const fetchGalleryImages = async () => {
    setLoadingGallery(true);
    try {
      const res = await fetch("/api/images");
      const data = await res.json();
      if (data.images) {
        setGalleryImages(data.images);
      }
    } catch (err) {
      console.error("Failed reading user image index", err);
    } finally {
      setLoadingGallery(false);
    }
  };

  const selectGalleryImage = (url) => {
    setAttachedImage(url);
    setAttachedImages((prev) => [...prev, url]);
    setShowGallery(false);
  };

  // Helper for auto-adjusting textarea height
  const handleTextareaChange = (e) => {
    setInputMessage(e.target.value);
    e.target.style.height = "24px";
    e.target.style.height = `${Math.min(Math.max(e.target.scrollHeight, 24), 180)}px`;
  };

  // Message submissions
  const handleSendMessage = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if ((!inputMessage.trim() && attachedImages.length === 0) || isTyping)
      return;

    const userText = inputMessage;
    const userImg = attachedImages[0] || null;

    setInputMessage("");
    setAttachedImage(null);
    setAttachedImages([]);
    setIsTyping(true);

    // Reset height of the expandable input textarea
    const textarea = document.querySelector("textarea[placeholder*='Ask']");
    if (textarea) {
      textarea.style.height = "24px";
    }

    // Optimistically update frontend UI
    const tempUserMsg = {
      id: "temp_user_" + Math.random().toString(36).substring(2, 9),
      role: "user",
      content: userText,
      imageUrl: userImg,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch(`/api/chats/${chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: userText,
          imageUrl: userImg,
          model,
          temperature,
          maxTokens,
          reasoning,
        }),
      });

      if (res.status === 402) {
        const errData = await res.json();
        alert(errData.error || "Insufficient credits! Please upgrade to c.ai+");
        // Remove optimistic user message
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
        return;
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Generation pipeline failed");
      }

      const data = await res.json();
      if (data.assistantMessage) {
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== tempUserMsg.id),
          data.userMessage,
          data.assistantMessage,
        ]);
        setUserCredits(data.remainingCredits);
      }
    } catch (err) {
      console.error("Post generation error", err);
      alert(
        err.message ||
          "An unexpected error occurred. Credits refunded if deducted.",
      );
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    } finally {
      setIsTyping(false);
    }
  };

  // Trigger simulated upgrade credits flow
  const executeUpgrade = async () => {
    try {
      // Simulate adding 100 credits trigger inside a fake checkout
      setUserCredits((prev) => prev + 100);
      setShowUpgradeModal(false);
      alert(
        "Successfully upgraded to c.ai+! Added 100 premium credits to your balance.",
      );
    } catch (err) {
      console.error(err);
    }
  };

  const getCostRating = () => {
    const isPremium =
      model.startsWith("deepseek/") ||
      model.startsWith("openai/") ||
      model.startsWith("anthropic/") ||
      model.includes("pro") ||
      model.includes("o1") ||
      model.includes("o3");
    return isPremium ? 10 : 1;
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-zinc-950 text-gray-100 font-sans antialiased">
      {/* MOBILE OVERLAY */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}
      {/* 1. PERSISTENT SIDE NAVIGATION BAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-all duration-300 md:relative md:translate-x-0 bg-zinc-900 border-r border-zinc-800 p-5 flex flex-col shrink-0 select-none ${showSidebar ? "translate-x-0 shadow-2xl md:ml-0 md:shadow-none" : "-translate-x-full md:-ml-64"}`}
      >
        <div className="flex items-center gap-2 justify-between mb-6">
          {/* LOGO HEADER */}
          <Link
            href="/"
            className="flex items-center gap-3 hover:opacity-95 transition-opacity"
          >
            <div className="h-9 w-9 rounded-full flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-blue-500/10">
              🤖
            </div>
            <div>
              <h1 className="text-lg font-black tracking-wider text-white">
                character.ai
              </h1>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                Serverless Studio
              </p>
            </div>
          </Link>
          {/* Mobile close button */}
          <button
            onClick={() => setShowSidebar(false)}
            className="md:hidden p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ACTIVE DIALOG HISTORY CHANNELS */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
              Chat Sessions
            </h3>
            <button
              onClick={handleStartNewChat}
              className="text-[10px] px-2.5 py-1 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded font-bold flex items-center gap-1 transition"
              title="Start a new chat thread with this character"
            >
              <Plus className="w-3 h-3 text-blue-500" />
              <span>New Chat</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {sidebarChats
              .filter(
                (c) =>
                  c.character.name.toLowerCase().replace(/ /g, "-") ===
                  resolvedParams.character_name.toLowerCase(),
              )
              .map((c, idx, arr) => {
                const isActive = c.id === chatId;
                const dateStr = new Date(c.createdAt).toLocaleDateString(
                  undefined,
                  {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                );
                return (
                  <Link
                    key={c.id}
                    href={`/${c.character.name.toLowerCase().replace(/ /g, "-")}/${c.id}`}
                    className={`w-full p-3 rounded flex items-center justify-between border transition-all duration-200 ${
                      isActive
                        ? "bg-bg-card-hover border-divider text-primary font-bold"
                        : "bg-bg-page/40 border-transparent text-secondary-text hover:bg-bg-card-hover hover:text-primary-text"
                    }`}
                  >
                    <div className="overflow-hidden flex-1">
                      <h4 className="text-xs font-bold truncate">
                        Session {c.id.substring(0, 10)}...
                      </h4>
                      <p className="text-[10px] text-zinc-500 leading-normal mt-0.5">
                        {dateStr}
                      </p>
                    </div>
                    {isActive && (
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0 ml-2" />
                    )}
                  </Link>
                );
              })}
          </div>
        </div>

        {/* BOTTOM USER PROFILE CONTROL SECTION */}
        <div className="mt-6 pt-4 border-t border-divider/50">
          {authStatus === "authenticated" && session?.user ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt=""
                      className="w-9 h-9 rounded-full border border-divider/50 shadow-md shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded bg-primary flex items-center justify-center font-bold text-sm text-white shrink-0">
                      {session.user.name?.[0] || "U"}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-sm truncate leading-tight text-primary-text">
                      {session.user.name}
                    </h4>
                    <p className="text-xs text-secondary-text truncate">
                      {session.user.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="p-1.5 hover:bg-bg-card-hover rounded text-secondary-text hover:text-rose-500 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* DYNAMIC SEED CREDIT COUNTER PROFILE SHIELD */}
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-secondary-text">
                <span>Remaining Credits:</span>
                <span className="text-sm text-primary">{userCredits}</span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="w-full py-3 px-4 rounded bg-primary hover:bg-primary-hover font-bold text-xs tracking-wider uppercase shadow-md flex items-center justify-center gap-2 cursor-pointer transition active:scale-[0.98]"
            >
              <LogIn className="w-4 h-4" />
              <span>Login with Google</span>
            </button>
          )}
        </div>
      </aside>
      {/* 2. CHAT VIEWPORT ENVIRONMENT */}
      <section
        className={`flex-1 flex flex-col overflow-hidden relative transition-all duration-300 ${showGallery ? "lg:mr-80" : ""}`}
      >
        {/* HEADER BAR */}
        <header className="p-2 bg-bg-card border-b border-divider/50 flex items-center justify-between z-20">
          <div className="flex items-center min-w-0">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 hover:bg-bg-card-hover rounded text-secondary-text hover:text-primary-text transition duration-200 shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link
              href="/"
              className="p-2 hover:bg-bg-card-hover rounded text-secondary-text hover:text-primary-text transition duration-200 flex items-center gap-1.5 text-xs font-bold shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            {activeChat && (
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-full bg-bg-card border border-divider/50 flex items-center justify-center text-2xl shrink-0 shadow-sm overflow-hidden relative">
                  {activeChat.character?.profileUrl ||
                  (activeChat.character?.avatar?.length > 2 &&
                    activeChat.character?.avatar?.startsWith("http")) ? (
                    <img
                      src={
                        activeChat.character?.profileUrl ||
                        activeChat.character?.avatar
                      }
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    activeChat.character?.avatar || "🤖"
                  )}
                </div>
                <div className="min-w-0 flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-black text-base text-primary-text truncate">
                        {activeChat.character.name}
                      </h2>
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    </div>
                    <p
                      title={activeChat.character.description}
                      className="text-[11px] text-secondary-text font-semibold truncate max-w-[120px] sm:max-w-[200px] md:max-w-[400px]"
                    >
                      {activeChat.character.description}
                    </p>
                  </div>

                  {session?.user &&
                    activeChat.character.userId === session.user.id && (
                      <div className="flex items-center gap-2 px-2.5 py-1.5 bg-bg-page border border-divider/50 rounded select-none shrink-0">
                        <span className="text-[10px] font-bold text-secondary-text uppercase tracking-wider">
                          {activeChat.character.isPublic ? "Public" : "Private"}
                        </span>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const newPublicStatus =
                                !activeChat.character.isPublic;
                              const res = await fetch("/api/characters", {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  characterId: activeChat.character.id,
                                  isPublic: newPublicStatus,
                                }),
                              });
                              if (res.ok) {
                                const data = await res.json();
                                if (data.character) {
                                  setActiveChat((prev) => ({
                                    ...prev,
                                    character: {
                                      ...prev.character,
                                      isPublic: data.character.isPublic,
                                    },
                                  }));
                                }
                              }
                            } catch (err) {
                              console.error(
                                "Failed to toggle character visibility",
                                err,
                              );
                            }
                          }}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${activeChat.character.isPublic ? "bg-primary" : "bg-bg-card-hover"}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${activeChat.character.isPublic ? "translate-x-4" : "translate-x-0"}`}
                          />
                        </button>
                      </div>
                    )}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`p-2 rounded border flex items-center gap-2 text-xs font-bold transition duration-200 cursor-pointer shrink-0 ${
              showConfig
                ? "bg-primary/10 border-primary/50 text-primary"
                : "bg-bg-page border-divider/50 text-secondary-text hover:bg-bg-card-hover hover:text-primary-text"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span className="whitespace-nowrap hidden md:inline">
              LLM Tuning Parameters
            </span>
          </button>
        </header>
        {/* MAIN BODY AREA (CHATS + PARAMETERS PANEL) */}
        <div className="flex-1 flex justify-center overflow-hidden relative pb-10">
          {/* MESSAGES LOG VIEW */}
          <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-6 flex flex-col items-center bg-bg-page/10 custom-scrollbar relative w-full">
            <div className="space-y-6 flex flex-col w-full lg:max-w-[70%]">
              {messages.map((m) => {
                const isUser = m.role === "user";
                return (
                  <div
                    key={m.id}
                    className={`flex items-start gap-4 max-w-[80%] ${
                      isUser ? "self-end flex-row-reverse" : "self-start"
                    }`}
                  >
                    <div
                      className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border shadow-md select-none ${
                        isUser
                          ? "text-primary-text border-primary/20 shadow-primary/5"
                          : "bg-bg-card text-secondary-text border-divider/50"
                      }`}
                    >
                      {isUser ? (
                        <img
                          src={session?.user?.image}
                          alt=""
                          className="w-8 h-8 rounded-full border border-divider/50 shadow-md shrink-0"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                          {activeChat?.character?.profileUrl ||
                          (activeChat?.character?.avatar?.length > 2 &&
                            activeChat?.character?.avatar?.startsWith(
                              "http",
                            )) ? (
                            <img
                              src={
                                activeChat?.character?.profileUrl ||
                                activeChat?.character?.avatar
                              }
                              alt="avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            activeChat?.character?.avatar || "🤖"
                          )}
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div
                        className={`flex items-center gap-2 text-[10px] text-secondary-text ${
                          isUser ? "justify-end" : "justify-start"
                        }`}
                      >
                        <span className="font-semibold text-[10px]">
                          {isUser ? "You" : activeChat?.character.name || "AI"}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div
                        className={`px-3 py-2 rounded-lg text-sm leading-relaxed border backdrop-blur-sm shadow-md w-full ${
                          isUser
                            ? "bg-bg-card-hover/50 border border-divider/50 text-primary-text rounded rounded-tr-none shadow-sm"
                            : "bg-bg-card/75 border border-divider/50 text-primary-text rounded rounded-tl-none shadow-sm"
                        }`}
                      >
                        {m.imageUrl && (
                          <div className="mb-3 rounded overflow-hidden border border-zinc-800 bg-zinc-950/60 shadow-md group relative max-w-md transition-all duration-300 hover:shadow-blue-500/10">
                            <img
                              src={m.imageUrl}
                              alt="Attached Vision asset"
                              className="w-full max-h-72 object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition duration-305 flex items-end p-3">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-white bg-blue-500/95 px-2.5 py-1 rounded shadow-lg">
                                Attached Asset
                              </span>
                            </div>
                          </div>
                        )}
                        <div className="markdown-content space-y-2">
                          {renderMarkdown(m.content)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* TYPING LOADER STATUS */}
              {isTyping && (
                <div className="flex items-start gap-4 self-start">
                  <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center">
                    {activeChat?.character?.profileUrl ||
                    (activeChat?.character?.avatar?.length > 2 &&
                      activeChat?.character?.avatar?.startsWith("http")) ? (
                      <img
                        src={
                          activeChat?.character?.profileUrl ||
                          activeChat?.character?.avatar
                        }
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      activeChat?.character?.avatar || "🤖"
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1 text-[10px] text-zinc-500">
                      <span className="font-extrabold uppercase tracking-wide">
                        {activeChat?.character.name || "AI"}
                      </span>
                      <span>is typing...</span>
                    </div>
                    <div className="bg-zinc-900/40 border border-zinc-800/50 rounded rounded-tl-none p-4 flex gap-1.5 items-center justify-center h-10 w-16">
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={chatEndRef} />
          </div>

          {/* ADVANCED PARAMETERS CONFIG SIDE PANEL (SLIDES FROM RIGHT) */}
          <aside
            className={`w-80 bg-bg-card border-l border-divider/50 p-5 flex flex-col z-20 transition-all duration-300 select-none overflow-y-auto shrink-0 ${
              showConfig ? "mr-0" : "-mr-80 pointer-events-none hidden"
            }`}
          >
            <h3 className="font-black text-sm uppercase tracking-wider text-primary-text mb-6 flex items-center gap-2 pb-3 border-b border-divider/50">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span>Model Hyperparameters</span>
            </h3>

            <div className="space-y-6">
              {/* MODEL SELECT */}
              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-500 tracking-wider mb-2">
                  Active LLM Engine
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-bg-page border border-divider/50 rounded px-3 py-2.5 text-xs text-primary-text focus:outline-none focus:border-primary/80 cursor-pointer"
                >
                  <option value="google/gemini-2.5-flash">
                    Google Gemini 2.5 Flash (Standard - 1c)
                  </option>
                  <option value="openai/gpt-4o">
                    OpenAI GPT-4o (Premium - 10c)
                  </option>
                  <option value="deepseek/deepseek-r1">
                    DeepSeek R1 reasoning (Premium - 10c)
                  </option>
                  <option value="anthropic/claude-3.5-sonnet">
                    Anthropic Claude 3.5 Sonnet (Premium - 10c)
                  </option>
                </select>
                <span className="block text-[10px] text-zinc-500 mt-1.5 italic font-semibold">
                  Cost: {getCostRating()} credit{getCostRating() > 1 ? "s" : ""}{" "}
                  per message.
                </span>
              </div>

              {/* REASONING SWITCH */}
              <div className="flex items-center justify-between p-3 rounded bg-bg-page/40 border border-divider/50">
                <div>
                  <span className="block text-xs font-bold text-primary-text">
                    Deep Reasoning Mode
                  </span>
                  <span className="block text-[9px] text-secondary-text font-semibold mt-0.5">
                    Enables step-by-step thinking tracks.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reasoning}
                    onChange={(e) => setReasoning(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500 peer-checked:after:bg-white" />
                </label>
              </div>

              {/* TEMPERATURE */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                    Temperature (Creativity)
                  </label>
                  <span className="text-xs font-bold text-blue-400 font-mono">
                    {temperature}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="2.0"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-blue-500 cursor-ew-resize bg-zinc-800 h-1 rounded outline-none"
                />
                <div className="flex justify-between text-[8px] text-zinc-600 font-bold uppercase mt-1">
                  <span>Hard Logic (0.0)</span>
                  <span>Creative (2.0)</span>
                </div>
              </div>

              {/* MAX TOKENS */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                    Max Output Length
                  </label>
                  <span className="text-xs font-bold text-blue-400 font-mono">
                    {maxTokens}
                  </span>
                </div>
                <input
                  type="range"
                  min="256"
                  max="4096"
                  step="128"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-full accent-blue-500 cursor-ew-resize bg-zinc-800 h-1 rounded outline-none"
                />
                <div className="flex justify-between text-[8px] text-zinc-600 font-bold uppercase mt-1">
                  <span>Short (256)</span>
                  <span>Long (4096)</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-divider/50">
              <button
                onClick={() => {
                  setModel("openai/gpt-4o");
                  setTemperature(1.0);
                  setMaxTokens(2048);
                  setReasoning(false);
                }}
                className="w-full py-2.5 rounded border border-dashed border-divider/50 hover:border-divider text-secondary-text hover:text-primary-text font-bold text-xs tracking-wide transition cursor-pointer"
              >
                Reset Default Values
              </button>
            </div>
          </aside>
        </div>

        {/* INPUT FORM WITH EXPANDABLE CHATBOX AND IMAGES PLACEMENT */}
        <footer className="absolute bottom-0 left-0 w-full z-20 p-4">
          <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto">
            {/* UNIFIED SLEEK PILL INPUT FIELD */}
            <div
              className={`bg-bg-card border border-divider/50 focus-within:border-primary/50 transition-all duration-200 shadow-2xl relative flex flex-col gap-1.5 p-2 ${
                attachedImages.length > 0 || isUploading
                  ? "rounded-xl"
                  : "rounded-[24px]"
              }`}
            >
              {/* TOP IMAGE ROW (If images are attached) */}
              {(attachedImages.length > 0 || isUploading) && (
                <div className="flex flex-wrap gap-2 animate-fadeIn">
                  {attachedImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative w-14 h-14 rounded overflow-hidden border border-zinc-700 bg-zinc-950 shadow-inner group"
                    >
                      <img
                        src={img}
                        alt="Attachment thumbnail"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = attachedImages.filter(
                            (_, i) => i !== idx,
                          );
                          setAttachedImages(updated);
                          setAttachedImage(updated[0] || null);
                        }}
                        className="absolute top-1 right-1 p-0.5 bg-black/75 hover:bg-zinc-900 rounded-full text-zinc-400 hover:text-white transition duration-150 border border-zinc-800/80 shadow"
                        title="Remove image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {isUploading && (
                    <div className="w-14 h-14 rounded-lg border border-dashed border-zinc-700 bg-zinc-800/50 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                    </div>
                  )}
                </div>
              )}
              {/* SINGLE ROW CONTROLS (Plus, Textarea, Mic, Send) */}
              <div className="flex items-center gap-2 w-full">
                {/* LEFT ATTACHMENT CONTROLS */}
                <div className="relative shrink-0 flex items-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPlusMenu(!showPlusMenu)}
                    disabled={isUploading}
                    className={`h-8 w-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 hover:text-white flex items-center justify-center cursor-pointer transition shrink-0 shadow-sm border border-zinc-700/50 ${
                      showPlusMenu ? "bg-zinc-700/80 text-white" : ""
                    }`}
                    title="Attach Media"
                  >
                    <Plus
                      className={`w-4 h-4 transition-transform duration-200 ${showPlusMenu ? "rotate-45" : ""}`}
                    />
                  </button>

                  {/* POP-UP MENU (DROPDOWN) */}
                  {showPlusMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-40 cursor-default"
                        onClick={() => setShowPlusMenu(false)}
                      />
                      <div className="absolute bottom-11 left-0 bg-[#2f2f2f] border border-zinc-700/80 shadow-2xl rounded overflow-hidden w-44 z-50 flex flex-col animate-fadeIn select-none">
                        <button
                          type="button"
                          onClick={() => {
                            setShowPlusMenu(false);
                            fileInputRef.current?.click();
                          }}
                          className="flex items-center gap-3 px-3.5 py-2 hover:bg-blue-600 hover:text-white text-zinc-300 transition text-sm font-semibold text-left cursor-pointer group"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-4 h-4 text-zinc-400 group-hover:text-white transition"
                          >
                            <rect
                              width="18"
                              height="18"
                              x="3"
                              y="3"
                              rx="2"
                              ry="2"
                            />
                            <circle cx="9" cy="9" r="2" />
                            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                          </svg>
                          <span>Upload Image</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowPlusMenu(false);
                            toggleGallery();
                          }}
                          className="flex items-center gap-3 px-3.5 py-2 hover:bg-zinc-700 text-zinc-300 transition text-sm font-semibold text-left cursor-pointer group"
                        >
                          <History className="w-4 h-4 text-zinc-400 group-hover:text-white transition" />
                          <span className="flex-1">Recent files</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition"
                          >
                            <path d="m9 18 6-6-6-6" />
                          </svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>
                {/* MIDDLE TEXTAREA WRAPPER */}
                <div className="flex-1 relative min-h-[32px] flex items-center">
                  <textarea
                    value={inputMessage}
                    onChange={handleTextareaChange}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    placeholder="Ask anything"
                    rows={1}
                    className="w-full bg-transparent text-sm focus:outline-none text-zinc-100 placeholder-zinc-400 resize-none max-h-48 custom-scrollbar leading-relaxed"
                    style={{ height: "24px", minHeight: "24px" }}
                  />
                </div>
                {/* RIGHT AUDIO AND SEND BUTTONS */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="submit"
                    disabled={
                      (!inputMessage.trim() && attachedImages.length === 0) ||
                      isTyping
                    }
                    className={`h-8 w-8 rounded-full transition duration-200 flex items-center justify-center cursor-pointer shrink-0 ${
                      (!inputMessage.trim() && attachedImages.length === 0) ||
                      isTyping
                        ? "bg-zinc-700/50 text-zinc-500 cursor-not-allowed"
                        : "bg-emerald-500 hover:bg-emerald-400 text-white shadow-md active:scale-95"
                    }`}
                    title="Send message"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4 text-white"
                    >
                      <line x1="12" x2="12" y1="19" y2="5" />
                      <polyline points="5 12 12 5 19 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </form>
        </footer>
      </section>

      {/* ========================================================================= */}
      {/* 3. REUSE IMAGE GALLERY BOTTOM PANEL                                       */}
      {/* ========================================================================= */}
      {showGallery && (
        <div className="fixed right-0 top-0 bottom-0 w-80 bg-zinc-900 border-l border-zinc-800 p-5 z-40 shadow-2xl flex flex-col animate-slideLeft select-none">
          <div className="flex justify-between items-center mb-6 pb-3 border-b border-zinc-800">
            <h3 className="font-black text-sm uppercase tracking-wider text-zinc-300 flex items-center gap-2">
              <History className="w-4 h-4 text-blue-400" />
              <span>Cross-Chat Image Gallery</span>
            </h3>
            <button
              onClick={() => setShowGallery(false)}
              className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-zinc-500 font-semibold mb-4 leading-normal">
            Click any historically uploaded media asset below to attach it to
            your current message context instantly.
          </p>

          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {loadingGallery ? (
              <div className="h-40 flex items-center justify-center">
                <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
              </div>
            ) : galleryImages.length === 0 ? (
              <div className="h-48 border border-dashed border-zinc-800 rounded flex flex-col items-center justify-center p-4 text-center">
                <span className="text-2xl mb-2">🖼️</span>
                <span className="text-xs text-zinc-500 font-semibold">
                  No media logs recorded
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {galleryImages.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => selectGalleryImage(img.url)}
                    className="group aspect-square rounded overflow-hidden border border-zinc-800 hover:border-blue-500/80 transition-all duration-300 relative bg-black/40 hover:scale-[1.03]"
                  >
                    <img
                      src={img.url}
                      alt=""
                      className="w-full h-full object-cover group-hover:opacity-90 transition"
                    />
                    <div className="absolute inset-0 bg-blue-600/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition duration-200">
                      <span className="text-[10px] font-black uppercase text-white bg-black/75 px-2 py-0.5 rounded shadow">
                        Select
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
