import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AIService } from "@/lib/services/ai";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get("requestId");

    if (requestId) {
      const statusData = await AIService.checkStatus(requestId, session.user.id);
      return NextResponse.json(statusData);
    }

    const creations = await prisma.creation.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(creations);
  } catch (error) {
    console.error("[CREATIONS_GET_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
