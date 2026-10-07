import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AIService } from "@/lib/services/ai";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { model, prompt, imageUrl, lastImageUrl, imagesList, aspectRatio, duration, resolution, mode, generateAudio } = await req.json();

    // Compute the real cost before checking balance
    const cost = AIService.computeCreditCost("video", { model, resolution, duration, generateAudio });

    // Check credits
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true }
    });

    if (!user || user.credits < cost) {
      return new NextResponse(
        `Insufficient credits. This generation costs ${cost} credits but you only have ${user?.credits ?? 0}.`,
        { status: 400 }
      );
    }

    if (!prompt) {
      return new NextResponse("Missing prompt", { status: 400 });
    }

    const hasImages = (imagesList && imagesList.length > 0) || imageUrl;
    if (!hasImages) {
      return new NextResponse("Missing input image for video generation", { status: 400 });
    }

    const creation = await AIService.generateVideo(session.user.id, {
      model,
      prompt,
      imageUrl,
      lastImageUrl,
      imagesList,
      aspectRatio,
      duration,
      resolution,
      mode,
      generateAudio
    });

    return NextResponse.json(creation);
  } catch (error) {
    console.error("[GENERATE_VIDEO_ERROR]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
