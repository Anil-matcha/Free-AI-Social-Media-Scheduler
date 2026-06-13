"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import {
  FaDatabase, FaSpinner, FaPaperPlane, FaPlus,
  FaGlobe, FaFileAlt, FaKeyboard, FaTrashAlt, FaCode,
  FaInfoCircle, FaCoins, FaCheck, FaTimes, FaBook, FaPlusCircle, FaGoogle, FaCog
} from "react-icons/fa";
import clsx from "clsx";

const getKbGradient = (name, index = 0) => {
  const gradients = [
    "from-indigo-500 to-violet-500",
    "from-pink-500 to-rose-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
    "from-blue-500 to-indigo-500",
    "from-fuchsia-500 to-purple-500",
    "from-cyan-500 to-blue-500"
  ];
  if (!name) return gradients[index % gradients.length];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % gradients.length;
  return gradients[idx];
};

export default function WorkspacePage() {
  const { data: session, update: updateSession } = useSession();

  // Selected state
  const [kbs, setKbs] = useState([]);
  const [selectedKb, setSelectedKb] = useState(null);
  const [sources, setSources] = useState([]);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);

  // Toggles and inputs
  const [activeTab, setActiveTab] = useState("playground"); 
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState("google/gemini-2.5-flash");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState("sources");
  const [actionLoading, setActionLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Creation forms state
  const [newKbName, setNewKbName] = useState("");
  const [newKbDesc, setNewKbDesc] = useState("");
  const [scrapUrl, setScrapUrl] = useState("");
  const [scrapName, setScrapName] = useState("");
  const [qaQuestion, setQaQuestion] = useState("");
  const [qaAnswer, setQaAnswer] = useState("");
  const [docName, setDocName] = useState("");
  const [docContent, setDocContent] = useState("");

  // Chat message input
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (session?.user) {
      fetchKbs();
    } else {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (selectedKb) {
      fetchSources(selectedKb.id);
      fetchChats(selectedKb.id);
    } else {
      setSources([]);
      setChats([]);
      setSelectedChat(null);
      setMessages([]);
    }
  }, [selectedKb]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
    } else {
      setMessages([]);
    }
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchKbs = async () => {
    try {
      const res = await fetch("/api/kb");
      if (res.ok) {
        const data = await res.json();
        setKbs(data);
        if (data.length > 0 && !selectedKb) {
          setSelectedKb(data[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSources = async (kbId) => {
    try {
      const res = await fetch(`/api/kb/${kbId}/sources`);
      if (res.ok) {
        const data = await res.json();
        setSources(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchChats = async (kbId) => {
    try {
      const res = await fetch(`/api/kb/${kbId}/chat`);
      if (res.ok) {
        const data = await res.json();
        setChats(data);
        if (data.length > 0) {
          setSelectedChat(data[0]);
        } else {
          setSelectedChat(null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const res = await fetch(`/api/kb/${selectedKb.id}/chat/${chatId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateKb = async (e) => {
    e.preventDefault();
    if (!session?.user) { signIn("google"); return; }
    if (!newKbName.trim()) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/kb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKbName, description: newKbDesc })
      });

      if (res.ok) {
        const data = await res.json();
        setKbs([data, ...kbs]);
        setSelectedKb(data);
        setNewKbName("");
        setNewKbDesc("");
        setModalOpen(false);
        updateSession();
      } else if (res.status === 402) {
        alert("Insufficient credits. KB creation is Free!");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddSource = async (type) => {
    if (!session?.user) { signIn("google"); return; }
    if (!selectedKb) return;

    let payload = {};
    if (type === "url") {
      if (!scrapUrl.trim() || !scrapName.trim()) return;
      payload = {
        type: "url",
        name: scrapName.trim(),
        content: `Scraped website content from ${scrapUrl.trim()}. Key points: Customized database documentation index.`
      };
    } else if (type === "qa") {
      if (!qaQuestion.trim() || !qaAnswer.trim()) return;
      payload = {
        type: "qa",
        name: `Q&A: ${qaQuestion.substring(0, 30)}...`,
        content: `Question: ${qaQuestion.trim()}\nAnswer: ${qaAnswer.trim()}`
      };
    } else if (type === "file") {
      if (!docName.trim() || !docContent.trim()) return;
      payload = {
        type: "file",
        name: docName.trim(),
        content: docContent.trim()
      };
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/kb/${selectedKb.id}/sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setSources([data, ...sources]);
        // Reset forms
        setScrapUrl("");
        setScrapName("");
        setQaQuestion("");
        setQaAnswer("");
        setDocName("");
        setDocContent("");
        updateSession();
      } else if (res.status === 402) {
        alert("Insufficient credits. Data source training costs 10 credits.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSource = async (sourceId) => {
    if (!session?.user) { signIn("google"); return; }
    if (!confirm("Are you sure you want to delete this trained source?")) return;

    try {
      const res = await fetch(`/api/kb/${selectedKb.id}/sources?sourceId=${sourceId}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setSources(sources.filter(s => s.id !== sourceId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartNewChat = async () => {
    if (!session?.user) { signIn("google"); return; }
    if (!selectedKb) return;

    try {
      const res = await fetch(`/api/kb/${selectedKb.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: `Session on ${new Date().toLocaleDateString()}` })
      });

      if (res.ok) {
        const data = await res.json();
        setChats([data, ...chats]);
        setSelectedChat(data);
        setActiveTab("playground");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!session?.user) { signIn("google"); return; }
    if (!chatInput.trim() || !selectedKb) return;

    // Create session if missing
    let activeChatId = selectedChat?.id;
    if (!activeChatId) {
      try {
        const res = await fetch(`/api/kb/${selectedKb.id}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: `Auto session` })
        });
        if (res.ok) {
          const data = await res.json();
          setChats([data, ...chats]);
          setSelectedChat(data);
          activeChatId = data.id;
        } else {
          return;
        }
      } catch (err) {
        console.error(err);
        return;
      }
    }

    const inputMsg = chatInput;
    setChatInput("");
    setChatLoading(true);

    // Optimistic UI push
    const tempUserMsg = { id: "temp-user", role: "user", content: inputMsg, createdAt: new Date() };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch(`/api/kb/${selectedKb.id}/chat/${activeChatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: inputMsg, model: selectedModel })
      });

      if (res.ok) {
        const data = await res.json();
        // Remove temp messages and push resolved entities
        setMessages((prev) => prev.filter(m => m.id !== "temp-user").concat(data.userMessage, data.assistantMessage));
        updateSession();
      } else if (res.status === 402) {
        setMessages((prev) => prev.filter(m => m.id !== "temp-user"));
        alert("Insufficient credits. playground messages cost 2 credits.");
      } else {
        throw new Error("playground message processing failed.");
      }
    } catch (e) {
      console.error(e);
      setMessages((prev) => prev.filter(m => m.id !== "temp-user"));
      alert("AI failed to reply. Please review trained data sources.");
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 text-zinc-350">
        <FaSpinner className="animate-spin text-3xl text-indigo-500 mb-4" />
        <p className="text-sm font-medium">Loading workspace environment...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row md:overflow-hidden overflow-y-auto bg-zinc-950 text-zinc-100 font-sans">
      
      {/* ─── LEFT SIDEBAR: KNOWLEDGE BASES ──────────────────────────────────────── */}
      <div className="w-full md:w-[290px] border-r border-zinc-800/80 bg-zinc-950/45 backdrop-blur-xl flex flex-col md:overflow-y-auto overflow-visible flex-shrink-0 z-20">
        <div className="p-4.5 border-b border-zinc-800/60 bg-zinc-950/60 flex items-center justify-between flex-shrink-0">
          <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest font-heading">AI Knowledge Bases</span>
          <button
            onClick={() => setModalOpen(true)}
            className="p-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-bold transition-all duration-300 cursor-pointer shadow-md shadow-indigo-500/10 hover:scale-105 active:scale-95 border border-indigo-400/20"
            title="Create new base"
          >
            <FaPlus />
          </button>
        </div>

        <div className="p-3.5 space-y-2.5 flex-1 overflow-y-auto">
          {kbs.length === 0 ? (
            <div className="p-5 rounded-2xl border border-zinc-800/60 bg-zinc-900/10 text-center backdrop-blur-sm">
              <FaDatabase className="text-zinc-600 text-xl mx-auto mb-2.5 animate-pulse" />
              <p className="text-[11px] text-zinc-400 font-bold">No bases found.</p>
              <button
                onClick={() => setModalOpen(true)}
                className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-black text-indigo-400 hover:text-white transition-colors"
              >
                <FaPlusCircle /> Create First Base
              </button>
            </div>
          ) : (
            kbs.map((kb, idx) => {
              const isSelected = selectedKb?.id === kb.id;
              const gradientClass = getKbGradient(kb.name, idx);
              return (
                <button
                  key={kb.id}
                  onClick={() => setSelectedKb(kb)}
                  className={clsx(
                    "w-full text-left p-3 rounded-xl border transition-all duration-300 cursor-pointer flex items-center gap-3.5 relative overflow-hidden group",
                    isSelected
                      ? "bg-gradient-to-tr from-indigo-500/10 to-violet-500/10 border-indigo-500/40 text-white shadow-xl shadow-indigo-500/5 scale-[1.02]"
                      : "border-zinc-800/60 bg-zinc-900/10 text-zinc-350 hover:border-zinc-700 hover:bg-zinc-900/30 hover:scale-[1.01]"
                  )}
                >
                  {/* Glowing vertical pill for selected state */}
                  {isSelected && (
                    <span className="absolute left-0 top-3 bottom-3 w-1 bg-gradient-to-b from-indigo-400 to-violet-500 rounded-r-md" />
                  )}
                  
                  {/* Dynamic gradient avatar */}
                  <div className={clsx(
                    "w-8.5 h-8.5 rounded-xl bg-gradient-to-tr flex items-center justify-center text-white text-[11px] font-black shadow flex-shrink-0 select-none transition-transform duration-300 group-hover:scale-105",
                    gradientClass
                  )}>
                    {kb.name.substring(0, 2).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-grow">
                    <div className={clsx(
                      "text-xs font-black truncate tracking-tight transition-colors leading-normal",
                      isSelected ? "text-white" : "text-zinc-200 group-hover:text-white"
                    )}>
                      {kb.name}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1 h-1 rounded-full bg-indigo-500/60" />
                      <span className="text-[9px] text-zinc-450 font-bold tracking-tight">
                        {kb.sources?.length || 0} trained sources
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Cyber Billing Console Info Footer */}
        <div className="p-4.5 border-t border-zinc-800/50 bg-zinc-950/60 flex-shrink-0">
          <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 p-3.5 rounded-2xl shadow-inner relative overflow-hidden group">
            {/* Ambient subtle backglow in the widget */}
            <span className="absolute -right-6 -bottom-6 w-16 h-16 rounded-full bg-indigo-500/5 blur-xl group-hover:bg-indigo-500/10 transition-all duration-300" />
            
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 rounded bg-indigo-550/15 text-indigo-400 text-[10px]">
                <FaCoins className="animate-pulse" />
              </div>
              <span className="text-[9.5px] font-black uppercase text-white tracking-widest font-heading">
                Workspace Rates
              </span>
            </div>

            <div className="space-y-1.5 text-[9.5px] text-zinc-400 font-medium">
              <div className="flex justify-between items-center bg-zinc-950/20 p-1.5 rounded-lg border border-zinc-850/50">
                <span className="text-zinc-400">Forge Character</span>
                <span className="text-indigo-400 font-black">Free</span>
              </div>
              <div className="flex justify-between items-center bg-zinc-950/20 p-1.5 rounded-lg border border-zinc-850/50">
                <span className="text-zinc-400">Train Context</span>
                <span className="text-violet-400 font-black">10 cr</span>
              </div>
              <div className="flex justify-between items-center bg-zinc-950/20 p-1.5 rounded-lg border border-zinc-850/50">
                <span className="text-zinc-400">Playground Query</span>
                <span className="text-pink-400 font-black">2 cr</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── RIGHT CONTAINER: IMMERSIVE CHARACTER CHAT WORKSPACE ─────────────────── */}
      <div 
        className="flex-grow flex flex-col md:overflow-hidden bg-[#060608] relative bg-cyber-grid"
      >
        {/* Glow ambient spots */}
        <div className="absolute top-[10%] right-[15%] w-[380px] h-[380px] rounded-full bg-indigo-500/5 blur-[130px] pointer-events-none animate-pulse-glow-1" />
        <div className="absolute bottom-[20%] left-[20%] w-[320px] h-[320px] rounded-full bg-violet-500/5 blur-[110px] pointer-events-none animate-pulse-glow-2" />
        
        {/* Character.ai Custom Toolbar Header */}
        {selectedKb && (
          <div className="px-6 py-4 border-b border-zinc-800/60 bg-zinc-950/45 backdrop-blur-xl flex flex-row items-center justify-between gap-4 flex-shrink-0 shadow-lg shadow-black/10 z-10">
            {/* Left side: Character Profile and Creator details */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-650 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-indigo-500/15 select-none border border-indigo-400/20">
                  {selectedKb.name.substring(0, 2).toUpperCase()}
                </div>
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#060608] animate-pulse-ring" title="Ready & Trained" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black text-white truncate tracking-tight font-heading">{selectedKb.name}</h2>
                </div>
                <p className="text-[10px] text-zinc-400 truncate leading-snug mt-0.5">
                  Created by <span className="text-zinc-300 font-bold">@{session?.user?.email?.split('@')[0] || "guest"}</span> • {sources.length} trained contexts
                </p>
              </div>
            </div>

            {/* Right side: Model Dropdown & Action buttons */}
            <div className="flex items-center gap-2.5">
              {/* Model Dropdown */}
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 rounded-lg px-2.5 py-2 text-[10px] font-black text-zinc-300 focus:outline-none focus:border-indigo-500/40 transition-all cursor-pointer shadow-sm"
              >
                <option value="google/gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="google/gemini-1.5-pro">Gemini 1.5 Pro</option>
                <option value="openai/gpt-4o">GPT-4o (Premium)</option>
                <option value="anthropic/claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                <option value="meta-llama/llama-3.1-70b-instruct">Llama 3.1 70B</option>
              </select>

              {/* Slider Gear button to manage character details */}
              <button
                onClick={() => { setSettingsTab("sources"); setSettingsOpen(true); }}
                className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-350 hover:text-white hover:bg-zinc-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                title="Manage Character Context & Share"
              >
                <FaCog className="text-[11px]" />
                <span className="hidden sm:inline">Settings</span>
              </button>

              {/* Clear Thread button */}
              <button
                onClick={handleStartNewChat}
                className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-355 hover:text-red-400 hover:bg-zinc-800 text-xs font-bold transition-all cursor-pointer shadow-sm"
                title="Wipe conversation thread history"
              >
                <FaTrashAlt className="text-[10px]" />
              </button>
            </div>
          </div>
        )}

        {/* Main Tab Panels content container - Immersive stream view */}
        <div className="flex-1 flex flex-col md:overflow-hidden bg-transparent z-10">
          {!selectedKb ? (
            <div className="h-full flex-1 flex flex-col items-center justify-center text-center p-8 bg-zinc-950/20 text-zinc-355">
              <FaBook className="text-4xl text-zinc-650 animate-bounce mb-3" />
              <p className="text-sm font-bold text-white font-heading">No character selected</p>
              <p className="text-xs text-zinc-550 mt-1.5 max-w-xs font-medium leading-relaxed">Select a character base from the left side panel or forge a customized workspace!</p>
            </div>
          ) : (
            /* Immersive Chat Session View */
            <div className="flex-1 flex flex-col justify-between overflow-hidden relative">
              
              {/* dialogues content area - full scroll height */}
              <div className="flex-grow overflow-y-auto px-5 py-8 space-y-8">
                {messages.length === 0 ? (
                  /* Elegant Intro Card at the very center */
                  <div className="flex flex-col items-center justify-center text-center py-12 px-6 max-w-lg mx-auto my-auto bg-zinc-950/50 border border-zinc-850/40 backdrop-blur-md p-8 rounded-3xl shadow-2xl shadow-indigo-500/5 animate-slide-up">
                    <div className="relative mb-4.5">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-650 flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-indigo-500/25 select-none transition-transform duration-500 hover:rotate-6">
                        {selectedKb.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-4 border-[#060608] animate-pulse-ring" />
                    </div>
                    <h3 className="text-lg font-black text-white font-heading">{selectedKb.name}</h3>
                    <p className="text-[10px] text-zinc-450 font-bold tracking-wider uppercase mt-1">
                      Created by @{session?.user?.email?.split('@')[0] || "guest"}
                    </p>
                    <p className="text-xs text-zinc-300 mt-4 max-w-sm italic leading-relaxed border-l-2 border-indigo-500/30 pl-4 py-1.5 text-left">
                      "{selectedKb.description || "I am your custom RAG knowledge assistant. Ask me anything!"}"
                    </p>
                    
                    {/* Character quick specs */}
                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                      <span className="bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 rounded-full text-[9px] font-bold text-zinc-400 flex items-center gap-1.5 shadow-sm">
                        <FaDatabase className="text-[8px] text-indigo-400 animate-pulse" /> {sources.length} sources trained
                      </span>
                      <span className="bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 rounded-full text-[9px] font-bold text-zinc-400 flex items-center gap-1.5 shadow-sm">
                        <FaCoins className="text-[8px] text-pink-400" /> 2 credits per query
                      </span>
                    </div>

                    {/* Interactive suggestions helper deck */}
                    <div className="w-full border-t border-zinc-900 mt-8 pt-6">
                      <p className="text-[9px] font-black uppercase text-zinc-400 tracking-widest text-center mb-3">
                        Suggested Starters
                      </p>
                      <div className="grid grid-cols-1 gap-2.5 text-left">
                        {[
                          "Explain key insights inside the trained sources 📊",
                          "Analyze the trained documentation and summarize 🔍",
                          "Synthesize a quick semantic matching Q&A session 💡"
                        ].map((suggestion, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() => setChatInput(suggestion)}
                            className="w-full text-left p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-indigo-500/40 hover:bg-zinc-900 text-xs text-zinc-300 hover:text-white transition-all duration-300 cursor-pointer shadow-sm hover:scale-[1.01] active:scale-[0.99] font-medium"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 max-w-4xl mx-auto w-full pb-6">
                    {messages.map((msg, idx) => {
                      const isUser = msg.role === "user";
                      return (
                        <div key={msg.id || idx} className="w-full animate-slide-up">
                          {isUser ? (
                            /* User message: Translucent indigo/violet gradient speech bubble right-aligned */
                            <div className="flex items-start justify-end gap-3.5 max-w-3xl ml-auto w-full">
                              <div className="flex flex-col items-end">
                                <span className="text-[9.5px] text-zinc-400 font-bold mb-1 mr-1">{session?.user?.name || "You"}</span>
                                <div className="bg-gradient-to-tr from-indigo-600/20 to-violet-600/20 border border-indigo-500/30 text-white rounded-2xl rounded-tr-none px-4.5 py-3 text-xs leading-relaxed max-w-xl shadow-[0_0_15px_rgba(99,102,241,0.08)] whitespace-pre-wrap">
                                  {msg.content}
                                </div>
                                <span className="text-[8px] text-zinc-550 mt-1 mr-1">
                                  {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                                </span>
                              </div>
                              <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white text-[10px] font-black shadow-md flex-shrink-0 select-none border border-indigo-400/20">
                                {session?.user?.name ? session.user.name.substring(0, 2).toUpperCase() : "US"}
                              </div>
                            </div>
                          ) : (
                            /* Assistant message: Translucent dark gray speech bubble left-aligned */
                            <div className="flex items-start justify-start gap-3.5 max-w-3xl mr-auto w-full font-sans">
                              <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-650 flex items-center justify-center text-white text-[10px] font-black shadow-md flex-shrink-0 select-none border border-indigo-400/30">
                                {selectedKb.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="flex flex-col items-start min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 mb-1 ml-1">
                                  <span className="text-xs font-black text-white font-heading">{selectedKb.name}</span>
                                </div>
                                <div className="bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-md text-zinc-150 rounded-2xl rounded-tl-none px-5 py-4 text-xs leading-relaxed max-w-xl shadow-xl min-w-0 w-full">
                                  
                                  {/* Smart Responsive Inline Image Parser */}
                                  {(() => {
                                    const imgRegex = /(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp)(?:\?.*)?)/i;
                                    const match = msg.content.match(imgRegex);
                                    if (match) {
                                      const imgUrl = match[1];
                                      const cleanText = msg.content.replace(imgUrl, "").trim();
                                      return (
                                        <div className="space-y-3.5">
                                          {cleanText && <p className="leading-relaxed whitespace-pre-wrap">{cleanText}</p>}
                                          <div className="relative rounded-2xl overflow-hidden border border-zinc-800/85 bg-zinc-950/60 shadow-2xl group max-w-sm mt-1 transition-all duration-300 hover:scale-[1.01]">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={imgUrl} alt="Attachment visual representation" className="w-full max-h-[240px] object-cover transition-transform duration-500 group-hover:scale-105" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                                              <a href={imgUrl} target="_blank" rel="noopener noreferrer" className="text-[8px] font-black uppercase tracking-widest text-zinc-200 hover:text-white bg-zinc-905/75 backdrop-blur px-2.5 py-1.5 rounded-lg border border-zinc-800">
                                                View original media
                                              </a>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    }
                                    return <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>;
                                  })()}
                                  
                                  {/* Citations Accordion overhauled into visual grid card deck */}
                                  {msg.citations && JSON.parse(msg.citations).length > 0 && (
                                    <div className="mt-4 border-t border-zinc-800/50 pt-3.5">
                                      <details className="group cursor-pointer">
                                        <summary className="text-[8px] font-black uppercase tracking-widest text-indigo-400 select-none list-none flex items-center gap-1.5 group-open:mb-3 hover:text-indigo-300 transition-colors">
                                          <span>📚 Trained Citation References ({JSON.parse(msg.citations).length})</span>
                                        </summary>
                                        <div className="grid grid-cols-1 gap-2.5 mt-2.5 animate-in fade-in duration-200">
                                          {JSON.parse(msg.citations).map((cit) => (
                                            <div key={cit.id} className="bg-zinc-950/50 backdrop-blur-sm border border-zinc-800/80 rounded-xl p-3 text-[9.5px] text-zinc-300 leading-relaxed font-medium shadow-inner flex gap-2.5 items-start hover:border-indigo-500/25 transition-colors">
                                              <span className="p-1.5 rounded bg-indigo-950/50 border border-indigo-900/30 text-indigo-400 flex-shrink-0 mt-0.5 select-none font-bold text-[8px] uppercase tracking-wider">
                                                {cit.type}
                                              </span>
                                              <div className="min-w-0">
                                                <div className="text-[10px] font-black text-white truncate">{cit.name}</div>
                                                <p className="text-[8.5px] text-zinc-450 italic mt-1 leading-normal border-l-2 border-zinc-800 pl-2.5">
                                                  "{cit.snippet}"
                                                </p>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </details>
                                    </div>
                                  )}
                                </div>
                                <span className="text-[8px] text-zinc-550 mt-1 ml-1">
                                  {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* thinking loading state inside main chat column wrapper */}
                    {chatLoading && (
                      <div className="max-w-3xl mr-auto w-full p-2.5 flex items-start gap-3.5 animate-slide-up">
                        <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-650 flex items-center justify-center text-white text-[10px] font-black shadow-md flex-shrink-0 select-none border border-indigo-400/30">
                          {selectedKb.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col items-start min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-1 ml-1">
                            <span className="text-xs font-black text-white font-heading">{selectedKb.name}</span>
                          </div>
                          <div className="bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-md rounded-2xl rounded-tl-none px-4.5 py-3 text-xs text-zinc-400 flex items-center gap-2 shadow-xl">
                            {/* Elegant Pulsing Dots Loader */}
                            <div className="flex gap-1.5 py-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce duration-500 delay-0" />
                              <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce duration-500 delay-150" />
                              <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-bounce duration-500 delay-300" />
                            </div>
                            <span className="text-[10px] font-bold text-zinc-400 ml-1 font-sans">Thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message inputs bottom bar - floating pill style centered */}
              <div className="absolute bottom-0 flex flex-col gap-2 w-full bg-gradient-to-t from-[#060608] via-[#060608] to-transparent pt-4 space-y-4 flex-shrink-0 z-10">
                <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto w-full px-4 space-y-2">
                  <div className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800/80 backdrop-blur-xl rounded-full px-5 py-4 focus-within:border-indigo-500/50 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all shadow-2xl shadow-indigo-500/5 relative">
                    <input
                      type="text"
                      placeholder={`Message ${selectedKb.name}...`}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      disabled={chatLoading}
                      className="flex-grow bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none font-medium pr-12"
                    />
                    <button
                      type="submit"
                      disabled={chatLoading || !chatInput.trim()}
                      className="absolute right-3 p-2 bg-gradient-to-r from-indigo-500 to-violet-650 hover:from-indigo-600 hover:to-violet-700 text-white rounded-full transition-all cursor-pointer disabled:opacity-30 flex items-center justify-center flex-shrink-0 shadow active:scale-95 border border-indigo-400/20"
                      title="Send message"
                    >
                      <FaPaperPlane className="text-[9px]" />
                    </button>
                  </div>
                  <div className="text-center text-[9px] text-zinc-550 font-medium">
                    2 Credits per turn • Running {selectedModel.split("/")[1] || selectedModel} Model
                  </div>
                </form>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* ─── CHARACTER SETTINGS MODAL DIALOG ────────────────────────────────────── */}
      {settingsOpen && selectedKb && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-zinc-950/85 border border-zinc-800/80 rounded-3xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-300 backdrop-blur-2xl">
            {/* Modal Ambient Glow Blob */}
            <span className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-indigo-550/10 blur-[80px] pointer-events-none" />

            {/* Modal Header */}
            <div className="px-6 py-5.5 border-b border-zinc-850/60 flex items-center justify-between bg-zinc-950/85 z-10">
              <div>
                <h3 className="text-base font-black font-heading text-white flex items-center gap-2">
                  <FaCog className="text-indigo-400 animate-spin duration-1000" style={{ animationDuration: '6s' }} />
                  <span>Character Context Resources & API: {selectedKb.name}</span>
                </h3>
                <p className="text-[11px] text-zinc-450 mt-0.5">Train data semantic contexts and configure widget integration embeds.</p>
              </div>
              <button
                onClick={() => setSettingsOpen(false)}
                className="p-2 rounded-xl text-zinc-450 hover:text-white hover:bg-zinc-900 transition-all cursor-pointer border border-transparent hover:border-zinc-800"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Internal Tabs */}
            <div className="flex border-b border-zinc-850/40 bg-zinc-950/40 px-6 py-3 gap-2.5 z-10">
              <button
                onClick={() => setSettingsTab("sources")}
                className={clsx(
                  "px-4.5 py-2.5 rounded-xl text-xs font-black transition-all duration-300 cursor-pointer flex items-center gap-2",
                  settingsTab === "sources" 
                    ? "bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/35 text-white shadow-md shadow-indigo-500/5 animate-fade-in" 
                    : "text-zinc-400 hover:text-zinc-200 border border-transparent hover:bg-zinc-900/50"
                )}
              >
                <FaDatabase className="text-indigo-400 text-[10px]" />
                Trained Context ({sources.length})
              </button>
              <button
                onClick={() => setSettingsTab("integrations")}
                className={clsx(
                  "px-4.5 py-2.5 rounded-xl text-xs font-black transition-all duration-300 cursor-pointer flex items-center gap-2",
                  settingsTab === "integrations" 
                    ? "bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/35 text-white shadow-md shadow-indigo-500/5 animate-fade-in" 
                    : "text-zinc-400 hover:text-zinc-200 border border-transparent hover:bg-zinc-900/50"
                )}
              >
                <FaCode className="text-violet-400 text-[10px]" />
                Share & Embed API
              </button>
            </div>

            {/* Modal Content Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-zinc-950/20 z-10">
              {settingsTab === "sources" ? (
                /* SOURCES MODAL CONTENT */
                <div className="space-y-6">
                  {/* forms to train */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* QA custom text */}
                    <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden group">
                      <div>
                        <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest flex items-center gap-1.5 mb-3.5">
                          <FaKeyboard className="text-[10px]" /> Add custom Q&A
                        </span>
                        <input
                          type="text"
                          placeholder="Prompt Question..."
                          value={qaQuestion}
                          onChange={(e) => setQaQuestion(e.target.value)}
                          className="w-full bg-zinc-950/50 border border-zinc-800/85 focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/5 rounded-lg px-2.5 py-2.5 text-xs text-white placeholder-zinc-500 mb-2.5 focus:outline-none font-medium transition-all"
                        />
                        <textarea
                          placeholder="Knowledge base answer text..."
                          value={qaAnswer}
                          onChange={(e) => setQaAnswer(e.target.value)}
                          rows={2.5}
                          className="w-full bg-zinc-950/50 border border-zinc-800/85 focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/5 rounded-lg px-2.5 py-2.5 text-xs text-white placeholder-zinc-500 resize-none focus:outline-none font-medium transition-all"
                        />
                      </div>
                      <button
                        onClick={() => handleAddSource("qa")}
                        disabled={actionLoading || !qaQuestion.trim() || !qaAnswer.trim()}
                        className="mt-4.5 w-full py-2 bg-gradient-to-r from-indigo-500 to-indigo-650 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-lg text-[10px] font-black transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none active:scale-[0.98] shadow-md shadow-indigo-500/10 border border-indigo-400/20"
                      >
                        Train Q&A (10 Credits)
                      </button>
                    </div>

                    {/* Scrap web page */}
                    <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden group">
                      <div>
                        <span className="text-[9px] font-black uppercase text-violet-400 tracking-widest flex items-center gap-1.5 mb-3.5">
                          <FaGlobe className="text-[10px]" /> Scrap web link
                        </span>
                        <input
                          type="text"
                          placeholder="Source Title..."
                          value={scrapName}
                          onChange={(e) => setScrapName(e.target.value)}
                          className="w-full bg-zinc-950/50 border border-zinc-800/85 focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/5 rounded-lg px-2.5 py-2.5 text-xs text-white placeholder-zinc-500 mb-2.5 focus:outline-none font-medium transition-all"
                        />
                        <input
                          type="url"
                          placeholder="https://example.com/docs"
                          value={scrapUrl}
                          onChange={(e) => setScrapUrl(e.target.value)}
                          className="w-full bg-zinc-950/50 border border-zinc-800/85 focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/5 rounded-lg px-2.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none font-medium transition-all"
                        />
                      </div>
                      <button
                        onClick={() => handleAddSource("url")}
                        disabled={actionLoading || !scrapUrl.trim() || !scrapName.trim()}
                        className="mt-4.5 w-full py-2 bg-gradient-to-r from-indigo-500 to-indigo-650 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-lg text-[10px] font-black transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none active:scale-[0.98] shadow-md shadow-indigo-500/10 border border-indigo-400/20"
                      >
                        Scrap URL (10 Credits)
                      </button>
                    </div>

                    {/* Document builder */}
                    <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden group">
                      <div>
                        <span className="text-[9px] font-black uppercase text-pink-400 tracking-widest flex items-center gap-1.5 mb-3.5">
                          <FaFileAlt className="text-[10px]" /> Train custom text
                        </span>
                        <input
                          type="text"
                          placeholder="Document Name..."
                          value={docName}
                          onChange={(e) => setDocName(e.target.value)}
                          className="w-full bg-zinc-955 border border-zinc-800/85 focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/5 rounded-lg px-2.5 py-2.5 text-xs text-white placeholder-zinc-500 mb-2.5 focus:outline-none font-medium transition-all"
                        />
                        <textarea
                          placeholder="Type or paste custom raw documentation content..."
                          value={docContent}
                          onChange={(e) => setDocContent(e.target.value)}
                          rows={2.5}
                          className="w-full bg-zinc-950/50 border border-zinc-800/85 focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/5 rounded-lg px-2.5 py-2.5 text-xs text-white placeholder-zinc-500 resize-none focus:outline-none font-medium transition-all"
                        />
                      </div>
                      <button
                        onClick={() => handleAddSource("file")}
                        disabled={actionLoading || !docName.trim() || !docContent.trim()}
                        className="mt-4.5 w-full py-2 bg-gradient-to-r from-indigo-500 to-indigo-650 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-lg text-[10px] font-black transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none active:scale-[0.98] shadow-md shadow-indigo-500/10 border border-indigo-400/20"
                      >
                        Train File (10 Credits)
                      </button>
                    </div>
                  </div>

                  {/* sources lists table */}
                  <div className="pt-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3.5 font-heading">Trained Data Sources</h4>
                    {sources.length === 0 ? (
                      <div className="p-8 border border-zinc-800/80 rounded-2xl bg-zinc-900/5 text-center backdrop-blur-sm">
                        <FaDatabase className="text-zinc-600 text-2xl mb-2.5 mx-auto animate-pulse" />
                        <p className="text-xs text-zinc-300 font-bold">No active resources trained yet</p>
                        <p className="text-[9.5px] text-zinc-500 mt-1 max-w-xs mx-auto leading-relaxed">Forge documents or scrap links above to synchronize semantic data contexts!</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[280px] overflow-y-auto pr-1.5">
                        {sources.map((src) => (
                          <div key={src.id} className="bg-zinc-900/35 border border-zinc-800/70 hover:border-zinc-700 rounded-xl p-3 flex items-start justify-between gap-3 shadow-inner transition-colors">
                            <div className="min-w-0 flex gap-2.5 items-start">
                              <span className="p-2 rounded bg-zinc-950 border border-zinc-800 text-indigo-400 mt-0.5 flex-shrink-0 select-none text-[9px] font-black uppercase tracking-wider scale-95">
                                {src.type}
                              </span>
                              <div className="min-w-0">
                                <div className="text-[11px] font-black truncate text-white leading-normal">{src.name}</div>
                                <div className="text-[9px] text-zinc-450 leading-snug mt-1 max-w-[240px] line-clamp-2 italic">
                                  "{src.content}"
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteSource(src.id)}
                              className="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-red-950/20 transition-all cursor-pointer flex-shrink-0 border border-transparent hover:border-red-900/30"
                              title="Delete source"
                            >
                              <FaTrashAlt className="text-[9px]" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* INTEGRATIONS MODAL CONTENT */
                <div className="space-y-5 max-w-2xl mx-auto py-3">
                  {/* Embed code snippet */}
                  <div className="bg-zinc-900/30 border border-zinc-800/80 p-5 rounded-2xl relative overflow-hidden group shadow-inner">
                    <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-indigo-500/5 blur-xl pointer-events-none" />
                    <h4 className="text-xs font-black font-heading text-white flex items-center gap-1.5">
                      <FaCode className="text-indigo-400 text-[11px]" /> Web chat embed widget
                    </h4>
                    <p className="text-[10px] text-zinc-350 mt-1.5 leading-relaxed">
                      Embed Einstein context matches directly into external sites or HTML products. Copy and paste the script snippet:
                    </p>
                    <div className="mt-3.5 p-4 rounded-xl bg-zinc-950 border border-zinc-850/80 text-[9.5px] text-zinc-300 font-mono overflow-x-auto whitespace-pre leading-relaxed shadow-2xl relative group-hover:border-zinc-700 transition-colors">
                      {`<script 
  src="https://easysite.ai/ezsite-chatbot.js"
  kb-id="${selectedKb.id}"
  theme="dark"
  defer>
</script>`}
                    </div>
                  </div>

                  {/* API configurations block */}
                  <div className="bg-zinc-900/30 border border-zinc-800/80 p-5 rounded-2xl relative overflow-hidden shadow-inner">
                    <h4 className="text-xs font-black font-heading text-white flex items-center gap-1.5">
                      <FaDatabase className="text-violet-400 text-[11px]" /> Programmatic API Access
                    </h4>
                    <p className="text-[10px] text-zinc-355 mt-1.5 leading-relaxed">
                      Programmatically query this character's semantic contexts from node backend pipelines:
                    </p>
                    <div className="mt-3.5 space-y-2.5 font-mono text-[9px]">
                      <div className="flex justify-between items-center bg-zinc-950 border border-zinc-850 p-2.5 rounded-lg">
                        <span className="text-zinc-550 font-bold">ENDPOINT_URL:</span>
                        <span className="text-indigo-400 select-all font-medium">https://api.muapi.ai/api/v1/kb/{selectedKb.id}/query</span>
                      </div>
                      <div className="flex justify-between items-center bg-zinc-950 border border-zinc-850 p-2.5 rounded-lg">
                        <span className="text-zinc-550 font-bold">ACCESS_ID:</span>
                        <span className="text-violet-400 select-all font-medium">{selectedKb.id}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4.5 border-t border-zinc-850 flex justify-end bg-zinc-950/85 z-10">
              <button
                onClick={() => setSettingsOpen(false)}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-650 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-black rounded-xl cursor-pointer transition-all active:scale-[0.98] border border-indigo-400/20 shadow-md shadow-indigo-500/10"
              >
                Close Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CREATION MODAL OVERLAY ────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <form onSubmit={handleCreateKb} className="bg-zinc-950/80 border border-zinc-800/80 rounded-3xl max-w-md w-full p-6.5 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-300 backdrop-blur-2xl">
            {/* Ambient Background Glow in Modal */}
            <span className="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-violet-650/10 blur-[60px]" />
            
            <h3 className="text-base font-black font-heading text-white mb-1.5 flex items-center gap-2">
              <FaPlusCircle className="text-indigo-400 animate-pulse" /> Forge Character Base
            </h3>
            <p className="text-[11px] text-zinc-350 leading-normal mb-5.5">
              Set up a custom RAG character chatbot. Creation is <strong className="text-indigo-400 font-black">Free</strong> live.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[9px] font-black uppercase text-zinc-400 tracking-wider mb-2 font-heading">Character Name</label>
                <input
                  type="text"
                  placeholder="e.g. Einstein Bot or Sales Guide"
                  value={newKbName}
                  onChange={(e) => setNewKbName(e.target.value)}
                  className="w-full bg-zinc-900/40 border border-zinc-800/85 focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/5 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none font-medium transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[9px] font-black uppercase text-zinc-400 tracking-wider mb-2 font-heading">Greeting / Description (Optional)</label>
                <textarea
                  placeholder="Summarize the character greeting introduction or guidelines..."
                  value={newKbDesc}
                  onChange={(e) => setNewKbDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-zinc-900/40 border border-zinc-800/85 focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/5 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-550 resize-none focus:outline-none font-medium transition-all"
                />
              </div>
            </div>

            <div className="mt-7 flex justify-end gap-2 text-xs font-black">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4.5 py-2.5 bg-zinc-900 border border-zinc-805 text-zinc-350 hover:text-white rounded-xl cursor-pointer transition-all hover:bg-zinc-850"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading || !newKbName.trim()}
                className="px-4.5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-750 text-white rounded-xl cursor-pointer transition-all flex items-center gap-2 shadow-md shadow-indigo-500/10 active:scale-[0.98] border border-indigo-400/20 disabled:opacity-30 disabled:pointer-events-none"
              >
                {actionLoading ? <FaSpinner className="animate-spin" /> : "Forge Character (Free)"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
