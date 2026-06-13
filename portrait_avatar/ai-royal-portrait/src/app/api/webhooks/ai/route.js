import { NextResponse } from "next/server";
import { AIService } from "@/lib/services/ai";

export async function POST(req) {
  try {
    const data = await req.json();
    const requestId = data.id || data.request_id;

    if (!requestId) return NextResponse.json({ error: "Missing request_id" }, { status: 400 });

    const result = await AIService.processResult(requestId, data);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("[WEBHOOK_AI_ERROR]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
