import { prisma } from "@/lib/prisma";
import { UserService } from "./user";
import config from "@/lib/config";

export const AIService = {
  async generateBlog(userId, { groupId, keyword, blogTopic }) {
    const cost = config.ai.blogGenerationCost;
    
    // 1. Deduct credits first
    await UserService.deductCredits(userId, cost);

    const apiKey = config.ai.apiKey;
    if (!apiKey || apiKey.includes("your_") || apiKey.trim() === "") {
      console.warn("MUAPIAPP_API_KEY is not configured or invalid. Falling back to local Mock Blog Post Generation.");
      // Create mock blog post directly
      const request_id = `mock_${Date.now()}`;
      const blogPost = await prisma.blogPost.create({
        data: {
          title: "Generating mock blog content...",
          content: "<p>AI is currently writing your blog post. This usually takes 5-10 seconds. Please wait...</p>",
          author: "AI Writer",
          status: "processing",
          keyword,
          blogTopic,
          requestId: request_id,
          creditCost: cost,
          userId,
          groupId,
        }
      });
      return blogPost;
    }

    // 2. Formulate prompt instructing the model to output JSON
    const systemPrompt = "You are a professional SEO copywriter and expert blogger. Generate a detailed, high-quality, and SEO-optimized blog post in clean HTML format. You must respond ONLY with a raw JSON object (do not include markdown code block styling or any additional text, just the raw JSON) with the following structure: \n{\n  \"title\": \"Blog Post Title\",\n  \"content\": \"<p>Full HTML content of the blog, using h2, h3, paragraphs, lists, bold text, etc...</p>\",\n  \"seoTitle\": \"SEO Optimized Title\",\n  \"seoDescription\": \"SEO Optimized Meta Description\",\n  \"seoKeywords\": \"keyword1, keyword2, keyword3\"\n}";

    const userPrompt = `Generate a blog post based on the following:
Primary Keyword: ${keyword}
Blog Topic / Focus: ${blogTopic}

Ensure the article is informative, well-structured, and rich with semantic details. Use the primary keyword naturally throughout the text.`;

    try {
      const submitRes = await fetch("https://api.muapi.ai/api/v1/any-llm-models", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          prompt: userPrompt,
          system_prompt: systemPrompt,
          model: "openai/gpt-5-chat",
          reasoning: false,
          priority: "throughput",
          temperature: 0.7,
          max_tokens: null
        }),
      });

      if (!submitRes.ok) {
        const errorText = await submitRes.text();
        throw new Error(`MuAPI submission failed: ${submitRes.status} ${errorText}`);
      }

      const { request_id } = await submitRes.json();
      if (!request_id) {
        throw new Error("No request_id received from MuAPI");
      }

      // 3. Create the BlogPost in 'processing' status
      const blogPost = await prisma.blogPost.create({
        data: {
          title: "Generating blog content...",
          content: "<p>AI is currently writing your blog post. This usually takes 10-30 seconds. Please wait...</p>",
          author: "AI Writer",
          status: "processing",
          keyword,
          blogTopic,
          requestId: request_id,
          creditCost: cost,
          userId,
          groupId,
        }
      });

      return blogPost;
    } catch (err) {
      console.warn("AI generation API failed. Falling back to local Mock Blog Post Generation. Error:", err.message);
      // Create mock blog post directly as fallback
      const request_id = `mock_fallback_${Date.now()}`;
      const blogPost = await prisma.blogPost.create({
        data: {
          title: "Generating mock blog content...",
          content: "<p>AI is currently writing your blog post. This usually takes 5-10 seconds. Please wait...</p>",
          author: "AI Writer",
          status: "processing",
          keyword,
          blogTopic,
          requestId: request_id,
          creditCost: cost,
          userId,
          groupId,
        }
      });
      return blogPost;
    }
  },

  async checkStatus(requestId) {
    const blogPost = await prisma.blogPost.findUnique({
      where: { requestId }
    });

    if (!blogPost) return null;

    if (blogPost.status === "completed") {
      return { status: "completed", blog: blogPost };
    }

    if (blogPost.status === "failed") {
      return { status: "failed", error: "Generation failed" };
    }

    // Check if it's a mock request (starts with 'mock_')
    if (requestId && requestId.startsWith("mock_")) {
      const elapsed = Date.now() - new Date(blogPost.createTime).getTime();
      if (elapsed < 3000) {
        return { status: "processing" };
      }

      const parsed = {
        title: `Unlocking the Potential of ${blogPost.blogTopic || "SEO Content"}`,
        content: `<h2>Introduction to ${blogPost.keyword || "Content Marketing"}</h2><p>In today's digital landscape, understanding the nuances of <strong>${blogPost.keyword || "content marketing"}</strong> has become a necessity for brand visibility. Implementing a sound strategy around <em>${blogPost.blogTopic || "SEO optimizations"}</em> is the most reliable way to achieve sustainable long-term growth.</p><p>By producing high-quality, readable content, you establish authority in your niche and build trust with your readers.</p><h2>3 Critical Strategies to Optimize Your Content</h2><p>To ensure your articles perform well, keep these basic principles in mind:</p><ol><li><strong>Keyword Density & Placement:</strong> Integrate <strong>${blogPost.keyword || "your primary keyword"}</strong> naturally into headings, intros, and conclusions. Avoid keyword stuffing.</li><li><strong>Semantic Hierarchy:</strong> Structure your posts logically with <code>H2</code> and <code>H3</code> subheadings to enhance readability.</li><li><strong>Engaging Visuals:</strong> Always include relevant cover images and diagrams to break up large blocks of text.</li></ol><h2>Conclusion</h2><p>Mastering these elements is a continuous journey. By maintaining quality and relevance, your blogs will consistently rank higher and drive meaningful engagement. Start creating and scaling today!</p>`,
        seoTitle: `Unlocking ${blogPost.blogTopic || "SEO"} - Step-by-Step Guide`,
        seoDescription: `Everything you need to know about ${blogPost.keyword || "optimizations"} and ${blogPost.blogTopic || "blogging"} for organic search growth.`,
        seoKeywords: `${blogPost.keyword || "blog"}, seo, copywriting, marketing`
      };

      const updated = await prisma.blogPost.update({
        where: { id: blogPost.id },
        data: {
          title: parsed.title,
          content: parsed.content,
          seoTitle: parsed.seoTitle,
          seoDescription: parsed.seoDescription,
          seoKeywords: parsed.seoKeywords,
          status: "draft",
          updateTime: new Date(),
        }
      });

      return { status: "completed", blog: updated };
    }

    const apiKey = config.ai.apiKey;
    if (!apiKey) throw new Error("MUAPIAPP_API_KEY is not configured");

    try {
      const res = await fetch(`https://api.muapi.ai/api/v1/predictions/${requestId}/result`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        }
      });

      if (!res.ok) {
        console.error("Polling endpoint returned error:", res.status);
        return { status: "processing" };
      }

      const result = await res.json();
      const state = result.status || result.state;

      if (state === "completed" || state === "succeeded") {
        const outputs = result.outputs || [];
        const rawOutput = outputs[0] || result.output;
        
        let textResult = "";
        if (typeof rawOutput === "string") {
          textResult = rawOutput;
        } else if (rawOutput && rawOutput.text) {
          textResult = rawOutput.text;
        } else if (result.result) {
          textResult = typeof result.result === "string" ? result.result : JSON.stringify(result.result);
        }

        if (!textResult) {
          throw new Error("Empty text output from model");
        }

        // Clean markdown wraps if the model did not follow instructions
        let jsonStr = textResult.trim();
        if (jsonStr.startsWith("```json")) {
          jsonStr = jsonStr.substring(7);
        }
        if (jsonStr.startsWith("```")) {
          jsonStr = jsonStr.substring(3);
        }
        if (jsonStr.endsWith("```")) {
          jsonStr = jsonStr.substring(0, jsonStr.length - 3);
        }
        jsonStr = jsonStr.trim();

        let parsed = {};
        try {
          parsed = JSON.parse(jsonStr);
        } catch (e) {
          console.warn("Failed to parse AI output as JSON, using as fallback text:", e);
          parsed = {
            title: blogPost.blogTopic ? `Blog: ${blogPost.blogTopic}` : "AI Generated Blog",
            content: `<p>${textResult.replace(/\n/g, "<br>")}</p>`,
            seoTitle: blogPost.blogTopic || "AI Blog",
            seoDescription: "Generated blog post content.",
            seoKeywords: blogPost.keyword || "blog, ai",
          };
        }

        const updated = await prisma.blogPost.update({
          where: { id: blogPost.id },
          data: {
            title: parsed.title || "AI Generated Blog",
            content: parsed.content || "<p>No content generated</p>",
            seoTitle: parsed.seoTitle || parsed.title || "",
            seoDescription: parsed.seoDescription || "",
            seoKeywords: parsed.seoKeywords || "",
            status: "draft", // Completed generation resides as draft until user publishes it
            updateTime: new Date(),
          }
        });

        return { status: "completed", blog: updated };
      } else if (state === "failed") {
        await prisma.blogPost.update({
          where: { id: blogPost.id },
          data: {
            status: "failed",
            title: "Generation failed",
            content: `<p>Failed to generate content. Error: ${result.error || "Unknown prediction error"}</p>`
          }
        });

        // Refund exact credits
        await UserService.addCredits(blogPost.userId, blogPost.creditCost);
        return { status: "failed", error: result.error || "Prediction failed" };
      }
    } catch (e) {
      console.error("Polling error in checkStatus:", e);
    }

    return { status: "processing" };
  }
};
