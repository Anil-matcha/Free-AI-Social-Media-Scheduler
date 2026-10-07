import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserService } from "@/lib/services/user";
import config from "@/lib/config";

const FALLBACK_RESULTS = [
  "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=800",
  "https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=800",
  "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=800",
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
      style,
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
    if (!style) {
      return new NextResponse("Style is required", { status: 400 });
    }

    // 1. Deduct credits
    const cost = config.ai.generationCost || 3;
    try {
      await UserService.deductCredits(session.user.id, cost);
    } catch {
      return new NextResponse("Insufficient credits", { status: 402 });
    }

    // 2. Submit to MuAPI nano-banana-2-edit
    const apiKey = config.ai.apiKey;
    let resultImage = "";
    let requestId = `mock_${Date.now()}`;
    let status = "processing";

    if (apiKey && !apiKey.includes("your_") && apiKey.trim() !== "") {
      try {
        const webhookUrl = `${config.auth.webhook_url}/api/webhook/muapi`;
        const submitUrl = `https://api.muapi.ai/api/v1/nano-banana-2-edit?webhook=${encodeURIComponent(webhookUrl)}`;

        const inputPayload = {
          prompt,
          images_list: [imageUrl],
          aspect_ratio: aspectRatio,
          google_search: googleSearch === "true" || googleSearch === true,
          resolution,
          output_format: outputFormat,
        };

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
                        : pollJson.output?.urls?.get);
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
              : resJson.output;
            status = "completed";
          }
        } else {
          const errText = await submitRes.text();
          console.error("MuAPI submission failed:", submitRes.status, errText);
        }
      } catch (err) {
        console.warn("MuAPI call failed, using mock:", err.message);
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
    }

    // 3. Save to DB
    const record = await prisma.magicSelfCreation.create({
      data: {
        userId: session.user.id,
        inputImage: imageUrl,
        resultImage,
        prompt,
        style,
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
