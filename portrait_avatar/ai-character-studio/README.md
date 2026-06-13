# 🎭 AI Character Studio — Open-Source AI Character Creator & Roleplay Chat SaaS (Free Character.ai / Replika Alternative)

> **Create custom AI character portraits and engage in deep roleplay conversations in seconds.** A production-ready, self-hostable Next.js SaaS boilerplate with text-to-avatar generation, image-guided refinement, interactive chat personas, and built-in Stripe billing. A free open-source alternative to Character.ai, Replika, Kindroid, and Joyland AI — powered by the MuAPI AI engine.

**Tech stack:** Next.js 14 (App Router) · Prisma · PostgreSQL · NextAuth (Google OAuth) · Stripe · Tailwind CSS · MuAPI Nano Banana Pro
**Use cases:** AI companion apps · Character roleplay platforms · Game character design · AI storytelling · Virtual influencer creation · Chatbot personas · Creative writing tools · Interactive fiction

![AI Character Studio UI](https://cdn.muapi.ai/data/2/592412483657/Screenshot_2026-05-27_201550.png)

<p align="center">
  <a href="https://github.com/Anil-matcha/awesome-generative-ai-apps">
    <img src="https://img.shields.io/badge/Part%20of-Awesome%20Generative%20AI%20Apps-FFD700?style=for-the-badge&logo=github&logoColor=black" alt="Awesome Generative AI Apps">
  </a>
</p>

> 🎨 **[Explore 50+ more open-source AI apps →](https://github.com/Anil-matcha/awesome-generative-ai-apps)**

## 🌐 Try the Live Engine

**Hosted Demo:** [ai-character-studio-beta.vercel.app](https://ai-character-studio-beta.vercel.app/)

Experience the full glassmorphic, responsive interface. Sign in with Google to explore the Studio, customize dropdowns (Aspect Ratio, Output Quality), upload a reference avatar, and preview your high-converting conversational companions directly from your browser.

---

AI Character Studio is not just another wrapper — it's a production-ready, highly-optimized AI web application. Out of the box, it seamlessly manages User Authentication, Credits & Billing, Creations Persistence, and asynchronous AI generation polling using a sleek Next.js (App Router) architecture. It empowers you to build professional-grade AI workflows with built-in mobile optimization, making it the perfect starting point for your next AI SaaS.

**Why use AI Character Studio?**

- **Production-Ready SaaS** — Complete with Google OAuth and Stripe Checkout workflows built-in.
- **Studio Control Center** — Customize aspect ratio, output quality (1K/2K/4K), and optionally upload a reference avatar image.
- **Dynamic Dialogue Chat Hub** — Fully integrated interactive chat console letting you converse in real-time with your generated characters.
- **Direct MuAPI Integration** — Uses `nano-banana-pro` for text-to-image and `nano-banana-pro-edit` for image-guided refinement.
- **Responsive UX** — Dynamic sliding dropdowns, micro-animations, and complete mobile-stacked responsiveness.

## ✨ Core Features

- **Kinetic Configurator Panel** — Input backstories in an expanding textarea, choose aspect ratio and output quality, and optionally upload a reference avatar photo.
- **Custom Dropdowns** — Sleek custom selectors featuring Chevron down/up animations, absolute overlays, and `overscroll-contain` wheel scroll-chaining preventions.
- **Interactive Chat Hub** — Once your character portrait compiles, the dashboard transforms into an active conversational hub linking directly to `/api/chat`.
- **History Archive** — A persistent gallery with complete modal detail views, copies of system prompts, and dialogue chat interfaces.
- **Credit Tiers & Billing** — Complete Stripe integration. Deduct **24 credits** per 1K/2K generation and **36 credits** for 4K quality. Route users to price tier panels (Basic, Standard, Pro, Business) to buy bundles.

---

## ⚡ Deployment: Vercel & Production

Deploying an instance of AI Character Studio to the web requires minimal configuration. The architecture is engineered explicitly for **Vercel** serverless environments.

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/SamurAIGPT/ai-character-studio)

> **Pro Tip:** Fork this repository, replace `YOUR_GITHUB_USER` in the link above, to streamline deployments for your private forks.

### 🔑 Required Environment Variables

To successfully deploy and run, you must populate the following environment variables in your Vercel project settings:

| Service               | Variable                             | Description & Source                                                                         |
| :-------------------- | :----------------------------------- | :------------------------------------------------------------------------------------------- |
| **Database**          | `DATABASE_URL`                       | PostgreSQL connection string ([Supabase](https://supabase.com) shared pool with pgbouncer)  |
|                       | `DIRECT_URL`                         | Direct DB connection for Prisma migrations and pushes                                        |
| **NextAuth / Google** | `NEXTAUTH_SECRET`                    | Secure random string generated via `openssl rand -base64 32`                                 |
|                       | `NEXTAUTH_URL`                       | Your production domain (e.g. `https://ai-character-studio.vercel.app`)                      |
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
git clone https://github.com/SamurAIGPT/ai-character-studio
cd ai-character-studio

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
> 2. **Declare relation changes**: Inject the `CharacterStudioCreation` model in your local `schema.prisma` and link it inside the `User` model.
> 3. **Push to database**: Run `npx prisma db push` to merge changes safely.
> 4. **Local Schema Cleanup**: Strip away other applications' models from your local `schema.prisma`, leaving only `Account`, `Session`, `User`, `VerificationToken`, and `CharacterStudioCreation`.
> 5. **Compile local client**: Run `npx prisma generate` to build your local Prisma client.

---

## 🏗️ Technical Architecture

This application decouples visually rich UI elements from core business logic layers, emphasizing modularization.

```
ai-character-studio/
├── prisma/
│   └── schema.prisma           # Postgres tables: Users, Accounts, CharacterStudioCreations
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # Backend API Routes (Stripe, MuAPI LLM/Images, Auth)
│   │   │   ├── auth/           # NextAuth catch-all routes
│   │   │   ├── billing/        # Stripe Checkout session builders and webhook listeners
│   │   │   ├── chat/           # Live character conversational dialogue route
│   │   │   └── creations/      # Creations database fetch and POST polling endpoints
│   │   ├── gallery/            # Detailed css grid completed characters gallery
│   │   ├── pricing/            # Interactive packaging tier checkout selection page
│   │   ├── layout.js           # Head assets and metadata
│   │   ├── globals.css         # Styling system theme and gradients
│   │   └── page.js             # Main Studio generation and companion chat interface
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

_AI Character Studio: A modular, mobile-ready, production-grade AI character creation and dialogue engine built for creators and builders._