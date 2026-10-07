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
      const creation = await prisma.weddingPhotoCreation.findUnique({
        where: { id, userId: session.user.id }
      });
      if (!creation) return new NextResponse("Not Found", { status: 404 });
      
      // On-the-fly check if still processing
      if (creation.status === "processing" && creation.requestId && !creation.requestId.startsWith("mock_")) {
        try {
          const checkRes = await fetch(`https://api.muapi.ai/api/v1/predictions/${creation.requestId}/result`, {
            headers: { "x-api-key": config.ai.apiKey }
          });
          if (checkRes.ok) {
            const checkJson = await checkRes.json();
            const state = checkJson.status || checkJson.state;
            if (state === "completed" || state === "succeeded") {
              const outputs = checkJson.outputs || [];
              const imageUrl = outputs[0] || (checkJson.output ? checkJson.output[0] : "");
              if (imageUrl) {
                const updated = await prisma.weddingPhotoCreation.update({
                  where: { id: creation.id },
                  data: {
                    status: "completed",
                    resultImage: imageUrl
                  }
                });
                return NextResponse.json(updated);
              }
            } else if (state === "failed") {
              const updated = await prisma.weddingPhotoCreation.update({
                where: { id: creation.id },
                data: { status: "failed" }
              });
              return NextResponse.json(updated);
            }
          }
        } catch (err) {
          console.warn("Status check failed:", err.message);
        }
      }
      
      return NextResponse.json(creation);
    }

    // Fetch list of creations
    const creations = await prisma.weddingPhotoCreation.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" }
    });

    // Check all processing records on-the-fly (robust bypass polling)
    const updatedCreations = await Promise.all(creations.map(async (creation) => {
      if (creation.status === "processing" && creation.requestId && !creation.requestId.startsWith("mock_")) {
        try {
          const checkRes = await fetch(`https://api.muapi.ai/api/v1/predictions/${creation.requestId}/result`, {
            headers: { "x-api-key": config.ai.apiKey }
          });
          if (checkRes.ok) {
            const checkJson = await checkRes.json();
            const state = checkJson.status || checkJson.state;
            if (state === "completed" || state === "succeeded") {
              const outputs = checkJson.outputs || [];
              const imageUrl = outputs[0] || (checkJson.output ? checkJson.output[0] : "");
              if (imageUrl) {
                return prisma.weddingPhotoCreation.update({
                  where: { id: creation.id },
                  data: {
                    status: "completed",
                    resultImage: imageUrl
                  }
                });
              }
            } else if (state === "failed") {
              return prisma.weddingPhotoCreation.update({
                where: { id: creation.id },
                data: { status: "failed" }
              });
            }
          }
        } catch (err) {
          console.warn(`Status check failed for ${creation.id}:`, err.message);
        }
      }
      return creation;
    }));

    return NextResponse.json(updatedCreations);

  } catch (error) {
    console.error("[CREATIONS_GET_ERROR]", error);
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

    await prisma.weddingPhotoCreation.delete({
      where: { id, userId: session.user.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CREATIONS_DELETE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
