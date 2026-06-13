/**
 * Centralized configuration for the AI Prompt Architect application.
 */

const TARGET_MODELS = [
  { id: "chatgpt", name: "ChatGPT (GPT-4o/5)", iconName: "FaMagic", placeholder: "Optimize a Python scraper, a creative storytelling assistant..." },
  { id: "claude", name: "Claude (Claude 3.5 Sonnet)", iconName: "FaBrain", placeholder: "Build an executive email summarizer, full stack agent instructions..." },
  { id: "midjourney", name: "Midjourney / DALL-E", iconName: "FaPalette", placeholder: "Cyberpunk street style photography, glassmorphic UI vector assets..." },
  { id: "stable_diffusion", name: "Stable Diffusion / Flux", iconName: "FaCamera", placeholder: "High fidelity portrait render, cinematic volumetric lighting..." },
];

const PROMPT_STYLES = [
  { id: "professional", name: "Professional / Standard", emoji: "💼", promptPart: "expertly structured, precise constraints, professional context, and clear target outputs" },
  { id: "creative", name: "Creative / Narrative", emoji: "🎨", promptPart: "richly descriptive, immersive storytelling setups, fluid narrative guidance, and high imaginative leeway" },
  { id: "academic", name: "Academic / Analytical", emoji: "📚", promptPart: "highly analytical, logical structured breakdowns, academic rigorous requirements, and citation guidance" },
  { id: "technical", name: "Technical / Coding", emoji: "💻", promptPart: "strict markdown formatting, coding clean-code best practices, debugging constraints, and structured API boundaries" },
];

const ANY_LLM_MODELS = [
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash", premium: false, icon: "⚡" },
  { id: "google/gemini-2.0-flash-001", name: "Gemini 2.0 Flash", premium: false, icon: "⚡" },
  { id: "google/gemini-2.0-flash-lite-001", name: "Gemini 2.0 Flash Lite", premium: false, icon: "⚡" },
  { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro", premium: true, icon: "✨" },
  { id: "anthropic/claude-3.7-sonnet", name: "Claude 3.7 Sonnet", premium: true, icon: "✨" },
  { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", premium: true, icon: "✨" },
  { id: "anthropic/claude-3-haiku", name: "Claude 3 Haiku", premium: false, icon: "⚡" },
  { id: "openai/gpt-4o", name: "GPT-4o", premium: true, icon: "✨" },
  { id: "openai/gpt-5-chat", name: "GPT-5 Chat", premium: true, icon: "✨" },
  { id: "meta-llama/llama-4-maverick", name: "Llama 4 Maverick", premium: false, icon: "⚡" },
  { id: "meta-llama/llama-4-scout", name: "Llama 4 Scout", premium: false, icon: "⚡" },
];

const config = {
  appName: "Prompt Architect",
  auth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    secret: process.env.NEXTAUTH_SECRET,
    url: process.env.NEXTAUTH_URL || "http://localhost:3000",
    webhook_url: process.env.WEBHOOK_URL || process.env.NEXTAUTH_URL || "http://localhost:3000",
  },
  stripe: {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    plans: {
      basic: {
        id: "basic",
        name: "Basic Pack",
        credits: 1000,
        price: 500,
        description: "1,000 Credits — generate and refine up to 250 expert prompts.",
      },
      standard: {
        id: "standard",
        name: "Standard Pack",
        credits: 2000,
        price: 1000,
        description: "2,000 Credits — generate and refine up to 500 expert prompts.",
      },
      pro: {
        id: "pro",
        name: "Pro Pack",
        credits: 4000,
        price: 2000,
        description: "4,000 Credits — generate and refine up to 1,000 expert prompts.",
      },
      business: {
        id: "business",
        name: "Business Pack",
        credits: 10000,
        price: 5000,
        description: "10,000 Credits — generate and refine up to 2,500 expert prompts.",
      },
    },
  },
  ai: {
    apiKey: process.env.MU_API_KEY,
    pollEndpoint: (requestId) =>
      `https://api.muapi.ai/api/v1/predictions/${requestId}/result`,
    model: {
      id: "any-llm",
      name: "Any LLM (Text to Text)",
      creditCost: 4, // Charged at 4 credits per generation/refinement
      endpoint: "https://api.muapi.ai/api/v1/any-llm-models",
      description: "Generates high-fidelity, optimized, expert prompt frameworks.",
    },
    targets: TARGET_MODELS,
    styles: PROMPT_STYLES,
    modelsList: ANY_LLM_MODELS,
  },
  db: {
    url: process.env.DATABASE_URL,
  },
};

export default config;
export { TARGET_MODELS, PROMPT_STYLES, ANY_LLM_MODELS };
