import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  try {
    const data = await req.json();
    const requestId = data.id || data.request_id;

    if (!requestId) {
      console.error("[MUAPI_WEBHOOK_ERROR] Missing request id in payload", data);
      return NextResponse.json({ error: "Missing request id" }, { status: 400 });
    }

    const creation = await prisma.makeupCreation.findFirst({ where: { requestId } });
    if (!creation) {
      console.warn(`[MUAPI_WEBHOOK_WARN] Creation not found for request ID: ${requestId}`);
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (data.error || data.status === "failed" || data.state === "failed") {
      await prisma.makeupCreation.update({
        where: { id: creation.id },
        data: { status: "failed" }
      });
      console.log(`[MUAPI_WEBHOOK] Updated creation ${creation.id} to failed`);
    } else {
      const outputs = data.outputs || [];
      const imageUrl = outputs[0] || (typeof data.output === 'string' ? data.output : data.output?.urls?.get);

      if (imageUrl) {
        await prisma.makeupCreation.update({
          where: { id: creation.id },
          data: {
            status: "completed",
            resultImage: imageUrl
          }
        });
        console.log(`[MUAPI_WEBHOOK] Updated creation ${creation.id} to completed`);
      } else {
        console.warn(`[MUAPI_WEBHOOK_WARN] No output URL found in webhook payload for request ${requestId}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[MUAPI_WEBHOOK_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
