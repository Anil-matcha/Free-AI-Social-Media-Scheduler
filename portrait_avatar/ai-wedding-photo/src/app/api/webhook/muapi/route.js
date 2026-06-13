import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  try {
    const data = await req.json();
    const requestId = data.id || data.request_id;

    if (!requestId) {
      return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
    }

    const creation = await prisma.weddingPhotoCreation.findFirst({ where: { requestId } });
    if (!creation) {
      return NextResponse.json({ error: "Creation not found" }, { status: 404 });
    }

    if (data.error || data.status === "failed" || data.status === "cancelled") {
      await prisma.weddingPhotoCreation.update({
        where: { id: creation.id },
        data: { status: "failed" },
      });
    } else {
      const outputs = data.outputs || [];
      // nano-banana-pro-edit returns image URL in outputs[0] or data.video
      const imageUrl =
        outputs[0] ||
        (data.output ? data.output[0] : "") ||
        data.video ||
        "";
      if (imageUrl) {
        await prisma.weddingPhotoCreation.update({
          where: { id: creation.id },
          data: {
            status: "completed",
            resultImage: imageUrl,
          },
        });
      } else {
        await prisma.weddingPhotoCreation.update({
          where: { id: creation.id },
          data: { status: "failed" },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[MUAPI_WEBHOOK_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
