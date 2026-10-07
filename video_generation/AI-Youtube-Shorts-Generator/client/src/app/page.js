"use client";

import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState("api"); // api or local
  const [numClips, setNumClips] = useState(3);
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [language, setLanguage] = useState("auto");
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState("idle"); // idle, processing, completed, failed
  const [logs, setLogs] = useState([]);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedClipIndex, setSelectedClipIndex] = useState(0);

  const logsEndRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // Auto-scroll logs to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const startJob = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setErrorMsg("");
    setLogs(["Submitting job..."]);
    setJobStatus("processing");
    setResult(null);
    setSelectedClipIndex(0);

    try {
      const response = await fetch("http://localhost:8000/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url.trim(),
          mode,
          num_clips: parseInt(numClips),
          aspect_ratio: aspectRatio,
          language,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      setJobId(data.job_id);
      startPolling(data.job_id);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to start generation job.");
      setJobStatus("failed");
    }
  };

  const startPolling = (id) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/jobs/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch job status");
        }

        const job = await response.json();
        setLogs(job.logs || []);

        if (job.status === "completed") {
          setJobStatus("completed");
          setResult(job.result);
          clearInterval(pollIntervalRef.current);
        } else if (job.status === "failed") {
          setJobStatus("failed");
          setErrorMsg(job.error || "The AI processing pipeline failed.");
          clearInterval(pollIntervalRef.current);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000); // Poll every 2 seconds
  };

  const cancelJob = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    setJobStatus("idle");
    setJobId(null);
    setLogs([]);
  };

  const getProgressStage = () => {
    // Basic heuristic helper based on keywords in logs to display progress checkboxes
    const joinedLogs = logs.join("\n").toLowerCase();
    const stages = {
      download: joinedLogs.includes("downloading") || joinedLogs.includes("finished downloading") || joinedLogs.includes("yt-dlp") || joinedLogs.includes("whisper") || joinedLogs.includes("clipping") || joinedLogs.includes("highlights"),
      transcribe: joinedLogs.includes("transcrib") || joinedLogs.includes("finished transcrib") || joinedLogs.includes("highlights") || joinedLogs.includes("clipping"),
      analyze: joinedLogs.includes("highlight") || joinedLogs.includes("gpt") || joinedLogs.includes("gemini") || joinedLogs.includes("clipping"),
      render: joinedLogs.includes("crop") || joinedLogs.includes("clipp") || joinedLogs.includes("render") || joinedLogs.includes("finish")
    };
    return stages;
  };

  const stages = getProgressStage();
  const currentClip = result?.shorts?.[selectedClipIndex];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col font-sans relative overflow-x-hidden">
      {/* Glow Effects */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full filter blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full filter blur-[80px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md py-4 px-6 md:px-12 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-purple-500 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.94 1.5 7.05 4.7 3.44 5.52l.34 3.69L1.35 12l2.43 2.79-.34 3.69 3.61.82 1.89 3.2L12 21.04l3.06 1.46 1.89-3.2 3.61-.82-.34-3.69L23 12zm-12.91 4.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z"/>
          </svg>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">
            ShortsGenerator <span className="text-zinc-500 font-light font-sans text-sm">AI Video Clipper</span>
          </h1>
        </div>
        <div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 font-medium">
            FastAPI + Next.js
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col z-10 gap-6 overflow-hidden">
        
        {/* State: Idle / Form Input */}
        {jobStatus === "idle" && (
          <section className="max-w-2xl w-full mx-auto bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 md:p-8 backdrop-blur-md shadow-2xl">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-zinc-150 tracking-tight">Create Viral Shorts Instantly</h2>
              <p className="text-sm text-zinc-400 mt-2">
                Drop in any YouTube video link or local path. AI will transcribe, detect the best clips, score their virality, and render them vertically.
              </p>
            </div>

            <form onSubmit={startJob} className="space-y-6">
              {/* URL Input */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-300">YouTube URL or Path</label>
                <input
                  type="text"
                  required
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl py-3 px-4 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-all"
                />
              </div>

              {/* Advanced Settings Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Mode Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Processing Mode</label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl py-2.5 px-3 text-sm text-zinc-200 outline-none transition-all"
                  >
                    <option value="api">Cloud API (MuAPI)</option>
                    <option value="local">Local (Offline)</option>
                  </select>
                </div>

                {/* Aspect Ratio */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Aspect Ratio</label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl py-2.5 px-3 text-sm text-zinc-200 outline-none transition-all"
                  >
                    <option value="9:16">9:16 (Vertical)</option>
                    <option value="1:1">1:1 (Square)</option>
                    <option value="16:9">16:9 (Landscape)</option>
                  </select>
                </div>

                {/* Language Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl py-2.5 px-3 text-sm text-zinc-200 outline-none transition-all"
                  >
                    <option value="auto">Auto-Detect</option>
                    <option value="en">English (en)</option>
                    <option value="es">Spanish (es)</option>
                    <option value="fr">French (fr)</option>
                    <option value="de">German (de)</option>
                    <option value="ru">Russian (ru)</option>
                    <option value="zh">Chinese (zh)</option>
                  </select>
                </div>

                {/* Clips Count */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Render Clips</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={numClips}
                    onChange={(e) => setNumClips(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl py-2 px-3 text-sm text-zinc-200 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Errors */}
              {errorMsg && (
                <div className="p-3 bg-red-950/40 border border-red-800/80 rounded-xl text-xs text-red-300 text-center">
                  {errorMsg}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-zinc-50 py-3.5 px-4 rounded-xl text-sm font-bold shadow-lg shadow-purple-500/10 cursor-pointer transition-all active:scale-[0.99]"
              >
                Generate Shorts
              </button>
            </form>
          </section>
        )}

        {/* State: Processing & Logging */}
        {jobStatus === "processing" && (
          <section className="max-w-4xl w-full mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Progress stages Checklist (Left column) */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 flex flex-col justify-between backdrop-blur-md">
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-bold text-zinc-200">Processing Progress</h2>
                  <p className="text-xs text-zinc-400 mt-1">Estimating 1-3 minutes depending on clip length</p>
                </div>
                
                <div className="space-y-4">
                  {/* Stage 1: Download */}
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] ${
                      stages.download ? "bg-purple-500 border-purple-400 text-white" : "border-zinc-700 text-zinc-500"
                    }`}>
                      {stages.download ? "✓" : "1"}
                    </div>
                    <span className={`text-sm ${stages.download ? "text-zinc-200 font-semibold" : "text-zinc-500"}`}>
                      Downloading Video Source
                    </span>
                  </div>

                  {/* Stage 2: Transcribe */}
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] ${
                      stages.transcribe ? "bg-purple-500 border-purple-400 text-white" : "border-zinc-700 text-zinc-500"
                    }`}>
                      {stages.transcribe ? "✓" : "2"}
                    </div>
                    <span className={`text-sm ${stages.transcribe ? "text-zinc-200 font-semibold" : "text-zinc-500"}`}>
                      Transcribing Audio (Whisper)
                    </span>
                  </div>

                  {/* Stage 3: Analyze */}
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] ${
                      stages.analyze ? "bg-purple-500 border-purple-400 text-white" : "border-zinc-700 text-zinc-500"
                    }`}>
                      {stages.analyze ? "✓" : "3"}
                    </div>
                    <span className={`text-sm ${stages.analyze ? "text-zinc-200 font-semibold" : "text-zinc-500"}`}>
                      LLM Highlight Scoring
                    </span>
                  </div>

                  {/* Stage 4: Render */}
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] ${
                      stages.render ? "bg-purple-500 border-purple-400 text-white" : "border-zinc-700 text-zinc-500"
                    }`}>
                      {stages.render ? "✓" : "4"}
                    </div>
                    <span className={`text-sm ${stages.render ? "text-zinc-200 font-semibold" : "text-zinc-500"}`}>
                      Rendering Vertical Shorts
                    </span>
                  </div>
                </div>
              </div>

              {/* Cancel Button */}
              <button
                onClick={cancelJob}
                className="mt-6 py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg cursor-pointer transition-all"
              >
                Cancel and Go Back
              </button>
            </div>

            {/* Real-time Subprocess Logs Box (Right Columns) */}
            <div className="md:col-span-2 bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden h-[50vh] shadow-2xl">
              <div className="px-5 py-3 border-b border-zinc-900 bg-zinc-900/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-ping" />
                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Pipeline Console Output</span>
                </div>
                <span className="text-[10px] text-zinc-500">ID: {jobId}</span>
              </div>
              
              <div className="flex-1 p-5 overflow-y-auto font-mono text-[11px] text-zinc-400 space-y-1">
                {logs.map((log, idx) => (
                  <div key={idx} className="whitespace-pre-wrap leading-relaxed">
                    <span className="text-zinc-600 mr-2">[{idx+1}]</span>
                    {log}
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </div>

          </section>
        )}

        {/* State: Job Failed */}
        {jobStatus === "failed" && (
          <section className="max-w-2xl w-full mx-auto bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 text-center backdrop-blur-md">
            <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/50 text-red-400 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-zinc-200">Clipping Job Failed</h2>
            <p className="text-sm text-zinc-400 mt-2 max-w-md mx-auto">{errorMsg}</p>
            
            <div className="mt-6 flex justify-center gap-4">
              <button
                onClick={() => setJobStatus("idle")}
                className="py-2.5 px-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-zinc-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Try Again
              </button>
              <button
                onClick={() => setJobStatus("processing")}
                className="py-2.5 px-5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                View Failure Logs
              </button>
            </div>
          </section>
        )}

        {/* State: Completed (Show Shorts Result Layout) */}
        {jobStatus === "completed" && result && (
          <section className="flex flex-col lg:flex-row gap-6 md:gap-8 overflow-hidden flex-1">
            
            {/* Left Box: Video Player Panel */}
            <div className="flex-1 lg:max-w-md bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center backdrop-blur-md shadow-2xl">
              {currentClip ? (
                <div className="relative w-full max-w-[280px] aspect-[9/16] rounded-xl overflow-hidden bg-black shadow-2xl border border-zinc-800">
                  <video
                    key={currentClip.clip_url}
                    controls
                    className="w-full h-full object-cover"
                    src={currentClip.clip_url}
                  />
                  <div className="absolute top-3 right-3 py-1 px-2.5 bg-black/60 rounded-full text-xs font-bold border border-zinc-700/50 flex items-center gap-1 backdrop-blur-sm">
                    <span className="text-amber-400">★</span> Score: {currentClip.score}
                  </div>
                </div>
              ) : (
                <div className="text-center text-zinc-500 py-20">No clip loaded</div>
              )}
            </div>

            {/* Right Box: Clip Details & Selector */}
            <div className="flex-1 flex flex-col gap-6">
              
              {/* Highlight Details */}
              {currentClip && (
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 md:p-8 flex-1 flex flex-col justify-between backdrop-blur-md shadow-xl">
                  <div className="space-y-6">
                    {/* Title & Score */}
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="text-[10px] text-purple-400 uppercase tracking-widest font-bold">Clip #{selectedClipIndex + 1}</span>
                        <h2 className="text-xl font-bold text-zinc-100 tracking-tight mt-1">{currentClip.title}</h2>
                        <p className="text-xs text-zinc-500 mt-1">
                          Timestamp: {currentClip.start_time?.toFixed(1)}s → {currentClip.end_time?.toFixed(1)}s
                        </p>
                      </div>
                      
                      {/* Radial Score Indicator */}
                      <div className="relative w-16 h-16 flex items-center justify-center rounded-full bg-zinc-950 border border-zinc-800">
                        <span className="text-sm font-bold bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">
                          {currentClip.score}%
                        </span>
                      </div>
                    </div>

                    {/* Hook sentence */}
                    <div className="space-y-2">
                      <h4 className="text-xs uppercase tracking-widest font-bold text-zinc-400">Opening Hook Sentence</h4>
                      <p className="text-sm border-l-2 border-purple-500 pl-4 py-1 italic bg-purple-500/5 rounded-r-lg text-zinc-300">
                        "{currentClip.hook_sentence}"
                      </p>
                    </div>

                    {/* Reason */}
                    <div className="space-y-2">
                      <h4 className="text-xs uppercase tracking-widest font-bold text-zinc-400">Virality Logic Reason</h4>
                      <p className="text-sm text-zinc-300 leading-relaxed">
                        {currentClip.virality_reason}
                      </p>
                    </div>
                  </div>

                  {/* Call to actions */}
                  <div className="mt-8 flex gap-4">
                    <a
                      href={currentClip.clip_url}
                      download={`short_${selectedClipIndex + 1}.mp4`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-zinc-50 font-bold rounded-xl text-center text-sm cursor-pointer shadow-lg shadow-purple-500/10 transition-all"
                    >
                      Download Short MP4
                    </a>
                    
                    <button
                      onClick={() => setJobStatus("idle")}
                      className="py-3 px-4 border border-zinc-800 hover:bg-zinc-900 text-zinc-300 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                    >
                      Clip Another Video
                    </button>
                  </div>
                </div>
              )}

              {/* Selector Carousel (Bottom row of right box) */}
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 backdrop-blur-md">
                <h3 className="text-xs uppercase tracking-widest font-bold text-zinc-400 mb-3">All Candidate Clips ({result?.shorts?.length})</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {result?.shorts?.map((clip, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedClipIndex(index)}
                      className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                        selectedClipIndex === index
                          ? "bg-purple-600/10 border-purple-500 text-purple-200"
                          : "bg-zinc-950/40 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider">Clip #{index + 1}</div>
                      <div className="text-xs font-semibold truncate mt-1">{clip.title || `Clip ${index + 1}`}</div>
                      <div className="text-[10px] opacity-60 mt-1">Score: {clip.score}</div>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </section>
        )}

      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-zinc-700 border-t border-zinc-900/80 bg-zinc-950/40 mt-8">
        Open-source YouTube Shorts generator. Uses Next.js, FastAPI, MuAPI, Whisper, and LLMs.
      </footer>
    </div>
  );
}
