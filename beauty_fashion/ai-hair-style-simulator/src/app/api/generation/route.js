import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { UserService } from "../../../lib/services/user";
import config from "../../../lib/config";

const FALLBACK_HAIRSTYLES = [
  "https://images.unsplash.com/photo-1595959183075-c1d09e77f050?q=80&w=800", // curly blonde
  "https://images.unsplash.com/photo-1605497746444-051d5236a28e?q=80&w=800", // long pink
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=800"  // short dark
];

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { inputImage, gender, styleName, colorName, customPrompt } = body;

    if (!inputImage) {
      return new NextResponse("Input face image is required", { status: 400 });
    }

    // Construct detailed prompt for AI style simulator
    const cleanGender = gender || "unisex";
    const cleanStyle = styleName || "short";
    const cleanColor = colorName || "black";
    const userPrompt = customPrompt ? `, ${customPrompt}` : "";
    const cleanPrompt = `A high quality professional realistic portrait photo of a ${cleanGender} with a beautiful styled ${cleanColor} ${cleanStyle} hairstyle${userPrompt}. The hairstyle must blend naturally on the person's head, retaining the original facial features, facial structure, skin tone and background of the photo.`;

    // 1. Deduct 18 credits
    const cost = config.ai.generationCost || 18;
    try {
      await UserService.deductCredits(session.user.id, cost);
    } catch (err) {
      return new NextResponse("Insufficient credits", { status: 402 });
    }

    // 2. Submit prediction
    const apiKey = config.ai.apiKey;
    let resultImage = "";
    let requestId = `mock_${Date.now()}`;
    let status = "processing";

    if (apiKey && !apiKey.includes("your_") && apiKey.trim() !== "") {
      try {
        const webhookUrl = `${config.auth.webhook_url}/api/webhook/muapi`;
        const submitRes = await fetch(`https://api.muapi.ai/api/v1/gpt-image-2-image-to-image?webhook=${encodeURIComponent(webhookUrl)}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey
          },
          body: JSON.stringify({
            prompt: cleanPrompt,
            images_list: [inputImage],
            webhook: webhookUrl
          })
        });

        if (submitRes.ok) {
          const resJson = await submitRes.json();
          if (resJson.request_id) {
            requestId = resJson.request_id;

            // Poll for result (max 15s, checking every 2.5s)
            let completed = false;
            let attempts = 0;
            const maxAttempts = 6;

            while (!completed && attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 2500));
              attempts++;

              try {
                const pollRes = await fetch(`https://api.muapi.ai/api/v1/predictions/${requestId}/result`, {
                  method: "GET",
                  headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey
                  }
                });

                if (pollRes.ok) {
                  const pollJson = await pollRes.json();
                  const state = pollJson.status || pollJson.state;
                  if (state === "completed" || state === "succeeded") {
                    const outputs = pollJson.outputs || [];
                    const outputUrl = outputs[0] || (typeof pollJson.output === 'string' ? pollJson.output : pollJson.output?.urls?.get);
                    if (outputUrl) {
                      resultImage = outputUrl;
                      status = "completed";
                      completed = true;
                    }
                  } else if (state === "failed") {
                    console.error("MuAPI generation failed:", pollJson.error);
                    status = "failed";
                    break;
                  }
                }
              } catch (pollErr) {
                console.error("MuAPI polling error:", pollErr);
              }
            }
          } else if (resJson.output) {
            resultImage = resJson.output;
            status = "completed";
          }
        }
      } catch (err) {
        console.warn("MuAPI call failed, falling back to local mocks:", err.message);
      }
    } else {
      // Mock mode
      // Wait 3 seconds to simulate AI delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      resultImage = FALLBACK_HAIRSTYLES[Math.floor(Math.random() * FALLBACK_HAIRSTYLES.length)];
      status = "completed";
    }

    // 3. Save DB record
    const creation = await prisma.hairStyle.create({
      data: {
        userId: session.user.id,
        inputImage,
        resultImage,
        gender: cleanGender,
        styleName: cleanStyle,
        colorName: cleanColor,
        prompt: cleanPrompt,
        requestId,
        status,
        creditCost: cost
      }
    });

    return NextResponse.json({ id: creation.id, resultImage: creation.resultImage, status: creation.status });
  } catch (error) {
    console.error("[GENERATION_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
