import { NextResponse } from "next/server";
import config from "@/lib/config";

export async function POST(req) {
  try {
    const data = await req.formData();
    const file = data.get("file");
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const apiKey = config.ai.apiKey;

    // Local Base64 fallback when no API key
    if (!apiKey || apiKey.includes("your_") || apiKey.trim() === "") {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      return NextResponse.json({
        url: `data:${file.type};base64,${buffer.toString("base64")}`,
      });
    }

    const fd = new FormData();
    fd.append("file", file);

    const uploadRes = await fetch("https://api.muapi.ai/api/v1/upload_file", {
      method: "POST",
      headers: { "x-api-key": apiKey },
      body: fd,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error("Upload error:", uploadRes.status, errText);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    const result = await uploadRes.json();
    return NextResponse.json({ url: result.url || result.file_url });
  } catch (err) {
    console.error("[UPLOAD_POST]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
