# 📄 AI Resume Builder — Open-Source AI Resume Builder & Optimizer SaaS (Free Teal / Kickresume Alternative)

> **Generate professional, metrics-driven, ATS-optimized resumes with AI in seconds.** A production-ready, self-hostable Next.js SaaS boilerplate with multiple templates, custom typography, PDF/Word export, and public shareable links — powered by the MuAPI AI engine. A free open-source alternative to Teal, Kickresume, Rezi, Resume.io, and Zety.

**Tech stack:** Next.js 14 (App Router) · Prisma · PostgreSQL · NextAuth (Google OAuth) · Stripe · Tailwind CSS · MuAPI any-llm
**Use cases:** Job seekers · Career coaches · University career centers · Recruiting agencies · LinkedIn profile optimization · Bootcamp graduates · Professional rebranding · ATS resume optimization

<p align="center">
  <a href="https://github.com/Anil-matcha/awesome-generative-ai-apps">
    <img src="https://img.shields.io/badge/Part%20of-Awesome%20Generative%20AI%20Apps-FFD700?style=for-the-badge&logo=github&logoColor=black" alt="Awesome Generative AI Apps">
  </a>
</p>

> 🎨 **[Explore 50+ more open-source AI apps →](https://github.com/Anil-matcha/awesome-generative-ai-apps)**

## 🌐 Try the Live Engine

**Hosted Demo:** [ai-resume-builder-five-olive.vercel.app](https://ai-resume-builder-five-olive.vercel.app/)

Experience the full premium light-mode, highly responsive interface. Sign in with Google to explore the AI Document Workspace, select customized readable font styles, adjust size elements, and test checkout billing pipelines directly from your browser.

---

AI Resume Builder is not just another simple template — it's a production-ready, highly-optimized AI web application. Out of the box, it seamlessly manages User Authentication, Credits & Billing, Creations Persistence, and asynchronous AI resume generation using a sleek Next.js (App Router) architecture. It empowers you to build professional-grade AI document workflows with built-in mobile optimization, custom upward-opening dropdown controls, and sliding pill toggles, making it the perfect starting point for your next SaaS.

**Why use AI Resume Builder?**

- **Production-Ready SaaS Boilerplate** — Fully integrated with NextAuth Google OAuth and Stripe Checkout workflows.
- **Premium Minimalist Light UI** — Sleek, slate-gray layout boundaries, high contrast headings, and a professional canvas frame that feels tactile and modern.
- **Dynamic Style Customization** — Custom upward-opening selectors for resume layout template styles (Modern, Minimal, Creative, Simple, Compact, Professional), readable font families, and precise document sizes.
- **Self-Healing Webhook Bypass** — Dynamic REST handlers automatically polling upstream AI state and updating the local database dynamically when creations list is loaded, preventing offline states.
- **Tactile Sliding Pill Toggles** — Custom styled toggle switches for premium SaaS options, replacing standard unstyled check fields.
- **Public Share Links & Downloads** — Generate shareable public links to send to recruiters, and download print-ready PDFs or editable Word files.

![AI Resume Builder](https://cdn.muapi.ai/data/2/446414352420/Screenshot_2026-05-28_132613.png)

---

## ✨ Core Features

- **Kinetic Document Workstation** — Submit customized writing instructions (tone, focus, target role) alongside structured fields (Personal Profile, Work Experience, Academic History, Personal Projects, Technical Skills) and watch AI optimize descriptions using active verbs and metrics.
- **Step-by-Step Accordion Form** — Extremely descriptive parameter indicators walking users step-by-step through profile details and career data inputs.
- **Premium Upward Select Dropdowns** — Custom absolute select dropdown overlays that open upwards (`bottom-full mb-2`) to avoid layout cut-offs inside sidebars, complete with `overscroll-contain` to isolate scroll actions.
- **Studio Creations History** — Persist all generated resume records in PostgreSQL. Manage history in a dedicated Creations Gallery, supporting instant edit reloading, template duplication, public sharing, and record deletion.
- **Credit Tiers & Stripe Billing** — Fully integrated checkout sessions with Stripe. Purchase one-time package credit tiers (Basic, Standard, Professional, Business) to support AI generations (consuming 18 credits per run).
- **Collapsible Responsive Navigation** — Seamless logo visibility on mobile viewports collapsing links and deployment triggers into an absolute menu overlay with backdrop glass blurs.

---

## ⚡ Deployment: Vercel & Production

Deploying an instance of AI Resume Builder to the web requires minimal configuration. The architecture is engineered explicitly for **Vercel** serverless environments.

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/SamurAIGPT/ai-resume-builder)

> **Pro Tip:** Fork this repository, and replace `YOUR_GITHUB_USER` in the link above, to streamline deployments for your private forks.

### 🔑 Required Environment Variables

To successfully deploy and run, populate the following environment variables in your Vercel project settings:

| Service               | Variable                             | Description & Source                                                                         |
| :-------------------- | :----------------------------------- | :------------------------------------------------------------------------------------------- |
| **Database**          | `DATABASE_URL`                       | PostgreSQL connection string ([Supabase](https://supabase.com) or [Neon](https://neon.tech)) |
|                       | `DIRECT_URL`                         | Direct DB connection for Prisma migrations                                                   |
| **NextAuth / Google** | `NEXTAUTH_SECRET`                    | Secure random string generated via `openssl rand -base64 32`                                 |
|                       | `NEXTAUTH_URL`                       | Your production domain (e.g. `https://ai-resume-builder-five-olive.vercel.app`)             |
|                       | `WEBHOOK_URL`                        | The tunnel URL or production domain for resolving MuAPI callback webhooks                     |
|                       | `GOOGLE_CLIENT_ID`                   | Get from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)           |
|                       | `GOOGLE_CLIENT_SECRET`               | Get from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)           |
| **Stripe Billing**    | `STRIPE_SECRET_KEY`                  | Get from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)                            |
|                       | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Get from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)                            |
|                       | `STRIPE_WEBHOOK_SECRET`              | Webhook secret for resolving credit purchases                                                |
| **AI Generator**      | `MUAPIAPP_API_KEY`                   | Create an account and get key from [muapi.ai/access-keys](https://muapi.ai/access-keys?utm_source=github&utm_medium=readme&utm_campaign=ai-resume-builder)      |

### 🚀 Launching on Vercel: Step-by-Step

1. **Database Provisioning**: Create a new Postgres database (via completely free tiers on Vercel Postgres, Supabase, or Neon). Retrieve the pooling connection string (`DATABASE_URL`) and direct connection string (`DIRECT_URL`).
2. **Project Creation**: Import your GitHub fork into the Vercel dashboard.
3. **Configure Environment Variables**: Copy the variables above into the Vercel project settings environment tab.
4. **Deploy**: Hit "Deploy". Vercel will automatically run the build steps (`npm run build`).
5. **Database Push**: Since Prisma does not automatically migrate via Vercel builds by default, you may want to append `npx prisma db push && ` to your Vercel build command, or manually run it locally pointing to your production database URL.
6. **Integrations Setup**:
   - Establish a **Google Cloud OAuth app**, enabling the callback URL: `https://ai-resume-builder-five-olive.vercel.app/api/auth/callback/google`
   - Setup a **Stripe Webhook**, pointing to `https://ai-resume-builder-five-olive.vercel.app/api/webhook/stripe` and selecting the `checkout.session.completed` event to grab your webhook signing secret.

---

## 🛠️ Local Development

Ready to iterate locally? Setup is straightforward.

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v18 or higher)
- A local PostgreSQL instance or a free cloud Database URL.

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/SamurAIGPT/ai-resume-builder
cd ai-resume-builder

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
> 1. **Pull all existing tables**: `npx prisma db pull` (introspects all 20+ active tables from other workspace apps)
> 2. **Declare relation changes**: Inject the `Resume` model in your local `schema.prisma` and link it inside the `User` model (`resumes Resume[]`).
> 3. **Push to database**: Run `npx prisma db push` to merge changes safely.
> 4. **Local Schema Cleanup**: Strip away other applications' models from your local `schema.prisma`, leaving only `Account`, `Session`, `User`, `VerificationToken`, and `Resume`.
> 5. **Compile local client**: Run `npx prisma generate` to build your local type-safe Prisma client.

