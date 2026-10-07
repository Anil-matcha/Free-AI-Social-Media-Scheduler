import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  try {
    const data = await req.json();
    const requestId = data.id || data.request_id;

    if (!requestId) {
      return NextResponse.json({ error: "Missing request_id" }, { status: 400 });
    }

    const record = await prisma.watermarkRemoval.findFirst({
      where: { requestId },
    });

    if (!record) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (data.error) {
      await prisma.watermarkRemoval.update({
        where: { id: record.id },
        data: { status: "failed" },
      });
    } else {
      const outputs = data.outputs || [];
      const imageUrl = outputs[0] || data.output;
      if (imageUrl) {
        await prisma.watermarkRemoval.update({
          where: { id: record.id },
          data: { status: "completed", resultImage: imageUrl },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[WEBHOOK_MUAPI]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
