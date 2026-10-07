import { prisma } from "../prisma";
import { UserService } from "./user";
import config, { TARGET_MODELS, PROMPT_STYLES } from "@/lib/config";

export const AIService = {
  async generatePromptRefinement(userId, sessionId, userMessage, targetModelId, promptStyleId, mode = "refinement", generatorModel = "google/gemini-2.5-flash") {
    const cost = config.ai.model.creditCost; // 4 credits

    // 1. Deduct credits first
    await UserService.deductCredits(userId, cost);

    const targetModel = TARGET_MODELS.find(m => m.id === targetModelId) || TARGET_MODELS[0];
    const promptStyle = PROMPT_STYLES.find(s => s.id === promptStyleId) || PROMPT_STYLES[0];

    // Fetch message history for context
    const pastMessages = await prisma.promptMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
    });

    const apiKey = config.ai.apiKey;
    if (!apiKey || apiKey.includes("your_") || apiKey.trim() === "") {
      console.warn("MU_API_KEY is not configured or invalid. Falling back to local Mock Prompt Architect refinement.");
      const request_id = `mock_${mode === "normal" ? "normal_" : ""}${Date.now()}`;
      
      // Save User Message
      await prisma.promptMessage.create({
        data: {
          sessionId,
          role: "user",
          content: userMessage,
          status: "completed",
        }
      });

      // Create processing Assistant Message
      const assistantMessage = await prisma.promptMessage.create({
        data: {
          sessionId,
          role: "assistant",
          content: "",
          status: "processing",
          requestId: request_id,
        }
      });

      return assistantMessage;
    }

    // Assemble conversational history for prompt
    const historyBlock = pastMessages.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join("\n");

    let systemPrompt = "";
    let userPrompt = "";

    if (mode === "normal") {
      systemPrompt = "You are a helpful, direct, and concise AI assistant.";
      userPrompt = userMessage;
    } else {
      systemPrompt = `You are Prompt Architect, an elite AI prompt engineer specializing in prompt construction, constraint definitions, and roleplay layouts.
Your goal is to help the user design the absolute perfect, optimized prompt for their objective.

Instructions:
1. Review the user's request, targeted at "${targetModel.name}" in a "${promptStyle.name}" format.
2. If this is a new request or the request is vague, ask 2-3 precise, high-value clarifying questions to refine their goals, target tone, output style, and constraints.
3. If you have enough details (after 1-2 conversational rounds or if the user's details are exceptionally detailed), assemble and output the final optimized prompt!
4. The final optimized prompt must be fully structured using professional prompt engineering frameworks (such as CO-STAR, ReAct, or Roleplay constraints), specifying explicit roles, constraints, step-by-step reasoning, and output formats.

Output Structure:
You MUST respond ONLY with a raw, valid JSON object (no markdown block wrapper \`\`\`json, just the raw JSON) matching this structure:
{
  "text": "Your conversational message to the user (e.g. explaining what you refined, asking clarifying questions, or presenting the final prompt).",
  "finalPrompt": "ACT as a... [The actual fully optimized prompt, complete with headers, markdown structures, and constraints. Set this to null if you are still asking clarifying questions and not ready to output the final prompt]"
}`;

      userPrompt = `Target Model: ${targetModel.name}
Preferred Style: ${promptStyle.name}
${promptStyle.promptPart}

Here is the conversational history so far:
${historyBlock}

USER's new message:
${userMessage}

Respond strictly using the required JSON format:`;
    }

    try {
      // Create user message in database first
      await prisma.promptMessage.create({
        data: {
          sessionId,
          role: "user",
          content: userMessage,
          status: "completed",
        }
      });

      const submitRes = await fetch("https://api.muapi.ai/api/v1/any-llm-models", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          prompt: userPrompt,
          system_prompt: systemPrompt,
          model: generatorModel,
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

      // Create assistant message in 'processing' status
      const assistantMessage = await prisma.promptMessage.create({
        data: {
          sessionId,
          role: "assistant",
          content: "",
          status: "processing",
          requestId: request_id,
        }
      });

      return assistantMessage;
    } catch (err) {
      console.warn("AI Generation failed. Falling back to local Mock Prompt Architect refinement. Error:", err.message);
      
      // Save user message if not already saved
      const userExists = await prisma.promptMessage.findFirst({
        where: { sessionId, role: "user", content: userMessage },
        orderBy: { createdAt: "desc" },
      });
      if (!userExists) {
        await prisma.promptMessage.create({
          data: {
            sessionId,
            role: "user",
            content: userMessage,
            status: "completed",
          }
        });
      }

      const request_id = `mock_fallback_${Date.now()}`;
      const assistantMessage = await prisma.promptMessage.create({
        data: {
          sessionId,
          role: "assistant",
          content: "",
          status: "processing",
          requestId: request_id,
        }
      });

      return assistantMessage;
    }
  },

  async checkStatus(requestId) {
    const message = await prisma.promptMessage.findUnique({
      where: { requestId }
    });

    if (!message) return null;

    if (message.status === "completed") {
      return { status: "completed", message };
    }

    if (message.status === "failed") {
      return { status: "failed", error: "Generation failed" };
    }

    // Check if it's a mock request (starts with 'mock_')
    if (requestId && requestId.startsWith("mock_")) {
      const elapsed = Date.now() - new Date(message.createdAt).getTime();
      if (elapsed < 3000) {
        return { status: "processing" };
      }

      // Retrieve previous messages to see if it's the first assistant message or subsequent
      const siblings = await prisma.promptMessage.findMany({
        where: { sessionId: message.sessionId },
        orderBy: { createdAt: "asc" },
      });

      const userMessages = siblings.filter(s => s.role === "user");
      const isFirstRound = userMessages.length <= 1;

      let text = "";
      let finalPrompt = null;
      const isNormal = requestId.includes("_normal_");

      if (isNormal) {
        text = `This is a clean, direct text response from the selected LLM (Mock fallback) for your query: "${userMessages[userMessages.length - 1]?.content || ""}". It does not use the Prompt Architect refinement wrapper.`;
      } else if (isFirstRound) {
        const lastUserContent = userMessages[0]?.content || "my prompt";
        text = `Hello! I am your Prompt Architect. I see you want to build: **"${lastUserContent}"**.\n\nTo help me engineer the absolute best prompt, could you clarify:\n1. Who is the target audience or what specific persona should the AI adopt?\n2. Are there any particular formatting rules or structures (e.g. JSON, bullet list, table) you prefer?`;
      } else {
        const goal = userMessages[0]?.content || "my prompt";
        text = `Thank you for the details! I have successfully synthesized your constraints. I refined the instructions to include explicit boundaries, contextual triggers, and a detailed roleplay persona. Below is your optimized prompt frame!`;
        finalPrompt = `# 🧠 SYSTEM ROLEPLAY PROMPT: ${goal.toUpperCase()}

## 🎭 ROLE & CONTEXT
Act as a world-class domain specialist and prompt execution engine. Your objective is to deliver expert results on the topic: "${goal}".

## ⚙️ INSTRUCTIONS & CORE WORKFLOW
1. Parse the user inputs and clarify the intent of the execution.
2. Emphasize analytical rigor: avoid high-level advice or superficial lists.
3. Formulate replies with complete, structurally sound paragraph layouts.

## 🚫 EXPLICIT CONSTRAINTS
- Never return incomplete snippets or placeholders.
- Maintain highly structured Markdown formatting.
- Ensure the tone remains authoritative, descriptive, and actionable.

## 📝 OUTPUT TARGET
Deliver an exhaustive, ready-to-run execution plan tailored to the user's details.`;
      }

      const parsedJSON = isNormal ? text : JSON.stringify({ text, finalPrompt });
      const updated = await prisma.promptMessage.update({
        where: { id: message.id },
        data: {
          content: parsedJSON,
          status: "completed",
          isFinalPrompt: !isNormal && !!finalPrompt,
        }
      });

      return { status: "completed", message: updated };
    }

    const apiKey = config.ai.apiKey;
    if (!apiKey) throw new Error("MU_API_KEY is not configured");

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

        // Clean markdown wraps
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

        // Validate JSON
        let parsed = {};
        try {
          parsed = JSON.parse(jsonStr);
        } catch (e) {
          console.warn("Failed to parse AI output as JSON, fallback to standard wrapping:", e);
          parsed = {
            text: textResult,
            finalPrompt: null,
          };
        }

        const isFinal = !!parsed.finalPrompt;

        const updated = await prisma.promptMessage.update({
          where: { id: message.id },
          data: {
            content: JSON.stringify(parsed),
            status: "completed",
            isFinalPrompt: isFinal,
          }
        });

        return { status: "completed", message: updated };
      } else if (state === "failed") {
        const errorMsg = result.error || "Prediction failed";
        await prisma.promptMessage.update({
          where: { id: message.id },
          data: {
            status: "failed",
          }
        });

        // Refund credits
        await UserService.addCredits(message.userId, cost);
        return { status: "failed", error: errorMsg };
      }
    } catch (e) {
      console.error("Polling error in checkStatus:", e);
    }

    return { status: "processing" };
  }
};
