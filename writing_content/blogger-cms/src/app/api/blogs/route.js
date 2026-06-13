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

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const groupId = searchParams.get("groupId");

    if (id) {
      const blog = await prisma.blogPost.findFirst({
        where: { id, userId: session.user.id }
      });
      if (!blog) {
        return new NextResponse("Not Found", { status: 404 });
      }
      return NextResponse.json(blog);
    }

    if (groupId) {
      const blogs = await prisma.blogPost.findMany({
        where: { groupId, userId: session.user.id },
        orderBy: { createTime: "desc" }
      });
      return NextResponse.json(blogs);
    }

    const blogs = await prisma.blogPost.findMany({
      where: { userId: session.user.id },
      orderBy: { createTime: "desc" }
    });

    return NextResponse.json(blogs);
  } catch (error) {
    console.error("[BLOGS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const {
      id,
      groupId,
      title,
      content,
      author,
      coverImage,
      status,
      seoTitle,
      seoDescription,
      seoKeywords,
      canonicalUrl,
      keyword,
      blogTopic,
    } = body;

    if (!groupId) {
      return new NextResponse("Group ID is required", { status: 400 });
    }

    if (!title || !title.trim()) {
      return new NextResponse("Title is required", { status: 400 });
    }

    const now = new Date();
    const cleanData = {
      title: title.trim(),
      content: content || "",
      author: (author || "").trim() || session.user.name || "Anonymous",
      coverImage: coverImage || null,
      status: status || "draft",
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
      seoKeywords: seoKeywords || null,
      canonicalUrl: canonicalUrl || null,
      keyword: keyword || null,
      blogTopic: blogTopic || null,
      groupId,
      updateTime: now,
    };

    if (status === "published") {
      cleanData.publishTime = now;
    }

    if (id) {
      // Update existing
      const existing = await prisma.blogPost.findFirst({
        where: { id, userId: session.user.id }
      });

      if (!existing) {
        return new NextResponse("Not Found", { status: 404 });
      }

      const updated = await prisma.blogPost.update({
        where: { id },
        data: cleanData
      });

      return NextResponse.json(updated);
    } else {
      // Create new
      cleanData.userId = session.user.id;
      cleanData.createTime = now;

      const created = await prisma.blogPost.create({
        data: cleanData
      });

      return NextResponse.json(created);
    }
  } catch (error) {
    console.error("[BLOGS_POST]", error);
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
      return new NextResponse("Missing blog ID", { status: 400 });
    }

    const blog = await prisma.blogPost.findFirst({
      where: { id, userId: session.user.id }
    });

    if (!blog) {
      return new NextResponse("Not Found", { status: 404 });
    }

    await prisma.blogPost.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[BLOGS_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
