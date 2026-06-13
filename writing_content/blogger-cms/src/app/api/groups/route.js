import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const groups = await prisma.blogGroup.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { blogs: true }
        }
      }
    });

    return NextResponse.json(groups);
  } catch (error) {
    console.error("[GROUPS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { name } = await req.json();
    if (!name || !name.trim()) {
      return new NextResponse("Group name is required", { status: 400 });
    }

    const group = await prisma.blogGroup.create({
      data: {
        name: name.trim(),
        userId: session.user.id
      }
    });

    return NextResponse.json(group);
  } catch (error) {
    console.error("[GROUPS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
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
      return new NextResponse("Missing group ID", { status: 400 });
    }

    // Verify ownership
    const group = await prisma.blogGroup.findFirst({
      where: { id, userId: session.user.id }
    });

    if (!group) {
      return new NextResponse("Not Found", { status: 404 });
    }

    await prisma.blogGroup.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[GROUPS_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
