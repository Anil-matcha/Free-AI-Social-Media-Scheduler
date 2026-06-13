# 👰 AI Wedding Photo — Open-Source AI Wedding Photo Generator SaaS (Free Remini / Facetune Wedding Alternative)

> **Generate dreamy, photorealistic wedding photos from any portrait in seconds.** A production-ready, self-hostable Next.js SaaS boilerplate with scene template selection, AI face-swap compositing, and built-in Stripe billing. A free open-source alternative to Remini Wedding, WedReports AI, and Facetune — powered by the MuAPI AI engine.

**Tech stack:** Next.js 14 (App Router) · Prisma · PostgreSQL · NextAuth (Google OAuth) · Stripe · Tailwind CSS · MuAPI nano-banana-pro-edit
**Use cases:** Wedding photographers · Engaged couples · Bridal marketing agencies · Wedding venue promotions · Pre-wedding photo previews · Social media wedding content · Event planners · AI photo gifting

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/SamurAIGPT/ai-wedding-photo)

🔗 **Live Demo:** [ai-wedding-photo.vercel.app](https://ai-wedding-photo.vercel.app/)

---

<p align="center">
  <a href="https://github.com/Anil-matcha/awesome-generative-ai-apps">
    <img src="https://img.shields.io/badge/Part%20of-Awesome%20Generative%20AI%20Apps-FFD700?style=for-the-badge&logo=github&logoColor=black" alt="Awesome Generative AI Apps">
  </a>
</p>

> 🎨 **[Explore 50+ more open-source AI apps →](https://github.com/Anil-matcha/awesome-generative-ai-apps)**

## 📸 UI Preview

![AI Wedding Photo Editor UI](https://cdn.muapi.ai/data/2/613210095251/Screenshot_2026-05-28_145754.png)

---

## ✨ Core Features

- **Wedding Photo Workspace** — Upload your front-facing portrait, choose a wedding template scene (Couple, Bride, Groom, Scenery), or write a custom text prompt to generate stunning AI wedding photos.
- **110+ Predefined Templates** — Curated wedding background templates organized into **Couple**, **Female (Bride)**, **Male (Groom)**, and **Scenery** categories, sourced from high-quality stock photography.
- **Clean Sidebar Layout** — 2-column premium editor: controls panel on the left, live canvas preview on the right. Supports aspect ratios (`1:1`, `3:4`, `4:3`, `9:16`, `16:9`) and 1K/2K/4K resolution output.
- **Creations Gallery** — Full creations history saved to PostgreSQL. Browse past generations in a gallery with full-screen modal, download in HD, and delete options.
- **Stripe Billing & Credit System** — One-time credit packages (Basic, Standard, Professional, Business). Each generation costs 18 credits.
- **Google OAuth Login** — Secure sign-in with Google via NextAuth. Session-based credit tracking on every page.
- **Webhook + Polling** — MuAPI webhook delivery with client-side polling fallback to handle long-running jobs (up to 60s).
- **Privacy Policy & Terms of Service** — Legal pages linked from the footer, required for Google OAuth app verification and Stripe account compliance.

---

## ⚡ One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/SamurAIGPT/ai-wedding-photo)

> After deploying, configure the required environment variables in your Vercel project dashboard.

---

## 🔑 Required Environment Variables

| Service | Variable | Description |
| :--- | :--- | :--- |
| **Database** | `DATABASE_URL` | Pooled PostgreSQL connection string (Supabase / Neon) |
| | `DIRECT_URL` | Direct DB connection for Prisma migrations |
| **NextAuth** | `NEXTAUTH_SECRET` | Random secure token (`openssl rand -base64 32`) |
| | `NEXTAUTH_URL` | Production domain URL (e.g. `https://your-app.vercel.app`) |
| | `WEBHOOK_URL` | Your production domain for MuAPI webhook callbacks |
| | `GOOGLE_CLIENT_ID` | Google Cloud OAuth App Client ID |
| | `GOOGLE_CLIENT_SECRET` | Google Cloud OAuth App Client Secret |
| **Stripe** | `STRIPE_SECRET_KEY` | Stripe API Secret Key |
| | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Publishable Key |
| | `STRIPE_WEBHOOK_SECRET` | Stripe Webhook Secret (`checkout.session.completed`) |
| **AI Model** | `MUAPIAPP_API_KEY` | Get from [muapi.ai](https://muapi.ai/account/api-keys) dashboard |

---

## 🛠️ Local Development

### Prerequisites

- Node.js v18+
- PostgreSQL instance (or Supabase / Neon free tier)

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/SamurAIGPT/ai-wedding-photo.git
cd ai-wedding-photo

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Fill in all required values in .env

# 4. Generate Prisma client
npx prisma generate

# 5. Start dev server
npm run dev
```

App runs at **http://localhost:3000**

---

## 🗄️ Database Setup (Shared Database Warning)

If you are connecting to a shared PostgreSQL instance (e.g. a pool that other apps also use), follow these safe steps:

```bash
# Pull existing tables first (IMPORTANT — avoids dropping other tables)
npx prisma db pull

# Add the WeddingPhotoCreation model to schema.prisma
# Then push safely:
npx prisma db push

# Rebuild Prisma types
npx prisma generate
```

> ⚠️ **Never** run `prisma db push --force-reset` on a shared database — it will delete all other apps' tables.

---

## 📂 Project Structure

```
ai-wedding-photo/
├── prisma/
│   └── schema.prisma          # DB models
├── public/                    # Static assets
└── src/
    ├── app/
    │   ├── api/
    │   │   ├── auth/           # NextAuth handlers
    │   │   ├── checkout/       # Stripe checkout sessions
    │   │   ├── creations/      # Generation history API
    │   │   ├── generation/     # MuAPI trigger (nano-banana-pro-edit)
    │   │   ├── upload/         # CDN image upload
    │   │   └── webhook/        # Stripe + MuAPI callbacks
    │   ├── gallery/            # Creations portfolio page
    │   ├── pricing/            # Buy credits (Stripe)
    │   ├── privacy/            # Privacy Policy (required for OAuth & Stripe)
    │   ├── terms/              # Terms of Service (required for OAuth & Stripe)
    │   ├── globals.css         # Dark theme design system
    │   ├── layout.js           # Root layout with fonts
    │   └── page.js             # Main workspace editor
    ├── components/
    │   ├── BackgroundTemplateSelector.js  # Template/upload/prompt sidebar tabs
    │   ├── Header.js                      # Sticky navbar
    │   ├── LoadingTipsCarousel.js         # Generation loading state
    │   ├── ProductCanvas.js               # Output canvas + face preview
    │   └── Providers.js                   # NextAuth SessionProvider
    └── lib/
        ├── auth.js             # NextAuth config
        ├── config.js           # App-wide config (Stripe, MuAPI)
        ├── prisma.js           # Prisma client
        ├── stripe.js           # Stripe SDK
        ├── templates.js        # 110+ wedding background templates
        └── services/
            ├── billing.js      # Stripe checkout session logic
            └── user.js         # Credit balance management
```

## 🤝 Tech Stack

| Layer | Technology |
| :--- | :--- |
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS |
| Auth | NextAuth.js + Google OAuth |
| Database | PostgreSQL + Prisma ORM |
| Payments | Stripe Checkout |
| AI Model | MuAPI `nano-banana-pro-edit` |
| Hosting | Vercel |

---

## 📄 License

MIT — feel free to fork and build your own SaaS on top of this boilerplate.
