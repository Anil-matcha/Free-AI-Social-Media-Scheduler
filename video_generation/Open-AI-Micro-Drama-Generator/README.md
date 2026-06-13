<div align="center">

<h1 align="center">MicroDrama AI</h1>
<h3 align="center">Agentic AI Micro-Drama Video Generator</h3>

<p align="center">
  <img src="https://img.shields.io/badge/🐍Python-3.10+-00d9ff?style=for-the-badge&logo=python&logoColor=white&labelColor=1a1a2e">
  <img src="https://img.shields.io/badge/⚡Next.js-14-ff6b6b?style=for-the-badge&logo=next.js&logoColor=white&labelColor=1a1a2e">
  <img src="https://img.shields.io/badge/License-MIT-4ecdc4?style=for-the-badge&logo=opensourceinitiative&logoColor=white&labelColor=1a1a2e">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/MuAPI-Powered-7c3aed?style=for-the-badge&logoColor=white&labelColor=1a1a2e">
  <img src="https://img.shields.io/badge/One_Key-Setup-FFC107?style=for-the-badge&logoColor=white&labelColor=1a1a2e">
</p>

</div>

---

### 🚨 The problem with AI video today:
- ❌ **Manual, fragmented workflow** — Separate tools needed for scripting, image gen, and video gen
- ❌ **No narrative structure** — Raw T2V models don't understand story arcs or scene continuity
- ❌ **Character inconsistency** — Characters look different in every shot
- ❌ **Visual-only** — Missing scripts, narrative depth, and cinematic storytelling

### 💡 MicroDrama AI Solution:
🎬 **Screenwriter**, **Storyboard Artist**, **Frame Generator**, and **Video Producer** — all in one automated pipeline.

Type an idea. MicroDrama AI autonomously handles everything: story development, character design, shot-by-shot storyboarding, frame generation, and video clip production — then stitches it all into a complete cinematic micro-drama. Powered entirely by a single MuAPI key.

---

<p align="center">
  <a href="https://github.com/Anil-matcha/awesome-generative-ai-apps">
    <img src="https://img.shields.io/badge/Part%20of-Awesome%20Generative%20AI%20Apps-FFD700?style=for-the-badge&logo=github&logoColor=black" alt="Awesome Generative AI Apps">
  </a>
</p>

