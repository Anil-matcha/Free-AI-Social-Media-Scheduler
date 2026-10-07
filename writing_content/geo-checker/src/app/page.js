"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import {
  FaSearch,
  FaSpinner,
  FaGlobe,
  FaCheckCircle,
  FaExclamationTriangle,
  FaArrowLeft,
  FaCoins,
  FaChevronDown,
  FaTimes,
  FaShieldAlt,
  FaChartLine,
  FaRobot,
  FaDatabase,
  FaLink,
  FaDownload,
  FaUndo,
  FaAngleDoubleRight,
} from "react-icons/fa";
import clsx from "clsx";

const ENGINES = [
  {
    id: "chatgpt",
    name: "ChatGPT Search",
    desc: "OpenAI GPT-4o search citation",
  },
  {
    id: "perplexity",
    name: "Perplexity AI",
    desc: "Citation visibility indices",
  },
  {
    id: "google",
    name: "Google AI Overviews",
    desc: "Google Gemini overview citation",
  },
  {
    id: "claude",
    name: "Claude Sonnet",
    desc: "Anthropic conversational recall",
  },
  { id: "gemini", name: "Gemini Pro", desc: "Google Search groundings" },
];

export default function StudioPage() {
  const { data: session, update: updateSession } = useSession();

  // Inputs
  const [url, setUrl] = useState("");
  const [keyword, setKeyword] = useState("");
  const [engines, setEngines] = useState(["chatgpt", "perplexity", "google"]);
  const [useReasoning, setUseReasoning] = useState(false);
  const [checkSchema, setCheckSchema] = useState(true);

  // States
  const [result, setResult] = useState(null);
  const [reportId, setReportId] = useState("");
  const [generatingStatus, setGeneratingStatus] = useState(""); // "", "generating", "success", "error"
  const [generatingError, setGeneratingError] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Advanced toggles container visibility
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Progress Loader text simulator
  const [loaderIndex, setLoaderIndex] = useState(0);
  const timerIntervalRef = useRef(null);
  const loaderIntervalRef = useRef(null);

  const loaderTexts = [
    "Scraping homepage elements...",
    "Cleansing HTML tag syntax...",
    "Validating robots.txt indexing parameters...",
    "Scanning content copy for semantic entities...",
    "Assessing E-E-A-T signals (Expertise & Authoritativeness)...",
    "Running LLM generative engine simulation...",
    "Compiling final visibility recommendations...",
  ];

  // Load saved report if URL has ?id=
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const savedId = params.get("id");

    if (savedId) {
      const loadSavedReport = async () => {
        try {
          const res = await fetch(`/api/creations?id=${savedId}`);
          if (res.ok) {
            const data = await res.json();
            setUrl(data.url);
            setKeyword(data.keyword);
            try {
              setEngines(JSON.parse(data.engines));
            } catch (e) {}
            if (data.reportData) {
              const parsed = JSON.parse(data.reportData);
              setResult(parsed);
              setReportId(data.id);
              setGeneratingStatus("success");
            }
          }
        } catch (e) {
          console.error("Error loading saved report:", e);
        }
      };
      loadSavedReport();
    }
  }, []);

  // Active Timer hooks
  useEffect(() => {
    if (generatingStatus === "generating") {
      setElapsedSeconds(0);
      setLoaderIndex(0);
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
      loaderIntervalRef.current = setInterval(() => {
        setLoaderIndex((prev) => (prev + 1) % loaderTexts.length);
      }, 2200);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (loaderIntervalRef.current) clearInterval(loaderIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (loaderIntervalRef.current) clearInterval(loaderIntervalRef.current);
    };
  }, [generatingStatus]);

  const toggleEngine = (id) => {
    setEngines((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
    );
  };

  const handleGenerate = async () => {
    if (!session?.user) {
      signIn("google");
      return;
    }

    if (!url) {
      setGeneratingError("Please enter a website URL to audit.");
      setGeneratingStatus("error");
      return;
    }

    if (!keyword) {
      setGeneratingError("Please enter your target keyword niche.");
      setGeneratingStatus("error");
      return;
    }

    if (engines.length === 0) {
      setGeneratingError("Please select at least one AI search engine.");
      setGeneratingStatus("error");
      return;
    }

    setGeneratingStatus("generating");
    setGeneratingError("");
    setResult(null);

    try {
      const res = await fetch("/api/generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          keyword,
          engines,
        }),
      });

      if (res.status === 402) {
        setGeneratingError(
          "Insufficient credits. Please purchase a credit pack on the pricing page.",
        );
        setGeneratingStatus("error");
        return;
      }

      if (!res.ok) throw new Error("Visibility audit request failed");
      const data = await res.json();

      updateSession(); // refresh credits

      if (data.status === "completed" && data.reportData) {
        try {
          const parsedReport = JSON.parse(data.reportData);
          setResult(parsedReport);
          setReportId(data.id);
          setGeneratingStatus("success");
        } catch (e) {
          console.error(
            "Failed to parse reportData directly, falling back to poll:",
            e,
          );
          pollResult(data.id);
        }
      } else {
        pollResult(data.id);
      }
    } catch (err) {
      console.error(err);
      setGeneratingError(
        "An error occurred during generative engine audit. Please try again.",
      );
      setGeneratingStatus("error");
    }
  };

  const pollResult = async (id) => {
    let completed = false;

    while (!completed) {
      await new Promise((resolve) => setTimeout(resolve, 2500));

      try {
        const res = await fetch(`/api/creations?id=${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "completed") {
            if (data.reportData) {
              try {
                const parsedReport = JSON.parse(data.reportData);
                setResult(parsedReport);
                setReportId(data.id);
                setGeneratingStatus("success");
                completed = true;
              } catch (e) {
                console.error("Failed to parse polled reportData:", e);
                setGeneratingError(
                  "AI visibility check report could not be parsed. Please try again.",
                );
                setGeneratingStatus("error");
                completed = true;
              }
            } else {
              console.warn(
                "Report status is completed but reportData is empty. Retrying...",
              );
            }
          } else if (data.status === "failed") {
            setGeneratingError(
              "AI visibility check failed. Please verify your website link and try again.",
            );
            setGeneratingStatus("error");
            completed = true;
          }
        }
      } catch (err) {
        console.error("Error polling report status:", err);
      }
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const downloadUrl = `/api/download?url=${encodeURIComponent(
      `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(result, null, 2))}`,
    )}`;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `geo_audit_${reportId || Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Reset page to initial portal view
  const handleReset = () => {
    setResult(null);
    setGeneratingStatus("");
    setGeneratingError("");
  };

  const getButtonContent = () => {
    if (!session?.user) {
      return {
        text: "Sign in with Google",
        className:
          "w-full bg-primary hover:bg-primary-hover text-white rounded py-3.5 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-primary/20 active:scale-[0.99]",
        icon: <FaSearch className="text-xs text-white animate-pulse" />,
        disabled: false,
      };
    }

    if (generatingStatus === "generating") {
      return {
        text: `Analyzing... (${elapsedSeconds}s)`,
        className:
          "w-full bg-bg-card border border-divider text-secondary-text rounded py-3.5 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-not-allowed opacity-60",
        icon: (
          <FaSpinner className="animate-spin text-xs text-secondary-text" />
        ),
        disabled: true,
      };
    }

    if (!url && !keyword) {
      return {
        text: "Enter URL & Keyword to Begin",
        className:
          "w-full bg-bg-card hover:bg-bg-card-hover text-primary-text border border-divider rounded py-3.5 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99]",
        icon: <FaGlobe className="text-xs text-secondary-text" />,
        disabled: false,
      };
    }

    if (!url) {
      return {
        text: "Enter Website URL",
        className:
          "w-full bg-bg-card hover:bg-bg-card-hover text-primary-text border border-divider rounded py-3.5 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99]",
        icon: <FaGlobe className="text-xs text-secondary-text" />,
        disabled: false,
      };
    }

    if (!keyword) {
      return {
        text: "Enter Search Keyword",
        className:
          "w-full bg-bg-card hover:bg-bg-card-hover text-primary-text border border-divider rounded py-3.5 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99]",
        icon: <FaSearch className="text-xs text-secondary-text" />,
        disabled: false,
      };
    }

    return {
      text: "Run AI Visibility Audit (18 Credits)",
      className:
        "w-full bg-primary hover:bg-primary-hover text-white rounded py-3.5 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-primary/20 active:scale-[0.99]",
      icon: <FaSearch className="text-xs text-white animate-pulse" />,
      disabled: false,
    };
  };

  const btn = getButtonContent();

  return (
    <div className="flex-1 bg-bg-page text-primary-text font-sans overflow-y-auto relative selection:bg-primary/30">
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 🔮 STATE A: INITIAL SEARCH PORTAL */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {generatingStatus !== "generating" && !result && (
        <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24 relative z-10 flex flex-col items-center">
          {/* Hero Branding */}
          <div className="text-center space-y-4 max-w-2xl mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider">
              <FaGlobe className="animate-spin duration-3000 text-primary" />{" "}
              Generative Engine Optimization (GEO)
            </div>
            <h1 className="text-4xl sm:text-5xl font-black font-heading text-primary-text tracking-tight leading-none">
              Is Your Landing Page <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-hover">
                Visible in AI Search?
              </span>
            </h1>
            <p className="text-sm sm:text-base text-secondary-text leading-relaxed font-medium">
              Audit search visibility and citation index parameters. Instantly
              evaluate how ChatGPT Search, Perplexity, and Google AI Overviews
              structure, credit, and read your page content.
            </p>
          </div>

          {/* Centered Search-Console Card */}
          <div className="w-full bg-bg-card/50 border border-divider/50 rounded p-6 sm:p-8 backdrop-blur-md shadow-2xl space-y-6">
            {/* Split Input Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* URL Field */}
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-secondary-text uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FaLink className="text-primary text-[9px]" /> 1. Website URL
                  to Audit
                </label>
                <div
                  className={clsx(
                    "relative flex items-center bg-bg-page/80 border rounded transition-all duration-200",
                    generatingStatus === "error" &&
                      !url &&
                      generatingError.toLowerCase().includes("url")
                      ? "border-red-500/80 bg-red-950/10 shadow-lg shadow-red-950/20 animate-pulse"
                      : "border-divider/50 hover:border-divider focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/35",
                  )}
                >
                  <span className="text-xs text-secondary-text pl-4 select-none font-bold">
                    https://
                  </span>
                  <input
                    type="text"
                    placeholder="example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full bg-transparent border-0 text-xs font-semibold py-4 pl-1 pr-4 text-primary-text placeholder-secondary-text/40 focus:outline-none focus:ring-0"
                  />
                </div>
                {generatingStatus === "error" &&
                  !url &&
                  generatingError.toLowerCase().includes("url") && (
                    <div className="text-[10px] text-red-400 font-bold mt-2 flex items-center gap-1">
                      <FaExclamationTriangle className="text-red-500 text-[9px]" />{" "}
                      {generatingError}
                    </div>
                  )}
              </div>

              {/* Keyword Field */}
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-secondary-text uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FaSearch className="text-primary text-[9px]" /> 2. Target
                  Search Query / Niche
                </label>
                <div
                  className={clsx(
                    "relative flex items-center bg-bg-page/80 border rounded transition-all duration-200",
                    generatingStatus === "error" &&
                      !keyword &&
                      generatingError.toLowerCase().includes("keyword")
                      ? "border-red-500/80 bg-red-950/10 shadow-lg shadow-red-950/20 animate-pulse"
                      : "border-divider/50 hover:border-divider focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/35",
                  )}
                >
                  <input
                    type="text"
                    placeholder="e.g., best task manager for engineering startups"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="w-full bg-transparent border-0 text-xs font-semibold py-4 px-4 text-primary-text placeholder-secondary-text/40 focus:outline-none focus:ring-0"
                  />
                </div>
                {generatingStatus === "error" &&
                  !keyword &&
                  generatingError.toLowerCase().includes("keyword") && (
                    <div className="text-[10px] text-red-400 font-bold mt-2 flex items-center gap-1">
                      <FaExclamationTriangle className="text-red-500 text-[9px]" />{" "}
                      {generatingError}
                    </div>
                  )}
              </div>
            </div>

            {/* AI Search Engines Selection */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-secondary-text uppercase tracking-wider mb-3">
                3. Choose Target AI Search Engines to Evaluate
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                {ENGINES.map((eng) => {
                  const checked = engines.includes(eng.id);
                  return (
                    <button
                      key={eng.id}
                      type="button"
                      onClick={() => toggleEngine(eng.id)}
                      className={clsx(
                        "p-3 rounded border text-[11px] flex flex-col justify-between items-start transition-all cursor-pointer text-left h-20",
                        checked
                          ? "bg-primary/10 border-primary text-primary-text font-bold shadow-lg shadow-primary/5"
                          : "bg-bg-page/80 border-divider/50 text-secondary-text hover:bg-bg-card-hover hover:text-primary-text",
                      )}
                    >
                      <span className="font-semibold block">{eng.name}</span>
                      <div className="flex justify-between items-center w-full mt-1">
                        <span className="text-[8px] text-secondary-text leading-tight font-medium line-clamp-1">
                          {eng.desc}
                        </span>
                        <div
                          className={clsx(
                            "h-3.5 w-3.5 rounded border flex items-center justify-center text-[7px] flex-shrink-0 ml-1.5",
                            checked
                              ? "bg-primary border-primary-hover text-white"
                              : "border-divider/50 bg-bg-page",
                          )}
                        >
                          {checked && "✓"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Advanced Toggle Controls */}
            <div className="border-t border-divider/50 pt-4">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1.5 text-[10px] font-bold text-secondary-text hover:text-primary-text uppercase tracking-wider transition-colors cursor-pointer"
              >
                <span>Advanced Crawler Rules Settings</span>
                <FaChevronDown
                  className={clsx(
                    "text-[8px] transition-transform duration-200",
                    showAdvanced && "transform rotate-180",
                  )}
                />
              </button>

              {showAdvanced && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between p-3.5 bg-bg-page/80 border border-divider/50 rounded">
                    <div>
                      <span className="text-xs font-bold text-primary-text block">
                        Prioritize Reasoning Depth
                      </span>
                      <span className="text-[9px] text-secondary-text leading-none block mt-0.5">
                        Applies slower deep-reasoning chains
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUseReasoning(!useReasoning)}
                      className={clsx(
                        "relative inline-flex h-6.5 w-11.5 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                        useReasoning ? "bg-primary" : "bg-divider/50",
                      )}
                    >
                      <span
                        className={clsx(
                          "pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow transition duration-200 ease-in-out",
                          useReasoning ? "translate-x-5" : "translate-x-0",
                        )}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-bg-page/80 border border-divider/50 rounded">
                    <div>
                      <span className="text-xs font-bold text-primary-text block">
                        Audit Structured Schema
                      </span>
                      <span className="text-[9px] text-secondary-text leading-none block mt-0.5">
                        Validates JSON-LD semantic models
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCheckSchema(!checkSchema)}
                      className={clsx(
                        "relative inline-flex h-6.5 w-11.5 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                        checkSchema ? "bg-primary" : "bg-divider/50",
                      )}
                    >
                      <span
                        className={clsx(
                          "pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow transition duration-200 ease-in-out",
                          checkSchema ? "translate-x-5" : "translate-x-0",
                        )}
                      />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Launch Action triggers */}
            <div className="border-t border-divider/50 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Cost & Credits warning display */}
              <div className="flex flex-col sm:items-start text-center sm:text-left">
                <span className="text-[10px] text-secondary-text font-bold uppercase tracking-wider">
                  Audit cost: 18 credits
                </span>
                <span className="text-[11px] text-amber-300 font-bold flex items-center justify-center sm:justify-start gap-1.5 mt-1 bg-amber-950/20 border border-amber-800/30 px-3 py-1 rounded-full">
                  <FaCoins className="animate-pulse text-amber-400" />
                  <span>Deducted on analysis initialization</span>
                </span>
              </div>

              {/* Central Trigger Button */}
              <button
                onClick={handleGenerate}
                disabled={btn.disabled}
                className={clsx(
                  btn.className,
                  "w-full sm:w-auto sm:px-8 py-4 rounded shadow-xl hover:scale-[1.01] active:scale-[0.99] font-extrabold text-sm",
                )}
              >
                {btn.icon}
                <span>{btn.text}</span>
              </button>
            </div>

            {/* Non-form general error alert console */}
            {generatingStatus === "error" &&
              !(
                generatingError.toLowerCase().includes("url") ||
                generatingError.toLowerCase().includes("keyword")
              ) && (
                <div className="text-[11px] text-red-400 bg-red-950/40 border border-red-900/40 rounded p-4 flex items-start gap-2.5 shadow-inner mt-4 animate-in fade-in duration-200">
                  <FaExclamationTriangle className="text-red-500 flex-shrink-0 mt-0.5 text-xs animate-pulse" />
                  <span>{generatingError}</span>
                </div>
              )}
          </div>

          {/* Guest alert notifications banner */}
          {!session?.user && (
            <div className="max-w-xl w-full bg-amber-950/15 border border-amber-900/30 rounded p-4.5 text-center mt-8 flex items-center justify-center gap-3 shadow-inner">
              <FaExclamationTriangle className="text-amber-500 text-sm flex-shrink-0 animate-bounce" />
              <p className="text-[11px] text-amber-300 font-medium leading-relaxed text-left">
                Playing as Guest: You must sign in with Google to perform
                audits. Unsaved results are not stored.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 🌀 STATE B: LOADING ANALYSIS WINDOW */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {generatingStatus === "generating" && (
        <div className="max-w-xl mx-auto px-4 py-24 sm:py-32 relative z-10 flex flex-col items-center justify-center min-h-[70vh]">
          <div className="w-full bg-bg-card/50 border border-divider/50 rounded p-8 backdrop-blur-md shadow-2xl flex flex-col items-center text-center space-y-6">
            <div className="relative flex items-center justify-center">
              <div className="h-20 w-20 rounded-full border-4 border-dashed border-primary animate-spin" />
              <FaGlobe className="absolute text-2xl text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-hover animate-bounce" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-heading font-black text-white">
                Running GEO Auditor Core...
              </h2>
              <p className="text-xs text-primary font-semibold tracking-wider uppercase animate-pulse">
                {loaderTexts[loaderIndex]}
              </p>
            </div>

            <div className="h-1.5 w-full bg-bg-page rounded-full overflow-hidden border border-divider/50">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary-hover transition-all duration-300 ease-out"
                style={{
                  width: `${Math.min((elapsedSeconds / 15) * 100, 95)}%`,
                }}
              />
            </div>

            <p className="text-[10px] text-secondary-text leading-relaxed max-w-xs">
              Simulating crawling profiles and calculating keyword citation
              depth. Time elapsed:{" "}
              <span className="font-bold text-primary-text">
                {elapsedSeconds}s
              </span>
              . Max wait limit is 15s.
            </p>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 📈 STATE C: FULL-WIDTH RESULT DASHBOARD */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {generatingStatus === "success" && result && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 space-y-8 animate-in fade-in duration-300">
          {/* Dashboard Sticky Sub-Header Nav */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-bg-card/60 border border-divider/50 rounded-2xl p-5 backdrop-blur-md shadow-lg">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded uppercase">
                  GEO Report Output
                </span>
                <span className="text-xs text-secondary-text">
                  #{reportId.slice(-6)}
                </span>
              </div>
              <h2 className="text-lg font-black text-primary-text mt-1.5 truncate flex items-center gap-1.5">
                <FaGlobe className="text-secondary-text text-sm" />
                <span>{url}</span>
              </h2>
              <p className="text-xs text-secondary-text mt-1 font-medium truncate">
                Target Search Query:{" "}
                <span className="text-primary-text">"{keyword}"</span>
              </p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-4.5 py-2.5 bg-bg-page border border-divider/50 text-secondary-text hover:text-primary-text rounded text-xs font-bold transition-all cursor-pointer hover:bg-bg-card-hover"
              >
                <FaUndo className="text-[10px]" /> New Audit
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-4.5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded text-xs font-bold transition-all cursor-pointer shadow-lg shadow-primary/20 hover:scale-[1.01]"
              >
                <FaDownload className="text-[10px]" /> Export JSON
              </button>
            </div>
          </div>

          {/* Top Row: Score Gauges Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Gauge 1: Main Visibility Score */}
            <div className="bg-bg-card/40 border border-divider/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg relative group overflow-hidden">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="relative h-28 w-28 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="46"
                    className="stroke-divider/30"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="46"
                    className="stroke-primary"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 46}
                    strokeDashoffset={
                      2 * Math.PI * 46 -
                      (result.visibility_score / 100) * (2 * Math.PI * 46)
                    }
                    strokeLinecap="round"
                  />
                </svg>
                <div className="flex flex-col items-center justify-center z-10">
                  <span className="text-2xl font-black text-primary-text">
                    {result.visibility_score}%
                  </span>
                  <span className="text-[7px] font-bold text-secondary-text uppercase tracking-widest mt-0.5">
                    Visibility
                  </span>
                </div>
              </div>
              <h3 className="text-xs font-bold text-primary-text mt-4 uppercase tracking-wider">
                AI Search Visibility
              </h3>
              <p className="text-[9px] text-secondary-text mt-1 leading-relaxed">
                Overall citation coverage and recall index across engines
              </p>
            </div>

            {/* Gauge 2: E-E-A-T Quality */}
            <div className="bg-bg-card/40 border border-divider/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg relative group overflow-hidden">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="relative h-28 w-28 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="46"
                    className="stroke-divider/30"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="46"
                    className="stroke-primary"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 46}
                    strokeDashoffset={
                      2 * Math.PI * 46 -
                      (result.eeat_score / 100) * (2 * Math.PI * 46)
                    }
                    strokeLinecap="round"
                  />
                </svg>
                <div className="flex flex-col items-center justify-center z-10">
                  <span className="text-2xl font-black text-primary-text">
                    {result.eeat_score}%
                  </span>
                  <span className="text-[7px] font-bold text-secondary-text uppercase tracking-widest mt-0.5">
                    E-E-A-T
                  </span>
                </div>
              </div>
              <h3 className="text-xs font-bold text-primary-text mt-4 uppercase tracking-wider">
                E-E-A-T Authority
              </h3>
              <p className="text-[9px] text-secondary-text mt-1 leading-relaxed">
                Expertise, authoritativeness, and trust signals profile
              </p>
            </div>

            {/* Gauge 3: Citation Likelihood */}
            <div className="bg-bg-card/40 border border-divider/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg relative group overflow-hidden">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="relative h-28 w-28 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="46"
                    className="stroke-divider/30"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="46"
                    className="stroke-primary"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 46}
                    strokeDashoffset={
                      2 * Math.PI * 46 -
                      (result.citation_likelihood / 100) * (2 * Math.PI * 46)
                    }
                    strokeLinecap="round"
                  />
                </svg>
                <div className="flex flex-col items-center justify-center z-10">
                  <span className="text-2xl font-black text-primary-text">
                    {result.citation_likelihood}%
                  </span>
                  <span className="text-[7px] font-bold text-secondary-text uppercase tracking-widest mt-0.5">
                    Citation
                  </span>
                </div>
              </div>
              <h3 className="text-xs font-bold text-primary-text mt-4 uppercase tracking-wider">
                Citation Likelihood
              </h3>
              <p className="text-[9px] text-secondary-text mt-1 leading-relaxed">
                Probability of being referenced or quoted in answers
              </p>
            </div>

            {/* Gauge 4: Content Readability */}
            <div className="bg-bg-card/40 border border-divider/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg relative group overflow-hidden">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="relative h-28 w-28 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="46"
                    className="stroke-divider/30"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="46"
                    className="stroke-primary"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 46}
                    strokeDashoffset={
                      2 * Math.PI * 46 -
                      (result.readability_score / 100) * (2 * Math.PI * 46)
                    }
                    strokeLinecap="round"
                  />
                </svg>
                <div className="flex flex-col items-center justify-center z-10">
                  <span className="text-2xl font-black text-primary-text">
                    {result.readability_score}%
                  </span>
                  <span className="text-[7px] font-bold text-secondary-text uppercase tracking-widest mt-0.5">
                    Readability
                  </span>
                </div>
              </div>
              <h3 className="text-xs font-bold text-primary-text mt-4 uppercase tracking-wider">
                Content Readability
              </h3>
              <p className="text-[9px] text-secondary-text mt-1 leading-relaxed">
                Syntax simplicity and semantic indexing index
              </p>
            </div>
          </div>

          {/* Row 2: Summary Card */}
          <div className="bg-bg-card/30 border border-divider/50 rounded-2xl p-6 shadow-md">
            <span className="text-[10px] font-bold text-secondary-text uppercase tracking-wider block mb-2">
              Executive Summary Statement
            </span>
            <p className="text-xs sm:text-sm text-primary-text leading-relaxed font-medium font-sans">
              {result.summary}
            </p>
          </div>

          {/* Row 3: Strengths & Weaknesses Grids */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths Card */}
            <div className="bg-bg-card/30 border border-divider/50 rounded-2xl p-6 space-y-4">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block border-b border-divider/50 pb-2.5">
                ✓ AI Citation Strengths
              </span>
              <ul className="space-y-3">
                {result.strengths?.map((str, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-primary-text flex items-start gap-3 leading-relaxed font-medium"
                  >
                    <span className="h-5 w-5 rounded-full bg-emerald-955/20 text-emerald-455 border border-emerald-900/35 flex items-center justify-center text-[9px] flex-shrink-0 font-bold mt-0.5">
                      ✓
                    </span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses Card */}
            <div className="bg-bg-card/30 border border-divider/50 rounded-2xl p-6 space-y-4">
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block border-b border-divider/50 pb-2.5">
                ✕ AI Visibility Gaps
              </span>
              <ul className="space-y-3">
                {result.weaknesses?.map((weak, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-primary-text flex items-start gap-3 leading-relaxed font-medium"
                  >
                    <span className="h-5 w-5 rounded-full bg-red-955/20 text-red-455 border border-red-900/35 flex items-center justify-center text-[9px] flex-shrink-0 font-bold mt-0.5">
                      ✕
                    </span>
                    <span>{weak}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Row 4: Split Technical Signals and Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Technical Crawler card (1 Col) */}
            <div className="lg:col-span-1 bg-bg-card/30 border border-divider/50 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-secondary-text uppercase tracking-wider block border-b border-divider/50 pb-2.5">
                  Technical Crawler Signals
                </span>
                <div className="space-y-4 mt-4 text-xs font-semibold">
                  <div className="py-2 border-b border-divider/30">
                    <div className="text-secondary-text text-[10px] uppercase font-bold flex items-center gap-1.5">
                      <FaRobot /> Robots.txt
                    </div>
                    <div className="text-primary-text mt-1.5 leading-relaxed font-medium">
                      {result.technical_audit?.robots_txt}
                    </div>
                  </div>
                  <div className="py-2 border-b border-divider/30">
                    <div className="text-secondary-text text-[10px] uppercase font-bold flex items-center gap-1.5">
                      <FaDatabase /> Structured Schema
                    </div>
                    <div className="text-primary-text mt-1.5 leading-relaxed font-medium">
                      {result.technical_audit?.schema_markup}
                    </div>
                  </div>
                  <div className="py-2">
                    <div className="text-secondary-text text-[10px] uppercase font-bold flex items-center gap-1.5">
                      <FaLink /> Sitemap Directory
                    </div>
                    <div className="text-primary-text mt-1.5 leading-relaxed font-medium">
                      {result.technical_audit?.sitemap}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-divider/50 pt-4 mt-4">
                <div className="text-[10px] text-secondary-text font-bold leading-normal">
                  Crawler signals dictate how LLM search agent bots index,
                  reference, and tag semantic entities.
                </div>
              </div>
            </div>

            {/* Recommendations Roadmap (2 Cols) */}
            <div className="lg:col-span-2 bg-bg-card/30 border border-divider/50 rounded-2xl p-6 space-y-4">
              <span className="text-[10px] font-bold text-secondary-text uppercase tracking-wider block border-b border-divider/50 pb-2.5">
                Actionable Optimization Roadmap
              </span>
              <div className="space-y-3">
                {result.recommendations?.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-bg-page border border-divider/50 rounded-2xl flex items-start gap-4 hover:border-divider transition-colors"
                  >
                    <div
                      className={clsx(
                        "text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded text-center flex-shrink-0 mt-0.5",
                        rec.priority === "High"
                          ? "bg-red-955/20 text-red-455 border border-red-900/30"
                          : rec.priority === "Medium"
                            ? "bg-amber-955/20 text-amber-400 border border-amber-800/30"
                            : "bg-bg-card text-secondary-text border border-divider/50",
                      )}
                    >
                      {rec.priority}
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-black text-primary-text">
                        {rec.area}
                      </div>
                      <div className="text-xs text-secondary-text leading-relaxed font-medium">
                        {rec.tips}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
