import { prisma } from "@/lib/prisma";
import { UserService } from "./user";
import config from "@/lib/config";

/**
 * Service to manage AICLIP generations using muapi.ai
 */
export const AIService = {
  /**
   * Helper to fetch YouTube video duration without external libraries
   */
  async getYoutubeDuration(url) {
    try {
      const response = await fetch(url);
      const text = await response.text();
      // Look for lengthSeconds in the YouTube page source
      const match = text.match(/"lengthSeconds":"(\d+)"/);
      if (match && match[1]) {
        return parseInt(match[1]);
      }
      return 300; // Fallback
    } catch (error) {
      console.error("[GET_YT_DURATION_ERROR]", error);
      return 300;
    }
  },

  /**
   * Calculate dynamic cost for AI clipping
   */
  async calculateClippingCost(video_url, num_highlights) {
    let duration_seconds = 300; 
    
    // If it's a YouTube URL, try to fetch its real duration
    if (video_url.includes("youtube.com") || video_url.includes("youtu.be")) {
      duration_seconds = await this.getYoutubeDuration(video_url);
    }

    const rounded_minutes = Math.round(duration_seconds / 60);
    
    // $0.05 per minute + $0.05 per highlight
    const cost_dollars = (rounded_minutes * 0.05) + (num_highlights * 0.05);
    // Convert to credits (x200)
    return Math.round(cost_dollars * 200);
  },

  /**
   * Execute a YouTube Download request
   */
  async youtubeDownload(userId, { video_url, format = "720" }) {
    const cost = 5; // Fixed cost for YT Download
    await UserService.deductCredits(userId, cost);

    const apiKey = config.ai.aiclips.apiKey;
    if (!apiKey) throw new Error("AICLIPS_API_KEY is not configured");

    const webhookUrl = `${config.auth.webhook_url}/api/webhook/muapi`;
    const submitUrl = `${config.ai.aiclips.youtubeEndpoint}?webhook=${encodeURIComponent(webhookUrl)}`;
    
    const submitRes = await fetch(submitUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        video_url,
        format,
      }),
    });

    if (!submitRes.ok) {
      const errorText = await submitRes.text();
      throw new Error(`YouTube Download Failed: ${submitRes.status} ${errorText}`);
    }

    const data = await submitRes.json();
    const requestId = data.request_id || data.id;

    if (!requestId) throw new Error("No request_id received from API");

    const creationModel = prisma.creation || prisma.Creation;
    if (creationModel) {
      // Check if already completed/failed in initial response
      const isCompleted = data.status === "completed" || data.status === "succeeded";
      const isFailed = data.status === "failed";
      
      let mediaUrls = [];
      if (isCompleted) {
        if (data.outputs && Array.isArray(data.outputs)) mediaUrls = data.outputs;
        else if (data.url) mediaUrls = [data.url];
        else if (data.video_url) mediaUrls = [data.video_url];
      }

      await creationModel.create({
        data: {
          userId,
          type: "youtube_download",
          resolution: format,
          requestId: requestId,
          status: isCompleted ? "completed" : (isFailed ? "failed" : "processing"),
          resultUrl: isCompleted ? JSON.stringify(mediaUrls) : null,
          error: isFailed ? (data.error || "Generation failed") : null
        }
      });

      if (isCompleted) {
        return { request_id: requestId, status: "completed", clips: mediaUrls };
      }
    }
    
    return { request_id: requestId, status: "processing" };
  },

  /**
   * Execute an AI Clipping request
   */
  async aiClipping(userId, { video_url, num_highlights = 3, aspect_ratio = "9:16" }) {
    const numHighlights = parseInt(num_highlights);
    const cost = await this.calculateClippingCost(video_url, numHighlights);
    await UserService.deductCredits(userId, cost);

    const apiKey = config.ai.aiclips.apiKey;
    if (!apiKey) throw new Error("AICLIPS_API_KEY is not configured");

    const webhookUrl = `${config.auth.webhook_url}/api/webhook/muapi`;
    const submitUrl = `${config.ai.aiclips.clippingEndpoint}?webhook=${encodeURIComponent(webhookUrl)}`;
    
    const submitRes = await fetch(submitUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        video_url,
        num_highlights: parseInt(num_highlights),
        aspect_ratio,
      }),
    });

    if (!submitRes.ok) {
      const errorText = await submitRes.text();
      throw new Error(`AI Clipping Failed: ${submitRes.status} ${errorText}`);
    }

    const data = await submitRes.json();
    const request_id = data.request_id || data.id;

    if (!request_id) throw new Error("No request_id received from API");

    const creationModel = prisma.creation || prisma.Creation;
    if (creationModel) {
      const isCompleted = data.status === "completed" || data.status === "succeeded";
      const isFailed = data.status === "failed";
      
      let mediaUrls = [];
      if (isCompleted) {
        if (data.outputs && Array.isArray(data.outputs)) mediaUrls = data.outputs;
      }

      await creationModel.create({
        data: {
          userId,
          type: "ai_clipping",
          aspectRatio: aspect_ratio,
          numClips: parseInt(num_highlights),
          requestId: request_id,
          status: isCompleted ? "completed" : (isFailed ? "failed" : "processing"),
          resultUrl: isCompleted ? JSON.stringify(mediaUrls) : null,
          error: isFailed ? (data.error || "Generation failed") : null
        }
      });

      if (isCompleted) {
        return { request_id: request_id, status: "completed", clips: mediaUrls };
      }
    }

    return { request_id };
  },

  /**
   * Check the status of a specific generation (Poll DB ONLY)
   */
  async checkStatus(requestId) {
    const creationModel = prisma.creation || prisma.Creation;
    if (!creationModel) return { status: "processing" };

    const creation = await creationModel.findUnique({
      where: { requestId }
    });

    if (!creation) return { status: "processing" };

    if (creation.status === "completed") {
      try {
        const urlData = JSON.parse(creation.resultUrl || "[]");
        return { status: "completed", clips: urlData };
      } catch (e) {
        return { status: "completed", clips: [creation.resultUrl] };
      }
    }

    if (creation.status === "failed") {
      throw new Error(creation.error || "Generation failed.");
    }

    // Fallback: Check MuAPI directly if still processing (helps when webhooks fail on localhost)
    try {
      const apiKey = config.ai.aiclips.apiKey;
      const pollUrl = `https://api.muapi.ai/api/v1/predictions/${requestId}/result`;
      
      const res = await fetch(pollUrl, {
        headers: { "x-api-key": apiKey }
      });
      
      if (res.ok) {
        const data = await res.json();
        const isCompleted = data.status === "completed" || data.status === "succeeded";
        const isFailed = data.status === "failed";

        if (isCompleted) {
          let mediaUrls = data.outputs || [];
          if (mediaUrls.length === 0) {
            if (data.url) mediaUrls = [data.url];
            else if (data.video_url) mediaUrls = [data.video_url];
            else if (data.download_url) mediaUrls = [data.download_url];
          }

          await creationModel.update({
            where: { id: creation.id },
            data: {
              status: "completed",
              resultUrl: JSON.stringify(mediaUrls)
            }
          });
          return { status: "completed", clips: mediaUrls };
        } else if (isFailed) {
          await creationModel.update({
            where: { id: creation.id },
            data: { status: "failed", error: data.error || "Generation failed" }
          });
          throw new Error(data.error || "Generation failed.");
        }
      }
    } catch (e) {
      console.warn("[CHECK_STATUS_FALLBACK_FAILED]", e.message);
    }

    return { status: "processing" };
  }
};
