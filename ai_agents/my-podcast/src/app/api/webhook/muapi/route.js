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

    const podcast = await prisma.podcastCreation.findFirst({
      where: { requestId }
    });

    if (!podcast) {
      console.warn(`[MUAPI_WEBHOOK] Podcast with requestId ${requestId} not found.`);
      return NextResponse.json({ error: "Podcast not found" }, { status: 404 });
    }

    if (data.error && data.error !== "") {
      await prisma.podcastCreation.update({
        where: { id: podcast.id },
        data: {
          status: "failed"
        }
      });
    } else {
      const outputs = data.outputs || [];
      const audioUrl = outputs.length > 0 ? outputs[0] : (typeof data.output === "string" ? data.output : data.output?.urls?.get || data.audio);

      if (audioUrl) {
        await prisma.podcastCreation.update({
          where: { id: podcast.id },
          data: {
            status: "completed",
            audioUrl: audioUrl
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
