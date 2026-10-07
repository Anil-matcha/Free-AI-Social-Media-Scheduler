import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AIService } from "@/lib/services/ai";

// GET user creations history or check status of a specific request
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get("requestId");

    // If requestId is passed, perform status check/polling fallback
    if (requestId) {
      console.log(`[CREATIONS_API_GET] Checking status for requestId: ${requestId}`);
      const statusData = await AIService.checkStatus(requestId, session.user.id);
      console.log(`[CREATIONS_API_GET] Status result for ${requestId}:`, statusData);
      return NextResponse.json(statusData);
    }

    // Otherwise, fetch all user kissing video creations
    const creations = await prisma.kissingVideoCreation.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" }
    });

    // Automatically check and update status of any creations that are still processing
    const updatedCreations = await Promise.all(
      creations.map(async (c) => {
        if (c.status === "processing" && c.requestId) {
          try {
            await AIService.checkStatus(c.requestId, session.user.id);
            const refetched = await prisma.kissingVideoCreation.findUnique({
              where: { id: c.id }
            });
            return refetched || c;
          } catch (e) {
            console.error(`Error updating status for creation ${c.id}:`, e);
            return c;
          }
        }
        return c;
      })
    );

    return NextResponse.json(updatedCreations);
  } catch (error) {
    console.error("[CREATIONS_GET_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST new kissing video creation task
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check credits
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true }
    });

    const { maleImage, femaleImage, stitchedImage, prompt, modelId, aspectRatio, duration, resolution } = await req.json();

    if (!maleImage || !femaleImage || !stitchedImage) {
      return new NextResponse("Missing maleImage, femaleImage or stitchedImage", { status: 400 });
    }
    if (!prompt) {
      return new NextResponse("Missing prompt", { status: 400 });
    }
    if (!modelId) {
      return new NextResponse("Missing modelId", { status: 400 });
    }

    const cost = AIService.getCreditCost(modelId, duration, resolution);
    if (!user || user.credits < cost) {
      return new NextResponse(`Insufficient credits. Required: ${cost}, balance: ${user?.credits ?? 0}`, { status: 400 });
    }

    const creation = await AIService.generate(session.user.id, {
      maleImage,
      femaleImage,
      stitchedImage,
      prompt,
      modelId,
      aspectRatio: aspectRatio || "16:9",
      duration,
      resolution
    });

    return NextResponse.json(creation);
  } catch (error) {
    console.error("[CREATIONS_POST_ERROR]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
