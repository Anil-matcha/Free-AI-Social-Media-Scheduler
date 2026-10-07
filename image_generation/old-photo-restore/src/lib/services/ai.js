import { prisma } from "@/lib/prisma";
import { UserService } from "./user";
import config from "@/lib/config";

/**
 * Service to manage Old Photo Restoration using nano-banana-2-edit API
 */
export const AIService = {
  /**
   * Cost in credits per generation
   */
  getCreditCost() {
    return 18;
  },

  /**
   * Submit an image restoration task to MuAPI
   */
  async restore(userId, { inputUrl, prompt, mode = "full" }) {
    if (!inputUrl) {
      throw new Error("Input image is required.");
    }

    const cost = this.getCreditCost();
    await UserService.deductCredits(userId, cost);

    const apiKey = config.ai.apiKey;
    if (!apiKey) throw new Error("MUAPIAPP_API_KEY is not configured");

    // Format prompt based on mode if requested
    let finalPrompt = prompt;
    if (mode === "colorize") {
      finalPrompt = `${prompt} (add realistic colors, vibrant natural skin tones and background colors)`;
    } else if (mode === "face") {
      finalPrompt = `${prompt} (restore face details, sharpen eyes, nose, lips and facial skin texture)`;
    } else if (mode === "scratch") {
      finalPrompt = `${prompt} (remove scratches, clean background, repair tears, infill missing parts)`;
    }

    // Submit task to nano-banana-2-edit
    const submitRes = await fetch(config.ai.submitEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        prompt: finalPrompt,
        images_list: [inputUrl],
        aspect_ratio: "auto",
        resolution: "2K",
        quality: "high",
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

    // Save photo restoration record
    const photoRestoration = await prisma.photoRestoration.create({
      data: {
        userId,
        inputUrl,
        prompt: finalPrompt,
        mode,
        requestId: request_id,
        status: "processing",
      }
    });

    return photoRestoration;
  },

  /**
   * Universal method to process AI results from polling or webhooks
   */
  async processResult(requestId, result) {
    const photoRestoration = await prisma.photoRestoration.findUnique({
      where: { requestId }
    });

    if (!photoRestoration) return null;

    // If it's already finished in database, return it
    if (photoRestoration.status === "completed") {
      return { status: "completed", outputUrl: photoRestoration.outputUrl };
    }

    if (photoRestoration.status === "failed") {
      return { status: "failed", error: photoRestoration.error };
    }

    // Check if result indicates finished
    const status = result.status || result.state;
    if (status === "completed" || status === "succeeded") {
      const outputs = result.outputs || [];
      const outputUrl = outputs[0] || (typeof result.output === 'string' ? result.output : result.output?.urls?.get);

      if (outputUrl) {
        const updated = await prisma.photoRestoration.update({
          where: { id: photoRestoration.id },
          data: {
            status: "completed",
            outputUrl: outputUrl,
          }
        });
        return { status: "completed", outputUrl: updated.outputUrl };
      }
    } else if (status === "failed") {
      const errorMsg = result.error || "Prediction failed";
      const updated = await prisma.photoRestoration.update({
        where: { id: photoRestoration.id },
        data: {
          status: "failed",
          error: errorMsg,
        }
      });
      // Refund credit on failure
      await UserService.addCredits(photoRestoration.userId, this.getCreditCost());
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
