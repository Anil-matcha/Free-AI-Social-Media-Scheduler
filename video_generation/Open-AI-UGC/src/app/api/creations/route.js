import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const creations = await prisma.creation.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" }
    });

    creations.forEach(c => {
      if (c.inputImages) {
        let imagesList = [];
        try {
          imagesList = JSON.parse(c.inputImages);
          if (!Array.isArray(imagesList)) {
            imagesList = [c.inputImages];
          }
        } catch {
          imagesList = c.inputImages.split(",").map(url => url.trim()).filter(Boolean);
        }
        c.inputImages = imagesList;
      }
    });

    return NextResponse.json(creations);

  } catch (error) {
    console.error("[CREATIONS_GET_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
