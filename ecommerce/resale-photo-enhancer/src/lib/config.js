/**
 * Centralized configuration for the Resale Photo Enhancer SaaS application.
 */

const config = {
  appName: "Resale Photo Enhancer",
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
      standard: {
        id: "standard",
        name: "Standard Pack",
        credits: 1000,
        price: 500, // $5.00
      },
      pro: {
        id: "pro",
        name: "Pro Pack",
        credits: 2000,
        price: 1000, // $10.00
      }
    }
  },
  ai: {
    apiKey: process.env.MUAPIAPP_API_KEY || process.env.HEADSHOT_API_KEY,
    submitEndpoint: "https://api.muapi.ai/api/v1/nano-banana-2-edit",
    uploadEndpoint: "https://api.muapi.ai/api/v1/upload_file",
    pollEndpoint: (requestId) => `https://api.muapi.ai/api/v1/predictions/${requestId}/result`,
  },
  db: {
    url: process.env.DATABASE_URL,
  }
};

export default config;
