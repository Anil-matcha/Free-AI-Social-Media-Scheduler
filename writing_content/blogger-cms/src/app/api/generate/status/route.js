import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { AIService } from "@/lib/services/ai";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get("requestId");

    if (!requestId) {
      return new NextResponse("Missing requestId", { status: 400 });
    }

    const result = await AIService.checkStatus(requestId);
    if (!result) {
      return new NextResponse("Not Found", { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[GENERATE_STATUS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
