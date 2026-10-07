import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");

    if (!url) {
      return new NextResponse("Missing url parameter", { status: 400 });
    }

    // Only proxy http/https URLs
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return new NextResponse("Invalid URL", { status: 400 });
    }

    const imageRes = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; EstateStager/1.0)",
      },
    });

    if (!imageRes.ok) {
      return new NextResponse("Failed to fetch image", { status: imageRes.status });
    }

    const contentType = imageRes.headers.get("content-type") || "image/png";
    const buffer = await imageRes.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "attachment",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("[DOWNLOAD_PROXY]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
