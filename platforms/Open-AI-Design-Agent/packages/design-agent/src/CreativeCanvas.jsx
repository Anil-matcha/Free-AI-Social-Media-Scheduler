"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import {
  FiSend, FiImage, FiTerminal, FiSearch,
  FiZap, FiLayout, FiUpload,
  FiPlus, FiSun, FiMoon, FiCheck, FiX, FiEdit2,
  FiArrowLeft, FiAlertCircle, FiCopy,
} from "react-icons/fi";
import { CgTerminal } from "react-icons/cg";
import { BiLoaderAlt } from "react-icons/bi";
import { RiRobot2Line, RiSparklingLine } from "react-icons/ri";
// import { useUser } from "@/context/UserContext";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import toast, { Toaster } from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import PlanVisualizer from "./components/PlanVisualizer";
import Link from "next/link";
import { GoBook } from "react-icons/go";
import { VscLayoutSidebarLeftOff } from "react-icons/vsc";

const CanvasArea = dynamic(() => import("./CanvasArea"), { ssr: false });
const SyntaxHighlighter = dynamic(
  () => import('react-syntax-highlighter').then((mod) => mod.Prism),
  { ssr: false }
);
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { HiOutlineArrowUpTray, HiOutlineTrash } from "react-icons/hi2";
import Image from "next/image";


const API = "/api/v1/creative-agent";

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDateHeader = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
};

const TypingDots = () => (
  <div className="typing-dots py-1.5 px-1">
    <span></span>
    <span></span>
    <span></span>
  </div>
);

