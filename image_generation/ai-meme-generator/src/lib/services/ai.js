import { prisma } from "@/lib/prisma";
import { UserService } from "./user";
import config from "@/lib/config";

export const AIService = {
  /**
   * Compute the credit cost for a generation based on model, resolution,
   * quality, and duration.
   *
   * VIDEO models
   * ─────────────
   * veo3.1      : flat per resolution  (720p=500 | 1080p=650 | 4k=740)
   * gemini-omni : per-second           (720p=45/s | 1080p=75/s | 4k=105/s)
   * kling-v3.0  : per-second           (no-audio=24/s | with-audio=28/s)
   * grok-imagine: per-second           (480p=5/s | 720p=10/s)
   *
   * IMAGE models
   * ─────────────
   * wan2.7        : 20 flat
   * gpt-image-2   : by resolution+quality
   *   1k low=5  | 1k medium=6  | 1k high=12
   *   2k low=8  | 2k medium=9  | 2k high=18
   *   4k low=15 | 4k medium=18 | 4k high=30
   * nano-banana-2 : by resolution  (1k=12 | 2k=18 | 4k=24)
   */
  computeCreditCost(type, { model, modelFamily, resolution, quality, duration, generateAudio } = {}) {
    const dur = parseInt(duration) || 0;
    const res = (resolution || "").toLowerCase();

    if (type === "video") {
      switch (model) {
        case "veo3.1": {
          if (res === "4k")   return 740;
          if (res === "1080p") return 650;
          return 500; // 720p default
        }
        case "gemini-omni": {
          const ratePerSec = res === "4k" ? 105 : res === "1080p" ? 75 : 45;
          return ratePerSec * (dur || 8);
        }
        case "kling-v3.0": {
          const ratePerSec = generateAudio ? 28 : 24;
          return ratePerSec * (dur || 5);
        }
        case "grok-imagine": {
          const ratePerSec = res === "720p" ? 10 : 5;
          return ratePerSec * (dur || 6);
        }
        default:
          return 1;
      }
    }

    if (type === "image") {
      const family = modelFamily || model;
      switch (family) {
        case "wan2.7":
          return 20;
        case "gpt-image-2": {
          const q = (quality || "high").toLowerCase();
          const costs = {
            "1k": { low: 5,  medium: 6,  high: 12 },
            "2k": { low: 8,  medium: 9,  high: 18 },
            "4k": { low: 15, medium: 18, high: 30 },
          };
          return (costs[res] || costs["2k"])[q] ?? 9;
        }
        case "nano-banana-2": {
          const costs = { "1k": 12, "2k": 18, "4k": 24 };
          return costs[res] ?? 18;
        }
        default:
          return 1;
      }
    }

    return 1;
  },

  async generateVideo(userId, { model, prompt, imageUrl, lastImageUrl, imagesList = [], aspectRatio, duration, resolution, mode, generateAudio }) {
    const cost = this.computeCreditCost("video", { model, resolution, duration, generateAudio });
    await UserService.deductCredits(userId, cost);

    const apiKey = config.ai.apiKey;
    if (!apiKey) throw new Error("MUAPIAPP_API_KEY is not configured");

    let endpoint = "";
    let payload = {
      prompt,
      aspect_ratio: aspectRatio,
    };

    const hasImages = imagesList && imagesList.length > 0;
    const firstImage = hasImages ? imagesList[0] : imageUrl;
    const lastImage = hasImages && imagesList.length > 1 ? imagesList[imagesList.length - 1] : lastImageUrl;

    switch (model) {
      case "veo3.1":
        endpoint = "https://api.muapi.ai/api/v1/veo3.1-image-to-video";
        payload.image_url = firstImage;
        if (lastImage) payload.last_image = lastImage;
        payload.duration = duration ? parseInt(duration) : 8;
        payload.resolution = resolution || "720p";
        break;
      case "gemini-omni":
        endpoint = "https://api.muapi.ai/api/v1/gemini-omni-image-to-video";
        payload.image_urls = hasImages ? imagesList : (firstImage ? [firstImage] : []);
        payload.duration = duration ? parseInt(duration) : 8;
        payload.resolution = resolution || "1080p";
        break;
      case "kling-v3.0":
        endpoint = "https://api.muapi.ai/api/v1/kling-v3.0-omni-pro-image-to-video";
        payload.images_list = hasImages ? imagesList : (firstImage ? [firstImage] : []);
        payload.duration = duration ? parseInt(duration) : 5;
        payload.generate_audio = generateAudio !== undefined ? generateAudio : false;
        break;
      case "grok-imagine":
        endpoint = "https://api.muapi.ai/api/v1/grok-imagine-image-to-video";
        payload.images_list = hasImages ? imagesList : (firstImage ? [firstImage] : []);
        payload.duration = duration ? parseInt(duration) : 6;
        payload.resolution = resolution || "480p";
        payload.mode = mode || "normal";
        break;
      default:
        throw new Error("Invalid video model selected");
    }

    const submitRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!submitRes.ok) {
      const errorText = await submitRes.text();
      await UserService.addCredits(userId, cost);
      throw new Error(`API Submission Failed: ${submitRes.status} ${errorText}`);
    }

    const { request_id } = await submitRes.json();
    if (!request_id) {
      await UserService.addCredits(userId, cost);
      throw new Error("No request_id received from API");
    }

    const creation = await prisma.creation.create({
      data: {
        userId,
        prompt,
        aspectRatio,
        requestId: request_id,
        status: "processing",
        type: "video",
        imageUrl: firstImage || null,
        inputImages: hasImages ? JSON.stringify(imagesList) : null,
        duration: duration ? duration.toString() : null,
        resolution: resolution,
        mode: model,
        creditCost: cost,
      }
    });

    return creation;
  },

  async generateImage(userId, { modelFamily, prompt, imagesList = [], aspectRatio, resolution, quality, googleSearch }) {
    const cost = this.computeCreditCost("image", { modelFamily, resolution, quality });
    await UserService.deductCredits(userId, cost);

    const apiKey = config.ai.apiKey;
    if (!apiKey) throw new Error("MUAPIAPP_API_KEY is not configured");

    let endpoint = "";
    let payload = {
      prompt,
      aspect_ratio: aspectRatio,
    };

    const hasImages = imagesList && imagesList.length > 0;

    switch (modelFamily) {
      case "wan2.7":
        endpoint = hasImages
          ? "https://api.muapi.ai/api/v1/wan2.7-image-edit-pro"
          : "https://api.muapi.ai/api/v1/wan2.7-text-to-image-pro";
        if (hasImages) {
          payload.images_list = imagesList;
        }
        break;
      case "gpt-image-2":
        endpoint = hasImages
          ? "https://api.muapi.ai/api/v1/gpt-image-2-image-to-image"
          : "https://api.muapi.ai/api/v1/gpt-image-2-text-to-image";
        if (hasImages) {
          payload.images_list = imagesList;
        }
        payload.resolution = resolution.toUpperCase() || "2K";
        payload.quality = quality || "high";
        break;
      case "nano-banana-2":
        endpoint = hasImages
          ? "https://api.muapi.ai/api/v1/nano-banana-2-edit"
          : "https://api.muapi.ai/api/v1/nano-banana-2";
        if (hasImages) {
          payload.images_list = imagesList;
        }
        payload.resolution = resolution || "1k";
        if (googleSearch !== undefined) {
          payload.google_search = googleSearch;
        }
        break;
      default:
        throw new Error("Invalid image model family selected");
    }

    const submitRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!submitRes.ok) {
      const errorText = await submitRes.text();
      await UserService.addCredits(userId, cost);
      throw new Error(`API Submission Failed: ${submitRes.status} ${errorText}`);
    }

    const { request_id } = await submitRes.json();
    if (!request_id) {
      await UserService.addCredits(userId, cost);
      throw new Error("No request_id received from API");
    }

    const creation = await prisma.creation.create({
      data: {
        userId,
        prompt,
        aspectRatio,
        requestId: request_id,
        status: "processing",
        type: "image",
        inputImages: hasImages ? JSON.stringify(imagesList) : null,
        resolution: resolution || null,
        mode: modelFamily,
        creditCost: cost,
      }
    });

    return creation;
  },

  async processResult(requestId, result) {
    const creation = await prisma.creation.findUnique({
      where: { requestId }
    });

    if (!creation) return null;

    if (creation.status === "completed") {
      return { status: "completed", url: creation.url || creation.imageUrl };
    }

    if (creation.status === "failed") {
      return { status: "failed", error: creation.error };
    }

    const status = result.status || result.state;
    if (status === "completed" || status === "succeeded") {
      const outputs = result.outputs || [];
      const outputUrl = outputs[0] || (typeof result.output === 'string' ? result.output : result.output?.urls?.get);

      if (outputUrl) {
        const updated = await prisma.creation.update({
          where: { id: creation.id },
          data: {
            status: "completed",
            url: outputUrl,
            imageUrl: creation.type === "image" ? outputUrl : creation.imageUrl,
          }
        });
        return { status: "completed", url: updated.url || updated.imageUrl };
      }
    } else if (status === "failed") {
      const errorMsg = result.error || "Prediction failed";
      const updated = await prisma.creation.update({
        where: { id: creation.id },
        data: {
          status: "failed",
          error: errorMsg,
        }
      });
      // Refund the exact credits that were charged
      await UserService.addCredits(creation.userId, creation.creditCost ?? 1);
      return { status: "failed", error: updated.error };
    }

    return { status: "processing" };
  },

  async checkStatus(requestId, userId) {
    const res = await this.processResult(requestId, {});
    if (res && res.status !== "processing") return res;

    const apiKey = config.ai.apiKey;
    if (!apiKey) throw new Error("API Key is not configured");

    try {
      const res = await fetch(`https://api.muapi.ai/api/v1/predictions/${requestId}/result`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        }
      });

      if (res.ok) {
        const result = await res.json();
        return await this.processResult(requestId, result);
      }
    } catch (e) {
      console.error("Polling error:", e);
    }

    return { status: "processing" };
  }
};
