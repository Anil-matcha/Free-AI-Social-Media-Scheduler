import { NextResponse } from "next/server";
import { AIService } from "@/lib/services/ai";

export async function POST(req) {
  try {
    const result = await req.json();
    const requestId = result.request_id || result.id;

    if (!requestId) {
      return new NextResponse("Missing requestId", { status: 400 });
    }

    console.log(`[AI_WEBHOOK] Received for ${requestId}`, result.status || result.state);

    await AIService.processResult(requestId, result);

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("[AI_WEBHOOK_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
