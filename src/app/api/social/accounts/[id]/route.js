import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import config from "@/lib/config";
import { SocialAccountStore } from "@/lib/integrations/social-manager";

// DELETE: Disconnect account
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;
    const apiKey = config.ai.apiKey;

    if (apiKey) {
      // Try external endpoint first, then first-party endpoint
      let res = await fetch(`https://api.muapi.ai/api/v1/social/ext/accounts/${id}`, {
        method: "DELETE",
        headers: { "x-api-key": apiKey }
      });

      if (!res.ok) {
        res = await fetch(`https://muapi.ai/api/social/accounts/${id}`, {
          method: "DELETE",
          headers: { "x-api-key": apiKey }
        });
      }

      if (res.ok) {
        SocialAccountStore.delete(id);
        return NextResponse.json({ success: true });
      }
    }

    // Fallback to local store
    SocialAccountStore.delete(id);
    return NextResponse.json({ success: true, local: true });
  } catch (error) {
    console.error("[DISCONNECT_ACCOUNT_ERROR]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// PATCH: Rename account
export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;
    const { accountName } = await req.json();
    const apiKey = config.ai.apiKey;

    if (apiKey) {
      // Try external endpoint first, then first-party endpoint
      let res = await fetch(`https://api.muapi.ai/api/v1/social/ext/accounts/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey
        },
        body: JSON.stringify({ account_name: accountName })
      });

      if (!res.ok) {
        res = await fetch(`https://muapi.ai/api/social/accounts/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey
          },
          body: JSON.stringify({ account_name: accountName })
        });
      }

      if (res.ok) {
        const data = await res.json();
        SocialAccountStore.update(id, { account_name: accountName });
        return NextResponse.json(data);
      }
    }

    // Fallback to local store
    const updated = SocialAccountStore.update(id, { account_name: accountName });
    return NextResponse.json(updated || { id, account_name: accountName });
  } catch (error) {
    console.error("[RENAME_ACCOUNT_ERROR]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

