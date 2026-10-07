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

    const { platform, accountName = "", redirectUrl } = await req.json();
    const apiKey = config.ai.apiKey;

    if (!apiKey) {
      return NextResponse.json({ error: "MUAPIAPP_API_KEY is not configured" }, { status: 500 });
    }

    const extUserId = session.user.email;
    const finalRedirect = redirectUrl || `${config.auth.url}/integrations`;
    const plat = (platform || "").toLowerCase().replace("x_twitter", "x").replace("twitter", "x");

    // 1. Check if platform has a dedicated developer connect-url endpoint in MuAPI (e.g. youtube, tiktok, instagram, facebook)
    const connectUrlPlatforms = ["youtube", "tiktok", "instagram", "facebook"];
    if (connectUrlPlatforms.includes(plat)) {
      try {
        const endpoint = `https://api.muapi.ai/api/v1/social/${plat}/connect-url`;
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey
          },
          body: JSON.stringify({
            external_user_id: extUserId,
            redirect_to: finalRedirect
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            return NextResponse.json({ url: data.url });
          }
        }
      } catch (err) {
        console.warn(`[CONNECT_URL_FALLBACK] Dedicated endpoint failed for ${plat}:`, err.message);
      }
    }

    // 2. For platforms like x, linkedin, threads, pinterest (or fallback for above):
    // Call MuAPI social connect endpoint server-side with the developer x-api-key.
    // MuAPI responds with HTTP 307 redirect whose Location header contains the OAuth URL.
    const encodedName = encodeURIComponent(accountName || `${plat.toUpperCase()} Account`);
    const encodedRedirect = encodeURIComponent(finalRedirect);
    const directUrl = `https://muapi.ai/api/social/${plat}/connect?account_name=${encodedName}&redirect_to=${encodedRedirect}`;

    try {
      const authRes = await fetch(directUrl, {
        method: "GET",
        headers: {
          "x-api-key": apiKey
        },
        redirect: "manual"
      });

      const redirectLocation = authRes.headers.get("location");
      if (redirectLocation) {
        return NextResponse.json({ url: redirectLocation });
      }

      // If status is 200 and has url in json
      if (authRes.ok) {
        const text = await authRes.text();
        try {
          const json = JSON.parse(text);
          if (json.url) return NextResponse.json({ url: json.url });
        } catch (_) {}
      }

      const errText = await authRes.text().catch(() => "");
      console.error(`[CONNECT_ERROR] ${plat} connect returned status ${authRes.status}:`, errText);
      return NextResponse.json(
        { error: `Failed to initiate ${plat} connection (${authRes.status}): ${errText || "Authorization failed"}` },
        { status: authRes.status >= 400 ? authRes.status : 500 }
      );
    } catch (err) {
      console.error(`[CONNECT_ERROR] Error fetching auth url for ${plat}:`, err);
      return NextResponse.json({ error: `Connection failed: ${err.message}` }, { status: 500 });
    }
  } catch (error) {
    console.error("[SOCIAL_CONNECT_ERROR]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
