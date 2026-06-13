/**
 * Centralized configuration for the SaaS template.
 * All environment variables are validated and exported from here.
 */

const config = {
  appName: "Veo31 Generator",
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
      basic: { id: "basic", name: "Basic Pack", credits: 100, price: 500 },
      standard: { id: "standard", name: "Standard Pack", credits: 250, price: 1000 },
      pro: { id: "pro", name: "Professional Pack", credits: 600, price: 2000 },
      business: { id: "business", name: "Business Pack", credits: 2000, price: 5000 },
    }
  },
  ai: {
    veo31: {
      apiKey: process.env.VEO31_API_KEY,
      endpoints: {
        t2v: {
          "lite": "https://api.muapi.ai/api/v1/veo3.1-lite-text-to-video",
          "fast": "https://api.muapi.ai/api/v1/veo3.1-fast-text-to-video",
          "quality": "https://api.muapi.ai/api/v1/veo3.1-text-to-video"
        },
        i2v: {
          "lite": "https://api.muapi.ai/api/v1/veo3.1-lite-image-to-video",
          "fast": "https://api.muapi.ai/api/v1/veo3.1-fast-image-to-video",
          "quality": "https://api.muapi.ai/api/v1/veo3.1-image-to-video"
        },
        reference: "https://api.muapi.ai/api/v1/veo3.1-reference-to-video"
      }
    }
  },
  db: {
    url: process.env.DATABASE_URL,
  }
};

// Simple validation to warn if critical keys are missing
const requiredKeys = [
  ["GOOGLE_CLIENT_ID", config.auth.google.clientId],
  ["GOOGLE_CLIENT_SECRET", config.auth.google.clientSecret],
  ["STRIPE_SECRET_KEY", config.stripe.secretKey],
  ["DATABASE_URL", config.db.url],
];

if (typeof window === "undefined") {
  requiredKeys.forEach(([name, value]) => {
    if (!value) {
      console.warn(`[CONFIG] Warning: Missing critical environment variable: ${name}`);
    }
  });
}

export default config;
