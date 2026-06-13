# 🏠 AI Room Declutter — Open-Source AI Room Declutter & Interior Redesign SaaS (Free RoomGPT / Reimagine Home Alternative)

> **Instantly transform messy rooms into photorealistic clean interiors with AI.** A production-ready, self-hostable Next.js SaaS boilerplate with design style presets, webhook-backed async generation, and built-in Stripe billing. A free open-source alternative to RoomGPT, Reimagine Home, AI Interior, and Decor Matters — powered by the MuAPI AI engine.

**Tech stack:** Next.js 14 (App Router) · Prisma · PostgreSQL · NextAuth (Google OAuth) · Stripe · Tailwind CSS · MuAPI nano-banana-2-edit · Webhook-backed async delivery
**Use cases:** Home staging · Interior design visualization · Real estate marketing · Rental property refresh · Airbnb listing photos · Home renovation planning · Interior design agencies · Virtual home makeovers

![FutureRoom AI Interface](https://cdn.muapi.ai/data/2/953940679503/Screenshot_2026-05-29_191552.png)

<p align="center">
  <a href="https://github.com/Anil-matcha/awesome-generative-ai-apps">
    <img src="https://img.shields.io/badge/Part%20of-Awesome%20Generative%20AI%20Apps-FFD700?style=for-the-badge&logo=github&logoColor=black" alt="Awesome Generative AI Apps">
  </a>
</p>

> 🎨 **[Explore 50+ more open-source AI apps →](https://github.com/Anil-matcha/awesome-generative-ai-apps)**

## 🌐 Project Details

**GitHub Repository:** [github.com/SamurAIGPT/ai-room-declutter](https://github.com/SamurAIGPT/ai-room-declutter)

**Live Demo:** [ai-room-declutter.vercel.app](https://ai-room-declutter.vercel.app/)

---

FutureRoom AI is a premium SaaS web application that tidies messy interiors using advanced deep learning. Users upload a room picture, select standard vs pro models, configure target design styles directly in the left sidebar, and compare results using a Before/After comparison slider.

## ✨ Core Features

### 🏠 AI Prediction Studio (Main Page `/`)
- Upload messy room photos via drag-and-drop or file selector.
- Fully interactive **guest preview mode** allowing unauthenticated users to explore settings, presets, and sliders, immediately prompting OAuth sign-in only when action triggers are clicked.
- **Dual AI Models**:
  - **Standard (nano-banana-2-edit)**: Fast generation with Google concept search tuning.
  - **Pro (nano-banana-pro-edit)**: High-fidelity enhanced predictions with detailed room and lighting modeling.
- **12 Room Design Presets** with pre-filled prompts:
  - 🛋️ **Modern Living Room** — Clean wood texture, minimalist furniture layout.
  - 🛏️ **Cozy Bedroom** — Tidy beds, organized nightstands, and soft warm light.
  - 🖥️ **Minimalist Office** — Productive, cable-free workspaces.
  - 🍽️ **Bohemian Dining** — Bohemian themed dining setting with clean table surfaces.
  - 🧱 **Industrial Loft** — Exposed brick, spacious structural lines, and neat layouts.
  - 🪵 **Scandinavian Study** — Nordic style clean shelves, desks, and plants.
  - 🍳 **Sleek Kitchen** — Polished counters, organized cabinets, and clean stoves.
  - 🪵 **Rustic Den** — Warm hearth fireplace and tidy reading corners.
  - 🛎️ **Contemporary Suite** — High-end neat suites with hotel lighting.
  - 🛋️ **Classic Lounge** — Spacious lobby seating areas free of visual noise.
  - 🧸 **Airy Nursery** — Toy organization and bright baby nurseries.
  - 🧘 **Zen Studio** — Minimalist meditation and studio layouts.
- **Dynamic Variable Pricing based on Model and Resolution**:
  - **Standard Model (v2 Edit)**:
    - **1K Resolution**: **12 credits**
    - **2K Resolution**: **18 credits**
    - **4K Resolution**: **24 credits**
  - **Pro Model (Enhanced)**:
    - **1K & 2K Resolution**: **24 credits**
    - **4K Resolution**: **36 credits**
- Draggable Before/After vertical split comparison slider to reveal cluttered-to-clean room options.

### 🖼️ Personal Creations Gallery (`/gallery`)
- Responsive CSS grid of completed room declutterings.
- Detail view modal with full Before/After draggable comparison slider.
- Server-side CORS-bypass download proxy (HD download).
- Auto-refresh gallery every 4 seconds to poll processing generations.

### 💳 Stripe Credit Billing (`/pricing`)
- Four one-time credit packs (no subscriptions):
  - **Basic Pack** ($5 / 1,000 credits — ~83 standard runs)
  - **Standard Pack** ($10 / 2,000 credits — ~166 standard runs)
  - **Professional Pack** ($20 / 4,000 credits — ~333 standard runs — Best Value)
  - **Business Pack** ($50 / 10,000 credits — ~833 standard runs)

### 🔐 Google Auth & live balance syncing
- NextAuth Google Provider with Prisma PostgreSQL adapter.
- Pulse credit balances display in Navbar.

---

## ⚡ Deployment: Vercel & Production

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/SamurAIGPT/ai-room-declutter)

### 🔑 Required Environment Variables

| Service | Variable | Description |
| :--- | :--- | :--- |
| **Database** | `DATABASE_URL` | PostgreSQL connection string (Supabase pooled connection) |
| | `DIRECT_URL` | Direct PostgreSQL connection string |
| **NextAuth** | `NEXTAUTH_SECRET` | Secure random string via `openssl rand -base64 32` |
| | `NEXTAUTH_URL` | Your production domain |
| | `WEBHOOK_URL` | Public URL for MuAPI async callbacks |
| **Google OAuth** | `GOOGLE_CLIENT_ID` | Google Cloud Console OAuth |
| | `GOOGLE_CLIENT_SECRET` | Google Cloud Console OAuth |
| **Stripe** | `STRIPE_SECRET_KEY` | Stripe Secret Key |
| | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Publishable Key |
| | `STRIPE_WEBHOOK_SECRET` | Webhook signing secret |
| **AI** | `MUAPIAPP_API_KEY` | Get from [muapi.ai](https://muapi.ai) |

### 🚀 Production Deployment Setup

1. **Database**: Spin up a PostgreSQL instance.
2. **Import**: Import the forked repo into Vercel.
3. **Environment**: Add all required env keys listed above.
4. **Build Script**: Project builds automatically using `prisma generate && next build`.
5. **Database sync**: Run `npx prisma db push` to generate tables.
6. **Callbacks**:
   - Google: `https://ai-room-declutter.vercel.app/api/auth/callback/google`
   - Stripe Webhook: `https://ai-room-declutter.vercel.app/api/stripe/webhook`
   - MuAPI: `https://ai-room-declutter.vercel.app/api/webhook/muapi`

---

## 🛠️ Local Development

### Prerequisites
- Node.js v18+
- PostgreSQL connection string

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/SamurAIGPT/ai-room-declutter
cd ai-room-declutter

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
2. Add your `RoomDeclutter` model and its `User` relation
3. `npx prisma db push` — Safely add new tables and relations
4. Clean `schema.prisma` to keep only `Account`, `Session`, `User`, `VerificationToken`, `RoomDeclutter`
5. `npx prisma generate` — Rebuild the type-safe Prisma client

---

## 🏗️ Technical Architecture

```
ai-room-declutter/
├── prisma.config.ts          # Dynamic datasource for Prisma v7
├── prisma/
│   └── schema.prisma         # RoomDeclutter model + NextAuth tables
├── src/
│   ├── app/
│   │   ├── page.js           # Studio Page (upload, presets sidebar drawer, comparison slider)
│   │   ├── gallery/page.js   # Personal creations gallery
│   │   ├── pricing/page.js   # Stripe pricing plans
│   │   └── api/
│   │       ├── auth/         # NextAuth route handler
│   │       ├── upload/       # CDN upload proxy
│   │       ├── generation/   # Credit deduction & variable resolution trigger
│   │       ├── creations/    # GET/DELETE creations with self-healing polling
│   │       ├── download/     # CORS-bypass download proxy
│   │       ├── webhook/muapi/ # MuAPI async callback webhook
│   │       └── stripe/       # Stripe checkout session + webhook
│   ├── components/
│   │   ├── Providers.jsx     # Auth session provider wrapper
│   │   └── layout/Navbar.jsx # Sticky navigation and control headers
│   └── lib/
│       ├── auth.js           # Auth config
│       ├── config.js         # Resolution variable costs (12, 24, 36) and plans
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

_FutureRoom AI: A premium, indigo-themed AI room decluttering and staging SaaS built with the Inter font family and Nano Banana._
