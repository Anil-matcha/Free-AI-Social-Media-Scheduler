"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import {
  FaCoins, FaSpinner, FaPlay, FaPause, FaDownload,
  FaSlidersH, FaMicrophone, FaTrashAlt, FaHistory,
  FaChevronDown, FaCheck, FaVolumeUp, FaInfoCircle
} from "react-icons/fa";
import clsx from "clsx";
import { ALL_VOICES } from "@/lib/voices";

const RECOMMENDED_VOICES = [
  { id: "English_expressive_narrator", name: "Expressive Narrator (US)", gender: "Female", desc: "Expressive, clear storytelling tone." },
  { id: "English_magnetic_voiced_man", name: "Magnetic Voiced Man (US)", gender: "Male", desc: "Deep, persuasive, warm commercial voice." },
  { id: "English_captivating_female1", name: "Captivating Storyteller (US)", gender: "Female", desc: "Warm and engaging tone for podcasts." },
  { id: "English_radiant_girl", name: "Radiant Girl (US)", gender: "Female", desc: "Upbeat, energetic, and bright voice." },
  { id: "English_Aussie_Bloke", name: "Aussie Bloke (AU)", gender: "Male", desc: "Casual, friendly Australian accent." },
  { id: "English_Trustworth_Man", name: "Trustworthy Partner (US)", gender: "Male", desc: "Steady, authoritative corporate narrator." },
  { id: "English_Gentle-voiced_man", name: "Gentle Teacher (US)", gender: "Male", desc: "Calm, explanatory, educational voice." },
  { id: "English_Whispering_girl_v3", name: "Whispering Girl (US)", gender: "Female", desc: "Low volume, soft ASMR style voice." },
  { id: "English_ManWithDeepVoice", name: "Deep Voice Man (US)", gender: "Male", desc: "Extremely deep, movie-trailer type bass." },
  { id: "English_FriendlyPerson", name: "Friendly Neighbor (US)", gender: "Male", desc: "Warm, casual, conversational tone." },
  { id: "conversational_female_1_v1", name: "Conversational Female (US)", gender: "Female", desc: "Natural, realistic podcaster style." },
];

const VOICE_LANGUAGES = [
  "All",
  "Curated",
  "English",
  "Chinese (Mandarin)",
  "Cantonese",
  "Spanish",
  "Portuguese",
  "Japanese",
  "Korean",
  "French",
  "German",
  "Italian",
  "Russian",
  "Hindi",
  "Others"
];

const EMOTIONS = [
  { id: "happy", name: "Happy" },
  { id: "sad", name: "Sad" },
  { id: "angry", name: "Angry" },
  { id: "fearful", name: "Fearful" },
  { id: "disgusted", name: "Disgusted" },
  { id: "surprised", name: "Surprised" },
  { id: "neutral", name: "Neutral" }
];

const SAMPLE_RATES = [8000, 16000, 22050, 24000, 32000, 44100];
const BITRATES = [32000, 64000, 128000, 256000];
const CHANNELS = [
  { id: 1, name: "1 (Mono)" },
  { id: 2, name: "2 (Stereo)" }
];
const FORMATS = ["mp3", "wav", "pcm", "flac"];
const LANGUAGES = ["auto", "English", "Chinese", "Arabic", "Russian", "Spanish", "French", "Portuguese", "German", "Turkish", "Dutch", "Italian", "Japanese", "Korean", "Hindi"];

