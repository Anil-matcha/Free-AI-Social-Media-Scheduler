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
      const statusData = await AIService.checkStatus(requestId, session.user.id);
      return NextResponse.json(statusData);
    }

    // Otherwise, fetch all user enhancements
    const enhancements = await prisma.enhancement.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(enhancements);
  } catch (error) {
    console.error("[CREATIONS_GET_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST new enhancement task
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

    if (!user || user.credits < 1) {
      return new NextResponse("Insufficient credits", { status: 400 });
    }

    const { inputUrl, templateImageUrl, prompt, aspectRatio, templateName } = await req.json();

    if (!inputUrl) {
      return new NextResponse("Missing inputUrl", { status: 400 });
    }
    if (!prompt) {
      return new NextResponse("Missing prompt", { status: 400 });
    }

    const enhancement = await AIService.generate(session.user.id, {
      inputUrl,
      templateImageUrl: templateImageUrl || null,
      prompt,
      aspectRatio: aspectRatio || "Auto",
      templateName: templateName || null,
    });

    return NextResponse.json(enhancement);
  } catch (error) {
    console.error("[CREATIONS_POST_ERROR]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
