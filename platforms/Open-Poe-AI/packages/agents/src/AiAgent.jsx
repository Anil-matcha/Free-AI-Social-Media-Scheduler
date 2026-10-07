"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { IoSend, IoChevronBack, IoColorPalette, IoAdd, IoHeart, IoHeartOutline, IoChatbubbleEllipsesSharp } from "react-icons/io5";
import { HiLightBulb } from "react-icons/hi2";
import { MdTerminal, MdPerson, MdClose, MdEdit, MdContentCopy, MdCheck, MdFullscreen, MdFileDownload, MdImage } from "react-icons/md";
import { RiRobot2Fill } from "react-icons/ri";
import { HiOutlinePencilAlt } from "react-icons/hi";
import { BiLoaderAlt } from "react-icons/bi";
import { VscDebugAlt } from "react-icons/vsc";
import { themes } from "./components/themes";
import { FaAngleRight } from "react-icons/fa6";

const BASE_URL = "/api/agents"; // "https://api.muapi.ai/agents";

const formatMessageTime = (date) => {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
};

const getDateHeader = (date) => {
  const d = new Date(date);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (d.toDateString() === now.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
};

const parseMessageContent = (text) => {
  if (!text) return [];
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = urlRegex.exec(text)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    const url = match[0];

    if (start > lastIndex) {
      parts.push({ type: "text", content: text.substring(lastIndex, start) });
    }

    const cleanUrl = url.split("?")[0].toLowerCase();
    const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(cleanUrl);
    const isVideo = /\.(mp4|webm|mov|ogg)$/i.test(cleanUrl);
    const isAudio = /\.(mp3|wav|mpeg)$/i.test(cleanUrl);

    if (isImage) {
      parts.push({ type: "image", url });
    } else if (isVideo) {
      parts.push({ type: "video", url });
    } else if (isAudio) {
      parts.push({ type: "audio", url });
    } else {
      parts.push({ type: "text", content: url });
    }

    lastIndex = end;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.substring(lastIndex) });
  }

  return parts;
};

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-lg border transition-all group relative border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--component-hover)]"
      title="Copy to clipboard"
      type="button"
    >
      {copied ? (
        <MdCheck className="w-3.5 h-3.5 text-green-400" />
      ) : (
        <MdContentCopy className="w-3.5 h-3.5" />
      )}
      <span
        className={`absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded pointer-events-none transition-opacity duration-200 ${copied ? "opacity-100" : "opacity-0"
          }`}
      >
        Copied!
      </span>
    </button>
  );
};

