/**
 * Centralized configuration for the AI Kissing Video Generator application.
 */

const config = {
  appName: "Ai Kissing Video Generator",
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
        name: "Basic Kiss Pack",
        credits: 1000, // $5.00 for 1000 credits
        price: 500, // $5.00 in cents
        description: "Get 1,000 Hearts to generate cinematic and fast kiss videos."
      },
      standard: {
        id: "standard",
        name: "Sweetheart Pack",
        credits: 2000, // $10.00 for 2000 credits
        price: 1000, // $10.00 in cents
        description: "Get 2,000 Hearts to generate cinematic and fast kiss videos."
      },
      pro: {
        id: "pro",
        name: "Romance Pro Pack",
        credits: 4000, // $20.00 for 4000 credits
        price: 2000, // $20.00 in cents
        description: "Get 4,000 Hearts to generate cinematic and fast kiss videos."
      },
      business: {
        id: "business",
        name: "Cupid Elite Pack",
        credits: 10000, // $50.00 for 10000 credits
        price: 5000, // $50.00 in cents
        description: "Get 10,000 Hearts to generate cinematic and fast kiss videos."
      }
    }
  },
  ai: {
    apiKey: process.env.MU_API_KEY,
    uploadEndpoint: "https://api.muapi.ai/api/v1/upload_file",
    pollEndpoint: (requestId) => `https://api.muapi.ai/api/v1/predictions/${requestId}/result`,
    models: {
      "veo3.1-image-to-video": {
        id: "veo3.1-image-to-video",
        name: "Veo 3.1 Pro (Image to Video)",
        creditCost: 25,
        endpoint: "https://api.muapi.ai/api/v1/veo3.1-image-to-video",
        description: "Google's state-of-the-art cinematic video generator, producing 8s high-quality videos."
      },
      "wan2.7-image-to-video": {
        id: "wan2.7-image-to-video",
        name: "Wan 2.7 (Image to Video)",
        creditCost: 1,
        endpoint: "https://api.muapi.ai/api/v1/wan2.7-image-to-video",
        description: "Ultra-fast high-motion video generator, great for quick dynamic kisses."
      },
      "gemini-omni-image-to-video": {
        id: "gemini-omni-image-to-video",
        name: "Gemini Omni (Image to Video)",
        creditCost: 15,
        endpoint: "https://api.muapi.ai/api/v1/gemini-omni-image-to-video",
        description: "Highly semantic Google Omni model with excellent facial and hand coherence."
      },
      "grok-imagine-image-to-video": {
        id: "grok-imagine-image-to-video",
        name: "Grok Imagine (Image to Video)",
        creditCost: 2,
        endpoint: "https://api.muapi.ai/api/v1/grok-imagine-image-to-video",
        description: "X's Grok dynamic video creator with extreme creative layout understanding."
      }
    }
  },
  db: {
    url: process.env.DATABASE_URL,
  }
};

export default config;
