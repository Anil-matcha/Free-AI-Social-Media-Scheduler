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
   * Calculate credit cost based on mode, model quality, and resolution
   */
  getCreditCost(mode, model, resolution) {
    const isReference = mode === "reference-to-video";
    
    // Default to 720p cost if resolution is invalid
    const res = resolution || "720p";
    const mod = model || "lite";
    
    // Quality pricing
    if (mod === "quality") {
      if (res === "720p") return 500;
      if (res === "1080p") return 650;
      if (res === "4k") return 750;
      return 500; // default 720p cost
    }
    
    // Fast pricing
    if (mod === "fast") {
      if (res === "720p") return 120;
      if (res === "1080p") return 160;
      if (res === "4k") return 360;
      return 120; // default 720p cost
    }
    
    // Lite pricing
    if (mod === "lite") {
      if (res === "720p") return 60;
      if (res === "1080p") return 80;
      if (res === "4k") return 300;
      return 60; // default 720p cost
    }
    
    // Reference pricing (overrides model if mode is reference-to-video)
    if (isReference) {
      if (res === "720p") return 120;
      if (res === "1080p") return 160;
      if (res === "4k") return 360;
      return 120; // default 720p cost
    }
    
    return 60; // Ultimate fallback
  },

  /**
   * Execute a generation quest using muapi.ai
   */
  async generate(userId, { mode, prompt, aspect_ratio = "16:9", resolution = "720p", duration = 8, model = "lite", image_url = null, last_image = null, images_list = [] }) {
    // If it's reference mode, the cost depends on resolution, model is ignored by the API but we'll still use it for UI state
    const cost = this.getCreditCost(mode, model, resolution);
    await UserService.deductCredits(userId, cost);

    const apiKey = config.ai.veo31.apiKey;
    if (!apiKey) throw new Error("VEO31_API_KEY is not configured");

    let type;
    if (mode === "text-to-video") type = "t2v";
    else if (mode === "image-to-video") type = "i2v";
    else if (mode === "reference-to-video") type = "reference";
    
    // Get endpoint
    let endpoint;
    if (type === "reference") {
      endpoint = config.ai.veo31.endpoints.reference;
    } else {
      endpoint = config.ai.veo31.endpoints[type][model];
    }

    if (!endpoint) throw new Error(`Endpoint not found for mode: ${mode} and model: ${model}`);

    const webhookUrl = `${config.auth.webhook_url}/api/webhook/muapi`;
    const submitUrl = `${endpoint}?webhook=${encodeURIComponent(webhookUrl)}`;

    const payload = {
      prompt,
      duration: parseInt(duration),
      resolution
    };

    // Add modality specific parameters
    if (type === "t2v" || type === "i2v") {
      payload.aspect_ratio = aspect_ratio;
    }

    if (type === "i2v") {
      if (!image_url) throw new Error("image_url is required for image-to-video");
      payload.image_url = image_url;
      if (last_image) {
        payload.last_image = last_image;
      }
    }

    if (type === "reference") {
      if (!images_list || images_list.length === 0) throw new Error("images_list is required for reference-to-video");
      payload.images_list = images_list.slice(0, 3); // Max 3 images
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
      // Refund credits if submission fails
      await UserService.addCredits(userId, cost);
      throw new Error(`API Submission Failed: ${submitRes.status} ${errorText}`);
    }

    const { request_id } = await submitRes.json();
    if (!request_id) {
      await UserService.addCredits(userId, cost);
      throw new Error("No request_id received from API");
    }

    const creationModel = prisma.creation || prisma.Creation;
    if (creationModel) {
      await creationModel.create({
        data: {
          userId,
          prompt,
          aspectRatio: aspect_ratio,
          resolution,
          duration: parseInt(duration),
          model,
          imageUrl: image_url,
          lastImage: last_image,
          imagesList: images_list.slice(0, 3),
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
      // Assuming Veo 3.1 returns video in videoFiles array from webhook
      return { status: "completed", videoUrl: creation.videoFiles?.[0] };
    }

    if (creation.status === "failed") {
      throw new Error(creation.error || "Generation failed.");
    }

    return { status: "processing" };
  }
};
