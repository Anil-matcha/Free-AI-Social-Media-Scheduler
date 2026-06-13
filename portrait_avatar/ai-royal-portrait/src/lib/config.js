/**
 * Centralized configuration for the AI Royal Portrait Generator application.
 */

const PORTRAIT_STYLES = [
  // Hair
  { name: "Voluminous Frizzy Hair", category: "Hair", emoji: "💇" },
  { name: "Platinum Blonde Hair", category: "Hair", emoji: "👱" },
  { name: "Deep Burgundy Hair", category: "Hair", emoji: "🔴" },
  { name: "Jet Black Hair", category: "Hair", emoji: "🖤" },
  { name: "Bold Hair Highlights", category: "Hair", emoji: "✨" },
  // Makeup
  { name: "Bold Red Lipstick", category: "Makeup", emoji: "💄" },
  { name: "Smokey Eye Makeup", category: "Makeup", emoji: "👁️" },
  { name: "Glossy Nude Makeup", category: "Makeup", emoji: "🌸" },
  { name: "Winged Eyeliner", category: "Makeup", emoji: "🪶" },
  { name: "Party Glam Makeup", category: "Makeup", emoji: "🎉" },
  // Accessories
  { name: "Aviator Sunglasses", category: "Accessories", emoji: "🕶️" },
  { name: "Oversized Sunglasses", category: "Accessories", emoji: "😎" },
  { name: "Modern Transparent Glasses", category: "Accessories", emoji: "👓" },
  { name: "Bold Fashion Hat", category: "Accessories", emoji: "🎩" },
  // Outfit
  { name: "Bright Pink Outfit", category: "Outfit", emoji: "🩷" },
  { name: "Black Leather Jacket", category: "Outfit", emoji: "🖤" },
  { name: "White Formal Shirt", category: "Outfit", emoji: "👔" },
  { name: "Neon Green Hoodie", category: "Outfit", emoji: "🟢" },
  // Lighting
  { name: "Cinematic Lighting", category: "Lighting", emoji: "🎬" },
  { name: "Cyberpunk Lighting", category: "Lighting", emoji: "⚡" },
];

const config = {
  appName: "Ai Royal Portrait",
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
        description: "1,000 Credits — generate up to 500 royal portraits.",
      },
      standard: {
        id: "standard",
        name: "Standard Pack",
        credits: 2000,
        price: 1000,
        description: "2,000 Credits — generate up to 1,000 royal portraits.",
      },
      pro: {
        id: "pro",
        name: "Pro Pack",
        credits: 4000,
        price: 2000,
        description: "4,000 Credits — generate up to 2,000 royal portraits.",
      },
      business: {
        id: "business",
        name: "Business Pack",
        credits: 10000,
        price: 5000,
        description: "10,000 Credits — generate up to 5,000 royal portraits.",
      },
    },
  },
  ai: {
    apiKey: process.env.MU_API_KEY,
    uploadEndpoint: "https://api.muapi.ai/api/v1/upload_file",
    pollEndpoint: (requestId) =>
      `https://api.muapi.ai/api/v1/predictions/${requestId}/result`,
    model: {
      id: "portrait-stylist",
      name: "AI Portrait Stylist",
      creditCost: 2, // $0.01 × 200 = 2 credits per image
      endpoint: "https://api.muapi.ai/api/v1/portrait-stylist",
      description:
        "Professional AI portrait transformations — hair, makeup, accessories, outfit & lighting.",
    },
    styles: PORTRAIT_STYLES,
  },
  db: {
    url: process.env.DATABASE_URL,
  },
};

export default config;
export { PORTRAIT_STYLES };
