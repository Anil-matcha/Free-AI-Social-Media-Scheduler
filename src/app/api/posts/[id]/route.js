import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DemoStore } from "@/lib/demo-store";

// DELETE: Delete or Cancel a post
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;
    try {
      const post = await prisma.scheduledPost.findUnique({
        where: { id }
      });

      if (post) {
        if (post.status === "processing") {
          return NextResponse.json({ error: "Cannot delete a post that is currently uploading." }, { status: 400 });
        }
        await prisma.scheduledPost.delete({
          where: { id }
        });
      } else {
        DemoStore.deletePost(id);
      }
    } catch (dbErr) {
      DemoStore.deletePost(id);
    }

    return NextResponse.json({ success: true, message: "Post deleted" });
  } catch (error) {
    console.error("[DELETE_POST_ERROR]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// PATCH: Reschedule or Retry a post
export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    try {
      const post = await prisma.scheduledPost.findUnique({
        where: { id }
      });

      if (post) {
        if (post.status === "processing") {
          return NextResponse.json({ error: "Cannot modify a post that is currently uploading." }, { status: 400 });
        }

        if (body.action === "publish_now") {
          // Resolve real connected account ID if missing or dummy 101
          let targetAccountId = post.accountId;
          const plat = (post.platform || "").toLowerCase().replace("x_twitter", "x").replace("twitter", "x");
          
          if (!targetAccountId || targetAccountId === 101) {
            try {
              const accRes = await fetch("https://muapi.ai/api/social/accounts", {
                headers: { "x-api-key": config.ai.apiKey }
              });
              if (accRes.ok) {
                const devAccounts = await accRes.json();
                const matched = devAccounts.find(a => (a.platform_name || "").toLowerCase() === plat);
                if (matched) targetAccountId = matched.id;
              }
            } catch (_) {}
          }

          let requestId = null;
          let publishError = null;

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
            post.title,
            post.description,
            post.tags ? post.tags.split(",").map(t => t.trim().startsWith("#") ? t.trim() : `#${t.trim()}`).join(" ") : ""
          ].filter(Boolean).join("\n\n");

          const bodyData = {
            account_id: parseInt(targetAccountId) || 101,
            media_url: post.mediaUrl
          };

          if (plat === "youtube") {
            bodyData.title = post.title || "Untitled Video";
            bodyData.description = post.description || "";
            bodyData.tags = post.tags ? post.tags.split(",").map(t => t.trim()) : [];
            bodyData.privacy = post.privacy || "public";
            if (post.categoryId) bodyData.category_id = post.categoryId;
            bodyData.madeForKids = post.madeForKids || false;
          } else if (plat === "x") {
            bodyData.caption = captionText.substring(0, 280);
            bodyData.reply_settings = "everyone";
          } else if (plat === "tiktok") {
            bodyData.title = post.title || captionText;
            bodyData.privacy_level = post.privacy || "PUBLIC_TO_EVERYONE";
          } else if (plat === "instagram" || plat === "facebook" || plat === "threads" || plat === "linkedin") {
            bodyData.caption = captionText;
            bodyData.placement = "timeline";
          } else if (plat === "pinterest") {
            bodyData.title = post.title || "Untitled Pin";
            bodyData.caption = post.description || captionText;
          }

          try {
            const pubRes = await fetch(endpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-api-key": config.ai.apiKey
              },
              body: JSON.stringify(bodyData)
            });

            if (!pubRes.ok) {
              const errText = await pubRes.text();
              throw new Error(`MuAPI submission failed: ${errText}`);
            }
            const pubData = await pubRes.json();
            requestId = pubData.request_id || pubData.id;
          } catch (pubErr) {
            console.error(`[PUBLISH_NOW_ERR] Failed for ${plat}:`, pubErr.message);
            publishError = pubErr.message;
          }

          const updatedPost = await prisma.scheduledPost.update({
            where: { id },
            data: {
              accountId: parseInt(targetAccountId) || 101,
              status: publishError ? "failed" : "processing",
              requestId: requestId || ("req_" + Date.now()),
              error: publishError
            }
          });

          return NextResponse.json(updatedPost);
        }

        const updateData = {};
        if (body.scheduledAt) {
          updateData.scheduledAt = new Date(body.scheduledAt);
          updateData.status = "scheduled";
          updateData.error = null;
        }

        if (body.title !== undefined) updateData.title = body.title;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.privacy !== undefined) updateData.privacy = body.privacy;

        const updatedPost = await prisma.scheduledPost.update({
          where: { id },
          data: updateData
        });

        return NextResponse.json(updatedPost);
      }
    } catch (dbErr) {
      console.warn("[PATCH_POST_FALLBACK] DB offline, updating DemoStore:", dbErr.message);
    }

    // Fallback store update
    const updated = DemoStore.updatePost(id, body);
    return NextResponse.json(updated || { id, ...body });
  } catch (error) {
    console.error("[PATCH_POST_ERROR]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

