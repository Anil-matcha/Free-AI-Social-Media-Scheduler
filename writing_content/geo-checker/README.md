> 📦 **Original repo:** [SamurAIGPT/geo-checker](https://github.com/SamurAIGPT/geo-checker)

# 🌐 GEO Checker — Open-Source AI Generative Engine Optimization (GEO) Auditor SaaS (Free SEMrush / Surfer SEO Alternative)

> **Audit your landing page's AI search visibility and citation potential in seconds.** A production-ready, self-hostable Next.js SaaS boilerplate for marketers, SEO agencies, and developers — checks how well pages are indexed and cited by AI search engines like ChatGPT, Perplexity, and Gemini. A free open-source alternative to SEMrush, Surfer SEO, and enterprise GEO auditing suites — powered by the MuAPI AI engine.

**Tech stack:** Next.js 14 (App Router) · Prisma · PostgreSQL · NextAuth (Google OAuth) · Stripe · Tailwind CSS · MuAPI (Gemini 2.5 Flash via any-llm)
**Use cases:** Marketing agency SEO reports · Landing page AI visibility audits · Pre-launch GEO optimization · Content teams · Startup growth · SaaS product pages · AI search ranking research · SEO consultants

![GEO Checker Interface Screenshot](https://cdn.muapi.ai/data/2/253532639651/Screenshot_2026-05-28_192431.png)

<p align="center">
  <a href="https://github.com/Anil-matcha/awesome-generative-ai-apps">
    <img src="https://img.shields.io/badge/Part%20of-Awesome%20Generative%20AI%20Apps-FFD700?style=for-the-badge&logo=github&logoColor=black" alt="Awesome Generative AI Apps">
  </a>
</p>

> 🎨 **[Explore 50+ more open-source AI apps →](https://github.com/Anil-matcha/awesome-generative-ai-apps)**

## 🌐 Project Details

**GitHub Repository:** [github.com/SamurAIGPT/geo-checker](https://github.com/SamurAIGPT/geo-checker)

**Live Demo Preview:** [geo-checker-silk.vercel.app](https://geo-checker-silk.vercel.app/)

---

GEO Checker is a production-ready, highly-optimized AI web application. Out of the box, it seamlessly manages User Authentication, Credits & Billing, Website HTML Scraping, and asynchronous deep AI reviews using a sleek Next.js (App Router) architecture. It empowers users, agencies, and developers to analyze website copy against LLM indexing rules — all within a stunning visual dashboard.

**Why use GEO Checker?**

- **Production-Ready SaaS** — Complete with Google OAuth and Stripe Checkout workflows built-in.
- **Virtual GEO Audit Studio** — Enter any landing page URL and your target keyword niche to get immediate optimization reviews.
- **Webhook-Backed AI Delivery** — MuAPI async webhook delivers results directly into the database (`/api/webhook/muapi`), keeping API routes non-blocking and preventing request timeouts.
- **Personal Showroom Gallery** — All generated reports are saved to PostgreSQL. Users can review, compare, download, and delete their audits from `/gallery`.
- **Responsive Screen-Fitting** — Designed with a fluid layout that fits perfectly on all screens (mobile, tablet, desktop) using stacked adaptive grids on mobile and viewport-locked scrolling on desktop.

---

## ✨ Core Features

### 🎨 GEO Auditor Studio (Main Page `/`)
- Website url entry alongside custom query target keyword inputs.
- Multi-Select checkboxes to specify which engines to optimize for:
  - **ChatGPT Search**
  - **Perplexity AI**
  - **Google AI Overviews**
  - **Claude Sonnet**
  - **Gemini Pro**
- Advanced settings dropdown panel for:
  - **Prioritize Reasoning Depth** (toggles slower deep-reasoning chains)
  - **Audit Structured Schema** (validates JSON-LD semantic models)
- Cost: **18 credits** per AI Visibility simulation.

### 🖼️ Personal Showroom Gallery (`/gallery`)
- Visual card grid of all generated website audits.
- Cards show a thumbnail/niche description, visibility score, target query, and status (`processing` / `completed` / `failed`).
- Full-screen details modal with a floating overview of recommendations, sitemap rules, and direct **Export JSON** actions utilizing the local proxy.

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

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/SamurAIGPT/geo-checker)

**Live App:** [geo-checker-silk.vercel.app](https://geo-checker-silk.vercel.app/)

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
git clone https://github.com/SamurAIGPT/geo-checker
cd geo-checker

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
2. Declare your `GeoReport` table and update the relations on the `User` model.
3. Run `npx prisma db push` to add your changes safely.
4. Clean up `schema.prisma` to keep only NextAuth models, `GeoReport`, and the updated `User` relations.
5. Run `npx prisma generate` to rebuild the type-safe client.

---

## 🏗️ Technical Architecture

```
geo-checker/
├── prisma/
│   └── schema.prisma           # Postgres schema (User, Account, Session, GeoReport)
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.js             # Main Studio Workspace (Auditor Interface)
│   │   ├── gallery/            # Dedicated showroom gallery view grid
│   │   ├── pricing/            # 4-Plan credit pricing grid ($1 = 200 credits)
│   │   └── api/
│   │       ├── auth/           # NextAuth handler
│   │       ├── scrape/         # Website HTML scrape utility proxy
│   │       ├── generation/     # Credit deduction + MuAPI trigger endpoint
│   │       ├── creations/      # GET / DELETE creations history (with webhook bypass sync)
│   │       ├── download/       # CORS proxy for exporting JSON report files
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
│           ├── user.js         # Credit management service (18 credits per run)
│           └── billing.js      # Stripe checkout and payment webhook parser
└── next.config.mjs             # Next.js configuration
```

---

## 📄 License

MIT Licensed.

---

_GEO Checker: A premium, dark-mode, fully responsive Generative Engine Optimization audit suite built for modern search visibility analysis._
