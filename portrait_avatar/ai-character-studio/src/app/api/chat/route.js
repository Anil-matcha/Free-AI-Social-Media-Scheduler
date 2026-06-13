import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import config from "@/lib/config";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const { systemPrompt, messages } = await req.json();

    if (!messages || messages.length === 0) {
      return new NextResponse("Messages are required", { status: 400 });
    }

    const latestMessage = messages[messages.length - 1].content;
    const apiKey = config.ai.apiKey;

    if (!apiKey || apiKey.includes("your_") || apiKey.trim() === "") {
      // Mock chat reply delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const lowerMsg = latestMessage.toLowerCase();
      let reply = "I hear you, adventurer. The cosmic ley lines whisper of your intent. Tell me more.";

      if (lowerMsg.includes("hello") || lowerMsg.includes("hi")) {
        reply = "Hello there! It is a pleasure to make your acquaintance. What brings you to my studio today?";
      } else if (lowerMsg.includes("who are you") || lowerMsg.includes("your name")) {
        reply = "I am the persona crafted by your prompt. Guided by your backstory, I stand ready to assist.";
      } else if (lowerMsg.includes("help") || lowerMsg.includes("do for me")) {
        reply = "I can discuss my backstory, tell you stories, offer advice in alignment with my personality, or help you solve logical challenges!";
      }

      return NextResponse.json({ reply });
    }

    // Call upstream MuAPI Gemini-2.5-Flash model
    try {
      const res = await fetch("https://api.muapi.ai/api/v1/any-llm-models", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey
        },
        body: JSON.stringify({
          prompt: latestMessage,
          system_prompt: systemPrompt,
          model: "google/gemini-2.5-flash",
          reasoning: false,
          priority: "throughput",
          temperature: 0.8,
          max_tokens: null
        })
      });

      if (res.ok) {
        const json = await res.json();
        const outputs = json.outputs || [];
        const reply = outputs[0] || json.output || json.result || "I stand ready to converse.";
        return NextResponse.json({ reply });
      } else {
        console.error("Upstream chat failed with status:", res.status);
      }
    } catch (err) {
      console.error("Upstream chat call exception:", err.message);
    }

    return NextResponse.json({ reply: "I seem to be experiencing a transient neural lag, but I'm listening. Speak again, friend!" });
  } catch (error) {
    console.error("[CHAT_ROUTE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
