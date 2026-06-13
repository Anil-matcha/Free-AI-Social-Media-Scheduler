/**
 * Centralized configuration for the AI Social Post Generator application.
 */

const SOCIAL_PLATFORMS = [
  { id: "linkedin", name: "LinkedIn", iconName: "FaLinkedin", color: "text-[#0a66c2]", placeholder: "Professional growth, framework sheets..." },
  { id: "twitter", name: "Twitter / X", iconName: "FaTwitter", color: "text-zinc-300", placeholder: "Punchy ideas, execution threads..." },
  { id: "facebook", name: "Facebook", iconName: "FaFacebook", color: "text-[#1877f2]", placeholder: "Community reviews, friendly tips..." },
  { id: "instagram", name: "Instagram", iconName: "FaInstagram", color: "text-[#e1306c]", placeholder: "Visual banners, call to action bio..." },
  { id: "reddit", name: "Reddit", iconName: "FaReddit", color: "text-[#ff4500]", placeholder: "Subreddit questions, detailed breakdowns..." },
  { id: "line", name: "Line", iconName: "FaLine", color: "text-[#06c755]", placeholder: "Broadcast messages, social updates..." },
];

const SOCIAL_TONES = [
  { id: "professional", name: "Professional", emoji: "💼", promptPart: "expertly polished, business-oriented, authoritative, and corporate tone" },
  { id: "casual", name: "Casual", emoji: "☕", promptPart: "friendly, conversational, approachable, and warm tone" },
  { id: "inspirational", name: "Inspirational", emoji: "🚀", promptPart: "uplifting, motivating, thought-provoking, and high-energy tone" },
  { id: "humorous", name: "Humorous", emoji: "🎭", promptPart: "witty, entertaining, clever, funny, and light-hearted tone" },
  { id: "bold", name: "Bold", emoji: "🔥", promptPart: "strong, assertive, disruptive, highly engaging, and confident tone" },
];

const LANGUAGES = [
  { id: "english", name: "English", flag: "🇺🇸" },
  { id: "spanish", name: "Spanish", flag: "🇪🇸" },
  { id: "french", name: "French", flag: "🇫🇷" },
  { id: "german", name: "German", flag: "🇩🇪" },
  { id: "italian", name: "Italian", flag: "🇮🇹" },
  { id: "portuguese", name: "Portuguese", flag: "🇵🇹" },
  { id: "chinese", name: "Chinese", flag: "🇨🇳" },
  { id: "japanese", name: "Japanese", flag: "🇯🇵" },
];

const LENGTHS = [
  { id: "short", name: "Short (punchy, under 280 chars)", limitPrompt: "strictly short, under 280 characters to fit in a single tweet" },
  { id: "medium", name: "Medium (highly detailed, 280-800 chars)", limitPrompt: "medium length, roughly 280-800 characters with complete paragraphs" },
  { id: "long", name: "Long (comprehensive post/thread, 800+ chars)", limitPrompt: "comprehensive long-form copy, exceeding 800 characters with complete bullet lists" },
];

const config = {
  appName: "Social Post",
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
        description: "1,000 Credits — generate up to 250 high-engagement posts.",
      },
      standard: {
        id: "standard",
        name: "Standard Pack",
        credits: 2000,
        price: 1000,
        description: "2,000 Credits — generate up to 500 high-engagement posts.",
      },
      pro: {
        id: "pro",
        name: "Pro Pack",
        credits: 4000,
        price: 2000,
        description: "4,000 Credits — generate up to 1,000 high-engagement posts.",
      },
      business: {
        id: "business",
        name: "Business Pack",
        credits: 10000,
        price: 5000,
        description: "10,000 Credits — generate up to 2,500 high-engagement posts.",
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
      creditCost: 4, // Charged at 4 credits per post
      endpoint: "https://api.muapi.ai/api/v1/any-llm-models",
      description: "Generates high-conversion, highly-readable social media copies.",
    },
    platforms: SOCIAL_PLATFORMS,
    tones: SOCIAL_TONES,
    languages: LANGUAGES,
    lengths: LENGTHS,
  },
  db: {
    url: process.env.DATABASE_URL,
  },
};

export default config;
export { SOCIAL_PLATFORMS, SOCIAL_TONES, LANGUAGES, LENGTHS };
