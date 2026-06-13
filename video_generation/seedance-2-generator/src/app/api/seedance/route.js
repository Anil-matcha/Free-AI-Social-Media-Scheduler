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
    const { mode, prompt, aspect_ratio, resolution, duration, quality, model, images_list } = body;

    if (!prompt && mode === 'text-to-video') {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    let result;
    if (mode === "reference-to-video") {
      result = await AIService.edit(session.user.id, {
        mode,
        prompt,
        images_list,
        aspect_ratio,
        resolution,
        duration,
        quality,
        model
      });
    } else {
      result = await AIService.generate(session.user.id, {
        mode,
        prompt,
        aspect_ratio,
        resolution,
        duration,
        quality,
        model,
        images_list
      });
    }

    return NextResponse.json({
      ...result,
      metadata: { prompt, aspect_ratio, resolution }
    });
  } catch (error) {
    if (error.message === "Insufficient credits") {
      return new NextResponse("Insufficient credits", { status: 403 });
    }
    console.error("[AI_SEEDANCE]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
