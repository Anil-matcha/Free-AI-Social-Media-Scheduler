import { NextResponse } from "next/server";
import config from "@/lib/config";

export async function POST(req) {
  try {
    const data = await req.formData();
    const file = data.get("file");
    const apiKey = config.ai.apiKey;

    if (!apiKey || apiKey.includes("your_") || apiKey.trim() === "") {
      // Local Base64 fallback
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      return NextResponse.json({
        url: `data:${file.type};base64,${buffer.toString("base64")}`,
      });
    }

    const fd = new FormData();
    fd.append("file", file);

    const uploadRes = await fetch(config.ai.uploadEndpoint, {
      method: "POST",
      headers: { "x-api-key": apiKey },
      body: fd,
    });

    const result = await uploadRes.json();
    return NextResponse.json({ url: result.url || result.file_url });
  } catch (error) {
    console.error("[UPLOAD_ERROR]", error);
    return new NextResponse("Upload failed", { status: 500 });
  }
}
