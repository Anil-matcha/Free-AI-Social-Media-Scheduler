import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import config from "@/lib/config";

// Platform-tailored guidelines for gpt-5-mini
const PLATFORM_GUIDELINES = {
  youtube: `Target Platform: YouTube
- Title: Highly clickable, intriguing hook under 70 characters. Never misleading, but creates a strong curiosity gap.
- Description: Structured with:
  1. Compelling 1-2 sentence hook above the fold.
  2. Brief summary of what the viewer will learn or experience.
  3. Clear Call to Action (like, subscribe, comment).
- Tags: 4-6 relevant comma-separated tags without hash symbols (e.g. "ai, productivity, social media").`,

  tiktok: `Target Platform: TikTok
- Title: Punchy, high-energy video caption under 150 characters.
- Description: Direct, relatable hook that speaks directly to the viewer with 1-2 emojis.
- Tags: 3-5 trending, viral comma-separated hashtags (e.g. "fyp, viral, ai, creators").`,

  instagram: `Target Platform: Instagram
- Title: Scroll-stopping first sentence hook.
- Description: Engaging, conversational caption formatted with clean line breaks and expressive emojis. Include a clear engagement call-to-action (e.g., "Save this for later", "Share with a friend").
- Tags: 5-8 targeted, high-reach comma-separated hashtags.`,

  x_twitter: `Target Platform: X (Twitter)
- Title: Strong, provocative opening thought.
- Description: Concise, high-value tweet under 280 characters with clean spacing. No fluff.
- Tags: 1-2 focused, high-impact comma-separated hashtags.`,

  linkedin: `Target Platform: LinkedIn
- Title: Professional, curiosity-driven opening line.
- Description: Story-driven or value-packed professional insight with generous line breaks for readability. End with a thoughtful discussion question to encourage comments.
- Tags: 3-5 industry-relevant comma-separated hashtags (e.g. "marketing, leadership, innovation").`,

  threads: `Target Platform: Threads
- Title: Conversational thought or question.
- Description: Casual, relatable observation under 500 characters designed to spark quick replies.
- Tags: 2-3 clean comma-separated hashtags.`
};

function buildSystemPrompt(platform, tone) {
  const platformGuide = PLATFORM_GUIDELINES[platform] || PLATFORM_GUIDELINES.youtube;

  return `You are an elite social media strategist and viral copywriter who crafts top-performing content across social platforms.

${platformGuide}

Tone of Voice: ${tone || "Engaging, authentic, and modern"}

CRITICAL OUTPUT FORMAT:
You MUST respond with a valid JSON object ONLY. Do NOT include markdown code blocks, backticks, or any explanatory text outside the JSON object.

Format:
{
  "title": "The post title or main hook",
  "description": "The full post caption or description text",
  "tags": "tag1, tag2, tag3"
}`;
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const body = await req.json();
    const { prompt, platform = "youtube", tone = "Engaging" } = body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json({ error: "Please provide a prompt or topic for the post." }, { status: 400 });
    }

    const apiKey = config.ai.apiKey;
    if (!apiKey) {
      return NextResponse.json({ 
        error: "MuAPI API key is not configured. Please check MUAPIAPP_API_KEY in .env." 
      }, { status: 500 });
    }

    const systemPrompt = buildSystemPrompt(platform, tone);

    // 1. Submit generation request to MuAPI gpt-5-mini
    const submitRes = await fetch("https://api.muapi.ai/api/v1/gpt-5-mini", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey
      },
      body: JSON.stringify({
        prompt: prompt.trim(),
        system_prompt: systemPrompt
      })
    });

    if (!submitRes.ok) {
      const errText = await submitRes.text().catch(() => "");
      console.error("[MuAPI gpt-5-mini Error]:", submitRes.status, errText);
      return NextResponse.json({ 
        error: `AI generation submission failed: ${errText || submitRes.statusText}` 
      }, { status: submitRes.status });
    }

    const submitData = await submitRes.json();
    const requestId = submitData.request_id || submitData.id;

    if (!requestId) {
      return NextResponse.json({ error: "No request ID returned from AI provider." }, { status: 502 });
    }

    // 2. Poll for the prediction result
    const maxAttempts = 30; // 30 * 1.5s = 45s max
    let attempts = 0;
    let rawOutput = null;

    while (attempts < maxAttempts) {
      await new Promise((r) => setTimeout(r, 1500));
      attempts++;

      try {
        const pollRes = await fetch(`https://api.muapi.ai/api/v1/predictions/${requestId}/result`, {
          headers: {
            "x-api-key": apiKey
          }
        });

        if (pollRes.ok) {
          const pollData = await pollRes.json();

          if (pollData.status === "completed" || pollData.status === "succeeded") {
            // Check possible output shapes
            if (Array.isArray(pollData.outputs) && pollData.outputs.length > 0) {
              rawOutput = pollData.outputs[0];
            } else if (pollData.output) {
              rawOutput = typeof pollData.output === "string" ? pollData.output : JSON.stringify(pollData.output);
            } else if (pollData.result) {
              rawOutput = typeof pollData.result === "string" ? pollData.result : JSON.stringify(pollData.result);
            }
            break;
          } else if (pollData.status === "failed") {
            throw new Error(pollData.error || "AI generation failed during processing.");
          }
        }
      } catch (pollErr) {
        console.warn(`[MuAPI Poll Attempt ${attempts} Error]:`, pollErr.message);
      }
    }

    if (!rawOutput) {
      return NextResponse.json({ error: "AI generation timed out. Please try again." }, { status: 504 });
    }

    // 3. Clean and parse JSON from the AI response
    let parsed = null;
    try {
      // Remove any markdown code blocks if the model wrapped output in ```json ... ```
      let cleaned = rawOutput.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
      }
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.warn("JSON parsing failed, extracting with fallback:", parseErr.message);
      // Fallback extraction
      parsed = {
        title: rawOutput.slice(0, 80).split("\n")[0].replace(/^[#"*\s]+/, ""),
        description: rawOutput,
        tags: "ai, socialmedia, content"
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        title: parsed.title || "",
        description: parsed.description || "",
        tags: parsed.tags || ""
      }
    });

  } catch (error) {
    console.error("[AI Generate Route Error]:", error);
    return NextResponse.json({ error: error.message || "An unexpected error occurred." }, { status: 500 });
  }
}
