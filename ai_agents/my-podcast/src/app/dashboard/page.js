"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import {
  FaPlus, FaTrashAlt, FaPlay, FaPause, FaDownload, FaSpinner,
  FaGoogle, FaHistory, FaCoins, FaUser, FaCheck, FaMicrophone, FaVolumeUp
} from "react-icons/fa";
import clsx from "clsx";
import { ALL_VOICES } from "@/lib/voices";

const RECOMMENDED_VOICES = [
  { id: "English_expressive_narrator", name: "Expressive Narrator (US)" },
  { id: "English_magnetic_voiced_man", name: "Magnetic Voiced Man (US)" },
  { id: "English_captivating_female1", name: "Captivating Storyteller (US)" },
  { id: "English_radiant_girl", name: "Radiant Girl (US)" },
  { id: "English_Aussie_Bloke", name: "Aussie Bloke (AU)" },
  { id: "English_Trustworth_Man", name: "Trustworthy Partner (US)" },
  { id: "English_Gentle-voiced_man", name: "Gentle Teacher (US)" },
  { id: "English_Whispering_girl_v3", name: "Whispering Girl (US)" },
  { id: "English_ManWithDeepVoice", name: "Deep Voice Man (US)" },
  { id: "English_FriendlyPerson", name: "Friendly Neighbor (US)" },
  { id: "conversational_female_1_v1", name: "Conversational Female (US)" },
];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [podcasts, setPodcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  // Modal details view state
  const [selectedPodcast, setSelectedPodcast] = useState(null);
  const [isPlayingActive, setIsPlayingActive] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (session?.user) {
      fetchPodcasts();
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [session, status]);

  // Polling database for real-time updates when podcasts are "processing"
  useEffect(() => {
    const hasProcessing = podcasts.some(t => t.status === "processing");
    if (!hasProcessing) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/podcasts");
        if (res.ok) {
          const data = await res.json();
          setPodcasts(data);
          // Sync modal details if open
          if (selectedPodcast && selectedPodcast.status === "processing") {
            const updated = data.find(p => p.id === selectedPodcast.id);
            if (updated) setSelectedPodcast(updated);
          }
        }
      } catch (e) {
        console.error("Dashboard refresh error:", e);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [podcasts, selectedPodcast]);

  const fetchPodcasts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/podcasts");
      if (res.ok) {
        const data = await res.json();
        setPodcasts(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (!confirm("Are you sure you want to delete this podcast? This action cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/podcasts?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setPodcasts(p => p.filter(t => t.id !== id));
        if (selectedPodcast?.id === id) {
          setSelectedPodcast(null);
          setIsPlayingActive(false);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  const toggleModalPlayback = () => {
    if (!audioRef.current) return;
    if (isPlayingActive) {
      audioRef.current.pause();
      setIsPlayingActive(false);
    } else {
      audioRef.current.play();
      setIsPlayingActive(true);
    }
  };

  if (status === "loading" || (loading && podcasts.length === 0)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 text-zinc-300">
        <FaSpinner className="animate-spin text-3xl text-violet-400 mb-4" />
        <p className="text-sm font-medium">Loading narration gallery...</p>
      </div>
    );
  }

  // Logged out state
  if (!session?.user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950 px-4 py-12">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center shadow-xl">
          <div className="h-14 w-14 rounded-2xl bg-violet-950/10 border border-violet-500/30 text-violet-400 flex items-center justify-center mx-auto mb-6 shadow-inner animate-pulse">
            <FaHistory className="text-2xl" />
          </div>
          <h1 className="text-2xl font-bold font-heading text-white tracking-tight mb-2">My Podcast Gallery</h1>
          <p className="text-sm text-zinc-350 leading-relaxed mb-8">
            Access your personal audio dashboard, review generated voice narration clips, and download high-resolution audio files.
          </p>
          <button
            onClick={() => signIn("google")}
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-500/10 active:scale-[0.98] transition-all cursor-pointer"
          >
            <FaGoogle className="text-xs" />
            <span>Sign in with Google</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 text-zinc-200 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black font-heading text-white tracking-tight">My Audio Gallery</h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 font-medium font-sans">Review, play, and delete your AI generated voice narrations</p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-4.5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs font-extrabold rounded-lg shadow-lg shadow-violet-500/5 transition-all w-fit cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <FaPlus className="text-[10px]" /> Design New Narration
          </Link>
        </div>

        {/* Empty State */}
        {podcasts.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center shadow-lg max-w-xl mx-auto my-12">
            <div className="h-16 w-16 bg-zinc-950 text-zinc-400 border border-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <FaMicrophone className="text-3xl text-zinc-350" />
            </div>
            <h2 className="text-lg font-bold text-zinc-200 mb-2">No voice generations found</h2>
            <p className="text-sm text-zinc-450 leading-relaxed max-w-sm mx-auto mb-8 font-medium font-sans">
              You haven't generated any voiceovers yet. Write your script and customize parameters to start!
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-sm font-extrabold rounded-lg shadow-lg shadow-violet-500/10 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <FaPlus className="text-xs" /> Design Custom Narration
            </Link>
          </div>
        ) : (
          /* Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {podcasts.map((podcast) => (
              <div
                key={podcast.id}
                onClick={() => setSelectedPodcast(podcast)}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl hover:border-zinc-700 transition-all flex flex-col h-44 justify-between p-5 cursor-pointer group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] font-black text-violet-400 uppercase tracking-wider">
                      Voice: {ALL_VOICES.find(v => v.id === podcast.voiceId)?.name.split(" ")[0] || RECOMMENDED_VOICES.find(v => v.id === podcast.voiceId)?.name.split(" ")[0] || podcast.voiceId}
                    </span>
                    
                    {/* Status Badge */}
                    {podcast.status === "processing" ? (
                      <span className="bg-zinc-950 border border-zinc-800 text-violet-400 text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                        <FaSpinner className="animate-spin text-[8px]" />
                        <span>Rendering</span>
                      </span>
                    ) : podcast.status === "failed" ? (
                      <span className="bg-red-950/20 border border-red-900/40 text-red-400 text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                        Failed
                      </span>
                    ) : (
                      <span className="bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                        <FaVolumeUp className="text-[8px]" />
                        <span>Ready</span>
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-zinc-300 font-medium italic line-clamp-2 leading-relaxed bg-zinc-950/40 border border-zinc-800 p-2.5 rounded-lg">
                    "{podcast.prompt}"
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-zinc-800 pt-3 text-[10px] text-zinc-550 font-bold">
                  <span>
                    {new Date(podcast.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] text-zinc-500">
                      {podcast.modelType === "minimax-speech-2.6-hd" ? "Speech HD" : "Speech Turbo"}
                    </span>
                    
                    <button
                      onClick={(e) => handleDelete(podcast.id, e)}
                      disabled={deletingId === podcast.id}
                      className="text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-1"
                      title="Delete Narration"
                    >
                      {deletingId === podcast.id ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <FaTrashAlt />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal Overlay */}
        {selectedPodcast && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative flex flex-col max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3.5 mb-5 flex-shrink-0">
                <h3 className="text-sm sm:text-base font-extrabold font-heading text-white flex items-center gap-2">
                  <span>Audio Narration Details</span>
                  <span className="text-[9px] font-black text-violet-400 bg-violet-950 border border-violet-800 px-2 py-0.5 rounded">
                    {selectedPodcast.modelType === "minimax-speech-2.6-hd" ? "Speech HD" : "Speech Turbo"}
                  </span>
                </h3>
                <button
                  onClick={() => {
                    setSelectedPodcast(null);
                    setIsPlayingActive(false);
                  }}
                  className="text-zinc-400 hover:text-white font-bold text-sm p-1 bg-zinc-950 border border-zinc-800 rounded-md cursor-pointer hover:bg-zinc-800"
                >
                  ✕
                </button>
              </div>

              {/* Audio Playback Element */}
              {selectedPodcast.audioUrl && (
                <audio
                  ref={audioRef}
                  src={selectedPodcast.audioUrl}
                  onPlay={() => setIsPlayingActive(true)}
                  onPause={() => setIsPlayingActive(false)}
                  onEnded={() => setIsPlayingActive(false)}
                  className="hidden"
                />
              )}

              {/* Body Content */}
              <div className="space-y-5">
                
                {/* Audio controls */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 flex flex-col items-center justify-center">
                  <div className="text-[10px] font-black uppercase text-zinc-400 tracking-wider mb-3">
                    Voice Clip Player
                  </div>

                  {selectedPodcast.status === "completed" && selectedPodcast.audioUrl ? (
                    <button
                      onClick={toggleModalPlayback}
                      className="h-16 w-16 rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-500 flex items-center justify-center text-white shadow-lg cursor-pointer hover:scale-105 transition-transform"
                    >
                      {isPlayingActive ? <FaPause className="text-base" /> : <FaPlay className="text-base ml-1" />}
                    </button>
                  ) : selectedPodcast.status === "processing" ? (
                    <div className="h-16 w-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-violet-400">
                      <FaSpinner className="animate-spin text-base" />
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-red-950/20 border border-red-900/40 flex items-center justify-center text-red-400">
                      <FaHistory className="text-base" />
                    </div>
                  )}

                  <span className="text-[11px] text-zinc-300 font-bold mt-3 block">
                    Speaker: {ALL_VOICES.find(v => v.id === selectedPodcast.voiceId)?.name || RECOMMENDED_VOICES.find(v => v.id === selectedPodcast.voiceId)?.name || selectedPodcast.voiceId} (ID: {selectedPodcast.voiceId})
                  </span>
                </div>

                {/* Prompt Script Text */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Script Transcript</label>
                  <p className="text-xs text-zinc-200 bg-zinc-900 border border-zinc-700 rounded-xl p-4 leading-relaxed font-medium italic max-h-36 overflow-y-auto">
                    "{selectedPodcast.prompt}"
                  </p>
                </div>

                {/* Grid of parameter stats */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-455 uppercase mb-1.5">Technical Configuration</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px] text-zinc-300 font-bold font-sans">
                    <div className="bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg">
                      <span className="text-[9px] text-zinc-550 block mb-0.5">Speed</span>
                      {selectedPodcast.speed}x
                    </div>
                    <div className="bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg">
                      <span className="text-[9px] text-zinc-550 block mb-0.5">Volume</span>
                      {selectedPodcast.volume}x
                    </div>
                    <div className="bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg">
                      <span className="text-[9px] text-zinc-550 block mb-0.5">Pitch</span>
                      {selectedPodcast.pitch} semitones
                    </div>
                    <div className="bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg">
                      <span className="text-[9px] text-zinc-550 block mb-0.5">Emotion</span>
                      {selectedPodcast.emotion}
                    </div>
                    <div className="bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg">
                      <span className="text-[9px] text-zinc-550 block mb-0.5">Format</span>
                      {selectedPodcast.format.toUpperCase()}
                    </div>
                    <div className="bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg">
                      <span className="text-[9px] text-zinc-550 block mb-0.5">Sample Rate</span>
                      {selectedPodcast.sampleRate} Hz
                    </div>
                    <div className="bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg col-span-2">
                      <span className="text-[9px] text-zinc-550 block mb-0.5">Request Token ID</span>
                      <span className="truncate block font-mono text-[9px] text-zinc-400">{selectedPodcast.requestId}</span>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg">
                      <span className="text-[9px] text-zinc-550 block mb-0.5">Credits Deducted</span>
                      <span className="text-amber-400 flex items-center gap-1">
                        <FaCoins /> {selectedPodcast.creditCost}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Actions Footer */}
              <div className="border-t border-zinc-800 pt-4 mt-6 flex justify-between items-center gap-3 flex-shrink-0">
                <button
                  onClick={(e) => handleDelete(selectedPodcast.id, e)}
                  className="px-3.5 py-2.5 bg-red-950/20 hover:bg-red-900/30 text-red-400 rounded-lg text-xs font-bold transition-all cursor-pointer border border-red-900/30 flex items-center gap-1.5"
                >
                  <FaTrashAlt className="text-[10px]" /> Delete clip
                </button>
                
                <div className="flex gap-2">
                  {selectedPodcast.audioUrl && (
                    <a
                      href={selectedPodcast.audioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={`narration_${selectedPodcast.id}.${selectedPodcast.format}`}
                      className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-lg text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center gap-1.5 hover:scale-[1.01]"
                    >
                      <FaDownload className="text-[10px]" /> Download
                    </a>
                  )}
                  <button
                    onClick={() => {
                      setSelectedPodcast(null);
                      setIsPlayingActive(false);
                    }}
                    className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
