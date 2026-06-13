import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

function cleanJsonString(str) {
  if (!str) return "";
  let cleaned = str.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-zA-Z0-9]*\n/, ""); // Remove opening ```json
    cleaned = cleaned.replace(/\n```$/, ""); // Remove closing ```
    cleaned = cleaned.trim();
  }
  return cleaned;
}


export async function POST(req) {
  try {
    const data = await req.json();
    const requestId = data.id || data.request_id;

    if (!requestId) {
      console.error("[MUAPI_WEBHOOK_ERROR] Missing request id in payload", data);
      return NextResponse.json({ error: "Missing request id" }, { status: 400 });
    }

    const creation = await prisma.geoReport.findFirst({ where: { requestId } });
    if (!creation) {
      console.warn(`[MUAPI_WEBHOOK_WARN] Report not found for request ID: ${requestId}`);
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (data.error || data.status === "failed" || data.state === "failed") {
      await prisma.geoReport.update({
        where: { id: creation.id },
        data: { status: "failed" }
      });
      console.log(`[MUAPI_WEBHOOK] Updated report ${creation.id} to failed`);
    } else {
      const outputs = data.outputs || [];
      const rawOutput = outputs[0] || data.output;
      let outputText = "";
      if (typeof rawOutput === "string") {
        outputText = rawOutput;
      } else if (rawOutput && rawOutput.text) {
        outputText = rawOutput.text;
      } else if (data.result) {
        outputText = typeof data.result === "string" ? data.result : JSON.stringify(data.result);
      }

      if (outputText) {
        let parsedScore = 0;
        let cleanedOutput = outputText;
        try {
          cleanedOutput = cleanJsonString(outputText);
          const dataObj = JSON.parse(cleanedOutput);
          parsedScore = dataObj.visibility_score || 0;
        } catch (e) {
          console.warn("Failed to parse webhook report score");
        }

        await prisma.geoReport.update({
          where: { id: creation.id },
          data: {
            status: "completed",
            reportData: cleanedOutput,
            score: parsedScore
          }
        });
        console.log(`[MUAPI_WEBHOOK] Updated report ${creation.id} to completed`);
      } else {
        console.warn(`[MUAPI_WEBHOOK_WARN] No output text found in webhook payload for request ${requestId}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[MUAPI_WEBHOOK_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
