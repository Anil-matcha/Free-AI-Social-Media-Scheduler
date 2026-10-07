# 🚀 Seedance 2 Generator — Seedance 2.0 & Seedance 2 Mini AI Video Workspace

> **A beautifully designed, fully-integrated AI video playground.** Built with Next.js, this open-source template serves as a complete, self-contained SaaS boilerplate for generating, editing, and managing high-quality AI videos fueled by Seedance 2.0 and the new **Seedance 2 Mini** engine — ByteDance's fast, affordable model at ~$0.073/sec.

<p align="center">
  <a href="https://github.com/Anil-matcha/awesome-generative-ai-apps">
    <img src="https://img.shields.io/badge/Part%20of-Awesome%20Generative%20AI%20Apps-FFD700?style=for-the-badge&logo=github&logoColor=black" alt="Awesome Generative AI Apps">
  </a>
</p>

> 🎨 **[Explore 50+ more open-source AI apps →](https://github.com/Anil-matcha/awesome-generative-ai-apps)**

https://github.com/user-attachments/assets/e3ec6cd7-2a62-4971-9e97-9906aca68265

## Related Projects

- [Seedance-2-API](https://github.com/Anil-matcha/Seedance-2-API) — Python wrapper for Seedance 2.0 and Seedance 2 Mini — use the models directly in scripts
- [seedance2-comfyui](https://github.com/Anil-matcha/seedance2-comfyui) — Run Seedance 2 inside ComfyUI
- [n8n-nodes-seedance2](https://github.com/Anil-matcha/n8n-nodes-seedance2) — Automate Seedance 2 generation in n8n workflows
- [seedance-2.0-watermark-remover](https://github.com/SamurAIGPT/seedance-2.0-watermark-remover) — Remove watermarks from Seedance 2 generated videos
- [awesome-seedance-2.5-api-prompts](https://github.com/Anil-matcha/awesome-seedance-2.5-api-prompts) — Curated Seedance 2.5 API guide, prompts, camera controls, and video generation examples

## 🧪 Try Models in the Muapi Playground

| Model | Image-to-Video | Text-to-Video |
|-------|---------------|---------------|
| Seedance 2 | [Playground](https://muapi.ai/playground/seedance-2-vip-image-to-video?utm_source=github&utm_medium=readme&utm_campaign=seedance-2-generator) | [Playground](https://muapi.ai/playground/seedance-2-vip-text-to-video?utm_source=github&utm_medium=readme&utm_campaign=seedance-2-generator) |
| Seedance 2 Mini | [Playground](https://muapi.ai/playground/seedance-2-mini-image-to-video?utm_source=github&utm_medium=readme&utm_campaign=seedance-2-generator) | [Playground](https://muapi.ai/playground/seedance-2-mini-text-to-video?utm_source=github&utm_medium=readme&utm_campaign=seedance-2-generator) |
| Seedance 2.1 *(coming soon)* | [Playground](https://muapi.ai/playground/seedance-2.1-image-to-video?utm_source=github&utm_medium=readme&utm_campaign=seedance-2-generator) | [Playground](https://muapi.ai/playground/seedance-2.1-text-to-video?utm_source=github&utm_medium=readme&utm_campaign=seedance-2-generator) |
| Seedance 2.5 *(coming soon)* | [Playground](https://muapi.ai/playground/seedance-2.5-image-to-video?utm_source=github&utm_medium=readme&utm_campaign=seedance-2-generator) | [Playground](https://muapi.ai/playground/seedance-2.5-text-to-video?utm_source=github&utm_medium=readme&utm_campaign=seedance-2-generator) |

## 🌐 Live Manifestation

[**Experience the Seedance engine live here**](https://seedance-2-generator.vercel.app/)

Sign in with Google to explore the Generation Studio, Edit Mode, and Credit Tiers directly from your browser. Our glassmorphic, high-fidelity interface is fully responsive and production-ready.

---

Seedance v2.0 Generator is not just another wrapper — it's a production-ready, highly-optimized AI web application. Out of the box, it seamlessly manages User Authentication, Credits & Billing, Image Persistence, and asynchronous AI video generation polling using a sleek Next.js (App Router) architecture. It empowers you to build professional-grade AI workflows with built-in mobile optimization, making it the perfect starting point for your next AI SaaS.

**Why use Seedance 2 Generator?**

- **Production-Ready SaaS** — Complete with Google OAuth and Stripe Checkout workflows built-in.
- **Seedance 2.0 & Seedance 2 Mini** — Supports both models. Use Seedance 2.0 for maximum quality, or route to **Seedance 2 Mini** for fast generation at ~$0.073/sec — great for keeping credit costs low.
- **Advanced Video Studio** — Seamlessly toggle between prompt-based Text-to-Video generation and Multi-Image Reference editing.
- **Historical Archive** — All creations are securely persisted to a PostgreSQL database for a customized user gallery.
- **Minimalist UX** — Custom dropdowns, high-fidelity micro-animations, and complete mobile-stacked responsiveness.
- **Extensible API** — Easily swap out the underlying AI engine without breaking the application UI.

![Seedance v2.0 Generator](https://cdn.muapi.ai/outputs/generated/987459f2d06e4baeb4f62e3f5a8941e5.jpg)

## ✨ Core Features

- **Kinetic Video Studio** — Generate stunning visuals with text prompts. Includes options for advanced `Aspect Ratio` tuning, and tiered Resolutions (480p, 720p) tied directly to a flexible credit cost system.
- **Multi-Image Reference Mode** — Transition smoothly to editing. Upload local images or add up to 9 external image URLs to use as visual reference nodes.
- **My Creations Archive** — A dedicated history vault for logged-in users. Displays past generations securely fetched from the database, viewable in a detailed inspector modal with 1-click downloads.
- **Credit Tiers & Billing** — Complete Stripe integration. Start users off with a seed balance, map generations to credit deductions, and seamlessly route them to an interactive pricing page.
- **Minimal & Dynamic UI** — Built on Tailwind CSS and Framer Motion, ensuring every state transition, loading spinner, and dropdown elegantly guides the user.

---

## ⚡ Deployment: Vercel & Production

Deploying an instance of Seedance v2.0 Generator to the web requires minimal configuration. The architecture is engineered explicitly for **Vercel** serverless environments.

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
| **AI Generator**      | `SEEDANCE_V2_API_KEY`                | Create an account and get key from [muapi.ai/access-keys](https://muapi.ai/access-keys)      |

---

## 🛠️ Local Development

Ready to iterate locally? Setup is straightforward.

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v18 or higher)
- A local PostgreSQL instance or a free cloud Database URL.

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/SamurAIGPT/seedance-2-generator
cd seedance-v2-generator

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

The graphical console should now be heavily responsive on `http://localhost:3000`.

---

_Seedance v2.0 Generator: A modular, mobile-ready, production-grade AI video workspace built for creators and builders._
