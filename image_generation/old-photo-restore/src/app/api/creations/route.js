import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AIService } from "@/lib/services/ai";

// GET user restorations history or check status of a specific request
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get("requestId");

    // If requestId is passed, perform status check/polling fallback
    if (requestId) {
      const statusData = await AIService.checkStatus(requestId, session.user.id);
      return NextResponse.json(statusData);
    }

    // Otherwise, fetch all user restorations
    const restorations = await prisma.photoRestoration.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" }
    });

    // Automatically check and update status of any creations that are still processing
    const updatedRestorations = await Promise.all(
      restorations.map(async (r) => {
        if (r.status === "processing" && r.requestId) {
          try {
            await AIService.checkStatus(r.requestId, session.user.id);
            const refetched = await prisma.photoRestoration.findUnique({
              where: { id: r.id }
            });
            return refetched || r;
          } catch (e) {
            console.error(`Error updating status for creation ${r.id}:`, e);
            return r;
          }
        }
        return r;
      })
    );

    return NextResponse.json(updatedRestorations);
  } catch (error) {
    console.error("[RESTORATIONS_GET_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST new old photo restoration task
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check credits
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true }
    });

    const cost = AIService.getCreditCost();
    if (!user || user.credits < cost) {
      return new NextResponse(`Insufficient credits. Required: ${cost}`, { status: 400 });
    }

    const { inputUrl, prompt, mode } = await req.json();

    if (!inputUrl) {
      return new NextResponse("Missing inputUrl", { status: 400 });
    }
    if (!prompt) {
      return new NextResponse("Missing prompt", { status: 400 });
    }

    const restoration = await AIService.restore(session.user.id, {
      inputUrl,
      prompt,
      mode: mode || "full",
    });

    return NextResponse.json(restoration);
  } catch (error) {
    console.error("[RESTORATIONS_POST_ERROR]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return new NextResponse("Missing restoration ID", { status: 400 });
    }

    const restoration = await prisma.photoRestoration.findFirst({
      where: { id, userId: session.user.id }
    });

    if (!restoration) {
      return new NextResponse("Not Found", { status: 404 });
    }

    await prisma.photoRestoration.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[RESTORATIONS_DELETE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
