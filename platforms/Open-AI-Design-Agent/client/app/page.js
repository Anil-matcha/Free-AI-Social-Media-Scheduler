"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  FiPlus, FiUpload, FiSend, FiSearch, FiZap,
  FiImage, FiLayout, FiTerminal, FiChevronDown,
  FiSun, FiMoon, FiMoreHorizontal, FiArrowRight, FiTrash2,
  FiCode, FiCopy, FiX
} from "react-icons/fi";
import { CgTerminal } from "react-icons/cg";
import { RiSparklingLine, RiRobot2Line } from "react-icons/ri";
import { GoBook, GoLightBulb } from "react-icons/go";
import { HiOutlineCube } from "react-icons/hi";
import { useApi } from "@/context/ApiContext";
import { useTheme } from "next-themes";
import Link from "next/link";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";

const API = "/api/v1/creative-agent";

export default function AssistantDashboard() {
  const router = useRouter();
  const { userData } = useApi();
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState("");
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState([]);
  const [showSkillsMenu, setShowSkillsMenu] = useState(false);
  const [activeSkill, setActiveSkill] = useState(null);
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionCursorPos, setMentionCursorPos] = useState(0);
  const [hoveredAsset, setHoveredAsset] = useState(null);
  const textareaRef = React.useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = React.useRef(null);
  const [placeholderText, setPlaceholderText] = useState("");

  const placeholders = React.useMemo(() => [
    "Ask the agent to generate an image...",
    "Ask the agent to create a video...",
    "Ask the agent to edit an image...",
    "Ask the agent to plan a social campaign..."
  ], []);

  useEffect(() => {
    let currentPlaceholderIdx = 0;
    let currentCharIdx = 0;
    let isDeleting = false;
    let typingTimer;

    const type = () => {
      const currentString = placeholders[currentPlaceholderIdx];
      
      if (isDeleting) {
        setPlaceholderText(currentString.substring(0, currentCharIdx - 1));
        currentCharIdx--;
      } else {
        setPlaceholderText(currentString.substring(0, currentCharIdx + 1));
        currentCharIdx++;
      }

      let typeSpeed = isDeleting ? 20 : 50;

      if (!isDeleting && currentCharIdx === currentString.length) {
        typeSpeed = 2000;
        isDeleting = true;
      } else if (isDeleting && currentCharIdx === 0) {
        isDeleting = false;
        currentPlaceholderIdx = (currentPlaceholderIdx + 1) % placeholders.length;
        typeSpeed = 500;
      }

      typingTimer = setTimeout(type, typeSpeed);
    };

    typingTimer = setTimeout(type, 1000);

    return () => clearTimeout(typingTimer);
  }, [placeholders]);

  useEffect(() => {
    setMounted(true);
    fetchSessions();
    fetchSkills();
  }, []);

  const fetchSessions = async () => {
    try {
      const { data } = await axios.get(`${API}/sessions`);
      // Fetch assets for each session to show thumbnails
      const sessionsWithAssets = await Promise.all(data.map(async (s) => {
        try {
          const { data: assets } = await axios.get(`${API}/sessions/${s.id}/assets`);
          return { ...s, assets: assets.slice(0, 4) }; // Keep first 4 for thumbnail grid
        } catch {
          return { ...s, assets: [] };
        }
      }));
      setSessions(sessionsWithAssets);
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSkills = async () => {
    try {
      const { data } = await axios.get(`${API}/agent-skills`);
      setSkills(data);
    } catch (err) {
      console.error("Failed to fetch skills:", err);
    }
  };


  const deleteSession = async (sessionId, sessionName) => {
    if (!window.confirm(`Delete chat "${sessionName || "Untitled"}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API}/sessions/${sessionId}`);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      toast.success("Chat deleted");
    } catch (err) {
      toast.error("Failed to delete chat");
    }
  };

  const removeAttachment = (url) => {
    setAttachments(prev => prev.filter(a => a.url !== url));
  };

  const selectMention = (item, type) => {
    const before = input.substring(0, mentionCursorPos);
    const after = input.substring(textareaRef.current.selectionStart);
    
    if (type === "skill") {
      setActiveSkill(item);
      setInput(before + after); 
    } else {
      const insertion = `@${item.asset_label || "asset"}`;
      setInput(before + insertion + after);
    }
    
    setShowMentionPopup(false);
    setTimeout(() => textareaRef.current?.focus(), 10);
  };

  const processFile = async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      // 1. Get signed URL via proxy
      const { data: signData } = await axios.get("/api/v1/get_upload_url", {
        params: { filename: file.name }
      });

      const { url, fields } = signData;
      const formData = new FormData();
      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value);
      });
      formData.append("file", file);
      formData.append("x-proxy-target-url", url);

      // 2. Upload to proxy URL
      await axios.post("/api/v1/upload-binary", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (pe) => {
          setUploadProgress(Math.round((pe.loaded * 100) / pe.total));
        }
      });

      // 3. Final URL
      const uploadedUrl = `https://cdn.muapi.ai/${fields.key}`;
      const kind = file.type?.startsWith("video/") ? "video"
                 : file.type?.startsWith("audio/") ? "audio"
                 : "image";
      
      const att = { url: uploadedUrl, kind };
      setAttachments(prev => [...prev, att]);
      toast.success("File uploaded successfully");
    } catch (err) {
      console.error("Upload failed", err);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileUpload = (e) => processFile(e.target.files?.[0]);

  const startNewSession = async (initialMsg = "", skill = null, initialAttachments = []) => {
    try {
      const { data } = await axios.post(`${API}/sessions`, {});
      const sessionId = data.id;
      let url = `/canvas?session=${sessionId}`;
      let registeredAssets = [];

      if (initialAttachments.length > 0) {
        const results = await Promise.all(initialAttachments.map(a => 
          axios.post(`${API}/sessions/${sessionId}/assets`, { 
            url: a.url, 
            kind: a.kind, 
            source_tool: "upload" 
          })
        ));
        registeredAssets = results.map(r => r.data);
        const labels = registeredAssets.map(a => a.asset_label).join(",");
        url += `&a=${encodeURIComponent(labels)}`;
      }
      
      if (initialMsg) {
        const attachmentNote = registeredAssets.length
          ? "\n\n[Attached " + registeredAssets.map(a => `${a.asset_label} (${a.kind})`).join(", ") + "]"
          : "";
        
        const userMsg = {
          role: "user",
          content: initialMsg + attachmentNote,
          attachments: registeredAssets,
          timestamp: new Date().toISOString(),
          skill_name: skill?.name
        };

        if (skill) {
          url += `&skill=${encodeURIComponent(skill.name)}`;
          const primaryInputKey = skill.inputs?.[0] || "premise";
          await axios.post(`${API}/sessions/${sessionId}/run-skill`, {
            skill_name: skill.name,
            inputs: { [primaryInputKey]: initialMsg },
            messages_snapshot: [userMsg],
            model: "gpt-4o"
          });
        } else {
          url += `&q=${encodeURIComponent(initialMsg)}`;
          await axios.post(`${API}/sessions/${sessionId}/chat`, {
            message: initialMsg,
            messages_snapshot: [userMsg],
            model: "gpt-4o"
          });
        }
      }
      
      router.push(url);
    } catch (err) {
      toast.error("Failed to start session");
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() || attachments.length > 0) {
        startNewSession(input.trim(), activeSkill, attachments);
      }
    }
  };

  const filteredSkills = skills.filter(s => s.name.toLowerCase().includes(mentionQuery.toLowerCase()));
  const filteredAssets = attachments.map((a, i) => ({ ...a, asset_label: `asset_${i+1}` })).filter(a => a.asset_label.includes(mentionQuery.toLowerCase()));


  if (!mounted) return null;

  return (
    <div className="h-dvh w-full text-sm flex flex-col items-center bg-bg-page animate-fade-in text-primary-text">
      <Navbar />
      <main className="flex flex-col gap-6 items-center w-full h-full overflow-y-auto">
        <div className="flex-1 flex flex-col gap-6 sm:gap-8 items-center w-full max-w-7xl pt-6 sm:pt-8 pb-12 px-4 sm:px-8 lg:px-0">
          <h1 className="text-5xl font-bold tracking-tight text-center flex items-center gap-3">
            Design is easier with <span className="text-primary">Agents</span>
          </h1>
          <p className="text-secondary-text text-lg text-center">
            The open-source design agent that gets you and gets the job done
          </p>
          <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest">
            <a href="https://github.com/Anil-matcha/Open-Lovart" target="_blank" className="flex items-center gap-2 px-4 py-2 bg-bg-card border border-divider rounded-full shadow-sm hover:shadow-md hover:border-primary/30 transition-all text-secondary-text hover:text-primary">
              <CgTerminal size={12} className="text-primary" />
              View Source
            </a>
          </div>
          <div className="w-full max-w-3xl relative">
            <div className="bg-bg-card border border-divider rounded-md shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-1 focus-within:shadow-[0_8px_40px_rgb(0,0,0,0.08)] transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                autoFocus
                onChange={(e) => {
                  const val = e.target.value;
                  const pos = e.target.selectionStart;
                  setInput(val);
                  
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
                placeholder={placeholderText}
                className="w-full bg-transparent border-none focus:ring-0 text-lg p-4 h-24 resize-none placeholder:text-secondary-text/50 outline-none scrollbar-subtle"
              />
              <div className="flex items-center justify-between px-2 pb-2">
                <div className="flex items-center gap-1 relative">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileUpload}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 hover:bg-bg-page rounded-full text-secondary-text transition-colors relative"
                    title="Upload File"
                  >
                    {uploading ? (
                      <div className="w-12 h-12 rounded border border-divider border-dashed flex flex-col items-center justify-center bg-bg-page/50">
                        <span className="border-2 border-t-transparent border-primary rounded-full w-7 h-7 animate-spin absolute"></span>
                        <span className="text-[10px] font-bold text-secondary-text z-10">{uploadProgress}%</span>
                      </div>
                    ) : (
                      <FiPlus size={20} />
                    )}
                  </button>
                  <button 
                    onClick={() => setShowSkillsMenu(!showSkillsMenu)}
                    className={`p-2 hover:bg-bg-page rounded-full transition-colors ${activeSkill || showSkillsMenu ? "text-primary bg-primary/10" : "text-secondary-text"}`}
                    title="Skills"
                  >
                    <GoBook size={20} />
                  </button>

                  {/* Mention & Attachment Preview Bar */}
                  {(uploading || attachments.length > 0 || input.includes("@")) && (
                    <div className="absolute bottom-full left-0 mb-1 flex flex-wrap gap-2 bg-bg-card border border-divider rounded shadow-xl z-10 animate-in slide-in-from-bottom-2 duration-300">
                      {attachments.map((att, i) => (
                        <div 
                          key={i} 
                          className="relative group flex items-center gap-2 px-2 py-1 bg-bg-page border border-divider rounded cursor-help hover:border-primary/50 transition-all"
                          onMouseEnter={() => setHoveredAsset(att)}
                          onMouseLeave={() => setHoveredAsset(null)}
                        >
                          <div className="w-5 h-5 rounded overflow-hidden">
                            {att.kind === "image" ? <img src={att.url} className="w-full h-full object-cover" /> : <FiTerminal size={10} />}
                          </div>
                          <span className="text-[10px] font-bold text-secondary-text">{`asset_${i+1}`}</span>
                        </div>
                      ))}
                      
                      {/* Detection for @asset_N in text */}
                      {input.match(/@asset_\d+/g)?.map(match => {
                        const index = parseInt(match.split('_')[1]) - 1;
                        const asset = attachments[index];
                        if (!asset) return null;
                        return (
                          <div 
                            key={match}
                            className="relative group flex items-center gap-2 px-2 py-1 bg-primary/5 border border-primary/20 rounded-lg cursor-help hover:border-primary/50 transition-all"
                            onMouseEnter={() => setHoveredAsset(asset)}
                            onMouseLeave={() => setHoveredAsset(null)}
                          >
                            <div className="w-5 h-5 rounded overflow-hidden bg-primary/10 flex items-center justify-center text-primary">
                              {asset.kind === "image" ? <img src={asset.url} className="w-full h-full object-cover" /> : <RiSparklingLine size={10} />}
                            </div>
                            <span className="text-[10px] font-bold text-primary">{match}</span>
                          </div>
                        );
                      })}

                      {uploading && (
                        <div className="flex items-center gap-2 px-2 py-1 bg-bg-page border border-divider border-dashed rounded-lg">
                          <div className="w-3 h-3 border-2 border-t-transparent border-primary rounded-full animate-spin" />
                          <span className="text-[10px] font-bold text-secondary-text">{uploadProgress}%</span>
                        </div>
                      )}
                    </div>
                  )}

                  {hoveredAsset && (
                    <div className="absolute bottom-full left-0 mb-10 w-72 aspect-square bg-bg-card border border-divider rounded-md shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] overflow-hidden z-[110] animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
                      {hoveredAsset.kind === "image" ? (
                        <img src={hoveredAsset.url} className="w-full h-full object-cover" />
                      ) : hoveredAsset.kind === "video" ? (
                        <video src={hoveredAsset.url} className="w-full h-full object-cover" autoPlay muted loop />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-bg-page gap-3 p-6 text-center">
                          <FiTerminal size={48} className="text-primary opacity-20" />
                          <div className="text-xs font-medium text-secondary-text truncate w-full">{hoveredAsset.url.split('/').pop()}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {showMentionPopup && (
                    <div className="absolute bottom-full left-0 mb-2 flex items-end gap-3 z-50">
                      <div className="w-64 bg-bg-card border border-divider rounded shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="p-2 border-b border-divider/30 text-[10px] font-bold text-secondary-text uppercase tracking-widest bg-bg-page/50">
                          Mentions
                        </div>
                        <div className="max-h-60 overflow-y-auto scrollbar-subtle py-1">
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
                          {filteredSkills.length === 0 && (
                            <div className="px-4 py-8 text-center text-secondary-text text-xs italic opacity-50">No matches found</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <div className="relative">
                    {showSkillsMenu && (
                      <div className="fixed inset-0 z-50 bg-bg-page/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                        <div className="fixed inset-0" onClick={() => setShowSkillsMenu(false)} />
                        <div className="relative w-full max-w-2xl bg-bg-card border border-divider rounded-md shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] overflow-hidden animate-in zoom-in-95 duration-200">
                          <div className="px-4 py-3 border-b border-divider flex items-center justify-between bg-bg-page/30">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20">
                                <GoBook size={24} />
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-primary-text tracking-tight">Agent Skills</h3>
                                <p className="text-xs text-secondary-text font-medium opacity-70">Power up your creative workflow with specialized AI experts.</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => setShowSkillsMenu(false)}
                              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-bg-page border border-divider rounded text-xs font-bold text-secondary-text hover:text-primary hover:border-primary/30 transition-all"
                            >
                              <CgTerminal size={14} />
                              Dismiss
                            </button>
                          </div>
                          <div className="p-2 max-h-[60vh] overflow-y-auto scrollbar-subtle grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {skills.map(s => (
                              <button
                                key={s.name}
                                onClick={() => { setActiveSkill(s); setShowSkillsMenu(false); }}
                                className={`group relative flex flex-col gap-2 p-4 rounded transition-all text-left border ${activeSkill?.name === s.name ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20" : "bg-bg-page/50 border-divider/50 hover:border-primary/30 hover:bg-bg-page hover:shadow-md"}`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded flex items-center justify-center transition-all ${activeSkill?.name === s.name ? "bg-primary text-white scale-110 shadow-lg shadow-primary/20" : "bg-bg-card text-primary border border-divider group-hover:scale-110"}`}>
                                      <RiSparklingLine size={16} />
                                    </div>
                                    <div className="font-bold text-sm tracking-tight capitalize group-hover:text-primary transition-colors">{s.name.replace(/-/g, ' ')}</div>
                                  </div>
                                  {activeSkill?.name === s.name && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                                </div>
                                <div className="text-[11px] text-secondary-text line-clamp-2 leading-relaxed opacity-80 h-8">{s.description || "Expert agent workflow for high-quality generation."}</div>
                              </button>
                            ))}
                          </div>
                          <div className="px-4 py-2 bg-bg-page/50 border-t border-divider flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-secondary-text uppercase tracking-widest opacity-60">
                              <RiRobot2Line size={14} />
                              Design Protocol v1.2
                            </div>
                            <button 
                              onClick={() => setShowSkillsMenu(false)}
                              className="px-4 py-2 text-xs font-bold text-primary-text hover:bg-bg-page rounded transition-colors border border-transparent hover:border-divider"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  {activeSkill && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 border border-primary/20 rounded-full text-primary text-[10px] font-bold animate-in zoom-in-95">
                      <RiSparklingLine size={12} />
                      {activeSkill.name}
                      <button onClick={() => setActiveSkill(null)} className="hover:text-primary-text ml-1">&#x2715;</button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {attachments.length > 0 && (
                    <div className="flex items-center -space-x-2 mr-2">
                      {attachments.map((a, i) => (
                        <div key={i} className="w-6 h-6 rounded-full border-2 border-bg-card bg-bg-page overflow-hidden shadow-sm">
                          {a.kind === "image" ? <img src={a.url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-black"><FiTerminal size={10} className="text-white" /></div>}
                        </div>
                      ))}
                      <button onClick={() => setAttachments([])} className="w-6 h-6 rounded-full border-2 border-bg-card bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors z-10">
                        <FiPlus size={12} className="rotate-45" />
                      </button>
                    </div>
                  )}
                  <button 
                    onClick={() => (input.trim() || attachments.length > 0) && startNewSession(input.trim(), activeSkill, attachments)}
                    disabled={!input.trim() && attachments.length === 0}
                    className={`p-2 rounded-full transition-all ${input.trim() || attachments.length > 0 ? "bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105" : "bg-bg-page text-secondary-text/30"}`}
                  >
                    <FiSend size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full">
            <h2 className="text-xl font-bold mb-6">Recent Projects</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {/* New Project Card */}
              <button 
                onClick={() => router.push("/canvas")}
                className="group aspect-[16/10] bg-bg-card border-2 border-dashed border-divider rounded-md flex flex-col items-center justify-center gap-3 hover:border-primary hover:bg-primary/5 transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-bg-page border border-divider flex items-center justify-center text-secondary-text group-hover:text-primary group-hover:border-primary group-hover:scale-110 transition-all">
                  <FiPlus size={24} />
                </div>
                <span className="text-xs font-bold text-secondary-text group-hover:text-primary">New Project</span>
              </button>

              {/* Session Cards */}
              {sessions.map((session) => (
                <div 
                  key={session.id}
                  onClick={() => router.push(`/canvas?session=${session.id}`)}
                  className="group relative aspect-[16/10] bg-bg-card border border-divider rounded overflow-hidden cursor-pointer hover:shadow-xl hover:border-primary/50 transition-all"
                >
                  <div className="h-full w-full grid grid-cols-2 grid-rows-2 gap-0.5 bg-divider/20">
                    {session.assets && session.assets.length > 0 ? (
                      session.assets.map((asset, i) => (
                        <div key={i} className={`relative overflow-hidden ${session.assets.length === 1 ? 'col-span-2 row-span-2' : session.assets.length === 2 ? 'row-span-2' : ''}`}>
                          {asset.kind === "image" ? (
                            <img src={asset.url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-black/5 flex items-center justify-center"><FiImage className="text-secondary-text/20" size={32} /></div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 row-span-2 flex items-center justify-center bg-bg-page">
                        <RiRobot2Line size={48} className="text-secondary-text/10" />
                      </div>
                    )}
                    {session.assets && session.assets.length > 0 && session.assets.length < 4 && Array.from({ length: 4 - session.assets.length }).map((_, i) => (
                      <div key={`empty-${i}`} className="bg-bg-page/50" />
                    ))}
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); deleteSession(session.id, session.name); }}
                    className="absolute top-2 right-2 z-10 p-1.5 rounded bg-black/60 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"
                    title="Delete chat"
                  >
                    <FiTrash2 size={14} />
                  </button>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                    <div className="text-white font-bold text-sm truncate">{session.name || "Untitled"}</div>
                    <div className="text-white/60 text-[10px] mt-1">{session.assets?.length || 0} assets</div>
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-bg-card/90 backdrop-blur-sm border-t border-divider opacity-100 group-hover:opacity-0 transition-opacity">
                    <div className="text-primary-text font-bold text-xs truncate">{session.name || "Untitled Session"}</div>
                  </div>
                </div>
              ))}

              {loading && Array.from({ length: 3 }).map((_, i) => (
                <div key={`skeleton-${i}`} className="aspect-[16/10] bg-bg-card border border-divider rounded-md animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
