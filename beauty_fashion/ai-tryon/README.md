# 👕 TryOn AI — Open-Source AI Virtual Try-On & Outfit Fitting SaaS (Free Botika / Lalaland Alternative)

> **Fit any garment onto any person photo in seconds with photorealistic AI.** A production-ready, self-hostable Next.js SaaS boilerplate built for fashion brands, e-commerce stores, stylists, and DTC apparel lines. Replaces $40–$100/mo paid try-on tools. A free open-source alternative to Botika, Lalaland.ai, ZMO.ai, WearView, and Vue.ai — powered by the MuAPI AI engine.

**Tech stack:** Next.js 14 (App Router) · Prisma · PostgreSQL · NextAuth (Google OAuth) · Stripe · Tailwind CSS · MuAPI · Webhook-backed async delivery
**Use cases:** Fashion e-commerce on-model photography · Virtual fitting rooms · Outfit visualization · Shopify clothing stores · Apparel marketing · Personal styling apps · Wardrobe planning · Streetwear product shots · Boutique catalog generation

<p align="center">
  <a href="https://github.com/Anil-matcha/awesome-generative-ai-apps">
    <img src="https://img.shields.io/badge/Part%20of-Awesome%20Generative%20AI%20Apps-FFD700?style=for-the-badge&logo=github&logoColor=black" alt="Awesome Generative AI Apps">
  </a>
</p>

