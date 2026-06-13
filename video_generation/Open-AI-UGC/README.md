> 📦 **Original repo:** [Anil-matcha/Open-AI-UGC](https://github.com/Anil-matcha/Open-AI-UGC)

# Open AI UGC — Free Open-Source Alternative to Arcads & MakeUGC

> **The free, open-source alternative to Arcads and MakeUGC.** Generate AI UGC video ads with realistic AI actors using 4+ state-of-the-art video models — no per-seat pricing, no locked actor library, no vendor watermark.

**Community:** Join [Reddit](https://reddit.com/r/muapi) & [Discord](https://discord.gg/QhTrNRU4r3) for discussions and support

> 🤖 **Automate UGC ad generations with AI coding agents:** [Generative-Media-Skills](https://github.com/SamurAIGPT/Generative-Media-Skills) — a library of skills that let agents like **Claude Code**, **Codex**, and other coding assistants drive image/video models end-to-end (script → generate → review → re-render) directly from your terminal. Perfect for shipping 100 ad variants overnight without touching a UI.

### Related projects

> **Open-source Node based workflow builder** -> https://github.com/SamurAIGPT/Vibe-Workflow

> **Open-source AI Clipping — turn any long-form YouTube video into viral-ready vertical shorts** -> https://github.com/SamurAIGPT/AI-Youtube-Shorts-Generator

> **Open-source AI Design Agent** -> https://github.com/Anil-matcha/Open-AI-Design-Agent

> **Schedule your UGC content automatically with AI** -> https://github.com/Anil-matcha/Free-AI-Social-Media-Scheduler

<p align="center">
  <a href="https://github.com/Anil-matcha/awesome-generative-ai-apps">
    <img src="https://img.shields.io/badge/Part%20of-Awesome%20Generative%20AI%20Apps-FFD700?style=for-the-badge&logo=github&logoColor=black" alt="Awesome Generative AI Apps">
  </a>
</p>

> 🎨 **[Explore 50+ more open-source AI apps →](https://github.com/Anil-matcha/awesome-generative-ai-apps)**

## 🌐 Live Demo & Deploy

**Live Demo:** [open-ai-ugc.vercel.app](https://open-ai-ugc.vercel.app/)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Anil-matcha/Open-AI-UGC)


**Follow** the [creator](https://x.com/matchaman11) for updates

---

Open AI UGC is a free, open-source AI UGC video ad studio that brings the Arcads / MakeUGC workflow to everyone — without the $110–$500+/month per-seat subscription. Paste a script, upload a reference face or product image, pick a model, and ship a scroll-stopping 9:16 vertical ad for TikTok, Reels, or Shorts in under a minute. Powered by [Muapi.ai](https://muapi.ai), it supports image-to-video and text-to-video generation across models like **Veo 3.1**, **Seedance 2**, **Grok Video**, and **Happy Horse 1** — all from a sleek, modern interface you can self-host, rebrand, and customize end to end.

**Why Open AI UGC instead of Arcads or MakeUGC?**
- **Free & open-source** — no $110–$500/mo subscription, no vendor lock-in
- **Bring your own actors** — upload any face or product image instead of being locked to a vendor roster
- **Model choice** — switch between Veo 3.1, Seedance 2, Grok Video, and Happy Horse 1 per render
- **No watermark, no branding** — 100% your domain, your studio, your client deliverables
- **Self-hosted** — your data and renders stay on your infra, full creative control
- **Stripe & credits built-in** — clone, swap branding, and sell it as your own UGC SaaS
- **Extensible** — add any MUAPI model in ~10 lines, modify the UI, build agencies on top of it

---

## ✨ Features

- **AI UGC Video Studio** — Paste a script, optionally upload up to 7 reference images (faces, products, scenes), pick a model, and generate a 9:16 vertical UGC ad. Reference images inline with `@image1`, `@image2`, etc.
- **Multi-model support** — 4 leading video models pre-wired: Veo 3.1 (Google), Seedance 2 (ByteDance), Grok Video (xAI), and Happy Horse 1. Switch per render.
- **Image-to-Video & Text-to-Video** — Animate a product shot, an AI-generated actor, or generate purely from text — your call.
- **Per-model parameter control** — Aspect ratio (9:16, 16:9, 1:1, etc.), duration (3–30s), resolution (480p → 4K), and mode (fun / normal / spicy for Grok) — UI adapts automatically to each model's capabilities.
- **Async job pipeline** — MUAPI delivers finished renders via webhook; the dashboard polls and updates live without page reloads.
- **Creations dashboard** — Every generation is persisted per user with prompt, settings, status, and final video URL.
- **Credits system** — Each user starts with 10 free credits; 1 credit per generation; insufficient-credit gating built in.
- **Stripe billing** — 3-tier pricing page (Free / Pro $19.99 / Elite $49.99) with Checkout + webhook credit top-up. Swap the tiers to whatever you want and ship.
- **Google sign-in** — NextAuth.js with Prisma adapter, ready to go. Add more providers in one file.
- **Responsive UI** — Tailwind v4 + Framer Motion, works on desktop and mobile, glassmorphism design.

### 🎬 UGC Video Generation — Dual Mode

The studio automatically adapts based on whether you upload reference images:

| Mode | Trigger | Use case | Prompt |
| :--- | :--- | :--- | :--- |
| **Text-to-Video** | No image uploaded | Generate a UGC ad purely from a script | Required |
| **Image-to-Video** | Reference image(s) uploaded | Animate a specific actor face / product shot / scene | Optional |

#### Supported Models

| Model | Provider | Type | Aspect Ratios | Duration | Resolution | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Veo 3.1** | Google | I2V | 16:9, 9:16 | 8s | 720p / 1080p / 4K | High-fidelity, realistic motion — best for premium client ads |
| **Seedance 2** | ByteDance | I2V | 21:9, 16:9, 4:3, 1:1, 3:4, 9:16 | 4–15s | — | Character-reference support, multi-shot generation |
| **Grok Video** | xAI | I2V | 9:16, 16:9, 2:3, 3:2, 1:1 | 6–30s | 480p / 720p | Modes: fun / normal / spicy — strong for high-CTR hooks |
| **Happy Horse 1** | — | I2V | 16:9, 9:16, 1:1, 4:3, 3:4 | 3–15s | 720p | Fast, lifelike animation — great for batch iteration |

Adding a new MUAPI model takes ~10 lines in `src/app/page.js` (append to the `MODELS` array) and one line in `src/app/api/generate/route.js` (add to `MODEL_ENDPOINTS`).

### 🖼️ Multi-Image Reference Input

UGC ads frequently need multiple references — actor face + product + setting. Open AI UGC supports up to **7 reference images per generation**:

- **Drag-and-drop or click** to upload — images upload asynchronously with live status pills
- **Inline references** in your script — `@image1 holding the bottle, walking through @image2`
- **Per-image previews** with one-click removal
- **Auto-routing** — passed as both `image_url` (first image) and `images_list` (full array) so every MUAPI model receives them in the format it expects

### 💳 Credits & Stripe Billing

Out-of-the-box billing flow you can sell as a SaaS:

| Plan | Price | Credits | Target |
| :--- | :--- | :--- | :--- |
| **Starter** | Free | 10 | Trial users |
| **Pro Studio** | $19.99/mo | 500 | Solo creators / freelancers |
| **Elite Creator** | $49.99/mo | 1,500 | Agencies / power users |

Plans, prices, and features are defined in one file (`src/app/pricing/page.js`) — change them to whatever your business model needs. Stripe Checkout handles the payment, the webhook (`src/app/api/webhook/stripe/route.js`) increments credits on success.

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- A PostgreSQL database (free tiers on [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Railway](https://railway.app))
- A [Muapi.ai access key](https://muapi.ai/access-keys) — copy the generated key value, not the label
- A [Google OAuth client](https://console.cloud.google.com/apis/credentials) (Client ID + Secret)
- A [Stripe account](https://stripe.com) (test mode is fine to start)

### Setup

```bash
# Clone the repo
git clone https://github.com/Anil-matcha/Open-AI-UGC.git
cd Open-AI-UGC

# Install dependencies
npm install

# Copy env template and fill in the values
cp .env.example .env

# Push the Prisma schema to your database
npx prisma db push

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in with Google, and start generating. Every new user starts with 10 free credits.

### Environment Variables

```env
# Postgres (Neon / Supabase / Railway / self-hosted)
DATABASE_URL="postgresql://user:password@host:port/dbname"
DIRECT_URL="postgresql://user:password@host:port/dbname"

# NextAuth — generate with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."

# Google OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# MUAPI — https://muapi.ai/access-keys
UGC_API_KEY="..."
WEBHOOK_URL="https://your-deployment-url.com"  # MUAPI calls this when a render finishes

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# UI
NEXT_PUBLIC_THEME=light
```

### Production Build

```bash
npm run build
npm run start
```

## ⚡ Deployment: Vercel & Production

This architecture is engineered explicitly for **Vercel** serverless environments.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Anil-matcha/Open-AI-UGC)

### 🚀 Launching on Vercel: Step-by-Step

1. **Database Provisioning**: Create a new Postgres database (via Supabase or Neon) and retrieve connection URLs.
2. **Project Creation**: Import your GitHub repository (`https://github.com/Anil-matcha/Open-AI-UGC`) into the Vercel dashboard.
3. **Configure Environment Variables**: Add all variables from `.env.example` in Vercel. Set `WEBHOOK_URL` to your Vercel deployment URL (e.g. `https://open-ai-ugc.vercel.app`).
4. **Deploy**: Build with Vercel. Next.js page generation will run Prisma client generation automatically via our script config.
5. **Database Push**: Run `npx prisma db push` to synchronize database models before launching.
6. **Webhooks Setup**:
   - Configure a Stripe Webhook pointing to `https://open-ai-ugc.vercel.app/api/webhook/stripe` selecting `checkout.session.completed`.
   - Configure the MuAPI Webhook pointing to `https://open-ai-ugc.vercel.app/api/webhook/muapi`.

## 🏗️ Architecture

```
Open-AI-UGC/
├── src/
│   ├── app/
│   │   ├── layout.js                       # Root layout (Tailwind, NextAuth provider, Navbar)
│   │   ├── page.js                         # Main UGC generator — model picker, prompt, image upload
│   │   ├── dashboard/page.js               # User's generation history
│   │   ├── pricing/page.js                 # Stripe-powered pricing page
│   │   └── api/
│   │       ├── generate/route.js           # POST — kick off a UGC video generation
│   │       ├── upload/route.js             # POST — image upload → hosted URL
│   │       ├── creations/route.js          # GET — list user's creations
│   │       ├── creations/[id]/route.js     # GET — single creation (polled by frontend)
│   │       ├── webhook/muapi/route.js      # POST — MUAPI render-complete callback
│   │       ├── webhook/stripe/route.js     # POST — Stripe payment callback → top up credits
│   │       ├── checkout/stripe/route.js    # POST — create Stripe Checkout session
│   │       └── auth/[...nextauth]/route.js # NextAuth handler
│   ├── components/
│   │   ├── saas/Navbar.jsx                 # Top nav with credits badge & profile menu
│   │   ├── saas/AuthButtons.jsx
│   │   └── ui/                             # Button, Card primitives
│   └── lib/
│       ├── auth.js                         # NextAuth config (Google + Prisma adapter)
│       └── prisma.js                       # Prisma client singleton
├── prisma/
│   └── schema.prisma                       # User, Creation, Account, Session, VerificationToken
└── package.json
```

## 🔌 API Integration

Open AI UGC communicates with [Muapi.ai](https://muapi.ai) using a webhook pattern:

1. **Submit** — `POST /api/v1/{model-endpoint}` with `prompt`, `images_list`, model parameters, and `webhook_url`
2. **Wait** — MUAPI runs the render asynchronously (8s–2min depending on model and duration)
3. **Callback** — MUAPI calls your `webhook_url` with the finished video URL and request ID
4. **Update** — `/api/webhook/muapi/route.js` finds the matching `Creation` row by `request_id` and updates its status + URL
5. **Poll** — the frontend polls `/api/creations/[id]` every 3 seconds and switches from spinner to video player as soon as status flips

Authentication uses the `x-api-key` header. Credits are decremented on submit (so failed renders cost a credit — you can adjust this in `src/app/api/generate/route.js` if you'd rather refund on failure).

## 🛠️ Tech Stack

- **Next.js 16** — App Router, server components, React 19
- **React 19** — Studio UI
- **Tailwind CSS v4** — Utility-first styling
- **Framer Motion** — Animations and transitions
- **Prisma 7** — Type-safe Postgres ORM
- **NextAuth.js** — Google OAuth with Prisma adapter
- **Stripe** — Checkout + webhooks for credit top-up
- **Muapi.ai** — AI video model API gateway (Veo, Seedance, Grok, Happy Horse, and more)

## 🤔 How is this different from Arcads and MakeUGC?

**Open AI UGC** is a community-driven, open-source alternative that gives you the same Arcads/MakeUGC workflow without the closed ecosystem and per-seat pricing.

| | Arcads / MakeUGC | **Open AI UGC** |
| :--- | :--- | :--- |
| **Cost** | $110–$500+/mo per seat | Free (open-source) — pay only for MUAPI API usage |
| **Actor library** | Locked to vendor's roster | Bring your own — any face or product image |
| **Model choice** | Single in-house model | Veo 3.1, Seedance 2, Grok Video, Happy Horse 1 (swap per render) |
| **Hosted version** | SaaS only | Self-host on Vercel / your own infra |
| **White-label** | Vendor branding / templates | 100% your brand, your domain, your client deliverables |
| **Custom pricing** | Fixed tiers | Stripe + 3 tiers wired up, edit one file to change |
| **Source code** | Closed | MIT licensed, fully hackable |
| **Data privacy** | Cloud-only | Your renders and user data stay on your infra |
| **Reseller-friendly** | No | Yes — built to be cloned, rebranded, and sold |

## 📄 License

MIT — fork it, rebrand it, ship it.

## 🙏 Credits

Built with [Muapi.ai](https://muapi.ai) — the unified API for AI image and video generation models.

---

*Looking for a free, open-source alternative to Arcads or MakeUGC? Open AI UGC is a self-hostable AI UGC video ad studio you can customize, rebrand, and resell. No content filters, no vendor lock-in, no per-seat pricing.*
