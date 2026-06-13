import { NextResponse } from "next/server";
import { AIService } from "@/lib/services/ai";

export async function POST(req) {
  try {
    const { video_url, num_highlights } = await req.json();

    if (!video_url) {
      return NextResponse.json({ cost: 0 });
    }

    const cost = await AIService.calculateClippingCost(video_url, num_highlights);

    return NextResponse.json({ cost });
  } catch (error) {
    console.error("[CALCULATE_COST_ERROR]", error);
    return NextResponse.json({ error: "Failed to calculate cost" }, { status: 500 });
  }
}
