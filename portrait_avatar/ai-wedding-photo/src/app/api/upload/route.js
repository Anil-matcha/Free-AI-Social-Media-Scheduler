import { NextResponse } from "next/server";
import config from "@/lib/config";

export async function POST(req) {
  try {
    const data = await req.formData();
    const file = data.get("file");
    const apiKey = config.ai.apiKey;

    if (!file) {
      return new NextResponse("No file provided", { status: 400 });
    }

    if (!apiKey || apiKey.includes("your_") || apiKey.trim() === "") {
      // Local Base64 Fallback
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      return NextResponse.json({ url: `data:${file.type};base64,${buffer.toString("base64")}` });
    }

    const fd = new FormData();
    fd.append("file", file);

    const uploadRes = await fetch("https://api.muapi.ai/api/v1/upload_file", {
      method: "POST",
      headers: { "x-api-key": apiKey },
      body: fd
    });

    if (!uploadRes.ok) {
      throw new Error(`MuAPI Upload Failed: ${uploadRes.status}`);
    }

    const result = await uploadRes.json();
    return NextResponse.json({ url: result.url || result.file_url });
  } catch (error) {
    console.error("[UPLOAD_API_ERROR]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
