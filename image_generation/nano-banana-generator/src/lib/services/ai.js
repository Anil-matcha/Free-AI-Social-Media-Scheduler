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
   * Calculate credit cost based on resolution
   */
  getCreditCost(resolution) {
    switch (resolution) {
      case "2k": return 18;
      case "4k": return 24;
      case "1k":
      default: return 1;
    }
  },

  /**
   * Execute a generation quest using muapi.ai
   */
  async generate(userId, { prompt, aspect_ratio = "1:1", resolution = "1k", google_search = false }) {
    const cost = this.getCreditCost(resolution);
    await UserService.deductCredits(userId, cost);

    const apiKey = config.ai.banana.apiKey;
    if (!apiKey) throw new Error("NANO_BANANA_API_KEY is not configured");

    const webhookUrl = `${config.auth.webhook_url}/api/webhook/muapi`;
    const submitUrl = `https://api.muapi.ai/api/v1/nano-banana-2?webhook=${encodeURIComponent(webhookUrl)}`;
    const submitRes = await fetch(submitUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        prompt,
        aspect_ratio,
        resolution,
        google_search,
        output_format: "jpg",
      }),
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
          requestId: request_id,
          status: "processing",
        }
      });
    }

    return { request_id };
  },

  /**
   * Execute an edit quest using muapi.ai
   */
  async edit(userId, { prompt, images_list = [], aspect_ratio = "Auto", google_search = false, resolution = "1k" }) {
    const cost = this.getCreditCost(resolution);
    await UserService.deductCredits(userId, cost);

    const apiKey = config.ai.banana.apiKey;
    if (!apiKey) throw new Error("NANO_BANANA_API_KEY is not configured");

    const webhookUrl = `${config.auth.webhook_url}/api/webhook/muapi`;
    const submitUrl = `https://api.muapi.ai/api/v1/nano-banana-2-edit?webhook=${encodeURIComponent(webhookUrl)}`;
    const submitRes = await fetch(submitUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        prompt,
        images_list,
        aspect_ratio,
        google_search,
        resolution,
      }),
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
          requestId: request_id,
          status: "processing",
        }
      });
    }

    return { request_id };
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
