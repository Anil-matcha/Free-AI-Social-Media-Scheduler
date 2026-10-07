import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AIService } from "@/lib/services/ai";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const appId = searchParams.get("appId");
    const userId = session.user.id;

    // Filter by appId if provided
    const queryConditions = { userId };
    if (appId) {
      queryConditions.appId = appId;
    }

    // 1. Fetch user's creations
    const creations = await prisma.creation.findMany({
      where: queryConditions,
      include: {
        app: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 2. Scan for and sync active "processing" tasks
    const syncedCreations = await Promise.all(
      creations.map(async (creation) => {
        if (creation.status === "processing") {
          return await AIService.syncStatus(creation.id);
        }
        return creation;
      })
    );

    return NextResponse.json(syncedCreations);
  } catch (error) {
    console.error("Creations GET handler error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
