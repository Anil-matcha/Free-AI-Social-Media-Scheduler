import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    let creation = await prisma.creation.findUnique({
      where: { 
        id,
        userId: session.user.id // Security check
      }
    });

    if (!creation) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Active polling fallback in case webhook failed to deliver or wasn't set up
    const activeStatuses = ['processing', 'pending', 'starting', 'queued'];
    if (activeStatuses.includes(creation.status) && creation.requestId) {
      const apiKey = process.env.UGC_API_KEY;
      if (apiKey) {
        try {
          const checkRes = await fetch(`https://api.muapi.ai/api/v1/predictions/${creation.requestId}/result`, {
            method: "GET",
            headers: {
              "x-api-key": apiKey,
            },
          });

          if (checkRes.ok) {
            const checkData = await checkRes.json();
            const upstreamStatus = checkData.status || "processing";

            if (upstreamStatus === "failed") {
              creation = await prisma.creation.update({
                where: { id },
                data: {
                  status: "failed",
                  error: checkData.error || "Generation failed"
                }
              });
            } else if (upstreamStatus === "completed" || (checkData.outputs && checkData.outputs.length > 0)) {
              const outputs = checkData.outputs || [];
              const videoUrl = outputs.length > 0 ? outputs[0] : null;

              creation = await prisma.creation.update({
                where: { id },
                data: {
                  status: "completed",
                  url: videoUrl
                }
              });
            } else if (upstreamStatus !== "processing") {
              creation = await prisma.creation.update({
                where: { id },
                data: {
                  status: upstreamStatus
                }
              });
            }
          }
        } catch (pollErr) {
          console.error("Error polling prediction status from upstream:", pollErr);
        }
      }
    }

    if (creation && creation.inputImages) {
      let imagesList = [];
      try {
        imagesList = JSON.parse(creation.inputImages);
        if (!Array.isArray(imagesList)) {
          imagesList = [creation.inputImages];
        }
      } catch {
        imagesList = creation.inputImages.split(",").map(url => url.trim()).filter(Boolean);
      }
      creation.inputImages = imagesList;
    }

    return NextResponse.json(creation);

  } catch (error) {
    console.error("[CREATION_GET_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
