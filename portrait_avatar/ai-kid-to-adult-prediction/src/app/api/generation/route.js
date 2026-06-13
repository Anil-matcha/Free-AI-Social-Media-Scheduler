import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserService } from "@/lib/services/user";
import config from "@/lib/config";

const FALLBACK_RESULTS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=800",
];

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
          // aspect ratio mapping for pro model (defaults to 1:1 if Auto is passed, otherwise keep selection)
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
      resultImage =
        FALLBACK_RESULTS[Math.floor(Math.random() * FALLBACK_RESULTS.length)];
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
    const record = await prisma.kidAdultPrediction.create({
      data: {
        userId: session.user.id,
        inputImage: imageUrl,
        resultImage,
        prompt,
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
