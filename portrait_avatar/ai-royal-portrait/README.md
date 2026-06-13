> 📦 **Original repo:** [SamurAIGPT/ai-royal-portrait](https://github.com/SamurAIGPT/ai-royal-portrait)

# 👑 Royal Portrait AI — Open-Source AI Portrait Style Transformer SaaS (Free Lensa AI / Portrait AI Alternative)

> **Transform any selfie into 20 unique royal, cinematic, and artistic portrait styles in seconds.** A production-ready, self-hostable Next.js SaaS boilerplate with HD downloads, a personal gallery dashboard, and built-in Stripe billing. A free open-source alternative to Lensa AI, Portrait AI, PicsArt AI, and Facetune — powered by the MuAPI AI engine.

**Tech stack:** Next.js 14 (App Router) · Prisma · PostgreSQL · NextAuth (Google OAuth) · Stripe · Tailwind CSS · MuAPI portrait-stylist
**Use cases:** Photo editing apps · AI selfie art · Profile picture generators · Social media content · Gift portraits · AI avatar creation · Personal branding · Dating profile photos

<p align="center">
  <a href="https://github.com/Anil-matcha/awesome-generative-ai-apps">
    <img src="https://img.shields.io/badge/Part%20of-Awesome%20Generative%20AI%20Apps-FFD700?style=for-the-badge&logo=github&logoColor=black" alt="Awesome Generative AI Apps">
  </a>
</p>

> 🎨 **[Explore 50+ more open-source AI apps →](https://github.com/Anil-matcha/awesome-generative-ai-apps)**

## 🌐 Project Details

**GitHub Repository:** [github.com/SamurAIGPT/ai-royal-portrait](https://github.com/SamurAIGPT/ai-royal-portrait)

**Live Demo Preview:** [ai-royal-portrait.vercel.app](https://ai-royal-portrait.vercel.app/)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/SamurAIGPT/ai-royal-portrait)

![AI Royal Portrait UI](https://cdn.muapi.ai/data/2/358897692279/Screenshot_2026-05-26_170614.png)

## ✨ Features

- 🎨 **20 Unique Styles** — Hair, makeup, accessories, outfits & cinematic lighting
- ⚡ **Instant Generation** — AI-powered portrait transformation in seconds
- 💰 **Just 2 Credits Per Portrait** — $0.01 per image (1$ = 200 credits)
- 🖼️ **HD Downloads** — Save your portraits in full resolution
- 🔐 **Google Authentication** — Secure sign-in via Google OAuth
- 💳 **Credit System** — Buy credits with Stripe, no subscription needed
- 🔄 **Auto-Refresh Gallery** — Real-time status updates via polling + webhooks
- 📱 **Fully Responsive** — Works on mobile, tablet and desktop

## 🖼️ Styles Available

| Category | Styles |
|----------|--------|
| 💇 Hair | Voluminous Frizzy Hair, Platinum Blonde Hair, Deep Burgundy Hair, Jet Black Hair, Bold Hair Highlights |
| 💄 Makeup | Bold Red Lipstick, Smokey Eye Makeup, Glossy Nude Makeup, Winged Eyeliner, Party Glam Makeup |
| 🕶️ Accessories | Aviator Sunglasses, Oversized Sunglasses, Modern Transparent Glasses, Bold Fashion Hat |
| 👔 Outfit | Bright Pink Outfit, Black Leather Jacket, White Formal Shirt, Neon Green Hoodie |
| 🎬 Lighting | Cinematic Lighting, Cyberpunk Lighting |

## 💳 Credit Pricing

| Pack | Credits | Portraits | Price |
|------|---------|-----------|-------|
| Basic | 1,000 | ~500 | $5 |
| Standard | 2,000 | ~1,000 | $10 |
| Pro | 4,000 | ~2,000 | $20 |
| Business | 10,000 | ~5,000 | $50 |

> New users receive **100 free credits** (50 portraits) on sign-up.

## 🚀 Deploy

Click the button below to deploy your own instance to Vercel in one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/SamurAIGPT/ai-royal-portrait)

## ⚙️ Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres:[password]@db.supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[password]@db.supabase.co:5432/postgres"

# NextAuth
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your_secret_here"

# Google OAuth
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# MuAPI
MU_API_KEY="your_muapi_key"

# Webhook (public URL for async callbacks)
WEBHOOK_URL="https://your-domain.com"

# Stripe
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

## 🗄️ Database Setup

> ⚠️ **Warning**: This app shares a Supabase PostgreSQL database. Follow the **Pull-Declare-Push-Cleanup** sequence carefully to avoid dropping other apps' tables.

1. **Pull existing schema**: `npx prisma db pull`
2. **Add the `RoyalPortraitCreation` model** to `schema.prisma`
3. **Push changes**: `npx prisma db push`
4. **Cleanup**: Remove other apps' models from `schema.prisma`, keep only `Account`, `Session`, `User`, `VerificationToken`, `RoyalPortraitCreation`
5. **Generate client**: `npx prisma generate`

## 💻 Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🏗️ Technical Architecture

- **Framework**: Next.js 16 (App Router)
- **AI Model**: MuAPI `portrait-stylist` (Runware provider)
- **Auth**: NextAuth.js v4 with Google OAuth + Prisma Adapter
- **Database**: PostgreSQL (Supabase shared pool) via Prisma ORM
- **Payments**: Stripe (one-time credit purchases)
- **Styling**: Tailwind CSS v4 with royal gold dark theme
- **Generation Pipeline**: POST → inline polling (18s) → webhook fallback → auto-sync on GET
