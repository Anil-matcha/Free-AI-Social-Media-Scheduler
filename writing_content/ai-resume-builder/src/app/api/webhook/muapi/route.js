import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function POST(req) {
  try {
    const data = await req.json();
    const requestId = data.id || data.request_id;

    if (!requestId) {
      return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
    }

    const resume = await prisma.resume.findFirst({ where: { requestId } });
    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    if (data.error || data.status === "failed") {
      await prisma.resume.update({
        where: { id: resume.id },
        data: { status: "failed" }
      });
    } else {
      const outputText = data.outputs?.[0] || data.output?.text || data.output;
      if (outputText) {
        try {
          let cleanText = typeof outputText === "string" ? outputText.trim() : JSON.stringify(outputText);
          if (cleanText.startsWith("```json")) {
            cleanText = cleanText.substring(7);
          } else if (cleanText.startsWith("```")) {
            cleanText = cleanText.substring(3);
          }
          if (cleanText.endsWith("```")) {
            cleanText = cleanText.substring(0, cleanText.length - 3);
          }

          const aiObj = JSON.parse(cleanText.trim());
          if (aiObj.html_content) {
            await prisma.resume.update({
              where: { id: resume.id },
              data: {
                status: "completed",
                htmlContent: aiObj.html_content,
                structuredData: aiObj.structured_data ? JSON.stringify(aiObj.structured_data) : resume.structuredData
              }
            });
          }
        } catch (parseErr) {
          console.error("Webhook JSON parse error:", parseErr);
          await prisma.resume.update({
            where: { id: resume.id },
            data: { status: "failed" }
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[MUAPI_WEBHOOK]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
