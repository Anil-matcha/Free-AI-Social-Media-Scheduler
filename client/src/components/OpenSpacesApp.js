"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import IconRail from "./IconRail";
import OpenSpacesSidebar from "./OpenSpacesSidebar";
import SpaceSidebar from "./SpaceSidebar";
import SpaceLibrary from "./SpaceLibrary";
import PageHeaderBar from "./PageHeaderBar";
import CanvasPage from "./CanvasPage";
import HomeWorkView from "./HomeWorkView";
import ChatDrawer from "./ChatDrawer";
import AuthModal from "./AuthModal";

const API_BASE = "http://localhost:8000/api";
const STORAGE_KEY = "open_spaces_chat_history";
const LAST_ROUTE_KEY = "open_spaces_last_route";

const generateUUID = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "u_" + Math.random().toString(36).slice(2, 11) + "_" + Date.now().toString(36);
};

export default function OpenSpacesApp({
  initialRailTab = "home", // Default to "home" view on the homepage
  initialSpaceId = null,
  initialPageId = null,
  initialChatId = null,
}) {
  // Auth & Multi-User State (Strict Auth - No fallback user data)
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [activeRailTab, setActiveRailTab] = useState(initialRailTab);
  const [activeProject, setActiveProject] = useState("General");
  const [selectedModel, setSelectedModel] = useState("gpt-6-1-sol");

  // Real Chat conversation history with UUIDs
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(initialChatId);
  const [conversation, setConversation] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Spaces and Pages state (with UUIDs & URL persistence)
  const [spaces, setSpaces] = useState([]);
  const [activeSpaceId, setActiveSpaceId] = useState(initialSpaceId);
  const [pages, setPages] = useState([]);
  const [activePageId, setActivePageId] = useState(initialPageId);
  const [openPageIds, setOpenPageIds] = useState(initialPageId ? [initialPageId] : []);
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Saved");
  const [saveTrigger, setSaveTrigger] = useState(0);

  // Ref tracking activeSpaceId to avoid recreating callbacks
  const activeSpaceIdRef = useRef(activeSpaceId);
  useEffect(() => {
    activeSpaceIdRef.current = activeSpaceId;
  }, [activeSpaceId]);

  // Dynamic Auth Headers based strictly on authenticated user (memoized to prevent render loops)
  const authHeaders = useMemo(() => {
    return currentUser?.id
      ? { "X-User-Id": currentUser.id, Authorization: `Bearer ${currentUser.id}` }
      : {};
  }, [currentUser?.id]);

  // Track initialization
  const initializedFromUrlRef = useRef(false);

  // Load authenticated user on initial render - no fallback dummy data
  useEffect(() => {
    try {
      const stored = localStorage.getItem("open_spaces_user");
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      } else {
        setCurrentUser(null);
      }
    } catch (_) {
      setCurrentUser(null);
    } finally {
      setIsAuthChecking(false);
    }
  }, []);

  // 1. Load real chat history from localStorage on initial render
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setConversations(parsed);
          // If initialChatId was passed, restore that conversation
          if (initialChatId) {
            const found = parsed.find((c) => c.id === initialChatId);
            if (found) {
              setConversation(found.messages || []);
              if (found.model) setSelectedModel(found.model);
            }
          }
        }
      }
    } catch (e) {
      console.warn("Could not load chat history from localStorage:", e);
    }
  }, [initialChatId]);

  // Helper to persist conversations
  const persistConversations = (list) => {
    setConversations(list);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn("Could not save chat history to localStorage:", e);
    }
  };

  // Helper to update browser URL and remember last route safely outside React render phase
  const updateRoute = useCallback((route) => {
    try {
      let path = "/";
      if (route.tab === "home") {
        path = route.chatId ? `/c/${route.chatId}` : "/";
      } else {
        if (route.spaceId && route.pageId) {
          path = `/spaces/${route.spaceId}/pages/${route.pageId}`;
        } else if (route.spaceId) {
          path = `/spaces/${route.spaceId}`;
        }
      }

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(LAST_ROUTE_KEY, JSON.stringify(route));
        } catch (_) {}

        if (window.location.pathname !== path) {
          // Defer pushState to microtask so React render finishes before Next.js Router is notified
          queueMicrotask(() => {
            if (window.location.pathname !== path) {
              window.history.pushState(null, "", path);
            }
          });
        }
      }
    } catch (err) {
      console.warn("Error updating route URL:", err);
    }
  }, []);

  // Action notification toast state & timer
  const [toastMessage, setToastMessage] = useState("");
  const toastTimerRef = useRef(null);

  // Action guard: "don't block ui when no login just say login first when any action triggers"
  const requireLogin = useCallback((actionName = "perform this action") => {
    if (!currentUser) {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      setToastMessage(`Please login first to ${actionName}.`);
      toastTimerRef.current = setTimeout(() => {
        setToastMessage("");
      }, 4500);
      return false;
    }
    return true;
  }, [currentUser]);

  // 2. Fetch Spaces on load (public viewing supported so UI is never blocked)
  const fetchSpaces = useCallback(async (overrideUserId = null) => {
    const userId = overrideUserId || currentUser?.id;
    try {
      const effectiveHeaders = userId
        ? { "X-User-Id": userId, "Authorization": `Bearer ${userId}` }
        : {};
      const res = await fetch(`${API_BASE}/spaces`, { headers: effectiveHeaders });
      if (res.ok) {
        const data = await res.json();
        setSpaces(data);

        // If current active space doesn't exist in data, select first space
        if (data.length > 0) {
          const match = data.find((s) => s.id === activeSpaceIdRef.current);
          if (!match) {
            setActiveSpaceId(data[0].id);
            setActivePageId(null);
          }
        }

        // Parse path from URL if initial props were not passed
        const pathname = typeof window !== "undefined" ? window.location.pathname : "";
        const spacePageMatch = pathname.match(/^\/spaces\/([^/]+)\/pages\/([^/]+)$/);
        const spaceMatch = pathname.match(/^\/spaces\/([^/]+)$/);
        const chatMatch = pathname.match(/^\/c\/([^/]+)$/);

        if (!initializedFromUrlRef.current) {
          initializedFromUrlRef.current = true;

          if (initialSpaceId || spacePageMatch || spaceMatch) {
            const sId = initialSpaceId || spacePageMatch?.[1] || spaceMatch?.[1];
            const pId = initialPageId || spacePageMatch?.[2] || null;
            setActiveRailTab("spaces");
            setActiveSpaceId(sId);
            setActivePageId(pId);
          } else if (initialChatId || chatMatch) {
            const cId = initialChatId || chatMatch?.[1];
            setActiveRailTab("home");
            setActiveConversationId(cId);
          } else {
            // Check localStorage for last visited route
            try {
              const savedRoute = localStorage.getItem(LAST_ROUTE_KEY);
              if (savedRoute) {
                const parsed = JSON.parse(savedRoute);
                if (parsed.tab === "spaces" && parsed.spaceId) {
                  setActiveRailTab("spaces");
                  setActiveSpaceId(parsed.spaceId);
                  setActivePageId(parsed.pageId || null);
                  updateRoute(parsed);
                  return;
                } else if (parsed.tab === "home" && parsed.chatId) {
                  setActiveRailTab("home");
                  setActiveConversationId(parsed.chatId);
                  updateRoute(parsed);
                  return;
                }
              }
            } catch (_) {}

            // Default to home tab on homepage root
            setActiveRailTab("home");
            if (data.length > 0) {
              setActiveSpaceId(data[0].id);
              setActivePageId(null);
            }
          }
        }
      }
    } catch (err) {
      console.warn("Backend connecting on port 8000...", err);
    }
  }, [currentUser?.id, initialSpaceId, initialPageId, initialChatId, updateRoute]);

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces, currentUser?.id]);

  // Auth Action Handlers
  const handleAuthSuccess = useCallback((user, token) => {
    setCurrentUser(user);
    try {
      localStorage.setItem("open_spaces_user", JSON.stringify(user));
      if (token) localStorage.setItem("open_spaces_token", token);
    } catch (_) {}
    setAuthModalOpen(false);
    setToastMessage(`Welcome back, ${user.name}!`);
    setTimeout(() => setToastMessage(""), 3500);
    fetchSpaces(user.id);
  }, [fetchSpaces]);

  const handleLogout = useCallback(() => {
    try {
      localStorage.removeItem("open_spaces_user");
      localStorage.removeItem("open_spaces_token");
    } catch (_) {}
    setCurrentUser(null);
    setToastMessage("Signed out. You can browse spaces in guest view.");
    setTimeout(() => setToastMessage(""), 4000);
    fetchSpaces();
  }, [fetchSpaces]);

  // 3. Fetch Active Space Pages & Messages
  const fetchSpaceDetails = useCallback(async (spaceId, targetPageId = null) => {
    if (!spaceId) return;
    try {
      const pRes = await fetch(`${API_BASE}/spaces/${spaceId}/pages`, { headers: authHeaders });
      if (pRes.ok) {
        const pData = await pRes.json();
        setPages(pData);
        if (targetPageId) {
          const match = pData.find((p) => p.id === targetPageId);
          if (match) {
            setActivePageId(targetPageId);
          }
        }
      }

      const mRes = await fetch(`${API_BASE}/spaces/${spaceId}/messages`, { headers: authHeaders });
      if (mRes.ok) {
        const mData = await mRes.json();
        setMessages(mData);
      }
    } catch (err) {
      console.error("Error fetching space details:", err);
    }
  }, [authHeaders]);

  useEffect(() => {
    if (activeSpaceId) {
      fetchSpaceDetails(activeSpaceId);
    }
  }, [activeSpaceId, fetchSpaceDetails]);

  // Handle browser Back / Forward buttons (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const pathname = window.location.pathname;
      const spacePageMatch = pathname.match(/^\/spaces\/([^/]+)\/pages\/([^/]+)$/);
      const spaceMatch = pathname.match(/^\/spaces\/([^/]+)$/);
      const chatMatch = pathname.match(/^\/c\/([^/]+)$/);

      if (spacePageMatch) {
        setActiveRailTab("spaces");
        setActiveSpaceId(spacePageMatch[1]);
        setActivePageId(spacePageMatch[2]);
        setOpenPageIds((prev) => (prev.includes(spacePageMatch[2]) ? prev : [...prev, spacePageMatch[2]]));
      } else if (spaceMatch) {
        setActiveRailTab("spaces");
        setActiveSpaceId(spaceMatch[1]);
        setActivePageId(null);
      } else if (chatMatch) {
        setActiveRailTab("home");
        setActiveConversationId(chatMatch[1]);
        const found = conversations.find((c) => c.id === chatMatch[1]);
        if (found) {
          setConversation(found.messages || []);
        }
      } else {
        // Root /
        setActiveRailTab("home");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [conversations]);

  // Keep openPageIds in sync with activePageId
  useEffect(() => {
    if (activePageId) {
      setOpenPageIds((prev) => (prev.includes(activePageId) ? prev : [...prev, activePageId]));
    }
  }, [activePageId]);

  const activeSpace = spaces.find((s) => s.id === activeSpaceId) || spaces[0];
  const activePage = pages.find((p) => p.id === activePageId);

  // Navigation handlers
  const handleSelectRailTab = (tab) => {
    setActiveRailTab(tab);
    if (tab === "spaces") {
      updateRoute({
        tab: "spaces",
        spaceId: activeSpaceId || spaces[0]?.id,
        pageId: activePageId,
      });
    } else {
      updateRoute({
        tab: "home",
        chatId: activeConversationId,
      });
    }
  };

  const handleSelectSpace = (spaceId) => {
    setActiveSpaceId(spaceId);
    setActivePageId(null);
    setOpenPageIds([]);
    setActiveRailTab("spaces");
    updateRoute({ tab: "spaces", spaceId, pageId: null });
  };

  const handleSelectPage = (pageId) => {
    setActivePageId(pageId);
    setOpenPageIds((prev) => (prev.includes(pageId) ? prev : [...prev, pageId]));
    setActiveRailTab("spaces");
    updateRoute({ tab: "spaces", spaceId: activeSpaceId, pageId });
  };

  const handleClosePageTab = (pageIdToClose) => {
    const remaining = openPageIds.filter((id) => id !== pageIdToClose);
    setOpenPageIds(remaining);

    if (activePageId === pageIdToClose) {
      if (remaining.length > 0) {
        const nextActiveId = remaining[remaining.length - 1];
        setActivePageId(nextActiveId);
        updateRoute({ tab: "spaces", spaceId: activeSpaceId, pageId: nextActiveId });
      } else {
        setActivePageId(null);
        updateRoute({ tab: "spaces", spaceId: activeSpaceId, pageId: null });
      }
    }
  };

  const handleBackToLibrary = () => {
    setActivePageId(null);
    updateRoute({ tab: "spaces", spaceId: activeSpaceId, pageId: null });
  };

  // Handlers for real conversation management
  const handleNewChat = () => {
    if (!requireLogin("start a new chat")) return;
    setActiveConversationId(null);
    setConversation([]);
    setActiveRailTab("home");
    updateRoute({ tab: "home", chatId: null });
  };

  const handleSelectConversation = (id) => {
    const found = conversations.find((c) => c.id === id);
    if (found) {
      setActiveConversationId(id);
      setConversation(found.messages || []);
      if (found.model) {
        setSelectedModel(found.model);
      }
      setActiveRailTab("home");
      updateRoute({ tab: "home", chatId: id });
    }
  };

  const handleDeleteConversation = (id, e) => {
    if (e) e.stopPropagation();
    if (!requireLogin("delete conversations")) return;
    const updated = conversations.filter((c) => c.id !== id);
    persistConversations(updated);
    if (activeConversationId === id) {
      setActiveConversationId(null);
      setConversation([]);
      updateRoute({ tab: "home", chatId: null });
    }
  };

  const handleTogglePinConversation = (id, e) => {
    if (e) e.stopPropagation();
    const updated = conversations.map((c) =>
      c.id === id ? { ...c, pinned: !c.pinned } : c
    );
    persistConversations(updated);
  };

  // Submit prompt to Open Spaces 6 series
  const handleSubmitPrompt = async (prompt, imageUrl = null) => {
    if (!requireLogin("send messages and chat with AI")) return;
    if ((!prompt || !prompt.trim()) && !imageUrl) return;

    const userMsg = {
      role: "user",
      content: prompt,
      ...(imageUrl ? { image_url: imageUrl } : {}),
    };
    const updatedConv = [...conversation, userMsg];
    setConversation(updatedConv);
    setIsGenerating(true);

    let currentId = activeConversationId;
    let currentList = [...conversations];

    // If starting a brand new conversation with a UUID
    if (!currentId) {
      currentId = "chat-" + generateUUID();
      setActiveConversationId(currentId);
      const title =
        prompt && prompt.length > 36 ? prompt.slice(0, 36).trim() + "..." : (prompt || "Image Analysis");
      const newConv = {
        id: currentId,
        title,
        messages: updatedConv,
        model: selectedModel,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        pinned: false,
      };
      currentList = [newConv, ...currentList];
      persistConversations(currentList);
      updateRoute({ tab: "home", chatId: currentId });
    } else {
      // Update existing conversation in list
      currentList = currentList.map((c) =>
        c.id === currentId
          ? { ...c, messages: updatedConv, updatedAt: Date.now() }
          : c
      );
      persistConversations(currentList);
    }

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          image_url: imageUrl || undefined,
          model: selectedModel,
          project: activeProject,
          history: updatedConv,
        }),
      });

      let assistantReply = "";
      if (res.ok) {
        const data = await res.json();
        assistantReply = data.reply;
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `AI service returned error status ${res.status}`);
      }

      const finalConv = [
        ...updatedConv,
        { role: "assistant", content: assistantReply },
      ];
      setConversation(finalConv);

      // Save complete thread including assistant response
      const finalizedList = currentList.map((c) =>
        c.id === currentId
          ? { ...c, messages: finalConv, updatedAt: Date.now() }
          : c
      );
      persistConversations(finalizedList);
    } catch (err) {
      console.error("Error calling chat endpoint:", err);
      const errorMsg = `⚠️ Generation failed: ${err.message || "Unable to reach AI service"}`;
      const finalConv = [
        ...updatedConv,
        { role: "assistant", content: errorMsg, isError: true },
      ];
      setConversation(finalConv);
      const finalizedList = currentList.map((c) =>
        c.id === currentId
          ? { ...c, messages: finalConv, updatedAt: Date.now() }
          : c
      );
      persistConversations(finalizedList);
    } finally {
      setIsGenerating(false);
    }
  };

  const extractTitleFromMarkdown = (text = "") => {
    if (!text) return "Untitled page";
    const headingMatch = text.match(/^#{1,3}\s+(.+)$/m);
    if (headingMatch && headingMatch[1]) {
      return headingMatch[1].replace(/[#*`_~]/g, "").trim().slice(0, 80);
    }
    const firstLine = text.trim().split("\n")[0] || "";
    const cleaned = firstLine.replace(/[#*`_~]/g, "").trim().slice(0, 60);
    return cleaned || "Untitled page";
  };

  const handleOpenCanvas = (firstArg, secondArg) => {
    let title = "Untitled document";
    let content = "";
    if (typeof secondArg === "string") {
      title = firstArg || extractTitleFromMarkdown(secondArg);
      content = secondArg;
    } else if (typeof firstArg === "string") {
      content = firstArg;
      title = extractTitleFromMarkdown(firstArg);
    }
    setActiveRailTab("spaces");
    handleCreatePage({
      title,
      content,
      icon: "📄",
    });
  };

  // Spaces Management
  const handleCreateSpace = async (spaceData) => {
    if (!requireLogin("create a new workspace")) return;
    try {
      const res = await fetch(`${API_BASE}/spaces`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(spaceData),
      });
      if (res.ok) {
        const newSpace = await res.json();
        setSpaces((prev) => [...prev, newSpace]);
        setActiveSpaceId(newSpace.id);
        setActivePageId(null);
        setPages([]);
        setActiveRailTab("spaces");
        updateRoute({ tab: "spaces", spaceId: newSpace.id, pageId: null });
      }
    } catch (err) {
      console.error("Error creating space:", err);
    }
  };

  const handleDeleteSpace = async (spaceId) => {
    if (!requireLogin("delete a workspace")) return;
    try {
      const res = await fetch(`${API_BASE}/spaces/${spaceId}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (res.ok) {
        const remaining = spaces.filter((s) => s.id !== spaceId);
        setSpaces(remaining);
        if (activeSpaceId === spaceId && remaining.length > 0) {
          setActiveSpaceId(remaining[0].id);
          setActivePageId(null);
          updateRoute({ tab: "spaces", spaceId: remaining[0].id, pageId: null });
        }
      }
    } catch (err) {
      console.error("Error deleting space:", err);
    }
  };

  // Pages Management: Instant 0ms optimistic page creation (zero lag, no double spinners)
  const handleCreatePage = async (pageData) => {
    if (!requireLogin("create a new document page")) return;
    let targetSpace = activeSpace;
    if (!targetSpace) {
      if (spaces.length > 0) {
        targetSpace = spaces[0];
      } else {
        try {
          const sRes = await fetch(`${API_BASE}/spaces`, { headers: authHeaders });
          if (sRes.ok) {
            const list = await sRes.json();
            if (list.length > 0) {
              targetSpace = list[0];
              setSpaces(list);
              setActiveSpaceId(targetSpace.id);
            }
          }
        } catch (_) {}
      }
    }
    if (!targetSpace) return;

    let rawTitle = typeof pageData?.title === "string" ? pageData.title.trim() : "Untitled page";
    if (rawTitle.length > 100 || rawTitle.includes("\n")) {
      rawTitle = extractTitleFromMarkdown(rawTitle);
    }
    const titleStr = (rawTitle || "Untitled page").slice(0, 120);
    const contentStr = typeof pageData?.content === "string" ? pageData.content : "";
    const iconStr = typeof pageData?.icon === "string" ? pageData.icon.slice(0, 4) : "📄";

    // Instant optimistic creation: 0ms delay, zero lag!
    const tempId = "page-" + (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10));
    const optimisticPage = {
      id: tempId,
      space_id: targetSpace.id,
      title: titleStr,
      content: contentStr,
      icon: iconStr,
      status: "draft",
      author: currentUser?.name || "Author",
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Open new tab immediately alongside existing tabs
    setPages((prev) => [optimisticPage, ...prev]);
    setOpenPageIds((prev) => [...prev, tempId]);
    setActivePageId(tempId);
    setActiveRailTab("spaces");
    setSaveStatus("Saving...");

    try {
      const res = await fetch(`${API_BASE}/spaces/${targetSpace.id}/pages`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: titleStr,
          content: contentStr,
          icon: iconStr,
          status: "draft",
        }),
      });

      if (res.ok) {
        const savedPage = await res.json();
        setPages((prev) => prev.map((p) => (p.id === tempId ? savedPage : p)));
        setOpenPageIds((prev) => prev.map((id) => (id === tempId ? savedPage.id : id)));
        setActivePageId((curr) => (curr === tempId ? savedPage.id : curr));
        updateRoute({ tab: "spaces", spaceId: targetSpace.id, pageId: savedPage.id });
        setSaveStatus("Saved");
      } else {
        console.warn("Could not create page on server:", res.status);
        setSaveStatus("Failed");
      }
    } catch (err) {
      console.warn("Error creating page:", err?.message || err);
      setSaveStatus("Failed");
    }
  };

  const handleUpdatePage = async (pageId, updateData) => {
    if (!requireLogin("save document changes")) return null;
    if (!activeSpace || !pageId) return null;
    setSaveStatus("Saving...");
    try {
      const res = await fetch(`${API_BASE}/spaces/${activeSpace.id}/pages/${pageId}`, {
        method: "PATCH",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      if (res && res.status === 409) {
        const conflictData = await res.json();
        setSaveStatus("Conflict");
        return { conflict: true, detail: conflictData.detail };
      }
      if (res && res.ok) {
        const updated = await res.json();
        setPages((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        setSaveStatus("Saved");
        return updated;
      } else {
        const errText = res ? await res.text() : "Network error";
        console.warn("Failed to update page:", res?.status, errText);
        setSaveStatus("Failed");
        return null;
      }
    } catch (err) {
      console.warn("Error updating page (will retry on next change):", err?.message || err);
      setSaveStatus("Failed");
      return null;
    }
  };

  const handleRestoreRevision = async (pageId, version) => {
    if (!requireLogin("restore page revisions")) return null;
    if (!activeSpace || !pageId) return null;
    setSaveStatus("Saving...");
    try {
      const res = await fetch(`${API_BASE}/spaces/${activeSpace.id}/pages/${pageId}/revisions/${version}/restore`, {
        method: "POST",
        headers: authHeaders,
      });
      if (res.ok) {
        const restored = await res.json();
        setPages((prev) => prev.map((p) => (p.id === restored.id ? restored : p)));
        setSaveStatus("Saved");
        return restored;
      }
    } catch (err) {
      console.error("Error restoring revision:", err);
    }
    setSaveStatus("Failed");
    return null;
  };

  const handleDeletePage = async (pageId) => {
    if (!requireLogin("delete a document page")) return;
    if (!activeSpace || !pageId) return;
    try {
      const res = await fetch(`${API_BASE}/spaces/${activeSpace.id}/pages/${pageId}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (res.ok) {
        setPages((prev) => prev.filter((p) => p.id !== pageId));
        setOpenPageIds((prev) => {
          const remaining = prev.filter((id) => id !== pageId);
          if (activePageId === pageId) {
            const nextId = remaining[remaining.length - 1] || null;
            setActivePageId(nextId);
            updateRoute({ tab: "spaces", spaceId: activeSpace.id, pageId: nextId });
          }
          return remaining;
        });
      }
    } catch (err) {
      console.error("Error deleting page:", err);
    }
  };

  const handleDownloadMarkdown = () => {
    if (!activePage) return;
    const blob = new Blob([activePage.content || ""], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(activePage.title || "page").replace(/[^\w\s-]/g, "").slice(0, 50)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#fbfbfa] dark:bg-[#141416] text-zinc-900 dark:text-zinc-100 transition-colors duration-150 relative">
      {/* Action Notification Toast ("Please login first") - Non-blocking floating pill */}
      {toastMessage && (
        <div
          role="alert"
          className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-full bg-zinc-900/95 dark:bg-zinc-100/95 text-white dark:text-zinc-900 text-xs font-medium shadow-2xl backdrop-blur-md border border-zinc-700/50 dark:border-zinc-300/50 animate-in fade-in slide-in-from-top-3 duration-150"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">🔒</span>
            <span>{toastMessage}</span>
          </div>
          <div className="flex items-center gap-1.5 pl-2 border-l border-zinc-700/60 dark:border-zinc-300/60">
            <button
              onClick={() => {
                setToastMessage("");
                setAuthModalOpen(true);
              }}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-[11px] font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
            >
              Sign In / Sign Up
            </button>
            <button
              onClick={() => setToastMessage("")}
              className="p-1 text-zinc-400 hover:text-white dark:hover:text-zinc-900 transition-colors cursor-pointer rounded-full"
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 1. Slim Left Navigation Rail (~48px) */}
      <IconRail
        activeRailTab={activeRailTab}
        onSelectRailTab={handleSelectRailTab}
        currentUser={currentUser}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* 2. Middle Sidebar */}
      {activeRailTab === "home" ? (
        /* Real Conversation History Sidebar (UUID based) */
        <OpenSpacesSidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
          onDeleteConversation={handleDeleteConversation}
          onTogglePinConversation={handleTogglePinConversation}
        />
      ) : (
        /* OpenDots-Style Spaces & Hierarchical Pages Tree Sidebar */
        <SpaceSidebar
          spaces={spaces}
          activeSpaceId={activeSpaceId}
          onSelectSpace={handleSelectSpace}
          onCreateSpace={handleCreateSpace}
          onDeleteSpace={handleDeleteSpace}
          pages={pages}
          activePageId={activePageId}
          onSelectPage={handleSelectPage}
          onCreatePage={handleCreatePage}
          onDeletePage={handleDeletePage}
          isCreatingPage={isCreatingPage}
          currentUser={currentUser}
          onRequireLogin={(act) => requireLogin(act || "perform this workspace action")}
        />
      )}

      {/* 3. Main Work Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {activeRailTab === "home" ? (
          /* "What should we work on?" Open Spaces 6 Series View */
          <HomeWorkView
            activeProject={activeProject}
            onSelectProject={setActiveProject}
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
            onSubmitPrompt={handleSubmitPrompt}
            conversation={conversation}
            isLoading={isGenerating}
            onOpenCanvas={handleOpenCanvas}
            currentUser={currentUser}
            authHeaders={authHeaders}
            onRequireLogin={(act) => requireLogin(act || "chat with AI")}
          />
        ) : !activePageId ? (
          /* OpenDots SpaceLibrary: Searchable library, grid/list view, page excerpts */
          <SpaceLibrary
            space={activeSpace}
            pages={pages}
            onSelectPage={handleSelectPage}
            onNewPage={() => handleCreatePage({ title: "Untitled page", content: "" })}
            onDeletePage={handleDeletePage}
            isCreatingPage={isCreatingPage}
            currentUser={currentUser}
            authHeaders={authHeaders}
            onRequireLogin={(act) => requireLogin(act || "manage members")}
          />
        ) : !activePage && pages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-zinc-400 select-none bg-white dark:bg-[#141416]">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium">Loading document page...</span>
          </div>
        ) : (
          /* OpenDots PageDocument: Focused Visual Document Canvas View with Multi-Tabs */
          <>
            <PageHeaderBar
              openPages={
                openPageIds.map((id) => pages.find((p) => p.id === id)).filter(Boolean).length > 0
                  ? openPageIds.map((id) => pages.find((p) => p.id === id)).filter(Boolean)
                  : activePage ? [activePage] : []
              }
              activePageId={activePageId}
              onSelectPage={handleSelectPage}
              onClosePage={handleClosePageTab}
              isCreatingPage={isCreatingPage}
              title={activePage?.title || "Untitled page"}
              icon={activePage?.icon || "📄"}
              spaceName={activeSpace?.name || "Space"}
              onBackToLibrary={handleBackToLibrary}
              onNewPage={() => handleCreatePage({ title: "Untitled page", content: "" })}
              onToggleChat={() => setChatOpen(!chatOpen)}
              chatOpen={chatOpen}
              onToggleHistory={() => setHistoryOpen(!historyOpen)}
              historyOpen={historyOpen}
              onTriggerAI={() => setChatOpen(true)}
              onDownloadMarkdown={handleDownloadMarkdown}
              onDeletePage={() => handleDeletePage(activePageId)}
              onSaveNow={() => setSaveTrigger((n) => n + 1)}
              saveStatus={saveStatus}
            />

            <div className="flex-1 flex overflow-hidden">
              <CanvasPage
                page={activePage}
                onUpdatePage={handleUpdatePage}
                onStatusChange={setSaveStatus}
                saveTrigger={saveTrigger}
                historyOpen={historyOpen}
                onCloseHistory={() => setHistoryOpen(false)}
                onRestoreRevision={handleRestoreRevision}
                onTriggerAI={(p) => handleSubmitPrompt(p)}
                authHeaders={authHeaders}
              />

              {chatOpen && (
                <ChatDrawer
                  isOpen={chatOpen}
                  onClose={() => setChatOpen(false)}
                  messages={messages}
                  onSendMessage={() => {}}
                  agents={activeSpace?.agents || []}
                  activePageTitle={activePage?.title}
                  activePageId={activePage?.id}
                  spaceId={activeSpace?.id}
                  currentUser={currentUser}
                  authHeaders={authHeaders}
                  onRequireLogin={(act) => requireLogin(act || "participate in page discussion")}
                />
              )}
            </div>
          </>
        )}
      </div>

      {/* Switch Account or Re-authenticate Modal */}
      {authModalOpen && (
        <AuthModal
          isOpen={authModalOpen}
          allowClose={true}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
}
