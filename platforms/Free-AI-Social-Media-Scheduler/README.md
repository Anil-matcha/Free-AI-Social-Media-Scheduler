# Free AI Social Media Scheduler

[![Stars](https://img.shields.io/github/stars/Anil-matcha/Free-AI-Social-Media-Scheduler?style=flat-square)](https://github.com/Anil-matcha/Free-AI-Social-Media-Scheduler/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-lightgrey.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)

A free, open-source AI social media scheduler built with Next.js. Upload videos, schedule posts, and publish directly to YouTube and TikTok — no subscription required. Self-hostable alternative to Buffer, Hootsuite, Later, and Sprout Social.

<p align="center">
  <a href="https://github.com/Anil-matcha/awesome-generative-ai-apps">
    <img src="https://img.shields.io/badge/Part%20of-Awesome%20Generative%20AI%20Apps-FFD700?style=for-the-badge&logo=github&logoColor=black" alt="Awesome Generative AI Apps">
  </a>
</p>

> 🎨 **[Explore 50+ more open-source AI apps →](https://github.com/Anil-matcha/awesome-generative-ai-apps)**

## Related Projects

- [Awesome-GPT-Image-2-API-Prompts](https://github.com/Anil-matcha/Awesome-GPT-Image-2-API-Prompts) — Curated GPT-Image-2 prompts for generating social media visuals
- [Open-AI-UGC](https://github.com/Anil-matcha/Open-AI-UGC) — Generate AI UGC video ads to schedule across your social channels
- [AI-Influencer-Generator](https://github.com/SamurAIGPT/AI-Influencer-Generator) — Create AI influencer content to post on a schedule
- [Open-Generative-AI](https://github.com/Anil-matcha/Open-Generative-AI) — Free open-source studio for 200+ AI image & video models

---

## Supported Platforms

| Platform | Status |
|----------|--------|
| YouTube | ✅ Live |
| TikTok | ✅ Live |
| Instagram Reels | 🔜 Coming Soon |
| Facebook Reels | 🔜 Coming Soon |
| X (Twitter) | 🔜 Coming Soon |
| LinkedIn | 🔜 Coming Soon |
| Threads | 🔜 Coming Soon |
| Pinterest | 🔜 Coming Soon |

## Features

- **Video Scheduling** — paste a media URL, pick a platform and time, publish automatically
- **Multi-account** — connect and manage multiple YouTube and TikTok accounts
- **YouTube controls** — category, privacy (public/private/unlisted), made-for-kids flag
- **TikTok controls** — privacy, disable comments/duets/stitches
- **Credits system** — Stripe-powered credits for scheduling posts
- **Post history** — track scheduled, published, and failed posts with status and published URLs
- **Self-hostable** — single Next.js app, no microservices, no complex infra

## Tech Stack

- **Framework:** Next.js 16
- **Auth:** NextAuth.js (Google OAuth)
- **Database:** PostgreSQL + Prisma
- **Payments:** Stripe
- **AI / Publishing:** MuAPI
- **Styling:** Tailwind CSS

## Quick Start

### 1. Clone the repo

```bash
git clone https://github.com/Anil-matcha/Free-AI-Social-Media-Scheduler
cd Free-AI-Social-Media-Scheduler
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Fill in `.env`:

```env
DATABASE_URL="postgresql://user:password@host:port/dbname?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:port/dbname"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_nextauth_secret"

GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

MUAPIAPP_API_KEY="your_muapi_api_key"
WEBHOOK_URL="your_webhook_url"

STRIPE_SECRET_KEY="your_stripe_secret_key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your_stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="your_stripe_webhook_secret"
```

### 3. Run migrations and start

```bash
npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Why this over Buffer or Hootsuite?

- **Video-first** — built specifically for YouTube and TikTok video publishing workflows
- **No per-seat pricing** — credits model, no $19–$99/month subscription
- **Simple to self-host** — single Next.js app, runs with one `npm run dev`
- **Open source** — MIT license, fork and extend freely

## Contributing

Open an issue or submit a pull request. Star the repo to stay updated as new platforms launch.

## License

MIT License. See [LICENSE](LICENSE) for details.
