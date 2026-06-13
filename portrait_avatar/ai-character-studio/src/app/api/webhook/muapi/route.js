import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserService } from "@/lib/services/user";

export async function POST(req) {
  try {
    const data = await req.json();
    const requestId = data.id || data.request_id;

    if (!requestId) {
      return NextResponse.json({ error: "Missing prediction identifier" }, { status: 400 });
    }

    const creation = await prisma.creation.findFirst({
      where: { requestId },
    });

    if (!creation) {
      return NextResponse.json({ error: "Creation record not found" }, { status: 404 });
    }

    // Skip processing if already finished
    if (creation.status === "completed" || creation.status === "failed") {
      return NextResponse.json({ success: true, message: "Already processed" });
    }

    if (data.error || data.status === "failed") {
      const errorMsg = data.error || "Async prediction failed";
      
      // Update record to failed
      await prisma.creation.update({
        where: { id: creation.id },
        data: { status: "failed", error: errorMsg },
      });

      // Refund user credits
      await UserService.addCredits(creation.userId, creation.creditCost);
      
      return NextResponse.json({ success: true, status: "failed_refunded" });
    } else {
      const outputs = data.outputs || [];
      const imageUrl = outputs[0] || data.output;

      if (!imageUrl) {
        return NextResponse.json({ error: "No output URL provided" }, { status: 400 });
      }

      await prisma.creation.update({
        where: { id: creation.id },
        data: {
          status: "completed",
          resultImage: imageUrl,
        },
      });

      return NextResponse.json({ success: true, status: "completed" });
    }
  } catch (error) {
    console.error("MUAPI webhook processing error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
