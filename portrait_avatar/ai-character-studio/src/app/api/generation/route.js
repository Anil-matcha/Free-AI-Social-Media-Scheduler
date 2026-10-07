import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AIService } from "@/lib/services/ai";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const body = await req.json();
    const { prompt, inputImage, aspectRatio, modelEndpoint, appId, ...customParams } = body;
    const userId = session.user.id;

    if (!prompt) {
      return NextResponse.json({ error: "Missing required prompt parameter" }, { status: 400 });
    }

    // Lookup AppInstance config if appId is provided
    let endpointToCall = modelEndpoint || "predictions";
    let formattedPrompt = prompt;

    let creditCost = 1;
    let modelName = null;

    if (appId) {
      const appInstance = await prisma.appInstance.findUnique({
        where: { id: appId },
      });

      if (!appInstance || appInstance.userId !== userId) {
        return NextResponse.json({ error: "App instance not found or access denied" }, { status: 404 });
      }

      const parsedConfig = appInstance.config ? JSON.parse(appInstance.config) : {};
      
      let baseCost = 1;
      if (parsedConfig.creditCost !== undefined) {
        baseCost = Number(parsedConfig.creditCost);
      }
      creditCost = baseCost;

      // Dynamic credit cost calculation
      const userParams = parsedConfig.userParams || [];
      if (Array.isArray(userParams)) {
        userParams.forEach(param => {
          let val = customParams[param.key];
          if (val === undefined) {
            val = param.defaultValue;
          }

          if (param.type === "enum") {
            if (param.costModifiers && param.costModifiers[val] !== undefined) {
              creditCost += Number(param.costModifiers[val]) || 0;
            } else if (Array.isArray(param.costModifiers) && param.options) {
              const optIndex = param.options.indexOf(val);
              if (optIndex !== -1 && param.costModifiers[optIndex] !== undefined) {
                creditCost += Number(param.costModifiers[optIndex]) || 0;
              }
            }
          } else if (param.type === "boolean") {
            const isTrue = val === true || val === "true" || val === 1 || val === "1";
            if (isTrue && param.costIfTrue !== undefined) {
              creditCost += Number(param.costIfTrue) || 0;
            }
          } else if (param.type === "number" || param.type === "slider") {
            if (param.costPerUnit !== undefined) {
              const numVal = Number(val) || 0;
              creditCost += numVal * (Number(param.costPerUnit) || 0);
            }
          }
        });
      }

      modelName = parsedConfig.model || null;

      // Merge system instructions/prompts
      if (appInstance.templateId === "ai-chat") {
        endpointToCall = parsedConfig.modelEndpoint || "chat/completions";
      } else {
        if (inputImage) {
          endpointToCall = parsedConfig.editModelEndpoint || parsedConfig.modelEndpoint || "predictions";
          modelName = parsedConfig.editModel || parsedConfig.model || null;
        } else {
          endpointToCall = parsedConfig.modelEndpoint || "predictions";
        }
      }
    }

    const result = await AIService.generate(userId, {
      prompt: formattedPrompt,
      inputImage,
      aspectRatio,
      modelEndpoint: endpointToCall,
      appId,
      creditCost,
      model: modelName,
      customParams,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Generation handler crash:", error);
    return NextResponse.json({ error: error.message || "Failed to process generation" }, { status: 500 });
  }
}
