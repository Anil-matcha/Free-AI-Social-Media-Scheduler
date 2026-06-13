# ✉️ Mail-Wise — Open-Source AI Email Composer & Cold Outreach SaaS (Free Lavender AI / Reply.io Alternative)

> **Generate high-conversion business emails, cold outreach pitches, and follow-ups in seconds.** A production-ready, self-hostable Next.js SaaS boilerplate with template presets, tone & language controls, one-click mail dispatch, and built-in Stripe billing. A free open-source alternative to Lavender AI, Reply.io, Mailmodo, Superhuman AI, and Instantly.ai — powered by the MuAPI AI engine.

**Tech stack:** Next.js 14 (App Router) · Prisma · PostgreSQL · NextAuth (Google OAuth) · Stripe · Tailwind CSS · MuAPI any-llm
**Use cases:** Sales outreach teams · Cold email marketers · Freelancers · Recruiters · SaaS growth teams · Agency account managers · B2B founders · Business development reps

![Mail-Wise Workstation Screenshot](https://cdn.muapi.ai/data/2/280483013885/Screenshot_2026-05-27_193901.png)

<p align="center">
  <a href="https://github.com/Anil-matcha/awesome-generative-ai-apps">
    <img src="https://img.shields.io/badge/Part%20of-Awesome%20Generative%20AI%20Apps-FFD700?style=for-the-badge&logo=github&logoColor=black" alt="Awesome Generative AI Apps">
  </a>
</p>

> 🎨 **[Explore 50+ more open-source AI apps →](https://github.com/Anil-matcha/awesome-generative-ai-apps)**

## 🌐 Try the Live Engine

**Hosted Demo:** [mail-wise-khaki.vercel.app](https://mail-wise-khaki.vercel.app/)

Experience the full glassmorphic, responsive interface. Sign in with Google to explore the Studio, customize dropdowns (Language, Length, Tones, and Presets), and preview your high-converting business copies directly from your browser.

---

Mail-Wise is a production-ready, highly-optimized AI web application. Out of the box, it seamlessly manages User Authentication, Credits & Billing, Creations Persistence, and asynchronous AI generation polling using a sleek Next.js (App Router) architecture. It empowers you to build professional-grade AI workflows with built-in mobile optimization, making it the perfect starting point for your next AI SaaS.

**Why use Mail-Wise?**

- **Production-Ready SaaS** — Complete with Google OAuth and Stripe Checkout workflows built-in.
- **Studio Control Center** — Customize dropdowns for template presets, tone of voice, language translation, and character constraints.
- **Tactile Toggle Controls** — Replace generic checkboxes with beautiful, sliding pill switches transitioning smoothly from charcoal to active brand colors.
- **Real Dispatch Intents** — One-click integration with your local mail application pre-populated with subject lines and email copy.
- **Responsive UX** — Dynamic sliding dropdowns, micro-animations, and complete mobile-stacked responsiveness.

## ✨ Core Features

- **Kinetic Studio Panel** — Input topics in an expanding textarea, specify target recipients, select tones, and toggle advanced settings (Include CTA, Suggest Subjects).
- **Custom Dropdowns** — Sleek custom selectors featuring Chevron down/up animations, absolute overlays, and `overscroll-contain` wheel scroll-chaining preventions.
- **Upward-Opening Dropdowns** — Configured dropdown lists positioned near view limits to open upwards, avoiding parent viewport boundaries.
- **History Archive** — A persistent gallery with complete modal detail views, subject lists, body copy, and updates.
- **Credit Tiers & Billing** — Complete Stripe integration. Deduct **4 credits** ($0.02) per generated post and route users to price tier panels (Basic, Standard, Pro, Business) to buy bundles.

---

## ⚡ Deployment: Vercel & Production

Deploying an instance of Mail-Wise to the web requires minimal configuration. The architecture is engineered explicitly for **Vercel** serverless environments.

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/SamurAIGPT/mail-wise)

> **Pro Tip:** Fork this repository, replace `YOUR_GITHUB_USER` in the link above, to streamline deployments for your private forks.

### 🔑 Required Environment Variables

To successfully deploy and run, you must populate the following environment variables in your Vercel project settings:

| Service               | Variable                             | Description & Source                                                                         |
| :-------------------- | :----------------------------------- | :------------------------------------------------------------------------------------------- |
| **Database**          | `DATABASE_URL`                       | PostgreSQL connection string ([Supabase](https://supabase.com) shared pool with pgbouncer)  |
|                       | `DIRECT_URL`                         | Direct DB connection for Prisma migrations and pushes                                        |
| **NextAuth / Google** | `NEXTAUTH_SECRET`                    | Secure random string generated via `openssl rand -base64 32`                                 |
|                       | `NEXTAUTH_URL`                       | Your production domain (e.g. `https://mail-wise-khaki.vercel.app`)                                  |
|                       | `GOOGLE_CLIENT_ID`                   | Get from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)           |
|                       | `GOOGLE_CLIENT_SECRET`               | Get from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)           |
| **Stripe Billing**    | `STRIPE_SECRET_KEY`                  | Get from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)                            |
|                       | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Get from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)                            |
|                       | `STRIPE_WEBHOOK_SECRET`              | Webhook secret for resolving credit purchases                                                |
| **AI Generator**      | `MU_API_KEY`                         | Create an account and get key from [muapi.ai/access-keys](https://muapi.ai/access-keys)      |
|                       | `WEBHOOK_URL`                        | Callback URL for receiving slow-running generation events                                    |

---

## 🛠️ Local Development

Ready to iterate locally? Setup is straightforward.

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v18 or higher)
- A local PostgreSQL instance or a free cloud Database URL.

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/SamurAIGPT/mail-wise
cd mail-wise

