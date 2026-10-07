import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const mediaUrl = searchParams.get("url");
  if (!mediaUrl) return NextResponse.json({ error: "Missing url" }, { status: 400 });
  
  try {
    const res = await fetch(mediaUrl);
    if (!res.ok) throw new Error("Failed to fetch media");
    
    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "video/mp4";
    const filename = mediaUrl.split("/").pop() || `download_${Date.now()}.mp4`;
    
    return new Response(Buffer.from(buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("CORS proxy download error:", err);
    return NextResponse.redirect(mediaUrl); // fallback
  }
}