export default function StudioPage() {
  const { data: session, update: updateSession } = useSession();

  // Inputs
  const [prompt, setPrompt] = useState("Every journey begins with a single moment of courage. Today, that moment is yours. Welcome to our podcast channel, where we explore human resilience and the art of starting over.");
  const [modelType, setModelType] = useState("minimax-speech-2.6-turbo");
  const [voiceId, setVoiceId] = useState("English_expressive_narrator");
  
  // Advanced Settings
  const [speed, setSpeed] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [pitch, setPitch] = useState(0);
  const [emotion, setEmotion] = useState("happy");
  const [englishNormalization, setEnglishNormalization] = useState(false);
  const [sampleRate, setSampleRate] = useState(16000);
  const [bitrate, setBitrate] = useState(128000);
  const [channel, setChannel] = useState(1);
  const [format, setFormat] = useState("mp3");
  const [languageBoost, setLanguageBoost] = useState("auto");

  // UI state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isVoiceDropdownOpen, setIsVoiceDropdownOpen] = useState(false);
  const [isEmotionDropdownOpen, setIsEmotionDropdownOpen] = useState(false);
  const [voiceSearch, setVoiceSearch] = useState("");
  const [voiceLangFilter, setVoiceLangFilter] = useState("All");
  const [voiceGenderFilter, setVoiceGenderFilter] = useState("All");
  const [isSampleRateOpen, setIsSampleRateOpen] = useState(false);
  const [isBitrateOpen, setIsBitrateOpen] = useState(false);
  const [isFormatOpen, setIsFormatOpen] = useState(false);
  const [isChannelOpen, setIsChannelOpen] = useState(false);
  const [isLanguageBoostOpen, setIsLanguageBoostOpen] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState(""); // "", "generating", "success", "error"
  const [generatingError, setGeneratingError] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // History & Active Player
  const [history, setHistory] = useState([]);
  const [activePodcast, setActivePodcast] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef(null);
  const voiceDropdownRef = useRef(null);
  const emotionDropdownRef = useRef(null);
  const sampleRateRef = useRef(null);
  const bitrateRef = useRef(null);
  const formatRef = useRef(null);
  const channelRef = useRef(null);
  const languageBoostRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Load history & sync status
  useEffect(() => {
    if (session?.user) {
      fetchHistory();
    }
  }, [session]);

  // Check query param for loading a specific creation
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      const loadPodcast = async () => {
        try {
          const res = await fetch(`/api/podcasts?id=${id}`);
          if (res.ok) {
            const data = await res.json();
            setActivePodcast(data);
            setPrompt(data.prompt);
            setVoiceId(data.voiceId);
            setModelType(data.modelType);
            setSpeed(data.speed);
            setVolume(data.volume);
            setPitch(data.pitch);
            setEmotion(data.emotion);
            setEnglishNormalization(data.englishNormalization);
            setSampleRate(data.sampleRate);
            setBitrate(data.bitrate);
            setChannel(data.channel);
            setFormat(data.format);
            setLanguageBoost(data.languageBoost);
          }
        } catch (e) {
          console.error("Failed to load podcast from query:", e);
        }
      };
      loadPodcast();
    }
  }, []);

  // Polling for processing creations in history
  useEffect(() => {
    const hasProcessing = history.some(item => item.status === "processing");
    if (!hasProcessing) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/podcasts");
        if (res.ok) {
          const data = await res.json();
          setHistory(data);
          
          // Update active podcast if it finishes
          if (activePodcast && activePodcast.status === "processing") {
            const updatedActive = data.find(p => p.id === activePodcast.id);
            if (updatedActive && updatedActive.status !== "processing") {
              setActivePodcast(updatedActive);
              if (generatingStatus === "generating") {
                setGeneratingStatus(updatedActive.status === "completed" ? "success" : "error");
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to sync processing history:", err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [history, activePodcast, generatingStatus]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (voiceDropdownRef.current && !voiceDropdownRef.current.contains(e.target)) {
        setIsVoiceDropdownOpen(false);
      }
      if (emotionDropdownRef.current && !emotionDropdownRef.current.contains(e.target)) {
        setIsEmotionDropdownOpen(false);
      }
      if (sampleRateRef.current && !sampleRateRef.current.contains(e.target)) {
        setIsSampleRateOpen(false);
      }
      if (bitrateRef.current && !bitrateRef.current.contains(e.target)) {
        setIsBitrateOpen(false);
      }
      if (formatRef.current && !formatRef.current.contains(e.target)) {
        setIsFormatOpen(false);
      }
      if (channelRef.current && !channelRef.current.contains(e.target)) {
        setIsChannelOpen(false);
      }
      if (languageBoostRef.current && !languageBoostRef.current.contains(e.target)) {
        setIsLanguageBoostOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Timer logic for generation
  useEffect(() => {
    if (generatingStatus === "generating") {
      setElapsedSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [generatingStatus]);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/podcasts");
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  // Live Credit Estimator:
  // HD: (char_count / 1000) * 26 credits
  // Turbo: (char_count / 1000) * 14 credits
  const charCount = prompt.length;
  const ratePer1k = modelType === "minimax-speech-2.6-hd" ? 26 : 14;
  const creditsEstimated = (charCount / 1000) * ratePer1k;
  const creditCost = Math.max(1, Math.round(creditsEstimated));

  const filteredVoices = ALL_VOICES.filter(voice => {
    const matchesSearch = 
      voice.name.toLowerCase().includes(voiceSearch.toLowerCase()) || 
      voice.id.toLowerCase().includes(voiceSearch.toLowerCase());
    const matchesGender = voiceGenderFilter === "All" || voice.gender === voiceGenderFilter;
    let matchesLang = true;
    if (voiceLangFilter === "Curated") {
      return false;
    } else if (voiceLangFilter === "All") {
      matchesLang = true;
    } else if (voiceLangFilter === "Others") {
      const commonLangs = ["English", "Chinese (Mandarin)", "Cantonese", "Spanish", "Portuguese", "Japanese", "Korean", "French", "German", "Italian", "Russian", "Hindi"];
      matchesLang = !commonLangs.includes(voice.language);
    } else {
      matchesLang = voice.language === voiceLangFilter;
    }
    return matchesSearch && matchesGender && matchesLang;
  });

  const displayList = voiceLangFilter === "Curated" 
    ? RECOMMENDED_VOICES.filter(voice => {
        const matchesSearch = 
          voice.name.toLowerCase().includes(voiceSearch.toLowerCase()) || 
          voice.id.toLowerCase().includes(voiceSearch.toLowerCase());
        const matchesGender = voiceGenderFilter === "All" || voice.gender === voiceGenderFilter;
        return matchesSearch && matchesGender;
      })
    : filteredVoices;

  const handleGenerate = async () => {
    if (!session?.user) {
      signIn("google");
      return;
    }

    if (!prompt.trim()) {
      setGeneratingError("Please write a narration prompt script.");
      setGeneratingStatus("error");
      return;
    }

    setGeneratingStatus("generating");
    setGeneratingError("");
    setIsPlaying(false);

    try {
      const res = await fetch("/api/podcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          voiceId,
          speed,
          volume,
          pitch,
          emotion,
          englishNormalization,
          sampleRate,
          bitrate,
          channel,
          format,
          languageBoost,
          modelType
        })
      });

      if (res.status === 402) {
        setGeneratingError("Insufficient credits. Please purchase a package in pricing page.");
        setGeneratingStatus("error");
        return;
      }

      if (!res.ok) {
        throw new Error("API call failed");
      }

      const data = await res.json();
      setActivePodcast(data);
      updateSession();
      fetchHistory();

      if (data.status === "completed" && data.audioUrl) {
        setGeneratingStatus("success");
      } else {
        // Start polling specifically for this podcast ID
        pollPodcastResult(data.id);
      }
    } catch (err) {
      console.error(err);
      setGeneratingError("An error occurred during voice generation. Please try again.");
      setGeneratingStatus("error");
    }
  };

  const pollPodcastResult = async (id) => {
    let completed = false;
    let attempts = 0;
    const maxAttempts = 20;

    while (!completed && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2500));
      attempts++;

      try {
        const res = await fetch(`/api/podcasts?id=${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "completed" && data.audioUrl) {
            setActivePodcast(data);
            setGeneratingStatus("success");
            completed = true;
            fetchHistory();
          } else if (data.status === "failed") {
            setGeneratingError("AI voice narration generation failed. Please try again.");
            setGeneratingStatus("error");
            completed = true;
            fetchHistory();
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }

    if (!completed) {
      setGeneratingError("Generation is taking longer than usual. It will complete in the background and show in your studio history.");
      setGeneratingStatus("error");
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this narration? This cannot be undone.")) return;

    try {
      const res = await fetch(`/api/podcasts?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setHistory(prev => prev.filter(item => item.id !== id));
        if (activePodcast?.id === id) {
          setActivePodcast(null);
          setIsPlaying(false);
        }
      }
    } catch (err) {
      console.error("Failed to delete narration:", err);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const selectHistoryItem = (item) => {
    setActivePodcast(item);
    setIsPlaying(false);
    // Fill form parameters with selected creation
    setPrompt(item.prompt);
    setVoiceId(item.voiceId);
    setModelType(item.modelType);
    setSpeed(item.speed);
    setVolume(item.volume);
    setPitch(item.pitch);
    setEmotion(item.emotion);
    setEnglishNormalization(item.englishNormalization);
    setSampleRate(item.sampleRate);
    setBitrate(item.bitrate);
    setChannel(item.channel);
    setFormat(item.format);
    setLanguageBoost(item.languageBoost);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row md:overflow-hidden overflow-y-auto bg-zinc-950 text-zinc-100 font-sans">
      {/* ─── LEFT WORKSPACE: GENERATOR OPTIONS ────────────────────────────────────────── */}
      <div className="w-full md:w-[460px] border-r border-zinc-800 bg-zinc-900/60 flex flex-col md:overflow-y-auto overflow-visible flex-shrink-0">
        
        {/* Header Title */}
        <div className="p-5 border-b border-zinc-800 flex-shrink-0 bg-zinc-900/80 flex items-center justify-between">
          <div>
            <h1 className="text-base font-heading font-extrabold text-white tracking-tight flex items-center gap-2">
              <FaMicrophone className="text-violet-400" /> Narration Workstation
            </h1>
            <p className="text-[11px] text-zinc-400 mt-1 font-medium">Configure advanced voice parameters and generate professional podcasts.</p>
          </div>
        </div>

        {/* Input Form Fields */}
        <div className="p-5 space-y-6 flex-1 bg-zinc-900/30">
          
          {/* 1. Prompt Script */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-[11px] font-black text-zinc-200 uppercase tracking-wider">
                1. Podcast Script / Prompt
              </label>
              <span className="text-[10px] text-zinc-400 font-bold">
                {charCount} / 10,000 chars
              </span>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value.slice(0, 10000))}
              rows={5}
              className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-violet-500 rounded px-3 py-2.5 text-xs font-medium text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/30 resize-none transition-all leading-normal"
              placeholder="Write the narration script. Every character counts as a token..."
            />
          </div>

          {/* 2. Model Selection Toggle */}
          <div>
            <label className="block text-[11px] font-black text-zinc-200 uppercase tracking-wider mb-2.5">
              2. Voice Model
            </label>
            <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1 border border-zinc-800 rounded">
              <button
                type="button"
                onClick={() => setModelType("minimax-speech-2.6-turbo")}
                className={clsx(
                  "py-2 text-xs font-black rounded transition-all cursor-pointer",
                  modelType === "minimax-speech-2.6-turbo"
                    ? "bg-zinc-800 text-white shadow-sm border border-zinc-700"
                    : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                Speech 2.6 Turbo
              </button>
              <button
                type="button"
                onClick={() => setModelType("minimax-speech-2.6-hd")}
                className={clsx(
                  "py-2 text-xs font-black rounded transition-all cursor-pointer",
                  modelType === "minimax-speech-2.6-hd"
                    ? "bg-zinc-800 text-white shadow-sm border border-zinc-700"
                    : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                Speech 2.6 HD
              </button>
            </div>
            <p className="text-[10px] text-zinc-400 mt-2 flex items-center gap-1.5 font-medium">
              <FaInfoCircle className="text-zinc-500 text-xs flex-shrink-0" />
              <span>
                {modelType === "minimax-speech-2.6-turbo"
                  ? "Turbo: Faster generation speeds. Costs 14 credits per 1,000 characters."
                  : "HD: Broadcast studio quality. Costs 26 credits per 1,000 characters."}
              </span>
            </p>
          </div>

          <div ref={voiceDropdownRef}>
            <label className="block text-[11px] font-black text-zinc-200 uppercase tracking-wider mb-2">
              3. Select Voice Speaker
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsVoiceDropdownOpen(!isVoiceDropdownOpen)}
                className={clsx(
                  "w-full bg-zinc-950 border rounded px-4 py-3 text-left text-xs font-extrabold text-white flex justify-between items-center cursor-pointer transition-all focus:outline-none focus:ring-1 focus:ring-violet-500/30",
                  isVoiceDropdownOpen ? "border-violet-500 ring-1 ring-violet-500/20" : "border-zinc-800 hover:border-zinc-700"
                )}
              >
                <span className="text-white block font-black">
                  {ALL_VOICES.find(v => v.id === voiceId)?.name || RECOMMENDED_VOICES.find(v => v.id === voiceId)?.name || voiceId}
                </span>
                  
                <FaChevronDown className={clsx("text-zinc-455 text-[10px] transition-transform duration-200", isVoiceDropdownOpen && "transform rotate-180")} />
              </button>

              {isVoiceDropdownOpen && (
                <div className="absolute z-30 bottom-full mb-1 w-full bg-zinc-900 border border-zinc-800 rounded shadow-2xl max-h-96 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-1 duration-150 overscroll-contain">
                  
                  {/* Search Input */}
                  <div className="p-3 border-b border-zinc-800 bg-zinc-900 flex-shrink-0">
                    <input
                      type="text"
                      value={voiceSearch}
                      onChange={(e) => setVoiceSearch(e.target.value)}
                      placeholder="Search 470+ voices..."
                      className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-violet-500 rounded px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-500/30 transition-all"
                    />
                  </div>

                  {/* Language Selector (Pills) */}
                  <div className="bg-zinc-900/60 border-b border-zinc-800/50 py-2 flex-shrink-0">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 px-3 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent overscroll-contain max-w-full">
                      {VOICE_LANGUAGES.map(lang => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => setVoiceLangFilter(lang)}
                          className={clsx(
                            "px-2.5 py-1 text-[9px] font-bold rounded-full whitespace-nowrap transition-all cursor-pointer border",
                            voiceLangFilter === lang
                              ? "bg-violet-600 border-violet-500 text-white shadow-md shadow-violet-600/10"
                              : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                          )}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Gender Selector */}
                  <div className="px-3 py-2 bg-zinc-900/40 border-b border-zinc-800/30 flex-shrink-0">
                    <div className="flex items-center gap-1.5 bg-zinc-905 p-1 border border-zinc-800 rounded">
                      {["All", "Male", "Female"].map(gender => (
                        <button
                          key={gender}
                          type="button"
                          onClick={() => setVoiceGenderFilter(gender)}
                          className={clsx(
                            "flex-1 py-1 text-[9px] font-black uppercase rounded transition-all cursor-pointer",
                            voiceGenderFilter === gender
                              ? "bg-zinc-800 text-white border border-zinc-700/50"
                              : "text-zinc-500 hover:text-zinc-300"
                          )}
                        >
                          {gender}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Scrollable Voices List */}
                  <div className="flex-1 overflow-y-auto py-1 overscroll-contain max-h-56 divide-y divide-zinc-800/50">
                    {displayList.length === 0 ? (
                      <div className="p-6 text-center text-zinc-500 text-xs font-bold font-sans">
                        No voices match your search criteria.
                      </div>
                    ) : (
                      displayList.slice(0, 120).map((voice) => {
                        const isSelected = voiceId === voice.id;
                        return (
                          <button
                            key={voice.id}
                            type="button"
                            onClick={() => {
                              setVoiceId(voice.id);
                              setIsVoiceDropdownOpen(false);
                            }}
                            className={clsx(
                              "w-full text-left px-4 py-2 text-xs transition-colors flex items-center justify-between cursor-pointer",
                              isSelected
                                ? "bg-violet-950/30 text-white font-extrabold border border-violet-500"
                                : "text-zinc-200 hover:bg-zinc-800/80 hover:text-white"
                            )}
                          >
                            <div className="min-w-0 pr-3">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold truncate">{voice.name}</span>
                                <span className={clsx("text-[8px] font-black uppercase px-1.5 py-0.5 rounded flex-shrink-0", voice.gender === "Female" ? "bg-fuchsia-950 text-fuchsia-400 border border-fuchsia-900" : voice.gender === "Male" ? "bg-blue-950 text-blue-400 border border-blue-900" : "bg-zinc-950 text-zinc-400 border border-zinc-800")}>
                                  {voice.gender}
                                </span>
                                {voiceLangFilter !== "Curated" && (
                                  <span className="text-[8px] text-zinc-500 bg-zinc-950 border border-zinc-800 px-1 py-0.25 rounded font-mono truncate max-w-[80px]">
                                    {voice.language}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-zinc-400 mt-0.5 truncate max-w-[340px] font-medium">
                                {voice.desc || `Voice ID: ${voice.id}`}
                              </div>
                            </div>
                            {isSelected && <FaCheck className="text-violet-400 text-xs flex-shrink-0" />}
                          </button>
                        );
                      })
                    )}
                    {displayList.length > 120 && (
                      <div className="px-4 py-2 text-[9px] text-zinc-500 font-bold text-center bg-zinc-950/20 border-t border-zinc-800/40">
                        Showing first 120 of {displayList.length} voices. Use search to filter further.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4. Collapsible Advanced Settings */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between py-2 text-xs font-black text-zinc-300 hover:text-white border-b border-zinc-800 cursor-pointer focus:outline-none"
            >
              <span className="flex items-center gap-2">
                <FaSlidersH className="text-violet-400" /> Advanced Voice Settings
              </span>
              <FaChevronDown className={clsx("text-[10px] transition-transform duration-200", showAdvanced && "transform rotate-180")} />
            </button>

            {showAdvanced && (
              <div className="pt-4 space-y-4 animate-in fade-in duration-200">
                
                {/* Sliders Block */}
                <div className="grid grid-cols-1 gap-4 bg-zinc-950/80 p-4 border border-zinc-800 rounded">
                  {/* Speed */}
                  <div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-zinc-350 mb-1">
                      <span>VOICE SPEED (x)</span>
                      <span className="text-violet-400">{speed.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={speed}
                      onChange={(e) => setSpeed(parseFloat(e.target.value))}
                      className="w-full accent-violet-500 bg-zinc-800 h-1 rounded cursor-pointer"
                    />
                  </div>

                  {/* Volume */}
                  <div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-zinc-350 mb-1">
                      <span>VOLUME ADJUST (x)</span>
                      <span className="text-violet-400">{volume.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="10.0"
                      step="0.1"
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="w-full accent-violet-500 bg-zinc-800 h-1 rounded cursor-pointer"
                    />
                  </div>

                  {/* Pitch */}
                  <div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-zinc-350 mb-1">
                      <span>PITCH SEMITONES</span>
                      <span className="text-violet-400">{pitch > 0 ? `+${pitch}` : pitch}</span>
                    </div>
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="1"
                      value={pitch}
                      onChange={(e) => setPitch(parseInt(e.target.value, 10))}
                      className="w-full accent-violet-500 bg-zinc-800 h-1 rounded cursor-pointer"
                    />
                  </div>
                </div>

                {/* Emotion and Normalization */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Emotion */}
                  <div ref={emotionDropdownRef} className="relative">
                    <label className="block text-[10px] font-bold text-zinc-350 uppercase mb-2">Emotion Mode</label>
                    <button
                      type="button"
                      onClick={() => setIsEmotionDropdownOpen(!isEmotionDropdownOpen)}
                      className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded px-3 py-2.5 text-left text-xs font-bold text-white flex justify-between items-center cursor-pointer transition-all focus:outline-none"
                    >
                      <span>{EMOTIONS.find(e => e.id === emotion)?.name || emotion}</span>
                      <FaChevronDown className="text-zinc-400 text-[9px]" />
                    </button>
                    {isEmotionDropdownOpen && (
                      <div className="absolute z-30 bottom-full mb-1 w-full bg-zinc-900 border border-zinc-800 rounded shadow-xl max-h-48 overflow-y-auto py-1 overscroll-contain">
                        {EMOTIONS.map((e) => (
                          <button
                            key={e.id}
                            type="button"
                            onClick={() => {
                              setEmotion(e.id);
                              setIsEmotionDropdownOpen(false);
                            }}
                            className={clsx(
                              "w-full text-left px-3.5 py-2 text-xs transition-colors flex items-center justify-between cursor-pointer",
                              emotion === e.id ? "bg-violet-900/30 text-violet-400 font-bold" : "text-zinc-200 hover:bg-zinc-800 hover:text-white"
                            )}
                          >
                            <span>{e.name}</span>
                            {emotion === e.id && <FaCheck className="text-violet-400 text-[10px]" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* English Normalization Toggle Switch */}
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-350 uppercase mb-2">English Normalization</label>
                    <div className="flex items-center mt-1">
                      <button
                        type="button"
                        onClick={() => setEnglishNormalization(!englishNormalization)}
                        className={clsx(
                          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer",
                          englishNormalization ? "bg-violet-600" : "bg-zinc-800"
                        )}
                      >
                        <span
                          className={clsx(
                            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out",
                            englishNormalization ? "translate-x-6" : "translate-x-1"
                          )}
                        />
                      </button>
                      <span className="text-[11px] font-bold text-zinc-300 ml-2.5">
                        {englishNormalization ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Technical values grid */}
                <div className="grid grid-cols-2 gap-4 bg-zinc-950/40 p-4 border border-zinc-800 rounded text-xs font-semibold">
                  
                  {/* Sample Rate */}
                  <div ref={sampleRateRef} className="relative">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Sample Rate (Hz)</label>
                    <button
                      type="button"
                      onClick={() => setIsSampleRateOpen(!isSampleRateOpen)}
                      className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-white text-xs px-2.5 py-2.5 rounded focus:outline-none flex justify-between items-center cursor-pointer transition-all"
                    >
                      <span>{sampleRate} Hz</span>
                      <FaChevronDown className="text-zinc-450 text-[8px]" />
                    </button>
                    {isSampleRateOpen && (
                      <div className="absolute z-35 bottom-full mb-1 w-full bg-zinc-900 border border-zinc-800 rounded shadow-xl max-h-48 overflow-y-auto py-1 overscroll-contain">
                        {SAMPLE_RATES.map((sr) => (
                          <button
                            key={sr}
                            type="button"
                            onClick={() => {
                              setSampleRate(sr);
                              setIsSampleRateOpen(false);
                            }}
                            className={clsx(
                              "w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between cursor-pointer",
                              sampleRate === sr ? "bg-violet-900/30 text-violet-400 font-bold" : "text-zinc-200 hover:bg-zinc-800 hover:text-white"
                            )}
                          >
                            <span>{sr} Hz</span>
                            {sampleRate === sr && <FaCheck className="text-violet-400 text-[9px]" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bitrate */}
                  <div ref={bitrateRef} className="relative">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Bitrate (bps)</label>
                    <button
                      type="button"
                      onClick={() => setIsBitrateOpen(!isBitrateOpen)}
                      className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-white text-xs px-2.5 py-2.5 rounded focus:outline-none flex justify-between items-center cursor-pointer transition-all"
                    >
                      <span>{bitrate / 1000} kbps</span>
                      <FaChevronDown className="text-zinc-450 text-[8px]" />
                    </button>
                    {isBitrateOpen && (
                      <div className="absolute z-35 bottom-full mb-1 w-full bg-zinc-900 border border-zinc-800 rounded shadow-xl max-h-48 overflow-y-auto py-1 overscroll-contain">
                        {BITRATES.map((br) => (
                          <button
                            key={br}
                            type="button"
                            onClick={() => {
                              setBitrate(br);
                              setIsBitrateOpen(false);
                            }}
                            className={clsx(
                              "w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between cursor-pointer",
                              bitrate === br ? "bg-violet-900/30 text-violet-400 font-bold" : "text-zinc-200 hover:bg-zinc-800 hover:text-white"
                            )}
                          >
                            <span>{br / 1000} kbps</span>
                            {bitrate === br && <FaCheck className="text-violet-400 text-[9px]" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Audio Format */}
                  <div ref={formatRef} className="relative">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Format</label>
                    <button
                      type="button"
                      onClick={() => setIsFormatOpen(!isFormatOpen)}
                      className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-white text-xs px-2.5 py-2.5 rounded focus:outline-none flex justify-between items-center cursor-pointer transition-all"
                    >
                      <span>{format.toUpperCase()}</span>
                      <FaChevronDown className="text-zinc-455 text-[8px]" />
                    </button>
                    {isFormatOpen && (
                      <div className="absolute z-35 bottom-full mb-1 w-full bg-zinc-900 border border-zinc-800 rounded shadow-xl max-h-48 overflow-y-auto py-1 overscroll-contain">
                        {FORMATS.map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => {
                              setFormat(f);
                              setIsFormatOpen(false);
                            }}
                            className={clsx(
                              "w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between cursor-pointer",
                              format === f ? "bg-violet-900/30 text-violet-400 font-bold" : "text-zinc-200 hover:bg-zinc-800 hover:text-white"
                            )}
                          >
                            <span>{f.toUpperCase()}</span>
                            {format === f && <FaCheck className="text-violet-400 text-[9px]" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Channel */}
                  <div ref={channelRef} className="relative">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Channel Mode</label>
                    <button
                      type="button"
                      onClick={() => setIsChannelOpen(!isChannelOpen)}
                      className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-white text-xs px-2.5 py-2.5 rounded focus:outline-none flex justify-between items-center cursor-pointer transition-all"
                    >
                      <span>{CHANNELS.find(ch => ch.id === channel)?.name || channel}</span>
                      <FaChevronDown className="text-zinc-455 text-[8px]" />
                    </button>
                    {isChannelOpen && (
                      <div className="absolute z-35 bottom-full mb-1 w-full bg-zinc-900 border border-zinc-800 rounded shadow-xl max-h-48 overflow-y-auto py-1 overscroll-contain">
                        {CHANNELS.map((ch) => (
                          <button
                            key={ch.id}
                            type="button"
                            onClick={() => {
                              setChannel(ch.id);
                              setIsChannelOpen(false);
                            }}
                            className={clsx(
                              "w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between cursor-pointer",
                              channel === ch.id ? "bg-violet-900/30 text-violet-400 font-bold" : "text-zinc-200 hover:bg-zinc-800 hover:text-white"
                            )}
                          >
                            <span>{ch.name}</span>
                            {channel === ch.id && <FaCheck className="text-violet-400 text-[9px]" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Language Boost */}
                  <div ref={languageBoostRef} className="col-span-2 relative">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Language Boost</label>
                    <button
                      type="button"
                      onClick={() => setIsLanguageBoostOpen(!isLanguageBoostOpen)}
                      className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-white text-xs px-2.5 py-2.5 rounded focus:outline-none flex justify-between items-center cursor-pointer transition-all"
                    >
                      <span>{languageBoost === "auto" ? "Auto Detect Language" : languageBoost}</span>
                      <FaChevronDown className="text-zinc-455 text-[8px]" />
                    </button>
                    {isLanguageBoostOpen && (
                      <div className="absolute z-35 bottom-full mb-1 w-full bg-zinc-900 border border-zinc-800 rounded shadow-xl max-h-48 overflow-y-auto py-1 overscroll-contain">
                        {LANGUAGES.map((lang) => (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => {
                              setLanguageBoost(lang);
                              setIsLanguageBoostOpen(false);
                            }}
                            className={clsx(
                              "w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between cursor-pointer",
                              languageBoost === lang ? "bg-violet-900/30 text-violet-400 font-bold" : "text-zinc-200 hover:bg-zinc-800 hover:text-white"
                            )}
                          >
                            <span>{lang === "auto" ? "Auto Detect Language" : lang}</span>
                            {languageBoost === lang && <FaCheck className="text-violet-400 text-[9px]" />}
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

        {/* Generate triggers & costs */}
        <div className="p-5 border-t border-zinc-800 bg-zinc-900 flex-shrink-0 space-y-3">
          <button
            onClick={handleGenerate}
            disabled={generatingStatus === "generating"}
            className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded py-3.5 text-xs font-black flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-violet-500/10 active:scale-[0.99]"
          >
            {generatingStatus === "generating" ? (
              <>
                <FaSpinner className="animate-spin text-xs text-white" />
                <span>Generating Voice Narration... ({elapsedSeconds}s)</span>
              </>
            ) : (
              <>
                <FaMicrophone className="text-xs text-white animate-pulse" />
                <span>{session?.user ? "Generate Podcast Audio" : "Sign in to Generate Voice"}</span>
              </>
            )}
          </button>
          
          <div className="flex items-center justify-between text-[10px] font-black text-zinc-300 px-1">
            <span>Estimated Cost: {creditCost} Credits</span>
            <span className="flex items-center gap-1.5 text-amber-300 bg-amber-950/40 border border-amber-800/40 rounded-full px-2.5 py-0.5 font-bold">
              <FaCoins /> Deducts live
            </span>
          </div>

          {generatingStatus === "error" && (
            <div className="text-[10px] text-red-400 bg-red-950/20 border border-red-900/40 rounded p-3 flex items-start gap-2 shadow-inner leading-relaxed">
              <FaInfoCircle className="text-red-500 flex-shrink-0 mt-0.5" />
              <span>{generatingError}</span>
            </div>
          )}
        </div>
      </div>

      {/* ─── RIGHT PREVIEW PANEL: AUDIO OUTPUT & HISTORY ────────────────────────────── */}
      <div className="flex-1 flex flex-col md:overflow-hidden bg-zinc-950">
        
        {/* Workspace Toolbar */}
        <div className="px-5 py-4 bg-zinc-900/40 border-b border-zinc-800/50 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight leading-none">Studio Narration output player</h2>
            <p className="text-[10px] text-zinc-400 mt-1 font-medium font-sans">Play, review parameters, and download the finished podcast narration.</p>
          </div>
          {activePodcast?.audioUrl && (
            <a
              href={activePodcast.audioUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={`narration_${activePodcast.id}.${activePodcast.format || "mp3"}`}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-zinc-900 border border-zinc-800 px-3.5 py-2 rounded hover:bg-zinc-800 hover:border-zinc-700 transition-all cursor-pointer group"
            >
              <FaDownload className="text-[10px] text-zinc-400 group-hover:text-white transition-colors" /> Download Audio
            </a>
          )}
        </div>

        {/* Studio Active Workspace */}
        <div className="flex-1 p-5 overflow-y-auto flex flex-col items-center justify-start space-y-6 max-w-4xl mx-auto w-full">
          
          {/* Active Audio Player Widget */}
          <div className="w-full bg-zinc-900/70 border border-zinc-800 rounded p-6 flex flex-col justify-center items-center shadow-xl relative backdrop-blur-md">
            
            {activePodcast ? (
              <div className="w-full flex flex-col items-center">
                
                {/* Audio reference */}
                {activePodcast.audioUrl && (
                  <audio
                    ref={audioRef}
                    src={activePodcast.audioUrl}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                    className="hidden"
                  />
                )}

                {/* Speaker indicator badge */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-full px-4 py-1.5 text-[9px] font-black text-violet-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping" />
                  <span>Speaker: {RECOMMENDED_VOICES.find(v => v.id === activePodcast.voiceId)?.name || activePodcast.voiceId}</span>
                </div>

                {/* Big circular Play/Pause button */}
                {activePodcast.status === "completed" && activePodcast.audioUrl ? (
                  <button
                    onClick={togglePlayback}
                    className="h-20 w-20 rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-500 flex items-center justify-center text-white shadow-2xl hover:scale-105 transition-transform duration-200 cursor-pointer active:scale-95"
                    title={isPlaying ? "Pause Narration" : "Play Narration"}
                  >
                    {isPlaying ? <FaPause className="text-xl" /> : <FaPlay className="text-xl ml-1" />}
                  </button>
                ) : activePodcast.status === "processing" ? (
                  <div className="h-20 w-20 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center text-violet-400 shadow-inner relative">
                    <FaSpinner className="animate-spin text-xl" />
                  </div>
                ) : (
                  <div className="h-20 w-20 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center text-red-400 shadow-inner">
                    <FaInfoCircle className="text-xl animate-bounce" />
                  </div>
                )}

                <div className="text-center mt-5 w-full">
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    {activePodcast.status === "completed"
                      ? "Voice Narration Rendered Successfully"
                      : activePodcast.status === "processing"
                        ? "Rendering Voice Narration..."
                        : "Voice Narration Generation Failed"}
                  </h3>
                  
                  {/* Script summary */}
                  <p className="text-xs text-zinc-300 mt-2 bg-zinc-950 border border-zinc-800/80 rounded p-4 max-h-24 overflow-y-auto leading-relaxed max-w-xl mx-auto italic font-medium">
                    "{activePodcast.prompt}"
                  </p>

                  {/* Config settings badge summary */}
                  <div className="flex flex-wrap gap-1.5 justify-center mt-4 text-[10px] text-zinc-400 font-bold max-w-xl mx-auto">
                    <span className="bg-zinc-950 border border-zinc-800 px-2.5 py-1 rounded">Speed: {activePodcast.speed}x</span>
                    <span className="bg-zinc-950 border border-zinc-800 px-2.5 py-1 rounded">Pitch: {activePodcast.pitch}</span>
                    <span className="bg-zinc-950 border border-zinc-800 px-2.5 py-1 rounded">Emotion: {activePodcast.emotion}</span>
                    <span className="bg-zinc-950 border border-zinc-800 px-2.5 py-1 rounded">Format: {activePodcast.format.toUpperCase()}</span>
                    <span className="bg-zinc-950 border border-zinc-800 px-2.5 py-1 rounded">Rate: {activePodcast.sampleRate / 1000}kHz</span>
                    <span className="bg-zinc-950 border border-zinc-800 px-2.5 py-1 rounded">Model: {activePodcast.modelType === "minimax-speech-2.6-hd" ? "Speech HD" : "Speech Turbo"}</span>
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 bg-zinc-950/30 w-full min-h-[160px] rounded border border-dashed border-zinc-800">
                <FaMicrophone className="text-zinc-600 text-3xl mb-3 animate-pulse" />
                <h3 className="text-xs font-black text-white uppercase tracking-wider">No active narration playing</h3>
                <p className="text-[11px] text-zinc-400 mt-1 max-w-xs leading-relaxed font-medium">Configure parameters and hit generate on the left pane to hear your podcast script come alive.</p>
              </div>
            )}

          </div>

          {/* Creations History Section */}
          <div className="w-full flex-1 flex flex-col overflow-visible">
            
            <div className="flex items-center gap-2 mb-3 px-1 text-zinc-300 font-bold text-xs uppercase tracking-wider flex-shrink-0">
              <FaHistory className="text-violet-400" />
              <span>Studio Creations History</span>
              <span className="text-[10px] text-zinc-500 font-bold ml-1">({history.length} audios)</span>
            </div>

            {history.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-zinc-900/20 rounded border border-dashed border-zinc-800">
                <span className="text-zinc-650 text-xs font-bold font-heading">No previous narrations found.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {history.map((item) => {
                  const isActive = activePodcast?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => selectHistoryItem(item)}
                      className={clsx(
                        "bg-zinc-900 border rounded overflow-hidden shadow transition-all p-4 cursor-pointer hover:border-zinc-700 flex flex-col justify-between h-40",
                        isActive ? "border-violet-500 ring-2 ring-violet-500/10" : "border-zinc-800"
                      )}
                    >
                      <div>
                        {/* Title and Badge row */}
                        <div className="flex items-center justify-between gap-2 mb-2 flex-shrink-0">
                          <span className="text-[9px] font-bold text-violet-455 uppercase tracking-widest truncate max-w-[140px]">
                            Speaker: {RECOMMENDED_VOICES.find(v => v.id === item.voiceId)?.name.split(" ")[0] || item.voiceId}
                          </span>
                          
                          {/* Status Badge */}
                          {item.status === "processing" ? (
                            <span className="bg-zinc-950 border border-zinc-800 text-violet-400 text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1">
                              <FaSpinner className="animate-spin text-[8px]" />
                              <span>Rendering</span>
                            </span>
                          ) : item.status === "failed" ? (
                            <span className="bg-red-950/20 border border-red-900/40 text-red-400 text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                              Failed
                            </span>
                          ) : (
                            <span className="bg-emerald-950/25 border border-emerald-900/40 text-emerald-400 text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1">
                              <FaVolumeUp className="text-[8px]" />
                              <span>Ready</span>
                            </span>
                          )}
                        </div>

                        {/* Prompt snippet preview */}
                        <p className="text-[11px] text-zinc-300 font-medium italic line-clamp-2 leading-relaxed bg-zinc-950/40 border border-zinc-800 p-2 rounded">
                          "{item.prompt}"
                        </p>
                      </div>

                      {/* Footer values and delete trigger */}
                      <div className="flex items-center justify-between mt-3 text-[10px] text-zinc-400 font-bold border-t border-zinc-800 pt-2 flex-shrink-0">
                        <span>
                          {new Date(item.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                        
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] text-zinc-500">
                            {item.modelType === "minimax-speech-2.6-hd" ? "Speech HD" : "Speech Turbo"}
                          </span>
                          <button
                            onClick={(e) => handleDelete(item.id, e)}
                            className="text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                            title="Delete Narration"
                            type="button"
                          >
                            <FaTrashAlt />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
