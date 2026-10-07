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

    const creation = await prisma.creation.findUnique({
      where: { requestId }
    });

    if (!creation) {
      console.warn(`[MUAPI_WEBHOOK] Creation with requestId ${requestId} not found.`);
      return NextResponse.json({ error: "Creation not found" }, { status: 404 });
    }

    if (data.error && data.error !== "") {
      await prisma.creation.update({
        where: { id: creation.id },
        data: {
          status: "failed",
          error: data.error
        }
      });
    } else {
      let mediaUrls = [];
      
      // MuAPI might return url, video_url or an outputs array depending on the endpoint
      if (data.outputs && Array.isArray(data.outputs)) {
        mediaUrls = data.outputs;
      } else if (data.url) {
        mediaUrls = [data.url];
      } else if (data.video_url) {
        mediaUrls = [data.video_url];
      } else if (data.download_url) {
        mediaUrls = [data.download_url];
      }

      await prisma.creation.update({
        where: { id: creation.id },
        data: {
          status: "completed",
          resultUrl: JSON.stringify(mediaUrls),
        }
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[MUAPI_WEBHOOK_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
