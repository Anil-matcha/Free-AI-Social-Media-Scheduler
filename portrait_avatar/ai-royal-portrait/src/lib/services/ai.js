import { prisma } from "@/lib/prisma";
import { UserService } from "./user";
import config from "@/lib/config";

/**
 * AI Service for Royal Portrait generation using MuAPI portrait-stylist model.
 * Cost: $0.01 per image = 2 credits (flat, no duration/resolution params).
 */
export const AIService = {
  getCreditCost() {
    return config.ai.model.creditCost; // 2 credits flat
  },

  async generate(userId, { inputImage, styleName, aspectRatio = "auto" }) {
    if (!inputImage) throw new Error("Portrait image is required.");
    if (!styleName) throw new Error("Style selection is required.");

    const cost = this.getCreditCost();
    await UserService.deductCredits(userId, cost);

    const apiKey = config.ai.apiKey;
    if (!apiKey) throw new Error("MU_API_KEY is not configured.");

    const bodyPayload = {
      image_url: inputImage,
      name: styleName,
      aspect_ratio: aspectRatio,
      webhook: `${config.auth.webhook_url}/api/webhooks/ai`,
    };

    const submitRes = await fetch(config.ai.model.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(bodyPayload),
    });

    if (!submitRes.ok) {
      const errorText = await submitRes.text();
      await UserService.addCredits(userId, cost);
      throw new Error(`API Submission Failed: ${submitRes.status} ${errorText}`);
    }

    const resJson = await submitRes.json();
    const request_id = resJson.request_id || resJson.id;

    if (!request_id) {
      await UserService.addCredits(userId, cost);
      throw new Error("No request_id received from API.");
    }

    // Inline polling: up to 6 attempts × 3s = 18s
    let resultImage = null;
    let status = "processing";
    for (let i = 0; i < 6; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      try {
        const pollRes = await fetch(config.ai.pollEndpoint(request_id), {
          headers: { "x-api-key": apiKey },
        });
        if (pollRes.ok) {
          const pollJson = await pollRes.json();
          const s = pollJson.status || pollJson.state;
          if (s === "completed" || s === "succeeded") {
            resultImage =
              pollJson.output?.image ||
              (pollJson.outputs && pollJson.outputs[0]) ||
              pollJson.output;
            status = "completed";
            break;
          } else if (s === "failed") {
            status = "failed";
            break;
          }
        }
      } catch (e) {
        console.error("Inline polling error:", e);
      }
    }

    const creation = await prisma.royalPortraitCreation.create({
      data: {
        userId,
        inputImage,
        styleName,
        aspectRatio,
        requestId: request_id,
        status,
        resultImage: resultImage || null,
        creditCost: cost,
      },
    });

    return creation;
  },

  async processResult(requestId, result) {
    const creation = await prisma.royalPortraitCreation.findUnique({
      where: { requestId },
    });
    if (!creation) return null;

    if (creation.status === "completed")
      return { status: "completed", resultImage: creation.resultImage };
    if (creation.status === "failed")
      return { status: "failed", error: creation.error };

    const status = result.status || result.state;

    if (status === "completed" || status === "succeeded") {
      const imageUrl =
        result.output?.image ||
        (result.outputs && result.outputs[0]) ||
        result.output;

      if (imageUrl) {
        const updated = await prisma.royalPortraitCreation.update({
          where: { id: creation.id },
          data: { status: "completed", resultImage: imageUrl },
        });
        return { status: "completed", resultImage: updated.resultImage };
      }
    } else if (status === "failed") {
      const errorMsg = result.error || "Prediction failed";
      await prisma.royalPortraitCreation.update({
        where: { id: creation.id },
        data: { status: "failed", error: errorMsg },
      });
      await UserService.addCredits(creation.userId, creation.creditCost);
      return { status: "failed", error: errorMsg };
    }

    return { status: "processing" };
  },

  async checkStatus(requestId) {
    const res = await this.processResult(requestId, {});
    if (res && res.status !== "processing") return res;

    const apiKey = config.ai.apiKey;
    if (!apiKey) throw new Error("API Key is not configured.");

    try {
      const pollRes = await fetch(config.ai.pollEndpoint(requestId), {
        headers: { "x-api-key": apiKey },
      });
      if (pollRes.ok) {
        const result = await pollRes.json();
        return await this.processResult(requestId, result);
      }
    } catch (e) {
      console.error("Status check polling error:", e);
    }

    return { status: "processing" };
  },
};
