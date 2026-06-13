import { prisma } from "@/lib/prisma";
import { UserService } from "./user";
import config from "@/lib/config";
import { calculateCreditCost } from "@/lib/utils/pricing";

/**
 * Service to manage Kissing Video generations using various image-to-video models.
 */
export const AIService = {
  /**
   * Get credit cost for a specific model
   */
  getCreditCost(modelId, duration, resolution) {
    return calculateCreditCost(modelId, duration, resolution);
  },

  /**
   * Submit an image-to-video task to MuAPI
   */
  async generate(userId, { maleImage, femaleImage, prompt, modelId, aspectRatio = "16:9", duration, stitchedImage, resolution }) {
    if (!maleImage || !femaleImage) {
      throw new Error("Both male and female images are required.");
    }
    if (!stitchedImage) {
      throw new Error("Merged image is required.");
    }

    const model = config.ai.models[modelId];
    if (!model) throw new Error(`Invalid model selected: ${modelId}`);

    const cost = this.getCreditCost(modelId, duration, resolution);
    await UserService.deductCredits(userId, cost);

    const apiKey = config.ai.apiKey;
    if (!apiKey) throw new Error("MUAPIAPP_API_KEY is not configured");

    // Build request payload dynamically based on model schemas
    const bodyPayload = {
      prompt: prompt,
      webhook: `${config.auth.webhook_url}/api/webhooks/ai`
    };

    if (modelId === "veo3.1-image-to-video") {
      bodyPayload.image_url = stitchedImage;
      bodyPayload.aspect_ratio = aspectRatio;
      bodyPayload.duration = 8;
      bodyPayload.resolution = resolution || "720p";
    } else if (modelId === "wan2.7-image-to-video") {
      bodyPayload.image_url = stitchedImage;
      bodyPayload.resolution = resolution || "720p";
      bodyPayload.duration = parseInt(duration) || 5;
    } else if (modelId === "gemini-omni-image-to-video") {
      bodyPayload.image_urls = [stitchedImage];
      bodyPayload.aspect_ratio = aspectRatio;
      bodyPayload.resolution = resolution || "1080p";
      bodyPayload.duration = parseInt(duration) || 8;
    } else if (modelId === "grok-imagine-image-to-video") {
      bodyPayload.images_list = [stitchedImage];
      bodyPayload.aspect_ratio = aspectRatio;
      bodyPayload.resolution = resolution || "480p";
      bodyPayload.duration = parseInt(duration) || 6;
      bodyPayload.mode = "normal";
    } else {
      // Fallback
      bodyPayload.image_url = stitchedImage;
      bodyPayload.aspect_ratio = aspectRatio;
    }

    // Submit task
    const submitRes = await fetch(model.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(bodyPayload),
    });

    if (!submitRes.ok) {
      const errorText = await submitRes.text();
      // Refund credits on failure before throwing
      await UserService.addCredits(userId, cost);
      throw new Error(`API Submission Failed: ${submitRes.status} ${errorText}`);
    }

    const { request_id } = await submitRes.json();
    if (!request_id) {
      await UserService.addCredits(userId, cost);
      throw new Error("No request_id received from API");
    }

    // Save kissing video creation record
    const creation = await prisma.kissingVideoCreation.create({
      data: {
        userId,
        maleImage,
        femaleImage,
        prompt,
        modelId,
        aspectRatio,
        duration: modelId === "veo3.1-image-to-video" ? 8 : (parseInt(duration) || 5),
        requestId: request_id,
        status: "processing",
        creditCost: cost,
      }
    });

    return creation;
  },

  /**
   * Universal method to process AI results from polling or webhooks
   */
  async processResult(requestId, result) {
    console.log("[AI_SERVICE_PROCESS_RESULT] RequestId:", requestId);
    console.log("[AI_SERVICE_PROCESS_RESULT] Payload:", JSON.stringify(result));
    
    const creation = await prisma.kissingVideoCreation.findUnique({
      where: { requestId }
    });

    if (!creation) return null;

    // If it's already finished in database, return it
    if (creation.status === "completed") {
      return { status: "completed", resultVideo: creation.resultVideo };
    }

    if (creation.status === "failed") {
      return { status: "failed", error: creation.error };
    }

    // Check if result indicates finished
    const status = result.status || result.state;
    if (status === "completed" || status === "succeeded") {
      const outputs = result.outputs || [];
      const outputUrl = outputs[0] || (typeof result.output === 'string' ? result.output : result.output?.urls?.get || result.output?.video);
      
      if (outputUrl) {
        const updated = await prisma.kissingVideoCreation.update({
          where: { id: creation.id },
          data: {
            status: "completed",
            resultVideo: outputUrl,
          }
        });
        return { status: "completed", resultVideo: updated.resultVideo };
      }
    } else if (status === "failed") {
      const errorMsg = result.error || "Prediction failed";
      const updated = await prisma.kissingVideoCreation.update({
        where: { id: creation.id },
        data: {
          status: "failed",
          error: errorMsg,
        }
      });
      // Refund credits on failure
      await UserService.addCredits(creation.userId, creation.creditCost);
      return { status: "failed", error: updated.error };
    }

    return { status: "processing" };
  },

  /**
   * Check status of generation (either from database or polling MuAPI API)
   */
  async checkStatus(requestId, userId) {
    // First check if we already have it in DB
    const res = await this.processResult(requestId, {});
    if (res && res.status !== "processing") return res;

    // Fallback: poll MuAPI prediction result endpoint
    const apiKey = config.ai.apiKey;
    if (!apiKey) throw new Error("API Key is not configured");

    try {
      const res = await fetch(config.ai.pollEndpoint(requestId), {
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
