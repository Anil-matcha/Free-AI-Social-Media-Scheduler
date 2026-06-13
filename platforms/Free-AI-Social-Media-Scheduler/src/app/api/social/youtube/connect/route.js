import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import config from "@/lib/config";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { redirectUrl } = await req.json();
    const apiKey = config.ai.apiKey;

    if (!apiKey) {
      return NextResponse.json({ error: "MUAPIAPP_API_KEY is not configured" }, { status: 500 });
    }

    // Call MuAPI to generate the connect URL
    const extUserId = session.user.email;
    const res = await fetch("https://api.muapi.ai/api/v1/social/youtube/connect-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey
      },
      body: JSON.stringify({
        external_user_id: extUserId,
        redirect_to: redirectUrl || `${config.auth.url}/integrations`
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `Failed to fetch connect URL: ${errText}` }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({ url: data.url });
  } catch (error) {
    console.error("[YOUTUBE_CONNECT_ERROR]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
