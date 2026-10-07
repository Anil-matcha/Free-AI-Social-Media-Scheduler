/**
 * Centralized configuration for the SaaS template.
 * All environment variables are validated and exported from here.
 */

const config = {
  appName: "Seedance V2 Template",
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
      default: {
        amount: 50, // 50 credits
        price: 500, // $5.00
        currency: "usd",
      }
    }
  },
  ai: {
    seedance: {
      apiKey: process.env.SEEDANCE_V2_API_KEY,
      endpoints: {
        t2v: {
          "480p": "https://api.muapi.ai/api/v1/seedance-2.0-t2v-480p",
          "720p": "https://api.muapi.ai/api/v1/seedance-v2.0-t2v"
        },
        i2v: {
          "480p": "https://api.muapi.ai/api/v1/seedance-2.0-i2v-480p",
          "720p": "https://api.muapi.ai/api/v1/seedance-v2.0-i2v"
        },
        reference: {
          "480p": "https://api.muapi.ai/api/v1/seedance-2.0-omni-reference-480p",
          "720p": "https://api.muapi.ai/api/v1/seedance-2.0-omni-reference"
        }
      }
    },
    seedanceMini: {
      apiKey: process.env.SEEDANCE_V2_API_KEY,
      endpoints: {
        t2v: {
          "480p": "https://api.muapi.ai/api/v1/seedance-2-mini-text-to-video",
          "720p": "https://api.muapi.ai/api/v1/seedance-2-mini-text-to-video"
        },
        i2v: {
          "480p": "https://api.muapi.ai/api/v1/seedance-2-mini-image-to-video",
          "720p": "https://api.muapi.ai/api/v1/seedance-2-mini-image-to-video"
        },
        reference: {
          "480p": "https://api.muapi.ai/api/v1/seedance-2-mini-omni-reference",
          "720p": "https://api.muapi.ai/api/v1/seedance-2-mini-omni-reference"
        }
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
