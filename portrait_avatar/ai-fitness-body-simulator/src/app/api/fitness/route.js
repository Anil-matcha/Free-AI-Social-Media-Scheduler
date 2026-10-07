import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { AIService } from "@/lib/services/ai";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { prompt, inputImage, aspectRatio, resolution } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    if (!inputImage) {
      return NextResponse.json({ error: "Input image is required" }, { status: 400 });
    }

    // Call AIService.edit
    const result = await AIService.edit(session.user.id, {
      prompt,
      inputImage,
      aspectRatio,
      resolution,
    });

    return NextResponse.json({
      ...result,
      metadata: { prompt, aspectRatio, resolution }
    });
  } catch (error) {
    if (error.message === "Insufficient credits") {
      return new NextResponse("Insufficient credits", { status: 403 });
    }
    console.error("[AI_FITNESS_ERROR]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
