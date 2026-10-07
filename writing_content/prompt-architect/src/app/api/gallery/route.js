import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    // Fetch all assistant messages that are marked as final prompt and are completed
    const finalPrompts = await prisma.promptMessage.findMany({
      where: {
        role: "assistant",
        isFinalPrompt: true,
        status: "completed",
        session: {
          userId: session.user.id,
        },
      },
      include: {
        session: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(finalPrompts);
  } catch (error) {
    console.error("[GALLERY_GET_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