export default function CreativeCanvas({
  user,
  theme: forcedTheme,
  setTheme: forcedSetTheme,
  creditConversionRate = 200,
  // Embed-mode props (set by the /embed/agent/[id] page).
  // When embedCode is truthy, the component:
  //   1. Sends `x-agent-embed-code: <code>` instead of a Bearer token.
  //   2. Tracks session_id in localStorage instead of the URL query string
  //      (the iframe URL stays at /embed/agent/<code>).
  //   3. Hides owner-only UI (sessions sidebar, profile menu, / links).
  embedCode = null,
  isEmbed = false,
  // Platform customization props:
  // navLinks: array of { icon, label, path } to show in the user dropdown menu.
  // If not provided, defaults to the muapiapp links (Explore, Top Up, etc.).
  navLinks = null,
  // userBalanceLabel: string like "$ 5.00" or "1200 credits" to show in the dropdown.
  // If not provided, falls back to "$ {user.balance}".
  userBalanceLabel = null,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inEmbedMode = isEmbed && !!embedCode;
  const embedStorageKey = inEmbedMode ? `muapi_agent_session_${embedCode}` : null;
  const [embedSessionId, setEmbedSessionId] = useState(() => {
    if (typeof window === "undefined" || !embedStorageKey) return null;
    return window.localStorage.getItem(embedStorageKey) || null;
  });
  const sessionId = inEmbedMode ? embedSessionId : searchParams.get("session");

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [assets, setAssets] = useState([]);
  const [activeTasks, setActiveTasks] = useState([]);
  const [busy, setBusy] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [currentSessionName, setCurrentSessionName] = useState("Creative Canvas");
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [showSessions, setShowSessions] = useState(false);
  const [skills, setSkills] = useState([]);
  const [activeSkill, setActiveSkill] = useState(null);
  const [showSkillsMenu, setShowSkillsMenu] = useState(false);
  const [showAssetsMenu, setShowAssetsMenu] = useState(false);
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionCursorPos, setMentionCursorPos] = useState(0);
  const [hoveredAsset, setHoveredAsset] = useState(null);

  // Left Sidebar and Session Management
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingSessionName, setEditingSessionName] = useState("");
  const [hoveredSessionId, setHoveredSessionId] = useState(null);

  // Layout resizing
  const [sidebarWidth, setSidebarWidth] = useState(350);
  const [showChat, setShowChat] = useState(true);
  const [prevWidth, setPrevWidth] = useState(350);
  const isResizing = useRef(false);

  const handleToggleSidebar = () => {
    if (showChat) {
      setPrevWidth(sidebarWidth);
      setSidebarWidth(0);
      setShowChat(false);
    } else {
      setSidebarWidth(prevWidth || 350);
      setShowChat(true);
    }
  };

  // Theme handling: Use props if provided, otherwise fallback to useTheme hook
  const { setTheme: nextSetTheme, resolvedTheme: nextResolvedTheme } = useTheme();
  const resolvedTheme = forcedTheme || nextResolvedTheme;
  const setTheme = forcedSetTheme || nextSetTheme;
  const [mounted, setMounted] = useState(false);

  const canvasRef = useRef(null);
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const syncedUrlsRef = useRef(new Set());
  const justCreatedSessionRef = useRef(false);
  const initialHandoffProcessed = useRef(false);

  const getHeaders = useCallback(() => {
    if (inEmbedMode) {
      return { "x-agent-embed-code": embedCode };
    }
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [inEmbedMode, embedCode]);

  // Persist embed session_id across page reloads so the conversation resumes.
  const setActiveEmbedSession = useCallback((id) => {
    setEmbedSessionId(id);
    if (typeof window !== "undefined" && embedStorageKey) {
      if (id) window.localStorage.setItem(embedStorageKey, id);
      else window.localStorage.removeItem(embedStorageKey);
    }
  }, [embedStorageKey]);

  // Initialize
  useEffect(() => {
    setMounted(true);
    // In embed mode there's no concept of "switch to another session" — the
    // visitor only ever sees the one keyed by their localStorage. Skip the
    // sessions list fetch (which would also 403-on-allowed-origins or surface
    // sessions from other embeds spawned by the same owner).
    if (!inEmbedMode) fetchSessions();
    fetchSkills();
  }, []);

  // Handle initial query and skill from URL (Fallback only)
  useEffect(() => {
    if (!mounted || busy || initialHandoffProcessed.current) return;
    // Embed pages never have a / handoff URL — skip.
    if (inEmbedMode) {
      initialHandoffProcessed.current = true;
      return;
    }

    const q = searchParams.get("q");
    const skillName = searchParams.get("skill");
    const a = searchParams.get("a");

    if (!q && !skillName && !a) {
      initialHandoffProcessed.current = true;
      return;
    }

    // We only process URL parameters if the session is brand new AND history has loaded as empty or default.
    // Since the Dashboard now sends the message, this useEffect will typically see the user message in history
    // and correctly skip sending q again.
    const isNewSession = messages.length === 1 && messages[0].role === "assistant";
    
    if (isNewSession) {
      initialHandoffProcessed.current = true;

      let initialAtts = null;
      if (a) {
        initialAtts = a.split(",").map(label => ({ asset_label: label, kind: "image" }));
      }

      if (skillName && !activeSkill) {
        const found = skills.find(s => s.name === skillName);
        if (found) {
          setActiveSkill(found);
          if (q) {
            setTimeout(() => sendMessage(q, found, initialAtts), 10);
          }
        }
      } else if (q) {
        sendMessage(q, null, initialAtts);
      }

      // Cleanup URL once processed
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete("q");
      newParams.delete("skill");
      newParams.delete("a");
      router.replace(`?${newParams.toString()}`, { scroll: false });
    } else if (messages.length > 1 || (messages.length === 1 && messages[0].role === "user")) {
      // If history already has messages, we consider the handoff "processed" by the backend.
      initialHandoffProcessed.current = true;
      
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete("q");
      newParams.delete("skill");
      newParams.delete("a");
      router.replace(`?${newParams.toString()}`, { scroll: false });
    }
  }, [mounted, busy, messages, skills.length, searchParams]);

  useEffect(() => {
    if (justCreatedSessionRef.current) {
      justCreatedSessionRef.current = false;
      return;
    }
    // Clear the sync-tracking set whenever the session changes so assets from
    // the new session are always painted to canvas (prevents stale URL leakage).
    syncedUrlsRef.current.clear();
    if (sessionId) {
      loadHistory();
      loadAssets();
      // Sync name if sessions are already loaded
      const current = sessions.find(s => s.id === sessionId);
      if (current) {
        setCurrentSessionName(current.name);
      } else {
        fetchSessions(); // Re-fetch to find the name if not in list
      }
    } else {
      setMessages([{ role: "assistant", content: `Hello ${user?.username || "User"} — what shall we create today?`, timestamp: new Date().toISOString() }]);
      setAssets([]);
      setCurrentSessionName("New Session");
    }
  }, [sessionId]); // Removed sessions from deps to avoid infinite loop if fetchSessions updates sessions

  const fetchSessions = async () => {
    try {
      const { data } = await axios.get(`${API}/sessions`, { headers: getHeaders() });
      setSessions(data);
      if (sessionId) {
        const current = data.find(s => s.id === sessionId);
        if (current) setCurrentSessionName(current.name);
      }
    } catch {}
  };

  const fetchSkills = async () => {
    try {
      const { data } = await axios.get(`${API}/agent-skills`, { headers: getHeaders() });
      setSkills(data);
    } catch (err) {
      console.error("Failed to fetch skills:", err);
    }
  };

  const processEvent = (ev, msgIdx) => {
    const p = ev.payload || {};

    // Canvas mutation events — apply directly to the live canvas, don't push
    // them into the chat transcript.
    if (ev.type === "canvas_op") {
      const op = p.op;
      const args = p.args || {};
      const c = canvasRef.current;
      if (!c) return;
      if (op === "move" && typeof c.moveNode === "function") {
        c.moveNode(args.asset_id, args.x, args.y);
      } else if (op === "arrange" && typeof c.arrangeNodes === "function") {
        c.arrangeNodes(args.moves || []);
      }
      return;
    }

    const flat = (() => {
      switch (ev.type) {
        case "text":         return { type: "text", content: p.content };
        case "info":         return { type: "info", content: p.content };
        case "error":        return { type: "error", message: p.message };
        case "tool_call":    return { type: "tool_call", name: p.name, args: p.args };
        case "tool_result":  return { type: "tool_result", name: p.name, result: p.result, asset: p.asset };
        case "plan_propose": return { type: "plan_propose", title: p.title, nodes: p.nodes, total_credits: p.total_credits };
        default:             return { type: ev.type, ...p };
      }
    })();
    if (!flat) return;
    flat.job_id = ev.job_id || p.job_id;

    // If the job has already been approved or rejected, mark approval events as handled.
    if (ev.approved !== undefined && ev.approved !== null) {
      const isApproval = flat.type === "plan_propose" || (flat.type === "info" && (flat.content?.includes("approval") || flat.content?.includes("confirmation")));
      if (isApproval) {
        flat.handled = true;
      }
    }

    setMessages(prev => {
      const arr = [...prev];
      if (msgIdx < 0 || msgIdx >= arr.length) return arr;
      const m = { ...arr[msgIdx], events: [...(arr[msgIdx].events || [])] };
      if (m.events.find(e => e.id === ev.id)) return arr;
      
      // Update event and mark previous ones as handled if this is a result
      m.events.push({ ...flat, id: ev.id });
      if (flat.type === "text") m.content = (m.content || "") + (flat.content || "");
      
      // If this is an info-approval pill, hide it if we already have a plan for this job
      if (flat.type === "info" && (flat.content?.includes("approval") || flat.content?.includes("confirmation"))) {
        const hasPlan = m.events.some(e => e.job_id === flat.job_id && e.type === "plan_propose");
        if (hasPlan) flat.handled = true;
      }

      if (flat.type === "tool_result" || flat.type === "error") {
        m.events = m.events.map(e => 
          e.job_id === flat.job_id && (
            (e.type === "info" && (e.content?.includes("approval") || e.content?.includes("confirmation"))) ||
            (e.type === "plan_propose")
          )
            ? { ...e, handled: true }
            : e
        );
      }
      
      // If we just got a plan, hide any loose "Waiting for approval" pills for this job
      if (flat.type === "plan_propose") {
        m.events = m.events.map(e => 
          e.job_id === flat.job_id && e.type === "info" && (e.content?.includes("approval") || e.content?.includes("confirmation"))
            ? { ...e, handled: true }
            : e
        );
      }
      
      arr[msgIdx] = m;
      return arr;
    });

    if (flat.type === "tool_call" && ["generate_image", "generate_video", "image_to_video", "edit_image", "edit_video", "enhance_image"].includes(flat.name)) {
      // For edit-style tools, spawn the loader at the same spot the result
      // will land at — beside the source asset (32px to its right). The
      // source stays visible throughout. Keeps the loader and the final
      // asset position in sync — no visual jump on completion.
      //
      // generate_* (no source) keeps the default centre placement.
      let x, y;
      const a = flat.args || {};
      const srcLabel = a.image || a.video || a.audio;
      if (srcLabel && typeof srcLabel === "string" && srcLabel.startsWith("asset_")) {
        try {
          const cs = canvasRef.current?.getCanvasState?.();
          const srcNode = cs?.nodes?.find(n => n.asset_id === srcLabel);
          if (srcNode) {
            x = srcNode.x + (srcNode.w || 200) + 32;
            y = srcNode.y;
          }
        } catch {}
      }
      setActiveTasks(prev => [...prev, {
        taskId: `task-${Date.now()}-${Math.random()}`,
        modelName: flat.name,
        status: "processing",
        x, y,
      }]);
    }
    
    if (flat.type === "tool_result" || flat.type === "error") {
      setActiveTasks(prev => {
        const idx = prev.findIndex(t => t.modelName === flat.name);
        if (idx !== -1) {
          const next = [...prev];
          next.splice(idx, 1);
          return next;
        }
        return prev;
      });
      
      if (flat.asset) {
        setAssets(pa => {
          // Use a combination of label and url for reliable identification
          const idx = pa.findIndex(a =>
            (flat.asset.asset_label && a.asset_label === flat.asset.asset_label) ||
            (a.url === flat.asset.url)
          );
          if (idx !== -1) {
            const next = [...pa];
            next[idx] = { ...next[idx], ...flat.asset };
            return next;
          }
          return [...pa, flat.asset];
        });

        // Side-by-side placement: when a tool result carries source_asset_id,
        // drop the new asset just to the right of the source so both stay
        // visible. Source is preserved (the user can still see / branch
        // from it). Mark the new label-url as synced so the auto-sync
        // effect doesn't also drop it at canvas centre.
        const srcLabel = flat.result?.source_asset_id;
        const newLabel = flat.asset.asset_label;
        const newUrl = flat.asset.url;
        const newKind = flat.asset.kind || "image";
        const place = canvasRef.current?.placeNextToSource || canvasRef.current?.replaceAt;
        if (srcLabel && newLabel && newUrl && place) {
          place(srcLabel, newUrl, newKind, newLabel);
          syncedUrlsRef.current?.add?.(`${newLabel}-${newUrl}`);
        }
      }
    }
  };

  const resumePolling = async (jobId, assistantIdx) => {
    let cursor = 0;
    const POLL_INTERVAL = 1200;
    const MAX_DEAD_AIR = 6 * 60 * 1000;
    let lastProgress = Date.now();
    
    setBusy(true);
    while (true) {
      try {
        const { data } = await axios.get(`${API}/jobs/${jobId}/events`, {
          params: { since: cursor },
          headers: getHeaders(),
        });
        if (data.events?.length) {
          data.events.forEach(ev => processEvent({ ...ev, approved: data.approved }, assistantIdx));
          cursor = data.cursor || cursor;
          lastProgress = Date.now();
        }
        if (data.done) break;
        if (Date.now() - lastProgress > MAX_DEAD_AIR) throw new Error("Stalled");
      } catch (err) {
        if (Date.now() - lastProgress > MAX_DEAD_AIR) break;
      }
      await new Promise(r => setTimeout(r, POLL_INTERVAL));
    }
    setBusy(false);
    loadAssets();
    // Persist final state
    setMessages(prev => {
      const next = [...prev];
      axios.patch(`${API}/sessions/${sessionId}/messages`, { messages: next }, { headers: getHeaders() }).catch(() => {});
      return next;
    });
  };

  const handleJobAction = async (jobId, action) => {
    try {
      await axios.post(`${API}/jobs/${jobId}/${action}`, {}, { headers: getHeaders() });
      toast.success(`Job ${action}ed`);
      
      // Hide the approval card in the UI
      setMessages(prev => prev.map(m => ({
        ...m,
        events: (m.events || []).map(e => 
          e.job_id === jobId && (
            (e.type === "info" && (e.content?.includes("approval") || e.content?.includes("confirmation"))) ||
            (e.type === "plan_propose")
          )
            ? { ...e, handled: true }
            : e
        )
      })));
    } catch (err) {
      toast.error(err.response?.data?.detail || `Failed to ${action} job`);
    }
  };

  const loadHistory = async () => {
    try {
      const { data } = await axios.get(`${API}/sessions/${sessionId}/messages`, { headers: getHeaders() });
      if (data && data.length > 0) {
        // Cleanup: Hide approval cards that already have results or are for inactive jobs
        const cleaned = data.map(m => ({
          ...m,
          events: (m.events || []).map((e, idx, arr) => {
            if ((e.type === "info" && (e.content?.includes("approval") || e.content?.includes("confirmation"))) || e.type === "plan_propose") {
              const hasResult = arr.slice(idx + 1).some(next => 
                next.job_id === e.job_id && (next.type === "tool_result" || next.type === "error")
              );
              if (hasResult) return { ...e, handled: true };
            }
            return e;
          })
        }));
        setMessages(cleaned);
        checkActiveJobs(cleaned);
      } else {
        setMessages([{ role: "assistant", content: `Session ready — what shall we create?`, timestamp: new Date().toISOString() }]);
      }
    } catch {
      setMessages([{ role: "assistant", content: `Session ready — what shall we create?`, timestamp: new Date().toISOString() }]);
    }
  };

  const checkActiveJobs = async (currentMessages) => {
    if (!sessionId) return;
    try {
      const { data } = await axios.get(`${API}/sessions/${sessionId}/jobs`, { headers: getHeaders() });
      const active = data.find(j => (j.status === "pending" || j.status === "processing") && j.id);
      if (active) {
        // If the last message is assistant but empty/no events, it might be the one for this job.
        let aIdx = currentMessages.length - 1;
        if (aIdx < 0 || currentMessages[aIdx].role !== "assistant") {
          // No assistant bubble to resume into, create a new one.
          setMessages(prev => {
            const next = [...prev, { role: "assistant", content: "", events: [], timestamp: new Date().toISOString() }];
            resumePolling(active.id, next.length - 1);
            return next;
          });
        } else {
          resumePolling(active.id, aIdx);
        }
      }
    } catch {}
  };

  const loadAssets = async () => {
    if (!sessionId) return;
    try {
      const { data } = await axios.get(`${API}/sessions/${sessionId}/assets`, { headers: getHeaders() });
      setAssets(data);
    } catch {}
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);
  
  const ensureSession = async () => {
    if (sessionId) return sessionId;
    const { data } = await axios.post(`${API}/sessions`, {}, { headers: getHeaders() });
    justCreatedSessionRef.current = true;
    if (inEmbedMode) {
      setActiveEmbedSession(data.id);
    } else {
      router.replace(`?session=${data.id}`, { scroll: false });
      fetchSessions();
    }
    return data.id;
  };

  const processFile = async (file) => {
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // 0. Make sure we have a session — uploaded assets must belong to one.
      const activeSessionId = await ensureSession();

      // 1. Get signed URL
      const { data: signData } = await axios.get("/api/v1/get_upload_url", {
        params: { filename: file.name },
        headers: getHeaders()
      });

      const { url, fields } = signData;
      
      // Use the proxy for the actual binary upload to maintain consistency and avoid CORS issues
      const formData = new FormData();
      formData.append("x-proxy-target-url", url);
      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value);
      });
      formData.append("file", file);

      // 2. Upload via local proxy
      await axios.post("/api/v1/upload-binary", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (pe) => {
          setUploadProgress(Math.round((pe.loaded * 100) / pe.total));
        }
      });

      // 3. Final URL
      const uploadedUrl = `https://cdn.muapi.ai/${fields.key}`;

      // 4. Register as a real session asset so the agent can address it as asset_N.
      const kind = file.type?.startsWith("video/") ? "video"
                 : file.type?.startsWith("audio/") ? "audio"
                 : "image";
      const { data: registered } = await axios.post(
        `${API}/sessions/${activeSessionId}/assets`,
        { url: uploadedUrl, kind, source_tool: "upload" },
        { headers: getHeaders() },
      );

      const att = { asset_label: registered.asset_label, url: uploadedUrl, kind };
      setAttachments(prev => [...prev, att]);
      // Reflect on the canvas immediately.
      setAssets(prev => [...prev, {
        asset_label: registered.asset_label, url: uploadedUrl, kind,
        source_tool: "upload", model: null, prompt: null,
      }]);
      toast.success(`Uploaded as ${registered.asset_label}`);
    } catch (err) {
      console.error("Upload failed", err);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileUpload = (e) => {
    processFile(e.target.files?.[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (busy || uploading) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (busy || uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const removeAttachment = (label) => {
    setAttachments(prev => prev.filter(a => a.asset_label !== label));
  };

  const sendMessage = async (textOverride = null, skillOverride = null, attachmentsOverride = null) => {
    const typed = (typeof textOverride === 'string' ? textOverride : input).trim();
    const currentAttachments = attachmentsOverride || attachments;
    if ((!typed && currentAttachments.length === 0) || busy) return;
    
    const currentSkill = skillOverride || activeSkill;

    
    let activeSessionId;
    try {
      activeSessionId = await ensureSession();
    } catch (err) {
      toast.error("Failed to establish session");
      return;
    }

    // Tell the LLM about any uploaded assets so it can call edit_image / image_to_video / etc.
    // by asset_label without us having to expose URLs in the user-visible bubble.
    const attachmentNote = currentAttachments.length
      ? "\n\n[Attached " + currentAttachments.map(a => `${a.asset_label} (${a.kind || "image"})`).join(", ") + "]"
      : "";
    const msg = typed + attachmentNote;
    const msgAttachments = [...currentAttachments];
    
    if (!attachmentsOverride) setAttachments([]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "24px";
    
    const userMsg = { 
      role: "user", 
      content: msg, 
      attachments: msgAttachments,
      timestamp: new Date().toISOString(),
      skill_name: currentSkill?.name
    };
    const updatedMessages = [...messages, userMsg];
    
    setMessages([...updatedMessages, { role: "assistant", content: "", events: [], timestamp: new Date().toISOString() }]);
    setBusy(true);

    const aIdx = updatedMessages.length; 
    
    try {
      let canvasState = null;
      try {
        canvasState = canvasRef.current?.getCanvasState?.() || null;
      } catch {}

      let endpoint = `${API}/sessions/${activeSessionId}/chat`;
      let payload = {
        message: typed,
        model: "gpt-5-mini",
        messages_snapshot: updatedMessages,
        canvas_state: canvasState,
      };

      // If a skill is pinned, use the run-skill endpoint
      if (currentSkill) {
        endpoint = `${API}/sessions/${activeSessionId}/run-skill`;
        // Map the user input to the first required input of the skill
        const primaryInputKey = currentSkill.inputs?.[0] || "premise";
        payload = {
          skill_name: currentSkill.name,
          inputs: { [primaryInputKey]: typed },
          messages_snapshot: updatedMessages,
          model: "gpt-5-mini"
        };
        if (!skillOverride) setActiveSkill(null); // Clear skill after sending if not override
      }

      const enqueueRes = await axios.post(endpoint, payload, { headers: getHeaders() });
      await resumePolling(enqueueRes.data.job_id, aIdx);
    } catch (err) {
      setMessages(prev => {
        const arr = [...prev];
        if (aIdx >= 0) arr[aIdx] = { ...arr[aIdx], content: `❌ ${err.message || err}` };
        return arr;
      });
    } finally {
      setBusy(false);
      await loadAssets();
      if (activeSessionId) {
        setMessages(prev => {
          const newMsgs = [...prev];
          axios.patch(`${API}/sessions/${activeSessionId}/messages`, { messages: newMsgs }, { headers: getHeaders() }).catch(() => {});
          return newMsgs;
        });
      }
    }
  };

  const markdownComponents = useMemo(() => ({
    a: ({ node, ...props }) => {
      const isMedia = props.href?.match(/\.(jpeg|jpg|gif|png|webp|avif)$/i);
      const isVideo = props.href?.match(/\.(mp4|webm|mov)$/i);
      if (isMedia) {
        return (
          <span className="block mt-2 mb-1">
            <a href={props.href} target="_blank" rel="noreferrer" className="block relative group overflow-hidden rounded border border-divider shadow-sm">
              <img src={props.href} alt="Generated Asset" className="w-full h-auto object-cover transition-transform group-hover:scale-105" />
              <span className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </a>
          </span>
        );
      }
      if (isVideo) {
        return (
          <span className="block mt-2 mb-1">
            <video src={props.href} controls className="w-full rounded border border-divider shadow-sm" />
          </span>
        );
      }
      return <a {...props} className="text-primary hover:underline underline-offset-4 font-bold" target="_blank" rel="noreferrer" />;
    },
    div: ({ node, ...props }) => <div {...props} />, 
    p: ({ node, ...props }) => <div className="mb-2 last:mb-0" {...props} />,
    pre: ({ node, ...props }) => <div className="my-3 overflow-x-auto rounded border border-divider" {...props} />,
    code: ({ node, inline, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={resolvedTheme === 'dark' ? oneDark : oneLight}
          language={match[1]}
          showLineNumbers
          PreTag="div"
          className="scrollbar-subtle !m-0 !p-3 text-[12px]"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[12px] font-mono" {...props}>
          {children}
        </code>
      );
    }
  }), [resolvedTheme]);


  // Sync assets to canvas once ref is ready — only push URLs not yet synced
  useEffect(() => {
    if (!sessionId || assets.length === 0) return;

    const newAssets = assets.filter(a => {
      const syncKey = `${a.asset_label || "no-label"}-${a.url}`;
      return !syncedUrlsRef.current.has(syncKey);
    });
    if (newAssets.length === 0) return;

    let attempts = 0;
    const sync = () => {
      if (canvasRef.current) {
        newAssets.forEach(a => {
          const syncKey = `${a.asset_label || "no-label"}-${a.url}`;
          if (!a.url || syncedUrlsRef.current.has(syncKey)) return;
          syncedUrlsRef.current.add(syncKey);
          
          const kind = a.kind || (a.url.match(/\.(mp4|webm|mov)$/i) ? "video" : a.url.match(/\.(mp3|wav|ogg|m4a)$/i) ? "audio" : "image");
          const label = a.asset_label || null;
          if (kind === "image") canvasRef.current.addImage(a.url, undefined, undefined, undefined, undefined, undefined, label);
          else if (kind === "video") canvasRef.current.addVideo(a.url, undefined, undefined, undefined, undefined, undefined, label);
          else if (kind === "audio") canvasRef.current.addAudio(a.url, undefined, undefined, undefined, label);
        });
        return true;
      }
      return false;
    };

    if (!sync()) {
      const timer = setInterval(() => {
        attempts++;
        if (sync() || attempts > 20) clearInterval(timer);
      }, 500);
      return () => clearInterval(timer);
    }
  }, [assets, sessionId]);

  const renameSession = async (id = null, name = null) => {
    const targetId = id || sessionId;
    const targetName = name || newName;
    const currentName = id ? (sessions.find(s => s.id === id)?.name) : currentSessionName;

    if (!targetId || !targetName.trim() || targetName.trim() === currentName) {
      setIsEditingName(false);
      setEditingSessionId(null);
      return;
    }
    try {
      await axios.patch(`${API}/sessions/${targetId}`, { name: targetName.trim() }, { headers: getHeaders() });
      if (targetId === sessionId) setCurrentSessionName(targetName.trim());
      setIsEditingName(false);
      setEditingSessionId(null);
      fetchSessions();
      toast.success("Session renamed");
    } catch {
      toast.error("Failed to rename session");
      setIsEditingName(false);
      setEditingSessionId(null);
    }
  };

  const deleteSession = async (id) => {
    // We use a simple confirm for safety, but with a premium look via toast if we had a custom one.
    // For now, standard confirm is reliable.
    if (!window.confirm("Are you sure you want to delete this session?")) return;
    try {
      await axios.delete(`${API}/sessions/${id}`, { headers: getHeaders() });
      toast.success("Session deleted");
      if (inEmbedMode) {
        if (id === sessionId) setActiveEmbedSession(null);
      } else {
        fetchSessions();
        if (id === sessionId) {
          router.push("/canvas");
        }
      }
    } catch (err) {
      toast.error("Failed to delete session");
    }
  };

  const handleMouseMove = useCallback((e) => {
    if (!isResizing.current) return;
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth > 300 && newWidth < 800) {
      setSidebarWidth(newWidth);
    }
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", stopResizing);
    document.body.style.cursor = "default";
    document.body.style.userSelect = "auto";
  }, [handleMouseMove]);

  const startResizing = useCallback((e) => {
    isResizing.current = true;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", stopResizing);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [handleMouseMove, stopResizing]);

  const selectMention = (item, type) => {
    const before = input.substring(0, mentionCursorPos);
    // mentionCursorPos is where @ is. query is after @.
    const after = input.substring(textareaRef.current.selectionStart);
    
    if (type === "skill") {
      setActiveSkill(item);
      setInput(before + after); 
    } else {
      const insertion = `@${item.asset_label}`;
      setInput(before + insertion + after);
    }
    
    setShowMentionPopup(false);
    setTimeout(() => textareaRef.current?.focus(), 10);
  };

  const copyToClipboard = async (text) => {
    if (!text) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          toast.success("Copied to clipboard");
        } catch (err) {
          toast.error("Failed to copy");
        }
        document.body.removeChild(textArea);
      }
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  const handleKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
  
  const filteredSkills = skills.filter(s => s.name.toLowerCase().includes(mentionQuery.toLowerCase()));
  const filteredAssets = assets.filter(a => (a.asset_label || "").toLowerCase().includes(mentionQuery.toLowerCase()));

  if (!mounted) return null;

  return (
    <div className="h-dvh w-full text-sm flex flex-col bg-bg-page text-primary-text overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Toaster position="top-right" reverseOrder={false} />
      <main className="flex h-full w-full overflow-hidden">
        {/* Left Sidebar: Session List — owner only. Embed visitors don't get
            a session switcher; the iframe is scoped to one localStorage-keyed
            session per embed code. */}
        <div className={`flex-shrink-0 flex flex-col bg-bg-card border-r border-divider shadow-[4px_0_12px_rgba(0,0,0,0.05)] z-20 transition-all duration-300 ${(showLeftSidebar || inEmbedMode) ? 'overflow-hidden w-0' : 'w-64'}`}>
          <div className="p-3 border-b border-divider flex items-center justify-between bg-bg-card/50">
            <div className="flex items-center gap-2 overflow-hidden">
              <Link 
                href="/"
                className={`p-2 hover:bg-bg-page rounded text-secondary-text hover:text-primary transition-colors`}
                title="Go Back"
              >
                <FiArrowLeft size={16} />
              </Link>
              <Link
                href="/"
                className="flex items-center flex-shrink-0 transition-transform duration-300 hover:scale-[1.02] active:scale-95"
                aria-label="Home"
              >
                <span className="font-bold text-lg">Design Agent Studio</span>
              </Link>
            </div>
            <button 
              onClick={() => setShowLeftSidebar(!showLeftSidebar)}
              className={`p-1.5 rounded transition-colors ${showLeftSidebar ? "bg-primary/10 text-primary" : "hover:bg-bg-card text-secondary-text hover:text-primary"}`}
              title="Toggle Sessions"
            >
              <VscLayoutSidebarLeftOff size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-subtle">
            {sessions.length === 0 ? (
              <div className="px-4 py-8 text-center text-secondary-text italic text-[11px]">No previous sessions</div>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.id}
                  onMouseEnter={() => setHoveredSessionId(s.id)}
                  onMouseLeave={() => setHoveredSessionId(null)}
                  className={`relative w-full flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-all border-l-2 group
                    ${sessionId === s.id ? "border-primary bg-primary/5" : "border-transparent hover:bg-bg-card-hover"}`}
                  onClick={() => {router.push(`?session=${s.id}`); setShowLeftSidebar(!showLeftSidebar);}}
                >
                  <div className="flex-1 min-w-0 pr-12">
                    {editingSessionId === s.id ? (
                      <input
                        autoFocus
                        className="bg-bg-card border border-primary px-2 py-1 rounded text-xs focus:outline-none w-full"
                        value={editingSessionName}
                        onChange={(e) => setEditingSessionName(e.target.value)}
                        onBlur={() => renameSession(s.id, editingSessionName)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") renameSession(s.id, editingSessionName);
                          if (e.key === "Escape") setEditingSessionId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <div className={`flex items-center gap-2 text-[13px] font-semibold transition-colors ${sessionId === s.id ? "text-primary" : "text-primary-text"}`}>
                        <span className="truncate flex-1">{s.name}</span>
                        <span className="flex items-center gap-1 text-[10px] text-secondary-text opacity-70">
                          <FiImage size={10} /> {s.asset_count}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Hover Actions */}
                  {hoveredSessionId === s.id && editingSessionId !== s.id && (
                    <div className="flex items-center gap-0.5 animate-fade-in absolute right-2 top-1/2 -translate-y-1/2 bg-bg-card/90 backdrop-blur-sm pl-2 py-1 rounded-l shadow-[-12px_0_12px_rgba(0,0,0,0.1)]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSessionId(s.id);
                          setEditingSessionName(s.name);
                        }}
                        className="p-1.5 hover:bg-bg-page rounded text-secondary-text hover:text-primary transition-colors"
                        title="Rename"
                      >
                        <FiEdit2 size={13} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(s.id);
                        }}
                        className="p-1.5 hover:bg-red-500/10 rounded text-secondary-text hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <HiOutlineTrash size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="p-3 border-t border-divider bg-bg-page/30">
            <div className="flex items-center justify-between text-[10px] text-secondary-text font-medium px-1">
              <span>Total Sessions</span>
              <span>{sessions.length}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col relative bg-bg-page flex-1 overflow-hidden">
          {/* Canvas Top Bar */}
          <div className="flex justify-between items-center z-10 p-2 border-b border-divider bg-bg-page">
            <div className="relative flex items-center gap-1">
              {!inEmbedMode && (
                <button
                  onClick={() => setShowLeftSidebar(!showLeftSidebar)}
                  className={`p-2 hover:bg-bg-card rounded transition-colors ${showLeftSidebar ? "text-primary" : "hidden"}`}
                  title="Toggle Sessions"
                >
                  <VscLayoutSidebarLeftOff size={18} />
                </button>
              )}

              {!inEmbedMode && (
                <Link
                  href="/"
                  className={`p-1.5 hover:bg-bg-card rounded text-secondary-text hover:text-primary transition-colors ${!showLeftSidebar && "hidden"}`}
                  title="Go Back"
                >
                  <FiArrowLeft size={16} />
                </Link>
              )}

              {inEmbedMode && (
                <button
                  onClick={() => setActiveEmbedSession(null)}
                  className="p-1.5 hover:bg-bg-card rounded text-secondary-text hover:text-primary transition-colors"
                  title="New chat"
                >
                  <FiPlus size={16} />
                </button>
              )}

              <div className="flex items-center gap-2 text-primary-text p-1.5">
                <span className="font-medium text-sm max-w-[200px] truncate">
                  {currentSessionName}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!inEmbedMode && (
                <div className="flex items-center gap-2 h-8 border border-divider rounded bg-bg-page/30 overflow-hidden px-2">
                  <span
                    suppressHydrationWarning
                    className="font-bold text-xs flex items-center text-primary-text truncate"
                  >
                    {userBalanceLabel ?? `$ ${user?.balance || "0.00"}`}
                  </span>
                </div>
              )}

              <div
                className={`relative outline-none flex items-center gap-2 ${inEmbedMode ? "hidden" : ""}`}
                tabIndex={-1}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget)) {
                    setOpenProfile(false);
                  }
                }}
              >
                <button 
                  onClick={() => setOpenProfile(!openProfile)}
                  className="w-8 h-8 rounded-full bg-primary/10 border border-primary flex items-center justify-center text-primary shadow-sm hover:bg-primary/20 transition-all overflow-hidden"
                >
                  {user?.profile_photo ? (
                    <img src={user.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold">
                      {(user?.username || "U").substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </button>
                {!showChat && (
                  <button
                    onClick={handleToggleSidebar}
                    className="w-8 h-8 rounded-full rotate-270 hover:bg-bg-page hover:text-primary-text transition-all flex items-center justify-center text-secondary-text z-[60]"
                    title="Open Chat"
                  >
                    <HiOutlineArrowUpTray size={18} />
                  </button>
                )}
                
                <div 
                  className={`absolute top-full right-0 mt-2 w-64 bg-bg-card border border-divider rounded shadow-2xl z-[100] py-1 transition-all duration-200 origin-top-right ${
                    openProfile ? "opacity-100 scale-100 visible translate-y-0" : "opacity-0 scale-95 invisible translate-y-2"
                  }`}
                >
                  <div className="px-4 py-3 border-b border-divider flex flex-col">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-primary-text truncate">
                        {user?.username || "User"}
                      </span>
                      {user?.plan === "pro" ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary text-white uppercase tracking-wider">
                          Pro
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/10 text-orange-500 border border-orange-500 uppercase tracking-wider">
                          Bronze
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-secondary-text truncate">
                      {user?.email}
                    </span>
                    <div className="mt-2 text-[13px] font-bold text-primary">
                      {userBalanceLabel ?? `$ ${user?.balance || "0.00"}`} <span className="font-normal text-secondary-text">available</span>
                    </div>
                  </div>
                  
                  <div className="py-1">
                    <a 
                      href="mailto:support@vadoo.tv"
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-bg-page transition-colors text-[13px] font-semibold text-primary-text"
                    >
                      Support
                    </a>
                  </div>
                  <div className="h-px bg-divider w-full my-1" />
                  <div className="py-1">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setTheme(resolvedTheme === "dark" ? "light" : "dark");
                      }}
                      className="w-full flex items-center justify-between px-4 py-2 hover:bg-bg-page transition-colors text-[13px] font-semibold text-primary-text"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-secondary-text">
                          {resolvedTheme === "dark" ? <FiSun size={15} /> : <FiMoon size={15} />}
                        </span>
                        Dark Mode
                      </div>
                      <div className={`w-8 h-4 rounded-full relative transition-colors ${resolvedTheme === "dark" ? "bg-primary" : "bg-bg-card-hover"}`}>
                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-black dark:bg-white transition-all ${resolvedTheme === "dark" ? "left-4.5" : "left-0.5"}`} />
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Canvas View */}
          <div className="flex-1 relative overflow-hidden bg-bg-page/50 w-full">
            <CanvasArea 
              ref={canvasRef} 
              theme={resolvedTheme}
              activeTasks={activeTasks}
              setActiveTasks={setActiveTasks}
              onZoomChange={setZoomLevel} 
            />

            {/* Floating Toolbar */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-bg-card border border-divider shadow-2xl px-2 py-1.5 rounded z-20">
              <div className="flex items-center gap-3 px-3">
                <span className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">{zoomLevel}%</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => canvasRef.current?.zoomOut()} className="w-5 h-5 rounded border border-divider flex items-center justify-center text-secondary-text hover:text-primary-text hover:border-primary transition-all">-</button>
                  <button onClick={() => canvasRef.current?.zoomIn()} className="w-5 h-5 rounded border border-divider flex items-center justify-center text-secondary-text hover:text-primary-text hover:border-primary transition-all">+</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resizer Handle */}
        <div 
          className="h-full cursor-col-resize hover:bg-primary w-1 transition-all z-10 group relative flex items-center justify-center"
          onMouseDown={startResizing}
        >
          {/* <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-divider group-hover:bg-primary/50 transition-colors" /> */}
          <div className="z-10 w-3 h-8 rounded-full bg-bg-card border border-divider shadow-sm flex flex-col items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity translate-x-[-0.5px]">
            <div className="w-0.5 h-0.5 rounded-full bg-primary-text" />
            <div className="w-0.5 h-0.5 rounded-full bg-primary-text" />
            <div className="w-0.5 h-0.5 rounded-full bg-primary-text" />
          </div>
        </div>

        {/* Right Panel: Chat Sidebar */}
        <div 
          className={`flex-shrink-0 flex flex-col bg-bg-card border-l border-divider shadow-[-10px_0_20px_rgba(0,0,0,0.02)] z-20 transition-all duration-300 ${!showChat ? 'overflow-hidden' : ''}`}
          style={{ width: sidebarWidth }}
        >
          {/* Sidebar Header */}
          <div className="p-4 flex items-center justify-between border-b border-divider bg-bg-card">
            <div className="flex flex-col">
              <h2 className="font-bold text-[13px] text-primary-text uppercase tracking-widest leading-none flex items-center gap-2">
                <RiSparklingLine className="text-primary" /> Creative Agent
              </h2>
              <span className="text-[10px] text-secondary-text mt-1.5">Auto Model • Multi-tool Access</span>
            </div>
            <div className="flex items-center gap-1">
              <Link 
                href="https://muapi.ai/docs/design-agent-api" 
                target="_blank"
                className="p-1.5 hover:bg-bg-page hover:text-primary-text transition-colors rounded text-secondary-text"
                title="API Docs"
              >
                <CgTerminal size={16} />
              </Link>
              {sessionId && (
                <button
                  onClick={() => {
                    if (inEmbedMode) setActiveEmbedSession(null);
                    else router.push("/canvas");
                  }}
                  className="p-1.5 hover:bg-bg-page hover:text-primary-text transition-colors rounded text-secondary-text"
                  title="New Session"
                >
                  <FiPlus size={16} />
                </button>
              )}
              <button
                onClick={handleToggleSidebar}
                className={`w-8 h-8 rounded-full transition-all flex items-center justify-center shrink-0 ${showChat ? "bg-primary/10 text-primary" : "hover:bg-bg-page text-secondary-text hover:text-primary"}`}
                title={showChat ? "Hide Chat" : "Open Chat"}
              >
                <FiLayout size={16} />
              </button>
            </div>
          </div>
          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-subtle">
            {messages.map((msg, idx) => {
              if (!msg) return null;
              const prevMsg = idx > 0 ? messages[idx - 1] : null;
              const showDateHeader = msg.timestamp && (
                !prevMsg || 
                !prevMsg.timestamp || 
                new Date(msg.timestamp).toDateString() !== new Date(prevMsg.timestamp).toDateString()
              );

              return (
                <React.Fragment key={idx}>
                  {showDateHeader && msg.timestamp && (
                    <div className="flex justify-center my-4">
                      <span className="px-2 py-1 bg-bg-page border border-divider rounded text-[10px] font-medium text-secondary-text shadow-sm">
                        {formatDateHeader(msg.timestamp)}
                      </span>
                    </div>
                  )}
                  <div className={`flex flex-col gap-2 ${msg.role === "user" ? "items-end" : "items-start"} animate-fade-in-up group`}>
                    <div className="flex items-center gap-2">
                      {msg.role === "assistant" && (
                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-secondary-text ml-1">
                          <RiRobot2Line /> Agent
                        </div>
                      )}
                      <div className={`flex items-center justify-end gap-2 text-[9px] text-secondary-text`}>
                        {msg.timestamp && <span>{formatTime(msg.timestamp)}</span>}
                      </div>
                      {msg.role === "user" && msg.skill_name && (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary w-fit ml-auto">
                          <RiSparklingLine size={10} /> {msg.skill_name}
                        </div>
                      )}
                    </div>
                    <div className={`max-w-[90%] space-y-2 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                      <div className="relative">
                        <div className={`px-3 py-2 text-[13px] leading-relaxed break-words relative
                          ${msg.role === "user" ? "bg-bg-card-hover text-primary-text rounded-md rounded-tr-none shadow-sm border border-divider" : "text-primary-text bg-bg-page rounded-md rounded-tl-none shadow-sm border border-divider"}`}>
                          
                          {msg.content ? (
                            msg.role === "assistant" ? (
                              <div className="prose dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/30">
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={markdownComponents}
                                >
                                  {msg.content}
                                </ReactMarkdown>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-2">
                                <div className="prose dark:prose-invert max-w-none text-primary-text prose-p:leading-relaxed">
                                  <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={markdownComponents}
                                  >
                                    {msg.content}
                                  </ReactMarkdown>
                                </div>
                                {msg.attachments && msg.attachments.length > 0 && (
                                  <div className="flex flex-col gap-2 mt-2 w-full">
                                    {msg.attachments.map(att => (
                                      <div key={att.asset_label} className="relative w-full rounded border border-white/20 overflow-hidden shadow-sm bg-black/10">
                                        {att.kind === "image" && (
                                          <img src={att.url} alt={att.asset_label} className="w-full max-h-64 object-contain" />
                                        )}
                                        {att.kind === "video" && (
                                          <video src={att.url} controls className="w-full max-h-64 object-contain" />
                                        )}
                                        {att.kind === "audio" && (
                                          <div className="p-2">
                                            <audio src={att.url} controls className="w-full" />
                                          </div>
                                        )}
                                        {!["image", "video", "audio"].includes(att.kind) && (
                                          <div className="w-full p-4 flex items-center justify-center text-[10px] text-white/70">
                                            {att.kind}: {att.asset_label}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          ) : (msg.role === "assistant" && busy) && (
                            <TypingDots />
                          )}
                          
                          {(msg.events || []).filter(e => e && ["tool_call", "tool_result", "plan_propose", "error", "info"].includes(e.type)).map((ev, i) => (
                            <EventPill key={i} event={{...ev, onAction: handleJobAction}} />
                          ))}
                        </div>

                        {/* Copy Button - Hover only */}
                        <button 
                          onClick={() => copyToClipboard(msg.content)}
                          className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded bg-bg-card border border-divider shadow-md hover:text-primary z-10
                            ${msg.role === "user" ? "right-full mr-2" : "left-full ml-2"}`}
                          title="Copy Message"
                        >
                          <FiCopy size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
            
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input Area */}
          <div className="p-2 bg-bg-card">
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`rounded border bg-bg-card shadow-sm flex flex-col transition-all relative
                ${isDragging ? "border-dashed border-primary bg-primary/5 ring-4 ring-primary/10" : ""}
                ${busy ? "border-primary ring-1 ring-primary/20" : "border-divider focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary"}`}
            >
              {activeSkill && (
                <div className="flex items-center gap-2 p-1 animate-fade-in-up">
                  <button 
                    onClick={() => setActiveSkill(null)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-bg-page border border-divider text-xs hover:bg-red-500 hover:text-white transition-colors"
                  >
                    <FiX size={12} />
                    <span>{activeSkill.name}</span>
                  </button>
                </div>
              )}
              {isDragging && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-primary/5 backdrop-blur-[1px] pointer-events-none rounded">
                  <div className="bg-primary/10 p-4 rounded-full border-2 border-primary animate-pulse">
                    <FiUpload className="text-primary" size={32} />
                  </div>
                </div>
              )}
              {showMentionPopup && (
                <div className="absolute bottom-full left-0 mb-2 flex items-end gap-3 z-50">
                  <div className="w-72 bg-bg-card border border-divider rounded shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="p-2 border-b border-divider text-[10px] font-bold text-secondary-text uppercase tracking-widest bg-bg-page/50">
                      Mentions
                    </div>
                    <div className="max-h-60 overflow-y-auto scrollbar-subtle py-1">
                      {filteredAssets.length > 0 && (
                        <div className="px-3 py-1.5 mt-1 text-[9px] font-bold text-green-500 uppercase opacity-60">Assets</div>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        {filteredAssets.map(asset => (
                          <button
                            key={asset.asset_label}
                            onClick={() => selectMention(asset, "asset")}
                            className="w-full text-left px-3 py-2 hover:bg-bg-page transition-colors flex items-center gap-2 group rounded"
                          >
                            {asset.kind === "image" && <img src={asset.url} className="w-7 h-7 rounded border border-divider object-cover shadow-sm" />}
                            {asset.kind === "video" && <video src={asset.url} className="w-7 h-7 rounded border border-divider object-cover shadow-sm" />}
                            {asset.kind === "audio" && <div className="w-7 h-7 rounded flex items-center justify-center bg-primary/5 text-primary text-[8px] font-bold uppercase tracking-tight">Audio</div>}
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-primary-text">{asset.asset_label}</span>
                              <span className="text-[9px] text-secondary-text truncate max-w-[200px]">{asset.kind}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                      {filteredSkills.length > 0 && (
                        <div className="px-3 py-1.5 text-[9px] font-bold text-primary uppercase opacity-60">Skills</div>
                      )}
                      {filteredSkills.map(skill => (
                        <button
                          key={skill.name}
                          onClick={() => selectMention(skill, "skill")}
                          className="w-full text-left px-3 py-2 hover:bg-bg-page transition-colors flex items-center gap-2 group"
                        >
                          <RiSparklingLine size={12} className="text-primary opacity-50 group-hover:opacity-100" />
                          <span className="text-xs font-medium text-primary-text">{skill.name}</span>
                        </button>
                      ))}                      
                      {filteredSkills.length === 0 && filteredAssets.length === 0 && (
                        <div className="px-4 py-8 text-center text-secondary-text text-xs italic opacity-50">No matches found</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <textarea
                ref={textareaRef}
                value={input}
                autoFocus
                onChange={(e) => {
                  const val = e.target.value;
                  const pos = e.target.selectionStart;
                  setInput(val);
                  
                  // Simple mention detection: check if last char before cursor is @ or if we are already in mention mode
                  const lastAtPos = val.lastIndexOf("@", pos - 1);
                  if (lastAtPos !== -1 && (lastAtPos === 0 || val[lastAtPos - 1] === " ")) {
                    const query = val.substring(lastAtPos + 1, pos);
                    if (!query.includes(" ")) {
                      setMentionQuery(query);
                      setMentionCursorPos(lastAtPos);
                      setShowMentionPopup(true);
                    } else {
                      setShowMentionPopup(false);
                    }
                  } else {
                    setShowMentionPopup(false);
                  }
                }}
                onKeyDown={handleKey}
                onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
                placeholder={activeSkill ? `Oh, Let us create ${activeSkill.name.toLowerCase()}s, start with your ${activeSkill.inputs?.[0]?.replace(/_/g, ' ') || 'idea'}?` : "Start with an idea or mention assets using @..."}
                className="w-full bg-transparent px-3 py-3 text-[13px] resize-none focus:outline-none min-h-[50px] max-h-[120px] scrollbar-subtle"
                rows={1}
                disabled={busy}
              />

              {(uploading || attachments.length > 0 || input.includes("@")) && (
                <div className="flex flex-wrap gap-2 border-b px-3 border-divider bg-bg-page/20">
                  {/* Real Attachments */}
                  {attachments.map((att) => (
                    <div 
                      key={att.asset_label} 
                      className="relative group flex items-center gap-2 px-2 py-1 bg-bg-card border border-divider rounded-lg shadow-sm cursor-help transition-all hover:border-primary"
                      onMouseEnter={() => setHoveredAsset(att)}
                      onMouseLeave={() => setHoveredAsset(null)}
                    >
                      <div className="w-5 h-5 rounded overflow-hidden">
                        {att.kind === "image" ? <img src={att.url} className="w-full h-full object-cover" /> : <FiTerminal size={10} />}
                      </div>
                      <span className="text-[10px] font-bold text-secondary-text">{att.asset_label}</span>
                    </div>
                  ))}
                  
                  {/* Mentioned Assets (not in attachments but in text) */}
                  {assets.filter(a => input.includes(`@${a.asset_label}`) && !attachments.find(att => att.asset_label === a.asset_label)).map((a) => (
                    <div 
                      key={a.asset_label} 
                      className="relative group flex items-center gap-2 px-2 py-1 bg-primary/5 border border-primary rounded-lg shadow-sm cursor-help transition-all hover:border-primary"
                      onMouseEnter={() => setHoveredAsset(a)}
                      onMouseLeave={() => setHoveredAsset(null)}
                    >
                      <div className="w-5 h-5 rounded overflow-hidden bg-primary/10 flex items-center justify-center text-primary">
                        {a.kind === "image" ? 
                          <img src={a.url} className="w-full h-full object-cover" /> 
                          : a.kind === "video" ?
                          <video src={a.url} className="w-full h-full object-cover" />
                          : a.kind === "audio" ?
                          <audio src={a.url} className="w-full h-full object-cover" />
                          : <RiSparklingLine size={10} />
                        }
                      </div>
                      <span className="text-[10px] font-bold text-primary">{a.asset_label}</span>
                    </div>
                  ))}
                  {uploading && (
                    <div className="flex items-center gap-2 px-2 py-1 bg-bg-page border border-divider border-dashed rounded-lg">
                      <div className="w-4 h-4 border-2 border-t-transparent border-primary rounded-full animate-spin" />
                      <span className="text-[10px] font-bold text-secondary-text">{uploadProgress}%</span>
                    </div>
                  )}
                </div>
              )}

              {hoveredAsset && (
                <div className="absolute bottom-full left-4 w-72 aspect-square bg-bg-card border border-divider rounded-md shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] overflow-hidden z-[110] animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
                  {hoveredAsset.kind === "image" ? (
                    <img src={hoveredAsset.url} className="w-full h-full object-cover" />
                  ) : hoveredAsset.kind === "video" ? (
                    <video src={hoveredAsset.url} className="w-full h-full object-cover" autoPlay muted loop />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-bg-page">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <FiTerminal size={32} />
                      </div>
                      <span className="text-xs font-bold text-secondary-text uppercase tracking-widest">{hoveredAsset.kind} Preview</span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                    <div className="text-sm font-bold text-white tracking-tight">{hoveredAsset.asset_label}</div>
                    <div className="text-[10px] text-white/70 mt-1 uppercase tracking-widest font-bold">{hoveredAsset.kind} • Creative Asset</div>
                  </div>
                </div>
              )}

              <div className="px-3 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef} 
                    accept="image/*,video/*,audio/*"
                    onChange={handleFileUpload}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="p-1.5 rounded hover:bg-bg-page text-secondary-text transition-all"
                    title="Upload Image"
                  >
                    <FiUpload size={16} />
                  </button>

                  <div 
                    className="relative"
                    tabIndex={-1}
                    onBlur={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget)) {
                        setShowSkillsMenu(false);
                      }
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setShowSkillsMenu(!showSkillsMenu)}
                      className={`p-1.5 rounded hover:bg-bg-page transition-all flex items-center gap-1.5
                        ${showSkillsMenu ? "bg-bg-page text-primary shadow-inner" : "text-secondary-text"}`}
                      title="Agent Skills"
                    >
                      <GoBook size={16} />
                    </button>

                    {showSkillsMenu && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-[320px] bg-bg-card border border-divider rounded shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="px-4 py-3 border-b border-divider flex items-center justify-between bg-bg-page/30">
                          <div>
                            <h3 className="text-[12px] font-bold text-primary-text uppercase tracking-tight">Expert Skills</h3>
                          </div>
                          <Link 
                            href="https://muapi.ai/docs/design-agent-api"
                            target="_blank" 
                            className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                          >
                            <CgTerminal size={10} />
                            API Docs
                          </Link>
                        </div>
                        <div className="max-h-80 overflow-y-auto p-1.5 scrollbar-subtle">
                          {skills.map(skill => (
                            <button
                              key={skill.name}
                              onClick={() => {
                                setActiveSkill(skill);
                                setShowSkillsMenu(false);
                                textareaRef.current?.focus();
                              }}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded hover:bg-bg-page transition-all text-left group ${activeSkill?.name === skill.name ? "bg-primary/5 border border-primary" : "border border-transparent"}`}
                            >
                              <div className={`w-8 h-8 rounded flex items-center justify-center transition-colors shadow-sm ${activeSkill?.name === skill.name ? "bg-primary text-white" : "bg-bg-page text-primary border border-divider group-hover:bg-primary group-hover:text-white"}`}>
                                <RiSparklingLine size={16} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={`font-bold capitalize text-[12px] transition-colors ${activeSkill?.name === skill.name ? "text-primary" : "text-primary-text group-hover:text-primary"}`}>
                                  {skill.name}
                                </div>
                                <div className="text-[10px] text-secondary-text mt-0.5 line-clamp-1 opacity-70 italic">{skill.description || "Specialized workflow"}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                        <div className="p-2.5 bg-bg-page/50 border-t border-divider text-center">
                          <button 
                            onClick={() => setShowSkillsMenu(false)}
                            className="text-[10px] font-bold text-secondary-text hover:text-primary-text transition-colors"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div 
                    className="relative"
                    tabIndex={-1}
                    onBlur={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget)) {
                        setShowAssetsMenu(false);
                      }
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setShowAssetsMenu(!showAssetsMenu)}
                      className={`p-1.5 rounded hover:bg-bg-page transition-all flex items-center gap-1.5
                        ${showAssetsMenu ? "bg-bg-page text-primary shadow-inner" : "text-secondary-text"}`}
                      title="Session Assets"
                    >
                      <FiImage size={16} />
                    </button>

                    {showAssetsMenu && (
                      <div className="absolute bottom-full right-0 mb-2 w-72 bg-bg-card border border-divider rounded shadow-2xl z-30 animate-fade-in-up">
                        <div className="p-2 mb-2 border-b border-divider text-[10px] font-bold text-secondary-text flex items-center justify-between">
                          <span>Session Assets</span>
                          <span className="opacity-50">{assets.length} items</span>
                        </div>
                        <div className="max-h-80 overflow-y-auto scrollbar-subtle p-2 grid grid-cols-3 gap-2">
                          {assets.length === 0 ? (
                            <div className="col-span-3 py-8 text-center text-secondary-text text-[10px] italic">No assets generated yet</div>
                          ) : (
                            assets.map((asset, i) => (
                              <div 
                                key={i}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInput(prev => prev + (prev ? " " : "") + asset.asset_label);
                                  setShowAssetsMenu(false);
                                  textareaRef.current?.focus();
                                }}
                                className="group relative aspect-square rounded border border-divider overflow-hidden bg-bg-page/50 hover:border-primary transition-all cursor-pointer"
                              >
                                {asset.kind === "image" && <img src={asset.url} className="w-full h-full object-cover" />}
                                {asset.kind === "video" && <video src={asset.url} className="w-full h-full object-cover" />}
                                {asset.kind === "audio" && <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary text-[8px] font-bold uppercase tracking-tight">Audio</div>}
                                
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-1 text-center">
                                  <span className="text-[10px] text-white font-bold truncate w-full mb-1">{asset.asset_label}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => sendMessage()}
                    disabled={busy || (!input.trim() && attachments.length === 0)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm ml-1
                      ${busy || (!input.trim() && attachments.length === 0)
                        ? "bg-[var(--bg-card-hover)] text-[var(--text-muted)] cursor-not-allowed"
                        : "bg-primary text-white hover:scale-105"}`}
                  >
                    {busy ? <BiLoaderAlt size={14} className="animate-spin" /> : <FiSend size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}



// ── Event pills ────────────────────────────────────────────────────────────────
const TOOL_ICONS = {
  generate_image: "🎨", edit_image: "✏️", generate_video: "🎬",
  image_to_video: "🎥", edit_video: "🎞️", lipsync_video: "💋",
  concat_videos: "🔗", generate_audio: "🎵", enhance_image: "✨",
  upload_file: "📤", list_models: "📚", ask_user: "❓",
  propose_plan: "📋", list_assets: "📁", get_asset: "🔍", remaining_budget: "💰",
};

function EventPill({ event }) {
  if (event.type === "tool_call") return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-primary/10 border border-primary text-primary text-[11px] mt-1 shadow-sm">
      <span>{TOOL_ICONS[event.name] || "🔧"}</span>
      <span className="font-semibold">{event.name}</span>
    </div>
  );

  if (event.type === "tool_result") {
    const ok = event.result?.ok !== false;
    const model = event.result?.model;
    if (event.name === "ask_user" && event.result?.ask_user) {
      const choices = event.result.choices || [];
      return (
        <div className="px-3 py-2 rounded bg-bg-page border border-primary text-[12px] mt-1 shadow-sm">
          <div className="font-semibold text-primary mb-1">❓ {event.result.question}</div>
          {choices.length > 0 && (
            <div className="flex flex-col gap-1 mt-1">
              {choices.map((c, i) => (
                <div key={i} className="text-secondary-text">{i + 1}. {c}</div>
              ))}
            </div>
          )}
          <div className="text-[10px] text-secondary-text mt-1.5 italic">Reply to continue.</div>
        </div>
      );
    }
    return (
      <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] border mt-1 shadow-sm ${
        ok
          ? "bg-[var(--color-success-bg)] text-[var(--color-success)] border-[var(--color-success)]"
          : "bg-[var(--color-error-bg)] text-[var(--color-error)] border-[var(--color-error)]"
      }`}>
        {ok ? <FiCheck size={11} /> : <FiX size={11} />}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="font-semibold">
            {ok
              ? (event.asset ? `Generated ${event.asset.kind}` : `Done`)
              : `Failed`}
          </span>
          {ok && model && (
            <span className="text-[9px] font-bold uppercase tracking-tight opacity-80">
              {model}
            </span>
          )}
          {!ok && event.result?.error && (
            <span className="text-[9px] opacity-70 truncate max-w-[160px]" title={event.result.error}>
              ↺ {String(event.result.error).replace(/^\w+Error:\s*/i, "").substring(0, 60)}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (event.type === "plan_propose") {
    if (event.handled) return null;
    return (
    <div className="flex flex-col gap-2">
      <PlanVisualizer plan={event} />
      <div className="flex items-center gap-2 px-2 pb-2">
        <button 
          onClick={() => event.onAction?.(event.job_id, "approve")}
          className="flex-1 py-2 rounded bg-primary text-white text-[12px] font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2"
        >
          <FiCheck /> Approve & Execute
        </button>
        <button 
          onClick={() => event.onAction?.(event.job_id, "reject")}
          className="px-4 py-2 rounded bg-bg-card border border-divider text-secondary-text text-[12px] hover:bg-bg-page transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
    );
  }

  if (event.type === "info") {
    // If this is an approval request, check if we should show buttons.
    // We avoid showing buttons on the info pill if there's a detailed plan_propose 
    // card already handling the approval for this job.
    const isApproval = event.needs_approval || event.content?.includes("Waiting for approval") || event.content?.includes("Awaiting confirmation");
    
    // If it's already handled, we might want to hide it or show it as a simple label
    if (event.handled && isApproval) return null;

    return (
      <div className={`px-3 py-2 rounded border text-[11px] mt-1 shadow-sm flex items-center justify-between ${
        isApproval ? "bg-primary/5 border-primary" : "bg-bg-page border-divider"
      }`}>
        <div className={`flex items-center gap-2 ${isApproval ? "text-primary" : "text-secondary-text"}`}>
          {isApproval ? <FiAlertCircle size={14} className="animate-pulse" /> : <FiTerminal size={12} className="opacity-50" />}
          <span className="flex-1">{event.content}</span>
        </div>
        {isApproval && !event.handled && (
          <div className="flex items-center gap-1 ml-4">
            <button 
              onClick={() => event.onAction?.(event.job_id, "approve")}
              className="px-2 py-1 rounded bg-primary text-white text-[10px] font-bold hover:brightness-110 transition-all"
            >
              Approve
            </button>
            <button 
              onClick={() => event.onAction?.(event.job_id, "reject")}
              className="px-2 py-1 rounded bg-bg-card border border-divider text-secondary-text text-[10px] hover:bg-bg-page transition-all"
            >
              Reject
            </button>
          </div>
        )}
      </div>
    );
  }

  if (event.type === "error") return (
    <div className="px-2.5 py-1.5 rounded bg-[var(--color-error-bg)] text-[var(--color-error)] border border-[var(--color-error)] text-[11px] mt-1 shadow-sm">
      ❌ {event.message}
    </div>
  );

  return null;
}