const ChatPage = ({ 
  initialAgentDetails, 
  useUser, 
  usedIn = "muapiapp",
  useSidebar,
  searchQuery = "",
  setSearchQuery = () => {},
  getSearchItems = () => {},
  initialHistory = null,
}) => {
  const { id: routeAgentId, agent_id, agent_name, conversation_id: routeConversationId } = useParams();
  const effectiveAgentId = agent_id || agent_name || routeAgentId;
  const lowerAgentSlug = effectiveAgentId?.toLowerCase();
  
  const effectiveConversationId = routeConversationId;
  const router = useRouter();
  
  const userContext = useUser ? useUser() : {};
  let userName = "User";
  let userProfile = null;

  if (usedIn === "vadoo") {
    const { serverDetails } = userContext;
    userName = serverDetails?.user_details?.name || "User";
    userProfile = serverDetails?.user_details?.profile;
  } else if (usedIn === "muapiapp") {
    // muapiapp
    const { user } = userContext;
    userName = user?.username || user?.name || "User";
    userProfile = user?.profile_photo;
  }

  const [messages, setMessages] = useState(() => {
    if (initialHistory && initialHistory.history) {
      return initialHistory.history.map((msg, i) => {
        let ts = msg.timestamp || initialHistory.created_at || new Date();
        if (typeof ts === 'string' && ts.includes('T') && !ts.endsWith('Z') && !ts.includes('+')) {
          ts += 'Z';
        }
        return {
          ...msg,
          id: msg.id || `${msg.role}_${Date.now()}_${i}`,
          timestamp: ts
        };
      });
    }
    return [];
  });
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(() => {
    if (typeof window !== 'undefined' && effectiveConversationId) {
      return !!sessionStorage.getItem('pending_first_msg');
    }
    return false;
  });
  const [agentDetails, setAgentDetails] = useState(initialAgentDetails || null);
  const [error, setError] = useState(null);
  const [debugLogs, setDebugLogs] = useState([]);
  const [showDebug, setShowDebug] = useState(false);
  const conversationIdRef = useRef(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [downloadingUrl, setDownloadingUrl] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(() => {
    const themeData = initialAgentDetails?.theme;
    if (typeof themeData === 'string' && themes[themeData]) {
      return themes[themeData];
    }
    if (themeData && typeof themeData === 'object' && themeData.colors) {
      return themeData;
    }
    return themes.cosmic;
  });
  const textareaRef = useRef(null);
  const scrollRef = useRef(null);
  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const currentAssistantMsgRef = useRef({
    content: "",
    thoughts: "",
    status: [],
    suggestions: [],
  });
  const [showCustomColorPanel, setShowCustomColorPanel] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [liked, setLiked] = useState(agentDetails ? agentDetails?.has_liked : false);
  const [likeCount, setLikeCount] = useState(agentDetails ? agentDetails?.like_count : 0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      if (messages.length > 0) {
        conversationIdRef.current = effectiveConversationId;
        return;
      }

      if (effectiveConversationId && lowerAgentSlug) {
        const pending = sessionStorage.getItem('pending_first_msg');
        if (pending) {
          try {
            const { convId } = JSON.parse(pending);
            if (convId === effectiveConversationId) {
              return;
            }
          } catch (e) {}
        }

        try {
          let endpoint = `${BASE_URL}/by-slug/${lowerAgentSlug}/${effectiveConversationId}`;
          const res = await axios.get(endpoint);
          if (res.data && res.data.history) {
            const hydratedMessages = res.data.history.map((msg, i) => {
              let ts = msg.timestamp || res.data.created_at || new Date();
              if (typeof ts === 'string' && ts.includes('T') && !ts.endsWith('Z') && !ts.includes('+')) {
                ts += 'Z';
              }
              return {
                ...msg,
                id: msg.id || `${msg.role}_${Date.now()}_${i}`,
                timestamp: ts
              };
            });

            if (hydratedMessages.length > 0) {
              setMessages(hydratedMessages);
            }
            conversationIdRef.current = effectiveConversationId;
          }
        } catch (err) {
          console.error("Failed to fetch conversation history:", err);
        }
      }
    };
    fetchHistory();
  }, [effectiveConversationId, lowerAgentSlug]);

  const handleCustomColorChange = (part, color) => {
    const updatedTheme = {
      ...currentTheme,
      id: 'custom',
      name: 'Custom Theme',
      colors: {
        ...currentTheme.colors,
        [part]: color
      }
    };
    setCurrentTheme(updatedTheme);
  };

  const handleThemeSync = async (theme) => {
    try {
      await axios.put(`${BASE_URL}/by-slug/${lowerAgentSlug}`, { theme: theme });
    } catch (err) {
      console.error("Failed to save theme:", err);
    }
    setShowCustomColorPanel(false);
  };

  const generateCssVariables = (theme) => {
    const c = theme?.colors || themes.cosmic.colors;
    return {
      "--bg-primary": c.background,
      "--text-primary": c.foreground,
      "--text-secondary": c.muted,
      "--border-color": c.border,
      "--component-bg": c.componentBg,
      "--component-hover": c.componentHover,
      "--header-bg": c.headerBg,
      "--user-bubble": c.userBubble,
      "--user-text": c.userText,
      "--agent-bubble": c.agentBubble,
      "--agent-text": c.agentText,
      "--input-bg": c.inputBg,
      "--accent": c.accent,
      "--accent-text": c.accentText,
      "--font-family": "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    };
  };

  const handleDownloadFile = async (file_url, filename = "download") => {
    if (!file_url) {
      toast.error("File URL not found");
      return;
    }

    setDownloadingUrl(file_url);
    try {
      const response = await axios.post("/api/workflow/cloudfront-signed-url",
        {
          url: file_url
        }
      );

      const signed_url = response.data.signed_url;
      const fetchResponse = await fetch(signed_url, { mode: "cors" });
      const blob = await fetchResponse.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      toast.error(`Download failed: ${err.message}`);
    } finally {
      setDownloadingUrl(null);
    }
  };

  useEffect(() => {
    if (agentDetails?.theme && themes[agentDetails.theme]) {
      setCurrentTheme(themes[agentDetails.theme]);
    }
  }, [agentDetails]);

  useEffect(() => {
    if (initialAgentDetails) {
      setAgentDetails(initialAgentDetails);
    } else {
      // fetchAgentDetails();
    }
  }, [lowerAgentSlug, initialAgentDetails]);

  useEffect(() => {
    const checkPendingMessage = async () => {
      if (effectiveConversationId) {
        const pending = sessionStorage.getItem('pending_first_msg');
        if (pending) {
          try {
            const { convId, text, attachments: pendingAttachments } = JSON.parse(pending);
            if (convId === effectiveConversationId) {
              sessionStorage.removeItem('pending_first_msg');
              setTimeout(() => {
                handleSendMessage(null, text, pendingAttachments);
              }, 100);
            }
          } catch (e) {
            console.error("Failed to parse pending message", e);
          }
        }
      }
    };
    checkPendingMessage();
  }, [effectiveConversationId]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const fetchAgentDetails = async () => {
    try {
      const endpoint = `${BASE_URL}/by-slug/${lowerAgentSlug}`;
      const response = await axios.get(endpoint);
      setAgentDetails(response.data);
    } catch (err) {
      setAgentDetails({
        name: "Autonomous Agent",
        description: "MuAPI Powered Intelligence.",
      });
    }
  };

  const uploadFile = async (file) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("File size too large (max 10MB)");
      return;
    }

    try {
      setUploadProgress(0);
      setIsUploading(true);

      const response = await axios.get("/api/app/get_file_upload_url", {
        params: { filename: file.name }
      });
      const { url, fields } = response.data;

      const formData = new FormData();
      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value);
      });
      formData.append("file", file);

      await axios.post(url, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });
      const prefix = "https://cdn.muapi.ai/";
      const uploadedUrl = prefix + fields.key;
      setAttachments(prev => [...prev, uploadedUrl]);
    } catch (err) {
      console.error("Upload failed", err);
      setError("Failed to upload image.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    uploadFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      uploadFile(file);
    } else if (file) {
      setError("Please only upload image files.");
    }
  };

  const removeAttachment = (url) => {
    setAttachments(prev => prev.filter(item => item !== url));
  };

  const handleThemeChange = async (theme) => {
    setCurrentTheme(theme);
    handleThemeSync(theme);
  };

  const handleLike = async () => {
    const newLiked = !liked;
    const prevLikeCount = likeCount;
    
    // Optimistic update
    setLiked(newLiked);
    setLikeCount(prev => newLiked ? prev + 1 : prev - 1);

    try {
      const res = await axios.post(`/api/agents/by-slug/${lowerAgentSlug}/like?is_like=${newLiked}`);
      setLiked(res.data.has_liked);
      setLikeCount(res.data.like_count);
    } catch (err) {
      console.error("Failed to sync like:", err);
      // Rollback
      setLiked(!newLiked);
      setLikeCount(prevLikeCount);
    }
  };

  const handleNewChat = () => {
    if (lowerAgentSlug) {
      router.push(`/agents/${lowerAgentSlug}`);
    }
  };

  const handleSendMessage = async (e, overrideText = null, overrideAttachments = null) => {
    if (e) e.preventDefault();
    
    const userText = overrideText || input;
    const currentAttachments = overrideAttachments || (overrideText ? [] : attachments);

    if (!userText.trim()) return;
    if (isStreaming && !overrideText) return;
    
    if (overrideText) setIsStreaming(false);

    const userMessage = {
      role: "user",
      content: userText,
      attachments: [...currentAttachments],
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    
    if (!overrideText) {
      setAttachments([]);
      setInput("");
    }
    
    setIsStreaming(true);
    setError(null);
    setDebugLogs([]);

    const assistantMsgId = `asst_${Date.now()}`;
    currentAssistantMsgRef.current = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      thoughts: "",
      status: [],
      suggestions: [],
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, { ...currentAssistantMsgRef.current }]);

    try {
      let currentConvId = conversationIdRef.current || effectiveConversationId;
      
      if (!currentConvId && !overrideText) {
        const newConvId = crypto.randomUUID();
        conversationIdRef.current = newConvId;
        
        sessionStorage.setItem('pending_first_msg', JSON.stringify({
          convId: newConvId,
          text: userText,
          attachments: currentAttachments,
          timestamp: new Date().toISOString()
        }));

        if (lowerAgentSlug) {
           router.replace(`/agents/${lowerAgentSlug}/${newConvId}`);
        }
        
        return;
      }

      const initialRes = await axios.post(
        `${BASE_URL}/by-slug/${lowerAgentSlug}/chat`,
        {
          message: userText,
          stream: false,
          conversation_id: currentConvId,
          attachments: userMessage.attachments,
        }
      );

      const { request_id } = initialRes.data;
      if (!request_id) throw new Error("No Request ID returned from agent");

      const pollInterval = 1000;
      let isComplete = false;
      let errors = 0;

      while (!isComplete && errors < 5) {
        try {
          const pollRes = await axios.get(`/api/api/v1/predictions/${request_id}/result`);
          const data = pollRes.data;

          // data format from backend execute_agent_chat_background:
          // { 
          //   conversation_id, 
          //   messages: [{role, content...}, {type:'pulse'...}],
          //   status_text, 
          //   is_complete, 
          //   suggestions,
          //   error
          // }

          if (data.conversation_id) conversationIdRef.current = data.conversation_id;

          const incomingMessages = data.messages || [];

          let newContent = "";
          let newThoughts = "";
          let newStatus = [];

          incomingMessages.forEach(msg => {
            if (msg.role === "assistant" && msg.content) {
              newContent = msg.content;
            }
            if (msg.type === "pulse" && msg.content) {
              newStatus.push(msg.content);
            }
            if (msg.role === "assistant" && msg.thoughts) {
              newThoughts = msg.thoughts;
            }
          });

          currentAssistantMsgRef.current.content = newContent;
          currentAssistantMsgRef.current.status = newStatus;
          currentAssistantMsgRef.current.suggestions = data.suggestions || [];
          setMessages((prev) => {
            const index = prev.findIndex((m) => m.id === assistantMsgId);
            if (index !== -1) {
              const newMessages = [...prev];
              newMessages[index] = {
                ...newMessages[index],
                content: newContent,
                status: newStatus,
                suggestions: data.suggestions || [],
              };
              return newMessages;
            }
            return prev;
          });

          if (data.status === "failed") {
            throw new Error(data.error || "Agent execution failed");
          }

          if (data.status === "completed" || data.status === "succeeded" || data.is_complete) {
            isComplete = true;
          } else {
            await new Promise(r => setTimeout(r, pollInterval));
          }

        } catch (pollErr) {
          console.error("Polling error", pollErr);
          errors++;
          await new Promise(r => setTimeout(r, 2000));
        }
      }

      if (errors >= 5) throw new Error("Lost connection to agent process");

    } catch (err) {
      console.log("Agent error:", err);
      let errorMessage = err.message || "Something went wrong. Check browser console";
      if (err.response) {
        const { status, data } = err.response;
        errorMessage = data?.error || "Not enough credits";
      } else {
        errorMessage = err.message;
      }
      setError(errorMessage);
      if (!currentAssistantMsgRef.current.content) {
        setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId));
      }
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <main
      className="h-dvh flex flex-col selection:bg-blue-500/30 relative"
      style={{
        ...generateCssVariables(currentTheme),
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
        fontFamily: "var(--font-family)",
      }}
    >
      {isMounted && (
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          main {
            font-family: var(--font-family) !important;
          }
          
          .prose, .prose p, .prose h1, .prose h2, .prose h3, .prose h4, .prose li {
            font-family: var(--font-family) !important;
          }
        ` }} />
      )}
      <header className="flex-shrink-0 border-b backdrop-blur-2xl px-6 py-4 flex items-center justify-center z-10 shadow-lg transition-colors duration-300 bg-[var(--header-bg)] border-[var(--border-color)]">
        <div className="flex items-center justify-between gap-4 w-full lg:max-w-[80%]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="flex items-center justify-center transition-all group"
            >
              <IoChevronBack className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors" />
            </button>
            <div className="flex items-center gap-3">
              {agentDetails?.icon_url ? (
                <img
                  src={agentDetails.icon_url}
                  alt={agentDetails.name}
                  className="w-9 h-9 rounded-lg object-cover border border-[var(--border-color)]"
                />
              ) : (
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>
                  <RiRobot2Fill className="w-5 h-5" />
                </div>
              )}
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 px-2 py-1 rounded-lg transition-all hover:bg-[var(--component-hover)]"
                >
                  <div className="flex flex-col items-start leading-tight">
                    <h1 className="text-base font-semibold text-[var(--text-primary)] truncate">
                      {agentDetails?.name || "Loading..."}
                    </h1>
                    {agentDetails && !agentDetails.is_owner && (agentDetails.owner_username || agentDetails.owner_email) && (
                      <span className="text-[10px] text-[var(--text-secondary)] font-medium">
                        by {agentDetails.owner_username || agentDetails.owner_email?.split('@')[0]}
                      </span>
                    )}
                  </div>
                  <IoChevronBack
                    className={`w-4 h-4 text-[var(--text-secondary)] transition-transform ${showDropdown ? "rotate-90" : "-rotate-180"
                      }`}
                  />
                </button>
                {showDropdown && (
                  <div className="absolute top-10 left-0 border rounded-lg shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200 min-w-[200px] bg-[var(--header-bg)] border-[var(--border-color)]">
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        router.push(`/agents/${lowerAgentSlug}/profile`);
                      }}
                      type="button"
                      className="w-full flex items-center gap-3 px-3 py-2 transition-all hover:bg-[var(--component-hover)] rounded-t-lg"
                    >
                      <RiRobot2Fill size={16} className="text-[var(--text-secondary)]" />
                      <span className="text-sm text-[var(--text-primary)]">View Profile</span>
                    </button>
                    {agentDetails?.is_owner && (
                      <>
                        <button
                          onClick={() => {
                            setShowDropdown(false);
                            router.push(`/agents/edit/${agent_id}`);
                          }}
                          type="button"
                          className="w-full flex items-center gap-3 px-3 py-2 transition-all hover:bg-[var(--component-hover)] border-t border-[var(--border-color)]"
                        >
                          <MdEdit size={16} className="text-[var(--text-secondary)]" />
                          <span className="text-sm text-[var(--text-primary)]">Edit agent</span>
                        </button>
                        <div className="relative group/submenu">
                          <button
                            onMouseEnter={() => setShowThemeDropdown(true)}
                            onClick={() => setShowThemeDropdown(!showThemeDropdown)}
                            type="button"
                            className={`w-full flex items-center gap-3 px-3 py-2 transition-all hover:bg-[var(--component-hover)] border-t border-[var(--border-color)] rounded-b-lg ${showThemeDropdown ? 'bg-[var(--component-hover)]' : ''}`}
                          >
                            <IoColorPalette size={16} className="text-[var(--text-secondary)]" />
                            <span className="text-sm text-[var(--text-primary)]">Themes</span>
                            <FaAngleRight size={14} className="ml-auto text-[var(--text-secondary)]" />
                          </button>
                          {showThemeDropdown && (
                            <div
                              className="md:absolute relative md:left-full left-0 md:top-0 top-0 md:ml-1 ml-0 md:border border-none md:rounded-xl rounded-none md:shadow-2xl shadow-none overflow-hidden z-[60] animate-in fade-in md:slide-in-from-left-2 slide-in-from-top-2 duration-200 min-w-[200px] bg-[var(--header-bg)] md:border-[var(--border-color)] p-2"
                              onMouseEnter={() => setShowThemeDropdown(true)}
                              onMouseLeave={() => setShowThemeDropdown(false)}
                            >
                              <div className="text-[10px] font-bold text-[var(--text-secondary)] mb-2 px-2 uppercase tracking-[0.2em]">Select Theme</div>
                              <div className="space-y-1 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                                {Object.values(themes).map((theme) => (
                                  <button
                                    key={theme.id}
                                    onClick={() => {
                                      handleThemeChange(theme);
                                      setShowThemeDropdown(false);
                                      setShowDropdown(false);
                                    }}
                                    type="button"
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group/theme ${currentTheme.id === theme.id
                                        ? "bg-[var(--accent)] text-[var(--accent-text)] shadow-md"
                                        : "text-[var(--text-secondary)] hover:bg-[var(--component-hover)]"
                                      }`}
                                  >
                                    <div
                                      className="w-4 h-4 rounded-full border border-white/20 shadow-inner flex-shrink-0"
                                      style={{ background: theme.colors.background }}
                                    ></div>
                                    <span className="font-medium">{theme.name}</span>
                                    {currentTheme.id === theme.id && (
                                      <MdCheck className="ml-auto w-4 h-4" />
                                    )}
                                  </button>
                                ))}
                                <button
                                  onClick={() => {
                                    setShowCustomColorPanel(true);
                                    setShowThemeDropdown(false);
                                    setShowDropdown(false);
                                  }}
                                  type="button"
                                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--component-hover)] border-t border-[var(--border-color)] mt-1"
                                >
                                  <MdEdit className="w-4 h-4" />
                                  <span className="font-medium">Customize Colors</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLike}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--component-hover)]"
              title={liked ? "Unlike agent" : "Like agent"}
            >
              {liked ? (
                <IoHeart className="w-4 h-4 text-red-500" />
              ) : (
                <IoHeartOutline className="w-4 h-4" />
              )}
              <span className="text-xs font-semibold">{likeCount || 0}</span>
            </button>

            {effectiveConversationId && (
              <button
                type="button"
                onClick={handleNewChat}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--component-hover)]"
                title="Start new chat"
              >
                <HiOutlinePencilAlt className="w-4 h-4" />
                <span className="text-xs hidden md:flex font-semibold">New Chat</span>
              </button>
            )}
          </div>
        </div>
      </header>
      <div className="flex-1 flex overflow-y-auto">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-8 custom-scrollbar"
        >
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.length === 0 && agentDetails && (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="px-4 py-1.5 rounded-full border text-[10px] uppercase tracking-widest font-bold bg-[var(--component-bg)] border-[var(--border-color)] text-[var(--text-secondary)]">
                    Today
                  </div>
                </div>
                <div className="flex flex-col items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-2 mb-1 ml-11">
                    <div className="text-xs font-bold text-[var(--text-primary)]">
                      {agentDetails?.name}
                    </div>
                  </div>

                  <div className="flex gap-3 items-end max-w-[85%] group/msg">
                    {agentDetails?.icon_url ? (
                      <img
                        src={agentDetails.icon_url}
                        alt={agentDetails.name}
                        className="w-8 h-8 rounded-full object-cover border flex-shrink-0 border-[var(--border-color)] transition-all duration-500 ease-in-out"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ease-in-out" style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>
                        <RiRobot2Fill className="w-4 h-4" />
                      </div>
                    )}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-end gap-2">
                        <div
                          className="backdrop-blur-sm rounded-2xl rounded-tl-md px-4 py-3 shadow-xl border inline-block"
                          style={{
                            background: 'var(--agent-bubble)',
                            color: 'var(--agent-text)',
                            borderColor: 'var(--border-color)'
                          }}
                        >
                          <div className="prose prose-sm max-w-none" style={{ color: 'var(--agent-text)' }}>
                            <p>
                              {agentDetails.welcome_message ||
                                `Hello! I am ${agentDetails.name}. ${agentDetails.description ||
                                "How can I assist you today?"
                                }`}
                            </p>
                          </div>
                        </div>
                        <div className="opacity-0 group-hover/msg:opacity-100 transition-opacity">
                          <CopyButton text={agentDetails?.welcome_message || `Hello! I am ${agentDetails.name}. ${agentDetails.description || "How can I assist you today?"}`} />
                        </div>
                      </div>
                      {agentDetails.initial_suggestions?.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {agentDetails.initial_suggestions.map((sug, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                setInput(sug.prompt);
                                if (textareaRef.current) {
                                  textareaRef.current.focus();
                                }
                              }}
                              className="flex items-center gap-2 text-xs font-medium border px-3 py-2 rounded-lg transition-all group hover:opacity-80"
                              style={{
                                background: 'var(--component-bg)',
                                borderColor: 'var(--border-color)',
                                color: 'var(--text-primary)'
                              }}
                            >
                              <HiLightBulb className="w-3.5 h-3.5 text-yellow-500 group-hover:scale-110 transition-transform" />
                              {sug.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {messages.map((msg, idx) => {
              const prevMsg = messages[idx - 1];
              const showDateHeader =
                !prevMsg ||
                new Date(msg.timestamp).toDateString() !==
                new Date(prevMsg.timestamp).toDateString();

              return (
                <div key={idx} className="space-y-6">
                  {showDateHeader && msg.timestamp && (
                    <div className="flex justify-center">
                      <div className="px-4 py-1.5 rounded-full border text-[10px] uppercase tracking-widest font-bold bg-[var(--component-bg)] border-[var(--border-color)] text-[var(--text-secondary)]">
                        {getDateHeader(msg.timestamp)}
                      </div>
                    </div>
                  )}
                  <div
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"
                      } animate-in fade-in slide-in-from-bottom-2 duration-300`}
                  >
                    {msg.role === "user" ? (
                      <div className="flex flex-col items-end max-w-[80%] group/msg">
                        <div className="flex items-center gap-2 mb-1 mr-11">
                          {msg.timestamp && (
                            <div className="text-[10px] font-medium text-[var(--text-secondary)]">
                              {formatMessageTime(msg.timestamp)}
                            </div>
                          )}
                          <div className="text-xs font-bold text-[var(--text-primary)]">
                            {userName}
                          </div>
                        </div>

                        <div className="flex gap-3 items-end w-full justify-end">
                          <div className="flex-1 space-y-1 text-right">
                            <div className="flex items-end justify-end gap-2">
                              <div className="opacity-0 group-hover/msg:opacity-100 transition-opacity">
                                <CopyButton text={msg.content} />
                              </div>
                              <div
                                className="px-4 py-3 rounded-2xl rounded-tr-md shadow-xl inline-block text-left"
                                style={{
                                  background: 'var(--user-bubble)',
                                  color: 'var(--user-text)',
                                }}
                              >
                                {msg.attachments?.length > 0 && (
                                  <div className="mb-3 flex flex-wrap justify-end gap-2">
                                    {msg.attachments.map((url, i) => (
                                      <div key={i} className="relative group/user-att">
                                        <img
                                          src={url}
                                          alt="Uploaded Attachment"
                                          className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl object-cover border border-white/20 shadow-md cursor-pointer hover:scale-[1.02] transition-transform"
                                          onClick={() => setSelectedMedia({ type: "image", url })}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                )}
                                <p className="text-sm leading-relaxed font-medium whitespace-pre-wrap">
                                  {msg.content}
                                </p>
                              </div>
                            </div>
                          </div>
                          {userProfile ? (
                            <img
                              src={userProfile}
                              alt={userName}
                              className="w-8 h-8 rounded-full object-cover border flex-shrink-0 border-[var(--border-color)] transition-all duration-500 ease-in-out"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ease-in-out" style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>
                              <MdPerson className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-start max-w-[85%] group/msg">
                        <div className="flex items-center gap-2 mb-1 ml-11">
                          <div className="text-xs font-bold text-[var(--text-primary)]">
                            {agentDetails?.name}
                          </div>
                          {msg.timestamp && (
                            <div className="text-[10px] font-medium text-[var(--text-secondary)]">
                              {formatMessageTime(msg.timestamp)}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-3 items-end w-full">
                          {agentDetails?.icon_url ? (
                            <img
                              src={agentDetails.icon_url}
                              alt={agentDetails.name}
                              className="w-8 h-8 rounded-full object-cover border flex-shrink-0 border-[var(--border-color)] transition-all duration-500 ease-in-out"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ease-in-out" style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>
                              <RiRobot2Fill className="w-4 h-4" />
                            </div>
                          )}

                          <div className="flex-1 space-y-3">
                            {msg.status?.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {msg.status.map((st, i) => (
                                  <div
                                    key={i}
                                    className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border"
                                    style={{
                                      background: 'var(--component-bg)',
                                      borderColor: 'var(--border-color)',
                                      color: 'var(--accent)'
                                    }}
                                  >
                                    <MdTerminal className="w-3 h-3" />
                                    <span>{st}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {msg.thoughts && (
                              <div className="border rounded-xl p-4 space-y-2 bg-[var(--component-bg)] border-[var(--border-color)]">
                                <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
                                  <RiRobot2Fill className="w-3.5 h-3.5" />
                                  <span>Thinking process</span>
                                </div>
                                <p className="text-xs leading-relaxed italic text-[var(--text-secondary)]">
                                  {msg.thoughts}
                                </p>
                              </div>
                            )}

                            {(msg.content || (isStreaming && idx === messages.length - 1)) && (
                              <div className="flex items-end gap-2">
                                <div
                                  className="backdrop-blur-sm rounded-2xl rounded-tl-md px-4 py-3 shadow-xl border inline-block"
                                  style={{
                                    background: 'var(--agent-bubble)',
                                    color: 'var(--agent-text)',
                                    borderColor: 'var(--border-color)',
                                  }}
                                >
                                  <div className="prose prose-sm max-w-none" style={{ color: 'var(--agent-text)' }}>
                                    {parseMessageContent(msg.content || " ").map((part, i) => (
                                      <div key={i}>
                                        {part.type === "text" && (
                                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {part.content}
                                          </ReactMarkdown>
                                        )}
                                        {part.type === "image" && (
                                          <div className="my-3 rounded-xl overflow-hidden border shadow-lg relative w-fit group/media bg-[var(--component-bg)] border-[var(--border-color)]">
                                            <img
                                              src={part.url}
                                              alt="Generated Media"
                                              className="w-full h-auto max-h-[300px] object-contain transition-transform duration-500 group-hover/media:scale-[1.02]"
                                              loading="lazy"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/media:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
                                              <button
                                                onClick={() => setSelectedMedia({ type: "image", url: part.url })}
                                                type="button"
                                                className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition-all hover:scale-110"
                                                title="View Full Screen"
                                              >
                                                <MdFullscreen className="w-6 h-6" />
                                              </button>
                                              <button
                                                onClick={() => handleDownloadFile(part.url, `image-${Date.now()}.png`)}
                                                type="button"
                                                className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition-all hover:scale-110 disabled:opacity-50"
                                                title="Download"
                                                disabled={downloadingUrl === part.url}
                                              >
                                                {downloadingUrl === part.url ? (
                                                  <BiLoaderAlt className="w-6 h-6 animate-spin" />
                                                ) : (
                                                  <MdFileDownload className="w-6 h-6" />
                                                )}
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                        {part.type === "video" && (
                                          <div className="my-3 rounded-xl overflow-hidden border shadow-lg relative w-fit group/media bg-[var(--component-bg)] border-[var(--border-color)]">
                                            <video
                                              src={part.url}
                                              className="w-full h-auto max-h-[300px] transition-transform duration-500 group-hover/media:scale-[1.02]"
                                            />
                                            <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover/media:opacity-100 transition-opacity duration-300 z-10">
                                              <button
                                                onClick={() => setSelectedMedia({ type: "video", url: part.url })}
                                                className="p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 transition-all hover:scale-105"
                                                title="View Full Screen"
                                              >
                                                <MdFullscreen className="w-5 h-5" />
                                              </button>
                                              <button
                                                onClick={() => handleDownloadFile(part.url, `video-${Date.now()}.mp4`)}
                                                className="p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 transition-all hover:scale-105 disabled:opacity-50"
                                                title="Download"
                                                disabled={downloadingUrl === part.url}
                                              >
                                                {downloadingUrl === part.url ? (
                                                  <BiLoaderAlt className="w-5 h-5 animate-spin" />
                                                ) : (
                                                  <MdFileDownload className="w-5 h-5" />
                                                )}
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                        {part.type === "audio" && (
                                          <div className="my-3 flex items-center gap-3 p-3 rounded-xl border backdrop-blur-sm bg-[var(--component-bg)] border-[var(--border-color)]">
                                            <div
                                              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                              style={{ background: 'var(--component-hover)', color: 'var(--accent)' }}
                                            >
                                              <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.5}
                                                stroke="currentColor"
                                                className="w-5 h-5"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"
                                                />
                                              </svg>
                                            </div>
                                            <audio src={part.url} controls className="w-full h-8" />
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                  {isStreaming && idx === messages.length - 1 && (
                                    <div className="flex gap-1 mt-2">
                                      <div
                                        className="w-2 h-2 rounded-full animate-bounce"
                                        style={{ background: 'var(--accent)', animationDelay: "0ms" }}
                                      ></div>
                                      <div
                                        className="w-2 h-2 rounded-full animate-bounce"
                                        style={{ background: 'var(--accent)', animationDelay: "150ms" }}
                                      ></div>
                                      <div
                                        className="w-2 h-2 rounded-full animate-bounce"
                                        style={{ background: 'var(--accent)', animationDelay: "300ms" }}
                                      ></div>
                                    </div>
                                  )}
                                </div>
                                <div className="opacity-0 group-hover/msg:opacity-100 transition-opacity">
                                  <CopyButton text={msg.content} />
                                </div>
                              </div>
                            )}

                            {msg.suggestions?.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {msg.suggestions.map((sug, i) => (
                                  <button
                                    key={i}
                                    onClick={() => setInput(sug.prompt)}
                                    className="flex items-center gap-2 text-xs font-medium border px-3 py-2 rounded-lg transition-all hover:opacity-80"
                                    style={{
                                      background: 'var(--component-bg)',
                                      borderColor: 'var(--border-color)',
                                      color: 'var(--text-primary)'
                                    }}
                                  >
                                    <HiLightBulb className="w-3.5 h-3.5 text-yellow-500" />
                                    {sug.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* {showDebug && (
          <div className="w-80 border-l backdrop-blur-xl overflow-y-auto p-4 custom-scrollbar animate-in slide-in-from-right duration-300 bg-[var(--header-bg)] border-[var(--border-color)]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-color)]">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Debug Logs
              </h3>
              <button
                type="button"
                onClick={() => setShowDebug(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <MdClose className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {debugLogs.length === 0 && (
                <p className="text-xs italic text-[var(--text-secondary)]">
                  No logs yet...
                </p>
              )}
              {debugLogs.map((log, i) => (
                <div
                  key={i}
                  className={`p-2 rounded-lg border text-xs font-mono ${log.type === "error"
                      ? "bg-red-500/10 border-red-500/20 text-red-400"
                      : log.type === "warn"
                        ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                        : "bg-[var(--component-bg)] border-[var(--border-color)] text-[var(--text-secondary)]"
                    }`}
                >
                  <span className="text-[10px] opacity-50 mr-2">
                    [{log.time}]
                  </span>
                  {log.msg}
                </div>
              ))}
            </div>
          </div>
        )} */}
      </div>
      <footer className="flex-shrink-0 p-4">
        <div className="max-w-3xl mx-auto">
          {error && (
            <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between">
              <span className="text-xs text-red-400 font-medium">
                Error: {error}
              </span>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-300"
              >
                <MdClose className="w-4 h-4" />
              </button>
            </div>
          )}
          <form
            onSubmit={handleSendMessage}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border rounded-2xl flex items-end gap-2 p-2 transition-all shadow-inner focus-within:border-[var(--accent)] ${
              isDragging ? "ring-2 ring-[var(--accent)] border-[var(--accent)] bg-[var(--accent)]/5" : ""
            }`}
            style={{
              background: 'var(--input-bg)',
              borderColor: 'var(--border-color)'
            }}
          >
            {isDragging && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-[var(--accent)]/10 backdrop-blur-[2px] rounded-2xl pointer-events-none border-2 border-dashed border-[var(--accent)] animate-in fade-in duration-200">
                <div className="flex items-center justify-center gap-2 text-[var(--accent)]">
                  <IoAdd className="w-8 h-8 animate-bounce" />
                  <span className="text-sm font-bold uppercase tracking-wider">Drop image to upload</span>
                </div>
              </div>
            )}
            {attachments.length > 0 && (
              <div className="absolute bottom-full left-0 right-0 mb-2 flex flex-wrap gap-2 animate-in slide-in-from-bottom-2">
                {attachments.map((url, i) => (
                  <div key={i} className="relative group/att">
                    <img
                      src={url}
                      className="w-16 h-16 rounded-xl object-cover border-2 border-[var(--border-color)] shadow-lg"
                      alt="Attachment Preview"
                    />
                    <button
                      onClick={() => removeAttachment(url)}
                      type="button"
                      className="absolute -top-1.5 -right-1.5 p-1 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover/att:opacity-100 transition-opacity"
                    >
                      <MdClose className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              type="button"
              disabled={isUploading || isStreaming}
              className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all bg-[var(--component-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50 shadow-sm relative overflow-hidden"
              title="Upload Image"
            >
              {isUploading ? (
                <>
                  <BiLoaderAlt className="w-4 h-4 animate-spin opacity-20" />
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[var(--accent)]">
                    {uploadProgress}%
                  </span>
                </>
              ) : (
                <IoAdd className="w-5 h-5" />
              )}
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isStreaming}
              placeholder={isStreaming ? "Agent is thinking..." : "Type here or drop an image..."}
              className="flex-1 bg-transparent px-3 py-2.5 text-sm focus:outline-none resize-none max-h-32 placeholder:text-gray-500 custom-scrollbar text-[var(--text-primary)]"
              rows={1}
            />
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              style={{
                background: 'var(--accent)',
                color: 'var(--accent-text)'
              }}
            >
              {isStreaming ? (
                <BiLoaderAlt className="w-4 h-4 animate-spin" />
              ) : (
                <IoSend className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>
      </footer>
      {selectedMedia && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setSelectedMedia(null)}
        >
          <button
            type="button"
            className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all border border-white/10 z-[110]"
            onClick={() => setSelectedMedia(null)}
          >
            <MdClose className="w-6 h-6" />
          </button>
          <div
            className="max-w-[90vw] max-h-[90vh] relative animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedMedia.type === "image" ? (
              <img
                src={selectedMedia.url}
                alt="Full Screen"
                className="w-full h-auto max-h-[90vh] object-contain rounded-lg shadow-2xl border border-white/10"
              />
            ) : (
              <video
                src={selectedMedia.url}
                controls
                autoPlay
                className="w-full h-auto max-h-[90vh] rounded-lg shadow-2xl border border-white/10"
              />
            )}
            <div className="flex justify-center">
              <button
                onClick={() =>
                  handleDownloadFile(
                    selectedMedia.url,
                    `${selectedMedia.type}-${Date.now()}.${selectedMedia.type === "image" ? "png" : "mp4"
                    }`
                  )
                }
                type="button"
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                disabled={downloadingUrl === selectedMedia.url}
              >
                {downloadingUrl === selectedMedia.url ? (
                  <>
                    <BiLoaderAlt className="w-5 h-5 animate-spin" />
                    Preparing...
                  </>
                ) : (
                  <>
                    <MdFileDownload className="w-5 h-5" />
                    Download
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {showCustomColorPanel && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/10 backdrop-blur-sm transition-opacity"
            onClick={() => setShowCustomColorPanel(false)}
          />
          <div className="relative w-full max-w-md bg-[var(--header-bg)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <IoColorPalette className="w-5 h-5 text-[var(--accent)]" />
                <h3 className="font-bold text-[var(--text-primary)]">Customize Theme</h3>
              </div>
              <button 
                onClick={() => setShowCustomColorPanel(false)}
                className="p-1 rounded-lg hover:bg-[var(--component-hover)] text-[var(--text-secondary)] transition-colors"
              >
                <MdClose className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-4">
              {[
                { label: 'Background', key: 'background' },
                { label: 'Text Primary', key: 'foreground' },
                { label: 'Text Secondary', key: 'muted' },
                { label: 'Border Color', key: 'border' },
                { label: 'Panel Background', key: 'componentBg' },
                { label: 'Header Background', key: 'headerBg' },
                { label: 'User Bubble', key: 'userBubble' },
                { label: 'User Text', key: 'userText' },
                { label: 'Agent Bubble', key: 'agentBubble' },
                { label: 'Agent Text', key: 'agentText' },
                { label: 'Input Background', key: 'inputBg' },
                { label: 'Accent Color', key: 'accent' },
                { label: 'Accent Text', key: 'accentText' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-3 rounded-xl border border-[var(--border-color)] bg-[var(--component-bg)]/50">
                  <span className="text-sm font-medium text-[var(--text-primary)]">{item.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase">
                      {currentTheme.colors[item.key]}
                    </span>
                    <input 
                      type="color" 
                      value={currentTheme.colors[item.key]?.startsWith('#') ? currentTheme.colors[item.key] : '#000000'} 
                      onChange={(e) => handleCustomColorChange(item.key, e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-[var(--component-bg)]/50 border-t border-[var(--border-color)]">
              <button 
                onClick={() => handleThemeSync(currentTheme)}
                className="w-full py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95"
                style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default ChatPage;
