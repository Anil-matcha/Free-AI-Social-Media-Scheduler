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
      let creation = await prisma.tattooCreation.findFirst({
        where: { id, userId: session.user.id }
      });
      if (!creation) {
        return new NextResponse("Not Found", { status: 404 });
      }

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
              const outputUrl = outputs[0] || (typeof checkData.output === 'string' ? checkData.output : checkData.output?.urls?.get);

              if (outputUrl) {
                creation = await prisma.tattooCreation.update({
                  where: { id: creation.id },
                  data: { status: "completed", resultImage: outputUrl }
                });
              }
            } else if (state === "failed") {
              creation = await prisma.tattooCreation.update({
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
    const creations = await prisma.tattooCreation.findMany({
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
                const outputUrl = outputs[0] || (typeof checkData.output === 'string' ? checkData.output : checkData.output?.urls?.get);

                if (outputUrl) {
                  return await prisma.tattooCreation.update({
                    where: { id: creation.id },
                    data: { status: "completed", resultImage: outputUrl }
                  });
                }
              } else if (state === "failed") {
                return await prisma.tattooCreation.update({
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

    const creation = await prisma.tattooCreation.findFirst({
      where: { id, userId: session.user.id }
    });

    if (!creation) {
      return new NextResponse("Not Found", { status: 404 });
    }

    await prisma.tattooCreation.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CREATIONS_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