---

## 🏗️ Technical Architecture

This application decouples visually rich UI elements from core business logic layers, emphasizing modularization.

```
ai-resume-builder/
├── prisma/
│   ├── schema.prisma           # PostgreSQL schema (User, Account, Session, Resume)
│   └── config.ts               # Dynamic database datasource selector
├── src/
│   ├── app/                    # Next.js App Router Pages
│   │   ├── api/                # Backend API Routes
│   │   │   ├── auth/           # NextAuth credentials handling
│   │   │   ├── checkout/       # Stripe checkout session builder
│   │   │   ├── creations/      # Creations GET (fetch/bypass sync), POST (dup), DELETE routes
│   │   │   ├── generation/     # Credits checking, deduction, MuAPI prediction triggers
│   │   │   ├── upload/         # MuAPI CDN file upload handler
│   │   │   └── webhook/        # Webhooks for Stripe billing and MuAPI prediction callbacks
│   │   ├── gallery/            # History Creations Gallery
│   │   ├── pricing/            # Interactive packaging checkout cards
│   │   ├── globals.css         # Minimal light-mode styling, scrollbars
│   │   └── layout.js           # Root layout config (Inter font)
│   ├── components/             # Reusable UI Components
│   │   ├── Header.js           # Sticky responsive light-mode glass navbar
│   │   ├── Providers.js        # NextAuth Session wrapper
│   │   ├── ResumeForm.js       # Accordion inputs, custom selects, toggles
│   │   └── ResumePreview.js    # Native print PDF and Word doc preview frame
│   └── lib/                    # Shared library configurations
│       ├── auth.js             # NextAuth prisma options configuration
│       ├── config.js           # Central configuration properties (MuAPI, Stripe, plans)
│       ├── prisma.js           # Prisma client provider singleton
│       ├── stripe.js           # Stripe engine instance
│       └── services/
│           ├── user.js         # Credit management and validation service
│           └── billing.js      # Stripe session checkout and payment parsers
├── next.config.mjs             # Next Configuration
└── package.json
```

---

## 🔗 Related Templates

Check out other open-source SaaS templates from the same ecosystem:

| Template | Description | GitHub |
|---|---|---|
| **My Podcast Studio** | High-Octane AI Voice Over & Narration SaaS | [github.com/SamurAIGPT/my-podcast](https://github.com/SamurAIGPT/my-podcast) |
| **TryOn AI** | AI Virtual Try-On & Outfit Fitting SaaS | [github.com/SamurAIGPT/ai-tryon](https://github.com/SamurAIGPT/ai-tryon) |
| **AI Social Post Generator** | High-conversion AI social feed manager | [github.com/SamurAIGPT/social-post](https://github.com/SamurAIGPT/social-post) |
| **AI Kissing Video Generator** | Photorealistic romance video generator | [github.com/SamurAIGPT/ai-kissing-video-generator](https://github.com/SamurAIGPT/ai-kissing-video-generator) |

---

## 📄 License

MIT Licensed. Fork it, brand it, and start earning.

---

_AI Resume Builder: A premium, minimalist light-mode, fully responsive AI resume creation workstation built for job seekers, recruiters, and professionals._
