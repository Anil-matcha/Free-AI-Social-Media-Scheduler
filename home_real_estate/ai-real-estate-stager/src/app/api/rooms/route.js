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
      let room = await prisma.stagedRoom.findFirst({
        where: { id, userId: session.user.id }
      });
      if (!room) {
        return new NextResponse("Not Found", { status: 404 });
      }

      if (room.status === "generating" && room.requestId && !room.requestId.startsWith("mock_")) {
        const apiKey = config.ai.apiKey;
        if (apiKey && !apiKey.includes("your_") && apiKey.trim() !== "") {
          try {
            const pollRes = await fetch(`https://api.muapi.ai/api/v1/predictions/${room.requestId}/result`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey
              }
            });
            if (pollRes.ok) {
              const pollJson = await pollRes.json();
              const state = pollJson.status || pollJson.state;
              if (state === "completed" || state === "succeeded") {
                const outputs = pollJson.outputs || [];
                const outputUrl = outputs[0] || (typeof pollJson.output === 'string' ? pollJson.output : pollJson.output?.urls?.get);
                if (outputUrl) {
                  room = await prisma.stagedRoom.update({
                    where: { id: room.id },
                    data: {
                      status: "completed",
                      stagedImage: outputUrl
                    }
                  });
                }
              } else if (state === "failed") {
                room = await prisma.stagedRoom.update({
                  where: { id: room.id },
                  data: {
                    status: "failed"
                  }
                });
              }
            } else if (pollRes.status === 404) {
              room = await prisma.stagedRoom.update({
                where: { id: room.id },
                data: {
                  status: "failed"
                }
              });
            }
          } catch (err) {
            console.error("Dynamic status sync error:", err);
          }
        }
      }

      return NextResponse.json(room);
    }

    const rooms = await prisma.stagedRoom.findMany({
      where: { userId: session.user.id },
      orderBy: { createTime: "desc" }
    });

    return NextResponse.json(rooms);
  } catch (error) {
    console.error("[ROOMS_GET]", error);
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
      return new NextResponse("Missing room ID", { status: 400 });
    }

    const room = await prisma.stagedRoom.findFirst({
      where: { id, userId: session.user.id }
    });

    if (!room) {
      return new NextResponse("Not Found", { status: 404 });
    }

    await prisma.stagedRoom.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ROOMS_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
