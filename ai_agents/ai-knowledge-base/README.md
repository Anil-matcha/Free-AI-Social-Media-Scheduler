> 📦 **Original repo:** [SamurAIGPT/ai-knowledge-base](https://github.com/SamurAIGPT/ai-knowledge-base)

# 🧠 KnowBase AI — Open-Source AI Custom Knowledge Base & RAG Chatbot Builder (Free Chatbase / Botpress Alternative)

> **Build custom AI chatbots trained on your documents, URLs, and Q&A data — with citations, embed widgets, and real-time conversations.** A production-ready, self-hostable Next.js SaaS boilerplate with semantic context retrieval and iframe-embeddable bots. A free open-source alternative to Chatbase, CustomGPT, Botpress, SiteGPT, and Stack AI — powered by the MuAPI AI engine.

**Tech stack:** Next.js 14 (App Router) · Prisma · PostgreSQL · NextAuth (Google OAuth) · Stripe · Tailwind CSS · MuAPI · RAG / semantic retrieval · OpenAI
**Use cases:** Customer support automation · Internal documentation Q&A · Sales lead qualification · Documentation chatbots · Course/training assistants · SaaS help bots · Knowledge management · Onboarding assistants · Embeddable site chat widgets

<p align="center">
  <a href="https://github.com/Anil-matcha/awesome-generative-ai-apps">
    <img src="https://img.shields.io/badge/Part%20of-Awesome%20Generative%20AI%20Apps-FFD700?style=for-the-badge&logo=github&logoColor=black" alt="Awesome Generative AI Apps">
  </a>
</p>

> 🎨 **[Explore 50+ more open-source AI apps →](https://github.com/Anil-matcha/awesome-generative-ai-apps)**

## 🌐 Project Details

**GitHub Repository:** [github.com/SamurAIGPT/ai-knowledge-base](https://github.com/SamurAIGPT/ai-knowledge-base)

**Live Demo Preview:** [ai-knowledge-base-six.vercel.app](https://ai-knowledge-base-six.vercel.app/)

### 📸 Studio Workspace Preview

![KnowBase AI Premium Workspace Demo](https://cdn.muapi.ai/data/2/600196279021/Screenshot_2026-05-25_193839.png)

---

KnowBase AI is a production-ready, highly-optimized AI web application. Out of the box, it seamlessly manages User Authentication, Credits & Billing, Custom Document Persistence, semantic keyword-matched context retrieval, and AI generation using Next.js (App Router) architecture. It empowers businesses, developers, and creators to build custom chatbots with specific datasets.

**Why use KnowBase AI?**

- **Production-Ready SaaS** — Complete with Google OAuth and Stripe Checkout workflows built-in.
- **Custom Knowledge Builder** — Create sandbox bases, load web URLs, custom text files, or write Q&A entries.
- **High-Contrast Playground** — Chat dynamically with custom bots showing exact reference matches and citation sources below dialogue bubbles.
- **Embeddable Widgets & API Access** — Generate iframe scripts to embed customized chatbots directly on third-party blogs or landing pages.
- **Responsive Screen-Fitting** — Dynamic viewports stacked as clean scrolling components on mobile and locks screen height on desktop for premium desktop UX.

---

## ✨ Core Features

### 🎨 Custom Knowledge Sandboxes (Main Page `/`)
- Sandboxes list sidebar with modal trigger to forge new custom RAG spaces.
- Cost: **Free (0 credits)** per Knowledge Base created.

### 🗄️ Multi-Source Trainer
- **Scrap URL:** Submit document links, scrap site contents, and index automatically.
- **Add Q&A:** Custom type precise matching prompts and answers.
- **Upload File:** Insert custom raw documents data.
- Cost: **10 credits** per source trained.

### 💬 Dialogue Playground
- Natural dialogue balloon interface with real-time semantic context injection.
- Expandable citation logs referencing matching sources and snippet previews.
- Cost: **2 credits** per chatbot query.

### 💳 Stripe Credit Billing (`/pricing`)
- Four credit packs based on a **$1 = 200 credits** conversion rate:
  - **Basic Pack** ($5 / 1,000 credits)
  - **Standard Pack** ($10 / 2,000 credits)
  - **Professional Pack** ($20 / 4,000 credits — Most Popular)
  - **Business Pack** ($50 / 10,000 credits)
- Credit balance is automatically topped up via Stripe webhook on checkout completion.

---

## ⚡ Deployment: Vercel & Production

This architecture is engineered explicitly for **Vercel** serverless environments.

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/SamurAIGPT/ai-knowledge-base)

**Live App:** [ai-knowledge-base-six.vercel.app](https://ai-knowledge-base-six.vercel.app/)

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
| **AI LLM Queries** | `MU_API_KEY` | Create an account and get key from [muapi.ai/access-keys](https://muapi.ai/access-keys) |

### 🚀 Launching on Vercel: Step-by-Step

1. **Database Provisioning**: Create a new Postgres database (via Supabase or Neon). Retrieve the connection string (`DATABASE_URL`).
2. **Project Creation**: Import your GitHub fork into the Vercel dashboard.
3. **Configure Environment Variables**: Copy the variables above into the Vercel project settings environment tab.
4. **Deploy**: Hit "Deploy". Vercel will automatically run the build steps (`npm run build`).
5. **Database Push**: Run `npx prisma db push` to synchronize database models before launching.
6. **Integrations Setup**:
   - Establish a **Google Cloud OAuth app**, enabling the callback URL: `https://your-app.vercel.app/api/auth/callback/google`
   - Setup a **Stripe Webhook**, pointing to `https://your-app.vercel.app/api/stripe/webhook` and selecting the `checkout.session.completed` event.

---

## 🛠️ Local Development

Ready to iterate locally? Setup is straightforward.

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v18 or higher)
- A local PostgreSQL instance or a free cloud Database URL.

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/SamurAIGPT/ai-knowledge-base
cd ai-knowledge-base

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

---

## ⚠️ Database Safety Warning (Shared Pool)

The workspace database is shared with other applications. Running `npx prisma db push` on a clean, empty schema will drop tables belonging to other applications. Always follow the **Pull-Declare-Push-Cleanup** sequence:

1. Run `npx prisma db pull` to fetch all database tables.
2. Declare your `KnowledgeBase`, `Source`, `KBChat`, and `KBMessage` tables and update the relations on the `User` model.
3. Run `npx prisma db push` to add your changes safely.
4. Clean up `schema.prisma` to keep only NextAuth models, `KnowledgeBase`, `Source`, `KBChat`, `KBMessage`, and the updated `User` relations.
5. Run `npx prisma generate` to rebuild the type-safe client.

---

## 🏗️ Technical Architecture

```
ai-knowledge-base/
├── prisma/
│   └── schema.prisma           # Postgres schema (User, Account, Session, KnowledgeBase, Source, KBChat, KBMessage)
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.js             # Main Workspace Studio (Sources, Playground RAG, Widget export)
│   │   ├── dashboard/          # Personal gallery list overview
│   │   ├── pricing/            # 4-Plan credit pricing grid structured at $1 = 200 credits
│   │   └── api/
│   │       ├── auth/           # NextAuth dynamic sessions
│   │       ├── kb/             # GET / POST / DELETE knowledge bases
│   │       ├── kb/[id]/sources # GET / POST / DELETE data sources (Files, URLs, Q&As)
│   │       ├── kb/[id]/chat    # GET / POST / DELETE playground chats
│   │       ├── kb/[id]/chat/[chatId]/messages # GET / POST query messages (Context, citations, LLM)
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
│           ├── user.js         # Credit management service
│           └── billing.js      # Stripe checkout and payment webhook parser
└── next.config.mjs             # Next.js configuration
```

---

## 📄 License

MIT Licensed.

---

_KnowBase AI: A premium, high-contrast, fully responsive customized semantic knowledge agent SaaS builder._
