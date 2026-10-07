import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import config from "../../../../lib/config";

export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    let creation = await prisma.hairStyle.findFirst({
      where: { id, userId: session.user.id }
    });

    if (!creation) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Active status sync (similar to list endpoint)
    if (creation.status === "processing" && creation.requestId && !creation.requestId.startsWith("mock_")) {
      const apiKey = config.ai.apiKey;
      if (apiKey && !apiKey.includes("your_") && apiKey.trim() !== "") {
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
                creation = await prisma.hairStyle.update({
                  where: { id: creation.id },
                  data: { status: "completed", resultImage: outputUrl }
                });
              }
            } else if (state === "failed") {
              creation = await prisma.hairStyle.update({
                where: { id: creation.id },
                data: { status: "failed" }
              });
            }
          }
        } catch (pollErr) {
          console.error(`Bypass single poll error for request ID ${creation.requestId}:`, pollErr);
        }
      }
    }

    return NextResponse.json(creation);
  } catch (error) {
    console.error("[CREATION_ID_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    const creation = await prisma.hairStyle.findFirst({
      where: { id, userId: session.user.id }
    });

    if (!creation) {
      return new NextResponse("Not Found", { status: 404 });
    }

    await prisma.hairStyle.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CREATION_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
