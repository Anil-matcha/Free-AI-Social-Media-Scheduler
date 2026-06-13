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
      let podcast = await prisma.podcastCreation.findFirst({
        where: { id, userId: session.user.id }
      });

      if (!podcast) {
        return new NextResponse("Not Found", { status: 404 });
      }

      // Self-healing single lookup if stuck in processing
      if (podcast.status === "processing" && config.ai.apiKey && !config.ai.apiKey.includes("your_") && podcast.requestId && !podcast.requestId.startsWith("mock_")) {
        try {
          const pollRes = await fetch(`https://api.muapi.ai/api/v1/predictions/${podcast.requestId}/result`, {
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
              const outUrl = outputs[0] || (typeof pollJson.output === "string" ? pollJson.output : pollJson.output?.urls?.get || pollJson.audio);
              if (outUrl) {
                podcast = await prisma.podcastCreation.update({
                  where: { id: podcast.id },
                  data: { status: "completed", audioUrl: outUrl }
                });
              }
            } else if (state === "failed") {
              podcast = await prisma.podcastCreation.update({
                where: { id: podcast.id },
                data: { status: "failed" }
              });
            }
          }
        } catch (err) {
          console.error("Self healing lookup failed for id:", id, err);
        }
      }

      return NextResponse.json(podcast);
    }

    const podcasts = await prisma.podcastCreation.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" }
    });

    // Self-healing check for any processing podcasts (local webhook bypass)
    const processingPodcasts = podcasts.filter(p => p.status === "processing" && !p.requestId.startsWith("mock_"));
    if (processingPodcasts.length > 0 && config.ai.apiKey && !config.ai.apiKey.includes("your_")) {
      await Promise.all(
        processingPodcasts.map(async (p) => {
          try {
            const pollRes = await fetch(`https://api.muapi.ai/api/v1/predictions/${p.requestId}/result`, {
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
                const outUrl = outputs[0] || (typeof pollJson.output === "string" ? pollJson.output : pollJson.output?.urls?.get || pollJson.audio);
                if (outUrl) {
                  await prisma.podcastCreation.update({
                    where: { id: p.id },
                    data: { status: "completed", audioUrl: outUrl }
                  });
                  p.status = "completed";
                  p.audioUrl = outUrl;
                }
              } else if (state === "failed") {
                await prisma.podcastCreation.update({
                  where: { id: p.id },
                  data: { status: "failed" }
                });
                p.status = "failed";
              }
            }
          } catch (err) {
            console.error("Background sync failed for request:", p.requestId, err);
          }
        })
      );
    }

    return NextResponse.json(podcasts);
  } catch (error) {
    console.error("[PODCASTS_GET]", error);
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
      return new NextResponse("Missing podcast ID", { status: 400 });
    }

    const podcast = await prisma.podcastCreation.findFirst({
      where: { id, userId: session.user.id }
    });

    if (!podcast) {
      return new NextResponse("Not Found", { status: 404 });
    }

    await prisma.podcastCreation.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PODCASTS_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
