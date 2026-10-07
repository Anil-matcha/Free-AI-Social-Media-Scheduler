import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const instance = await prisma.appInstance.findUnique({
        where: { id },
      });
      if (!instance || instance.userId !== session.user.id) {
        return NextResponse.json({ error: "App instance not found or access denied" }, { status: 404 });
      }
      return NextResponse.json(instance);
    }

    const instances = await prisma.appInstance.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(instances);
  } catch (error) {
    console.error("AppInstances GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, templateId, config: configData } = await req.json();

    if (!name || !templateId) {
      return NextResponse.json({ error: "Missing required name or templateId parameter" }, { status: 400 });
    }

    const instance = await prisma.appInstance.create({
      data: {
        name,
        templateId,
        config: configData ? JSON.stringify(configData) : null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(instance);
  } catch (error) {
    console.error("AppInstances POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
    }

    // Verify ownership
    const instance = await prisma.appInstance.findUnique({ where: { id } });
    if (!instance || instance.userId !== session.user.id) {
      return NextResponse.json({ error: "App instance not found or access denied" }, { status: 404 });
    }

    await prisma.appInstance.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("AppInstances DELETE error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
