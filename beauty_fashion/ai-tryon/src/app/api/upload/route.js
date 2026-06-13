import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import config from "../../../lib/config";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const data = await req.formData();
    const file = data.get("file");

    if (!file) {
      return new NextResponse("No file uploaded", { status: 400 });
    }

    const apiKey = config.ai.apiKey;
    if (!apiKey || apiKey.includes("your_") || apiKey.trim() === "") {
      // Fallback to base64
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Image = buffer.toString("base64");
      const dataUrl = `data:${file.type};base64,${base64Image}`;
      return NextResponse.json({ url: dataUrl });
    }

    const fd = new FormData();
    fd.append("file", file);

    const uploadRes = await fetch("https://api.muapi.ai/api/v1/upload_file", {
      method: "POST",
      headers: {
        "x-api-key": apiKey
      },
      body: fd
    });

    if (!uploadRes.ok) {
      throw new Error(`Upload failed with status ${uploadRes.status}`);
    }

    const result = await uploadRes.json();
    return NextResponse.json({ url: result.url || result.file_url });
  } catch (error) {
    console.error("[UPLOAD]", error);
    try {
      const data = await req.formData();
      const file = data.get("file");
      if (file) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Image = buffer.toString("base64");
        const dataUrl = `data:${file.type};base64,${base64Image}`;
        return NextResponse.json({ url: dataUrl });
      }
    } catch (e) {
      console.error("[UPLOAD_FALLBACK_ERR]", e);
    }
    return new NextResponse("Upload failed", { status: 500 });
  }
}
