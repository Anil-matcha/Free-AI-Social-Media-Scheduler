"use client";

import { useState } from "react";
import { Sparkles, ChevronDown, Loader2 } from "lucide-react";

const STYLES = [
  { value: "Cinematic", label: "Cinematic", desc: "Epic film quality" },
  { value: "Realistic", label: "Realistic", desc: "True-to-life" },
  { value: "Anime", label: "Anime", desc: "Japanese animation" },
  { value: "Fantasy", label: "Fantasy", desc: "Magical & fantastical" },
  { value: "Documentary", label: "Documentary", desc: "Journalistic style" },
];

const MODES = [
  {
    value: "idea2video",
    label: "Idea to Video",
    desc: "Full agentic pipeline: story, scenes, storyboard, video",
  },
  {
    value: "script2video",
    label: "Script to Video",
    desc: "Start from your own scene script",
  },
];

export default function IdeaForm({ onSubmit, isSubmitting }) {
  const [idea, setIdea] = useState("");
  const [userRequirement, setUserRequirement] = useState("");
  const [style, setStyle] = useState("Cinematic");
  const [mode, setMode] = useState("idea2video");
  const [script, setScript] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!idea.trim() && (mode !== "script2video" || !script.trim())) return;
    onSubmit({
      idea: idea.trim(),
      user_requirement: userRequirement.trim(),
      style,
      mode,
      script: script.trim(),
    });
  };

  const inputStyle = {
    backgroundColor: "#12121a",
    border: "1px solid #22223a",
    borderRadius: "12px",
    color: "#e2e8f0",
    padding: "12px 16px",
    width: "100%",
    fontSize: "14px",
    transition: "border-color 0.2s",
    outline: "none",
    resize: "vertical",
  };

  const labelStyle = {
    display: "block",
    fontSize: "13px",
    fontWeight: "500",
    marginBottom: "8px",
    color: "#94a3b8",
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl p-6 space-y-6"
      style={{
        backgroundColor: "#12121a",
        border: "1px solid #1a1a26",
      }}
    >
      {/* Mode selector */}
      <div>
        <label style={labelStyle}>Generation Mode</label>
        <div className="grid grid-cols-2 gap-3">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              className="text-left p-4 rounded-xl transition-all"
              style={{
                backgroundColor: mode === m.value ? "rgba(124, 58, 237, 0.15)" : "#1a1a26",
                border: mode === m.value
                  ? "1px solid rgba(124, 58, 237, 0.5)"
                  : "1px solid #22223a",
                cursor: "pointer",
              }}
            >
              <div
                className="text-sm font-semibold mb-1"
                style={{ color: mode === m.value ? "#a78bfa" : "#e2e8f0" }}
              >
                {m.label}
              </div>
              <div className="text-xs" style={{ color: "#6b7280" }}>
                {m.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Idea input */}
      <div>
        <label style={labelStyle}>
          {mode === "script2video" ? "Brief idea or title" : "Your Idea *"}
        </label>
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder={
            mode === "idea2video"
              ? "e.g. A lone astronaut discovers an ancient alien structure on Mars..."
              : "Brief title or concept for your video"
          }
          rows={3}
          required={mode === "idea2video"}
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = "#7c3aed")}
          onBlur={(e) => (e.target.style.borderColor = "#22223a")}
        />
      </div>

      {/* Script input (script2video only) */}
      {mode === "script2video" && (
        <div>
          <label style={labelStyle}>Scene Script *</label>
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="Write your scene script here. Be descriptive about setting, characters, actions, and mood..."
            rows={6}
            required
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = "#7c3aed")}
            onBlur={(e) => (e.target.style.borderColor = "#22223a")}
          />
        </div>
      )}

      {/* Style selector */}
      <div>
        <label style={labelStyle}>Visual Style</label>
        <div className="grid grid-cols-5 gap-2">
          {STYLES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setStyle(s.value)}
              className="p-3 rounded-xl text-center transition-all"
              style={{
                backgroundColor: style === s.value ? "rgba(124, 58, 237, 0.15)" : "#1a1a26",
                border: style === s.value
                  ? "1px solid rgba(124, 58, 237, 0.5)"
                  : "1px solid #22223a",
                cursor: "pointer",
              }}
            >
              <div
                className="text-xs font-semibold mb-1"
                style={{ color: style === s.value ? "#a78bfa" : "#e2e8f0" }}
              >
                {s.label}
              </div>
              <div className="text-xs" style={{ color: "#4b5563", fontSize: "10px" }}>
                {s.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Additional requirements */}
      <div>
        <label style={labelStyle}>
          Additional Requirements{" "}
          <span style={{ color: "#4b5563", fontWeight: 400 }}>(optional)</span>
        </label>
        <textarea
          value={userRequirement}
          onChange={(e) => setUserRequirement(e.target.value)}
          placeholder="Any specific instructions, mood, pacing, color palette, character details..."
          rows={2}
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = "#7c3aed")}
          onBlur={(e) => (e.target.style.borderColor = "#22223a")}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting || (!idea.trim() && (mode !== "script2video" || !script.trim()))}
        className="w-full py-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
        style={{
          background: isSubmitting
            ? "#3b3b5c"
            : "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
          color: isSubmitting ? "#6b7280" : "white",
          cursor: isSubmitting ? "not-allowed" : "pointer",
          boxShadow: isSubmitting ? "none" : "0 4px 20px rgba(124, 58, 237, 0.4)",
        }}
      >
        {isSubmitting ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Starting pipeline...
          </>
        ) : (
          <>
            <Sparkles size={16} />
            Generate Video
          </>
        )}
      </button>
    </form>
  );
}
