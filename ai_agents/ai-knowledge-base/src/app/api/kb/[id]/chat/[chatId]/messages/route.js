import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../../../../lib/auth";
import { prisma } from "../../../../../../../lib/prisma";
import { UserService } from "../../../../../../../lib/services/user";
import config from "../../../../../../../lib/config";

// Helper sleep delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = await params;

    const messages = await prisma.kBMessage.findMany({
      where: {
        chatId: chatId,
        chat: { userId: session.user.id }
      },
      orderBy: { createdAt: "asc" }
    });

    return NextResponse.json({ messages });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  let cost = config.ai.chatQueryCost;
  let creditsDeducted = false;
  let userId = null;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = session.user.id;

    const { id, chatId } = await params;
    const { content, model } = await req.json();

    if (!content || content.trim() === "") {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    // 1. Verify User Credit Balance
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    if (user.credits < cost) {
      return NextResponse.json({
        error: `Insufficient credits. Query requires ${cost} credits, you have ${user.credits}.`
      }, { status: 402 });
    }

    // 2. Fetch Chat session and KB details
    const chat = await prisma.kBChat.findFirst({
      where: { id: chatId, userId: userId },
      include: { knowledgeBase: true }
    });
    if (!chat) {
      return NextResponse.json({ error: "Chat playground session not found" }, { status: 404 });
    }

    // 3. Vector-like Semantic context search
    const sources = await prisma.source.findMany({
      where: { knowledgeBaseId: id }
    });

    let contextBlock = "";
    let matchedSources = [];

    if (sources.length > 0) {
      const keywords = content.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      
      const scoredSources = sources.map(s => {
        let score = 0;
        const body = s.content.toLowerCase();
        const title = s.name.toLowerCase();
        
        if (keywords.length > 0) {
          keywords.forEach(kw => {
            if (body.includes(kw)) score += 2;
            if (title.includes(kw)) score += 5;
          });
        } else {
          score = 1; // fallback
        }
        
        return { source: s, score };
      }).filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score);

      const topMatches = scoredSources.slice(0, 3);
      if (topMatches.length > 0) {
        contextBlock = topMatches.map((item, idx) => {
          matchedSources.push({
            id: item.source.id,
            name: item.source.name,
            type: item.source.type,
            snippet: item.source.content.substring(0, 180) + "..."
          });
          return `[DOCUMENT MATCH ${idx + 1}: ${item.source.name}]\n${item.source.content}\n`;
        }).join("\n---\n");
      }
    }

    // 4. Deduct playground credits
    await UserService.deductCredits(userId, cost);
    creditsDeducted = true;

    // 5. Save user message first
    const userMsg = await prisma.kBMessage.create({
      data: {
        chatId: chatId,
        role: "user",
        content: content.trim()
      }
    });

    // 6. Upstream AI execution with fallback for developer setups
    const apiKey = config.ai.apiKey;
    let completedText = "";

    if (!apiKey || apiKey.includes("your_") || apiKey.trim() === "") {
      // Local Simulator response
      await delay(1200); // realistic feel
      
      if (matchedSources.length > 0) {
        completedText = `Based on the matching files in your "${chat.knowledgeBase.name}" base:
        
I located relevant details inside **"${matchedSources[0].name}"** (${matchedSources[0].type}):

> "${matchedSources[0].snippet}"

How can I help you extract or synthesize further insights from these document entries?`;
      } else {
        completedText = `Hello! I have scanned the documents loaded into your "${chat.knowledgeBase.name}" workspace. 
        
No direct semantic matches were found for your query. Here is a baseline summary from your files:
- Total Sources Trained: **${sources.length}** sources.

Please load more text Q&As or scrap matching web pages in the sources panel to customize the chatbot response!`;
      }
    } else {
      // Fetch recent history of this chat session (excluding the current one we just saved)
      const previousMessages = await prisma.kBMessage.findMany({
        where: { 
          chatId: chatId,
          id: { not: userMsg.id }
        },
        orderBy: { createdAt: "asc" },
        take: 15
      });

      const pastTurns = previousMessages
        .map(m => `${m.role === "user" ? "User" : "Character"}: ${m.content}`)
        .join("\n");

      // Real MuAPI any-llm-models integration
      const systemPrompt = `You are a helpful AI Knowledge Base Agent answering questions about a customized repository.
You must answer queries strictly referencing the custom documents provided below.
If the answer cannot be found in the documents, summarize what you know or ask for clarification, but maintain standard helpful assistant guidelines.

--- CUSTOM DATABASE DOCUMENTS ---
${contextBlock || "No matching reference materials loaded."}
---

--- CONVERSATION HISTORY ---
${pastTurns || "No previous turns."}
---

Answer the user query: "${content}"`;

      const response = await fetch("https://api.muapi.ai/api/v1/any-llm-models", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey
        },
        body: JSON.stringify({
          prompt: content,
          system_prompt: systemPrompt,
          model: model || "google/gemini-2.5-flash",
          temperature: 0.7,
          max_tokens: 1500
        })
      });

      if (!response.ok) {
        throw new Error(`Upstream LLM error: ${response.statusText}`);
      }

      const resJson = await response.json();
      const requestId = resJson.request_id;

      if (!requestId) {
        throw new Error("Missing request ID from MuAPI");
      }

      // Polling loop
      let status = "processing";
      let attempts = 0;
      const maxAttempts = 15;

      while (attempts < maxAttempts) {
        await delay(1500);
        attempts++;

        const pollRes = await fetch(`https://api.muapi.ai/api/v1/predictions/${requestId}/result`, {
          headers: { "x-api-key": apiKey }
        });

        if (pollRes.ok) {
          const pollJson = await pollRes.json();
          status = pollJson.status || "processing";

          if (status === "completed") {
            completedText = pollJson.outputs?.[0] || "";
            break;
          } else if (status === "failed") {
            throw new Error("Upstream LLM execution failed.");
          }
        }
      }

      if (status !== "completed") {
        throw new Error("Upstream request timed out.");
      }
    }

    // 7. Save and commit assistant response
    const assistantMsg = await prisma.kBMessage.create({
      data: {
        chatId: chatId,
        role: "assistant",
        content: completedText || "Success! Let me know if you have other queries.",
        citations: JSON.stringify(matchedSources)
      }
    });

    return NextResponse.json({
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      remainingCredits: user.credits - cost
    });

  } catch (err) {
    console.error("[KB_PLAYGROUND_ERROR]", err);

    // Auto-refund credits to the user if deduction succeeded but generation crashed
    if (creditsDeducted && userId) {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { credits: { increment: cost } }
        });
      } catch (refundErr) {
        console.error("[CREDIT_REFUND_FAIL]", refundErr);
      }
    }

    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
