/**
 * Centralized configuration for the Mail-Wise AI Email Composer application.
 */

const EMAIL_TEMPLATES = [
  { id: "cold_pitch", name: "Cold Outreach Pitch", iconName: "FaPaperPlane", placeholder: "Pitch our AI automation service to marketing agencies..." },
  { id: "sales_followup", name: "Sales Follow-up", iconName: "FaHistory", placeholder: "Follow up after our demo call last Tuesday..." },
  { id: "meeting_request", name: "Meeting Request", iconName: "FaCalendarAlt", placeholder: "Invite a VP of Product to a quick 15-minute coffee chat..." },
  { id: "refund_apology", name: "Apology & Refund", iconName: "FaSadTear", placeholder: "Apologize for yesterday's system downtime and offer a refund..." },
  { id: "thank_you", name: "Thank You Note", iconName: "FaHeart", placeholder: "Thank the team for attending our webinar..." },
  { id: "custom", name: "Custom Email Draft", iconName: "FaMagic", placeholder: "Write anything you want..." },
];

const EMAIL_TONES = [
  { id: "professional", name: "Professional", emoji: "💼", promptPart: "expertly polished, authoritative, clear, and business-focused tone" },
  { id: "persuasive", name: "Persuasive", emoji: "🚀", promptPart: "compelling, conversion-driven, sales-oriented, and high-influence tone" },
  { id: "friendly", name: "Friendly", emoji: "☕", promptPart: "warm, approachable, supportive, and personable tone" },
  { id: "apologetic", name: "Apologetic", emoji: "🥺", promptPart: "sincere, empathetic, polite, taking ownership, and apologizing tone" },
  { id: "casual", name: "Casual", emoji: "👋", promptPart: "conversational, relaxed, light-hearted, and informal tone" },
  { id: "bold", name: "Bold / Assertive", emoji: "🔥", promptPart: "strong, direct, highly-confident, thought-provoking, and bold tone" },
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
  { id: "short", name: "Short (under 120 words)", limitPrompt: "strictly short, under 120 words to ensure punchy, quick reading" },
  { id: "medium", name: "Medium (120-250 words)", limitPrompt: "medium length, roughly 120-250 words to allow balanced details" },
  { id: "long", name: "Long (250+ words)", limitPrompt: "comprehensive long-form structure, exceeding 250 words with thorough paragraphs" },
];

const config = {
  appName: "Mail Wise",
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
        description: "1,000 Credits — generate up to 250 high-conversion emails.",
      },
      standard: {
        id: "standard",
        name: "Standard Pack",
        credits: 2000,
        price: 1000,
        description: "2,000 Credits — generate up to 500 high-conversion emails.",
      },
      pro: {
        id: "pro",
        name: "Pro Pack",
        credits: 4000,
        price: 2000,
        description: "4,000 Credits — generate up to 1,000 high-conversion emails.",
      },
      business: {
        id: "business",
        name: "Business Pack",
        credits: 10000,
        price: 5000,
        description: "10,000 Credits — generate up to 2,500 high-conversion emails.",
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
      creditCost: 4, // Deducts 4 credits per generation
      endpoint: "https://api.muapi.ai/api/v1/any-llm-models",
      description: "Generates high-converting, professional, tailored email drafts.",
    },
    templates: EMAIL_TEMPLATES,
    tones: EMAIL_TONES,
    languages: LANGUAGES,
    lengths: LENGTHS,
  },
  db: {
    url: process.env.DATABASE_URL,
  },
};

export default config;
export { EMAIL_TEMPLATES, EMAIL_TONES, LANGUAGES, LENGTHS };
