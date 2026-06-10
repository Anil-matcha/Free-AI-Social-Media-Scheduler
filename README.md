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

# 🎨 Awesome Generative AI Apps

<p><strong>50+ open-source generative AI apps you can clone, deploy, and monetize.</strong><br/>
AI Platforms · Image Generators · Video Tools · Virtual Try-Ons · AI SaaS Templates · Platform Integrations</p>

<p>
<strong>Every template is production-ready with Google OAuth · Stripe Billing · One-click Vercel deploy</strong>
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

## 💡 Why this exists

You shouldn't have to rebuild authentication, billing, AI polling, and webhook handling from scratch every time you ship a new AI product.

**Awesome Generative AI Apps is a catalog of production-ready SaaS templates** — fork one, add your API key, deploy to Vercel, and you have a live AI product in minutes.

- 🛠️ **Hand-built, not curated** — every template is original work, tested end-to-end before it ships.
- ⚡ **Deploy in 3 steps** — fork → set env vars → push to Vercel. No broken configs.
- 💳 **Monetization built-in** — Stripe credit billing, webhook fulfillment, and a pricing page in every template.
- 🔐 **Auth included** — Google OAuth + NextAuth + Prisma session management out of the box.
- 🤖 **100+ AI models** — swap between image, video, audio, and enhancement models without changing your app code.
- 🆓 **MIT licensed** — fork it, ship it, sell it.

