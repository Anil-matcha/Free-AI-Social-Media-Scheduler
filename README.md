<p align="center">
  <a href="https://twitter.com/matchaman11">
    <img src="https://img.shields.io/badge/Follow%20on%20𝕏-000000?style=for-the-badge&logo=x&logoColor=white" alt="X / Twitter">
  </a>
  <a href="https://www.linkedin.com/in/anilmatcha/">
    <img src="https://img.shields.io/badge/Follow%20on%20LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn">
  </a>
</p>

<hr/>

<div align="center">

# 💸 Awesome Generative AI Apps

<p><strong>50 complete AI SaaS products. Brand them. Sell them. Keep 100% of the revenue.</strong><br/>
Each app is a fully working product you can launch under your own name this weekend — auth, billing, and AI all wired up.</p>

<p>
<strong>Stripe Billing · Google OAuth · One-click Vercel deploy · MIT Licensed</strong>
</p>

<p>
<a href="https://github.com/Anil-matcha/awesome-generative-ai-apps/stargazers"><img src="https://img.shields.io/github/stars/Anil-matcha/awesome-generative-ai-apps?style=for-the-badge&logo=github&color=FFD700" alt="Stars"></a>
<a href="https://github.com/Anil-matcha/awesome-generative-ai-apps/network/members"><img src="https://img.shields.io/github/forks/Anil-matcha/awesome-generative-ai-apps?style=for-the-badge&logo=github&color=4FC3F7" alt="Forks"></a>
<a href="LICENSE"><img src="https://img.shields.io/github/license/Anil-matcha/awesome-generative-ai-apps?style=for-the-badge&color=8B5CF6" alt="License"></a>
<img src="https://img.shields.io/github/last-commit/Anil-matcha/awesome-generative-ai-apps?style=for-the-badge&color=F97316" alt="Last Commit">
</p>

<p>
<a href="#-open-source-ai-platforms"><kbd> &nbsp; 🌐 Platforms &nbsp; </kbd></a>
<a href="#-image-generation"><kbd> &nbsp; 🖼️ Image &nbsp; </kbd></a>
<a href="#-video-generation"><kbd> &nbsp; 🎬 Video &nbsp; </kbd></a>
<a href="#-beauty--fashion-ai"><kbd> &nbsp; 💄 Beauty &amp; Fashion &nbsp; </kbd></a>
<a href="#-e-commerce--product-photography"><kbd> &nbsp; 🛒 E-commerce &nbsp; </kbd></a>
<a href="#-writing--content"><kbd> &nbsp; ✍️ Writing &nbsp; </kbd></a>
<a href="#-platform-integrations"><kbd> &nbsp; 🔧 Integrations &nbsp; </kbd></a>
</p>

</div>

---

## 💰 This Is a Money-Making Repo

Every app here is a **complete, sellable SaaS product** — not a demo, not a UI kit. Fork one, put your logo on it, and you have a live product that can take payments today.

**You own it entirely.** MIT licensed — no royalties, no revenue share, no attribution required. Your brand, your domain, your income.

### How the money works

Each template uses a credit billing model. Here's the math on a typical app:

| | Example: AI Headshot Generator |
|---|---|
| **You charge users** | $29 for a pack of 10 headshots |
| **AI cost per pack** | ~$1.50 (via MuAPI) |
| **Your margin** | ~$27.50 per pack (~95%) |
| **At 100 customers/month** | ~$2,750 MRR |
| **At 500 customers/month** | ~$13,750 MRR |

The margin is high because you're reselling AI compute. The hard parts — billing, auth, async job handling, webhook retry, credit deduction — are already built. Your job is distribution.

### What you're actually getting

