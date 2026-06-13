import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserService } from "@/lib/services/user";
import config from "@/lib/config";

const FALLBACK_LOGOS = {
  "nano-banana-pro": "https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/nano-banana-2.jpg",
  "nano-banana-pro-edit": "https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/nano-banana-2-edit-out.jpg"
};

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const {
      prompt,
      aspectRatio = "1:1",
      resolution = "1k",
      inputImage = null
    } = body;

    if (!prompt) {
      return new NextResponse("Prompt is required", { status: 400 });
    }

    // Cost logic: 18 credits for 1k and 2k, 36 credits for 4k resolution
    const cost = resolution === "4k" ? 36 : 18;

    try {
      await UserService.deductCredits(session.user.id, cost);
    } catch (err) {
      return new NextResponse("Insufficient credits", { status: 402 });
    }

    // Select model based on whether user uploaded a reference image
    const modelType = inputImage ? "nano-banana-pro-edit" : "nano-banana-pro";

    const apiKey = config.ai.apiKey;
    let resultImage = "";
    let requestId = `mock_${Date.now()}`;
    let status = "processing";

    if (apiKey && !apiKey.includes("your_") && apiKey.trim() !== "") {
      try {
        const webhookUrl = `${config.auth.webhook_url}/api/webhook/muapi`;
        const submitUrl = `https://api.muapi.ai/api/v1/${modelType}?webhook=${encodeURIComponent(webhookUrl)}`;

        const inputPayload = {
          prompt,
          aspect_ratio: aspectRatio,
          resolution
        };

        if (inputImage) {
          inputPayload.images_list = [inputImage];
        }

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
          } else {
            throw new Error("No request_id returned from MuAPI");
          }
        } else {
          const errText = await submitRes.text();
          console.error("MuAPI submission failed with status:", submitRes.status, errText);
          throw new Error(`MuAPI submission failed with status ${submitRes.status}: ${errText}`);
        }
      } catch (err) {
        console.warn("MuAPI call failed, falling back to local mocks:", err.message);
        requestId = `mock_${Date.now()}`;
      }
    } else {
      // Mock mode
      requestId = `mock_${Date.now()}`;
    }

    // Save DB record
    const creation = await prisma.logoCreation.create({
      data: {
        userId: session.user.id,
        prompt,
        aspectRatio,
        resolution,
        inputImage,
        resultImage: "",
        requestId,
        status: "processing",
        creditCost: cost
      }
    });

    return NextResponse.json(creation);
  } catch (error) {
    console.error("[LOGO_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
