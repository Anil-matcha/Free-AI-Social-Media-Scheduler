"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import PipelineProgress from "../../../components/PipelineProgress";
import VideoResult from "../../../components/VideoResult";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function GeneratePage() {
  const { jobId } = useParams();
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState("running"); // running | completed | failed
  const [videoUrl, setVideoUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState("Starting pipeline...");
  const [logs, setLogs] = useState([]);
  const esRef = useRef(null);

  useEffect(() => {
    if (!jobId) return;

    const es = new EventSource(`http://localhost:8000/api/status/${jobId}`);
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);
        setEvents((prev) => [...prev, event]);
        setLogs((prev) => [
          ...prev,
          {
            time: new Date().toLocaleTimeString(),
            message: event.message || event.stage || "",
            type: event.type,
          },
        ]);

        if (event.type === "progress") {
          setProgress(event.progress || 0);
          setCurrentMessage(event.message || "");
        } else if (event.type === "complete") {
          setProgress(100);
          setStatus("completed");
          setVideoUrl(event.video_url);
          setCurrentMessage("Video generation complete!");
          es.close();
        } else if (event.type === "error") {
          setStatus("failed");
          setErrorMsg(event.message || "Generation failed");
          setCurrentMessage("Generation failed");
          es.close();
        }
      } catch (err) {
        console.error("Failed to parse SSE event:", err);
      }
    };

    es.onerror = () => {
      // If SSE drops after completion it's fine; otherwise check job result
      if (status !== "completed") {
        fetch(`/api/result/${jobId}`)
          .then((r) => r.json())
          .then((data) => {
            if (data.status === "completed") {
              setStatus("completed");
              setVideoUrl(data.video_url);
              setProgress(100);
            } else if (data.status === "failed") {
              setStatus("failed");
              setErrorMsg(data.error || "Unknown error");
            }
          })
          .catch(() => { });
      }
      es.close();
    };

    return () => {
      es.close();
    };
  }, [jobId]);

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "#0a0a0f" }}
    >
      {/* Top bar */}
      <div
        className="sticky top-0 z-10 px-6 py-4 flex items-center gap-4"
        style={{
          backgroundColor: "rgba(10, 10, 15, 0.9)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #1a1a26",
        }}
      >
        <Link
          href="/"
          className="flex items-center gap-2 text-sm transition-colors"
          style={{ color: "#6b7280" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#a78bfa")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}
        >
          <ArrowLeft size={16} />
          New video
        </Link>
        <div
          className="h-4 w-px"
          style={{ backgroundColor: "#22223a" }}
        />
        <span className="text-sm" style={{ color: "#4b5563" }}>
          Job: <span style={{ color: "#7c3aed", fontFamily: "monospace" }}>{jobId}</span>
        </span>

        {/* Status badge */}
        <div className="ml-auto">
          {status === "running" && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: "rgba(234, 179, 8, 0.15)",
                border: "1px solid rgba(234, 179, 8, 0.3)",
                color: "#fde047",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              Generating
            </span>
          )}
          {status === "completed" && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: "rgba(34, 197, 94, 0.15)",
                border: "1px solid rgba(34, 197, 94, 0.3)",
                color: "#86efac",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              Complete
            </span>
          )}
          {status === "failed" && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#fca5a5",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              Failed
            </span>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Result */}
        {status === "completed" && videoUrl && (
          <div className="mb-10 animate-slide-up">
            <VideoResult videoUrl={videoUrl} jobId={jobId} />
          </div>
        )}

        {/* Error */}
        {status === "failed" && errorMsg && (
          <div
            className="mb-10 p-5 rounded-2xl animate-slide-up"
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
            }}
          >
            <p className="text-sm font-medium mb-1" style={{ color: "#fca5a5" }}>
              Generation Failed
            </p>
            <p className="text-sm" style={{ color: "#9ca3af" }}>
              {errorMsg}
            </p>
          </div>
        )}

        {/* Pipeline progress */}
        <PipelineProgress
          progress={progress}
          currentMessage={currentMessage}
          status={status}
          logs={logs}
        />
      </div>
    </main>
  );
}
