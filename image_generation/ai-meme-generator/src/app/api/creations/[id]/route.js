import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return new NextResponse("Missing ID", { status: 400 });
    }

    // Verify ownership
    const creation = await prisma.creation.findUnique({
      where: { id },
    });

    if (!creation || creation.userId !== session.user.id) {
      return new NextResponse("Unauthorized or Not Found", { status: 404 });
    }

    await prisma.creation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CREATION_DELETE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
