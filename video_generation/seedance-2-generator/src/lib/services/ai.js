import config from "@/lib/config";
import { UserService } from "./user";
import { prisma } from "@/lib/prisma";

/**
 * Service to manage AI generations and interactions.
 */
/**
 * Service to manage AI generations and interactions.
 */
export const AIService = {
  /**
   * Calculate credit cost based on duration, quality, and resolution
   */
  getCreditCost(mode, duration, quality, resolution) {
    const isReference = mode === "reference-to-video";
    const is720p = resolution === "720p";
    let rate;
    
    if (isReference) {
      if (is720p) {
        rate = quality === "high" ? 60 : 42;
      } else {
        rate = quality === "high" ? 48 : 36;
      }
    } else {
      if (is720p) {
        rate = quality === "high" ? 50 : 30;
      } else {
        rate = quality === "high" ? 30 : 24;
      }
    }
    
    return Math.ceil(duration * rate);
  },

  /**
   * Execute a generation quest using muapi.ai
   */
  async generate(userId, { mode, prompt, aspect_ratio = "16:9", resolution = "720p", duration = 5, quality = "basic", images_list = [], video_files = [], audio_files = [] }) {
    const cost = this.getCreditCost(mode, duration, quality, resolution);
    await UserService.deductCredits(userId, cost);

    const apiKey = config.ai.seedance.apiKey;
    if (!apiKey) throw new Error("SEEDANCE_V2_API_KEY is not configured");

    // Map mode to endpoint type
    let type;
    if (mode === "text-to-video") type = "t2v";
    else if (mode === "image-to-video") type = "i2v";
    else if (mode === "reference-to-video") type = "reference";
    
    const endpoint = config.ai.seedance.endpoints[type][resolution];

    if (!endpoint) throw new Error(`Endpoint not found for mode: ${mode} and resolution: ${resolution}`);

    const webhookUrl = `${config.auth.webhook_url}/api/webhook/muapi`;
    const submitUrl = `${endpoint}?webhook=${encodeURIComponent(webhookUrl)}`;

    const payload = {
      prompt,
      aspect_ratio,
      duration: parseInt(duration),
      quality
    };

    if (type === "i2v" || type === "reference") {
      payload.images_list = images_list.slice(0, 9);
    }

    if (type === "reference") {
      payload.video_files = video_files.slice(0, 3);
      payload.audio_files = audio_files.slice(0, 3);
    }

    const submitRes = await fetch(submitUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!submitRes.ok) {
      const errorText = await submitRes.text();
      throw new Error(`API Submission Failed: ${submitRes.status} ${errorText}`);
    }

    const { request_id } = await submitRes.json();
    if (!request_id) throw new Error("No request_id received from API");

    const creationModel = prisma.creation || prisma.Creation;
    if (creationModel) {
      await creationModel.create({
        data: {
          userId,
          prompt,
          aspectRatio: aspect_ratio,
          resolution,
          duration: parseInt(duration),
          quality,
          videoFiles: video_files,
          audioFiles: audio_files,
          inputImages: images_list,
          requestId: request_id,
          status: "processing",
        }
      });
    }

    return { request_id };
  },

  /**
   * Wrapper for edit/reference to video if needed, currently mapping to generate
   */
  async edit(userId, params) {
    // For now, mapping reference-to-video to generate as it likely uses the i2v/t2v endpoints similarly
    return this.generate(userId, params);
  },

  /**
   * Check status of a request and save to DB on completion
   */
  async checkStatus(requestId, userId, metadata) {
    const creationModel = prisma.creation || prisma.Creation;
    if (!creationModel) return { status: "processing" };

    const creation = await creationModel.findUnique({
      where: { requestId }
    });

    if (!creation) {
      return { status: "processing" };
    }

    if (creation.status === "completed") {
      return { status: "completed", imageUrl: creation.imageUrl };
    }

    if (creation.status === "failed") {
      throw new Error(creation.error || "Generation failed.");
    }

    return { status: "processing" };
  }
};
