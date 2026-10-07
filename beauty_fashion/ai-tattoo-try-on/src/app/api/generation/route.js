import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { UserService } from "../../../lib/services/user";
import config from "../../../lib/config";

const FALLBACK_TATTOOS = [
  "https://images.unsplash.com/photo-1550537687-c91072c4792d?q=80&w=800", // tribal arm tattoo
  "https://images.unsplash.com/photo-1590247813693-5541d1c609fd?q=80&w=800", // floral wrist tattoo
  "https://images.unsplash.com/photo-1562962230-16e4623d36e6?q=80&w=800"  // dragon forearm tattoo
];

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { personImage, tattooImage, prompt, aspectRatio = "1:1", resolution = "1k" } = body;

    if (!personImage || !tattooImage) {
      return new NextResponse("Both person image and tattoo design image are required", { status: 400 });
    }

    if (!prompt) {
      return new NextResponse("Prompt is required", { status: 400 });
    }

    // 1. Deduct 24 credits
    const cost = config.ai.generationCost || 24;
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
        const submitUrl = `https://api.muapi.ai/api/v1/nano-banana-pro-edit?webhook=${encodeURIComponent(webhookUrl)}`;

        const inputPayload = {
          prompt,
          aspect_ratio: aspectRatio,
          resolution,
          images_list: [personImage, tattooImage]
        };

        const submitRes = await fetch(submitUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey
          },
          body: JSON.stringify(inputPayload)
        });

        if (submitRes.ok) {
          const resJson = await submitRes.json();
          const reqId = resJson.request_id || resJson.id;
          if (reqId) {
            requestId = reqId;

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
        } else {
          const errText = await submitRes.text();
          console.error("MuAPI submission failed:", submitRes.status, errText);
        }
      } catch (err) {
        console.warn("MuAPI call failed, falling back to local mocks:", err.message);
      }
    } else {
      // Mock mode
      // Wait 3 seconds to simulate AI delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      resultImage = FALLBACK_TATTOOS[Math.floor(Math.random() * FALLBACK_TATTOOS.length)];
      status = "completed";
    }

    // 3. Save DB record
    const creation = await prisma.tattooCreation.create({
      data: {
        userId: session.user.id,
        personImage,
        tattooImage,
        resultImage,
        prompt,
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
