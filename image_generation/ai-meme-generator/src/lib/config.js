const config = {
  appName: "Ai Meme",
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
      starter: {
        id: "starter",
        name: "Starter Pack",
        credits: 1000,
        price: 500, // $5.00
      },
      creator: {
        id: "creator",
        name: "Creator Pack",
        credits: 2000,
        price: 1000, // $10.00
      },
      pro: {
        id: "pro",
        name: "Pro Pack",
        credits: 4000,
        price: 2000, // $20.00
      },
      business: {
        id: "business",
        name: "Business Pack",
        credits: 10000,
        price: 5000, // $50.00
      },
      enterprise: {
        id: "enterprise",
        name: "Enterprise Pack",
        credits: 20000,
        price: 10000, // $100.00
      }
    }
  },
  ai: {
    apiKey: process.env.MUAPIAPP_API_KEY,
    uploadEndpoint: "https://api.muapi.ai/api/v1/upload_file",
  },
  db: {
    url: process.env.DATABASE_URL,
  }
};

export default config;
