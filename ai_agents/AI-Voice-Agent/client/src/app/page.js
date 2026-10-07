"use client";

import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [callState, setCallState] = useState("disconnected"); // disconnected, connecting, listening, thinking, speaking
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [interimText, setInterimText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [summary, setSummary] = useState(null);
  
  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const transcriptEndRef = useRef(null);
  const activeAudioRef = useRef(null);

  // Auto-scroll chat transcripts to bottom
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, interimText]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      disconnectCall();
    };
  }, []);

  const startRecording = async (socket) => {
    try {
      if (isMuted) return;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      // Use standard webm format which Deepgram supports natively
      const options = { mimeType: "audio/webm" };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && socket && socket.readyState === WebSocket.OPEN) {
          const arrayBuffer = await event.data.arrayBuffer();
          socket.send(arrayBuffer);
        }
      };

      // Send 250ms chunks to the backend
      mediaRecorder.start(250);
      console.log("Microphone recording started");
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setErrorMsg("Microphone access denied or not supported. Make sure you are on localhost or HTTPS.");
      setCallState("disconnected");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.error("Failed to stop MediaRecorder:", e);
      }
      mediaRecorderRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
    console.log("Microphone recording stopped");
  };

  const connectCall = () => {
    if (socketRef.current) return;

    setErrorMsg("");
    setCallState("connecting");
    setMessages([]);
    setInterimText("");
    setSummary(null);

    // Create websocket connection to FastAPI backend
    const socket = new WebSocket("ws://localhost:8000/api/listen");
    socketRef.current = socket;
    socket.binaryType = "blob";

    socket.onopen = () => {
      console.log("WebSocket connection established with backend");
    };

    socket.onmessage = async (event) => {
      // 1. Handle binary audio bytes from Deepgram TTS
      if (event.data instanceof Blob) {
        console.log("Received audio bytes from backend, size:", event.data.size);
        
        const audioUrl = URL.createObjectURL(event.data);
        const audio = new Audio(audioUrl);
        activeAudioRef.current = audio;

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          activeAudioRef.current = null;
          if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ type: "audio-done" }));
          }
        };

        audio.play().catch((err) => {
          console.error("Playback error:", err);
          // Auto fallback: tell the backend we are done even if playback fails
          if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ type: "audio-done" }));
          }
        });
      } else {
        // 2. Handle JSON controls and transcripts
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case "summary":
            setSummary(data.value);
            disconnectCall();
            break;
          case "status":
            if (data.value === "connected") {
              setCallState("listening");
              if (!isMuted) {
                startRecording(socket);
              }
            }
            break;
          case "interim":
            // Real-time transcript updates
            setInterimText(data.text);
            break;
          case "user-transcript":
            setInterimText("");
            setMessages((prev) => [...prev, { role: "user", text: data.text }]);
            break;
          case "agent-response":
            setMessages((prev) => [...prev, { role: "assistant", text: data.text }]);
            break;
          case "state":
            setCallState(data.value);
            break;
          case "error":
            console.error("Backend error:", data.message);
            setErrorMsg(data.message);
            break;
          default:
            break;
        }
      }
    };

    socket.onerror = (err) => {
      console.error("WebSocket error:", err);
      setErrorMsg("Failed to connect to backend server. Is the FastAPI server running on port 8000?");
      disconnectCall();
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed");
      disconnectCall();
    };
  };

  const disconnectCall = () => {
    // Stop audio playback if playing
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }

    stopRecording();

    if (socketRef.current) {
      if (socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
      socketRef.current = null;
    }

    setCallState("disconnected");
    setInterimText("");
  };

  const endCallWithSummary = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "end-call" }));
      setCallState("connecting"); // Show connecting spinner while generating summary
    } else {
      disconnectCall();
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      // Unmute: start recording again if we are currently in listening state
      setIsMuted(false);
      if (callState === "listening" && socketRef.current) {
        startRecording(socketRef.current);
      }
    } else {
      // Mute: stop recording
      setIsMuted(true);
      stopRecording();
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col font-sans">
      {/* Background gradients for premium feel */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full filter blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full filter blur-[80px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md py-4 px-6 md:px-12 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
            James <span className="text-zinc-500 font-light font-sans text-sm">AI Voice Agent</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 font-medium">
            FastAPI + Next.js
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-6 md:gap-8 z-10 overflow-hidden">
        {/* Left Column: Visual Call Control Panel */}
        <section className="flex-1 lg:max-w-md bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 md:p-8 flex flex-col items-center justify-between backdrop-blur-md">
          <div className="w-full text-center">
            <h2 className="text-lg font-semibold text-zinc-200">Interactive Call System</h2>
            <p className="text-sm text-zinc-400 mt-1">Chat in real-time with the restaurant receptionist</p>
          </div>

          {/* Glowing Orb Animation */}
          <div className="my-8 md:my-12 relative flex items-center justify-center">
            {/* Pulsing ring backdrops */}
            {callState === "listening" && (
              <>
                <div className="absolute w-52 h-52 bg-emerald-500/20 rounded-full animate-ping duration-1000" />
                <div className="absolute w-44 h-44 bg-emerald-500/30 rounded-full animate-pulse duration-700" />
              </>
            )}
            {callState === "speaking" && (
              <>
                <div className="absolute w-52 h-52 bg-blue-500/20 rounded-full animate-pulse duration-1000" />
                <div className="absolute w-44 h-44 bg-blue-400/30 rounded-full animate-ping duration-1500" />
              </>
            )}
            {callState === "thinking" && (
              <>
                <div className="absolute w-44 h-44 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin duration-1000" />
              </>
            )}
            {callState === "connecting" && (
              <>
                <div className="absolute w-44 h-44 border-4 border-zinc-700 border-t-purple-500 rounded-full animate-spin duration-1500" />
              </>
            )}

            {/* Main Orb Center */}
            <div
              className={`w-36 h-36 rounded-full flex flex-col items-center justify-center transition-all duration-500 shadow-lg ${
                callState === "disconnected"
                  ? "bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 shadow-zinc-950/50"
                  : callState === "connecting"
                  ? "bg-gradient-to-br from-purple-600/90 to-indigo-700 border border-purple-500/50 shadow-purple-500/20"
                  : callState === "listening"
                  ? "bg-gradient-to-br from-emerald-500/90 to-teal-600 border border-emerald-400/50 shadow-emerald-500/30"
                  : callState === "thinking"
                  ? "bg-gradient-to-br from-amber-500/90 to-orange-600 border border-amber-400/50 shadow-amber-500/30 animate-pulse duration-1000"
                  : "bg-gradient-to-br from-blue-500/90 to-cyan-600 border border-blue-400/50 shadow-blue-500/30"
              }`}
            >
              {/* Orb Text Label */}
              <span className="text-xs uppercase tracking-widest text-zinc-100 font-bold opacity-75">
                {callState === "disconnected" && "Offline"}
                {callState === "connecting" && "Dialing"}
                {callState === "listening" && "Listening"}
                {callState === "thinking" && "Thinking"}
                {callState === "speaking" && "Speaking"}
              </span>

              {/* Orb Micro-Animation Icons */}
              <div className="mt-2 text-zinc-200">
                {callState === "disconnected" && (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
                {callState === "connecting" && (
                  <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                )}
                {callState === "listening" && (
                  <svg className="w-6 h-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
                {callState === "thinking" && (
                  <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                )}
                {callState === "speaking" && (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                )}
              </div>
            </div>
            </div>
            
            {summary && (
              <div className="w-full mt-6 bg-zinc-950/60 border border-zinc-800 rounded-2xl p-5 space-y-4 text-left z-20">
                <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-widest border-b border-zinc-800 pb-2 flex items-center justify-between">
                  <span>Call Summary</span>
                  <span className="text-[9px] bg-emerald-500/15 text-emerald-400 py-0.5 px-2 rounded-full border border-emerald-500/20">Archived</span>
                </h3>
                
                {summary.reservation?.reserved ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Table Reserved
                    </div>
                    <p className="text-xs text-zinc-400 pl-3.5">
                      Date & Time: <span className="text-zinc-200">{summary.reservation.date_time || "Not specified"}</span>
                    </p>
                    <p className="text-xs text-zinc-400 pl-3.5">
                      Guests: <span className="text-zinc-200">{summary.reservation.guests || "Not specified"}</span>
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-zinc-500 italic pl-1">• No table reservation requested</p>
                )}

                {summary.order?.ordered ? (
                  <div className="space-y-2 border-t border-zinc-800/60 pt-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-purple-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      Food Order Placed
                    </div>
                    <div className="pl-3.5 space-y-1">
                      {summary.order.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-zinc-300">
                          <span>{item.name} (x{item.quantity})</span>
                          <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-xs font-bold text-zinc-200 border-t border-zinc-800/40 pt-1 mt-1">
                        <span>Total order value</span>
                        <span>${summary.order.total_price?.toFixed(2) || "0.00"}</span>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-400 pl-3.5">
                      Address: <span className="text-zinc-200">{summary.order.address || "Not specified"}</span>
                    </p>
                    <p className="text-xs text-zinc-400 pl-3.5">
                      Delivery: <span className="text-zinc-200">{summary.order.delivery_time || "30-45 mins"}</span>
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-zinc-500 italic border-t border-zinc-800/60 pt-3 pl-1">• No food order placed</p>
                )}
              </div>
            )}

          {/* Action Control Buttons */}
          <div className="w-full flex flex-col gap-4">
            {errorMsg && (
              <div className="p-3.5 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-300 text-center backdrop-blur-sm">
                {errorMsg}
              </div>
            )}

            <div className="flex gap-4">
              {callState === "disconnected" ? (
                <button
                  onClick={connectCall}
                  className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-zinc-950 font-bold rounded-xl transition-all duration-200 flex justify-center items-center gap-2 shadow-lg shadow-emerald-500/10 cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Start Agent Call
                </button>
              ) : (
                <button
                  onClick={endCallWithSummary}
                  className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 active:bg-red-700 text-zinc-50 font-bold rounded-xl transition-all duration-200 flex justify-center items-center gap-2 shadow-lg shadow-red-500/10 cursor-pointer"
                >
                  <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 8l2 2m0 0l2 2m-2-2l-2 2m2-2l2-2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.725-.94l-2.2-.548a1 1 0 00-.988.321l-1.305 1.305a10.583 10.583 0 01-4.872-4.872l1.305-1.305a1 1 0 00.321-.988l-.548-2.2A1 1 0 0013.28 5H10a2 2 0 00-2-2H5z" />
                  </svg>
                  End Agent Call
                </button>
              )}

              {/* Mute Button */}
              <button
                onClick={toggleMute}
                disabled={callState === "disconnected"}
                className={`p-3 rounded-xl border transition-all duration-200 flex justify-center items-center cursor-pointer ${
                  callState === "disconnected"
                    ? "opacity-50 border-zinc-800 text-zinc-600 cursor-not-allowed"
                    : isMuted
                    ? "bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30"
                    : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100"
                }`}
                title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
              >
                {isMuted ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Right Column: Live Chat & Transcripts */}
        <section className="flex-1 flex flex-col bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden backdrop-blur-md">
          {/* Section Header */}
          <div className="px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/40 flex justify-between items-center">
            <h2 className="font-semibold text-zinc-200">Conversation History</h2>
            <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
              {messages.length} message{messages.length !== 1 && "s"}
            </span>
          </div>

          {/* Transcripts scroll area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[50vh] lg:max-h-[60vh]">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
                <svg className="w-12 h-12 text-zinc-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-sm font-medium">No conversation history yet</p>
                <p className="text-xs mt-1">Start the call to begin reserving tables or ordering food.</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex flex-col max-w-[85%] ${
                    msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                  }`}
                >
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1 px-1">
                    {msg.role === "user" ? "You" : "James"}
                  </span>
                  <div
                    className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-emerald-500 text-zinc-950 rounded-tr-none font-medium shadow-md shadow-emerald-500/5"
                        : "bg-zinc-800 text-zinc-150 border border-zinc-700/50 rounded-tl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))
            )}

            {/* Interim Results (Speech-to-Text in progress) */}
            {interimText && (
              <div className="flex flex-col items-end max-w-[80%] ml-auto">
                <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold mb-1 px-1 animate-pulse">
                  Speaking...
                </span>
                <div className="px-4 py-3 rounded-2xl rounded-tr-none bg-emerald-500/20 text-emerald-300 text-sm border border-emerald-500/30 italic animate-pulse">
                  {interimText}
                </div>
              </div>
            )}

            {/* Thinking / Processing indicator in Chat feed */}
            {callState === "thinking" && (
              <div className="flex flex-col items-start max-w-[80%] mr-auto">
                <span className="text-[10px] text-amber-400 uppercase tracking-widest font-bold mb-1 px-1 animate-pulse">
                  James is typing...
                </span>
                <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-tl-none bg-zinc-800 border border-zinc-700/50">
                  <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            <div ref={transcriptEndRef} />
          </div>

          {/* Quick Menu Card (Sits at the bottom of Chat for quick reference) */}
          <div className="p-4 bg-zinc-950/40 border-t border-zinc-800/80">
            <details className="group cursor-pointer">
              <summary className="flex justify-between items-center text-xs font-semibold text-zinc-400 select-none group-open:text-zinc-200">
                <span>View Restaurant Menu & Commands</span>
                <svg className="w-4 h-4 transition-transform duration-200 group-open:rotate-180 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-zinc-400 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
                <div>
                  <h4 className="font-bold text-zinc-300 mb-1">Reservation Commands</h4>
                  <p>• "Reserve a table for [number] people"</p>
                  <p>• "Book a table for tomorrow at 7 PM"</p>
                </div>
                <div>
                  <h4 className="font-bold text-zinc-300 mb-1">Menu Items (Appetizers)</h4>
                  <p>• Roast Pork Egg Roll (3pcs) - $5.25</p>
                  <p>• BBQ Chicken - $7.75</p>
                </div>
              </div>
            </details>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-zinc-600 border-t border-zinc-900/80 bg-zinc-950/40">
        AI Voice Agent Receptionist Demo. Powered by Next.js, FastAPI, OpenAI, and Deepgram.
      </footer>
    </div>
  );
}
