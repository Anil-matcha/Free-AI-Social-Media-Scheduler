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

    // Otherwise, fetch all user amazon product creations
    const creations = await prisma.amazonProductCreation.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" }
    });

    // Automatically check and update status of any creations that are still processing
    const updatedCreations = await Promise.all(
      creations.map(async (c) => {
        if (c.status === "processing" && c.requestId) {
          try {
            await AIService.checkStatus(c.requestId, session.user.id);
            const refetched = await prisma.amazonProductCreation.findUnique({
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

    // Parse inputUrls back to arrays for the frontend convenience
    const parsedCreations = updatedCreations.map(c => {
      try {
        return {
          ...c,
          inputUrls: JSON.parse(c.inputUrls)
        };
      } catch (err) {
        return {
          ...c,
          inputUrls: c.inputUrls ? c.inputUrls.split(',') : []
        };
      }
    });

    return NextResponse.json(parsedCreations);
  } catch (error) {
    console.error("[CREATIONS_GET_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST new amazon product creation task
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

    const cost = AIService.getCreditCost();
    if (!user || user.credits < cost) {
      return new NextResponse(`Insufficient credits. Required: ${cost}`, { status: 400 });
    }

    const { inputUrls, prompt, aspectRatio } = await req.json();

    if (!Array.isArray(inputUrls) || inputUrls.length === 0) {
      return new NextResponse("Missing inputUrls array or empty", { status: 400 });
    }
    if (inputUrls.length > 14) {
      return new NextResponse("Maximum of 14 input images allowed", { status: 400 });
    }
    if (!prompt) {
      return new NextResponse("Missing prompt", { status: 400 });
    }

    const creation = await AIService.generate(session.user.id, {
      inputUrls,
      prompt,
      aspectRatio: aspectRatio || "1:1",
    });

    return NextResponse.json(creation);
  } catch (error) {
    console.error("[CREATIONS_POST_ERROR]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
