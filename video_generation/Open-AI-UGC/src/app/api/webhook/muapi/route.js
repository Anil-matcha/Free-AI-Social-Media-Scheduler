import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  try {
    const data = await req.json();
    console.log("[MUAPI_WEBHOOK_RECEIVED]", data);

    const requestId = data.id || data.request_id;

    if (!requestId) {
      console.error("[MUAPI_WEBHOOK_ERROR] Missing request id in payload", data);
      return NextResponse.json({ error: "Missing request id" }, { status: 400 });
    }

    const creation = await prisma.creation.findUnique({
      where: { requestId }
    });

    if (!creation) {
      console.warn(`[MUAPI_WEBHOOK] Creation with requestId ${requestId} not found.`);
      return NextResponse.json({ error: "Creation not found" }, { status: 404 });
    }

    if (data.status === "failed" || (data.error && data.error !== "")) {
      await prisma.creation.update({
        where: { id: creation.id },
        data: {
          status: "failed",
          error: data.error || "Generation failed"
        }
      });
      console.log(`[MUAPI_WEBHOOK] Marked creation ${creation.id} as failed.`);
    } else if (data.status === "completed" || data.outputs) {
      const outputs = data.outputs || [];
      const videoUrl = outputs.length > 0 ? outputs[0] : null;

      await prisma.creation.update({
        where: { id: creation.id },
        data: {
          status: "completed",
          url: videoUrl
        }
      });
      console.log(`[MUAPI_WEBHOOK] Marked creation ${creation.id} as completed.`);
    } else {
      // Could be 'processing' or 'pending'
      await prisma.creation.update({
        where: { id: creation.id },
        data: {
          status: data.status || "processing"
        }
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[MUAPI_WEBHOOK_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
