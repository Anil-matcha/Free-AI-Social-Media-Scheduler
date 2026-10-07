/**
 * Shared utility to calculate credit costs based on model, duration, and resolution.
 * Matches the formulas in worker_utils.py, converted to credits using: credits = dollars * 200.
 */
export function calculateCreditCost(modelId, duration, resolution) {
  let dur = parseInt(duration);
  let res = resolution || "720p";

  if (modelId === "veo3.1-image-to-video") {
    // veo3.1-video cost strategy: base = 2.5. 
    // 1080p -> base * 1.3 = 3.25. 4k -> base + 1.2 = 3.70. 720p -> 2.50
    if (isNaN(dur)) dur = 8;
    let dollarCost = 2.5;
    if (res === "1080p") {
      dollarCost = Math.round(2.5 * 1.3 * 100) / 100;
    } else if (res === "4k") {
      dollarCost = Math.round((2.5 + 1.2) * 100) / 100;
    }
    return Math.round(dollarCost * 200);
  }

  if (modelId === "wan2.7-image-to-video") {
    // wan27-video-cost: rate = 0.13 for 720p, 0.20 for 1080p. cost = rate * duration
    if (isNaN(dur)) dur = 5;
    let rate = (res === "720p") ? 0.13 : 0.20;
    let dollarCost = Math.round((rate * dur) * 1000) / 1000;
    return Math.round(dollarCost * 200);
  }

  if (modelId === "gemini-omni-image-to-video") {
    // gemini-omni-i2v-cost: base = 1.50 for 4k, else 0.30. cost = base + duration * 0.15
    if (isNaN(dur)) dur = 8;
    let base = (res === "4k") ? 1.50 : 0.30;
    let dollarCost = Math.round((base + dur * 0.15) * 100) / 100;
    return Math.round(dollarCost * 200);
  }

  if (modelId === "grok-imagine-image-to-video") {
    // grok-imagine: rate = 0.05 for 720p, else 0.025. cost = duration * rate
    if (isNaN(dur)) dur = 6;
    let rate = (res === "720p") ? 0.05 : 0.025;
    let dollarCost = Math.round((dur * rate) * 1000) / 1000;
    return Math.round(dollarCost * 200);
  }

  return 0; // Fallback
}
