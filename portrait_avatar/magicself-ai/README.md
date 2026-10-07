# ✨ MagicSelf AI — Open-Source AI Selfie-to-Artwork Generator SaaS (Free Lensa AI / Prisma Alternative)

> **Transform any selfie into oil paintings, watercolors, anime, digital art, and more in seconds.** A production-ready, self-hostable Next.js SaaS boilerplate with multiple art style presets, webhook-backed async delivery, and built-in Stripe billing. A free open-source alternative to Lensa AI, Prisma, ToonMe, and Meitu — powered by the MuAPI AI engine.

**Tech stack:** Next.js 14 (App Router) · Prisma · PostgreSQL · NextAuth (Google OAuth) · Stripe · Tailwind CSS · MuAPI nano-banana-2-edit · Webhook-backed async delivery
**Use cases:** AI avatar creation · Social media profile art · Digital art gifts · Print-on-demand portraits · Creative selfie apps · NFT avatar generation · Personal branding · Anime art communities

![MagicSelf AI Interface](https://cdn.muapi.ai/data/2/661300328104/Screenshot_2026-05-29_143653.png)

<p align="center">
  <a href="https://github.com/Anil-matcha/awesome-generative-ai-apps">
    <img src="https://img.shields.io/badge/Part%20of-Awesome%20Generative%20AI%20Apps-FFD700?style=for-the-badge&logo=github&logoColor=black" alt="Awesome Generative AI Apps">
  </a>
</p>

> 🎨 **[Explore 50+ more open-source AI apps →](https://github.com/Anil-matcha/awesome-generative-ai-apps)**

https://github.com/user-attachments/assets/ea5b3cbe-c7f4-467e-8ee2-18629e833ba4

## 🌐 Project Details

**GitHub Repository:** [github.com/SamurAIGPT/magicself-ai](https://github.com/SamurAIGPT/magicself-ai)

**Live Demo:** [magicself-ai.vercel.app](https://magicself-ai.vercel.app/)

---

MagicSelf AI is a premium SaaS web application that transforms user portraits and selfies into signature artwork using the `nano-banana-2-edit` style transfer model. Users upload a selfie, select an artistic style, customize the AI prompt guidance, and interactively compare original and generated canvases.

## ✨ Core Features

### 🎨 AI Selfie Studio (Main Page `/`)
- Upload portrait selfie via drag-and-drop or file selector
- **6 Premium Art Style Presets** with pre-filled prompt templates:
  - 🎨 **Oil Painting** — Rich textures and classic brushstrokes
  - 💧 **Watercolor** — Soft washes and delicate paper grain
  - 💻 **Digital Art** — Vibrant modern color gradients and high polish
  - 🌸 **Anime Style** — expressive big eyes and dynamic cell shading
  - ✏️ **Pencil Sketch** — Hand-drawn crosshatching and intricate shading
  - 💥 **Pop Art** — Bold halftone comic book retro patterns
- Fully editable AI prompt for custom creative directions
- Advanced model options: Aspect Ratio, Resolution (1k/2k/4k), Output Format (jpg/png)
- Draggable Before/After vertical split comparison slider
- Cost: **12 credits** per AI artwork generation

### 🖼️ Personal Masterpiece Gallery (`/gallery`)
- Responsive CSS grid of completed selfie artworks
- Detail view modal with full Before/After draggable comparison slider
- Server-side CORS-bypass download proxy (HD download)
- Auto-refresh gallery every 4 seconds to poll processing generations

### 💳 Stripe Credit Billing (`/pricing`)
- Four one-time credit packs (no subscriptions):
  - **Basic Pack** ($5 / 1,000 credits — ~83 runs)
  - **Standard Pack** ($10 / 2,000 credits — ~166 runs)
  - **Professional Pack** ($20 / 4,000 credits — ~333 runs — Most Popular)
  - **Business Pack** ($50 / 10,000 credits — ~833 runs)

### 🔐 Google Auth & live balance syncing
- NextAuth Google Provider with Prisma PostgreSQL adapter
- Pulse credit balances display in Navbar

---

## ⚡ Deployment: Vercel & Production

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/SamurAIGPT/magicself-ai)

### 🔑 Required Environment Variables

| Service | Variable | Description |
| :--- | :--- | :--- |
| **Database** | `DATABASE_URL` | PostgreSQL connection string (Supabase or Neon) |
| **NextAuth** | `NEXTAUTH_SECRET` | Secure random string via `openssl rand -base64 32` |
| | `NEXTAUTH_URL` | Your production domain |
| | `WEBHOOK_URL` | Public URL for MuAPI async callbacks |
| **Google OAuth** | `GOOGLE_CLIENT_ID` | Google Cloud Console OAuth |
| | `GOOGLE_CLIENT_SECRET` | Google Cloud Console OAuth |
| **Stripe** | `STRIPE_SECRET_KEY` | Stripe Secret Key |
| | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Publishable Key |
| | `STRIPE_WEBHOOK_SECRET` | Webhook signing secret |
| **AI** | `MUAPIAPP_API_KEY` | Get from [muapi.ai](https://muapi.ai?utm_source=github&utm_medium=readme&utm_campaign=magicself-ai) |

### 🚀 Production Deployment Setup

1. **Database**: Spin up a PostgreSQL instance.
2. **Import**: Import the forked repo into Vercel.
3. **Environment**: Add all required env keys listed above.
4. **Build Script**: Project builds automatically using `prisma generate && next build`.
5. **Database sync**: Run `npx prisma db push` to generate tables.
6. **Callbacks**:
   - Google: `https://your-app.vercel.app/api/auth/callback/google`
   - Stripe Webhook: `https://your-app.vercel.app/api/stripe/webhook`
   - MuAPI: `https://your-app.vercel.app/api/webhook/muapi`

---

## 🛠️ Local Development

### Prerequisites
- Node.js v18+
- PostgreSQL connection string

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/SamurAIGPT/magicself-ai
cd magicself-ai

# 2. Install dependencies
npm install

# 3. Setup local environment
cp .env.example .env
# Fill in credentials

# 4. Generate Client & Sync DB
npx prisma generate
npx prisma db push

# 5. Start dev server
npm run dev
```

---

## ⚠️ Database Safety Warning (Shared Pool)

The database is shared across multiple applications. Running `npx prisma db push` on a clean schema will drop other apps' tables. Always follow the **Pull-Declare-Push-Cleanup** sequence:

1. `npx prisma db pull` — Introspect all existing tables into `schema.prisma`
2. Add your `MagicSelfCreation` model and its `User` relation
3. `npx prisma db push` — Safely add new tables and relations
4. Clean `schema.prisma` to keep only `Account`, `Session`, `User`, `VerificationToken`, `MagicSelfCreation`
5. `npx prisma generate` — Rebuild the type-safe Prisma client

---

## 🏗️ Technical Architecture

```
magicself-ai/
├── prisma.config.ts          # Dynamic datasource for Prisma v7
├── prisma/
│   └── schema.prisma         # MagicSelfCreation model + NextAuth tables
├── src/
│   ├── app/
│   │   ├── page.js           # Studio Page (upload, custom dropdown, compare slider)
│   │   ├── gallery/page.js   # Personal gallery page
│   │   ├── pricing/page.js   # Stripe pricing plans
│   │   └── api/
│   │       ├── auth/         # NextAuth route handler
│   │       ├── upload/       # CDN upload proxy
│   │       ├── generation/   # Credit deduction & nano-banana-2-edit trigger
│   │       ├── creations/    # GET/DELETE creations with self-healing polling
│   │       ├── download/     # CORS-bypass download proxy
│   │       ├── webhook/muapi/ # MuAPI async callback webhook
│   │       └── stripe/       # Stripe checkout session + webhook
│   ├── components/
│   │   ├── Providers.jsx     # Auth session provider wrapper
│   │   └── layout/Navbar.jsx # Sticky navigation and control headers
│   └── lib/
│       ├── auth.js           # Auth config
│       ├── config.js         # Costs (12 credits) and pricing keys
│       ├── prisma.js         # Singleton Prisma client connection pool
│       ├── stripe.js         # Stripe configuration
│       └── services/
│           ├── user.js       # Credits deduction service
│           └── billing.js    # stripe session helper
└── next.config.mjs           # Next image routing config
```

---

## 📄 License

MIT Licensed.

---

_MagicSelf AI: A premium, dark-themed AI selfie-to-artwork SaaS built with the Inter font family and Nano Banana 2._
