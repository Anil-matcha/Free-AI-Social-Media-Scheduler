import { prisma } from "@/lib/prisma";
import { UserService } from "./user";
import config from "@/lib/config";

export const AIService = {
  async generateCardHTML(userId, cardId, userPrompt) {
    const cost = config.ai.generationCost;
    
    // 1. Deduct credits first
    await UserService.deductCredits(userId, cost);

    const card = await prisma.businessCard.findUnique({
      where: { id: cardId }
    });

    if (!card) {
      throw new Error("Business card not found");
    }

    const apiKey = config.ai.apiKey;
    if (!apiKey || apiKey.includes("your_") || apiKey.trim() === "") {
      console.warn("MUAPIAPP_API_KEY is not configured or invalid. Falling back to local Mock HTML Generation.");
      const request_id = `mock_${Date.now()}`;
      await prisma.businessCard.update({
        where: { id: cardId },
        data: {
          htmlContent: "Generating custom layout...",
          userPrompt,
          templateId: "custom"
        }
      });
      return request_id;
    }

    // Prepare profile context for LLM
    const profileText = `
Name: ${card.name}
Title: ${card.title}
Company: ${card.company}
Bio: ${card.bio || "Not provided"}
Phone: ${card.phone || "Not provided"}
Email: ${card.email || "Not provided"}
Website: ${card.website || "Not provided"}
Address: ${card.address || "Not provided"}
Social Links: ${card.socialLinks}
`;

    const systemPrompt = `You are a world-class premium web designer and UI engineer. Your task is to generate a custom digital business card in clean Tailwind CSS. 
You must respond with ONLY raw, valid HTML markup (no markdown code blocks, no backticks, no wrap, just the HTML string). 
The card should be a responsive, modern component styled using Tailwind CSS classes. It must look stunning, highly professional, and leverage premium elements.
Ensure it uses all of the provided user details (name, title, company, bio, contacts, and social links).
Include a clean card wrapper with nice spacing, typography, and interactive hover effects. Do not include external JS or stylesheet links except standard Tailwind config classes. Use standard lucide-react-style SVG icons for contact details where appropriate.
If the user provides a custom theme prompt, align the design style with it (e.g. "futuristic cyberpunk", "retro terminal", "minimalist organic").`;

    const fullUserPrompt = `Generate a premium digital business card.
Profile Details:
${profileText}

Custom Styling Prompt:
${userPrompt || "Make it look highly modern, premium, and creative."}
`;

    try {
      const submitRes = await fetch("https://api.muapi.ai/api/v1/any-llm-models", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          prompt: fullUserPrompt,
          system_prompt: systemPrompt,
          model: "openai/gpt-4o",
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

      // Update card with user prompt
      await prisma.businessCard.update({
        where: { id: cardId },
        data: {
          userPrompt,
          htmlContent: "Generating custom layout..."
        }
      });

      return request_id;
    } catch (err) {
      console.warn("AI generation submission failed, falling back to mock. Error:", err.message);
      const request_id = `mock_fallback_${Date.now()}`;
      await prisma.businessCard.update({
        where: { id: cardId },
        data: {
          userPrompt,
          htmlContent: "Generating custom layout..."
        }
      });
      return request_id;
    }
  },

  async checkGenerationStatus(cardId, requestId) {
    const card = await prisma.businessCard.findUnique({
      where: { id: cardId }
    });

    if (!card) return { status: "failed", error: "Card not found" };

    // Handle mock requests
    if (requestId && requestId.startsWith("mock")) {
      // Simulate delay
      const mockHTML = `
<div class="w-full max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative font-sans p-8 transition-transform duration-300 hover:scale-[1.01]">
  <!-- Theme: Custom AI Generated Mock -->
  <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500"></div>
  
  <div class="flex items-center gap-6 mb-8">
    <div class="relative w-20 h-20 rounded-2xl overflow-hidden border border-slate-700 bg-slate-800 flex items-center justify-center text-4xl shadow-inner font-bold text-indigo-400">
      ${card.avatar ? `<img src="${card.avatar}" alt="${card.name}" class="w-full h-full object-cover" />` : card.name.charAt(0)}
    </div>
    <div>
      <h2 class="text-2xl font-extrabold tracking-tight text-white mb-1">${card.name}</h2>
      <p class="text-sm font-semibold tracking-wide uppercase text-indigo-400 mb-0.5">${card.title}</p>
      <p class="text-xs text-slate-400 font-medium">${card.company}</p>
    </div>
  </div>

  <div class="bg-slate-800/40 rounded-2xl p-5 mb-8 border border-slate-800/60 backdrop-blur-sm">
    <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">About Me</h3>
    <p class="text-sm text-slate-300 leading-relaxed font-light">${card.bio || "Creative professional pushing boundaries and exploring AI-augmented systems."}</p>
  </div>

  <div class="space-y-4 mb-8">
    <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Contact Details</h3>
    ${card.email ? `
    <div class="flex items-center gap-3 text-slate-300 hover:text-white transition-colors duration-200">
      <div class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 text-xs">✉</div>
      <a href="mailto:${card.email}" class="text-sm font-light hover:underline">${card.email}</a>
    </div>` : ""}
    ${card.phone ? `
    <div class="flex items-center gap-3 text-slate-300 hover:text-white transition-colors duration-200">
      <div class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 text-xs">📞</div>
      <a href="tel:${card.phone}" class="text-sm font-light hover:underline">${card.phone}</a>
    </div>` : ""}
    ${card.website ? `
    <div class="flex items-center gap-3 text-slate-300 hover:text-white transition-colors duration-200">
      <div class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 text-xs">🌐</div>
      <a href="${card.website}" target="_blank" class="text-sm font-light hover:underline">${card.website}</a>
    </div>` : ""}
    ${card.address ? `
    <div class="flex items-center gap-3 text-slate-300 hover:text-white transition-colors duration-200">
      <div class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 text-xs">📍</div>
      <span class="text-sm font-light">${card.address}</span>
    </div>` : ""}
  </div>

  <div class="border-t border-slate-800 pt-6">
    <div class="flex justify-center gap-4">
      <span class="text-xs font-semibold text-slate-500 uppercase tracking-widest mr-2 self-center">AI Prompt:</span>
      <span class="text-xs italic text-indigo-300 bg-indigo-950/40 px-3 py-1 rounded-full border border-indigo-900/50">${card.userPrompt || "Modern Dark Tech Theme"}</span>
    </div>
  </div>
</div>
`;

      const updated = await prisma.businessCard.update({
        where: { id: cardId },
        data: {
          htmlContent: mockHTML,
          templateId: "custom"
        }
      });

      return { status: "completed", card: updated };
    }

    const apiKey = config.ai.apiKey;
    if (!apiKey) return { status: "failed", error: "API Key missing" };

    try {
      const res = await fetch(`https://api.muapi.ai/api/v1/predictions/${requestId}/result`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        }
      });

      if (!res.ok) {
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
          throw new Error("Empty HTML generated");
        }

        // Clean markdown wraps
        let htmlContent = textResult.trim();
        if (htmlContent.startsWith("```html")) {
          htmlContent = htmlContent.substring(7);
        }
        if (htmlContent.startsWith("```")) {
          htmlContent = htmlContent.substring(3);
        }
        if (htmlContent.endsWith("```")) {
          htmlContent = htmlContent.substring(0, htmlContent.length - 3);
        }
        htmlContent = htmlContent.trim();

        const updated = await prisma.businessCard.update({
          where: { id: cardId },
          data: {
            htmlContent,
            templateId: "custom"
          }
        });

        return { status: "completed", card: updated };
      } else if (state === "failed") {
        // Refund credits
        const cost = config.ai.generationCost;
        await UserService.addCredits(card.userId, cost);
        
        await prisma.businessCard.update({
          where: { id: cardId },
          data: {
            htmlContent: null,
            templateId: "classic" // fallback
          }
        });
        return { status: "failed", error: result.error || "Generation prediction failed" };
      }
    } catch (e) {
      console.error("Error checking AI status:", e);
    }

    return { status: "processing" };
  },

  async askChatbot(card, query, chatHistory = []) {
    const apiKey = config.ai.apiKey;

    const profileContext = `
You are the AI Chatbot Assistant for ${card.name}. You represent him/her in a digital format. 
Answer visitor questions about ${card.name} using the following profile information:

Name: ${card.name}
Job Title: ${card.title}
Company: ${card.company}
Bio / About: ${card.bio || "Not provided"}
Phone: ${card.phone || "Not provided"}
Email: ${card.email || "Not provided"}
Website: ${card.website || "Not provided"}
Address: ${card.address || "Not provided"}
Social Links: ${card.socialLinks}

Be professional, helpful, polite, and answer directly on behalf of ${card.name} (first person "I" or third person, but keep it personal).
If the visitor asks for information that is not in the profile, politely reply that you do not have that specific detail but they can get in touch directly via email or phone. Keep answers concise.
`;

    if (!apiKey || apiKey.includes("your_") || apiKey.trim() === "") {
      // Return a quick mock reply locally
      return new Promise((resolve) => {
        setTimeout(() => {
          const queryLower = query.toLowerCase();
          let reply = `Hi! Thanks for asking. As the AI assistant for ${card.name}, I can tell you that ${card.name} is a ${card.title} at ${card.company}. `;
          if (queryLower.includes("email") || queryLower.includes("contact")) {
            reply += card.email ? `You can email me at ${card.email}.` : "No email contact is listed on my card.";
          } else if (queryLower.includes("phone") || queryLower.includes("call")) {
            reply += card.phone ? `You can reach me at ${card.phone}.` : "No phone number is listed on my card.";
          } else if (queryLower.includes("website") || queryLower.includes("site")) {
            reply += card.website ? `Check out my site at ${card.website}.` : "No custom website is listed.";
          } else {
            reply += card.bio ? `Here is a bit about me: ${card.bio}` : "Feel free to reach out via the links below!";
          }
          resolve(reply);
        }, 1000);
      });
    }

    // Build chat conversation context
    const messages = chatHistory.map(m => `${m.role === 'user' ? 'Visitor' : 'Assistant'}: ${m.content}`).join("\n");
    const prompt = `
Conversation History:
${messages}

Visitor: ${query}
Assistant:
`;

    try {
      const submitRes = await fetch("https://api.muapi.ai/api/v1/any-llm-models", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          prompt,
          system_prompt: profileContext,
          model: "openai/gpt-4o",
          reasoning: false,
          priority: "throughput",
          temperature: 0.7,
          max_tokens: 300
        }),
      });

      if (!submitRes.ok) {
        throw new Error("Chat submit failed");
      }

      const { request_id } = await submitRes.json();
      if (!request_id) throw new Error("No request id");

      // Synchronous internal poll for the chat reply so the user gets a seamless answer
      let reply = "";
      for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 1000));
        const checkRes = await fetch(`https://api.muapi.ai/api/v1/predictions/${request_id}/result`, {
          headers: { "x-api-key": apiKey }
        });
        if (checkRes.ok) {
          const result = await checkRes.json();
          const state = result.status || result.state;
          if (state === "completed" || state === "succeeded") {
            const outputs = result.outputs || [];
            const rawOutput = outputs[0] || result.output;
            reply = typeof rawOutput === "string" ? rawOutput : (rawOutput?.text || result.result || "");
            break;
          } else if (state === "failed") {
            break;
          }
        }
      }

      if (reply) return reply.trim();
      return `I'm having a bit of trouble connecting to my knowledge base right now. Please email me directly at ${card.email || "my address"}!`;
    } catch (err) {
      console.error("Chatbot API call failed, falling back to local. Error:", err.message);
      return `Hi! As the AI assistant for ${card.name}, I can verify that I work as a ${card.title} at ${card.company}. Contact me directly via email at ${card.email || "my email"}!`;
    }
  }
};
