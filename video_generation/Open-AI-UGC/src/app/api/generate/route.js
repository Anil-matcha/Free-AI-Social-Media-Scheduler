import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MODEL_ENDPOINTS = {
  "grok-video": "https://api.muapi.ai/api/v1/grok-imagine-image-to-video",
  "veo-3-1": "https://api.muapi.ai/api/v1/veo3.1-image-to-video",
  "happy-horse": "https://api.muapi.ai/api/v1/happy-horse-1-image-to-video-720p",
  "seedance-2": "https://api.muapi.ai/api/v1/seedance-2-image-to-video"
};

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { modelId, prompt, settings, images } = await req.json();

    const apiKey = process.env.UGC_API_KEY;
    if (!apiKey) {
      return new NextResponse("API Key not configured", { status: 500 });
    }

    const endpoint = MODEL_ENDPOINTS[modelId];
    if (!endpoint) {
      return new NextResponse("Invalid model selected", { status: 400 });
    }

    // Calculate required credits
    let requiredCredits = 10;
    const duration = typeof settings.duration === "number" ? settings.duration : 5;
    const resolution = settings.resolution || "";

    if (modelId === "grok-video") {
      const grokDuration = typeof settings.duration === "number" ? settings.duration : 6;
      const rate = resolution === "720p" ? 10 : 5;
      requiredCredits = grokDuration * rate;
    } else if (modelId === "veo-3-1") {
      const veoDuration = typeof settings.duration === "number" ? settings.duration : 8;
      let rate = 500;
      if (resolution === "1080p") rate = 650;
      else if (resolution === "4k") rate = 740;
      requiredCredits = veoDuration * rate;
    } else if (modelId === "happy-horse") {
      requiredCredits = duration * 36;
    } else if (modelId === "seedance-2") {
      requiredCredits = duration * 50;
    }

    // Check credits
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true }
    });

    if (!user || user.credits < requiredCredits) {
      return NextResponse.json({ error: `Insufficient credits. This requires ${requiredCredits} credits but you only have ${user?.credits || 0}.` }, { status: 403 });
    }

    // Prepare payload based on MUAPI specs
    const payload = {
      prompt,
      images_list: images,
      image_url: images && images.length > 0 ? images[0] : undefined, // Some models require image_url
      webhook_url: `${process.env.WEBHOOK_URL}/api/webhook/muapi`,
      ...settings
    };

    // Call MUAPI
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MUAPI Request Failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    // Create entry in DB
    const creation = await prisma.creation.create({
      data: {
        userId: session.user.id,
        type: "video",
        title: prompt.substring(0, 50) + "...",
        prompt: prompt,
        requestId: data.request_id || data.id,
        status: "processing",
        modelId: modelId,
        aspectRatio: settings.aspect_ratio,
        resolution: settings.resolution,
        duration: settings.duration,
        mode: settings.mode,
        inputImages: images && images.length > 0 ? JSON.stringify(images) : null
      }
    });

    // Deduct required credits
    await prisma.user.update({
      where: { id: session.user.id },
      data: { credits: { decrement: requiredCredits } }
    });

    return NextResponse.json({ 
      success: true, 
      creationId: creation.id,
      requestId: creation.requestId 
    });

  } catch (error) {
    console.error("[GENERATE_ERROR]", error);
    return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
  }
}
