import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import config from "@/lib/config";
import { SocialAccountStore, PLATFORMS_CONFIG } from "@/lib/integrations/social-manager";

const PLATFORM_ID_MAP = {
  youtube: 1,
  tiktok: 2,
  instagram: 3,
  x: 4,
  x_twitter: 4,
  twitter: 4,
  facebook: 5,
  linkedin: 6,
  threads: 7,
  pinterest: 8
};

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const apiKey = config.ai.apiKey;
    const email = session.user.email;
    const accounts = [];
    const seenIds = new Set();

    if (apiKey) {
      // 1. Fetch all accounts connected on behalf of the end-user (YouTube, TikTok, Instagram, Facebook, X, LinkedIn, Threads, Pinterest)
      try {
        const extRes = await fetch(`https://api.muapi.ai/api/v1/social/ext/accounts?external_user_id=${encodeURIComponent(email)}`, {
          headers: { "x-api-key": apiKey }
        });
        if (extRes.ok) {
          const extAccounts = await extRes.json();
          if (Array.isArray(extAccounts)) {
            extAccounts.forEach(acc => {
              const rawPlat = (acc.platform_name || "").toLowerCase();
              const platName = rawPlat === "x" || rawPlat === "twitter" ? "x_twitter" : rawPlat;
              const platId = PLATFORM_ID_MAP[platName] || acc.platform || 99;
              
              if (!seenIds.has(acc.id)) {
                seenIds.add(acc.id);
                accounts.push({
                  id: acc.id,
                  platform: platId,
                  platform_name: platName,
                  account_name: acc.account_name || `${PLATFORMS_CONFIG[platName]?.name || platName} Account`,
                  platform_user_id: acc.platform_user_id,
                  connected_at: acc.connected_at
                });
              }
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch external accounts:", err);
      }

      // 2. Fetch first-party accounts (connected under the developer's key)
      try {
        const devRes = await fetch("https://muapi.ai/api/social/accounts", {
          headers: { "x-api-key": apiKey }
        });
        if (devRes.ok) {
          const devAccounts = await devRes.json();
          if (Array.isArray(devAccounts)) {
            devAccounts.forEach(acc => {
              const rawPlat = (acc.platform_name || "").toLowerCase();
              const platName = rawPlat === "x" || rawPlat === "twitter" ? "x_twitter" : rawPlat;
              const platId = PLATFORM_ID_MAP[platName] || acc.platform || 99;
              
              if (!seenIds.has(acc.id)) {
                seenIds.add(acc.id);
                accounts.push({
                  id: acc.id,
                  platform: platId,
                  platform_name: platName,
                  account_name: acc.account_name || `${PLATFORMS_CONFIG[platName]?.name || platName} Account`,
                  platform_user_id: acc.platform_user_id,
                  connected_at: acc.connected_at
                });
              }
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch developer accounts:", err);
      }
    }

    // 3. If no remote accounts found, provide the local SocialAccountStore accounts
    if (accounts.length === 0) {
      const fallback = SocialAccountStore.getAll();
      return NextResponse.json(fallback);
    }

    return NextResponse.json(accounts);
  } catch (error) {
    console.error("[GET_ACCOUNTS_ERROR]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
