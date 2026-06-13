# 📇 CardAI Creator — Open-Source AI Digital Business Card Generator with Embedded Visitor Chatbot

> **Design, share, and chat through interactive digital business cards in seconds.** A production-ready, self-hostable Next.js SaaS boilerplate with 7 premium templates, AI-styled custom layouts, QR sharing, and a visitor-facing AI chatbot that answers questions about you on your behalf. A free open-source alternative to Popl, HiHello, Linq, and Mobilo — powered by the MuAPI AI engine.

**Tech stack:** Next.js 14 (App Router) · Prisma · PostgreSQL · NextAuth (Google OAuth) · Stripe · Tailwind CSS · MuAPI · OpenAI (chatbot)
**Use cases:** Networking events · Conference badges · Sales rep cards · Real estate agent cards · Freelancer portfolios · Creator landing pages · Lead capture pages · QR vCard sharing · Personal branding

<p align="center">
  <a href="https://github.com/Anil-matcha/awesome-generative-ai-apps">
    <img src="https://img.shields.io/badge/Part%20of-Awesome%20Generative%20AI%20Apps-FFD700?style=for-the-badge&logo=github&logoColor=black" alt="Awesome Generative AI Apps">
  </a>
</p>

> 🎨 **[Explore 50+ more open-source AI apps →](https://github.com/Anil-matcha/awesome-generative-ai-apps)**

## 🌐 Project Details

**GitHub Repository:** [github.com/SamurAIGPT/ai-business-card](https://github.com/SamurAIGPT/ai-business-card)

**Live Demo Preview:** [ai-business-card-ten.vercel.app](https://ai-business-card-ten.vercel.app/)

---

CardAI Creator is a highly optimized SaaS application designed to help professionals, creators, and teams build interactive digital business cards. It features a modern layout designer, real-time preview, QR code sharing, a visual cards dashboard, and a floating AI chatbot widget that lets visitors ask questions to a digital clone of the card owner.

**Why use CardAI Creator?**

- **Production-Ready SaaS Boilerplate** — Configured with Google OAuth, PostgreSQL connection pooling, and Stripe Checkout.
- **AI Custom Layouts** — Enter prompts like *"make this look retro cyberpunk"* to generate custom Tailwind card styling using OpenAI models via MuAPI.
- **Interactive AI Clone Assistant** — Shared cards feature a chatbot widget. Visitors can ask questions (e.g. *"What is her email?"*, *"What are his core specialties?"*), resolved using the card's profile as LLM context.
- **Base64 & MuAPI Image Uploading** — Self-contained image selector uploads avatars to MuAPI with automatic inline data-URL fallback.
- **7 Premium Pre-designed Styles** — Neumorphism, Cyberpunk Glitch, Holographic Glassmorphism, Interactive 3D Tilt, Swiss International Style, Classic Minimal, and Brutalist Marquee templates load instantly offline.
- **Automatic QR Codes** — Standard QR code generator overlay points directly to the card's public URL for quick mobile scanning.
- **Split Save Protections** — When editing an existing card, users can either **"Save Changes"** (update current) or **"Save as New Copy"** (clone to new ID), preventing accidental overwrites.

![CardAI Dashboard](https://cdn.muapi.ai/data/2/191243157668/Screenshot_2026-05-25_141220.png)

---

## ✨ Core Features

### 🧠 AI Card Customizer
- Enter custom style prompts. The system calls custom LLMs via MuAPI and engineers a tailored Tailwind CSS component layout.
- Cost: **5 credits** per generation.
- Polled asynchronously with spinner overlays while the design compiling runs in the background.

### 🤖 Visitor AI Clone Chatbot
- Visitors viewing the public `/card/[hash]` page can open a floating chat drawer.
- Answers questions about your experience, contact info, and website by referencing profile details.
- Runs a synchronous backend polling script so that visitors get instant, snappy answers.

### 📂 My Cards Dashboard (`/my-cards`)
- A dedicated dashboard where users can see all their saved cards in a clean, visual grid of previews.
- Quick actions: **Edit** (opens in workspace), **View** (opens public page), **Delete** (with confirmation), **Copy Link**, and **Show/Download QR Code**.

### 📱 Responsive Previews
- Left sidebar for form parameters editing.
- Center/Right live viewport displaying updates in real-time inside a mobile device mock iframe to prevent styles leaking.

### 💳 Stripe Credit Billing (`/pricing`)
- Tiers: **Starter** ($10/100 credits), **Pro** ($25/300 credits), and **Business** ($50/750 credits).
- Balance is automatically updated upon checkout completion using Stripe webhooks.

---

## 🔑 Required Environment Variables

Configure these keys inside your local `.env` or production Vercel dashboard:

| Category              | Variable                             | Purpose & Source                                                                             |
| :-------------------- | :----------------------------------- | :------------------------------------------------------------------------------------------- |
| **Database**          | `DATABASE_URL`                       | PostgreSQL connection string ([Supabase](https://supabase.com) or [Neon](https://neon.tech)) |
| **NextAuth / Google** | `NEXTAUTH_SECRET`                    | Random secret string for signing auth tokens (`openssl rand -base64 32`)                     |
|                       | `NEXTAUTH_URL`                       | Local/production domain (e.g. `http://localhost:3000`)                                       |
|                       | `GOOGLE_CLIENT_ID`                   | Obtained from [Google Cloud Console Credentials](https://console.cloud.google.com/)          |
|                       | `GOOGLE_CLIENT_SECRET`               | Obtained from [Google Cloud Console Credentials](https://console.cloud.google.com/)          |
| **Stripe Billing**    | `STRIPE_SECRET_KEY`                  | Obtained from [Stripe API Keys](https://dashboard.stripe.com/apikeys)                        |
|                       | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Obtained from [Stripe API Keys](https://dashboard.stripe.com/apikeys)                        |
|                       | `STRIPE_WEBHOOK_SECRET`              | Configured webhook secret to resolve transaction credits                                     |
| **AI Generator**      | `MUAPIAPP_API_KEY`                   | AI API key from [muapi.ai](https://muapi.ai/)                                                |

---

## 🛠️ Local Development & Launch

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- A local or remote PostgreSQL database instance.

### Step-by-Step Setup

1. **Navigate to the App**
   ```bash
   cd apps/ai-business-card
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Variables**
   ```bash
   cp .env.example .env
   # Populate your active database, Stripe, and OAuth API keys
   ```

4. **Initialize DB Schema**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start Dev Server**
   ```bash
   npm run dev
   # Runs locally on http://localhost:3000
   ```

6. **Build for Production**
   ```bash
   npm run build
   ```
