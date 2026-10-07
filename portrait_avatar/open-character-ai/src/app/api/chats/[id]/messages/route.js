import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Utility sleep helper
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    let messages = await prisma.message.findMany({
      where: { chatId: id },
      orderBy: { createdAt: "asc" },
    });

    // If chat room is blank, seed the character's customized greeting message
    if (messages.length === 0) {
      const chat = await prisma.chat.findUnique({
        where: { id },
        include: { character: true },
      });

      if (!chat) {
        return NextResponse.json({ error: "Chat thread not found" }, { status: 404 });
      }

      const greetingMessage = await prisma.message.create({
        data: {
          chatId: id,
          role: "assistant",
          content: chat.character.greeting,
        },
      });

      messages = [greetingMessage];
    }

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("[MESSAGES_GET_ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  let cost = 1;
  let creditsDeducted = false;
  let userId = null;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = session.user.id;

    const { id } = await params;
    const body = await req.json();
    const { content, imageUrl, model = "google/gemini-2.5-flash", temperature = 1.0, maxTokens = 2048, reasoning = false } = body;

    if (!content) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    // 1. Fetch user's credit balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User profile not found in database" }, { status: 404 });
    }

    // Enforce a strict flat fee of 2 credits per message as requested
    cost = 2;

    if (user.credits < cost) {
      return NextResponse.json({ error: `Insufficient credits. This requires ${cost} credits but you only have ${user.credits} remaining.` }, { status: 402 });
    }

    // 2. Fetch the corresponding Character's configured system prompt
    const chat = await prisma.chat.findUnique({
      where: { id },
      include: { character: true },
    });

    if (!chat) {
      return NextResponse.json({ error: "Chat thread not found" }, { status: 404 });
    }

    // Fetch the last 10 messages for conversational context
    const previousMessages = await prisma.message.findMany({
      where: { chatId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    
    // Reverse to chronological order
    previousMessages.reverse();

    // Format the conversational history
    let historyBlock = "";
    if (previousMessages.length > 0) {
      const formattedHistory = previousMessages.map(m => `${m.role === 'user' ? 'User' : chat.character.name}: ${m.content}`).join("\n\n");
      historyBlock = `\n\n### RECENT CONVERSATION HISTORY ###\n${formattedHistory}\n\n`;
    }

    const enhancedSystemPrompt = `${chat.character.systemPrompt}${historyBlock}
IMPORTANT:
- Reply to the USER's latest message naturally based on the above recent conversation history.
- Do not repeat the history.
- You are roleplaying as ${chat.character.name}. Write your response directly in first-person as ${chat.character.name}.
- Do NOT start your response with "User: ...", "${chat.character.name}: ...", or similar labels. Just output the dialogue itself.`;

    // 3. Deduct credits first (Transaction protection)
    await prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: cost } },
    });
    creditsDeducted = true;

    // 4. Save the User's submitted message to SQLite
    const userMessage = await prisma.message.create({
      data: {
        chatId: id,
        role: "user",
        content,
        imageUrl,
      },
    });

    // 5. Connect to MuAPI to trigger upstream model generations
    const apiKey = process.env.MU_API_KEY;
    if (!apiKey) {
      throw new Error("MuAPI key is missing in environment variables.");
    }

    // Select endpoint depending on whether an image was attached or not
    const isVision = !!imageUrl;
    const apiUrl = isVision 
      ? "https://api.muapi.ai/api/v1/openrouter-vision" 
      : "https://api.muapi.ai/api/v1/any-llm-models";

    const payload = {
      prompt: content,
      system_prompt: enhancedSystemPrompt,
      model,
      temperature: parseFloat(temperature),
      max_tokens: parseInt(maxTokens),
      reasoning: !!reasoning,
    };

    if (isVision) {
      payload.images_list = [imageUrl];
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[MUAPI_LLM_ERROR]", errText);
      throw new Error(`Upstream MuAPI error: ${response.statusText}`);
    }

    const data = await response.json();
    const requestId = data.request_id;

    if (!requestId) {
      throw new Error("Did not receive a request_id from upstream server.");
    }

    // 6. Synchronous server-side polling loop to retrieve results (Infinite polling)
    let completedText = "";
    let status = "processing";
    const tickDelay = 1500;

    while (status === "processing") {
      await delay(tickDelay);

      const checkRes = await fetch(`https://api.muapi.ai/api/v1/predictions/${requestId}/result`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
      });

      if (checkRes.ok) {
        const checkData = await checkRes.json();
        status = checkData.status || checkData.state || "processing";

        if (status === "completed" || status === "succeeded") {
          completedText = checkData.outputs?.[0] || 
                          (typeof checkData.output === "string" ? checkData.output : "") ||
                          checkData.output?.text ||
                          checkData.output?.choices?.[0]?.message?.content ||
                          checkData.response ||
                          "";
          status = "completed"; // normalize
          break;
        } else if (status === "failed") {
          throw new Error("Generation task failed on the upstream serverless system.");
        }
      } else {
        console.warn(`[POLL_TICK_ERROR] Status code: ${checkRes.status}`);
      }
    }

    // 7. Save and commit assistant response
    const assistantMessage = await prisma.message.create({
      data: {
        chatId: id,
        role: "assistant",
        content: completedText || "Hello! How can I help you?",
      },
    });

    return NextResponse.json({
      userMessage,
      assistantMessage,
      remainingCredits: user.credits - cost,
    });

  } catch (error) {
    console.error("[MESSAGES_POST_ERROR]", error);

    // Auto-refund credits to the user if deduction occurred but completion failed
    if (creditsDeducted && userId) {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { credits: { increment: cost } },
        });
        console.log(`[CREDITS_REFUNDED] Refunded ${cost} credits to user ${userId} due to execution error.`);
      } catch (refundError) {
        console.error("[REFUND_FATAL_ERROR]", refundError);
      }
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
