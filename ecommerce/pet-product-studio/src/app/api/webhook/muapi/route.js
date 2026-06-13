import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AIService } from "@/lib/services/ai";

export async function POST(req) {
  try {
    const data = await req.json();
    const requestId = data.id;

    if (!requestId) {
      console.error("[MUAPI_WEBHOOK_ERROR] Missing request id in payload", data);
      return NextResponse.json({ error: "Missing request id" }, { status: 400 });
    }

    const petCreation = await prisma.petCreation.findUnique({
      where: { requestId }
    });

    if (!petCreation) {
      console.warn(`[MUAPI_WEBHOOK] PetCreation with requestId ${requestId} not found.`);
      return NextResponse.json({ error: "PetCreation not found" }, { status: 404 });
    }

    if (data.error && data.error !== "") {
      await prisma.petCreation.update({
        where: { id: petCreation.id },
        data: {
          status: "failed",
          error: data.error
        }
      });
      
      // Refund credits (12 credits)
      const cost = AIService.getCreditCost();
      await prisma.user.update({
        where: { id: petCreation.userId },
        data: {
          credits: {
            increment: cost
          }
        }
      });
    } else {
      const outputs = data.outputs || [];
      const outputUrl = outputs[0] || null;

      if (outputUrl) {
        await prisma.petCreation.update({
          where: { id: petCreation.id },
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