> 🎨 **[Explore 50+ more open-source AI apps →](https://github.com/Anil-matcha/awesome-generative-ai-apps)**

## 🌐 Project Details

**GitHub Repository:** [github.com/SamurAIGPT/ai-tryon](https://github.com/SamurAIGPT/ai-tryon)

**Live Demo Preview:** [ai-tryon-smoky.vercel.app](https://ai-tryon-smoky.vercel.app/)

---

TryOn AI is a production-ready, highly-optimized AI web application. Out of the box, it seamlessly manages User Authentication, Credits & Billing, Image Persistence, and asynchronous AI fitting using a sleek Next.js (App Router) architecture. It empowers fashion enthusiasts, styling brands, and e-commerce stores to render garments realistically onto different body silhouettes — all without photoshoots.

**Why use TryOn AI?**

- **Production-Ready SaaS** — Complete with Google OAuth and Stripe Checkout workflows built-in.
- **Virtual Dressing Studio** — Upload portrait photos and outfit images, select aspect ratios, auto-generate or customize prompts, and see results instantly.
- **Webhook-Backed AI Delivery** — MuAPI async webhook delivers results directly into the database (`/api/webhook/muapi`), keeping API routes non-blocking and preventing request timeouts.
- **Personal Wardrobe Dashboard** — All outfit fittings are saved to PostgreSQL. Users can review, compare, download, and delete their designs from `/dashboard`.
- **Responsive Screen-Fitting** — Designed with a fluid layout that fits perfectly on all screens (mobile, tablet, desktop) using stacked adaptive grids on mobile and viewport-locked scrolling on desktop.

![TryOn AI Screenshot](https://cdn.muapi.ai/data/2/264692615074/Screenshot_2026-05-25_173836.png)

---

## ✨ Core Features

### 🎨 Virtual Dressing Studio (Main Page `/`)
- Dual image upload via file picker or drag-and-drop. Real-time preview shown instantly.
- Custom dropdown for **Aspect Ratio**: Auto Detect, 1:1 (Square), 9:16 (Story), 3:4 (Portrait), 4:3 (Landscape), 16:9 (Widescreen).
- Customizable smart prompt with a **Reset** button to restore the smart default instructions.
- Cost: **18 credits** per AI Try-On generation.

### 🖼️ Personal Wardrobe Gallery (`/dashboard`)
- Visual card grid of all generated outfit try-ons.
- Cards show a thumbnail, aspect ratio, prompt summary, creation date, and status (`processing` / `completed` / `failed`).
- Full-screen viewer modal with a floating overlay of the input photos for reference, along with **Download High-Res** and **Delete Outfit** actions.
- Auto-polls every 4 seconds for any items still in `processing` state.

### 💳 Stripe Credit Billing (`/pricing`)
- Four credit packs based on a **$1 = 200 credits** conversion rate:
  - **Basic Pack** ($5 / 1,000 credits)
  - **Standard Pack** ($10 / 2,000 credits)
  - **Professional Pack** ($20 / 4,000 credits — Most Popular)
  - **Business Pack** ($50 / 10,000 credits)
- No recurring subscriptions — pay once, use at your own pace.
- Credit balance is automatically topped up via Stripe webhook on checkout completion.

### 🔐 Google Auth + Credit Persistence
- NextAuth Google provider with Prisma adapter — user sessions, credit balances, and galleries are all persisted per account.
- Credits displayed live in the Navbar with a pulsing coin icon.

---

## ⚡ Deployment: Vercel & Production

This architecture is engineered explicitly for **Vercel** serverless environments.

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/SamurAIGPT/ai-tryon)

**Live App:** [ai-tryon-smoky.vercel.app](https://ai-tryon-smoky.vercel.app/)

### 🔑 Required Environment Variables

To successfully deploy and run, you must populate the following environment variables in your Vercel project settings:

| Service | Variable | Description & Source |
| :--- | :--- | :--- |
| **Database** | `DATABASE_URL` | PostgreSQL connection string ([Supabase](https://supabase.com) or [Neon](https://neon.tech)) |
| **NextAuth / Google** | `NEXTAUTH_SECRET` | Secure random string generated via `openssl rand -base64 32` |
| | `NEXTAUTH_URL` | Your production domain (e.g. `https://my-app.vercel.app`) |
| | `WEBHOOK_URL` | Public URL for MuAPI async callbacks (same as `NEXTAUTH_URL` in production) |
| | `GOOGLE_CLIENT_ID` | Get from [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| | `GOOGLE_CLIENT_SECRET` | Get from [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| **Stripe Billing** | `STRIPE_SECRET_KEY` | Get from [Stripe Dashboard](https://dashboard.stripe.com/apikeys) |
| | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Get from [Stripe Dashboard](https://dashboard.stripe.com/apikeys) |
| | `STRIPE_WEBHOOK_SECRET` | Webhook secret for resolving credit purchases |
| **AI Generation** | `MUAPIAPP_API_KEY` | Create an account and get key from [muapi.ai/access-keys](https://muapi.ai/access-keys) |

### 🚀 Launching on Vercel: Step-by-Step

1. **Database Provisioning**: Create a new Postgres database (via Supabase or Neon). Retrieve the connection string (`DATABASE_URL`).
2. **Project Creation**: Import your GitHub fork into the Vercel dashboard.
3. **Configure Environment Variables**: Copy the variables above into the Vercel project settings environment tab.
4. **Deploy**: Hit "Deploy". Vercel will automatically run the build steps (`npm run build`).
5. **Database Push**: Run `npx prisma db push` to synchronize database models before launching.
6. **Integrations Setup**:
   - Establish a **Google Cloud OAuth app**, enabling the callback URL: `https://your-app.vercel.app/api/auth/callback/google`
   - Setup a **Stripe Webhook**, pointing to `https://your-app.vercel.app/api/stripe/webhook` and selecting the `checkout.session.completed` event.
   - Register a **MuAPI Webhook** pointing to `https://your-app.vercel.app/api/webhook/muapi` to receive async generation results.

---

## 🛠️ Local Development

Ready to iterate locally? Setup is straightforward.

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v18 or higher)
- A local PostgreSQL instance or a free cloud Database URL.
- [ngrok](https://ngrok.com) (optional, for local MuAPI webhook testing)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/SamurAIGPT/ai-tryon
cd ai-tryon

# 2. Install dependencies
npm install

# 3. Setup Environment
cp .env.example .env
# Open .env and insert your specific keys.

# 4. Initialize Database Schema
# Note: Because the database is shared, see the Safety Warning below!
npx prisma generate
npx prisma db push

# 5. Start the Development Server
npm run dev
```

The console should now be active on `http://localhost:3000`.

> **Webhook Tip:** For local MuAPI webhook testing, run `ngrok http 3000` and set `WEBHOOK_URL` to the generated HTTPS URL in your `.env`.

---

## ⚠️ Database Safety Warning (Shared Pool)

The workspace database is shared with other applications. Running `npx prisma db push` on a clean, empty schema will drop tables belonging to other applications. Always follow the **Pull-Declare-Push-Cleanup** sequence:

1. Run `npx prisma db pull` to fetch all database tables.
2. Declare your `TryOn` table and update the relations on the `User` model.
3. Run `npx prisma db push` to add your changes safely.
4. Clean up `schema.prisma` to keep only NextAuth models, `TryOn`, and the updated `User` relations.
5. Run `npx prisma generate` to rebuild the type-safe client.

---

## 🏗️ Technical Architecture

```
ai-tryon/
├── prisma/
│   └── schema.prisma           # Postgres schema (User, Account, Session, TryOn)
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.js             # Main Studio Workspace (Uploads, Aspect Ratio, Prompt)
│   │   ├── dashboard/          # Personal gallery with review modal & polling
│   │   ├── pricing/            # 4-Plan credit pricing grid ($1 = 200 credits)
│   │   └── api/
│   │       ├── auth/           # NextAuth handler
│   │       ├── upload/         # MuAPI file upload proxy
│   │       ├── tryon/          # Credit deduction + MuAPI trigger endpoint
│   │       ├── tryons/         # GET / DELETE try-on history (per user)
│   │       ├── webhook/muapi/  # MuAPI async webhook callback handler
│   │       └── stripe/         # Stripe checkout creation + checkout webhook
│   ├── components/
│   │   ├── Providers.js        # NextAuth SessionProvider wrapper
│   │   └── layout/Navbar.jsx   # Sticky header with Vercel Deploy button & credit balance
│   └── lib/
│       ├── auth.js             # NextAuth config with Prisma adapter
│       ├── config.js           # Central config mapping Google, Stripe, MuAPI keys
│       ├── prisma.js           # Cached Prisma client singleton
│       ├── stripe.js           # Stripe instance initializer
│       └── services/
│           ├── user.js         # Credit management service (18 credits per run)
│           └── billing.js      # Stripe checkout and payment webhook parser
└── next.config.mjs             # Next.js configuration
```

---

## 📄 License

MIT Licensed.

---

_TryOn AI: A premium, high-contrast, fully responsive virtual outfit fitting room built for fashion creators, brands, and styling teams._
