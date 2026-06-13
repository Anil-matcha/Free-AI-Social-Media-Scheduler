import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AIService } from "@/lib/services/ai";

// GET user restorations history or check status of a specific request
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
      const statusData = await AIService.checkStatus(requestId, session.user.id);
      return NextResponse.json(statusData);
    }

    // Otherwise, fetch all user restorations
    const restorations = await prisma.photoRestoration.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(restorations);
  } catch (error) {
    console.error("[RESTORATIONS_GET_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST new old photo restoration task
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

    const { inputUrl, prompt, mode } = await req.json();

    if (!inputUrl) {
      return new NextResponse("Missing inputUrl", { status: 400 });
    }
    if (!prompt) {
      return new NextResponse("Missing prompt", { status: 400 });
    }

    const restoration = await AIService.restore(session.user.id, {
      inputUrl,
      prompt,
      mode: mode || "full",
    });

    return NextResponse.json(restoration);
  } catch (error) {
    console.error("[RESTORATIONS_POST_ERROR]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
