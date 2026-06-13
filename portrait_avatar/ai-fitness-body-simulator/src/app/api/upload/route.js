import { NextResponse } from "next/server";
import config from "@/lib/config";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const apiKey = config.ai.apiKey;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!apiKey || apiKey.includes("your_") || apiKey.trim() === "") {
      // Offline/Local Base64 Fallback
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Url = `data:${file.type};base64,${buffer.toString("base64")}`;
      return NextResponse.json({ url: base64Url });
    }

    const uploadFormData = new FormData();
    uploadFormData.append("file", file);

    const uploadRes = await fetch("https://api.muapi.ai/api/v1/upload_file", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
      },
      body: uploadFormData,
    });

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      return NextResponse.json({ error: `CDN upload failed: ${errorText}` }, { status: 500 });
    }

    const result = await uploadRes.json();
    return NextResponse.json({ url: result.url || result.file_url });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
