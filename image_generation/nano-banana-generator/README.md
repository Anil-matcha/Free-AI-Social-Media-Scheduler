# 🚀 Nano Banana Generator — High-Octane AI Web Application

> **A beautifully designed, fully-integrated AI image studio.** Built with Next.js, this open-source template serves as a complete, self-contained SaaS boilerplate for generating, editing, and managing high-quality AI imagery fueled by the Nano Banana engine.

<p align="center">
  <a href="https://github.com/Anil-matcha/awesome-generative-ai-apps">
    <img src="https://img.shields.io/badge/Part%20of-Awesome%20Generative%20AI%20Apps-FFD700?style=for-the-badge&logo=github&logoColor=black" alt="Awesome Generative AI Apps">
  </a>
</p>

> 🎨 **[Explore 50+ more open-source AI apps →](https://github.com/Anil-matcha/awesome-generative-ai-apps)**

## 🌐 Try the Live Engine

**Hosted Demo:** [nano-banana-generator-psi.vercel.app](https://nano-banana-generator-psi.vercel.app)

Experience the full glassmorphic, responsive interface. Sign in with Google to explore the Generation Studio, Edit Mode, and Credit Tiers directly from your browser.

---

Nano Banana Generator is not just another wrapper — it's a production-ready, highly-optimized AI web application. Out of the box, it seamlessly manages User Authentication, Credits & Billing, Image Persistence, and asynchronous AI generation polling using a sleek Next.js (App Router) architecture. It empowers you to build professional-grade AI workflows with built-in mobile optimization, making it the perfect starting point for your next AI SaaS.

**Why use Nano Banana Generator?**

- **Production-Ready SaaS** — Complete with Google OAuth and Stripe Checkout workflows built-in.
- **Dual-Mode Studio** — Seamlessly toggle between prompt-based Text-to-Image generation and Multi-Image Reference editing.
- **Historical Archive** — All creations are securely persisted to a PostgreSQL database for a customized user gallery.
- **Responsive UX** — Dynamic sliding dropdowns, micro-animations, and complete mobile-stacked responsiveness.
- **Extensible API** — Easily swap out the underlying AI engine without breaking the application UI.

![Nano Banana Studio](https://cdn.muapi.ai/data/2/874086171651/Screenshot_2026-04-15_103743.png)

## ✨ Core Features

- **Kinetic Image Studio** — Generate stunning visuals with text prompts. Includes options for advanced `Aspect Ratio` tuning (from 1:1 Square to 21:9 UltraWide), and tiered Resolutions (1K, 2K, 4K) tied directly to a flexible credit cost system.
- **Multi-Image Edit Mode** — Transition smoothly to editing. Upload local images or add up to 14 external image URLs to use as visual reference nodes for complex prompt configurations.
- **Smart Google Search Integration** — Toggle "Smart Search" on to empower validations or enhancements for prompts prior to manifestation.
- **My Creations Archive** — A dedicated history vault for logged-in users. Displays past generations securely fetched from the database, viewable in a detailed inspector modal with 1-click downloads.
- **Credit Tiers & Billing** — Complete Stripe integration. Start users off with a seed balance, map generations to credit deductions, and seamlessly route them to an interactive pricing page to purchase scalable tiers (Starter, Power Engine, Quantum Flow).
- **Beautiful & Dynamic UI** — Built on Tailwind CSS and Framer Motion, ensuring every state transition, loading spinner, and dropdown elegantly guides the user.

---

## ⚡ Deployment: Vercel & Production

Deploying an instance of Nano Banana Generator to the web requires minimal configuration. The architecture is engineered explicitly for **Vercel** serverless environments.

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/SamurAIGPT/nano-banana-generator)

> **Pro Tip:** Fork this repository, replace `YOUR_GITHUB_USER` in the link above, to streamline deployments for your private forks.

### 🔑 Required Environment Variables

To successfully deploy and run, you must populate the following environment variables in your Vercel project settings:

| Service               | Variable                             | Description & Source                                                                         |
| :-------------------- | :----------------------------------- | :------------------------------------------------------------------------------------------- |
| **Database**          | `DATABASE_URL`                       | PostgreSQL connection string ([Supabase](https://supabase.com) or [Neon](https://neon.tech)) |
|                       | `DIRECT_URL`                         | Direct DB connection for Prisma migrations                                                   |
| **NextAuth / Google** | `NEXTAUTH_SECRET`                    | Secure random string generated via `openssl rand -base64 32`                                 |
|                       | `NEXTAUTH_URL`                       | Your production domain (e.g. `https://my-app.vercel.app`)                                    |
|                       | `GOOGLE_CLIENT_ID`                   | Get from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)           |
|                       | `GOOGLE_CLIENT_SECRET`               | Get from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)           |
| **Stripe Billing**    | `STRIPE_SECRET_KEY`                  | Get from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)                            |
|                       | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Get from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)                            |
|                       | `STRIPE_WEBHOOK_SECRET`              | Webhook secret for resolving credit purchases                                                |
| **AI Generator**      | `NANO_BANANA_API_KEY`                | Create an account and get key from [muapi.ai/access-keys](https://muapi.ai/access-keys)      |

### 🚀 Launching on Vercel: Step-by-Step

1. **Database Provisioning**: Create a new Postgres database (via completely free tiers on Vercel Postgres, Supabase, or Neon). Retrieve the pooling connection string (`DATABASE_URL`) and direct connection string (`DIRECT_URL`).
2. **Project Creation**: Import your GitHub fork into the Vercel dashboard.
3. **Configure Environment Variables**: Copy the variables above into the Vercel project settings environment tab.
4. **Deploy**: Hit "Deploy". Vercel will automatically run the build steps (`npm run build`).
5. **Database Push**: Since Prisma does not automatically migrate via Vercel builds by default, you may want to append `npx prisma db push && ` to your Vercel build command, or manually run it locally pointing to your production database URL.
6. **Integrations Setup**:
   - Establish a **Google Cloud OAuth app**, enabling the callback URL: `https://your-app.vercel.app/api/auth/callback/google`
   - Setup a **Stripe Webhook**, pointing to `https://your-app.vercel.app/api/stripe/webhook` and selecting the `checkout.session.completed` event to grab your webhook signing secret.

---

## 🛠️ Local Development

Ready to iterate locally? Setup is straightforward.

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v18 or higher)
- A local PostgreSQL instance or a free cloud Database URL.

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/SamurAIGPT/nano-banana-generator
cd nano-banana-generator

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

## 🏗️ Technical Architecture

This application decouples visually rich UI elements from core business logic layers, emphasizing modularization.

```
nano-banana-generator/
├── prisma/
│   └── schema.prisma           # Postgres tables: Users, Accounts, Creations
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── api/                # Backend API Routes (Stripe, Banana AI, Auth, Uploads)
│   │   ├── creations/          # User's historical web app generations archive
│   │   ├── pricing/            # Interactive tier and credit purchase view
│   │   └── page.js             # Main AI Generation Engine Interface
│   ├── components/
│   │   └── saas/               # Reusable Modular UI Components
│   │       ├── AuthButtons.jsx # Reusable secure auth workflows
│   │       └── Navbar.jsx      # Sticky, responsive global navigation
│   └── lib/
│       ├── prisma.js           # Shared ORM client singleton
│       └── utils.js            # Image array manipulation, downloading tools
├── next.config.mjs             # Next Configuration
├── tailwind.config.js          # Project theme specs
└── package.json
```

## 📄 License

MIT Licensed.

---

_Nano Banana Generator: A modular, mobile-ready, production-grade AI web application engine built for creators and builders._
