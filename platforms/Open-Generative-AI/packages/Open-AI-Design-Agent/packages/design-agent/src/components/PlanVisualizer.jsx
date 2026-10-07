"use client";
import React from "react";
import { FiBox, FiArrowRight, FiZap } from "react-icons/fi";

/**
 * Renders a DAG (Directed Acyclic Graph) of plan nodes.
 * Groups nodes by their topological layers for a clean horizontal flow.
 */
export default function PlanVisualizer({ plan, theme = "dark" }) {
  if (!plan || !plan.nodes) return null;

  // Simple topological grouping by dependencies
  const layers = [];
  const processed = new Set();
  let remaining = [...plan.nodes];

  while (remaining.length > 0) {
    const layer = remaining.filter(n => 
      !n.depends || n.depends.length === 0 || n.depends.every(d => processed.has(d))
    );
    if (layer.length === 0) break; // cycle or missing dep
    layers.push(layer);
    layer.forEach(n => processed.add(n.id));
    remaining = remaining.filter(n => !processed.has(n.id));
  }

  return (
    <div className={`mt-4 mb-4 p-4 rounded border shadow-xl bg-bg-page/50 backdrop-blur-sm ${
      theme === "dark" ? "border-divider shadow-black/40" : "border-divider shadow-slate-200"
    }`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[13px] font-bold text-primary flex items-center gap-2 uppercase tracking-widest">
            <FiZap className="animate-pulse" /> Proposed Execution Plan
          </h3>
          <p className="text-[11px] text-secondary-text mt-1 italic">
            &ldquo;{plan.title}&rdquo;
          </p>
        </div>
        <div className="text-right">
          <div className="text-[12px] font-bold text-primary-text">
            {plan.total_credits} <span className="text-[10px] text-secondary-text font-normal">credits</span>
          </div>
          <div className="text-[10px] text-secondary-text uppercase tracking-tight">
            {plan.nodes.length} steps
          </div>
        </div>
      </div>

      <div className="relative overflow-x-auto scrollbar-hide pb-4">
        <div className="flex items-start gap-12 min-w-max px-4">
          {layers.map((layer, lIdx) => (
            <div key={lIdx} className="flex flex-col gap-6 justify-center min-h-[200px]">
              {layer.map((node) => (
                <div 
                  key={node.id} 
                  id={`plan-node-${node.id}`}
                  className="w-48 p-3 rounded bg-bg-card border border-divider shadow-sm hover:border-primary/50 transition-all group relative z-10"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-primary opacity-70">#{node.id}</span>
                    <span className="text-[10px] font-bold text-secondary-text bg-bg-page px-1.5 py-0.5 rounded border border-divider">
                      {node.est_credits || 0} cr
                    </span>
                  </div>
                  <div className="text-[12px] font-bold text-primary-text truncate group-hover:whitespace-normal group-hover:overflow-visible transition-all">
                    {node.tool.replace(/_/g, " ")}
                  </div>
                  <div className="text-[11px] text-secondary-text mt-1.5 leading-tight line-clamp-2 italic">
                    {node.label || "Processing asset..."}
                  </div>
                  
                  {/* Visual connectors (CSS arrows) */}
                  {lIdx < layers.length - 1 && (
                    <div className="absolute top-1/2 -right-12 w-12 h-px bg-gradient-to-r from-divider to-transparent" />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {plan.notes && plan.notes.length > 0 && (
        <div className="mt-4 pt-4 border-t border-divider">
          {plan.notes.map((note, i) => (
            <div key={i} className="text-[10px] text-secondary-text flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-primary" /> {note}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
