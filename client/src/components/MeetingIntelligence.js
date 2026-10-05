"use client";

import React, { useState } from "react";
import { MicIcon, SparklesIcon, PlusIcon, PageIcon, CheckIcon } from "./Icons";

export default function MeetingIntelligence({
  meetings = [],
  onCreateMeeting,
  onConvertToActionPage,
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);

  const startMeeting = () => {
    setIsRecording(true);
    setSeconds(0);
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    setTimerInterval(interval);
  };

  const stopMeeting = () => {
    if (timerInterval) clearInterval(timerInterval);
    setIsRecording(false);

    // Create a simulated meeting note
    onCreateMeeting({
      title: `Standup & Roadmap Sync (${new Date().toLocaleDateString()})`,
      duration_seconds: seconds || 120,
      summary: "Discussed milestone deliverables, Dot agent autonomous workflows, and real-time multiplayer editing capabilities.",
      transcript: "Speaker 1: Let's review the sprint deliverables. Speaker 2: Supabase database and Next.js frontend are aligned. Dot agents are processing backlog items.",
      action_items: [
        "Deploy Next.js App Router frontend to port 3000",
        "Keep FastAPI backend active on port 8000",
        "Verify full CRUD with Supabase PostgreSQL tables",
      ],
    });
  };

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-zinc-50 dark:bg-[#141416] transition-colors duration-200">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-violet-100 dark:bg-violet-600/20 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-500/30">
              <MicIcon className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Meeting Audio & Intelligence</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Capture live audio or team discussions, auto-generate structured takeaways, and ingest action items into Pages.
              </p>
            </div>
          </div>

          {/* Record Button */}
          {!isRecording ? (
            <button
              onClick={startMeeting}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-xl text-xs font-medium transition-colors shadow-2xs"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
              <span>Record Live Meeting</span>
            </button>
          ) : (
            <button
              onClick={stopMeeting}
              className="flex items-center gap-2 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-500/40 px-4 py-2 rounded-xl text-xs font-medium transition-colors shadow-2xs"
            >
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
              <span>Stop & Synthesize ({formatTime(seconds)})</span>
            </button>
          )}
        </div>

        {/* In-Progress Recording Banner */}
        {isRecording && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
              <div className="text-xs text-rose-800 dark:text-rose-200">
                <span className="font-semibold">Live audio processing active...</span> Capturing discussion and auto-detecting action items.
              </div>
            </div>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-300">{formatTime(seconds)}</span>
          </div>
        )}

        {/* Past Meeting Summaries */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Meeting Records & Syntheses ({meetings.length})
          </h3>

          {meetings.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-[#19191d] border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-400 dark:text-zinc-500 shadow-2xs">
              No recorded meetings in this space yet. Start a live recording above to auto-generate notes.
            </div>
          ) : (
            meetings.map((meet) => (
              <div
                key={meet.id}
                className="bg-white dark:bg-[#19191d] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-3.5 shadow-2xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{meet.title}</h4>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Duration: {Math.floor(meet.duration_seconds / 60)} mins • {new Date(meet.created_at || Date.now()).toLocaleDateString()}
                    </p>
                  </div>

                  <button
                    onClick={() => onConvertToActionPage(meet)}
                    className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-600/20 hover:bg-indigo-100 dark:hover:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-2xs"
                    title="Export action items directly to a new Living Page"
                  >
                    <PageIcon className="w-3.5 h-3.5" />
                    <span>Convert to Page</span>
                  </button>
                </div>

                {/* Summary */}
                <div className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-[#202026] p-3 rounded-lg border border-zinc-200 dark:border-zinc-800/80">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-200 block mb-1">AI Executive Summary:</span>
                  {meet.summary}
                </div>

                {/* Action Items Checklist */}
                {meet.action_items && meet.action_items.length > 0 && (
                  <div>
                    <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Action Items:</div>
                    <ul className="space-y-1">
                      {meet.action_items.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-zinc-800 dark:text-zinc-300">
                          <CheckIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
