import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  try {
    // 1. Authenticate the user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse form-data to extract the file
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const apiKey = process.env.MU_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "MuAPI Key not configured" }, { status: 500 });
    }

    // 3. Construct a forward payload for MuAPI file server
    const forwardData = new FormData();
    forwardData.append("file", file);

    const muRes = await fetch("https://api.muapi.ai/api/v1/upload_file", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
      },
      body: forwardData,
    });

    if (!muRes.ok) {
      const errorText = await muRes.text();
      console.error("[MUAPI_UPLOAD_ERROR_RESPONSE]", errorText);
      return NextResponse.json({ error: "Failed to upload file to upstream serverless network" }, { status: muRes.status });
    }

    const data = await muRes.json();
    const uploadedUrl = data.url;

    if (!uploadedUrl) {
      return NextResponse.json({ error: "Invalid upload response from server" }, { status: 502 });
    }

    // 4. Persist the file link globally for the user
    const dbImage = await prisma.userImage.create({
      data: {
        userId: session.user.id,
        url: uploadedUrl,
      },
    });

    return NextResponse.json({ url: uploadedUrl, id: dbImage.id });
  } catch (error) {
    console.error("[UPLOAD_ROUTE_ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
