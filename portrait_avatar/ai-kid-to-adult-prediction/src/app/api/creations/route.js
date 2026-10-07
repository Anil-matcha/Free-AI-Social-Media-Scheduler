import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import config from "@/lib/config";

// Helper: check MuAPI and sync DB for a processing record
async function syncProcessingRecord(record) {
  const apiKey = config.ai.apiKey;
  if (apiKey && !apiKey.includes("your_") && !record.requestId.startsWith("mock_")) {
    try {
      const pollRes = await fetch(
        `https://api.muapi.ai/api/v1/predictions/${record.requestId}/result`,
        { headers: { "x-api-key": apiKey } }
      );
      if (pollRes.ok) {
        const pollJson = await pollRes.json();
        const state = pollJson.status || pollJson.state;
        if (state === "completed" || state === "succeeded") {
          const outputs = pollJson.outputs || [];
          const imageUrl =
            outputs[0] ||
            (typeof pollJson.output === "string"
              ? pollJson.output
              : pollJson.output?.urls?.get || pollJson.output?.image_url);
          if (imageUrl) {
            return prisma.kidAdultPrediction.update({
              where: { id: record.id },
              data: { status: "completed", resultImage: imageUrl },
            });
          }
        } else if (state === "failed") {
          return prisma.kidAdultPrediction.update({
            where: { id: record.id },
            data: { status: "failed" },
          });
        }
      }
    } catch (err) {
      console.error("Sync error for", record.id, err.message);
    }
  }
  return record;
}

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // Single record fetch
    if (id) {
      let record = await prisma.kidAdultPrediction.findFirst({
        where: { id, userId: session.user.id },
      });
      if (!record) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      if (record.status === "processing") {
        record = await syncProcessingRecord(record);
      }
      return NextResponse.json(record);
    }

    // All records
    let records = await prisma.kidAdultPrediction.findMany({
      where: { userId: session.user.id },
      orderBy: { createTime: "desc" },
    });

    // Self-heal processing records
    const synced = await Promise.all(
      records.map((r) =>
        r.status === "processing" ? syncProcessingRecord(r) : r
      )
    );

    return NextResponse.json(synced);
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
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const record = await prisma.kidAdultPrediction.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!record) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.kidAdultPrediction.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CREATIONS_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
