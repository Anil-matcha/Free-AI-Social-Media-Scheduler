# 🧹 ClearMark AI — Open-Source AI Watermark Remover SaaS (Free Watermarkremover.io / HitPaw Alternative)

> **Remove watermarks, logos, stamps, and text overlays from images in seconds with AI.** A production-ready, self-hostable Next.js SaaS boilerplate built for photographers, designers, and content creators — powered by GPT Image 2 via the MuAPI inference layer. A free open-source alternative to Watermarkremover.io, HitPaw, and Inpaint.

**Tech stack:** Next.js 14 (App Router) · Prisma · PostgreSQL · NextAuth (Google OAuth) · Stripe · Tailwind CSS · MuAPI GPT-Image-2 · Webhook-backed async delivery
**Use cases:** Stock photo cleanup · Product image cleaning · Old photo restoration · Document digitization · Photography agencies · Content creator tools · E-commerce listing photos · Print-ready image prep

![ClearMark AI Interface](https://cdn.muapi.ai/data/2/345929059902/Screenshot_2026-05-29_132025.png)

<p align="center">
  <a href="https://github.com/Anil-matcha/awesome-generative-ai-apps">
    <img src="https://img.shields.io/badge/Part%20of-Awesome%20Generative%20AI%20Apps-FFD700?style=for-the-badge&logo=github&logoColor=black" alt="Awesome Generative AI Apps">
  </a>
</p>

> 🎨 **[Explore 50+ more open-source AI apps →](https://github.com/Anil-matcha/awesome-generative-ai-apps)**

https://github.com/user-attachments/assets/0e9019c8-9a72-4d7e-8893-a45218dbeb52

## 🌐 Project Details

**GitHub Repository:** [github.com/SamurAIGPT/clearmark-ai](https://github.com/SamurAIGPT/clearmark-ai)

**Live Demo:** [clearmark-ai.vercel.app](https://clearmark-ai.vercel.app/)

---

ClearMark AI is a production-ready AI web application that removes watermarks, restores old photos, and cleans documents using the `gpt-image-2-image-to-image` model. Users upload a single image, select a processing scenario, customize the AI prompt, and receive a clean, high-resolution result.

## ✨ Core Features

### 🧹 AI Watermark Studio (Main Page `/`)
- Upload any image via file picker or drag-and-drop
- **3 Scenario Quick-Select Presets** with pre-filled prompts:
  - 🖼️ **Remove Watermark** — removes logos, copyright text, and overlays via contextual in-painting
  - 📸 **Restore Old Photo** — fixes scratches, fading, tears, and stamps on vintage photographs
  - 📄 **Clean Document** — removes stamps, annotations, and overlays from scanned receipts and certificates
- Editable AI prompt for custom instructions
- Advanced options: Aspect Ratio, Resolution (1K/2K/4K), Quality (low/medium/high)
- Before/After comparison toggle in the result panel
- Cost: **18 credits** per AI generation

### 🖼️ Personal Gallery (`/gallery`)
- Responsive CSS grid of all watermark-removed images
- Thumbnail overlay showing the original input for reference
- Full-screen detail modal with Before/After toggle, HD download, and delete
- Auto-refresh every 4 seconds for in-progress jobs

### 💳 Stripe Credit Billing (`/pricing`)
- Four one-time credit packs (no subscriptions):
  - **Basic Pack** ($5 / 1,000 credits)
  - **Standard Pack** ($10 / 2,000 credits)
  - **Professional Pack** ($20 / 4,000 credits — Most Popular)
  - **Business Pack** ($50 / 10,000 credits)

### 🔐 Google Auth + Credit Persistence
- NextAuth Google provider with Prisma adapter
- Credits displayed live in the Navbar with a pulsing coin icon

---

## ⚡ Deployment: Vercel & Production

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/SamurAIGPT/clearmark-ai)

**Live App:** [clearmark-ai.vercel.app](https://clearmark-ai.vercel.app/)

### 🔑 Required Environment Variables

| Service | Variable | Description |
| :--- | :--- | :--- |
| **Database** | `DATABASE_URL` | PostgreSQL connection string (Supabase or Neon) |
| **NextAuth** | `NEXTAUTH_SECRET` | Secure random string via `openssl rand -base64 32` |
| | `NEXTAUTH_URL` | Your production domain |
| | `WEBHOOK_URL` | Public URL for MuAPI async callbacks |
| **Google OAuth** | `GOOGLE_CLIENT_ID` | Google Cloud Console |
| | `GOOGLE_CLIENT_SECRET` | Google Cloud Console |
| **Stripe** | `STRIPE_SECRET_KEY` | Stripe Dashboard |
| | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard |
| | `STRIPE_WEBHOOK_SECRET` | Webhook signing secret |
| **AI** | `MUAPIAPP_API_KEY` | Get from [muapi.ai](https://muapi.ai) |

### 🚀 Vercel Deployment Steps

1. **Database**: Create a PostgreSQL instance (Supabase or Neon). Get the `DATABASE_URL`.
2. **Import**: Fork and import the repo into Vercel dashboard.
3. **Environment Variables**: Add all variables above in Vercel project settings.
4. **Deploy**: Vercel runs `prisma generate && next build` automatically.
5. **Schema Push**: Run `npx prisma db push` to sync tables.
6. **Integrations**:
   - Google OAuth: Enable callback `https://your-app.vercel.app/api/auth/callback/google`
   - Stripe Webhook: Point to `https://your-app.vercel.app/api/stripe/webhook`
   - MuAPI Webhook: Point to `https://your-app.vercel.app/api/webhook/muapi`

---

## 🛠️ Local Development

### Prerequisites
- Node.js v18+
- PostgreSQL connection URL (Supabase free tier works)
- ngrok (optional, for local webhook testing)

### Setup

```bash
# 1. Clone
git clone https://github.com/SamurAIGPT/clearmark-ai
cd clearmark-ai

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Fill in your keys

# 4. Initialize database
npx prisma generate
npx prisma db push

# 5. Start dev server
npm run dev
```

> **Webhook Tip:** Run `ngrok http 3000` locally and set `WEBHOOK_URL` to the ngrok HTTPS URL.

---

## ⚠️ Database Safety Warning (Shared Pool)

The database is shared across multiple applications. Running `npx prisma db push` on a clean schema will drop other apps' tables. Always follow the **Pull-Declare-Push-Cleanup** sequence:

1. `npx prisma db pull` — Introspect all existing tables into `schema.prisma`
2. Add your `WatermarkRemoval` model and its `User` relation
3. `npx prisma db push --accept-data-loss` — Safely add new tables only
4. Clean `schema.prisma` to keep only `Account`, `Session`, `User`, `VerificationToken`, `WatermarkRemoval`
5. `npx prisma generate` — Rebuild the type-safe Prisma client

---

## 🏗️ Technical Architecture

```
clearmark-ai/
├── prisma.config.ts          # Dynamic datasource for Prisma v7
├── prisma/
│   └── schema.prisma         # WatermarkRemoval model + NextAuth tables
├── src/
│   ├── app/
│   │   ├── page.js           # AI Studio workspace (upload, scenario, prompt, result)
│   │   ├── gallery/page.js   # Personal gallery with before/after modal
│   │   ├── pricing/page.js   # 4-plan credit pricing grid
│   │   └── api/
│   │       ├── auth/         # NextAuth handler
│   │       ├── upload/       # MuAPI CDN upload proxy
│   │       ├── generation/   # Credit deduction + gpt-image-2-image-to-image trigger
│   │       ├── creations/    # GET / DELETE with self-healing polling
│   │       ├── download/     # Server-side CORS-bypass download proxy
│   │       ├── webhook/muapi/ # Async MuAPI callback handler
│   │       └── stripe/       # Checkout + webhook
│   ├── components/
│   │   ├── Providers.jsx     # NextAuth SessionProvider
│   │   └── layout/Navbar.jsx # Sticky header with hamburger, credits, Vercel deploy
│   └── lib/
│       ├── auth.js           # NextAuth config
│       ├── config.js         # API keys, credit cost (18), plans
│       ├── prisma.js         # Cached Prisma singleton
│       ├── stripe.js         # Stripe instance
│       └── services/
│           ├── user.js       # Credit management
│           └── billing.js    # Stripe checkout + webhook handler
└── next.config.mjs           # Image remote patterns
```

---

## 📄 License

MIT Licensed.

---

_ClearMark AI: A premium, dark-themed AI watermark removal SaaS built with the Inter font family and GPT Image 2._