> 🎨 **[Explore 50+ more open-source AI apps →](https://github.com/Anil-matcha/awesome-generative-ai-apps)**

## Related Projects

- [AI-Youtube-Shorts-Generator](https://github.com/SamurAIGPT/AI-Youtube-Shorts-Generator) — Auto-clip and crop your AI dramas into viral YouTube Shorts
- [Clip-Anything](https://github.com/SamurAIGPT/Clip-Anything) — Clip any moment from your AI drama with text prompts
- [AI-Faceless-Video-Generator](https://github.com/SamurAIGPT/AI-Faceless-Video-Generator) — Generate faceless AI videos for your drama channel

## 🎥 Demo Video

https://github.com/user-attachments/assets/f8b5d09c-8c58-40c1-b171-e3f42b0d71a8

Watch MicroDrama AI transform ideas into fully cinematic micro-drama videos using autonomous AI agents, character-consistent image generation, storyboarding, and MuAPI-powered video creation.

---



## 📑 Table of Contents

- [💡 Key Features](#-key-features)
- [🏗️ Architecture](#%EF%B8%8F-architecture)
- [🔄 Pipeline Stages](#-pipeline-stages)
- [🚀 Quick Start](#-quick-start)
- [🛠️ Project Structure](#%EF%B8%8F-project-structure)
- [🌐 API Reference](#-api-reference)
- [⚙️ Configuration](#%EF%B8%8F-configuration)
- [🖥️ UI Overview](#%EF%B8%8F-ui-overview)

---

## 💡 Key Features

<table align="center" width="100%">
<tr>
<td width="25%" align="center" valign="top" style="padding: 20px;">

### 🎭 Idea to Video
**From Spark to Screen**

Transform a raw idea into a complete micro-drama. The AI develops the story, writes scene scripts, designs the storyboard, and generates the full video — zero manual steps.

</td>
<td width="25%" align="center" valign="top" style="padding: 20px;">

### 📝 Script to Video
**Bring Your Script to Life**

Already have a scene script? Skip the writing phase and let MicroDrama AI handle storyboarding, character portraits, frame generation, and video production.

</td>
<td width="25%" align="center" valign="top" style="padding: 20px;">

### 🎨 Character Consistency
**Coherent Visual Identity**

Characters are extracted with detailed static and dynamic features. Reference portraits are generated and used to keep characters visually consistent across every shot.

</td>
<td width="25%" align="center" valign="top" style="padding: 20px;">

### 📡 Real-time Progress
**Live Pipeline Visibility**

Watch every stage of the pipeline in real time via SSE streaming — from story development through to the final concatenated video, with a live animated stage timeline.

</td>
</tr>
</table>

---

## 🏗️ Architecture

```
                   ┌──────────────────────────────────────────────────────────┐
                   │                MicroDrama AI Server                      │
  Idea / Script ─► │                                                          │
                   │  ┌────────────────────────────────────────────────────┐  │
                   │  │              Screenwriter Agent                     │  │
                   │  │  develop_story()  → write_script_based_on_story()  │  │
                   │  └──────────────────────────┬─────────────────────────┘  │
                   │                             │ story + scene scripts       │
                   │  ┌──────────────────────────▼─────────────────────────┐  │
                   │  │           Character Extractor Agent                 │  │
                   │  │      extract_characters(script) → List[char]       │  │
                   │  └──────────────────────────┬─────────────────────────┘  │
                   │                             │ characters[]               │
                   │  ┌──────────────────────────▼─────────────────────────┐  │
                   │  │           Storyboard Artist Agent                   │  │
                   │  │  design_storyboard() → List[ShotBriefDescription]  │  │
                   │  └──────────────────────────┬─────────────────────────┘  │
                   │                             │ shots[]                    │
                   │  ┌──────────────────────────▼─────────────────────────┐  │
                   │  │                  MuAPI Tools                        │  │
                   │  │  ① Portrait Gen  →  flux-dev-image  (T2I)          │  │
                   │  │  ② Frame Gen     →  flux-kontext-dev-i2i  (I2I)    │  │
                   │  │  ③ Video Gen     →  kling-v2.1-standard-i2v  (I2V) │  │
                   │  └──────────────────────────┬─────────────────────────┘  │
                   │                             │ video clips                │
                   │  ┌──────────────────────────▼─────────────────────────┐  │
                   │  │                moviepy Concat                       │  │
                   │  └──────────────────────────┬─────────────────────────┘  │
                   └────────────────────────────-┼──────────────────────────--┘
                                                 │
                                        final_video.mp4
```

All LLM calls (story, characters, storyboard) go through MuAPI's `/claude-sonnet-4-6` endpoint.
**Only one API key is required for the entire pipeline.**

---

## 🔄 Pipeline Stages

### Idea to Video — Full Pipeline

| # | Stage | Agent / Tool | Output |
|---|-------|-------------|--------|
| 1 | **Story Development** | Screenwriter (MuAPI LLM) | Story outline in prose |
| 2 | **Character Extraction** | CharacterExtractor (MuAPI LLM) | Characters with static + dynamic visual features |
| 3 | **Scene Scripting** | Screenwriter (MuAPI LLM) | 2–4 individual scene scripts |
| 4 | **Character Portraits** | MuAPI `flux-dev-image` (T2I) | Reference portrait per character — runs in parallel |
| 5 | **Storyboard Design** | StoryboardArtist (MuAPI LLM) | 3–5 shots per scene: visual + motion + audio desc |
| 6 | **Frame Generation** | MuAPI `flux-kontext-dev-i2i` (I2I) | First frame per shot using character reference images |
| 7 | **Video Generation** | MuAPI `kling-v2.1-standard-i2v` (I2V) | 5-second video clip per shot — runs in parallel |
| 8 | **Concatenation** | moviepy | All clips joined into `final_video.mp4` |

### Script to Video — Short Pipeline

Skips stages 1–3. Starts directly from your provided script.

| # | Stage | Agent / Tool | Output |
|---|-------|-------------|--------|
| 1 | **Character Extraction** | CharacterExtractor (MuAPI LLM) | Characters with visual descriptions |
| 2 | **Character Portraits** | MuAPI `flux-dev-image` (T2I) | Reference portrait per character |
| 3 | **Storyboard Design** | StoryboardArtist (MuAPI LLM) | Shots from your script |
| 4 | **Frame Generation** | MuAPI `flux-kontext-dev-i2i` (I2I) | First frame per shot |
| 5 | **Video Generation** | MuAPI `kling-v2.1-standard-i2v` (I2V) | 5-second video per shot |
| 6 | **Concatenation** | moviepy | Final scene video |

---

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- A [MuAPI](https://muapi.ai) API key

### 1. Clone the repo

```bash
git clone https://github.com/Anil-matcha/Open-AI-Micro-Drama-Generator.git
cd Open-AI-Micro-Drama-Generator
```

### 2. Set up the server

```bash
cd server
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Open .env and set MUAPI_KEY=your_key_here
```

### 3. Start the server

```bash
uvicorn api:app --reload --port 8000
```

API available at `http://localhost:8000`. Health check: `GET /api/health`.

### 4. Set up and start the client

```bash
cd client
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Generate your first micro-drama

1. Enter an idea — e.g. *"A detective chases a shadow through a neon-lit cyberpunk city"*
2. Optionally add requirements — e.g. *"Keep it under 3 scenes, suitable for all ages"*
3. Pick a visual style: **Cinematic**, Realistic, Anime, Fantasy, or Documentary
4. Click **Generate Video** and watch the pipeline run in real time
5. Download your finished micro-drama when it completes

---

## 🛠️ Project Structure

```
Open-AI-Micro-Drama-Generator/
│
├── server/                           # FastAPI backend
│   ├── api.py                        # App entry point, endpoints, SSE job runner
│   ├── requirements.txt
│   ├── .env.example
│   │
│   ├── agents/                       # LLM-powered AI agents (all via MuAPI)
│   │   ├── screenwriter.py           # develop_story() + write_script_based_on_story()
│   │   ├── character_extractor.py    # extract_characters() → List[CharacterInScene]
│   │   └── storyboard_artist.py      # design_storyboard() → List[ShotBriefDescription]
│   │
│   ├── interfaces/                   # Pydantic data models
│   │   ├── character.py              # CharacterInScene (idx, name, static/dynamic features)
│   │   └── shot.py                   # ShotBriefDescription, ShotDescription
│   │
│   ├── tools/                        # MuAPI integration layer
│   │   ├── muapi_llm.py              # MuAPILLM — submit + poll LLM completions
│   │   ├── muapi_image_generator.py  # T2I (flux-dev) + I2I (flux-kontext) image gen
│   │   ├── muapi_video_generator.py  # I2V (kling-v2.1) video gen with polling
│   │   └── muapi_uploader.py         # Upload local images to MuAPI for URL references
│   │
│   ├── pipelines/                    # Orchestration logic
│   │   ├── idea2video.py             # Full end-to-end pipeline
│   │   └── script2video.py           # Scene-level pipeline (portraits → storyboard → video)
│   │
│   └── utils/
│       └── video.py                  # moviepy concatenation helper
│
└── client/                           # Next.js 14 frontend
    ├── next.config.js                # Rewrites /api/* and /outputs/* → FastAPI server
    ├── package.json
    ├── tailwind.config.js
    │
    ├── app/
    │   ├── layout.js                 # Root layout + metadata
    │   ├── globals.css               # Global styles + gradient utilities
    │   ├── page.js                   # Landing page: hero + generation form
    │   └── generate/[jobId]/
    │       └── page.js               # SSE consumer: pipeline progress + result viewer
    │
    └── components/
        ├── IdeaForm.js               # Idea/script input, style picker, mode toggle
        ├── PipelineProgress.js       # Animated 7-stage timeline + live scrolling log
        └── VideoResult.js            # Video player with download + open controls
```

---

## 🌐 API Reference

### `POST /api/generate` — Start a generation job

**Request body:**

```json
{
  "idea": "A lone astronaut discovers alien ruins on Europa",
  "user_requirement": "Keep it under 3 scenes, suitable for all ages",
  "style": "Cinematic",
  "mode": "idea2video"
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `idea` | string | required | The creative idea or concept |
| `user_requirement` | string | `""` | Optional constraints (audience, length, tone) |
| `style` | string | `"Cinematic"` | Visual style: Cinematic, Realistic, Anime, Fantasy, Documentary |
| `mode` | string | `"idea2video"` | `"idea2video"` or `"script2video"` |
| `script` | string | `""` | Scene script (only used when `mode = "script2video"`) |

**Response:**
```json
{ "job_id": "550e8400-e29b-41d4-a716-446655440000" }
```

---

### `GET /api/status/{job_id}` — Stream progress (SSE)

```http
GET /api/status/550e8400-...
Accept: text/event-stream
```

SSE event stream. Reconnect-safe — replays all past events on reconnect.

**Progress event:**
```json
{"type": "progress", "stage": "screenwriter", "message": "Developing story...", "progress": 10}
```

**Completion event:**
```json
{"type": "complete", "video_url": "/outputs/job_id/final_video.mp4", "progress": 100}
```

**Error event:**
```json
{"type": "error", "message": "MuAPI image job failed: quota exceeded", "progress": -1}
```

**Pipeline stages in order:** `screenwriter` → `characters` → `storyboard` → `portraits` → `frames` → `video` → `concat`

---

### `GET /api/result/{job_id}` — Get job result

```json
{
  "job_id": "550e8400-...",
  "status": "completed",
  "video_url": "/outputs/550e8400-.../final_video.mp4",
  "error": null
}
```

**Status values:** `running` | `completed` | `failed`

---

### `GET /api/health` — Health check

```json
{ "status": "ok", "service": "microdrama-api" }
```

---

## ⚙️ Configuration

### Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MUAPI_KEY` | ✅ | MuAPI API key — used for LLM, image, and video generation |

One key. That's it.

### MuAPI endpoints used internally

| Purpose | Endpoint | Model |
|---------|----------|-------|
| LLM completions | `POST /claude-sonnet-4-6` | claude-sonnet-4-6 |
| Character portraits (T2I) | `POST /flux-dev-image` | FLUX.1-dev |
| Shot frames (I2I + character ref) | `POST /flux-kontext-dev-i2i` | FLUX.1-Kontext-dev |
| Video clips (I2V) | `POST /kling-v2.1-standard-i2v` | Kling v2.1 Standard |
| File upload | `POST /upload_file` | — |
| Job polling | `GET /predictions/{id}/result` | — |

All jobs follow the same async pattern: submit → get `request_id` → poll every 3 s → return on `"completed"`.

---

## 🖥️ UI Overview

### Landing page (`/`)
- Dark cinematic design with animated radial glow background
- Feature pills: Screenwriter Agent · Storyboard Artist · Frame Generator · Video Generator
- Idea textarea, optional requirements field
- Style picker: Cinematic · Realistic · Anime · Fantasy · Documentary
- Mode toggle: Idea to Video / Script to Video

### Generation page (`/generate/[jobId]`)
- **7-stage animated pipeline timeline** with live status indicators
- **Progress bar** with percentage
- **Scrolling live log** showing every message emitted by the pipeline
- **Video player** with autoplay once `complete` event is received
- Download button saves `microdrama-{jobId}.mp4`
- SSE auto-reconnects if the connection drops mid-generation

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.
