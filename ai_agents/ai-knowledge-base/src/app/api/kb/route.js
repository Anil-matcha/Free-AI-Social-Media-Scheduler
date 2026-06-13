import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { UserService } from "../../../lib/services/user";
import config from "../../../lib/config";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bases = await prisma.knowledgeBase.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        sources: { select: { id: true, type: true, name: true, createdAt: true } },
      }
    });

    return NextResponse.json(bases);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description } = await req.json();
    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const cost = config.ai.kbCreationCost;

    // Deduct credits
    try {
      await UserService.deductCredits(session.user.id, cost);
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 402 });
    }

    const base = await prisma.knowledgeBase.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        description: description?.trim() || "",
      }
    });

    return NextResponse.json(base);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const kbId = url.searchParams.get("kbId");

    if (!kbId) {
      return NextResponse.json({ error: "Knowledge base ID is required" }, { status: 400 });
    }

    const kb = await prisma.knowledgeBase.findFirst({
      where: { id: kbId, userId: session.user.id }
    });

    if (!kb) {
      return NextResponse.json({ error: "Knowledge base not found" }, { status: 404 });
    }

    await prisma.knowledgeBase.delete({ where: { id: kbId } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

