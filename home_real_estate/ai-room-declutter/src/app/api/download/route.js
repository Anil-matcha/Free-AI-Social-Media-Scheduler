import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get("url");
  if (!imageUrl) return NextResponse.json({ error: "Missing url" }, { status: 400 });
  try {
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
    return NextResponse.redirect(imageUrl); // fallback
  }
}
