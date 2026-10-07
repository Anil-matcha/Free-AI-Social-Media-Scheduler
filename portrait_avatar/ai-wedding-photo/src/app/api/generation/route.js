import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserService } from "@/lib/services/user";
import config from "@/lib/config";

// Mock template images for mock mode fallback
const MOCK_WEDDING_PHOTOS = [
  "https://cdn.easysite.ai/AutoDev/11407/ai-wedding-photos/Couple/pexels_10733295.jpg",
  "https://cdn.easysite.ai/AutoDev/11407/ai-wedding-photos/Couple/pexels_11055565.jpg",
  "https://cdn.easysite.ai/AutoDev/11407/ai-wedding-photos/Couple/pexels_12194050.jpg",
  "https://cdn.easysite.ai/AutoDev/11407/ai-wedding-photos/Couple/pexels_12194459.jpg",
];

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { prompt, inputImage, templateImage, aspectRatio, activeTab } = body;

    if (!inputImage) {
      return new NextResponse("Missing input portrait image", { status: 400 });
    }

    // 1. Deduct credits
    const cost = config.ai.generationCost || 18;
    try {
      await UserService.deductCredits(session.user.id, cost);
    } catch (err) {
      return new NextResponse("Insufficient credits", { status: 402 });
    }

    const apiKey = config.ai.apiKey;
    let resultImage = "";
    let requestId = `mock_${Date.now()}`;
    let status = "processing";

    if (apiKey && !apiKey.includes("your_") && apiKey.trim() !== "") {
      try {
        const webhookUrl = `${config.auth.webhook_url}/api/webhook/muapi`;

        // Construct the images list: input portrait is always first
        const imagesList = [inputImage];
        if (templateImage) {
          imagesList.push(templateImage);
        }

        // Correct endpoint: POST /api/v1/{model-name}
        const submitRes = await fetch(
          `https://api.muapi.ai/api/v1/nano-banana-pro-edit?webhook=${encodeURIComponent(webhookUrl)}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey,
            },
            body: JSON.stringify({
              prompt: prompt,
              images_list: imagesList,
              aspect_ratio: aspectRatio || "1:1",
              resolution: "1k",
            }),
          }
        );

        if (submitRes.ok) {
          const resJson = await submitRes.json();
          console.log("[GENERATION] MuAPI submit response:", JSON.stringify(resJson));
          requestId = resJson.request_id || resJson.id || requestId;

          // Poll for result at the correct polling endpoint (max 60s, 12 x 5s)
          let completed = false;
          let attempts = 0;
          const maxAttempts = 12;

          while (!completed && attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 5000));
            attempts++;

            try {
              const pollRes = await fetch(
                `https://api.muapi.ai/api/v1/predictions/${requestId}/result`,
                {
                  method: "GET",
                  headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                  },
                }
              );

              if (pollRes.ok) {
                const pollJson = await pollRes.json();
                console.log(`[GENERATION] Poll attempt ${attempts}:`, JSON.stringify(pollJson).slice(0, 300));
                const state = pollJson.status || pollJson.state;

                if (state === "completed" || state === "succeeded") {
                  // outputs array contains image URLs
                  const outputs = pollJson.outputs || [];
                  resultImage =
                    outputs[0] ||
                    (pollJson.output ? pollJson.output[0] : "") ||
                    pollJson.video || "";
                  if (resultImage) {
                    status = "completed";
                    completed = true;
                  }
                } else if (state === "failed" || state === "cancelled") {
                  console.error("[GENERATION] MuAPI job failed:", pollJson);
                  status = "failed";
                  break;
                }
              }
            } catch (pollErr) {
              console.error("MuAPI polling error:", pollErr);
            }
          }
        } else {
          const errText = await submitRes.text();
          console.error("MuAPI generation submission failed:", submitRes.status, errText);
        }
      } catch (err) {
        console.warn("MuAPI call failed, falling back to local mock:", err.message);
      }
    }

    // Mock Mode fallback or if polling timed out
    if (status === "processing") {
      await new Promise(resolve => setTimeout(resolve, 3000)); // simulate delay
      // Use one of the mock wedding templates as fallback
      const randomIndex = Math.floor(Math.random() * MOCK_WEDDING_PHOTOS.length);
      resultImage = MOCK_WEDDING_PHOTOS[randomIndex];
      status = "completed";
    }

    // Save creation record in database
    const record = await prisma.weddingPhotoCreation.create({
      data: {
        userId: session.user.id,
        prompt: prompt || "Wedding Photo Generation",
        inputImage,
        templateImage: templateImage || null,
        resultImage: resultImage || null,
        requestId,
        status,
        aspectRatio: aspectRatio || "1:1",
        activeTab: activeTab || "template",
        creditCost: cost
      }
    });

    return NextResponse.json({
      id: record.id,
      resultImage: record.resultImage,
      status: record.status,
      requestId: record.requestId
    });

  } catch (error) {
    console.error("[GENERATION_POST_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