> ⭐ **If this saves you time, [star the repo](https://github.com/Anil-matcha/awesome-generative-ai-apps/stargazers) — that's how the next developer finds it.**

---

## 🚀 Quick Start

Every template follows the same 3-step setup:

```bash
# 1. Clone the template you want
git clone https://github.com/SamurAIGPT/<template-name>
cd <template-name>

# 2. Set up environment variables
cp .env.example .env
# Fill in: DATABASE_URL, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID/SECRET,
#          STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, AI_API_KEY

# 3. Initialize DB and start
npx prisma db push && npm run dev
```

Or deploy instantly with the **Deploy to Vercel** button in each template's README.

---

## 🔥 Featured This Month

| Template | What it does | Live Demo |
|---|---|---|
| [💖 AI Kissing Video Generator](https://github.com/SamurAIGPT/ai-kissing-video-generator) | Merge two portrait photos into a romantic AI video using Veo 3, Wan 2.7 & Gemini Omni | [Demo](https://ai-kissing-video-generator-amber.vercel.app/) |
| [🎭 AI Character Studio](https://github.com/SamurAIGPT/ai-character-studio) | Generate custom AI character portraits and chat with them in roleplay | [Demo](https://ai-character-studio-beta.vercel.app/) |
| [📦 Amazon Product Studio](https://github.com/SamurAIGPT/amazon-product-studio) | Generate studio-quality product photos from reference images | [Demo](https://amazon-product-studio.vercel.app/) |
| [🏠 AI Room Declutter](https://github.com/SamurAIGPT/ai-room-declutter) | Transform messy rooms into photorealistic clean interiors with AI | [Demo](https://ai-room-declutter.vercel.app/) |

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

Full-stack open-source platforms — not just templates, but production apps you can self-host or use to run your own AI business.

| App | Description | Free Alternative To | Stars |
|---|---|---|---|
| [Open Generative AI](https://github.com/Anil-matcha/Open-Generative-AI) | Open-source AI image & video studio with 200+ models (Flux, Midjourney, Kling, Veo). No content filters. Self-hosted. | Freepik, OpenArt, Krea, Leonardo AI | ⭐ 18k+ |
| [Free AI Social Media Scheduler](https://github.com/Anil-matcha/Free-AI-Social-Media-Scheduler) | Self-hostable AI social media scheduler with built-in AI content generation and multi-platform publishing | Postiz, Buffer, Hootsuite | ⭐ 2k+ |
| [Open AI Design Agent](https://github.com/Anil-matcha/Open-AI-Design-Agent) | Autonomous multi-step AI design agent for posters, social creatives, brand kits, ad creatives, and video | Lovart AI, Galileo AI, Magic Patterns | ⭐ 781 |
| [Open Poe AI](https://github.com/Anil-matcha/Open-Poe-AI) | Self-hosted multi-model AI chat — GPT, Claude, Gemini, and Llama in one interface, bring your own API keys | Poe AI, ChatGPT | ⭐ 242 |

---

## 🖼️ Image Generation

| Template | Description | Free Alternative To | Demo |
|---|---|---|---|
| [Nano Banana Generator](https://github.com/SamurAIGPT/nano-banana-generator) | Text-to-image and multi-image reference editing SaaS | Midjourney, DALL·E | [Demo](https://nano-banana-generator.vercel.app/) |
| [AI Headshot Generator](https://github.com/SamurAIGPT/ai-headshot-generator) | LinkedIn photos, team portraits, personal branding | Aragon AI, HeadshotPro | [Demo](https://ai-headshot-generator.vercel.app/) |
| [AI Logo Studio](https://github.com/SamurAIGPT/ai-logo-studio) | Text-to-logo and sketch-to-logo brand identity generator | Looka, Brandmark.io | [Demo](https://ai-logo-studio.vercel.app/) |
| [AI Meme Studio](https://github.com/SamurAIGPT/ai-meme-generator) | AI meme & viral short video generator with multiple models | — | [Demo](https://ai-meme-generator.vercel.app/) |
| [Old Photo Restore](https://github.com/SamurAIGPT/old-photo-restore) | Colorize, denoise, and repair damaged vintage photos | Remini | [Demo](https://old-photo-restore.vercel.app/) |
| [ClearMark AI](https://github.com/SamurAIGPT/clearmark-ai) | Remove watermarks, logos, and text overlays using GPT Image 2 | Watermarkremover.io, HitPaw | [Demo](https://clearmark-ai.vercel.app/) |

---

## 🎬 Video Generation

| Template | Description | Free Alternative To | Demo |
|---|---|---|---|
| [Seedance 2 Generator](https://github.com/SamurAIGPT/seedance-2-generator) | Text-to-video and multi-image reference video SaaS | Runway, Kling | [Demo](https://seedance-2-generator.vercel.app/) |
| [Veo Video Generator](https://github.com/SamurAIGPT/veo4-video-generator) | Text-to-video and image-to-video with Google Veo | Sora, Runway | [Demo](https://veo4-video-generator.vercel.app/) |
| [AI Kissing Video Generator](https://github.com/SamurAIGPT/ai-kissing-video-generator) | Merge two portraits into a romantic AI video | — | [Demo](https://ai-kissing-video-generator-amber.vercel.app/) |
| [AI Youtube Shorts Generator](https://github.com/SamurAIGPT/AI-Youtube-Shorts-Generator) | Auto-extract viral 9:16 shorts from long-form videos | Opus Clip, Vidyo.ai, Klap | [Demo](https://github.com/SamurAIGPT/AI-Youtube-Shorts-Generator) |
| [AI Clipping Generator](https://github.com/SamurAIGPT/ai-clipping-generator) | Auto-extract Reels and TikToks from YouTube videos | Opus Clip, SubMagic | [Demo](https://ai-clipping-generator.vercel.app/) |
| [AI Micro-Drama Generator](https://github.com/Anil-matcha/Open-AI-Micro-Drama-Generator) | Turn any idea into a complete short-form AI drama — screenwriter → storyboard → frames → video (Seedance 2, Kling, Veo) | Creatify, Synthesia | — |
| [AI B-Roll Generator](https://github.com/Anil-matcha/AI-B-roll) | Auto-generate relevant B-roll footage from scripts or video transcripts using AI | Pexels, Storyblocks | — |
| [Open AI UGC](https://github.com/Anil-matcha/Open-AI-UGC) | Generate AI UGC-style video ads with virtual creators using Veo, Seedance, and Happy Horse | Arcads, MakeUGC | — |

---

## 💄 Beauty & Fashion AI

| Template | Description | Free Alternative To | Demo |
|---|---|---|---|
| [TryOn AI](https://github.com/SamurAIGPT/ai-tryon) | Fit any garment onto any person photo | Botika, Lalaland.ai | [Demo](https://ai-tryon-smoky.vercel.app/) |
| [AI Hairstyle Simulator](https://github.com/SamurAIGPT/ai-hair-style-simulator) | Virtual hair makeover and color try-on | YouCam Hair, HairStyle.ai | [Demo](https://ai-hair-style-simulator.vercel.app/) |
| [AI Tattoo Try-On](https://github.com/SamurAIGPT/ai-tattoo-try-on) | Preview tattoo designs on skin virtually | Ink Hunter, Tattoosmart | [Demo](https://ai-tattoo-try-on.vercel.app/) |
| [AI Professional Makeup](https://github.com/SamurAIGPT/ai-professional-makeup-generator) | Try on professional makeup looks with AI | YouCam Makeup, ModiFace | [Demo](https://ai-professional-makeup-generator.vercel.app/) |

---

## 🛒 E-commerce & Product Photography

| Template | Description | Free Alternative To | Demo |
|---|---|---|---|
| [Resale Photo Enhancer](https://github.com/SamurAIGPT/resale-photo-enhancer) | AI product photo studio for eBay, Poshmark, Depop sellers | Photoroom | [Demo](https://resale-photo-enhancer.vercel.app/) |
| [Pet Product Studio](https://github.com/SamurAIGPT/pet-product-studio) | AI lifestyle product ads featuring pets | Pebblely | [Demo](https://pet-product-studio.vercel.app/) |
| [Amazon Product Studio](https://github.com/SamurAIGPT/amazon-product-studio) | Studio-quality product photos from reference images | Flair AI, Booth AI | [Demo](https://amazon-product-studio.vercel.app/) |

---

## 🏠 Home & Real Estate AI

| Template | Description | Free Alternative To | Demo |
|---|---|---|---|
| [EstateStager AI](https://github.com/SamurAIGPT/ai-real-estate-stager) | Turn empty rooms into furnished showrooms with AI | BoxBrownie, Virtual Staging AI | [Demo](https://ai-real-estate-stager.vercel.app/) |
| [AI Room Declutter](https://github.com/SamurAIGPT/ai-room-declutter) | Transform messy rooms into photorealistic clean interiors | RoomGPT, Reimagine Home | [Demo](https://ai-room-declutter.vercel.app/) |

---

## 👤 Portrait & Avatar AI

| Template | Description | Free Alternative To | Demo |
|---|---|---|---|
| [Royal Portrait AI](https://github.com/SamurAIGPT/ai-royal-portrait) | Transform selfies into 20 royal and artistic portrait styles | Lensa AI, Portrait AI | [Demo](https://ai-royal-portrait.vercel.app/) |
| [MagicSelf AI](https://github.com/SamurAIGPT/magicself-ai) | Turn selfies into oil paintings, anime, watercolors, and more | Prisma, ToonMe | [Demo](https://magicself-ai.vercel.app/) |
| [AI Wedding Photo](https://github.com/SamurAIGPT/ai-wedding-photo) | Place any portrait into dreamy wedding scenes | Remini, Facetune | [Demo](https://ai-wedding-photo.vercel.app/) |
| [AI Kid to Adult](https://github.com/SamurAIGPT/ai-kid-to-adult-prediction) | Photorealistic age progression — child to adult | FaceApp, AgePro | [Demo](https://ai-kid-to-adult-prediction.vercel.app/) |
| [AI Pet Portrait](https://github.com/SamurAIGPT/ai-pet-portrait) | Transform pet photos into paintings, royal portraits, and art | Portrait My Pet | [Demo](https://ai-pet-portrait.vercel.app/) |
| [AI Travel Studio](https://github.com/SamurAIGPT/ai-travel-studio) | Place yourself into iconic travel destinations worldwide | Teleport AI | [Demo](https://ai-travel-studio.vercel.app/) |
| [AI Fitness Simulator](https://github.com/SamurAIGPT/ai-fitness-body-simulator) | Visualize body transformation goals with AI | BodyApp AI | [Demo](https://ai-fitness-body-simulator.vercel.app/) |

---

## ✍️ Writing & Content

| Template | Description | Free Alternative To | Demo |
|---|---|---|---|
| [Blogger CMS](https://github.com/SamurAIGPT/blogger-cms) | AI blog writer with WYSIWYG editor and full SEO suite | Jasper, Copy.ai, Surfer SEO | [Demo](https://blogger-cms-psi.vercel.app/) |
| [Social Post AI](https://github.com/SamurAIGPT/social-post) | Generate posts for LinkedIn, Twitter/X, Instagram, Reddit | Buffer AI, Hootsuite OwlyWriter | [Demo](https://social-post-woad.vercel.app/) |
| [Prompt Architect](https://github.com/SamurAIGPT/prompt-architect) | Engineer and refine AI prompts for ChatGPT, Claude, Midjourney | PromptBase, PromptPerfect | [Demo](https://prompt-architect-one-nu.vercel.app/) |
| [AI Resume Builder](https://github.com/SamurAIGPT/ai-resume-builder) | ATS-optimized resumes with PDF/Word export | Teal, Kickresume, Rezi | [Demo](https://ai-resume-builder.vercel.app/) |
| [Mail-Wise](https://github.com/SamurAIGPT/mail-wise) | AI cold email and business email composer | Lavender AI, Reply.io | [Demo](https://mail-wise-khaki.vercel.app/) |
| [GEO Checker](https://github.com/SamurAIGPT/geo-checker) | Audit landing page AI search visibility for ChatGPT, Perplexity, Gemini | SEMrush, Surfer SEO | [Demo](https://geo-checker.vercel.app/) |

---

## 🤖 AI Agents & Chatbots

| Template | Description | Free Alternative To | Demo |
|---|---|---|---|
| [KnowBase AI](https://github.com/SamurAIGPT/ai-knowledge-base) | RAG chatbot builder trained on your docs, URLs, and Q&A | Chatbase, Botpress, SiteGPT | [Demo](https://ai-knowledge-base-six.vercel.app/) |
| [CardAI Creator](https://github.com/SamurAIGPT/ai-business-card) | Digital business cards with embedded AI visitor chatbot | Popl, HiHello, Linq | [Demo](https://ai-business-card-ten.vercel.app/) |
| [AI Character Studio](https://github.com/SamurAIGPT/ai-character-studio) | Generate AI character portraits and roleplay chat with them | Character.ai, Replika | [Demo](https://ai-character-studio-beta.vercel.app/) |
| [Open Character AI](https://github.com/Anil-matcha/open-character-ai) | Self-hosted character roleplay chatbot — build custom AI personas with per-chat LLM tuning | Character.AI, Replika | — |

---

## 🎵 Audio & Voice

| Template | Description | Free Alternative To | Demo |
|---|---|---|---|
| [My Podcast Studio](https://github.com/SamurAIGPT/my-podcast) | AI voiceover and podcast narration with MiniMax Speech 2.6 | ElevenLabs, Murf AI, Play.ht | [Demo](https://my-podcast.vercel.app/) |
| [AI Voice Agent](https://github.com/Anil-matcha/AI-Voice-Agent) | Self-hosted AI voice agent with speech-to-speech conversation | Bland.ai, Vapi, Retell AI | — |

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

Every SaaS template in this catalog is built on the same production-ready foundation:

```
Next.js 14 (App Router)  ·  Prisma ORM  ·  PostgreSQL (Supabase / Neon)
NextAuth (Google OAuth)  ·  Stripe Checkout + Webhooks  ·  Tailwind CSS
Vercel deployment
```

The base template (no AI logic, just auth + billing + webhooks) is available at:
**[github.com/SamurAIGPT/ai-saas-starter](https://github.com/SamurAIGPT/ai-saas-starter)**

---

## 📄 License

MIT Licensed. Fork it, ship it, sell it.
