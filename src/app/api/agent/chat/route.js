import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import config from "@/lib/config";

const PLATFORM_NAMES = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
  x_twitter: "X (Twitter)",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  threads: "Threads",
  pinterest: "Pinterest",
};

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const body = await req.json();
    let { 
      message, 
      messages = [], 
      history = [], 
      selectedChannels = [], 
      targetChannels = [], 
      threadId 
    } = body;

    // Support targetChannels alias
    const activeChannels = Array.isArray(selectedChannels) && selectedChannels.length > 0 
      ? selectedChannels 
      : (Array.isArray(targetChannels) ? targetChannels : []);

    // If messages array was passed, extract current message and prior history
    if (!message && Array.isArray(messages) && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      message = lastMsg?.content || "";
      if (!history || history.length === 0) {
        history = messages.slice(0, -1);
      }
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message content cannot be empty." }, { status: 400 });
    }

    const apiKey = config.ai.apiKey;
    if (!apiKey) {
      return NextResponse.json(
        { error: "MuAPI API key is not configured. Please check MUAPIAPP_API_KEY in .env." },
        { status: 500 }
      );
    }

    // 1. Format the target channel context
    const channelNames = activeChannels.map((k) => PLATFORM_NAMES[k] || k).join(", ");
    const channelContext = channelNames ? `Active Target Channels: ${channelNames}` : "Target Channels: All connected social channels";

    // 2. Format conversation history into system_prompt so gpt-5-mini remembers previous messages
    // Strictly limited to last 10 messages to minimize credit consumption
    const formattedHistory = (history || [])
      .slice(-10)
      .map((item) => {
        const roleName = item.role === "user" ? "User" : "Agent";
        // Trim each message to max 800 chars to prevent credit bloat
        const content = typeof item.content === "string" 
          ? (item.content.length > 800 ? item.content.slice(0, 800) + "..." : item.content)
          : "";
        return `${roleName}: ${content}`;
      })
      .join("\n\n");

    const systemPrompt = `You are an elite, highly creative AI Social Media Manager & Marketing Agent for this workspace.
You help creators, founders, and businesses craft viral, high-converting social media content, build multi-channel campaigns, and schedule posts.

${channelContext}

CAPABILITIES & RESPONSIBILITIES:
1. Brainstorm and write platform-tailored social copy (hooks, captions, descriptions, hashtags) respecting each platform's character limits and style (e.g. 280 chars for X, descriptions and tags for YouTube, punchy text for TikTok/Instagram).
2. Remember all context, tone, previous discussion, and brand guidelines shared during this conversation.
3. When the user asks you to write, create, or schedule a post, provide the conversational explanation AND ALSO include a JSON block marked with \`\`\`json containing the structured post data so the user can schedule it in 1-click.

STRUCTURED POST FORMAT:
When suggesting a post ready for scheduling, include:
\`\`\`json
{
  "action": "schedule_post",
  "platforms": ${JSON.stringify(activeChannels.length > 0 ? activeChannels : ["youtube"])},
  "title": "A captivating, clickable title or headline",
  "description": "The complete post text, formatted with clean line breaks and emojis",
  "tags": "relevant, comma, separated, hashtags"
}
\`\`\`

PREVIOUS CONVERSATION HISTORY (Remember these past messages):
${formattedHistory ? formattedHistory : "None (this is the start of the conversation)"}
`;

    // 3. Submit generation request to MuAPI gpt-5-mini
    const submitRes = await fetch("https://api.muapi.ai/api/v1/gpt-5-mini", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        prompt: message.trim(),
        system_prompt: systemPrompt,
      }),
    });

    if (!submitRes.ok) {
      const errText = await submitRes.text().catch(() => "");
      console.error("[MuAPI Agent gpt-5-mini Error]:", submitRes.status, errText);
      return NextResponse.json(
        { error: `AI agent submission failed: ${errText || submitRes.statusText}` },
        { status: submitRes.status }
      );
    }

    const submitData = await submitRes.json();
    const requestId = submitData.request_id || submitData.id;

    if (!requestId) {
      return NextResponse.json({ error: "No request ID returned from AI provider." }, { status: 502 });
    }

    // 4. Poll for prediction result
    const maxAttempts = 30; // 30 * 1.5s = 45s max
    let attempts = 0;
    let rawOutput = null;

    while (attempts < maxAttempts) {
      await new Promise((r) => setTimeout(r, 1500));
      attempts++;

      try {
        const pollRes = await fetch(`https://api.muapi.ai/api/v1/predictions/${requestId}/result`, {
          headers: {
            "x-api-key": apiKey,
          },
        });

        if (pollRes.ok) {
          const pollData = await pollRes.json();

          if (pollData.status === "completed" || pollData.status === "succeeded") {
            if (Array.isArray(pollData.outputs) && pollData.outputs.length > 0) {
              rawOutput = pollData.outputs[0];
            } else if (pollData.output) {
              rawOutput = typeof pollData.output === "string" ? pollData.output : JSON.stringify(pollData.output);
            } else if (pollData.result) {
              rawOutput = typeof pollData.result === "string" ? pollData.result : JSON.stringify(pollData.result);
            }
            break;
          } else if (pollData.status === "failed") {
            throw new Error(pollData.error || "Agent generation failed during processing.");
          }
        }
      } catch (pollErr) {
        console.warn(`[MuAPI Agent Poll Attempt ${attempts} Error]:`, pollErr.message);
      }
    }

    if (!rawOutput) {
      return NextResponse.json({ error: "AI agent request timed out. Please try again." }, { status: 504 });
    }

    // 5. Extract structured post proposal(s) if present in the output
    let postProposal = null;
    let postProposals = [];
    let cleanedReply = rawOutput;

    const jsonMatch = rawOutput.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        const parsedJson = JSON.parse(jsonMatch[1]);
        
        const normalizeProposal = (item) => ({
          platforms: Array.isArray(item.platforms) && item.platforms.length > 0
            ? item.platforms
            : (activeChannels.length > 0 ? activeChannels : ["youtube"]),
          title: item.title || "",
          description: item.description || "",
          tags: item.tags || "",
        });

        if (Array.isArray(parsedJson) && parsedJson.length > 0) {
          postProposals = parsedJson.map(normalizeProposal);
          postProposal = postProposals[0];
          // Remove the raw JSON block from the conversational reply
          cleanedReply = rawOutput.replace(/```(?:json)?\s*[\s\S]*?\s*```/g, "").trim();
        } else if (parsedJson && (parsedJson.action === "schedule_post" || parsedJson.title || parsedJson.description)) {
          postProposal = normalizeProposal(parsedJson);
          postProposals = [postProposal];
          // Remove the raw JSON block from the conversational reply
          cleanedReply = rawOutput.replace(/```(?:json)?\s*[\s\S]*?\s*```/g, "").trim();
        }
      } catch (err) {
        console.warn("[Agent JSON parse warning]:", err.message);
      }
    }

    return NextResponse.json({
      success: true,
      reply: cleanedReply || rawOutput,
      postProposal,
      postProposals,
      threadId,
    });
  } catch (error) {
    console.error("[AGENT_CHAT_ERROR]", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred in the Agent." },
      { status: 500 }
    );
  }
}
