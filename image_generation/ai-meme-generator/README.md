# 🎭 AI Meme Studio — Open-Source AI Meme & Viral Short Video Generator SaaS

> **Generate viral memes and short AI videos in seconds with Veo 3.1, Gemini Omni, Wan2.7, GPT-Image-2, and Nano Banana 2.** A production-ready, self-hostable Next.js SaaS boilerplate with smart multi-model routing — purpose-built for creators, marketers, social media managers, and brand teams. Powered by the MuAPI AI engine.

**Tech stack:** Next.js 14 (App Router) · Prisma · PostgreSQL · NextAuth (Google OAuth) · Stripe · Tailwind CSS · Multi-model routing · MuAPI
**Use cases:** TikTok meme videos · Instagram Reels · YouTube Shorts · Twitter/X virality · Brand meme marketing · UGC short-form content · Discord stickers · Reddit posts · Social media campaigns

<p align="center">
  <a href="https://github.com/Anil-matcha/awesome-generative-ai-apps">
    <img src="https://img.shields.io/badge/Part%20of-Awesome%20Generative%20AI%20Apps-FFD700?style=for-the-badge&logo=github&logoColor=black" alt="Awesome Generative AI Apps">
  </a>
</p>

> 🎨 **[Explore 50+ more open-source AI apps →](https://github.com/Anil-matcha/awesome-generative-ai-apps)**

## 🌐 Project Repository

**GitHub Repository:** [github.com/SamurAIGPT/ai-meme-generator](https://github.com/SamurAIGPT/ai-meme-generator)

**Live Demo:** [ai-meme-umber.vercel.app](https://ai-meme-umber.vercel.app/)

Sign in with Google to explore the video generation studio, image meme creator, gallery archive, and credit purchase flows.

---

AI Meme Studio is a production-ready, highly-optimized AI web application. Out of the box, it seamlessly manages User Authentication, Credits & Billing, Creation Persistence, and asynchronous AI generation polling using a sleek Next.js (App Router) architecture. It empowers creators, marketers, and brands to generate viral-ready memes and short-form AI videos in seconds.

**Why use AI Meme Studio?**

- **Production-Ready SaaS** — Complete with Google OAuth and Stripe Checkout workflows built-in.
- **Multi-Model AI Engine** — Supports Veo 3.1, Gemini Omni, Wan2.7, GPT-Image-2, and Nano Banana 2 models.
- **Smart Model Routing** — Automatically uses text-to-image/video models when no image is uploaded, and image-editing models when a reference image is provided.
- **Historical Gallery** — All creations (images and videos) are securely persisted to a PostgreSQL database for a custom user workspace.
- **Responsive & Polished UX** — Clean dark/light theme interface with smooth transitions and a premium feel on both desktop and mobile.
- **Extensible API** — Easily swap or adapt underlying model endpoints without breaking layout styling.

![AI Meme Studio](https://cdn.muapi.ai/data/2/666615654127/Screenshot_2026-05-21_185058.png)

## ✨ Core Features

### 🎬 Video Generation (Homepage)
- **Veo 3.1 Image-to-Video** — Turn any image into a cinematic short clip. Supports 16:9 / 9:16 aspect ratios, 720p / 1080p / 4K resolution, and 8-second duration.
- **Gemini Omni Image-to-Video** — Google's flagship model for expressive motion generation from a reference image.
- **Wan2.7 Text-to-Video** — Pure text-driven video generation, no image required.
- **Real-time Polling** — Generation jobs are tracked asynchronously with live status updates and a progress indicator.

### 🖼️ Image Generation (`/image`)
- **Wan 2.7** — `wan2.7-text-to-image-pro` (text-only) or `wan2.7-image-edit-pro` (with reference image).
- **GPT-Image-2** — `gpt-image-2-text-to-image` (text-only) or `gpt-image-2-image-to-image` (with image).
- **Nano Banana 2** — `nano-banana-2` (text-only) or `nano-banana-2-edit` (with image).
- Supports multiple aspect ratios: 1:1, 4:3, 3:4, 16:9, 9:16, 21:9, 9:21, 3:2, 2:3.

### 🗂️ Gallery (`/gallery`)
- Full creation archive for authenticated users — images and videos side by side.
- 1-click download and delete for each creation.
- Secure database-backed persistence using Prisma + PostgreSQL.

### 💳 Credit Billing (`/pricing`)
- **Standard Pack** — 100 credits for $5.
- **Pro Pack** — 250 credits for $10.
- Stripe Checkout integration — payments go straight to your Stripe account.

---

## ⚡ Deployment: Vercel & Production

This architecture is engineered explicitly for **Vercel** serverless environments.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/SamurAIGPT/ai-meme)

### 🔑 Required Environment Variables

To successfully deploy and run, populate the following environment variables in your Vercel project settings:

| Service               | Variable                             | Description & Source                                                                         |
| :-------------------- | :----------------------------------- | :------------------------------------------------------------------------------------------- |
| **Database**          | `DATABASE_URL`                       | PostgreSQL connection string ([Supabase](https://supabase.com) or [Neon](https://neon.tech)) |
|                       | `DIRECT_URL`                         | Direct DB connection for Prisma migrations                                                   |
| **NextAuth / Google** | `NEXTAUTH_SECRET`                    | Secure random string generated via `openssl rand -base64 32`                                 |
|                       | `NEXTAUTH_URL`                       | Your production domain (e.g. `https://my-app.vercel.app`)                                    |
|                       | `GOOGLE_CLIENT_ID`                   | Get from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)           |
|                       | `GOOGLE_CLIENT_SECRET`               | Get from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)           |
| **Stripe Billing**    | `STRIPE_SECRET_KEY`                  | Get from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)                            |
|                       | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Get from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)                            |
|                       | `STRIPE_WEBHOOK_SECRET`              | Webhook secret for resolving credit purchases                                                |
| **AI Generator**      | `MUAPIAPP_API_KEY`                   | Create an account and get key from [muapi.ai/access-keys](https://muapi.ai/access-keys)      |

### 🚀 Launching on Vercel: Step-by-Step

1. **Database Provisioning**: Create a new Postgres database (via free tiers on Vercel Postgres, Supabase, or Neon). Retrieve the connection strings.
2. **Project Creation**: Import your GitHub fork into the Vercel dashboard.
3. **Configure Environment Variables**: Copy the variables above into the Vercel project settings environment tab.
4. **Deploy**: Hit "Deploy". Vercel will automatically run the build steps (`npm run build`).
5. **Database Push**: Run `npx prisma db push` to generate the client and synchronize database models before launching.
6. **Stripe Webhook**: Register your Vercel deployment URL as a Stripe webhook endpoint (`/api/stripe/webhook`) and set `STRIPE_WEBHOOK_SECRET`.

---

## 🛠️ Local Development

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v18 or higher)
- A local/cloud PostgreSQL instance.

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/SamurAIGPT/ai-meme
cd ai-meme

# 2. Install dependencies
npm install

# 3. Setup Environment
cp .env.example .env
# Open .env and insert your specific keys.

# 4. Initialize Database Schema
npx prisma generate
npx prisma db push

# 5. Start the Development Server
npm run dev
```

The console should now be active on `http://localhost:3000`.

---

## 🏗️ Technical Architecture

```
ai-meme/
├── prisma/
│   └── schema.prisma           # Postgres tables: Users, Accounts, Sessions, Creations
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/
│   │   │   ├── auth/           # NextAuth Google OAuth handler
│   │   │   ├── generate/
│   │   │   │   ├── video/      # Video generation endpoint (Veo, Gemini Omni, Wan2.7)
│   │   │   │   └── image/      # Image generation endpoint (Wan2.7, GPT-Image-2, Nano Banana)
│   │   │   ├── creations/      # GET all creations + polling; DELETE by ID
│   │   │   ├── upload/         # Proxy file upload to MuAPI CDN
│   │   │   └── stripe/         # Checkout session + webhook handler
│   │   ├── image/              # Image Generation page (/image)
│   │   ├── gallery/            # Creations Gallery page (/gallery)
│   │   ├── pricing/            # Credit Tiers & Stripe Checkout (/pricing)
│   │   └── page.js             # Main Video Generation Studio (/)
│   ├── components/
│   │   ├── layout/
│   │   │   └── Navbar.jsx      # Sticky top nav with credits, auth, Deploy button
│   │   └── Providers.jsx       # NextAuth SessionProvider wrapper
│   └── lib/
│       ├── prisma.js            # Shared PrismaClient singleton (pg adapter)
│       ├── auth.js              # NextAuth config (Google provider + Prisma adapter)
│       ├── config.js            # App config: plans, model lists, API base URL
│       ├── stripe.js            # Stripe client singleton
│       └── services/
│           ├── user.js          # User credit reads/writes
│           ├── billing.js       # Stripe webhook credit fulfillment
│           └── ai.js            # MuAPI request helpers for video & image
└── next.config.mjs              # Next.js configuration
```

---

## 🤖 AI Models Reference

### Video Models

| Model | Endpoint | Notes |
|---|---|---|
| **Veo 3.1** | `veo3.1-image-to-video` | Requires image URL; 720p/1080p/4K; 8s |
| **Gemini Omni** | `gemini-omni-image-to-video` | Rich motion from text + image |
| **Wan 2.7 Video** | `wan2.7-text-to-video` | Text-only video generation |

### Image Models

| Model | Text-Only Endpoint | With Image Endpoint |
|---|---|---|
| **Wan 2.7** | `wan2.7-text-to-image-pro` | `wan2.7-image-edit-pro` |
| **GPT-Image-2** | `gpt-image-2-text-to-image` | `gpt-image-2-image-to-image` |
| **Nano Banana 2** | `nano-banana-2` | `nano-banana-2-edit` |

---

## 🔗 Related Templates

Check out other open-source SaaS templates from the same ecosystem:

| Template | Description | GitHub |
|---|---|---|
| **Resale Photo Enhancer** | AI product photography for resellers | [github.com/SamurAIGPT/resale-photo-enhancer](https://github.com/SamurAIGPT/resale-photo-enhancer) |
| **Pet Product Studio** | AI photography for pet products | [github.com/SamurAIGPT/pet-product-studio](https://github.com/SamurAIGPT/pet-product-studio) |
| **Old Photo Restore** | Restore & colorize vintage photos | [github.com/SamurAIGPT/old-photo-restore](https://github.com/SamurAIGPT/old-photo-restore) |
| **Nano Banana Generator** | Multi-model AI image platform | [github.com/SamurAIGPT/nano-banana-generator](https://github.com/SamurAIGPT/nano-banana-generator) |

---

## 📄 License

MIT Licensed. Fork it, brand it, and start earning.
