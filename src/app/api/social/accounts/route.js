import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import config from "@/lib/config";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const apiKey = config.ai.apiKey;
    if (!apiKey) {
      return NextResponse.json({ error: "MUAPIAPP_API_KEY is not configured" }, { status: 500 });
    }

    const email = session.user.email;
    const accounts = [];

    // 1. Fetch YouTube accounts connected via external flow
    try {
      const extRes = await fetch(`https://api.muapi.ai/api/v1/social/ext/accounts?external_user_id=${encodeURIComponent(email)}`, {
        headers: { "x-api-key": apiKey }
      });
      if (extRes.ok) {
        const extAccounts = await extRes.json();
        extAccounts.forEach(acc => {
          accounts.push({
            id: acc.id,
            platform: 1, // YouTube
            platform_name: "youtube",
            account_name: acc.account_name || "YouTube Channel",
            platform_user_id: acc.platform_user_id,
            connected_at: acc.connected_at
          });
        });
      }
    } catch (err) {
      console.error("Failed to fetch external accounts:", err);
    }

    // 2. Fetch first-party accounts (connected under the developer's key, e.g. TikTok)
    try {
      const devRes = await fetch("https://api.muapi.ai/api/social/accounts", {
        headers: { "x-api-key": apiKey }
      });
      if (devRes.ok) {
        const devAccounts = await devRes.json();
        devAccounts.forEach(acc => {
          // If it's TikTok, include it
          if (acc.platform === 2 || acc.platform_name === "tiktok") {
            accounts.push({
              id: acc.id,
              platform: 2, // TikTok
              platform_name: "tiktok",
              account_name: acc.account_name || "TikTok Account",
              platform_user_id: acc.platform_user_id,
              connected_at: acc.connected_at
            });
          }
        });
      }
    } catch (err) {
      console.error("Failed to fetch developer accounts:", err);
    }

    return NextResponse.json(accounts);
  } catch (error) {
    console.error("[GET_ACCOUNTS_ERROR]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
