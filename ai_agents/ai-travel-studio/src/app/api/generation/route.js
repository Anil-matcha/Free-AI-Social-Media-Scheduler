import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserService } from "@/lib/services/user";
import config from "@/lib/config";

const FALLBACK_MAP = {
  "paris": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1200",
  "tokyo": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1200",
  "rome": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=1200",
  "maldives": "https://images.unsplash.com/photo-1506929562872-bb421503ef21?q=80&w=1200",
  "egypt": "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?q=80&w=1200",
  "swiss alps": "https://images.unsplash.com/photo-1502784444187-359ac186c5bb?q=80&w=1200",
  "new york": "https://images.unsplash.com/photo-1534430480872-3498386e7856?q=80&w=1200",
  "taj mahal": "https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=1200",
  "sydney": "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?q=80&w=1200",
  "london": "https://images.unsplash.com/photo-1486299267070-83823f5448dd?q=80&w=1200",
  "bali": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=1200",
  "venice": "https://images.unsplash.com/photo-1527631746610-bca00a040d60?q=80&w=1200"
};
const DEFAULT_FALLBACK = "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200";

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
      destination = "Paris",
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
      
      const destKey = destination.toLowerCase().trim();
      let selectedFallback = DEFAULT_FALLBACK;
      for (const [key, val] of Object.entries(FALLBACK_MAP)) {
        if (destKey.includes(key)) {
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
    const record = await prisma.travelStudio.create({
      data: {
        userId: session.user.id,
        inputImage: imageUrl,
        resultImage,
        prompt,
        destination,
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
