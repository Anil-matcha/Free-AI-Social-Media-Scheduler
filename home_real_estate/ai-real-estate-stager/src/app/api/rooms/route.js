import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const room = await prisma.stagedRoom.findFirst({
        where: { id, userId: session.user.id }
      });
      if (!room) {
        return new NextResponse("Not Found", { status: 404 });
      }
      return NextResponse.json(room);
    }

    const rooms = await prisma.stagedRoom.findMany({
      where: { userId: session.user.id },
      orderBy: { createTime: "desc" }
    });

    return NextResponse.json(rooms);
  } catch (error) {
    console.error("[ROOMS_GET]", error);
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
      return new NextResponse("Missing room ID", { status: 400 });
    }

    const room = await prisma.stagedRoom.findFirst({
      where: { id, userId: session.user.id }
    });

    if (!room) {
      return new NextResponse("Not Found", { status: 404 });
    }

    await prisma.stagedRoom.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ROOMS_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
