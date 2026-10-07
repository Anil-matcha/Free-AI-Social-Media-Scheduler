import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AIService } from "@/lib/services/ai";
import config from "@/lib/config";

// GET — list creations or poll a specific requestId
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get("requestId");

    if (requestId) {
      const statusData = await AIService.checkStatus(requestId);
      return NextResponse.json(statusData);
    }

    const creations = await prisma.emailCreation.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    // Self-healing: sync any still-processing items on the fly
    const updated = await Promise.all(
      creations.map(async (c) => {
        if (c.status === "processing" && c.requestId) {
          try {
            await AIService.checkStatus(c.requestId);
            return (
              (await prisma.emailCreation.findUnique({
                where: { id: c.id },
              })) || c
            );
          } catch {
            return c;
          }
        }
        return c;
      })
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[CREATIONS_GET_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST — submit a new email generation
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const { prompt, recipient, toneId, lengthId, languageId, includeCta, suggestSubjects } = await req.json();

    if (!prompt || prompt.trim() === "") {
      return new NextResponse("Missing email prompt or topic", { status: 400 });
    }
    if (!recipient || recipient.trim() === "") {
      return new NextResponse("Missing target recipient", { status: 400 });
    }

    const cost = config.ai.model.creditCost; // 4 credits
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true },
    });

    if (!user || user.credits < cost) {
      return new NextResponse(
        `Insufficient credits. Required: ${cost}, balance: ${user?.credits ?? 0}`,
        { status: 400 }
      );
    }

    const creation = await AIService.generateEmail(session.user.id, {
      prompt,
      recipient,
      toneId,
      lengthId,
      languageId: languageId || "english",
      includeCta: includeCta !== false,
      suggestSubjects: suggestSubjects !== false,
    });

    return NextResponse.json(creation);
  } catch (error) {
    console.error("[CREATIONS_POST_ERROR]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
