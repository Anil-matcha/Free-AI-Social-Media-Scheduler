import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Generate unique hash for card URL
async function generateUniqueHash() {
  let hash = "";
  let exists = true;
  while (exists) {
    hash = Math.random().toString(36).substring(2, 10);
    const count = await prisma.businessCard.count({
      where: { urlHash: hash }
    });
    if (count === 0) {
      exists = false;
    }
  }
  return hash;
}

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const card = await prisma.businessCard.findFirst({
        where: { id, userId: session.user.id }
      });
      if (!card) {
        return new NextResponse("Not Found", { status: 404 });
      }
      return NextResponse.json(card);
    }

    const cards = await prisma.businessCard.findMany({
      where: { userId: session.user.id },
      orderBy: { createTime: "desc" }
    });

    return NextResponse.json(cards);
  } catch (error) {
    console.error("[CARDS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const {
      id,
      name,
      title,
      company,
      address,
      phone,
      email,
      website,
      bio,
      avatar,
      backgroundImage,
      socialLinks,
      showAiAssistant,
      templateId,
      htmlContent,
      userPrompt
    } = body;

    if (!name || !name.trim()) {
      return new NextResponse("Name is required", { status: 400 });
    }
    if (!title || !title.trim()) {
      return new NextResponse("Title is required", { status: 400 });
    }
    if (!company || !company.trim()) {
      return new NextResponse("Company is required", { status: 400 });
    }

    const cleanData = {
      name: name.trim(),
      title: title.trim(),
      company: company.trim(),
      address: address ? address.trim() : null,
      phone: phone ? phone.trim() : null,
      email: email ? email.trim() : null,
      website: website ? website.trim() : null,
      bio: bio ? bio.trim() : null,
      avatar: avatar || null,
      backgroundImage: backgroundImage || null,
      socialLinks: typeof socialLinks === "string" ? socialLinks : JSON.stringify(socialLinks || {}),
      showAiAssistant: showAiAssistant !== false,
      templateId: templateId || "classic",
      htmlContent: htmlContent || null,
      userPrompt: userPrompt || null,
    };

    if (id) {
      // Update existing
      const existing = await prisma.businessCard.findFirst({
        where: { id, userId: session.user.id }
      });

      if (!existing) {
        return new NextResponse("Not Found", { status: 404 });
      }

      // If user switches back to standard templates from custom, clear htmlContent
      if (cleanData.templateId !== "custom") {
        cleanData.htmlContent = null;
      }

      const updated = await prisma.businessCard.update({
        where: { id },
        data: cleanData
      });

      return NextResponse.json(updated);
    } else {
      // Create new
      const urlHash = await generateUniqueHash();
      const created = await prisma.businessCard.create({
        data: {
          ...cleanData,
          urlHash,
          userId: session.user.id
        }
      });

      return NextResponse.json(created);
    }
  } catch (error) {
    console.error("[CARDS_POST]", error);
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
      return new NextResponse("Missing card ID", { status: 400 });
    }

    const card = await prisma.businessCard.findFirst({
      where: { id, userId: session.user.id }
    });

    if (!card) {
      return new NextResponse("Not Found", { status: 404 });
    }

    await prisma.businessCard.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CARDS_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
