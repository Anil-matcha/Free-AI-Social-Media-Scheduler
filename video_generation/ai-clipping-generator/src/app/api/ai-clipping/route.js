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
    const { video_url, num_highlights, aspect_ratio } = body;

    if (!video_url) {
      return NextResponse.json({ error: "Video URL is required" }, { status: 400 });
    }

    const result = await AIService.aiClipping(session.user.id, {
      video_url,
      num_highlights,
      aspect_ratio,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error.message === "Insufficient credits") {
      return new NextResponse("Insufficient credits", { status: 403 });
    }
    console.error("[AI_CLIPPING]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
