import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { UserService } from "../../../lib/services/user";
import config from "../../../lib/config";

const FALLBACK_STAGED_IMAGES = {
  "living-room": "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=800",
  "bedroom":     "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=800",
  "kitchen":     "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=800",
  "office":      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=800",
  "dining-room": "https://images.unsplash.com/photo-1617806118233-18e1db207f62?q=80&w=800",
  "bathroom":    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=800",
};

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { roomType, designStyle, originalImage, userPrompt } = body;

    if (!originalImage) {
      return new NextResponse("Original image is required", { status: 400 });
    }

    // 1. Deduct 6 credits from user
    const cost = config.ai.generationCost || 6;
    try {
      await UserService.deductCredits(session.user.id, cost);
    } catch (err) {
      return new NextResponse("Insufficient credits", { status: 402 });
    }

    // 2. Process Staging
    const apiKey = config.ai.apiKey;
    let stagedImage = FALLBACK_STAGED_IMAGES[roomType] || FALLBACK_STAGED_IMAGES["living-room"];
    let requestId = `mock_${Date.now()}`;

    if (apiKey && !apiKey.includes("your_") && apiKey.trim() !== "") {
      try {
        const webhookUrl = `${config.auth.webhook_url}/api/webhook/muapi`;
        // Forward image-to-image/inpainting task to MuAPI nano-banana-edit with webhook callbacks
        const submitRes = await fetch(`https://api.muapi.ai/api/v1/nano-banana-edit?webhook=${encodeURIComponent(webhookUrl)}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey
          },
          body: JSON.stringify({
            prompt: userPrompt,
            images_list: [originalImage],
            webhook: webhookUrl
          })
        });

        if (submitRes.ok) {
          const resJson = await submitRes.json();
          if (resJson.request_id) {
            requestId = resJson.request_id;
            
            // Clear initially to support async webhook / dashboard polling if inline polling times out
            stagedImage = "";

            // Poll for result (max 12s, checking every 2s)
            let completed = false;
            let attempts = 0;
            const maxAttempts = 6;
            
            while (!completed && attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 2000));
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
                      stagedImage = outputUrl;
                      completed = true;
                    }
                  } else if (state === "failed") {
                    console.error("MuAPI prediction failed:", pollJson.error);
                    break;
                  }
                }
              } catch (pollErr) {
                console.error("MuAPI polling error:", pollErr);
              }
            }
          } else if (resJson.output) {
            stagedImage = resJson.output;
          }
        }
      } catch (err) {
        console.warn("MuAPI call failed, falling back to local styled mocks:", err.message);
      }
    }

    // 3. Save records in StagedRoom
    const isCompleted = stagedImage && stagedImage !== "";
    const status = isCompleted ? "completed" : "generating";

    const room = await prisma.stagedRoom.create({
      data: {
        roomType,
        designStyle,
        originalImage,
        stagedImage: isCompleted ? stagedImage : "",
        userPrompt,
        status,
        requestId,
        userId: session.user.id
      }
    });

    return NextResponse.json({ roomId: room.id, stagedImage: room.stagedImage });
  } catch (error) {
    console.error("[STAGE_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
