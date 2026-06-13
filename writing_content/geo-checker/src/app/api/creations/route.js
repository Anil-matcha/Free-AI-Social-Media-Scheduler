import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import config from "../../../lib/config";

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


export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      let creation = await prisma.geoReport.findFirst({
        where: { id, userId: session.user.id }
      });
      if (!creation) {
        return new NextResponse("Not Found", { status: 404 });
      }

      // Check status dynamically if processing (Webhook bypass pattern for single prediction)
      const apiKey = config.ai.apiKey;
      const hasApiKey = apiKey && !apiKey.includes("your_") && apiKey.trim() !== "";

      if (creation.status === "processing" && creation.requestId && !creation.requestId.startsWith("mock_") && hasApiKey) {
        try {
          const checkRes = await fetch(`https://api.muapi.ai/api/v1/predictions/${creation.requestId}/result`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey
            }
          });

          if (checkRes.ok) {
            const checkData = await checkRes.json();
            const state = checkData.status || checkData.state;

            if (state === "completed" || state === "succeeded") {
              const outputs = checkData.outputs || [];
              const rawOutput = outputs[0] || checkData.output;
              let outputText = "";
              if (typeof rawOutput === "string") {
                outputText = rawOutput;
              } else if (rawOutput && rawOutput.text) {
                outputText = rawOutput.text;
              } else if (checkData.result) {
                outputText = typeof checkData.result === "string" ? checkData.result : JSON.stringify(checkData.result);
              }

              if (outputText) {
                let parsedScore = 0;
                let cleanedOutput = outputText;
                try {
                  cleanedOutput = cleanJsonString(outputText);
                  const dataObj = JSON.parse(cleanedOutput);
                  parsedScore = dataObj.visibility_score || 0;
                } catch (e) {
                  console.warn("Failed to parse dynamic sync report score");
                }

                creation = await prisma.geoReport.update({
                  where: { id: creation.id },
                  data: { status: "completed", reportData: cleanedOutput, score: parsedScore }
                });
              }
            } else if (state === "failed") {
              creation = await prisma.geoReport.update({
                where: { id: creation.id },
                data: { status: "failed" }
              });
            }
          }
        } catch (pollErr) {
          console.error(`Bypass poll error for request ID ${creation.requestId}:`, pollErr);
        }
      }

      return NextResponse.json(creation);
    }

    // 1. Fetch user's creations
    const creations = await prisma.geoReport.findMany({
      where: { userId: session.user.id },
      orderBy: { createTime: "desc" }
    });

    // 2. Active status checking & dynamic update (Webhook bypass pattern)
    const apiKey = config.ai.apiKey;
    const hasApiKey = apiKey && !apiKey.includes("your_") && apiKey.trim() !== "";
    
    const updatedCreations = await Promise.all(
      creations.map(async (creation) => {
        if (creation.status === "processing" && creation.requestId && !creation.requestId.startsWith("mock_") && hasApiKey) {
          try {
            const checkRes = await fetch(`https://api.muapi.ai/api/v1/predictions/${creation.requestId}/result`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey
              }
            });

            if (checkRes.ok) {
              const checkData = await checkRes.json();
              const state = checkData.status || checkData.state;

              if (state === "completed" || state === "succeeded") {
                const outputs = checkData.outputs || [];
                const rawOutput = outputs[0] || checkData.output;
                let outputText = "";
                if (typeof rawOutput === "string") {
                  outputText = rawOutput;
                } else if (rawOutput && rawOutput.text) {
                  outputText = rawOutput.text;
                } else if (checkData.result) {
                  outputText = typeof checkData.result === "string" ? checkData.result : JSON.stringify(checkData.result);
                }

                if (outputText) {
                  let parsedScore = 0;
                  let cleanedOutput = outputText;
                  try {
                    cleanedOutput = cleanJsonString(outputText);
                    const dataObj = JSON.parse(cleanedOutput);
                    parsedScore = dataObj.visibility_score || 0;
                  } catch (e) {
                    console.warn("Failed to parse dynamic sync report score");
                  }

                  return await prisma.geoReport.update({
                    where: { id: creation.id },
                    data: { status: "completed", reportData: cleanedOutput, score: parsedScore }
                  });
                }
              } else if (state === "failed") {
                return await prisma.geoReport.update({
                  where: { id: creation.id },
                  data: { status: "failed" }
                });
              }
            }
          } catch (pollErr) {
            console.error(`Bypass poll error for request ID ${creation.requestId}:`, pollErr);
          }
        }
        return creation;
      })
    );

    return NextResponse.json(updatedCreations);
  } catch (error) {
    console.error("[CREATIONS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return new NextResponse("Missing creation ID", { status: 400 });
    }

    const creation = await prisma.geoReport.findFirst({
      where: { id, userId: session.user.id }
    });

    if (!creation) {
      return new NextResponse("Not Found", { status: 404 });
    }

    await prisma.geoReport.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CREATIONS_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
