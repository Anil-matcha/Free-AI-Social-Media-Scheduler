# 💇 AI Hairstyle Simulator — Open-Source Virtual Hair Makeover & Style Try-On SaaS (Free YouCam Hair / HairStyle.ai Alternative)

> **Try on new hairstyles and hair colors virtually before visiting the salon.** A production-ready, self-hostable Next.js SaaS boilerplate built for salons, hair stylists, fashion brands, and DTC beauty apps — replaces $20/mo hair try-on tools. A free open-source alternative to YouCam Hair, HairStyle.ai, and Hairstyle Lite — powered by the MuAPI AI engine.

**Tech stack:** Next.js 14 (App Router) · Prisma · PostgreSQL · NextAuth (Google OAuth) · Stripe · Tailwind CSS · MuAPI · Webhook-backed async delivery
**Use cases:** Salon client styling consultations · Virtual hair makeover apps · Personal beauty planning · Hair product marketing · Barber shop previews · Beauty influencer tools · Hair color visualization · Interactive makeover widgets
**Use cases:** Salon client styling consultations · Virtual hair makeover tools · Personal beauty planning · Hair product marketing · Barber shop previews · Interactive makeover widgets

![AI Hairstyle Simulator UI Preview](https://cdn.muapi.ai/data/2/759176684566/Screenshot_2026-05-27_203626.png)

<p align="center">
  <a href="https://github.com/Anil-matcha/awesome-generative-ai-apps">
    <img src="https://img.shields.io/badge/Part%20of-Awesome%20Generative%20AI%20Apps-FFD700?style=for-the-badge&logo=github&logoColor=black" alt="Awesome Generative AI Apps">
  </a>
</p>

> 🎨 **[Explore 50+ more open-source AI apps →](https://github.com/Anil-matcha/awesome-generative-ai-apps)**

## 🌐 Project Details

**GitHub Repository:** [github.com/SamurAIGPT/ai-hair-style-simulator](https://github.com/SamurAIGPT/ai-hair-style-simulator)

**Live Demo Preview:** [ai-hair-style-simulator.vercel.app](https://ai-hair-style-simulator.vercel.app/)

---

AI Hairstyle Simulator is a production-ready, highly-optimized AI web application. Out of the box, it seamlessly manages User Authentication, Credits & Billing, Image Persistence, and asynchronous hairstyle generation using a sleek Next.js (App Router) architecture. It empowers users, salons, and hair stylists to render hair makeovers realistically onto face profiles — all without risky haircuts.

**Why use AI Hairstyle Simulator?**

- **Production-Ready SaaS** — Complete with Google OAuth and Stripe Checkout workflows built-in.
- **Virtual Makeover Studio** — Upload portrait face photos, select hairstyle parameters, choose hair colors, and see results instantly.
- **Webhook-Backed AI Delivery** — MuAPI async webhook delivers results directly into the database (`/api/webhook/muapi`), keeping API routes non-blocking and preventing request timeouts.
- **Personal Showroom Gallery** — All generated makeovers are saved to PostgreSQL. Users can review, compare, download, and delete their designs from `/gallery`.
- **Responsive Screen-Fitting** — Designed with a fluid layout that fits perfectly on all screens (mobile, tablet, desktop) using stacked adaptive grids on mobile and viewport-locked scrolling on desktop.

---

## ✨ Core Features

### 🎨 Virtual Makeover Studio (Main Page `/`)
- Single face image upload via file picker or drag-and-drop. Real-time preview shown instantly.
- Predefined parameters via **Custom Select Dropdowns** for target gender, hairstyle cut presets, and hair color shades.
- Customizable prompt styling with an **Optimize Face Details** sliding toggle switch to maintain face realism.
- Cost: **18 credits** per AI Hairstyle simulation.

### 🖼️ Personal Showroom Gallery (`/gallery`)
- Visual card grid of all generated hairstyle simulations.
- Cards show a thumbnail, presets used, prompt summary, creation date, and status (`processing` / `completed` / `failed`).
- Full-screen viewer modal with a floating overlay of the input face photo for reference, along with **Download HD** and **Delete Result** actions.

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

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/SamurAIGPT/ai-hair-style-simulator)

**Live App:** [ai-hair-style-simulator.vercel.app](https://ai-hair-style-simulator.vercel.app/)

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
git clone https://github.com/SamurAIGPT/ai-hair-style-simulator
cd ai-hair-style-simulator

# 2. Install dependencies
npm install --legacy-peer-deps

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
2. Declare your `HairStyle` table and update the relations on the `User` model.
3. Run `npx prisma db push` to add your changes safely.
4. Clean up `schema.prisma` to keep only NextAuth models, `HairStyle`, and the updated `User` relations.
5. Run `npx prisma generate` to rebuild the type-safe client.

---

## 🏗️ Technical Architecture

```
ai-hair-style-simulator/
├── prisma/
│   └── schema.prisma           # Postgres schema (User, Account, Session, HairStyle)
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.js             # Main Studio Workspace (Uploads, Presets, Custom inputs)
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
│           ├── user.js         # Credit management service (18 credits per run)
│           └── billing.js      # Stripe checkout and payment webhook parser
└── next.config.mjs             # Next.js configuration
```

---

## 📄 License

MIT Licensed.

---

_AI Hairstyle Simulator: A premium, high-contrast, fully responsive virtual hair makeover studio built for styling creators, salons, and DTC beauty teams._
