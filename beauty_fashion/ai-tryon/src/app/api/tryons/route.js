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

    const apiKey = config.ai.apiKey;
    const hasApiKey = apiKey && !apiKey.includes("your_") && apiKey.trim() !== "";

    if (id) {
      let tryon = await prisma.tryOn.findFirst({
        where: { id, userId: session.user.id }
      });
      if (!tryon) {
        return new NextResponse("Not Found", { status: 404 });
      }

      if (tryon.status === "processing" && tryon.requestId && !tryon.requestId.startsWith("mock_") && hasApiKey) {
        try {
          const checkRes = await fetch(`https://api.muapi.ai/api/v1/predictions/${tryon.requestId}/result`, {
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
              const outputUrl = outputs[0] || (typeof checkData.output === 'string' ? checkData.output : checkData.output?.urls?.get);

              if (outputUrl) {
                tryon = await prisma.tryOn.update({
                  where: { id: tryon.id },
                  data: { status: "completed", resultImage: outputUrl }
                });
              }
            } else if (state === "failed") {
              tryon = await prisma.tryOn.update({
                where: { id: tryon.id },
                data: { status: "failed" }
              });
            }
          }
        } catch (pollErr) {
          console.error(`Bypass poll error for request ID ${tryon.requestId}:`, pollErr);
        }
      }

      return NextResponse.json(tryon);
    }

    const tryons = await prisma.tryOn.findMany({
      where: { userId: session.user.id },
      orderBy: { createTime: "desc" }
    });

    const updatedTryons = await Promise.all(
      tryons.map(async (tryon) => {
        if (tryon.status === "processing" && tryon.requestId && !tryon.requestId.startsWith("mock_") && hasApiKey) {
          try {
            const checkRes = await fetch(`https://api.muapi.ai/api/v1/predictions/${tryon.requestId}/result`, {
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
                const outputUrl = outputs[0] || (typeof checkData.output === 'string' ? checkData.output : checkData.output?.urls?.get);

                if (outputUrl) {
                  return await prisma.tryOn.update({
                    where: { id: tryon.id },
                    data: { status: "completed", resultImage: outputUrl }
                  });
                }
              } else if (state === "failed") {
                return await prisma.tryOn.update({
                  where: { id: tryon.id },
                  data: { status: "failed" }
                });
              }
            }
          } catch (pollErr) {
            console.error(`Bypass poll error for request ID ${tryon.requestId}:`, pollErr);
          }
        }
        return tryon;
      })
    );

    return NextResponse.json(updatedTryons);
  } catch (error) {
    console.error("[TRYONS_GET]", error);
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
      return new NextResponse("Missing try-on ID", { status: 400 });
    }

    const tryon = await prisma.tryOn.findFirst({
      where: { id, userId: session.user.id }
    });

    if (!tryon) {
      return new NextResponse("Not Found", { status: 404 });
    }

    await prisma.tryOn.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[TRYONS_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
