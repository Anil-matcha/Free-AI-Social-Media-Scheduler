"use client";

import { useRef, useEffect } from "react";
import {
  FileText,
  Users,
  Layout,
  Image,
  Film,
  Video,
  Scissors,
  CheckCircle,
  Circle,
  Loader2,
} from "lucide-react";

const STAGES = [
  { id: "screenwriter", label: "Story", icon: FileText, progress_range: [5, 25] },
  { id: "characters", label: "Characters", icon: Users, progress_range: [20, 35] },
  { id: "storyboard", label: "Storyboard", icon: Layout, progress_range: [30, 45] },
  { id: "portraits", label: "Portraits", icon: Image, progress_range: [40, 55] },
  { id: "frames", label: "Frames", icon: Film, progress_range: [50, 75] },
  { id: "video", label: "Video", icon: Video, progress_range: [65, 88] },
  { id: "concat", label: "Done", icon: Scissors, progress_range: [88, 100] },
];

function getStageState(stage, progress) {
  const [start, end] = stage.progress_range;
  if (progress >= end) return "done";
  if (progress >= start) return "active";
  return "pending";
}

export default function PipelineProgress({
  progress,
  currentMessage,
  status,
  logs,
}) {
  const logsEndRef = useRef(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="space-y-6">
      {/* Stage timeline */}
      <div
        className="p-6 rounded-2xl"
        style={{
          backgroundColor: "#12121a",
          border: "1px solid #1a1a26",
        }}
      >
        <h2 className="text-sm font-semibold mb-6" style={{ color: "#94a3b8" }}>
          Pipeline Progress
        </h2>

        {/* Stage nodes */}
        <div className="flex items-center gap-0">
          {STAGES.map((stage, i) => {
            const state =
              status === "completed"
                ? "done"
                : status === "failed"
                ? getStageState(stage, progress) === "active"
                  ? "failed"
                  : getStageState(stage, progress)
                : getStageState(stage, progress);

            const Icon = stage.icon;
            const isLast = i === STAGES.length - 1;

            return (
              <div key={stage.id} className="flex items-center flex-1">
                {/* Node */}
                <div className="flex flex-col items-center" style={{ minWidth: 60 }}>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all"
                    style={{
                      backgroundColor:
                        state === "done"
                          ? "rgba(124, 58, 237, 0.2)"
                          : state === "active"
                          ? "rgba(124, 58, 237, 0.15)"
                          : state === "failed"
                          ? "rgba(239, 68, 68, 0.15)"
                          : "#1a1a26",
                      border:
                        state === "done"
                          ? "2px solid #7c3aed"
                          : state === "active"
                          ? "2px solid rgba(124, 58, 237, 0.6)"
                          : state === "failed"
                          ? "2px solid rgba(239, 68, 68, 0.6)"
                          : "2px solid #22223a",
                      boxShadow:
                        state === "active"
                          ? "0 0 12px rgba(124, 58, 237, 0.4)"
                          : "none",
                    }}
                  >
                    {state === "done" ? (
                      <CheckCircle size={16} style={{ color: "#7c3aed" }} />
                    ) : state === "active" ? (
                      <Loader2
                        size={16}
                        className="animate-spin"
                        style={{ color: "#a78bfa" }}
                      />
                    ) : (
                      <Icon
                        size={15}
                        style={{
                          color:
                            state === "failed" ? "#f87171" : "#4b5563",
                        }}
                      />
                    )}
                  </div>
                  <span
                    className="text-xs font-medium text-center"
                    style={{
                      color:
                        state === "done"
                          ? "#a78bfa"
                          : state === "active"
                          ? "#e2e8f0"
                          : state === "failed"
                          ? "#f87171"
                          : "#4b5563",
                    }}
                  >
                    {stage.label}
                  </span>
                </div>

                {/* Connector line */}
                {!isLast && (
                  <div
                    className="flex-1 h-0.5 mx-1 transition-all"
                    style={{
                      backgroundColor:
                        getStageState(stage, progress) === "done" ||
                        status === "completed"
                          ? "#7c3aed"
                          : "#22223a",
                      opacity:
                        getStageState(stage, progress) === "done" ||
                        status === "completed"
                          ? 0.6
                          : 1,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs" style={{ color: "#6b7280" }}>
              {currentMessage}
            </span>
            <span
              className="text-xs font-mono font-bold"
              style={{ color: "#7c3aed" }}
            >
              {progress}%
            </span>
          </div>
          <div
            className="w-full h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: "#1a1a26" }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progress}%`,
                background:
                  status === "failed"
                    ? "#ef4444"
                    : "linear-gradient(90deg, #7c3aed 0%, #a78bfa 100%)",
                boxShadow:
                  status !== "failed"
                    ? "0 0 8px rgba(124, 58, 237, 0.5)"
                    : "none",
              }}
            />
          </div>
        </div>
      </div>

      {/* Live logs */}
      {logs.length > 0 && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            backgroundColor: "#0d0d14",
            border: "1px solid #1a1a26",
          }}
        >
          <div
            className="px-4 py-3 flex items-center gap-2"
            style={{ borderBottom: "1px solid #1a1a26" }}
          >
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium" style={{ color: "#6b7280" }}>
              Pipeline Log
            </span>
          </div>
          <div
            className="p-4 max-h-48 overflow-y-auto font-mono text-xs space-y-1"
            style={{ color: "#64748b" }}
          >
            {logs.map((log, i) => (
              <div
                key={i}
                className="flex gap-3"
                style={{
                  color:
                    log.type === "complete"
                      ? "#86efac"
                      : log.type === "error"
                      ? "#fca5a5"
                      : "#94a3b8",
                }}
              >
                <span style={{ color: "#374151", flexShrink: 0 }}>{log.time}</span>
                <span>{log.message}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}
