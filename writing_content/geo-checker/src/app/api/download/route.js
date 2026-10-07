import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  try {
    // Check if it's a data URI
    if (imageUrl.startsWith("data:")) {
      const match = imageUrl.match(/^data:([^;]+);(charset=[^;]+|base64)?,(.*)$/);
      if (!match) {
        throw new Error("Invalid data URI format");
      }

      const mimeType = match[1];
      const isBase64 = match[2] && match[2].includes("base64");
      const rawData = match[3];

      let buffer;
      if (isBase64) {
        buffer = Buffer.from(rawData, "base64");
      } else {
        buffer = Buffer.from(decodeURIComponent(rawData), "utf-8");
      }

      const filename = `geo_audit_${Date.now()}.json`;

      return new Response(buffer, {
        headers: {
          "Content-Type": mimeType,
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    // Otherwise treat as external HTTP URL
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error("Failed to fetch image");

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/png";
    const filename = imageUrl.split("/").pop() || `download_${Date.now()}.png`;

    return new Response(Buffer.from(buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("Download proxy error:", err);
    return NextResponse.redirect(imageUrl); // Fallback to raw URL redirect
  }
}
