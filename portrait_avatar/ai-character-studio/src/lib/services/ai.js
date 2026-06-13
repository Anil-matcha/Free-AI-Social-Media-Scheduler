import { prisma } from "../prisma";
import { UserService } from "./user";
import config from "../config";

export const AIService = {
  /**
   * Submit a prediction job to MuAPI, deduct credits, and execute inline polling.
   */
  async generate(userId, { prompt, inputImage, aspectRatio, modelEndpoint = "predictions", appId = null, creditCost = null, model = null, customParams = {} }) {
    const cost = creditCost !== null ? Number(creditCost) : config.ai.generationCost;
    
    // 1. Deduct credits
    await UserService.deductCredits(userId, cost);

    const apiKey = config.ai.apiKey;
    if (!apiKey) {
      // Return local mock generation in development if API key is missing
      console.warn("MUAPIAPP_API_KEY is not configured. Running offline simulation.");
      const mockRequestId = `mock_${Math.random().toString(36).substring(2, 9)}`;
      
      const creation = await prisma.creation.create({
        data: {
          userId,
          prompt,
          inputImage,
          requestId: mockRequestId,
          status: "completed",
          resultImage: inputImage || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
          creditCost: cost,
          aspectRatio,
        appId,
          prompt: customParams.prompt !== undefined ? String(customParams.prompt) : "",
          images_list: customParams.images_list !== undefined ? (Array.isArray(customParams.images_list) ? JSON.stringify(customParams.images_list) : String(customParams.images_list)) : "[]",
          aspect_ratio: customParams.aspect_ratio !== undefined ? String(customParams.aspect_ratio) : "",
          resolution: customParams.resolution !== undefined ? String(customParams.resolution) : "1k"
        }
      });
      return { id: creation.id, resultImage: creation.resultImage, status: "completed" };
    }

    // 2. Submit to MuAPI
    const webhookUrl = `${config.auth.webhook_url}/api/webhook/muapi`;
    const isLlm = modelEndpoint === "any-llm-models" || modelEndpoint.includes("completions");
    let finalEndpoint = isLlm ? "any-llm-models" : modelEndpoint;

    if (finalEndpoint === "predictions" || !finalEndpoint) {
      let modelName = model || "nano-banana-2";
      if (inputImage && (modelName === "nano-banana-2" || modelName === "nano-banana-pro")) {
        modelName = `${modelName}-edit`;
      }
      finalEndpoint = modelName;
    }

    let bodyPayload = {};
    if (isLlm) {
      let finalPrompt = prompt;
      let systemPromptText = "You are a helpful AI assistant.";
      try {
        const parsed = JSON.parse(prompt);
        if (parsed.chatHistory) {
          finalPrompt = parsed.chatHistory.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n') + '\nAssistant:';
        }
        if (parsed.systemPrompt) {
          systemPromptText = parsed.systemPrompt;
        }
      } catch (e) {
        // Fallback to raw prompt string
      }

      bodyPayload = {
        prompt: finalPrompt,
        system_prompt: systemPromptText,
        model: model || "google/gemini-2.5-flash",
        temperature: 0.7,
        ...customParams,
      };
    } else {
      bodyPayload = {
        prompt,
        images_list: inputImage ? [inputImage] : [],
        aspect_ratio: aspectRatio || "1:1",
        ...customParams,
        webhook: webhookUrl,
      };
    }

    const targetUrl = finalEndpoint.startsWith("http://") || finalEndpoint.startsWith("https://")
      ? `${finalEndpoint}?webhook=${encodeURIComponent(webhookUrl)}`
      : `https://api.muapi.ai/api/v1/${finalEndpoint}?webhook=${encodeURIComponent(webhookUrl)}`;

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyPayload),
    });

    if (!response.ok) {
      // Refund credits on submission error
      await UserService.addCredits(userId, cost);
      const errorText = await response.text();
      throw new Error(`API submission failed: ${response.status} ${errorText}`);
    }

    const responseJson = await response.json();
    const requestId = responseJson.request_id || responseJson.id;
    if (!requestId) {
      await UserService.addCredits(userId, cost);
      throw new Error("No request_id returned from MUAPI");
    }

    // 3. Save initial record to database
    let creation = await prisma.creation.create({
      data: {
        userId,
        prompt,
        inputImage,
        requestId,
        status: "processing",
        creditCost: cost,
        aspectRatio,
        appId,
          prompt: customParams.prompt !== undefined ? String(customParams.prompt) : "",
          images_list: customParams.images_list !== undefined ? (Array.isArray(customParams.images_list) ? JSON.stringify(customParams.images_list) : String(customParams.images_list)) : "[]",
          aspect_ratio: customParams.aspect_ratio !== undefined ? String(customParams.aspect_ratio) : "",
          resolution: customParams.resolution !== undefined ? String(customParams.resolution) : "1k"
      }
    });

    // 4. Inline Polling Loop (up to 15 seconds)
    let resultImage = "";
    let status = "processing";
    let completed = false;
    let attempts = 0;

    while (!completed && attempts < 6) {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      attempts++;

      try {
        const pollResponse = await fetch(`https://api.muapi.ai/api/v1/predictions/${requestId}/result`, {
          headers: { "x-api-key": apiKey },
        });

        if (pollResponse.ok) {
          const pollJson = await pollResponse.json();
          const checkStatus = pollJson.status || pollJson.state;

          if (checkStatus === "completed" || checkStatus === "succeeded") {
            const outputs = pollJson.outputs || [];
            resultImage = outputs[0] || pollJson.output;
            status = "completed";
            completed = true;
          } else if (checkStatus === "failed") {
            status = "failed";
            completed = true;
          }
        }
      } catch (pollErr) {
        console.error("Error polling prediction:", pollErr);
      }
    }

    // 5. Update creation record in database
    if (completed) {
      creation = await prisma.creation.update({
        where: { id: creation.id },
        data: {
          status,
          resultImage: status === "completed" ? resultImage : null,
          error: status === "failed" ? "Polling returned failed status" : null,
        }
      });

      // Refund if failed
      if (status === "failed") {
        await UserService.addCredits(userId, cost);
      }
    }

    return { id: creation.id, resultImage: creation.resultImage, status: creation.status };
  },

  /**
   * Sync and heal status of a creation record using MuAPI state lookup.
   */
  async syncStatus(creationId) {
    const creation = await prisma.creation.findUnique({
      where: { id: creationId },
      include: { app: true }
    });
    if (!creation || creation.status !== "processing") return creation;

    const apiKey = config.ai.apiKey;
    if (!apiKey) return creation;

    try {
      const response = await fetch(`https://api.muapi.ai/api/v1/predictions/${creation.requestId}/result`, {
        headers: { "x-api-key": apiKey },
      });

      if (response.ok) {
        const result = await response.json();
        const checkStatus = result.status || result.state;

        if (checkStatus === "completed" || checkStatus === "succeeded") {
          const outputs = result.outputs || [];
          const outputUrl = outputs[0] || result.output;
          return await prisma.creation.update({
            where: { id: creationId },
            data: { status: "completed", resultImage: outputUrl },
            include: { app: true }
          });
        } else if (checkStatus === "failed") {
          // Refund credits
          await UserService.addCredits(creation.userId, creation.creditCost);
          return await prisma.creation.update({
            where: { id: creationId },
            data: { status: "failed", error: result.error || "Generation failed" },
            include: { app: true }
          });
        }
      }
    } catch (e) {
      console.error(`Error syncing creation state ${creationId}:`, e);
    }

    return creation;
  }
};
