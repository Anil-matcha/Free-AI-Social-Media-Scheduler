import { prisma } from "@/lib/prisma";
import { UserService } from "./user";
import config from "@/lib/config";

/**
 * Service to manage Pet Product Studio creations using nano-banana-2-edit API
 */
export const AIService = {
  /**
   * Cost in credits per generation
   */
  getCreditCost() {
    return 12;
  },

  /**
   * Submit an image creation task to MuAPI with multiple reference images
   */
  async generate(userId, { inputUrls = [], prompt, aspectRatio = "1:1" }) {
    if (!Array.isArray(inputUrls) || inputUrls.length === 0) {
      throw new Error("At least one input image is required.");
    }
    if (inputUrls.length > 14) {
      throw new Error("Maximum of 14 input images allowed.");
    }

    const cost = this.getCreditCost();
    await UserService.deductCredits(userId, cost);

    const apiKey = config.ai.apiKey;
    if (!apiKey) throw new Error("MUAPIAPP_API_KEY or HEADSHOT_API_KEY is not configured");

    // Submit task
    const submitRes = await fetch(config.ai.submitEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        prompt: prompt,
        images_list: inputUrls,
        aspect_ratio: aspectRatio,
        google_search: false,
        resolution: "1k",
        output_format: "jpg",
        webhook: `${config.auth.webhook_url}/api/webhooks/ai`
      }),
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

    // Save pet creation record
    const petCreation = await prisma.petCreation.create({
      data: {
        userId,
        inputUrls: JSON.stringify(inputUrls),
        prompt,
        aspectRatio,
        requestId: request_id,
        status: "processing",
      }
    });

    return petCreation;
  },

  /**
   * Universal method to process AI results from polling or webhooks
   */
  async processResult(requestId, result) {
    const petCreation = await prisma.petCreation.findUnique({
      where: { requestId }
    });

    if (!petCreation) return null;

    // If it's already finished in database, return it
    if (petCreation.status === "completed") {
      return { status: "completed", outputUrl: petCreation.outputUrl };
    }

    if (petCreation.status === "failed") {
      return { status: "failed", error: petCreation.error };
    }

    // Check if result indicates finished
    const status = result.status || result.state;
    if (status === "completed" || status === "succeeded") {
      const outputs = result.outputs || [];
      const outputUrl = outputs[0] || (typeof result.output === 'string' ? result.output : result.output?.urls?.get);
      
      if (outputUrl) {
        const updated = await prisma.petCreation.update({
          where: { id: petCreation.id },
          data: {
            status: "completed",
            outputUrl: outputUrl,
          }
        });
        return { status: "completed", outputUrl: updated.outputUrl };
      }
    } else if (status === "failed") {
      const errorMsg = result.error || "Prediction failed";
      const updated = await prisma.petCreation.update({
        where: { id: petCreation.id },
        data: {
          status: "failed",
          error: errorMsg,
        }
      });
      // Refund credit on failure
      await UserService.addCredits(petCreation.userId, this.getCreditCost());
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
