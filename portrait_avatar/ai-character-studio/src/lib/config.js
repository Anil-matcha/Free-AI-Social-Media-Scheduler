const config = {
  appName: "AI SaaS",
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
    apiKey: process.env.MUAPIAPP_API_KEY,
    generationCost: 1, // Default cost per AI call
  }
};

export default config;