- 💳 **Stripe checkout + webhooks** — users buy credits, Stripe pays you, credits unlock on webhook confirmation
- 🔐 **Google OAuth** — no auth to build or maintain
- 🤖 **100+ AI models** via [MuAPI](https://muapi.ai) — swap models without touching app code; MuAPI handles async polling, retries, and failover
- 🌐 **Vercel-ready** — one `Deploy` button and it's live on a CDN
- 🗄️ **Prisma + PostgreSQL** — user accounts, credit balances, and job history out of the box
- 🆓 **MIT licensed** — sell it, white-label it, charge whatever you want

### Pick a niche, own it

AI headshot tools charge $29–$49 per pack. Virtual staging tools charge $29 per image. Video clipping tools charge $49/month. These are not hypothetical — companies built on these exact ideas are doing millions in revenue. The open-source version of their product is right here.

> ⭐ **[Star this repo](https://github.com/Anil-matcha/awesome-generative-ai-apps/stargazers)** to bookmark it — new apps added regularly.

> 🍌 **Running Claude Fable 5?** [awesome-claude-fable-5](https://github.com/Anil-matcha/awesome-claude-fable-5) — 60 curated use cases + **20% off** via [MuAPI](https://muapi.ai/pricing).

---

## 🚀 Quick Start

```bash
# 1. Clone the template you want
git clone https://github.com/SamurAIGPT/<template-name>
cd <template-name>

# 2. Set up environment variables
cp .env.example .env
# Fill in: DATABASE_URL, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID/SECRET,
#          STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, MUAPI_API_KEY

# 3. Initialize DB and start
npx prisma db push && npm run dev
```

Or deploy instantly with the **Deploy to Vercel** button in each template's README.

---

## 🔥 Featured This Month

| Template | What it does | Live Demo |
|---|---|---|
| [💖 AI Kissing Video Generator](./video_generation/ai-kissing-video-generator) · [↗ GitHub](https://github.com/SamurAIGPT/ai-kissing-video-generator) | Merge two portrait photos into a romantic AI video using Veo 3, Wan 2.7 & Gemini Omni | [Demo](https://ai-kissing-video-generator-amber.vercel.app/) |
| [🎭 AI Character Studio](./portrait_avatar/ai-character-studio) · [↗ GitHub](https://github.com/SamurAIGPT/ai-character-studio) | Generate custom AI character portraits and chat with them in roleplay | [Demo](https://ai-character-studio-beta.vercel.app/) |
| [📦 Amazon Product Studio](./ecommerce/amazon-product-studio) · [↗ GitHub](https://github.com/SamurAIGPT/amazon-product-studio) | Generate studio-quality product photos from reference images | [Demo](https://amazon-product-studio.vercel.app/) |
| [🏠 AI Room Declutter](./home_real_estate/ai-room-declutter) · [↗ GitHub](https://github.com/SamurAIGPT/ai-room-declutter) | Transform messy rooms into photorealistic clean interiors with AI | [Demo](https://ai-room-declutter.vercel.app/) |

---

## 📑 Table of Contents

- [🌐 Open-Source AI Platforms](#-open-source-ai-platforms)
- [🖼️ Image Generation](#-image-generation)
- [🎬 Video Generation](#-video-generation)
- [💄 Beauty & Fashion AI](#-beauty--fashion-ai)
- [🛒 E-commerce & Product Photography](#-e-commerce--product-photography)
- [🏠 Home & Real Estate AI](#-home--real-estate-ai)
- [👤 Portrait & Avatar AI](#-portrait--avatar-ai)
- [✍️ Writing & Content](#️-writing--content)
- [🤖 AI Agents & Chatbots](#-ai-agents--chatbots)
- [🎵 Audio & Voice](#-audio--voice)
- [🔧 Platform Integrations](#-platform-integrations)

---

## 🌐 Open-Source AI Platforms

Full-stack platforms you can self-host or white-label. Leonardo AI charges $12–$60/mo. OpenArt charges $9–$57/mo. Krea charges $10–$35/mo. These open-source alternatives let you capture that same revenue with zero licensing fees.

| App | Description | Competing With | Stars |
|---|---|---|---|
| [Open Generative AI](./platforms/Open-Generative-AI) · [↗ GitHub](https://github.com/Anil-matcha/Open-Generative-AI) | Open-source AI image & video studio with 200+ models. No content filters. Self-hosted. | Leonardo AI ($60/mo), Krea ($35/mo), OpenArt ($57/mo) | ⭐ 18k+ |
| [Free AI Social Media Scheduler](./platforms/Free-AI-Social-Media-Scheduler) · [↗ GitHub](https://github.com/Anil-matcha/Free-AI-Social-Media-Scheduler) | Self-hostable AI social media scheduler with built-in content generation | Buffer ($18/mo), Hootsuite ($99/mo), Postiz ($42/mo) | ⭐ 2k+ |
| [Open AI Design Agent](./platforms/Open-AI-Design-Agent) · [↗ GitHub](https://github.com/Anil-matcha/Open-AI-Design-Agent) | Autonomous multi-step AI design agent for creatives, brand kits, ad creatives | Lovart AI ($30/mo), Galileo AI ($50/mo) | ⭐ 781 |
| [Open Poe AI](./platforms/Open-Poe-AI) · [↗ GitHub](https://github.com/Anil-matcha/Open-Poe-AI) | Self-hosted multi-model AI chat — GPT, Claude, Gemini, Llama, bring your own keys | Poe AI ($20/mo), ChatGPT Plus ($20/mo) | ⭐ 242 |

---

## 🖼️ Image Generation

**The market:** Midjourney makes est. $200M+/year. DALL·E powers ChatGPT Plus at $20/mo for 200M+ users. Aragon AI (just headshots) reportedly crossed $1M ARR. One niche image product = real income.

| Template | Description | Competing With | Demo |
|---|---|---|---|
| [Nano Banana Generator](./image_generation/nano-banana-generator) · [↗ GitHub](https://github.com/SamurAIGPT/nano-banana-generator) | Text-to-image and multi-image reference editing SaaS | Midjourney ($10–$30/mo), DALL·E ($15/mo) | [Demo](https://nano-banana-generator.vercel.app/) |
| [AI Headshot Generator](./image_generation/ai-headshot-generator) · [↗ GitHub](https://github.com/SamurAIGPT/ai-headshot-generator) | LinkedIn photos, team portraits, personal branding | Aragon AI ($29–$49/pack), HeadshotPro ($29/pack) — Aragon est. $1M+ ARR | [Demo](https://ai-headshot-generator.vercel.app/) |
| [AI Logo Studio](./image_generation/ai-logo-studio) · [↗ GitHub](https://github.com/SamurAIGPT/ai-logo-studio) | Text-to-logo and sketch-to-logo brand identity generator | Looka ($20–$80/logo), Brandmark ($25–$65/logo) | [Demo](https://ai-logo-studio.vercel.app/) |
| [AI Meme Studio](./image_generation/ai-meme-generator) · [↗ GitHub](https://github.com/SamurAIGPT/ai-meme-generator) | AI meme & viral short video generator with multiple models | Imgflip Pro ($10/mo), Supermeme ($19/mo) | [Demo](https://ai-meme-generator.vercel.app/) |
| [Old Photo Restore](./image_generation/old-photo-restore) · [↗ GitHub](https://github.com/SamurAIGPT/old-photo-restore) | Colorize, denoise, and repair damaged vintage photos | Remini (est. $100M+ revenue), MyHeritage ($50/yr) | [Demo](https://old-photo-restore.vercel.app/) |
| [ClearMark AI](./image_generation/clearmark-ai) · [↗ GitHub](https://github.com/SamurAIGPT/clearmark-ai) | Remove watermarks, logos, and text overlays using GPT Image 2 | Watermarkremover.io ($9.99/mo), HitPaw ($20/mo) | [Demo](https://clearmark-ai.vercel.app/) |

---

## 🎬 Video Generation

**The market:** Opus Clip (video clipping) raised $10M and reportedly hit $20M+ ARR. Runway raised $236M. The AI video tools market is projected at $2B+ by 2027. Clipping and short-form tools are the highest-demand entry point.

| Template | Description | Competing With | Demo |
|---|---|---|---|
| [Seedance 2 Generator](./video_generation/seedance-2-generator) · [↗ GitHub](https://github.com/SamurAIGPT/seedance-2-generator) | Text-to-video and multi-image reference video SaaS | Runway ($12–$76/mo), Kling ($10–$36/mo) | [Demo](https://seedance-2-generator.vercel.app/) |
| [Veo Video Generator](./video_generation/veo4-video-generator) · [↗ GitHub](https://github.com/SamurAIGPT/veo4-video-generator) | Text-to-video and image-to-video with Google Veo | Sora ($20/mo), Runway ($76/mo) | [Demo](https://veo4-video-generator.vercel.app/) |
| [AI Kissing Video Generator](./video_generation/ai-kissing-video-generator) · [↗ GitHub](https://github.com/SamurAIGPT/ai-kissing-video-generator) | Merge two portraits into a romantic AI video | Reface ($4.99/mo), novelty apps charging $2–5/video | [Demo](https://ai-kissing-video-generator-amber.vercel.app/) |
| [AI Youtube Shorts Generator](./video_generation/AI-Youtube-Shorts-Generator) · [↗ GitHub](https://github.com/SamurAIGPT/AI-Youtube-Shorts-Generator) | Auto-extract viral 9:16 shorts from long-form videos | Opus Clip ($15–$49/mo, est. $20M+ ARR), Klap ($29/mo) | [Demo](./video_generation/AI-Youtube-Shorts-Generator) · [↗ GitHub](https://github.com/SamurAIGPT/AI-Youtube-Shorts-Generator) |
| [AI Clipping Generator](./video_generation/ai-clipping-generator) · [↗ GitHub](https://github.com/SamurAIGPT/ai-clipping-generator) | Auto-extract Reels and TikToks from YouTube videos | Opus Clip ($15–$49/mo), SubMagic ($20–$60/mo) | [Demo](https://ai-clipping-generator.vercel.app/) |
| [AI Micro-Drama Generator](./video_generation/Open-AI-Micro-Drama-Generator) · [↗ GitHub](https://github.com/Anil-matcha/Open-AI-Micro-Drama-Generator) | Turn any idea into a complete short-form AI drama | Creatify ($39/mo), Synthesia ($22–$67/mo) | — |
| [AI B-Roll Generator](https://github.com/Anil-matcha/AI-B-roll) | Auto-generate relevant B-roll footage from scripts or transcripts | Storyblocks ($15/mo), Artlist ($16/mo) | — |
| [Open AI UGC](./video_generation/Open-AI-UGC) · [↗ GitHub](https://github.com/Anil-matcha/Open-AI-UGC) | Generate AI UGC-style video ads with virtual creators | Arcads ($99–$299/mo), MakeUGC ($49/mo) | — |

---

## 💄 Beauty & Fashion AI

**The market:** ModiFace (acquired by L'Oreal for est. $68M) powers virtual try-ons for major retailers. YouCam makes $50M+/year. Fashion and beauty AI tools have some of the highest willingness-to-pay of any consumer vertical.

| Template | Description | Competing With | Demo |
|---|---|---|---|
| [TryOn AI](./beauty_fashion/ai-tryon) · [↗ GitHub](https://github.com/SamurAIGPT/ai-tryon) | Fit any garment onto any person photo | Botika ($99+/mo for brands), Lalaland.ai (enterprise) | [Demo](https://ai-tryon-smoky.vercel.app/) |
| [AI Hairstyle Simulator](./beauty_fashion/ai-hair-style-simulator) · [↗ GitHub](https://github.com/SamurAIGPT/ai-hair-style-simulator) | Virtual hair makeover and color try-on | YouCam Hair ($30/yr), HairStyle.ai ($7.99/mo) | [Demo](https://ai-hair-style-simulator.vercel.app/) |
| [AI Tattoo Try-On](./beauty_fashion/ai-tattoo-try-on) · [↗ GitHub](https://github.com/SamurAIGPT/ai-tattoo-try-on) | Preview tattoo designs on skin virtually | Ink Hunter (1M+ users), Tattoosmart ($4.99/mo) | [Demo](https://ai-tattoo-try-on.vercel.app/) |
| [AI Professional Makeup](./beauty_fashion/ai-professional-makeup-generator) · [↗ GitHub](https://github.com/SamurAIGPT/ai-professional-makeup-generator) | Try on professional makeup looks with AI | YouCam Makeup ($30/yr), Perfect Corp ($enterprise) | [Demo](https://ai-professional-makeup-generator.vercel.app/) |

---

## 🛒 E-commerce & Product Photography

**The market:** Photoroom (product photo editing) raised $19M Series A and reportedly crossed $50M ARR. Flair AI raised $4M. E-commerce sellers pay premium for anything that speeds up product listings — this is a high-LTV B2B niche.

| Template | Description | Competing With | Demo |
|---|---|---|---|
| [Resale Photo Enhancer](./ecommerce/resale-photo-enhancer) · [↗ GitHub](https://github.com/SamurAIGPT/resale-photo-enhancer) | AI product photo studio for eBay, Poshmark, Depop sellers | Photoroom ($9.99–$79/mo, est. $50M+ ARR), Pixelcut ($7/mo) | [Demo](https://resale-photo-enhancer.vercel.app/) |
| [Pet Product Studio](./ecommerce/pet-product-studio) · [↗ GitHub](https://github.com/SamurAIGPT/pet-product-studio) | AI lifestyle product ads featuring pets | Pebblely ($19–$39/mo), Flair AI ($10+/mo) | [Demo](https://pet-product-studio.vercel.app/) |
| [Amazon Product Studio](./ecommerce/amazon-product-studio) · [↗ GitHub](https://github.com/SamurAIGPT/amazon-product-studio) | Studio-quality product photos from reference images | Flair AI ($10+/mo), Booth AI ($20+/mo), Photoroom ($79/mo for teams) | [Demo](https://amazon-product-studio.vercel.app/) |

---

## 🏠 Home & Real Estate AI

**The market:** BoxBrownie (real estate photo editing) processes 100k+ orders/month at $4–$32/image. Virtual Staging AI charges $29/image. The real estate industry spends $10B+/year on marketing — AI staging is eating into that fast.

| Template | Description | Competing With | Demo |
|---|---|---|---|
| [EstateStager AI](./home_real_estate/ai-real-estate-stager) · [↗ GitHub](https://github.com/SamurAIGPT/ai-real-estate-stager) | Turn empty rooms into furnished showrooms with AI | BoxBrownie ($32/room), Virtual Staging AI ($29/image) | [Demo](https://ai-real-estate-stager.vercel.app/) |
| [AI Room Declutter](./home_real_estate/ai-room-declutter) · [↗ GitHub](https://github.com/SamurAIGPT/ai-room-declutter) | Transform messy rooms into photorealistic clean interiors | RoomGPT ($10/mo), Reimagine Home ($15/mo) | [Demo](https://ai-room-declutter.vercel.app/) |

---

## 👤 Portrait & Avatar AI

**The market:** Lensa AI made $50M in two months at launch. FaceApp has 150M+ users. Portrait and avatar tools are proven consumer hits — high volume, impulse purchase, low churn from novelty factor.

| Template | Description | Competing With | Demo |
|---|---|---|---|
| [Royal Portrait AI](./portrait_avatar/ai-royal-portrait) · [↗ GitHub](https://github.com/SamurAIGPT/ai-royal-portrait) | Transform selfies into royal and artistic portrait styles | Lensa AI ($8/mo), Portrait AI ($10/pack) | [Demo](https://ai-royal-portrait.vercel.app/) |
| [MagicSelf AI](./portrait_avatar/magicself-ai) · [↗ GitHub](https://github.com/SamurAIGPT/magicself-ai) | Turn selfies into oil paintings, anime, watercolors, and more | Prisma (50M+ users), ToonMe ($3.99/mo) | [Demo](https://magicself-ai.vercel.app/) |
| [AI Wedding Photo](./portrait_avatar/ai-wedding-photo) · [↗ GitHub](https://github.com/SamurAIGPT/ai-wedding-photo) | Place any portrait into dreamy wedding scenes | Remini ($10/mo), Facetune ($6/mo) | [Demo](https://ai-wedding-photo.vercel.app/) |
| [AI Kid to Adult](./portrait_avatar/ai-kid-to-adult-prediction) · [↗ GitHub](https://github.com/SamurAIGPT/ai-kid-to-adult-prediction) | Photorealistic age progression — child to adult | FaceApp ($4/mo, 150M+ users), AgePro ($2.99) | [Demo](https://ai-kid-to-adult-prediction.vercel.app/) |
| [AI Pet Portrait](./portrait_avatar/ai-pet-portrait) · [↗ GitHub](https://github.com/SamurAIGPT/ai-pet-portrait) | Transform pet photos into paintings, royal portraits, and art | Portrait My Pet ($35/pack), PetPainter ($15/pack) | [Demo](https://ai-pet-portrait.vercel.app/) |
| [AI Travel Studio](./ai_agents/ai-travel-studio) · [↗ GitHub](https://github.com/SamurAIGPT/ai-travel-studio) | Place yourself into iconic travel destinations worldwide | Teleport AI ($9.99/mo), AI Photo ($5/pack) | [Demo](https://ai-travel-studio.vercel.app/) |
| [AI Fitness Simulator](./portrait_avatar/ai-fitness-body-simulator) · [↗ GitHub](https://github.com/SamurAIGPT/ai-fitness-body-simulator) | Visualize body transformation goals with AI | BodyApp AI ($10/mo), Fitness AI ($10/mo) | [Demo](https://ai-fitness-body-simulator.vercel.app/) |

---

## ✍️ Writing & Content

**The market:** Jasper AI hit $80M ARR at peak. Copy.ai raised $13.9M. Surfer SEO raised $22M. Writers and marketers are the highest-converting SaaS buyers — they feel the pain every day and pay monthly without question.

| Template | Description | Competing With | Demo |
|---|---|---|---|
| [Blogger CMS](./writing_content/blogger-cms) · [↗ GitHub](https://github.com/SamurAIGPT/blogger-cms) | AI blog writer with WYSIWYG editor and full SEO suite | Jasper ($39–$99/mo, $80M+ ARR peak), Surfer SEO ($69/mo) | [Demo](https://blogger-cms-psi.vercel.app/) |
| [Social Post AI](./writing_content/social-post) · [↗ GitHub](https://github.com/SamurAIGPT/social-post) | Generate posts for LinkedIn, Twitter/X, Instagram, Reddit | Buffer ($18/mo), Taplio ($39/mo), Hootsuite ($99/mo) | [Demo](https://social-post-woad.vercel.app/) |
| [Prompt Architect](./writing_content/prompt-architect) · [↗ GitHub](https://github.com/SamurAIGPT/prompt-architect) | Engineer and refine AI prompts for ChatGPT, Claude, Midjourney | PromptBase ($10+/prompt), PromptPerfect ($9.99/mo) | [Demo](https://prompt-architect-one-nu.vercel.app/) |
| [AI Resume Builder](./writing_content/ai-resume-builder) · [↗ GitHub](https://github.com/SamurAIGPT/ai-resume-builder) | ATS-optimized resumes with PDF/Word export | Teal ($29/mo), Kickresume ($19/mo), Rezi ($29/mo) | [Demo](https://ai-resume-builder.vercel.app/) |
| [Mail-Wise](./writing_content/mail-wise) · [↗ GitHub](https://github.com/SamurAIGPT/mail-wise) | AI cold email and business email composer | Lavender AI ($29/mo), Reply.io ($60/mo) | [Demo](https://mail-wise-khaki.vercel.app/) |
| [GEO Checker](./writing_content/geo-checker) · [↗ GitHub](https://github.com/SamurAIGPT/geo-checker) | Audit landing page AI search visibility for ChatGPT, Perplexity, Gemini | SEMrush ($120/mo), Surfer SEO ($69/mo) | [Demo](https://geo-checker.vercel.app/) |

---

## 🤖 AI Agents & Chatbots

**The market:** Character.AI reportedly crossed $1B ARR. Chatbase (chatbot builder) hit $1M ARR in under a year bootstrapped. Botpress raised $25M. Custom AI agents are the fastest-growing B2B SaaS category.

| Template | Description | Competing With | Demo |
|---|---|---|---|
| [KnowBase AI](./ai_agents/ai-knowledge-base) · [↗ GitHub](https://github.com/SamurAIGPT/ai-knowledge-base) | RAG chatbot builder trained on your docs, URLs, and Q&A | Chatbase ($19–$99/mo, $1M+ ARR), SiteGPT ($49/mo) | [Demo](https://ai-knowledge-base-six.vercel.app/) |
| [CardAI Creator](./portrait_avatar/ai-business-card) · [↗ GitHub](https://github.com/SamurAIGPT/ai-business-card) | Digital business cards with embedded AI visitor chatbot | Popl ($8/mo), HiHello ($6/mo) | [Demo](https://ai-business-card-ten.vercel.app/) |
| [AI Character Studio](./portrait_avatar/ai-character-studio) · [↗ GitHub](https://github.com/SamurAIGPT/ai-character-studio) | Generate AI character portraits and roleplay chat | Character.AI (est. $1B ARR), Replika ($70/yr) | [Demo](https://ai-character-studio-beta.vercel.app/) |
| [Open Character AI](./portrait_avatar/open-character-ai) · [↗ GitHub](https://github.com/Anil-matcha/open-character-ai) | Self-hosted character roleplay chatbot — custom personas with per-chat LLM tuning | Character.AI (est. $1B ARR), Replika ($70/yr) | — |

---

## 🎵 Audio & Voice

**The market:** ElevenLabs hit $80M ARR in under 3 years and raised at a $3.3B valuation. Murf AI raised $10M. Voice is one of the fastest paths to B2B revenue — companies pay recurring fees for voice APIs that power their own products.

| Template | Description | Competing With | Demo |
|---|---|---|---|
| [My Podcast Studio](./ai_agents/my-podcast) · [↗ GitHub](https://github.com/SamurAIGPT/my-podcast) | AI voiceover and podcast narration with MiniMax Speech 2.6 | ElevenLabs ($5–$99/mo, $80M ARR), Murf AI ($29/mo) | [Demo](https://my-podcast.vercel.app/) |
| [AI Voice Agent](./ai_agents/AI-Voice-Agent) · [↗ GitHub](https://github.com/Anil-matcha/AI-Voice-Agent) | Self-hosted AI voice agent with speech-to-speech conversation | Bland.ai ($0.09/min), Vapi ($0.05/min), Retell AI ($0.07/min) | — |

---

## 🔧 Platform Integrations

| Integration | Description | Install |
|---|---|---|
| [Claude Code Plugin](https://github.com/SamurAIGPT/muapi-claude-code) | Generate images, videos & audio directly in Claude Code | `claude mcp add muapi -- npx -y muapi-claude-code` |
| [MCP Server](https://github.com/SamurAIGPT/muapi-mcp-server) | Hosted MCP server for Claude, Cursor, Windsurf & more | `claude mcp add --transport http muapi https://api.muapi.ai/mcp` |
| [n8n Nodes](https://github.com/SamurAIGPT/n8n-nodes-muapi) | 60+ AI model nodes for n8n automation workflows | Search "muapi" in n8n community nodes |
| [ComfyUI Nodes](https://github.com/SamurAIGPT/muapi-comfyui) | 100+ model nodes for ComfyUI image/video pipelines | Clone into `custom_nodes/` |
| [CLI](https://github.com/SamurAIGPT/muapi-cli) | Generate images, videos & audio from the terminal | `npm install -g muapi-cli` |
| [Generative Media Skills](https://github.com/SamurAIGPT/Generative-Media-Skills) | AI agent skills for Claude Code, Cursor, Gemini CLI | See repo for install |

---

## 🏗️ Common Stack

Every template is built on the same production-ready foundation:

```
Next.js 14 (App Router)  ·  Prisma ORM  ·  PostgreSQL (Supabase / Neon)
NextAuth (Google OAuth)  ·  Stripe Checkout + Webhooks  ·  Tailwind CSS
Vercel deployment
```

Base template (auth + billing + webhooks, no AI logic):
**[github.com/SamurAIGPT/ai-saas-starter](https://github.com/SamurAIGPT/ai-saas-starter)**

---

## 📄 License

MIT Licensed. Fork it, ship it, sell it.
