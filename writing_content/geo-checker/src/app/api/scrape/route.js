import { NextResponse } from "next/server";

function extractTextFromHtml(html) {
  if (!html) return "";
  
  // Remove script and style elements
  let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ");
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ");
  // Remove HTML comments
  clean = clean.replace(/<!--[\s\S]*?-->/g, " ");
  // Remove HTML tags
  clean = clean.replace(/<[^>]+>/g, " ");
  // Collapse whitespace
  clean = clean.replace(/\s+/g, " ").trim();
  
  return clean;
}

export async function POST(req) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    let absoluteUrl = url;
    if (!/^https?:\/\//i.test(url)) {
      absoluteUrl = `https://${url}`;
    }

    const res = await fetch(absoluteUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      next: { revalidate: 60 } // cache for 60 seconds
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch page: ${res.statusText}`);
    }

    const html = await res.text();
    const cleanText = extractTextFromHtml(html);

    // Limit output length to prevent payload inflation (e.g. max 3000 words / ~12000 chars)
    const truncatedText = cleanText.substring(0, 15000);

    return NextResponse.json({
      success: true,
      text: truncatedText,
      originalLength: cleanText.length,
      truncatedLength: truncatedText.length
    });
  } catch (err) {
    console.error("Scraper error:", err);
    return NextResponse.json({
      success: false,
      error: err.message || "Failed to parse target website"
    }, { status: 500 });
  }
}
