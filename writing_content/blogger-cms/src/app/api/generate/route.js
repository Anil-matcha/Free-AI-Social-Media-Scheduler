import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { AIService } from "@/lib/services/ai";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { groupId, keyword, blogTopic } = await req.json();

    if (!groupId) {
      return new NextResponse("Group ID is required", { status: 400 });
    }
    if (!keyword || !blogTopic) {
      return new NextResponse("Keyword and Blog Topic are required", { status: 400 });
    }

    const blogPost = await AIService.generateBlog(session.user.id, {
      groupId,
      keyword,
      blogTopic,
    });

    return NextResponse.json(blogPost);
  } catch (error) {
    console.error("[GENERATE_BLOG]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
