import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE: Delete or Cancel a post
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;
    const post = await prisma.scheduledPost.findUnique({
      where: { id }
    });

    if (!post || post.userId !== session.user.id) {
      return new NextResponse("Post not found", { status: 404 });
    }

    if (post.status === "processing") {
      return NextResponse.json({ error: "Cannot delete a post that is currently uploading." }, { status: 400 });
    }

    // Delete post
    await prisma.scheduledPost.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Post deleted" });
  } catch (error) {
    console.error("[DELETE_POST_ERROR]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// PATCH: Reschedule or Retry a post
export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    const post = await prisma.scheduledPost.findUnique({
      where: { id }
    });

    if (!post || post.userId !== session.user.id) {
      return new NextResponse("Post not found", { status: 404 });
    }

    if (post.status === "processing") {
      return NextResponse.json({ error: "Cannot modify a post that is currently uploading." }, { status: 400 });
    }

    const updateData = {};

    if (body.scheduledAt) {
      updateData.scheduledAt = new Date(body.scheduledAt);
      updateData.status = "scheduled";
      updateData.error = null;
    }

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.privacy !== undefined) updateData.privacy = body.privacy;

    const updatedPost = await prisma.scheduledPost.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error("[PATCH_POST_ERROR]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
