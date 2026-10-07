import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function POST(req) {
  try {
    const data = await req.json();
    const requestId = data.id || data.request_id;

    if (!requestId) {
      console.error("[MUAPI_WEBHOOK_ERROR] Missing request id in webhook payload", data);
      return NextResponse.json({ error: "Missing request id" }, { status: 400 });
    }

    const tryon = await prisma.tryOn.findFirst({
      where: { requestId }
    });

    if (!tryon) {
      console.warn(`[MUAPI_WEBHOOK] TryOn with requestId ${requestId} not found.`);
      return NextResponse.json({ error: "TryOn not found" }, { status: 404 });
    }

    if (data.error && data.error !== "") {
      await prisma.tryOn.update({
        where: { id: tryon.id },
        data: {
          status: "failed"
        }
      });
    } else {
      const outputs = data.outputs || [];
      const imageUrl = outputs.length > 0 ? outputs[0] : (typeof data.output === "string" ? data.output : data.output?.urls?.get);

      if (imageUrl) {
        await prisma.tryOn.update({
          where: { id: tryon.id },
          data: {
            status: "completed",
            resultImage: imageUrl
          }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[MUAPI_WEBHOOK_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
