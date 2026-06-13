# 💄 AI Professional Makeup Generator — Open-Source Virtual Makeup Try-On SaaS (Free YouCam Makeup / ModiFace Alternative)

> **Try on professional makeup looks virtually before buying or booking in seconds.** A production-ready, self-hostable Next.js SaaS boilerplate built for beauty brands, salons, and DTC apps — replaces $50/mo virtual try-on tools. A free open-source alternative to YouCam Makeup, ModiFace, Perfect Corp, and BeautyPlus — powered by the MuAPI AI engine.

**Tech stack:** Next.js 14 (App Router) · Prisma · PostgreSQL · NextAuth (Google OAuth) · Stripe · Tailwind CSS · MuAPI nano-banana-2-edit · Webhook-backed async delivery
**Use cases:** Beauty salon client styling · Cosmetics brand e-commerce · Virtual makeup tutorials · Influencer content creation · Beauty app marketing · Makeup artist portfolios · DTC beauty product try-on · Skincare & cosmetics retail

![AI Professional Makeup Generator Interface Screenshot](https://cdn.muapi.ai/data/2/249832875583/Screenshot_2026-05-29_110441.png)

<p align="center">
  <a href="https://github.com/Anil-matcha/awesome-generative-ai-apps">
    <img src="https://img.shields.io/badge/Part%20of-Awesome%20Generative%20AI%20Apps-FFD700?style=for-the-badge&logo=github&logoColor=black" alt="Awesome Generative AI Apps">
  </a>
</p>

> 🎨 **[Explore 50+ more open-source AI apps →](https://github.com/Anil-matcha/awesome-generative-ai-apps)**

## 🌐 Project Details

**GitHub Repository:** [github.com/SamurAIGPT/ai-professional-makeup-generator](https://github.com/SamurAIGPT/ai-professional-makeup-generator)

**Live Demo Preview:** [ai-professional-makeup-generator.vercel.app](https://ai-professional-makeup-generator.vercel.app/)

---

AI Professional Makeup Generator is a production-ready, highly-optimized AI web application. Out of the box, it seamlessly manages User Authentication, Credits & Billing, Image Persistence, and asynchronous makeup generation using a sleek Next.js (App Router) architecture. It empowers users, salons, and artists to render custom makeup styles realistically onto portrait selfies.

**Why use AI Professional Makeup Generator?**

- **Production-Ready SaaS** — Complete with Google OAuth and Stripe Checkout workflows built-in.
- **Virtual Makeover Studio** — Upload portrait photos and makeup style reference images, choose custom prompts, and see results instantly.
- **Webhook-Backed AI Delivery** — MuAPI async webhook delivers results directly into the database (`/api/webhook/muapi`), keeping API routes non-blocking and preventing request timeouts.
- **Personal Showroom Gallery** — All generated try-ons are saved to PostgreSQL. Users can review, compare, download, and delete their designs from `/gallery`.
- **Responsive Screen-Fitting** — Designed with a fluid layout that fits perfectly on all screens (mobile, tablet, desktop) using stacked adaptive grids on mobile and viewport-locked scrolling on desktop.

---

## ✨ Core Features

### 🎨 Virtual Makeover Studio (Main Page `/`)
- Dual image uploads via file picker or drag-and-drop: one for the target portrait/face photo, and another for the makeup style reference.
- Customizable prompt styling to specify details such as eyeshadow color, lipstick shade, or texture intensity.
- Cost: **12 credits** per AI Makeup simulation.

### 🖼️ Personal Showroom Gallery (`/gallery`)
- Visual card grid of all generated makeup simulations.
- Cards show a thumbnail, prompt summary, creation date, and status (`processing` / `completed` / `failed`).
- Full-screen viewer modal with a floating overlay of the input photos for reference, along with **Download HD** and **Delete Result** actions.

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

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/SamurAIGPT/ai-professional-makeup-generator)

**Live App:** [ai-professional-makeup-generator.vercel.app](https://ai-professional-makeup-generator.vercel.app/)

### 🔑 Required Environment Variables

To successfully deploy and run, you must populate the following environment variables in your Vercel project settings:

| Service | Variable | Description & Source |
| :--- | :--- | :--- |
| **Database** | `DATABASE_URL` | PostgreSQL connection string (Supabase or Neon) |
| **NextAuth / Google** | `NEXTAUTH_SECRET` | Secure random string generated via `openssl rand -base64 32` |
| | `NEXTAUTH_URL` | Your production domain (e.g. `https://my-app.vercel.app`) |
| | `WEBHOOK_URL` | Public URL for MuAPI async callbacks (same as `NEXTAUTH_URL` in production) |
| | `GOOGLE_CLIENT_ID` | Get from Google Cloud Console |
| | `GOOGLE_CLIENT_SECRET` | Get from Google Cloud Console |
| **Stripe Billing** | `STRIPE_SECRET_KEY` | Get from Stripe Dashboard |
| | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Get from Stripe Dashboard |
| | `STRIPE_WEBHOOK_SECRET` | Webhook secret for resolving credit purchases |
| **AI Generation** | `MUAPIAPP_API_KEY` | Create an account and get key from [muapi.ai](https://muapi.ai) |

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

- Node.js (v18 or higher)
- A local PostgreSQL instance or a free cloud Database URL.
- ngrok (optional, for local MuAPI webhook testing)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/SamurAIGPT/ai-professional-makeup-generator
cd ai-professional-makeup-generator

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

The database workspace is shared with other applications. Running `npx prisma db push` on a clean, empty schema will drop tables belonging to other applications. Always follow this sequence to perform safe schema synchronization:

1. Run `npx prisma db pull` to fetch all database tables.
2. Declare your `MakeupCreation` table and update the relations on the `User` model.
3. Run `npx prisma db push` to add your changes safely.
4. Clean up `schema.prisma` to keep only NextAuth models, `MakeupCreation`, and the updated `User` relations.
5. Run `npx prisma generate` to rebuild the type-safe client.

---

## 🏗️ Technical Architecture

```
ai-professional-makeup-generator/
├── prisma/
│   ├── prisma.config.ts        # Dynamic datasource settings for Prisma
│   └── schema.prisma           # Postgres schema (User, Account, Session, MakeupCreation)
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.js             # Main Makeup Studio Workspace
│   │   ├── gallery/            # Dedicated showroom gallery view grid
│   │   ├── pricing/            # 4-Plan credit pricing grid ($1 = 200 credits)
│   │   └── api/
│   │       ├── auth/           # NextAuth handler
│   │       ├── upload/         # MuAPI file upload proxy
│   │       ├── generation/     # Credit deduction + MuAPI trigger endpoint
│   │       ├── creations/      # GET / DELETE creations history (with webhook bypass sync)
│   │       ├── webhook/muapi/  # MuAPI async webhook callback handler
│   │       └── stripe/         # Stripe checkout creation + checkout webhook
│   ├── components/
│   │   ├── Providers.jsx       # NextAuth SessionProvider wrapper
│   │   └── layout/Navbar.jsx   # Sticky header with Hamburger, Vercel Deploy & credit balance
│   └── lib/
│       ├── auth.js             # NextAuth config with Prisma adapter
│       ├── config.js           # Central config mapping Google, Stripe, MuAPI keys
│       ├── prisma.js           # Cached Prisma client singleton
│       ├── stripe.js           # Stripe instance initializer
│       └── services/
│           ├── user.js         # Credit management service (12 credits per run)
│           └── billing.js      # Stripe checkout and payment webhook parser
└── next.config.mjs             # Next.js configuration
```

---

## 📄 License

MIT Licensed.

---

_AI Professional Makeup Generator: A premium, high-contrast, fully responsive virtual makeup makeover studio built for cosmetic artists, beauty creators, and styling brands._
