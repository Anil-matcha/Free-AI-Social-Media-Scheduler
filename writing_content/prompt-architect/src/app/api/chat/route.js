import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AIService } from "@/lib/services/ai";
import config from "@/lib/config";

// GET — list sessions or fetch messages for a specific session
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const checkRequestId = searchParams.get("requestId");

    // Case 1: Check active polling status for a single request
    if (checkRequestId) {
      const statusData = await AIService.checkStatus(checkRequestId);
      return NextResponse.json(statusData);
    }

    // Case 2: Fetch messages for a specific session
    if (sessionId) {
      const messages = await prisma.promptMessage.findMany({
        where: { sessionId },
        orderBy: { createdAt: "asc" },
      });

      // Self-healing: sync any still-processing messages on the fly
      const updatedMessages = await Promise.all(
        messages.map(async (msg) => {
          if (msg.status === "processing" && msg.requestId) {
            try {
              const res = await AIService.checkStatus(msg.requestId);
              if (res && res.message) {
                return res.message;
              }
            } catch (err) {
              console.error("[SELF_HEALING_SYNC_ERROR]", err);
            }
          }
          return msg;
        })
      );

      return NextResponse.json(updatedMessages);
    }

    // Case 3: List all sessions for this user
    const sessions = await prisma.promptSession.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("[CHAT_GET_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST — submit a new user message / spawn refinement loop
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const { message, sessionId, targetModel, promptStyle, mode, generatorModel } = await req.json();

    if (!message || message.trim() === "") {
      return new NextResponse("Message content is required", { status: 400 });
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

    let activeSessionId = sessionId;

    // Create a new session if none provided
    if (!activeSessionId) {
      const derivedTitle = message.substring(0, 30).trim() + (message.length > 30 ? "..." : "");
      const newSession = await prisma.promptSession.create({
        data: {
          userId: session.user.id,
          title: derivedTitle || "New Prompt Architect Chat",
        }
      });
      activeSessionId = newSession.id;
    }

    // Start generation refinement pipeline
    const assistantMessage = await AIService.generatePromptRefinement(
      session.user.id,
      activeSessionId,
      message,
      targetModel || "chatgpt",
      promptStyle || "professional",
      mode || "refinement",
      generatorModel || "google/gemini-2.5-flash"
    );

    // Touch the session to update its updatedAt field
    await prisma.promptSession.update({
      where: { id: activeSessionId },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json({
      sessionId: activeSessionId,
      message: assistantMessage,
    });
  } catch (error) {
    console.error("[CHAT_POST_ERROR]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}

// DELETE — delete a specific chat session
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return new NextResponse("Session ID is required", { status: 400 });
    }

    // Ensure session belongs to user
    const dbSession = await prisma.promptSession.findUnique({
      where: { id: sessionId },
    });

    if (!dbSession || dbSession.userId !== session.user.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    await prisma.promptSession.delete({
      where: { id: sessionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CHAT_DELETE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
