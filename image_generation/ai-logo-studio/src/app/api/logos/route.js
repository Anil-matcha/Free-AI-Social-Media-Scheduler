import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import config from "@/lib/config";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      let logo = await prisma.logoCreation.findFirst({
        where: { id, userId: session.user.id }
      });

      if (!logo) {
        return new NextResponse("Not Found", { status: 404 });
      }

      // Self-healing single lookup if stuck in processing
      if (logo.status === "processing") {
        if (logo.requestId && logo.requestId.startsWith("mock_")) {
          const elapsed = Date.now() - new Date(logo.createdAt).getTime();
          if (elapsed >= 3000) {
            const FALLBACK_LOGOS = {
              "nano-banana-pro": "https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/nano-banana-2.jpg",
              "nano-banana-pro-edit": "https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/nano-banana-2-edit-out.jpg"
            };
            const modelType = logo.inputImage ? "nano-banana-pro-edit" : "nano-banana-pro";
            logo = await prisma.logoCreation.update({
              where: { id: logo.id },
              data: { status: "completed", resultImage: FALLBACK_LOGOS[modelType] }
            });
          }
        } else if (config.ai.apiKey && !config.ai.apiKey.includes("your_") && logo.requestId) {
          try {
            const pollRes = await fetch(`https://api.muapi.ai/api/v1/predictions/${logo.requestId}/result`, {
              headers: {
                "Content-Type": "application/json",
                "x-api-key": config.ai.apiKey
              }
            });

            if (pollRes.ok) {
              const pollJson = await pollRes.json();
              const state = pollJson.status || pollJson.state;
              if (state === "completed" || state === "succeeded") {
                const outputs = pollJson.outputs || [];
                const outUrl = outputs[0] || (typeof pollJson.output === "string" ? pollJson.output : pollJson.output?.image || pollJson.output?.urls?.get);
                if (outUrl) {
                  logo = await prisma.logoCreation.update({
                    where: { id: logo.id },
                    data: { status: "completed", resultImage: outUrl }
                  });
                }
              } else if (state === "failed") {
                logo = await prisma.logoCreation.update({
                  where: { id: logo.id },
                  data: { status: "failed" }
                });
              }
            }
          } catch (err) {
            console.error("Self healing lookup failed for id:", id, err);
          }
        }
      }

      return NextResponse.json(logo);
    }

    const logos = await prisma.logoCreation.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" }
    });

    // Self-healing check for any processing logos (local webhook bypass)
    const processingLogos = logos.filter(l => l.status === "processing");
    if (processingLogos.length > 0) {
      await Promise.all(
        processingLogos.map(async (l) => {
          if (l.requestId && l.requestId.startsWith("mock_")) {
            const elapsed = Date.now() - new Date(l.createdAt).getTime();
            if (elapsed >= 3000) {
              const FALLBACK_LOGOS = {
                "nano-banana-pro": "https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/nano-banana-2.jpg",
                "nano-banana-pro-edit": "https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/nano-banana-2-edit-out.jpg"
              };
              const modelType = l.inputImage ? "nano-banana-pro-edit" : "nano-banana-pro";
              await prisma.logoCreation.update({
                where: { id: l.id },
                data: { status: "completed", resultImage: FALLBACK_LOGOS[modelType] }
              });
              l.status = "completed";
              l.resultImage = FALLBACK_LOGOS[modelType];
            }
          } else if (config.ai.apiKey && !config.ai.apiKey.includes("your_") && l.requestId) {
            try {
              const pollRes = await fetch(`https://api.muapi.ai/api/v1/predictions/${l.requestId}/result`, {
                headers: {
                  "Content-Type": "application/json",
                  "x-api-key": config.ai.apiKey
                }
              });

              if (pollRes.ok) {
                const pollJson = await pollRes.json();
                const state = pollJson.status || pollJson.state;
                if (state === "completed" || state === "succeeded") {
                  const outputs = pollJson.outputs || [];
                  const outUrl = outputs[0] || (typeof pollJson.output === "string" ? pollJson.output : pollJson.output?.image || pollJson.output?.urls?.get);
                  if (outUrl) {
                    await prisma.logoCreation.update({
                      where: { id: l.id },
                      data: { status: "completed", resultImage: outUrl }
                    });
                    l.status = "completed";
                    l.resultImage = outUrl;
                  }
                } else if (state === "failed") {
                  await prisma.logoCreation.update({
                    where: { id: l.id },
                    data: { status: "failed" }
                  });
                  l.status = "failed";
                }
              }
            } catch (err) {
              console.error("Background sync failed for request:", l.requestId, err);
            }
          }
        })
      );
    }

    return NextResponse.json(logos);
  } catch (error) {
    console.error("[LOGOS_GET]", error);
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
      return new NextResponse("Missing logo ID", { status: 400 });
    }

    const logo = await prisma.logoCreation.findFirst({
      where: { id, userId: session.user.id }
    });

    if (!logo) {
      return new NextResponse("Not Found", { status: 404 });
    }

    await prisma.logoCreation.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[LOGOS_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
