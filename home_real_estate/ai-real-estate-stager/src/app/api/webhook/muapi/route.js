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

    const room = await prisma.stagedRoom.findFirst({
      where: { requestId }
    });

    if (!room) {
      console.warn(`[MUAPI_WEBHOOK] Staged room with requestId ${requestId} not found.`);
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (data.error && data.error !== "") {
      await prisma.stagedRoom.update({
        where: { id: room.id },
        data: {
          status: "failed"
        }
      });
    } else {
      const outputs = data.outputs || [];
      const imageUrl = outputs.length > 0 ? outputs[0] : (typeof data.output === "string" ? data.output : data.output?.urls?.get);

      if (imageUrl) {
        await prisma.stagedRoom.update({
          where: { id: room.id },
          data: {
            status: "completed",
            stagedImage: imageUrl
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
