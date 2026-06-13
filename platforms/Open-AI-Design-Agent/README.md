# Open AI Design Agent — Open-Source Alternative to Lovart AI, Runway Agent, Luma Labs Agent, Krea Agent

> **The free, open-source AI design agent.** Plan, generate, and assemble full creative deliverables — posters, social campaigns, brand kits, ad creatives, motion ads, and video cutdowns — through an autonomous agent that orchestrates 200+ image and video models. No subscription, no credit caps, no creative restrictions.

**Community:** Join [Reddit](https://reddit.com/r/muapi) & [Discord](https://discord.gg/s7KW4fsqXK) for discussions and support

> 🤖 **Automate Lovart, Runway, Luma Labs, Krea, Pika & more with AI coding agents:** [Generative-Media-Skills](https://github.com/SamurAIGPT/Generative-Media-Skills) — a library of skills that let agents like **Claude Code**, **Codex**, and other coding assistants drive 200+ image/video models end-to-end (brief → plan → generate → edit → assemble) directly from your terminal. Build automated creative pipelines without touching a UI.

https://github.com/user-attachments/assets/fee3857c-887d-4c27-b3dc-a1fe9ad8f438

### Related projects

> **Open-source Freepik, Krea, Openart alternative — uncensored image & video studio with 200+ models** -> https://github.com/Anil-matcha/Open-Generative-AI

> **Open-source Weavy, Flora Fauna, Freepik Spaces, Krea Nodes alternative — visual workflow editor** -> https://github.com/SamurAIGPT/Vibe-Workflow

> **Open-source Opus Clip alternative — turn long videos into viral vertical shorts** -> https://github.com/SamurAIGPT/AI-Youtube-Shorts-Generator

> **Open-source multi-modal chatbot and Poe alternative** -> https://github.com/Anil-matcha/Open-Poe-AI

<p align="center">
  <a href="https://github.com/Anil-matcha/awesome-generative-ai-apps">
    <img src="https://img.shields.io/badge/Part%20of-Awesome%20Generative%20AI%20Apps-FFD700?style=for-the-badge&logo=github&logoColor=black" alt="Awesome Generative AI Apps">
  </a>
</p>

> 🎨 **[Explore 50+ more open-source AI apps →](https://github.com/Anil-matcha/awesome-generative-ai-apps)**

## 🌐 Try it Online — No Install Required

**Hosted version:** [https://muapi.ai/assistant](https://muapi.ai/assistant)

Run the design agent directly in your browser — no Node.js, no setup. Sign up for a free account to start designing. The hosted version is always up to date with the latest models, planners, and templates.

**Follow** the [creator](https://x.com/matchaman11) for updates

---

Open AI Design Agent is a free, open-source AI design agent that turns natural-language briefs into full creative deliverables. Instead of picking one model and generating one asset, you describe a campaign, brand, or scene and the agent plans the deliverable list, picks the best model per asset (typography, vector, photoreal, motion), generates them in dependency order, threads brand references forward, and hands back the assembled kit. Powered by [Muapi.ai](https://muapi.ai), it orchestrates 200+ image and video models — Nano Banana 2, Flux 2 Pro, Ideogram v3, Seedream 5, GPT-Image, Recraft v3, Midjourney v7, Kling, Sora, Veo, Runway, Luma Ray2 — across a single agent loop you can self-host and modify.

**Why Open Lovart instead of Lovart, Runway Agent, Luma Labs Agent, Krea Agent?**
- **Free & open-source** — MIT-licensed, no subscription, no credit caps
- **Self-hosted** — your briefs, brand kits, and outputs stay on your machine
- **200+ models orchestrated** — image *and* video, routed automatically per asset (Flux 2, Nano Banana 2, Ideogram v3, Recraft v3, Kling, Sora, Veo, Runway, Luma Ray2)
- **Inspectable agent loop** — every plan, model choice, and intermediate output is visible and editable; nothing is black-boxed
- **Brand kit conditioning** — palette, fonts, logo, and tone persist across every generation in a campaign
- **Multi-image reference** — up to 14 images for style transfer, product placement, or character consistency
- **Static + motion in one agent** — same brief produces poster, social cutdown, and 9:16 video ad without switching tools
- **Extensible** — add your own templates, models, planners, and tool-calls; fork the agent loop; ship products on top

## ✨ Features

- **Design Agent (Chat Mode)** — Describe a brand or campaign in plain English; the agent plans deliverables, picks the right model per asset, generates them in order, and assembles the kit
- **Design Studio** — Posters, flyers, ad creatives, social graphics, presentation slides, logos, brand identities, illustrations, packaging mockups, UI screens — all from one prompt or chat thread
- **Motion Studio** — Animated logos, product motion mockups, video ads, social video cutdowns (9:16 / 1:1 / 16:9), lip-synced spokesperson clips
- **Multi-Image Reference** — Up to 14 reference images for style transfer, brand consistency, or product placement (Nano Banana 2 Edit, Flux Kontext, GPT-Image Edit, Seedream Edit)
- **Text Rendering** — Auto-route prompts containing typographic copy to text-capable models (Ideogram v3, Flux Pro Ultra, Nano Banana 2, GPT-Image)
- **Edit Mode** — Refine, recolor, restyle, expand, inpaint, or remove elements via natural-language edits
- **Brand Kit** — Persist palette, font, logo, and tone — every generation respects the kit automatically
- **Templates Library** — Pre-built recipes for Instagram posts, story ads, LinkedIn banners, YouTube thumbnails, A4 posters, business cards, e-commerce hero shots, app icons, t-shirt prints, motion ads
- **Vectorize & Export** — Convert raster outputs to SVG, remove backgrounds cleanly, upscale to 4K print-ready
- **Workflow Studio** — Visual node-based editor to chain models into repeatable design pipelines (powered by [Vibe Workflow](https://github.com/SamurAIGPT/Vibe-Workflow))
- **Smart Controls** — Aspect ratio, resolution, quality, duration, and seed pickers that adapt per model
- **Generation History** — Browse, revisit, and download every past design (persisted locally in browser storage)
- **Responsive UI** — Modern dark/glass interface that works on desktop and mobile
- **API Key Management** — Keys stored in browser `localStorage`, never sent anywhere except Muapi

### 🤖 Design Agent — How it Works

Give the agent a brief like *"launch kit for a sustainable coffee brand called Pinecone — modern, earthy, monochrome with one accent, plus a 9:16 launch video"* and it will:

1. **Plan** — break the brief into a deliverable list (logo, wordmark, palette swatches, IG launch post, story ad, A4 poster, business card, packaging mockup, 9:16 launch video, motion logo)
2. **Route** — pick the right model per asset (Recraft v3 for the logo, Ideogram v3 for the typographic poster, Nano Banana 2 Edit for product placement, Flux Pro for the hero shot, Kling / Sora / Veo / Runway / Luma Ray2 for video)
3. **Execute** — generate in dependency order, threading the brand palette and reference images forward at each step
4. **Assemble** — hand back the full kit as downloadable assets, organized by category

You can interrupt at any step, swap a model, lock a result, fork the plan, or hand-edit any intermediate output and resume.

### 🎨 Design Studio — Three Modes

| Mode | Trigger | Models | Best for |
| :--- | :--- | :--- | :--- |
| **Generate** | Default (no image) | 50+ t2i models with text-rendering routing | New designs from a brief |
| **Edit** | Reference image uploaded | 55+ i2i / inpaint / outpaint models | Refining, recoloring, restyling existing assets |
| **Agent** | Chat thread | All of the above + video models, planned by the agent | Multi-asset campaigns, brand kits, full identity sets |

### Supported Use Cases

| Asset | Recommended Models | Notes |
| :--- | :--- | :--- |
| **Posters / Flyers** | Ideogram v3, Flux Pro Ultra, Nano Banana 2 | Crisp typographic output, A4/A3 ready |
| **Social Posts (IG / TikTok / X)** | Seedream 5, Flux Dev, Nano Banana 2 | 1:1 / 4:5 / 9:16 templates included |
| **Logos** | Recraft v3, Ideogram v3 | Pair with Vectorize for SVG export |
| **Brand Identity Boards** | Flux Pro, GPT-Image, Nano Banana 2 Edit | Multi-image reference for consistency |
| **UI Mockups & App Screens** | Flux Dev, GPT-Image, Recraft v3 | Galileo AI / Stitch / v0 / Magic Patterns alternative |
| **Product Mockups & Lifestyle** | Nano Banana 2 Edit, Flux Kontext Pro | Place product on staged backgrounds |
| **Illustrations** | Flux Dev, SDXL, Anything v5 | Stylized character & scene work |
| **YouTube Thumbnails** | Ideogram v3, Nano Banana 2 | Readable bold text + face composition |
| **Print (≥ 300 DPI)** | Flux Pro Ultra, Imagen 4 Ultra | Pair with Clarity / Magnific upscaler |
| **Packaging & Merch** | Recraft v3, Flux Pro | Vector + repeat-pattern friendly |
| **Motion Ads / Social Video** | Kling v3, Sora 2, Veo 3, Runway, Luma Ray2 | 9:16 / 1:1 / 16:9, 5–15s |
| **Animated Logos** | Kling I2V, Runway I2V, Luma Ray2 I2V | Animate static logo through i2v |
| **Spokesperson / Talking Head** | Infinite Talk, LTX 2.3 Lipsync, Wan 2.2 Speech-to-Video | Portrait + audio → video |

### 🔀 Workflow Studio

The **Workflow Studio** lets you build and run multi-step design pipelines without writing code.

**Key capabilities:**
- **Templates** — Start from pre-built design pipelines (logo + kit, social bundle, ad variants, product photoshoot, motion ad)
- **My Workflows** — Save and manage your own pipelines
- **Community** — Browse and run workflows published by other users
- **Node-based Builder** — Drag-and-drop visual editor connecting models and routing outputs between steps
- **Playground** — Run any workflow interactively with a form UI; results render inline
- **API execution** — Every workflow is also callable via the Muapi API

> 💡 **Want to add workflows to your own app?** Check out **[Vibe Workflow](https://github.com/SamurAIGPT/Vibe-Workflow)** — the open-source workflow engine powering this feature.

## 🚀 Quick Start

> Studio code is being added — for now this repo holds the agent design and roadmap. Watch / star the repo to be notified when the studio lands. The hosted version at [dev.muapi.ai/open-lovart](https://dev.muapi.ai/open-lovart) is live.

### Prerequisites (when self-hosting lands)

- [Node.js](https://nodejs.org/) (v18+)
- A [Muapi.ai](https://muapi.ai) API key (free tier available)

### Setup

```bash
# Clone the repository
git clone https://github.com/Anil-matcha/Open-Lovart.git
cd Open-Lovart

# Install dependencies
npm run setup

# Start the dev server
npm run dev
```

Visit `http://localhost:3000` and enter your Muapi API key on first launch.

### Production Build

```bash
npm run build
npm run start
```

## 🎨 Supported Model Categories

| Category | Count | Examples |
|---|---|---|
| **Text-to-Image (Design)** | 50+ | Flux 2 Pro, Nano Banana 2, Ideogram v3, Seedream 5, GPT-Image, Recraft v3, Midjourney v7, Imagen 4 Ultra |
| **Image-to-Image (Edit)** | 55+ | Nano Banana 2 Edit, Flux Kontext Pro/Max, GPT-Image Edit, Seededit v3, Seedream 5 Edit |
| **Vector / Logo** | 5+ | Recraft v3, Ideogram v3, Vectorizer.AI |
| **Background Removal** | 3+ | BiRefNet, RemBG, BG-Remover-v2 |
| **Upscaling (Print-grade)** | 8+ | Real-ESRGAN, Clarity Upscaler, Topaz, Magnific |
| **Inpaint / Outpaint** | 10+ | Flux Fill Pro, GPT-Image Inpaint, Seededit |
| **Text-to-Video** | 40+ | Kling v3, Sora 2, Veo 3, Wan 2.6, Seedance 2.0, Runway Gen-3, Luma Ray2 |
| **Image-to-Video** | 60+ | Kling v2.1 I2V, Veo3 I2V, Runway I2V, Luma Ray2 I2V, Seedance 2.0 I2V |
| **Lip Sync** | 9 | Infinite Talk, Wan 2.2 Speech-to-Video, LTX 2.3 Lipsync, Sync, LatentSync |

## 🛠️ Tech Stack

- **Next.js 14** — App Router, server components, fast dev server
- **React 18** — Studio UI components
- **Tailwind CSS v3** — Utility-first styling
- **npm workspaces** — Monorepo with shared `packages/studio` library
- **Muapi.ai** — AI model API gateway
- **Vibe Workflow** — Open-source node-based workflow engine

## 🤔 How is this different from Lovart, Runway Agent, Luma Labs Agent, Krea Agent?

**Open Lovart** is a community-driven, open-source alternative to closed AI design agents — same agentic creative loop, none of the lock-in.

| | Lovart / Runway / Luma / Krea Agents | Open Lovart |
| :--- | :--- | :--- |
| **Cost** | Subscription + credit packs | Free (open-source) |
| **Credit caps** | Hard monthly limits | Pay-as-you-go via your own Muapi key |
| **Model coverage** | Proprietary or single-vendor stack | 200+ open & commercial models, image *and* video |
| **Agent loop** | Closed, opaque | Fully inspectable and forkable |
| **Static + motion** | Usually one or the other per agent | Both, in one plan |
| **Text rendering** | Limited / single model | Routed across Ideogram v3, Flux Pro, Nano Banana 2, GPT-Image |
| **Multi-image reference** | Limited | Up to 14 images per request |
| **Brand kit** | Basic | Persistent palette / font / logo / tone conditioning |
| **Custom planners / tools** | No | Yes — bring your own planner, model, or post-step |
| **Self-hosting** | No | Yes |
| **Data privacy** | Cloud-based | Your data stays local |
| **Source code** | Closed | MIT licensed |

## 📄 License

MIT

## 🙏 Credits

Built with [Muapi.ai](https://muapi.ai) — the unified API for AI image and video generation models.

---
*Looking for a free, open-source Lovart alternative? Open Lovart is an open-source AI design agent — a Lovart, Runway Agent, Luma Labs Agent, Krea Agent, Pika Agent, Galileo AI, Magic Patterns replacement that you can self-host, customize, and extend.*

This project is an independent, experimental, and open-source initiative and is not affiliated with, endorsed by, or associated with Lovart, Runway, Luma Labs, Krea AI, Pika Labs, Galileo AI, Magic Patterns, or any of their respective companies, products, or services. Any references to third-party platforms, models, or technologies are made solely for interoperability, benchmarking, research, or educational purposes. All trademarks, logos, and brand names are the property of their respective owners. If any content in this repository creates confusion or raises concerns, please contact us and we will promptly review and address it.

## FAQ

### What is Open AI Design Agent?

**Open AI Design Agent** is a free, open-source AI design agent — alternative to **Lovart AI**, **Runway Agent**, **Luma Labs Agent**, **Krea Agent**. It turns natural-language briefs into full creative deliverables by orchestrating **200+ image and video models**.

### Key Features

| Feature | Description |
|---------|-------------|
| **Design Agent** | Describe a brand/campaign → agent plans, picks models, generates, assembles the kit |
| **200+ Models** | Flux 2 Pro, Nano Banana 2, Ideogram v3, Recraft v3, Midjourney v7, Kling, Sora, Veo, Runway, Luma Ray2 |
| **Brand Kit** | Persist palette, fonts, logo, tone — every generation respects the kit |
| **Multi-Image Reference** | Up to 14 images for style transfer, brand consistency, product placement |
| **Motion Studio** | Animated logos, video ads, social video cutdowns (9:16/1:1/16:9) |
| **Templates Library** | Instagram posts, YouTube thumbnails, A4 posters, business cards, packaging mockups |
| **Vectorize & Export** | Convert raster to SVG, remove backgrounds, upscale to 4K print-ready |
| **Workflow Studio** | Visual node-based editor to chain models into repeatable pipelines |

### How to Get Started

**Hosted (No Install):** https://muapi.ai/assistant — Run directly in browser

**Self-Hosted:**
```bash
git clone https://github.com/Anil-matcha/Open-AI-Design-Agent.git
cd Open-AI-Design-Agent && npm run setup && npm run dev
```

Visit `http://localhost:3000` and enter your Muapi API key.

### Supported Asset Types

| Asset | Recommended Models |
|-------|---------------------|
| **Posters/Flyers** | Ideogram v3, Flux Pro Ultra, Nano Banana 2 |
| **Logos** | Recraft v3, Ideogram v3 (+ Vectorize for SVG) |
| **Social Posts** | Seedream 5, Flux Dev, Nano Banana 2 |
| **Product Mockups** | Nano Banana 2 Edit, Flux Kontext Pro |
| **Motion Ads** | Kling v3, Sora 2, Veo 3, Runway, Luma Ray2 |
| **YouTube Thumbnails** | Ideogram v3, Nano Banana 2 |

### Why Open vs Lovart/Runway/Luma/Krea?

- **Free & open-source** — MIT-licensed, no subscription, no credit caps
- **Self-hosted** — your briefs and outputs stay on your machine
- **Inspectable agent loop** — every plan and model choice is visible and editable
- **Static + motion in one agent** — same brief produces poster, social, and video

### Help Resources

| Resource | Link |
|----------|------|
| **Hosted Studio** | https://muapi.ai/assistant |
| **Reddit Community** | https://reddit.com/r/muapi |
| **Discord** | https://discord.gg/s7KW4fsqXK |
| **Related Projects** | [Open-Generative-AI](https://github.com/Anil-matcha/Open-Generative-AI), [Vibe Workflow](https://github.com/SamurAIGPT/Vibe-Workflow) |

### License

MIT License - Open source and free to use.
