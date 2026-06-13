/**
 * Client-side credit cost calculator.
 * Must stay in sync with AIService.computeCreditCost in src/lib/services/ai.js
 */

export function computeVideoCost({ model, resolution, duration, generateAudio }) {
  const dur = parseInt(duration) || 0;
  const res = (resolution || "").toLowerCase();

  switch (model) {
    case "veo3.1": {
      if (res === "4k")    return 740;
      if (res === "1080p") return 650;
      return 500; // 720p default
    }
    case "gemini-omni": {
      const rate = res === "4k" ? 105 : res === "1080p" ? 75 : 45;
      return rate * (dur || 8);
    }
    case "kling-v3.0": {
      const rate = generateAudio ? 28 : 24;
      return rate * (dur || 5);
    }
    case "grok-imagine": {
      const rate = res === "720p" ? 10 : 5;
      return rate * (dur || 6);
    }
    default:
      return 1;
  }
}

export function computeImageCost({ modelFamily, resolution, quality }) {
  const res = (resolution || "").toLowerCase();

  switch (modelFamily) {
    case "wan2.7":
      return 20;
    case "gpt-image-2": {
      const q = (quality || "high").toLowerCase();
      const table = {
        "1k": { low: 5,  medium: 6,  high: 12 },
        "2k": { low: 8,  medium: 9,  high: 18 },
        "4k": { low: 15, medium: 18, high: 30 },
      };
      return (table[res] || table["2k"])[q] ?? 9;
    }
    case "nano-banana-2": {
      const table = { "1k": 12, "2k": 18, "4k": 24 };
      return table[res] ?? 18;
    }
    default:
      return 1;
  }
}
