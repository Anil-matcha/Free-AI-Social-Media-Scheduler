import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import config from "../../../lib/config";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const resume = await prisma.resume.findUnique({
        where: { id, userId: session.user.id }
      });
      if (!resume) return new NextResponse("Not Found", { status: 404 });
      
      // On-the-fly check if still processing
      if (resume.status === "processing" && resume.requestId && !resume.requestId.startsWith("mock_")) {
        try {
          const checkRes = await fetch(`https://api.muapi.ai/api/v1/predictions/${resume.requestId}/result`, {
            headers: { "x-api-key": config.ai.apiKey }
          });
          if (checkRes.ok) {
            const checkJson = await checkRes.json();
            const state = checkJson.status || checkJson.state;
            if (state === "completed" || state === "succeeded") {
              const outputText = checkJson.outputs?.[0] || checkJson.output?.text || checkJson.output;
              if (outputText) {
                let cleanText = typeof outputText === "string" ? outputText.trim() : JSON.stringify(outputText);
                if (cleanText.startsWith("```json")) cleanText = cleanText.substring(7);
                else if (cleanText.startsWith("```")) cleanText = cleanText.substring(3);
                if (cleanText.endsWith("```")) cleanText = cleanText.substring(0, cleanText.length - 3);

                const aiObj = JSON.parse(cleanText.trim());
                if (aiObj.html_content) {
                  const updated = await prisma.resume.update({
                    where: { id: resume.id },
                    data: {
                      status: "completed",
                      htmlContent: aiObj.html_content,
                      structuredData: aiObj.structured_data ? JSON.stringify(aiObj.structured_data) : resume.structuredData
                    }
                  });
                  return NextResponse.json(updated);
                }
              }
            } else if (state === "failed") {
              const updated = await prisma.resume.update({
                where: { id: resume.id },
                data: { status: "failed" }
              });
              return NextResponse.json(updated);
            }
          }
        } catch (err) {
          console.warn("Status check failed:", err.message);
        }
      }
      
      return NextResponse.json(resume);
    }

    // Fetch list of resumes
    const resumes = await prisma.resume.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" }
    });

    // Check all processing records on-the-fly (robust bypass polling)
    const updatedResumes = await Promise.all(resumes.map(async (resume) => {
      if (resume.status === "processing" && resume.requestId && !resume.requestId.startsWith("mock_")) {
        try {
          const checkRes = await fetch(`https://api.muapi.ai/api/v1/predictions/${resume.requestId}/result`, {
            headers: { "x-api-key": config.ai.apiKey }
          });
          if (checkRes.ok) {
            const checkJson = await checkRes.json();
            const state = checkJson.status || checkJson.state;
            if (state === "completed" || state === "succeeded") {
              const outputText = checkJson.outputs?.[0] || checkJson.output?.text || checkJson.output;
              if (outputText) {
                let cleanText = typeof outputText === "string" ? outputText.trim() : JSON.stringify(outputText);
                if (cleanText.startsWith("```json")) cleanText = cleanText.substring(7);
                else if (cleanText.startsWith("```")) cleanText = cleanText.substring(3);
                if (cleanText.endsWith("```")) cleanText = cleanText.substring(0, cleanText.length - 3);

                const aiObj = JSON.parse(cleanText.trim());
                if (aiObj.html_content) {
                  return prisma.resume.update({
                    where: { id: resume.id },
                    data: {
                      status: "completed",
                      htmlContent: aiObj.html_content,
                      structuredData: aiObj.structured_data ? JSON.stringify(aiObj.structured_data) : resume.structuredData
                    }
                  });
                }
              }
            } else if (state === "failed") {
              return prisma.resume.update({
                where: { id: resume.id },
                data: { status: "failed" }
              });
            }
          }
        } catch (err) {
          console.warn(`Status check failed for ${resume.id}:`, err.message);
        }
      }
      return resume;
    }));

    return NextResponse.json(updatedResumes);

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
    if (!id) return new NextResponse("Missing id", { status: 400 });

    await prisma.resume.delete({
      where: { id, userId: session.user.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CREATIONS_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Duplication endpoint
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await req.json();
    if (!id) return new NextResponse("Missing id", { status: 400 });

    const original = await prisma.resume.findFirst({
      where: { id, userId: session.user.id }
    });

    if (!original) return new NextResponse("Not Found", { status: 404 });

    const copy = await prisma.resume.create({
      data: {
        userId: session.user.id,
        title: original.title ? `${original.title} (Copy)` : "My Resume (Copy)",
        userPrompt: original.userPrompt,
        structuredData: original.structuredData,
        htmlContent: original.htmlContent,
        templateId: original.templateId,
        themeColor: original.themeColor,
        fontFamily: original.fontFamily,
        fontSize: original.fontSize,
        requestId: `dup_${Date.now()}`,
        status: original.status,
        creditCost: original.creditCost
      }
    });

    return NextResponse.json(copy);
  } catch (error) {
    console.error("[CREATIONS_POST_DUP]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
