import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";
import { UserService } from "../../../../../lib/services/user";
import config from "../../../../../lib/config";

export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const sources = await prisma.source.findMany({
      where: {
        knowledgeBaseId: id,
        knowledgeBase: { userId: session.user.id }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(sources);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { type, name, content } = await req.json();

    if (!type || !name || !content || content.trim() === "") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify KB ownership
    const kb = await prisma.knowledgeBase.findFirst({
      where: { id, userId: session.user.id }
    });
    if (!kb) {
      return NextResponse.json({ error: "Knowledge base not found" }, { status: 404 });
    }

    const cost = config.ai.sourceTrainingCost;

    // Deduct credits
    try {
      await UserService.deductCredits(session.user.id, cost);
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 402 });
    }

    const source = await prisma.source.create({
      data: {
        knowledgeBaseId: id,
        type,
        name: name.trim(),
        content: content.trim(),
      }
    });

    return NextResponse.json(source);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const sourceId = url.searchParams.get("sourceId");

    if (!sourceId) {
      return NextResponse.json({ error: "Source ID is required" }, { status: 400 });
    }

    // Verify ownership and delete
    const source = await prisma.source.findFirst({
      where: {
        id: sourceId,
        knowledgeBase: { userId: session.user.id }
      }
    });

    if (!source) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    await prisma.source.delete({ where: { id: sourceId } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