# 2. Install dependencies
npm install

# 3. Setup Environment
cp .env.example .env
# Open .env and insert your specific keys. You can use a local DB or your dev cloud DB.

# 4. Initialize Database Schema
npx prisma generate
npx prisma db push

# 5. Start the Development Server
npm run dev
```

The graphical console should now be heavily responsive on `http://localhost:3000`.

---

## 🗄️ Database Setup (Prisma Introspection Cycle)

> ⚠️ **Database Safety Warning**: This application shares a single PostgreSQL database instance on Supabase with other applications in this workspace. Follow the cycle below to synchronize models safely:
>
> 1. **Pull all existing tables**: `npx prisma db pull` (introspects all active tables)
> 2. **Declare relation changes**: Inject the `EmailCreation` model in your local `schema.prisma` and link it inside the `User` model.
> 3. **Push to database**: Run `npx prisma db push` to merge changes safely.
> 4. **Local Schema Cleanup**: Strip away other applications' models from your local `schema.prisma`, leaving only `Account`, `Session`, `User`, `VerificationToken`, and `EmailCreation`.
> 5. **Compile local client**: Run `npx prisma generate` to build your local Prisma client.

---

## 🏗️ Technical Architecture

This application decouples visually rich UI elements from core business logic layers, emphasizing modularization.

```
mail-wise/
├── prisma/
│   └── schema.prisma           # Postgres tables: Users, Accounts, EmailCreations
├── src/
│   ├── app/                    # Next.js 16 App Router
│   │   ├── api/                # Backend API Routes (Stripe, MuAPI LLM, Auth)
│   │   │   ├── auth/           # NextAuth catch-all routes
│   │   │   ├── billing/        # Stripe Checkout session builders and webhook listeners
│   │   │   └── creations/      # Creations database fetch and POST polling endpoints
│   │   ├── gallery/            # Detailed css grid completed email drafts gallery
│   │   ├── pricing/            # Interactive packaging tier checkout selection page
│   │   ├── layout.js           # Head assets and metadata
│   │   ├── globals.css         # Styling system theme and gradients
│   │   └── page.js             # Main Studio generation and social preview interface
│   ├── components/
│   │   ├── Navbar.jsx          # Collapsible responsive navigation component
│   │   ├── CustomToggle.jsx    # Custom sliding toggle pill switch
│   │   └── CustomSelect.jsx    # Sleek custom dropdown options select card
│   └── lib/
│       ├── prisma.js           # Shared ORM client singleton
│       ├── auth.js             # Google OAuth callback options
│       ├── config.js           # Platform metadata and price tiers
│       └── services/
│           ├── user.js         # Credit adjustment database hooks
│           ├── billing.js      # Stripe construction services
│           └── ai.js           # MuAPI predictions submissions and fallback mocks
├── next.config.mjs             # Next Configuration
├── package.json
```

## 📄 License

MIT Licensed.

---

_Mail-Wise: A modular, mobile-ready, production-grade AI email copywriting application engine built for creators and builders._
