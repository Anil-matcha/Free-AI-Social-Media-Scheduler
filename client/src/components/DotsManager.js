"use client";

import React, { useState } from "react";
import { BotIcon, SparklesIcon, CheckIcon, PlusIcon } from "./Icons";
import CustomDropdown from "./CustomDropdown";

export default function DotsManager({
  agents = [],
  pages = [],
  onTriggerAgent,
  activeSpaceName,
}) {
  const [selectedAgentId, setSelectedAgentId] = useState(agents[0]?.id || "");
  const [selectedPageId, setSelectedPageId] = useState(pages[0]?.id || "");
  const [taskPrompt, setTaskPrompt] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [taskLogs, setTaskLogs] = useState([
    {
      id: "log-1",
      agent: "Synthesizer Dot",
      task: "Analyze competitive landscape and outline matrix on page",
      status: "completed",
      time: "10 mins ago",
    },
    {
      id: "log-2",
      agent: "Architect Dot",
      task: "Audit multi-agent communication protocol schema",
      status: "completed",
      time: "25 mins ago",
    },
  ]);

  const handleLaunchTask = async (e) => {
    e.preventDefault();
    if (!taskPrompt.trim()) return;

    setIsRunning(true);
    const agent = agents.find((a) => a.id === selectedAgentId) || agents[0];

    const newLog = {
      id: `log-${Date.now()}`,
      agent: agent?.name || "Dot Agent",
      task: taskPrompt,
      status: "working",
      time: "just now",
    };
    setTaskLogs([newLog, ...taskLogs]);

    await onTriggerAgent(selectedAgentId, taskPrompt, selectedPageId || null);

    setTimeout(() => {
      setTaskLogs((prev) =>
        prev.map((l) => (l.id === newLog.id ? { ...l, status: "completed" } : l))
      );
      setIsRunning(false);
      setTaskPrompt("");
    }, 2500);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-zinc-50 dark:bg-[#141416] transition-colors duration-200">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
              <BotIcon className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Dot Autonomous Agents</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                AI agents embedded directly inside <span className="text-zinc-800 dark:text-zinc-300 font-medium">{activeSpaceName}</span> to conduct research, update pages, and orchestrate workflows.
              </p>
            </div>
          </div>
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="bg-white dark:bg-[#1c1c20] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60">
                    {agent.avatar === "agent-bolt" ? "⚡" : agent.avatar === "agent-pen" ? "✍️" : agent.avatar === "agent-ruler" ? "📐" : "🤖"}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{agent.name}</h3>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{agent.role}</p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {agent.status}
                </span>
              </div>

              {/* Capabilities */}
              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mb-1.5 font-medium">Capabilities</div>
                <div className="flex flex-wrap gap-1.5">
                  {(agent.capabilities || []).map((cap, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-600 dark:text-zinc-400"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Launch Autonomous Directive Form */}
        <div className="bg-white dark:bg-[#1a1a1f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-2xs">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1 flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Dispatch Task to a Dot</span>
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
            Instruct an agent to autonomously research, summarize, synthesize, or write directly into any living page in this space.
          </p>

          <form onSubmit={handleLaunchTask} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Select Dot Agent</label>
                <CustomDropdown
                  value={selectedAgentId}
                  onChange={setSelectedAgentId}
                  options={agents.map((a) => ({ label: `${a.name} (${a.role})`, value: a.id }))}
                  className="w-full"
                  buttonClassName="w-full justify-between"
                  searchable={true}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Target Living Page (Optional)</label>
                <CustomDropdown
                  value={selectedPageId}
                  onChange={setSelectedPageId}
                  options={[
                    { label: "None (Space Level Only)", value: "" },
                    ...pages.map((p) => ({ label: `${p.icon || "📄"} ${p.title}`, value: p.id })),
                  ]}
                  className="w-full"
                  buttonClassName="w-full justify-between"
                  searchable={true}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Autonomous Directive / Instruction</label>
              <textarea
                rows={3}
                required
                value={taskPrompt}
                onChange={(e) => setTaskPrompt(e.target.value)}
                placeholder="e.g. Conduct a SWOT analysis of our proposed roadmap and append recommendations to the launch page."
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500 leading-relaxed"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isRunning || !taskPrompt.trim()}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors shadow-2xs"
              >
                <SparklesIcon className="w-4 h-4" />
                <span>{isRunning ? "Dot is Working..." : "Dispatch Task"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Task Execution Stream / History */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
            Recent Dot Activity & Directives
          </h3>
          <div className="space-y-2">
            {taskLogs.map((log) => (
              <div
                key={log.id}
                className="bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-zinc-800 rounded-lg p-3.5 flex items-center justify-between text-xs shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  <div>
                    <div className="font-medium text-zinc-800 dark:text-zinc-200">
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{log.agent}</span>: {log.task}
                    </div>
                    <div className="text-[10px] text-zinc-400 dark:text-zinc-500">{log.time}</div>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${
                    log.status === "completed"
                      ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20"
                      : "bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20 animate-pulse"
                  }`}
                >
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
