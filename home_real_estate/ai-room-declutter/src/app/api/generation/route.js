import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserService } from "@/lib/services/user";
import config from "@/lib/config";

const FALLBACK_MAP = {
  "living room": "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1200",
  "bedroom": "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=1200",
  "office": "https://images.unsplash.com/photo-1493934558415-9d19f0b2b4d2?q=80&w=1200",
  "dining room": "https://images.unsplash.com/photo-1617806118233-18e1de247200?q=80&w=1200",
  "loft": "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?q=80&w=1200",
  "study": "https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=1200",
  "kitchen": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=1200",
  "den": "https://images.unsplash.com/photo-1595428774223-ef52624120d2?q=80&w=1200",
  "suite": "https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=1200",
  "lounge": "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1200",
  "nursery": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=1200",
  "studio": "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1200"
};
const DEFAULT_FALLBACK = "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1200";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const {
      imageUrl,
      prompt,
      roomType = "Living Room",
      modelName = "nano-banana-2-edit",
      aspectRatio = "Auto",
      googleSearch = false,
      resolution = "1k",
      outputFormat = "jpg",
    } = body;

    if (!imageUrl) {
      return new NextResponse("Image URL is required", { status: 400 });
    }
    if (!prompt) {
      return new NextResponse("Prompt is required", { status: 400 });
    }

    // 1. Deduct credits based on model name and resolution
    const modelCosts = (config.ai.generationCost && config.ai.generationCost[modelName]) || { "1k": 12, "2k": 18, "4k": 24 };
    const cost = modelCosts[resolution] || 12;
    try {
      await UserService.deductCredits(session.user.id, cost);
    } catch (e) {
      return new NextResponse("Insufficient credits", { status: 402 });
    }

    // 2. Submit to MuAPI
    const apiKey = config.ai.apiKey;
    let resultImage = "";
    let requestId = `mock_${Date.now()}`;
    let status = "processing";

    if (apiKey && !apiKey.includes("your_") && apiKey.trim() !== "") {
      try {
        const webhookUrl = `${config.auth.webhook_url}/api/webhook/muapi`;
        const submitUrl = `https://api.muapi.ai/api/v1/${modelName}?webhook=${encodeURIComponent(webhookUrl)}`;

        // Build parameters dynamically depending on model schema
        let inputPayload = {
          prompt,
          images_list: [imageUrl],
          resolution,
        };

        if (modelName === "nano-banana-2-edit") {
          inputPayload.aspect_ratio = aspectRatio;
          inputPayload.google_search = googleSearch === "true" || googleSearch === true;
          inputPayload.output_format = outputFormat;
        } else if (modelName === "nano-banana-pro-edit") {
          inputPayload.aspect_ratio = aspectRatio === "Auto" ? "1:1" : aspectRatio;
        }

        const submitRes = await fetch(submitUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
          body: JSON.stringify(inputPayload),
        });

        if (submitRes.ok) {
          const resJson = await submitRes.json();
          const reqId = resJson.request_id || resJson.id;

          if (reqId) {
            requestId = reqId;

            // Inline polling (up to 15s, 6 × 2.5s)
            let completed = false;
            let attempts = 0;

            while (!completed && attempts < 6) {
              await new Promise((r) => setTimeout(r, 2500));
              attempts++;

              try {
                const pollRes = await fetch(
                  `https://api.muapi.ai/api/v1/predictions/${requestId}/result`,
                  { headers: { "x-api-key": apiKey } }
                );
                if (pollRes.ok) {
                  const pollJson = await pollRes.json();
                  const state = pollJson.status || pollJson.state;
                  if (state === "completed" || state === "succeeded") {
                    const outputs = pollJson.outputs || [];
                    const outUrl =
                      outputs[0] ||
                      (typeof pollJson.output === "string"
                        ? pollJson.output
                        : pollJson.output?.urls?.get || pollJson.output?.image_url);
                    if (outUrl) {
                      resultImage = outUrl;
                      status = "completed";
                      completed = true;
                    }
                  } else if (state === "failed") {
                    status = "failed";
                    completed = true;
                  }
                }
              } catch (pollErr) {
                console.error("Poll error:", pollErr);
              }
            }
          } else if (resJson.output) {
            resultImage = Array.isArray(resJson.output)
              ? resJson.output[0]
              : resJson.output.image_url || resJson.output;
            status = "completed";
          }
        } else {
          const errText = await submitRes.text();
          console.error("MuAPI submission failed:", submitRes.status, errText);
          status = "failed";
        }
      } catch (err) {
        console.warn("MuAPI call failed, using mock:", err.message);
        status = "failed";
      }
    } else {
      // Mock mode — 3s delay
      await new Promise((r) => setTimeout(r, 3000));
      
      const typeKey = roomType.toLowerCase().trim();
      let selectedFallback = DEFAULT_FALLBACK;
      for (const [key, val] of Object.entries(FALLBACK_MAP)) {
        if (typeKey.includes(key)) {
          selectedFallback = val;
          break;
        }
      }
      
      resultImage = selectedFallback;
      status = "completed";
    }

    // Refund credits on immediate failure
    if (status === "failed") {
      try {
        await UserService.addCredits(session.user.id, cost);
      } catch (refundErr) {
        console.error("Failed to refund credits:", refundErr);
      }
      return NextResponse.json({ error: "Prediction failed" }, { status: 500 });
    }

    // 3. Save to DB
    const record = await prisma.roomDeclutter.create({
      data: {
        userId: session.user.id,
        inputImage: imageUrl,
        resultImage,
        prompt,
        roomType,
        modelName,
        requestId,
        status,
        creditCost: cost,
      },
    });

    return NextResponse.json({
      id: record.id,
      resultImage: record.resultImage,
      status: record.status,
    });
  } catch (error) {
    console.error("[GENERATION_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
