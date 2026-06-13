> 📦 **Original repo:** [SamurAIGPT/ai-real-estate-stager](https://github.com/SamurAIGPT/ai-real-estate-stager)

# 🏡 EstateStager AI — Open-Source AI Virtual Home Staging SaaS (Free BoxBrownie & Virtual Staging AI Alternative)

> **Turn empty rooms into furnished showrooms with photorealistic AI staging in seconds.** A production-ready, self-hostable Next.js SaaS boilerplate built for real estate agents, home stagers, and interior designers — replaces $20–$30/photo virtual staging services. A free open-source alternative to BoxBrownie, Virtual Staging AI, ApplyDesign, and roOomy — powered by the MuAPI AI engine.

**Tech stack:** Next.js 14 (App Router) · Prisma · PostgreSQL · NextAuth (Google OAuth) · Stripe · Tailwind CSS · MuAPI · Webhook-backed async delivery
**Use cases:** MLS listing photography · Empty property staging · Pre-sale home preparation · Airbnb listing visuals · Interior design mood boards · Realtor marketing · Investor property showcases · Real estate flyers

<p align="center">
  <a href="https://github.com/Anil-matcha/awesome-generative-ai-apps">
    <img src="https://img.shields.io/badge/Part%20of-Awesome%20Generative%20AI%20Apps-FFD700?style=for-the-badge&logo=github&logoColor=black" alt="Awesome Generative AI Apps">
  </a>
</p>

> 🎨 **[Explore 50+ more open-source AI apps →](https://github.com/Anil-matcha/awesome-generative-ai-apps)**

## 🌐 Project Details

**GitHub Repository:** [github.com/SamurAIGPT/ai-real-estate-stager](https://github.com/SamurAIGPT/ai-real-estate-stager)

**Live Demo Preview:** [ai-real-estate-stager.vercel.app](https://ai-real-estate-stager.vercel.app/)

---

EstateStager AI is a production-ready, highly-optimized AI web application. Out of the box, it seamlessly manages User Authentication, Credits & Billing, Image Persistence, and asynchronous AI staging using a sleek Next.js (App Router) architecture. It empowers real estate agents, home stagers, and interior designers to turn empty vacant spaces into premium furnished showrooms — all without physical staging costs.

**Why use EstateStager AI?**

- **Production-Ready SaaS** — Complete with Google OAuth and Stripe Checkout workflows built-in.
- **AI Staging Studio** — Upload vacant room photos, pick a room type and design style, auto-generate or customize the AI prompt, and stage instantly.
- **Draggable Before/After Slider** — A fluid drag-clip slider lets users compare the original empty space vs. the AI-furnished staging side-by-side in real time.
- **Webhook-Backed AI Delivery** — MuAPI async webhook delivers results directly into the database (`/api/webhook/muapi`), keeping API routes non-blocking.
- **Personal Gallery Dashboard** — All staged rooms are saved to PostgreSQL. Users can review, compare, download, and delete their stagings from `/dashboard`.
- **Extensible Architecture** — Easily swap the underlying AI model or add new room types and design styles without breaking the UI.

![EstateStager AI Screenshot](https://cdn.muapi.ai/data/2/635974623291/Screenshot_2026-05-25_160552.png)

---

## ✨ Core Features

### 🎨 AI Design Studio (Main Page `/`)
- Upload a vacant room photo via file picker or drag-and-drop. Instant local preview shown before upload completes.
- Select **Room Type**: Living Room, Bedroom, Kitchen, Office, Dining Room, Bathroom.
- Select **Staging Style**: Modern Minimal, Scandinavian, Boho Chic, Industrial Loft, Mid-Century, Rustic Cabin.
- Auto-generated AI prompt updates dynamically based on room and style selection. Fully editable — users can fine-tune the prompt, with a **Reset** button to restore the smart default.
- Cost: **6 credits** per AI staging generation.

### ↔️ Before/After Comparison Slider
- Draggable clip-path vertical split bar over the 16:9 viewer shows the empty room on the left and the AI-staged result on the right.
- Works with mouse drag and touch events — smooth, responsive, and mobile-friendly.
- Label badges (`Before (Empty)` / `After (Staged)`) anchored in the corners.

### 🖼️ Personal Staging Gallery (`/dashboard`)
- Visual card grid of all staged rooms for the signed-in user.
- Cards show a thumbnail, room type, design style, date, and staging status (`generating` / `completed` / `failed`).
- Full-screen split-slider review modal with **Download High-Res** and **Delete Staging** actions.
- Auto-polls every 4 seconds for any rooms still in `generating` state.

### 💳 Stripe Credit Billing (`/pricing`)
- Three credit packs: **Starter** ($10 / 100 credits), **Professional** ($25 / 300 credits), **Business** ($50 / 750 credits).
- No recurring subscriptions — pay once, use at your own pace.
- Credit balance is automatically topped up via Stripe webhook on checkout completion.

### 🔐 Google Auth + Credit Persistence
- NextAuth Google provider with Prisma adapter — user sessions, credit balances, and staging galleries are all persisted per account.
- Credits displayed live in the Navbar with a pulsing coin icon.

---

## ⚡ Deployment: Vercel & Production

This architecture is engineered explicitly for **Vercel** serverless environments.

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/SamurAIGPT/ai-real-estate-stager)

**Live App:** [ai-real-estate-stager.vercel.app](https://ai-real-estate-stager.vercel.app/)

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
| **AI Staging** | `MUAPIAPP_API_KEY` | Create an account and get key from [muapi.ai/access-keys](https://muapi.ai/access-keys) |

### 🚀 Launching on Vercel: Step-by-Step

1. **Database Provisioning**: Create a new Postgres database (via free tiers on Supabase or Neon). Retrieve the connection string (`DATABASE_URL`).
2. **Project Creation**: Import your GitHub fork into the Vercel dashboard.
3. **Configure Environment Variables**: Copy the variables above into the Vercel project settings environment tab.
4. **Deploy**: Hit "Deploy". Vercel will automatically run the build steps (`npm run build`).
5. **Database Push**: Run `npx prisma db push` to synchronize database models before launching.
6. **Integrations Setup**:
   - Establish a **Google Cloud OAuth app**, enabling the callback URL: `https://your-app.vercel.app/api/auth/callback/google`
   - Setup a **Stripe Webhook**, pointing to `https://your-app.vercel.app/api/stripe/webhook` and selecting the `checkout.session.completed` event.
   - Register a **MuAPI Webhook** pointing to `https://your-app.vercel.app/api/webhook/muapi` to receive async staging results.

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
git clone https://github.com/SamurAIGPT/ai-real-estate-stager
cd ai-real-estate-stager

# 2. Install dependencies
npm install

# 3. Setup Environment
cp .env.example .env
# Open .env and insert your specific keys.

# 4. Initialize Database Schema
npx prisma generate
npx prisma db push

# 5. Start the Development Server
npm run dev
```

The console should now be active on `http://localhost:3000`.

> **Webhook Tip:** For local MuAPI webhook testing, run `ngrok http 3000` and set `WEBHOOK_URL` to the generated HTTPS URL in your `.env`.

---

## 🏗️ Technical Architecture

```
ai-real-estate-stager/
├── prisma/
│   └── schema.prisma           # Postgres tables: User, Account, Session, StagedRoom
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.js             # Main AI Design Studio (upload + staging + before/after)
│   │   ├── dashboard/          # Personal staging gallery with split-slider modal
│   │   ├── pricing/            # Credit pack purchase page
│   │   └── api/
│   │       ├── auth/           # NextAuth [...nextauth] handler
│   │       ├── upload/         # MuAPI file upload proxy
│   │       ├── stage/          # AI staging trigger (MuAPI nano-banana-edit)
│   │       ├── rooms/          # GET / DELETE staged rooms (per user)
│   │       ├── download/       # Server-side download proxy (CORS-safe)
│   │       ├── webhook/muapi/  # MuAPI async result webhook handler
│   │       └── stripe/         # Stripe checkout session + webhook
│   ├── components/
│   │   ├── Providers.jsx       # NextAuth SessionProvider wrapper
│   │   └── layout/Navbar.jsx   # Sticky top navigation with credits badge
│   └── lib/
│       ├── auth.js             # NextAuth options + Prisma adapter
│       ├── config.js           # Central env config (AI, Stripe, Auth)
│       ├── prisma.js           # Singleton Prisma + pg pool connection client
│       ├── stripe.js           # Stripe client instance
│       └── services/
│           ├── user.js         # Credit deduction / management
│           └── billing.js      # Stripe checkout + webhook fulfillment
└── next.config.mjs             # Next.js configuration
```

---

## 📄 License

MIT Licensed.

---

_EstateStager AI: A modular, mobile-ready, production-grade AI virtual staging SaaS built for real estate professionals and creators._
