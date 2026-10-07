import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserService } from "@/lib/services/user";
import config from "@/lib/config";

// Helper function to call the MuAPI publishing endpoints
async function triggerMuApiPublish(platform, payload) {
  const apiKey = config.ai.apiKey;
  const endpoint = platform === "youtube" 
    ? "https://api.muapi.ai/api/v1/youtube-publish" 
    : "https://api.muapi.ai/api/v1/tiktok-publish";

  // Re-map keys if needed for each platform
  const bodyData = {
    account_id: parseInt(payload.accountId),
    media_url: payload.mediaUrl
  };

  if (platform === "youtube") {
    bodyData.title = payload.title || "Untitled Video";
    bodyData.description = payload.description || "";
    bodyData.tags = payload.tags ? payload.tags.split(",").map(t => t.trim()) : [];
    bodyData.privacy = payload.privacy || "public";
    if (payload.categoryId) bodyData.category_id = payload.categoryId;
    bodyData.made_for_kids = payload.madeForKids || false;
  } else {
    bodyData.title = payload.title || ""; // TikTok caption
    bodyData.privacy_level = payload.privacy || "PUBLIC_TO_EVERYONE";
    bodyData.disable_comment = payload.disableComment || false;
    bodyData.disable_duet = payload.disableDuet || false;
    bodyData.disable_stitch = payload.disableStitch || false;
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey
    },
    body: JSON.stringify(bodyData)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`MuAPI submission failed: ${errText}`);
  }

  const data = await res.json();
  return data.request_id || data.id; // Returns request_id
}

// GET: List posts + Process Due Posts + Poll Status
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;

    // 1. Fetch current posts from database
    let posts = await prisma.scheduledPost.findMany({
      where: { userId },
      orderBy: { scheduledAt: "desc" }
    });

    const now = new Date();
    let dbUpdated = false;

    // 2. Trigger Due Scheduled Posts
    const duePosts = posts.filter(p => p.status === "scheduled" && new Date(p.scheduledAt) <= now);
    for (const post of duePosts) {
      try {
        // Deduct 1 credit for publishing
        await UserService.deductCredits(userId, config.ai.generationCost);
        
        // Trigger post
        const requestId = await triggerMuApiPublish(post.platform, {
          accountId: post.accountId,
          mediaUrl: post.mediaUrl,
          title: post.title,
          description: post.description,
          tags: post.tags,
          privacy: post.privacy,
          disableComment: post.disableComment,
          disableDuet: post.disableDuet,
          disableStitch: post.disableStitch,
          categoryId: post.categoryId,
          madeForKids: post.madeForKids
        });

        await prisma.scheduledPost.update({
          where: { id: post.id },
          data: {
            status: "processing",
            requestId: requestId
          }
        });
        dbUpdated = true;
      } catch (err) {
        console.error(`Failed to trigger due post ${post.id}:`, err);
        
        // Set post to failed
        await prisma.scheduledPost.update({
          where: { id: post.id },
          data: {
            status: "failed",
            error: err.message || "Failed to trigger scheduled post"
          }
        });
        dbUpdated = true;
      }
    }

    // 3. Poll Processing Posts
    const processingPosts = posts.filter(p => p.status === "processing" && p.requestId);
    for (const post of processingPosts) {
      try {
        const apiKey = config.ai.apiKey;
        const res = await fetch(`https://api.muapi.ai/api/v1/predictions/${post.requestId}/result`, {
          headers: { "x-api-key": apiKey }
        });

        if (res.ok) {
          const result = await res.json();
          const status = result.status || result.state;

          if (status === "completed" || status === "succeeded") {
            const output = result.output || {};
            // For YouTube, it returns url. For TikTok, it returns publish_id
            const publishedUrl = output.url || (output.publish_id ? `https://tiktok.com/publish/${output.publish_id}` : null);
            
            await prisma.scheduledPost.update({
              where: { id: post.id },
              data: {
                status: "completed",
                publishedUrl: publishedUrl || "Published successfully",
                publishResult: JSON.stringify(output),
                publishedAt: new Date()
              }
            });
            dbUpdated = true;
          } else if (status === "failed") {
            const errorMsg = result.error || "Publishing failed";
            await prisma.scheduledPost.update({
              where: { id: post.id },
              data: {
                status: "failed",
                error: errorMsg
              }
            });

            // Refund credits
            await UserService.addCredits(userId, config.ai.generationCost);
            dbUpdated = true;
          }
        }
      } catch (err) {
        console.error(`Failed to poll status for post ${post.id}:`, err);
      }
    }

    // If database was modified, re-fetch posts list to return fresh data
    if (dbUpdated) {
      posts = await prisma.scheduledPost.findMany({
        where: { userId },
        orderBy: { scheduledAt: "desc" }
      });
    }

    return NextResponse.json(posts);
  } catch (error) {
    console.error("[GET_POSTS_ERROR]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// POST: Schedule or Publish Immediately
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();

    const {
      accountId,
      platform,
      accountName,
      mediaUrl,
      title,
      description,
      tags,
      privacy,
      scheduledAt,
      disableComment,
      disableDuet,
      disableStitch,
      categoryId,
      madeForKids
    } = body;

    if (!accountId || !platform || !mediaUrl) {
      return NextResponse.json({ error: "Missing required fields: accountId, platform, and mediaUrl are mandatory." }, { status: 400 });
    }

    // Check credits before creating the post
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true }
    });

    const cost = config.ai.generationCost;
    if (!user || user.credits < cost) {
      return NextResponse.json({ error: `Insufficient credits. This operation costs ${cost} credits but you have ${user?.credits ?? 0}.` }, { status: 400 });
    }

    const isScheduled = scheduledAt && new Date(scheduledAt) > new Date();

    if (isScheduled) {
      // Create scheduled post (Credits are not deducted until triggering)
      const post = await prisma.scheduledPost.create({
        data: {
          userId,
          accountId: parseInt(accountId),
          platform,
          accountName: accountName || `${platform} Account`,
          mediaUrl,
          title: title || "",
          description: description || "",
          tags: tags || "",
          privacy: privacy || "public",
          disableComment: !!disableComment,
          disableDuet: !!disableDuet,
          disableStitch: !!disableStitch,
          categoryId: categoryId || null,
          madeForKids: !!madeForKids,
          scheduledAt: new Date(scheduledAt),
          status: "scheduled"
        }
      });
      return NextResponse.json(post);
    } else {
      // Immediate publish
      // 1. Deduct credits first
      await UserService.deductCredits(userId, cost);

      try {
        // 2. Submit to MuAPI
        const requestId = await triggerMuApiPublish(platform, {
          accountId,
          mediaUrl,
          title,
          description,
          tags,
          privacy,
          disableComment,
          disableDuet,
          disableStitch,
          categoryId,
          madeForKids
        });

        // 3. Create database entry with status processing
        const post = await prisma.scheduledPost.create({
          data: {
            userId,
            accountId: parseInt(accountId),
            platform,
            accountName: accountName || `${platform} Account`,
            mediaUrl,
            title: title || "",
            description: description || "",
            tags: tags || "",
            privacy: privacy || "public",
            disableComment: !!disableComment,
            disableDuet: !!disableDuet,
            disableStitch: !!disableStitch,
            categoryId: categoryId || null,
            madeForKids: !!madeForKids,
            scheduledAt: new Date(),
            status: "processing",
            requestId: requestId
          }
        });
        return NextResponse.json(post);
      } catch (err) {
        // Refund credit on immediate trigger error
        await UserService.addCredits(userId, cost);
        throw err;
      }
    }
  } catch (error) {
    console.error("[POST_POSTS_ERROR]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
