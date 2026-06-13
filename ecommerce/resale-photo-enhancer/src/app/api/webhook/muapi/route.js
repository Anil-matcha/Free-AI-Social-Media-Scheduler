import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  try {
    const data = await req.json();
    const requestId = data.id;

    if (!requestId) {
      console.error("[MUAPI_WEBHOOK_ERROR] Missing request id in payload", data);
      return NextResponse.json({ error: "Missing request id" }, { status: 400 });
    }

    const enhancement = await prisma.enhancement.findUnique({
      where: { requestId }
    });

    if (!enhancement) {
      console.warn(`[MUAPI_WEBHOOK] Enhancement with requestId ${requestId} not found.`);
      return NextResponse.json({ error: "Enhancement not found" }, { status: 404 });
    }

    if (data.error && data.error !== "") {
      await prisma.enhancement.update({
        where: { id: enhancement.id },
        data: {
          status: "failed",
          error: data.error
        }
      });
      
      // Refund credits
      await prisma.user.update({
        where: { id: enhancement.userId },
        data: {
          credits: {
            increment: 1
          }
        }
      });
    } else {
      const outputs = data.outputs || [];
      const outputUrl = outputs[0] || null;

      if (outputUrl) {
        await prisma.enhancement.update({
          where: { id: enhancement.id },
          data: {
            status: "completed",
            outputUrl: outputUrl,
          }
        });
      } else {
        console.warn("[MUAPI_WEBHOOK] No output URL received in payload", data);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[MUAPI_WEBHOOK_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
