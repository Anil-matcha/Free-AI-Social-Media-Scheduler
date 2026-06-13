import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import config from "@/lib/config";

// DELETE: Disconnect account
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;
    const apiKey = config.ai.apiKey;

    if (!apiKey) {
      return NextResponse.json({ error: "MUAPIAPP_API_KEY is not configured" }, { status: 500 });
    }

    // Call MuAPI to disconnect account
    // For YouTube accounts connected via external flow, use /social/ext/accounts/{id}
    // For TikTok/first-party accounts, use /social/accounts/{id}
    // Let's check which account we are disconnecting by checking the accounts list
    // To keep it simple, try to disconnect via external endpoint first, then fallback to first-party.
    let res = await fetch(`https://api.muapi.ai/api/v1/social/ext/accounts/${id}`, {
      method: "DELETE",
      headers: { "x-api-key": apiKey }
    });

    if (!res.ok) {
      // Fallback to first-party disconnect
      res = await fetch(`https://api.muapi.ai/api/social/accounts/${id}`, {
        method: "DELETE",
        headers: { "x-api-key": apiKey }
      });
    }

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `Disconnect failed: ${errText}` }, { status: 500 });
    }

    return NextResponse.json({ success: true });
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

    if (!apiKey) {
      return NextResponse.json({ error: "MUAPIAPP_API_KEY is not configured" }, { status: 500 });
    }

    const res = await fetch(`https://api.muapi.ai/api/social/accounts/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey
      },
      body: JSON.stringify({ account_name: accountName })
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `Rename failed: ${errText}` }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[RENAME_ACCOUNT_ERROR]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
