import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  try {
    const data = await req.json();
    const requestId = data.id || data.request_id;

    if (!requestId) {
      return NextResponse.json({ error: "Missing request_id" }, { status: 400 });
    }

    const record = await prisma.kidAdultPrediction.findFirst({
      where: { requestId },
    });

    if (!record) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (data.error) {
      await prisma.kidAdultPrediction.update({
        where: { id: record.id },
        data: { status: "failed" },
      });
    } else {
      const outputs = data.outputs || [];
      const imageUrl =
        outputs[0] ||
        (typeof data.output === "string"
          ? data.output
          : data.output?.urls?.get || data.output?.image_url);
      if (imageUrl) {
        await prisma.kidAdultPrediction.update({
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
