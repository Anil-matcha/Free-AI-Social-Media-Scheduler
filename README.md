# Free AI Social Media Scheduler

[![Powered by MuAPI](https://img.shields.io/badge/Powered%20by-MuAPI-6366f1?style=flat-square&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMSAxNHYtNGgtMnYtMmg0djZoLTJ6bTAtOFY2aDJ2MmgtMnoiLz48L3N2Zz4=)](https://muapi.ai?utm_source=github&utm_medium=badge&utm_campaign=free-ai-social-media-scheduler)


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

- [MuAPI playground](https://muapi.ai/playground) — Generate the images and videos scheduled by this app.
- [MuAPI access keys](https://muapi.ai/access-keys) — Create the API key used for generative content.
- [Awesome-GPT-Image-2-API-Prompts](https://github.com/Anil-matcha/Awesome-GPT-Image-2-API-Prompts) — Curated GPT-Image-2 prompts for generating social media visuals
- [Open-AI-UGC](https://github.com/Anil-matcha/Open-AI-UGC) — Generate AI UGC video ads to schedule across your social channels
- [AI-Influencer-Generator](https://github.com/SamurAIGPT/AI-Influencer-Generator) — Create AI influencer content to post on a schedule
- [Open-Generative-AI](https://github.com/Anil-matcha/Open-Generative-AI) — Free open-source studio for 200+ AI image & video models
- [ai-creator-academy](https://github.com/Anil-matcha/ai-creator-academy) — free curriculum teaching creators how to monetize AI-generated content before scheduling and distributing it

---

## Supported Platforms

| Platform | Status |
|----------|--------|
| YouTube | ✅ Live |
| TikTok | ✅ Live |
| Instagram (Reels & Posts) | ✅ Live |
| Facebook (Pages & Reels) | ✅ Live |
| X (Twitter) | ✅ Live |
| LinkedIn | ✅ Live |
| Threads | ✅ Live |
| Pinterest | ✅ Live |

## Features

- **AI Social Marketing Agent** (`/agents`) — conversational AI marketing assistant with persistent context memory across conversations:
  - **3-Panel Workspace** — multi-channel selector on the left, interactive chat in the center, and conversation history threads on the right.
  - **Platform-Tailored Copy** — generates viral hooks, high-converting captions, and hashtag strategies tailored to specific character limits and algorithms.
  - **1-Click Post Proposals** — prepares structured post cards ready to open in the Composer and schedule with one click.
  - **Rich Markdown Rendering** — full typography with headings, styled bullet points, code blocks, and expandable JSON payloads.
  - **Context Memory** — retains tone, campaign guidelines, and brand instructions across the last 10 messages.
- **Video & Post Scheduling** — upload media or paste a URL, pick target platforms and times, and publish automatically.
- **Multi-Account Management** — connect and manage multiple social accounts (YouTube, TikTok, X, LinkedIn) from a unified dashboard.
- **YouTube Controls** — category selection, privacy (public/private/unlisted), made-for-kids flags.
- **TikTok Controls** — privacy settings, comment, duet, and stitch toggles.
- **Credits System** — Stripe-powered pay-as-you-go credits for scheduling posts.
- **Post History & Calendar** — track scheduled, published, and failed posts with status indicators and direct published URLs.
- **Self-Hostable** — single Next.js 16 app with Turbopack, no microservices or complex external infra required.

## Tech Stack

- **Framework:** Next.js 16 (App Router + Turbopack)
- **Auth:** NextAuth.js (Google OAuth)
- **Database:** PostgreSQL + Prisma ORM
- **Payments:** Stripe
- **AI / Publishing:** MuAPI
- **Markdown:** `react-markdown` + `remark-gfm`
- **Styling:** Tailwind CSS + Framer Motion

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
