import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { UserService } from "../../../lib/services/user";
import config from "../../../lib/config";

const FALLBACK_TRYONS = [
  "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=800",
  "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?q=80&w=800",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800"
];

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { personImage, clothesImage, aspectRatio, prompt } = body;

    if (!personImage || !clothesImage) {
      return new NextResponse("Person image and clothes image are required", { status: 400 });
    }

    const cleanPrompt = prompt || "Generate a photorealistic virtual try-on where the person is wearing the clothes in the provided clothes photo.";
    const cleanAspectRatio = aspectRatio || "auto";

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
            images_list: [personImage, clothesImage],
            aspect_ratio: cleanAspectRatio,
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
                    console.error("MuAPI tryon failed:", pollJson.error);
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
      resultImage = FALLBACK_TRYONS[Math.floor(Math.random() * FALLBACK_TRYONS.length)];
      status = "completed";
    }

    // 3. Save DB record
    const tryon = await prisma.tryOn.create({
      data: {
        userId: session.user.id,
        personImage,
        clothesImage,
        resultImage,
        prompt: cleanPrompt,
        aspectRatio: cleanAspectRatio,
        requestId,
        status,
        creditCost: cost
      }
    });

    return NextResponse.json({ tryonId: tryon.id, resultImage: tryon.resultImage, status: tryon.status });
  } catch (error) {
    console.error("[TRYON_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
