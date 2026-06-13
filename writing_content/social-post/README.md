> 📦 **Original repo:** [SamurAIGPT/social-post](https://github.com/SamurAIGPT/social-post)

# 📱 Social Post AI — Open-Source AI Social Media Post Generator SaaS (Free Buffer AI / Jasper Social Alternative)

> **Generate platform-native social media posts for LinkedIn, Twitter/X, Instagram, Facebook, Reddit, and LINE in seconds.** A production-ready, self-hostable Next.js SaaS boilerplate with live platform mockups, multi-tone generation, publish intents, and built-in Stripe billing. A free open-source alternative to Buffer AI, Jasper Social, Hootsuite OwlyWriter, Publer, and Copy.ai — powered by the MuAPI AI engine.

**Tech stack:** Next.js 14 (App Router) · Prisma · PostgreSQL · NextAuth (Google OAuth) · Stripe · Tailwind CSS · MuAPI any-llm
**Use cases:** Social media managers · Content creators · Marketing agencies · Influencers · Brand managers · Startup growth teams · E-commerce stores · Newsletter writers

<p align="center">
  <a href="https://github.com/Anil-matcha/awesome-generative-ai-apps">
    <img src="https://img.shields.io/badge/Part%20of-Awesome%20Generative%20AI%20Apps-FFD700?style=for-the-badge&logo=github&logoColor=black" alt="Awesome Generative AI Apps">
  </a>
</p>

> 🎨 **[Explore 50+ more open-source AI apps →](https://github.com/Anil-matcha/awesome-generative-ai-apps)**

## 🌐 Try the Live Engine

**Hosted Demo:** [social-post-woad.vercel.app](https://social-post-woad.vercel.app/)

Experience the full glassmorphic, responsive interface. Sign in with Google to explore the Studio, customize dropdowns (Language, Character Length, and Tones), and preview mock social feeds directly from your browser.

---

AI Social Post Generator is not just another wrapper — it's a production-ready, highly-optimized AI web application. Out of the box, it seamlessly manages User Authentication, Credits & Billing, Creations Persistence, and asynchronous AI generation polling using a sleek Next.js (App Router) architecture. It empowers you to build professional-grade AI workflows with built-in mobile optimization, making it the perfect starting point for your next AI SaaS.

**Why use AI Social Post Generator?**

- **Production-Ready SaaS** — Complete with Google OAuth and Stripe Checkout workflows built-in.
- **Studio Control Center** — Customize dropdowns for platform type, tone of voice, language translation, and character constraints.
- **Dynamic Live Previews** — Tailor-made mockup cards for LinkedIn, Twitter / X, Instagram, Facebook, Reddit, and LINE.
- **Real Publishing Intents** — Seamlessly launch composer windows pre-filled with your generated post copy with one click.
- **Responsive UX** — Dynamic sliding dropdowns, micro-animations, and complete mobile-stacked responsiveness.

![AI Social Post Generator Dashboard UI](https://cdn.muapi.ai/data/2/549775676598/Screenshot_2026-05-26_181917.png)

## ✨ Core Features

- **Kinetic Studio Panel** — Input topics in an expanding textarea, select platforms, tones, and toggle advanced settings (Include Emojis, Include Hashtags, and Include Title / Headline).
- **Custom Dropdowns** — Sleek custom selectors featuring Chevron down/up animations, absolute overlays, and `overscroll-contain` wheel scroll-chaining preventions.
- **Dynamic Platform Mockups** — Tailor-made preview cards reflecting genuine social feeds:
  - **LinkedIn**: Profile headers, like counts, and professional corporate styling.
  - **Twitter / X**: X-premium checkmark badges, sleek black themes, tweet formatting, and 280-character limit alerts.
  - **Instagram**: Styled visual placeholder frame banner, caption layouts, and heart counts.
  - **Reddit**: Standard dark r/socialpost community headers, author tags, upvote/downvote arrows, and markdown titles.
  - **LINE**: Broadcasting chat bubble framework with official brand icons and chat timestamps.
- **Publishing Intent Gateway** — Segmented choice for **Manual Copy** (to clipboard) vs. **Direct Publish** (launches mock OAuth connection stepper steps and pre-populates X/LINE/Reddit compose editors).
- **History Archive** — A persistent gallery with complete modal detail views, copies, and updates.
- **Credit Tiers & Billing** — Complete Stripe integration. Deduct **4 credits** ($0.02) per generated post and route users to price tier panels (Basic, Standard, Pro, Business) to buy bundles.

---

## ⚡ Deployment: Vercel & Production

Deploying an instance of AI Social Post Generator to the web requires minimal configuration. The architecture is engineered explicitly for **Vercel** serverless environments.

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/SamurAIGPT/social-post)

> **Pro Tip:** Fork this repository, replace `YOUR_GITHUB_USER` in the link above, to streamline deployments for your private forks.

### 🔑 Required Environment Variables

To successfully deploy and run, you must populate the following environment variables in your Vercel project settings:

| Service               | Variable                             | Description & Source                                                                         |
| :-------------------- | :----------------------------------- | :------------------------------------------------------------------------------------------- |
| **Database**          | `DATABASE_URL`                       | PostgreSQL connection string ([Supabase](https://supabase.com) shared pool with pgbouncer)  |
|                       | `DIRECT_URL`                         | Direct DB connection for Prisma migrations and pushes                                        |
| **NextAuth / Google** | `NEXTAUTH_SECRET`                    | Secure random string generated via `openssl rand -base64 32`                                 |
|                       | `NEXTAUTH_URL`                       | Your production domain (e.g. `https://social-post-woad.vercel.app`)                          |
|                       | `GOOGLE_CLIENT_ID`                   | Get from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)           |
|                       | `GOOGLE_CLIENT_SECRET`               | Get from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)           |
| **Stripe Billing**    | `STRIPE_SECRET_KEY`                  | Get from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)                            |
|                       | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Get from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)                            |
|                       | `STRIPE_WEBHOOK_SECRET`              | Webhook secret for resolving credit purchases                                                |
| **AI Generator**      | `MU_API_KEY`                         | Create an account and get key from [muapi.ai/access-keys](https://muapi.ai/access-keys)      |
|                       | `WEBHOOK_URL`                        | Callback URL for receiving slow-running generation events                                    |

### 🚀 Launching on Vercel: Step-by-Step

1. **Database Provisioning**: Create a new Postgres database (via completely free tiers on Vercel Postgres, Supabase, or Neon). Retrieve the pooling connection string (`DATABASE_URL`) and direct connection string (`DIRECT_URL`).
2. **Project Creation**: Import your GitHub fork into the Vercel dashboard.
3. **Configure Environment Variables**: Copy the variables above into the Vercel project settings environment tab.
4. **Deploy**: Hit "Deploy". Vercel will automatically run the build steps (`npm run build`).
5. **Database Push**: Since Prisma does not automatically migrate via Vercel builds by default, you may want to append `npx prisma db push && ` to your Vercel build command, or manually run it locally pointing to your production database URL.
6. **Integrations Setup**:
   - Establish a **Google Cloud OAuth app**, enabling the callback URL: `https://social-post-woad.vercel.app/api/auth/callback/google`
   - Setup a **Stripe Webhook**, pointing to `https://social-post-woad.vercel.app/api/stripe/webhook` and selecting the `checkout.session.completed` event to grab your webhook signing secret.

---

## 🛠️ Local Development

Ready to iterate locally? Setup is straightforward.

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v18 or higher)
- A local PostgreSQL instance or a free cloud Database URL.

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/SamurAIGPT/social-post
cd social-post

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

1. **Pull all existing tables**: `npx prisma db pull` (introspects all 20+ active tables)
2. **Declare relation changes**: Inject the `SocialPostCreation` model in your local `schema.prisma` and link it inside the `User` model.
3. **Push to database**: Run `npx prisma db push` to merge changes safely.
4. **Local Schema Cleanup**: Strip away other applications' models from your local `schema.prisma`, leaving only `Account`, `Session`, `User`, `VerificationToken`, and `SocialPostCreation`.
5. **Compile local client**: Run `npx prisma generate` to build your local Prisma client.

---

## 🏗️ Technical Architecture

This application decouples visually rich UI elements from core business logic layers, emphasizing modularization.

```
social-post/
├── prisma/
│   └── schema.prisma           # Postgres tables: Users, Accounts, Creations
├── src/
│   ├── app/                    # Next.js 16 App Router
│   │   ├── api/                # Backend API Routes (Stripe, MuAPI any-llm, Auth)
│   │   │   ├── auth/           # NextAuth catch-all routes
│   │   │   ├── billing/        # Stripe Checkout session builders and webhook listeners
│   │   │   └── creations/      # Creations database fetch and POST polling endpoints
│   │   ├── gallery/            # Detailed css grid completed user posts gallery
│   │   ├── pricing/            # Interactive packaging tier checkout selection page
│   │   ├── layout.js           # Head assets and metadata
│   │   ├── globals.css         # Styling system theme and gradients
│   │   └── page.js             # Main Studio generation and social preview interface
│   ├── components/
│   │   └── Navbar.jsx          # Collapsible responsive navigation component
│   └── lib/
│       ├── prisma.js           # Shared ORM client singleton
│       ├── auth.js             # Google OAuth callback options
│       ├── config.js           # Platform metadata and price tiers
│       └── services/
│           ├── user.js         # Credit adjustment database hooks
│           ├── billing.js      # Stripe construction services
│           └── ai.js           # MuAPI predictions submissions and fallback mocks
├── next.config.mjs             # Next Configuration
├── tailwind.config.js          # Project theme specs
└── package.json
```

## 📄 License

MIT Licensed.

---

_AI Social Post Generator: A modular, mobile-ready, production-grade AI web application engine built for creators and builders._
