import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatsList = await prisma.chat.findMany({
      where: { userId: session.user.id },
      include: { character: true },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ chats: chatsList });
  } catch (error) {
    console.error("[CHATS_GET_ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { character_id, forceNew } = await req.json();
    if (!character_id) {
      return NextResponse.json({ error: "Missing character ID" }, { status: 400 });
    }

    // Check if an active chat session already exists for this user and character
    let chat = null;
    if (!forceNew) {
      chat = await prisma.chat.findFirst({
        where: {
          userId: session.user.id,
          characterId: character_id
        },
        include: { character: true }
      });
    }

    // If no chat session, instantiate one
    if (!chat) {
      chat = await prisma.chat.create({
        data: {
          userId: session.user.id,
          characterId: character_id
        },
        include: { character: true }
      });
    }

    return NextResponse.json({ chat });
  } catch (error) {
    console.error("[CHATS_POST_ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
