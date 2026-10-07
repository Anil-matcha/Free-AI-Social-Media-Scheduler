import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserService } from "@/lib/services/user";
import config from "@/lib/config";
import { DemoStore } from "@/lib/demo-store";

// Helper function to call the MuAPI publishing endpoints
async function triggerMuApiPublish(platform, payload) {
  const apiKey = config.ai.apiKey;
  const plat = (platform || "").toLowerCase().replace("x_twitter", "x");

  const endpointMap = {
    youtube: "https://api.muapi.ai/api/v1/youtube-publish",
    tiktok: "https://api.muapi.ai/api/v1/tiktok-publish",
    instagram: "https://api.muapi.ai/api/v1/instagram-publish",
    x: "https://api.muapi.ai/api/v1/x-publish",
    facebook: "https://api.muapi.ai/api/v1/facebook-publish",
    linkedin: "https://api.muapi.ai/api/v1/linkedin-publish",
    threads: "https://api.muapi.ai/api/v1/threads-publish",
    pinterest: "https://api.muapi.ai/api/v1/pinterest-publish",
  };

  const endpoint = endpointMap[plat] || endpointMap.youtube;

  const captionText = [
    payload.title,
    payload.description,
    payload.tags ? payload.tags.split(",").map(t => t.trim().startsWith("#") ? t.trim() : `#${t.trim()}`).join(" ") : ""
  ].filter(Boolean).join("\n\n");

  const bodyData = {
    account_id: parseInt(payload.accountId),
    media_url: payload.mediaUrl
  };

  if (plat === "youtube") {
    bodyData.title = payload.title || "Untitled Video";
    bodyData.description = payload.description || "";
    bodyData.tags = payload.tags ? payload.tags.split(",").map(t => t.trim()) : [];
    bodyData.privacy = payload.privacy || "public";
    if (payload.categoryId) bodyData.category_id = payload.categoryId;
    bodyData.made_for_kids = payload.madeForKids || false;
  } else if (plat === "tiktok") {
    bodyData.title = payload.title || captionText;
    bodyData.privacy_level = payload.privacy || "PUBLIC_TO_EVERYONE";
    bodyData.disable_comment = payload.disableComment || false;
    bodyData.disable_duet = payload.disableDuet || false;
    bodyData.disable_stitch = payload.disableStitch || false;
  } else if (plat === "instagram") {
    bodyData.caption = captionText;
    bodyData.placement = "reels";
    bodyData.share_to_feed = true;
  } else if (plat === "x") {
    bodyData.caption = captionText.substring(0, 280);
    bodyData.reply_settings = "everyone";
  } else if (plat === "facebook") {
    bodyData.caption = captionText;
    bodyData.placement = "timeline";
  } else if (plat === "linkedin") {
    bodyData.caption = captionText;
  } else if (plat === "threads") {
    bodyData.caption = captionText.substring(0, 500);
    bodyData.placement = "timeline";
  } else if (plat === "pinterest") {
    bodyData.title = payload.title || "Untitled Pin";
    bodyData.caption = payload.description || captionText;
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

    // 1. Fetch current posts from database with fallback
    let posts = [];
    try {
      posts = await prisma.scheduledPost.findMany({
        where: { userId },
        orderBy: { scheduledAt: "desc" }
      });
    } catch (dbErr) {
      console.warn("[POSTS_GET_FALLBACK] Database offline, returning DemoStore posts:", dbErr.message);
      return NextResponse.json(DemoStore.getPosts());
    }

    const now = new Date();
    let dbUpdated = false;

    // 2. Trigger Due Scheduled Posts
    const duePosts = posts.filter(p => p.status === "scheduled" && new Date(p.scheduledAt) <= now);
    
    // Pre-fetch connected accounts if any due post has a dummy or missing accountId
    let devAccounts = null;
    if (duePosts.some(p => !p.accountId || p.accountId === 101) && config.ai.apiKey) {
      try {
        const accRes = await fetch("https://muapi.ai/api/social/accounts", {
          headers: { "x-api-key": config.ai.apiKey }
        });
        if (accRes.ok) devAccounts = await accRes.json();
      } catch (_) {}
    }

    for (const post of duePosts) {
      try {
        // Deduct 1 credit for publishing
        await UserService.deductCredits(userId, config.ai.generationCost);
        
        let targetAccountId = post.accountId;
        if ((!targetAccountId || targetAccountId === 101) && devAccounts) {
          const normPlat = (post.platform || "").toLowerCase().replace("x_twitter", "x").replace("twitter", "x");
          const matched = devAccounts.find(a => (a.platform_name || "").toLowerCase() === normPlat);
          if (matched) targetAccountId = matched.id;
        }

        // Trigger post
        const requestId = await triggerMuApiPublish(post.platform, {
          accountId: targetAccountId,
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
            accountId: targetAccountId,
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
            const publishedUrl = output.url || output.x_url || output.instagram_url || output.facebook_url || output.linkedin_url || output.threads_url || output.pinterest_url || (output.publish_id ? `https://${post.platform}.com/post/${output.publish_id}` : null);
            
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
      accountId = 101,
      accountName,
      title = "",
      description = "",
      tags = "",
      mediaUrl,
      privacy = "public",
      scheduledAt,
      disableComment = false,
      disableDuet = false,
      disableStitch = false,
      categoryId,
      madeForKids = false,
      placement,
      shareToFeed = true,
      destinationLink = "",
      boardId = "",
      replySettings = "everyone"
    } = body;

    const targetPlatforms = Array.isArray(body.platforms) && body.platforms.length > 0
      ? body.platforms
      : (body.platform ? [body.platform] : []);

    if (!mediaUrl || targetPlatforms.length === 0) {
      return NextResponse.json({ error: "Missing required fields: at least one platform and mediaUrl are mandatory." }, { status: 400 });
    }

    let user = null;
    try {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { credits: true }
      });
    } catch (e) {
      console.warn("[POSTS_USER_CREDITS_FALLBACK] DB unreachable, using default credits");
      user = { credits: 50 };
    }

    const costPerPost = config.ai.generationCost || 1;
    const isScheduled = scheduledAt && new Date(scheduledAt) > new Date();

    if (!isScheduled) {
      const totalCost = costPerPost * targetPlatforms.length;
      if (user && user.credits < totalCost) {
        return NextResponse.json({
          error: `Insufficient credits. Publishing to ${targetPlatforms.length} platforms costs ${totalCost} credits, but you have ${user?.credits ?? 0}.`
        }, { status: 400 });
      }
    }

    const createdPosts = [];
    const platformAccountMap = body.platformAccountMap || {};

    let devAccounts = [];
    if (config.ai.apiKey) {
      try {
        const accRes = await fetch("https://muapi.ai/api/social/accounts", {
          headers: { "x-api-key": config.ai.apiKey }
        });
        if (accRes.ok) devAccounts = await accRes.json();
      } catch (_) {}
    }

    for (const plat of targetPlatforms) {
      const normPlat = plat.toLowerCase().replace("x_twitter", "x").replace("twitter", "x");
      let platAccountId = platformAccountMap[plat] || platformAccountMap[normPlat];
      let platAccountName = accountName;

      if (!platAccountId || platAccountId === 101) {
        const matched = devAccounts.find(a => (a.platform_name || "").toLowerCase() === normPlat);
        if (matched) {
          platAccountId = matched.id;
          platAccountName = matched.account_name || platAccountName;
        }
      }

      platAccountId = parseInt(platAccountId) || 101;
      platAccountName = platAccountName || `${plat} Account`;

      if (isScheduled) {
        try {
          const post = await prisma.scheduledPost.create({
            data: {
              userId,
              accountId: platAccountId,
              platform: plat,
              accountName: platAccountName,
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
          createdPosts.push(post);
        } catch (dbErr) {
          console.warn(`[POST_CREATE_FALLBACK] DB offline for ${plat}, saving to DemoStore:`, dbErr.message);
          const post = DemoStore.addPost({
            userId,
            accountId: platAccountId,
            platform: plat,
            accountName: platAccountName,
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
            scheduledAt: new Date(scheduledAt).toISOString(),
            status: "scheduled"
          });
          createdPosts.push(post);
        }
      } else {
        // Immediate publish
        try {
          await UserService.deductCredits(userId, costPerPost);
        } catch (e) {}

        let requestId = null;
        let publishError = null;

        if (config.ai.apiKey && !config.ai.apiKey.includes("your_")) {
          try {
            requestId = await triggerMuApiPublish(plat, {
              accountId: platAccountId,
              mediaUrl,
              title,
              description,
              tags,
              privacy,
              disableComment,
              disableDuet,
              disableStitch,
              categoryId,
              madeForKids,
              placement,
              shareToFeed,
              destinationLink,
              boardId,
              replySettings
            });
          } catch (pubErr) {
            console.error(`[IMMEDIATE_PUBLISH_ERR] Failed for ${plat}:`, pubErr.message);
            publishError = pubErr.message;
          }
        }

        const postStatus = publishError ? "failed" : (requestId ? "processing" : "completed");
        const finalRequestId = requestId || ("req_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6));

        try {
          const post = await prisma.scheduledPost.create({
            data: {
              userId,
              accountId: platAccountId,
              platform: plat,
              accountName: platAccountName,
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
              status: postStatus,
              requestId: finalRequestId,
              error: publishError
            }
          });
          createdPosts.push(post);
        } catch (dbErr) {
          console.warn(`[POST_IMMEDIATE_FALLBACK] DB offline for ${plat}, saving to DemoStore`);
          const post = DemoStore.addPost({
            userId,
            accountId: platAccountId,
            platform: plat,
            accountName: platAccountName,
            mediaUrl,
            title: title || "",
            description: description || "",
            tags: tags || "",
            privacy: privacy || "public",
            scheduledAt: new Date().toISOString(),
            status: postStatus,
            requestId: finalRequestId,
            error: publishError,
            publishedUrl: `https://${plat}.com/sample_post`
          });
          createdPosts.push(post);
        }
      }
    }

    // Return created post(s)
    if (createdPosts.length === 1 && !Array.isArray(body.platforms)) {
      return NextResponse.json(createdPosts[0]);
    }
    return NextResponse.json({
      success: true,
      posts: createdPosts,
      count: createdPosts.length
    });
  } catch (error) {
    console.error("[POST_POSTS_ERROR]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
