# 🌌 OpenSpaces

> An open-source, self-hostable **ChatGPT Spaces** alternative built with Next.js (App Router, JavaScript), Tailwind CSS v4, FastAPI, Supabase PostgreSQL, and native **MuAPI** model intelligence.

OpenSpaces bridges the gap between static documents and collaborative intelligence. It provides persistent shared workspaces where human teams, living editable **Pages (Canvas)**, autonomous **Dot Agents**, and inline **AI Generators** collaborate in real-time.

---

## 🌟 Key Features

### 1. ✍️ OpenDots Living Document Canvas (TipTap)
- **Rich Document Editor**: Powered by TipTap, supporting standard Markdown, multi-level headings, tables, task lists, blockquotes, and custom code blocks.
- **Slash Commands Menu (`/`)**: Compact, keyboard-first menu to insert blocks, lists, formatting, and AI generators on the fly.
- **Insert Menu Toolbar**: Dropdown in the format toolbar to easily add tables, task lists, code blocks, dividers, and AI nodes.
- **Seamless Markdown Round-Tripping**: Synchronized with `@tiptap/markdown` for source editing and persistent storage.

### 2. 🤖 Inline AI Writing Assistant
- **Context-Aware In-Place Generation**: Triggered via `/` -> **✨ AI Assistant (Context Prompt)**.
- **Surrounding Context Injection**: Gathers full-document metadata, title, and immediate before-and-after paragraph context to ensure perfect stylistic and structural continuity.
- **In-Place Shimmering Skeleton Loader**: Displays a shimmering progress skeleton directly at the cursor insertion point while generating.
- **Seamless Inline Replacement**: Replaces only that exact position with formatted Markdown without disturbing surrounding content.

### 3. 🖼️ AI Image Generation (`gpt-image-2-text-to-image`)
- **Native MuAPI Image Generation**: Triggered via `/` -> **🖼️ Generate Image** or the `+ Insert` dropdown.
- **Aspect Ratio Control**: Select from `1:1` (Square), `16:9` (Widescreen), or `4:3` (Editorial).
- **✨ Use Page Content (Smart Prompting)**: Automatically analyzes surrounding section context and calls MuAPI's text model to suggest an optimal, vivid image prompt.
- **Style Quick Chips**: One-click prompt modifiers (*Concept illustration*, *Architecture / Tech*, *Minimalist banner*).
- **Unbounded Polling**: Polling loop without premature timeouts that monitors task progress until completed or failed, then automatically embeds the high-resolution image into the document with responsive styling.

### 4. 🧠 Exclusively Powered by MuAPI Models
- **Text & Chat Intelligence**: Fast, high-capacity completions powered by `mimo-v2-6-flash-abliterated` and `glm-5-3-flash-abliterated`.
- **Image Generation**: Powered by `gpt-image-2-text-to-image`.
- **Zero Gemini Footprint**: Completely migrated away from Gemini models and endpoints.
- **Secure Architecture**: API keys reside strictly on the backend (`server/.env`) and are never exposed to client bundles or browser network tabs.

### 5. 👥 Persistent Team Spaces & Autonomous Dot Agents
- **Multi-Workspace Organization**: Organize projects, research, and roadmaps in dedicated team spaces.
- **Autonomous Dot Agents**: Specialized workers (*Synthesizer Dot*, *Copywriter Dot*, *Architect Dot*) to execute multi-step space directives.
- **Discussion Threads**: Multi-turn chat with direct `@Dot` mentions and living page links.
- **Meeting Audio Notes**: Audio recorder and transcript synthesizer that extracts action items directly into new living pages.
- **Supabase PostgreSQL Persistence**: Fully relational data model (`open_spaces`, `open_pages`, `open_agents`, `open_messages`, `open_meetings`) with automated migrations and seeding.

---

## 🏗️ Architecture

```
open-spaces/
├── client/                      # Frontend (Next.js 16, App Router, JavaScript, Tailwind CSS v4)
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.js        # Root layout, theme provider, and font definitions
│   │   │   ├── page.js          # Core application dashboard & state orchestration
│   │   │   └── globals.css      # Design tokens, typography & markdown body styling
│   │   └── components/
│   │       ├── CanvasPage.js    # Living canvas page with source mode and auto-save
│   │       ├── OpenSpacesApp.js # Primary router, space switcher, and layout manager
│   │       ├── Sidebar.js       # Spaces navigation, search, and DB health indicator
│   │       ├── SpaceChat.js     # Space chat with agent mentions & living page citations
│   │       └── editor/          # TipTap Rich Document Editor
│   │           ├── RichEditor.js    # TipTap editor with toolbar and slash command trigger
│   │           ├── AiPromptView.js  # Inline AI text generation node with local shimmering loader
│   │           ├── AiImageView.js   # Inline image generation node with aspect ratios & prompt helper
│   │           ├── slash-commands.js # Slash command definitions and fuzzy search
│   │           ├── markdown.js      # TipTap extension registry & MarkdownManager
│   │           └── editor.css       # Editor toolbar, menus, popups, and image styles
│   └── package.json
│
└── server/                      # Backend (FastAPI, SQLAlchemy, Supabase PostgreSQL, MuAPI Gateway)
    ├── app/
    │   ├── main.py              # FastAPI app setup, CORS, and WebSocket router
    │   ├── core/config.py       # Configuration and MuAPI environment variables
    │   ├── db/
    │   │   ├── session.py       # SQLAlchemy engine with SSL pooling for Supabase
    │   │   └── models.py        # Database schema definitions
    │   ├── models/schemas.py    # Pydantic request/response schemas
    │   └── api/routers/
    │       ├── chat.py          # Chat completions router powered by MuAPI text models
    │       ├── images.py        # gpt-image-2 generation & prompt suggestion via MuAPI
    │       ├── spaces.py        # Spaces CRUD & chat endpoints
    │       ├── pages.py         # Living pages CRUD endpoints
    │       ├── agents.py        # Dot agent execution endpoints
    │       └── meetings.py      # Meeting audio notes & intelligence
    ├── run.py                   # Server runner on port 8000
    ├── requirements.txt
    └── .env                     # Server environment variables & MuAPI key
```

---

## ⚙️ Configuration (`server/.env`)

Configure your environment variables in `server/.env`:

```env
PORT=8000
HOST=0.0.0.0
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Supabase PostgreSQL Configuration
DATABASE_URL=postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:6543/postgres

# MuAPI Configuration
DEFAULT_MODEL=mimo-v2-6-flash-abliterated
MUAPI_API_KEY=your_muapi_api_key_here
```

---

## 🚀 Running the Project

### 1. Start Backend (Port 8000)

```powershell
cd server
python run.py
```
- API live at: `http://localhost:8000`
- Interactive Swagger documentation: `http://localhost:8000/docs`

### 2. Start Frontend (Port 3000)

```powershell
cd client
npm run dev
```
- Frontend live at: `http://localhost:3000`

---

## 🧪 Testing MuAPI Endpoints

### Test Text / Chat Completions
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/chat" -Method POST `
  -ContentType "application/json" `
  -Body '{"prompt": "Summarize vector search in 2 sentences"}'
```

### Test Context-Aware Image Prompt Suggestion
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/images/suggest-prompt" -Method POST `
  -ContentType "application/json" `
  -Body '{"context": "Deep learning transformer attention mechanisms", "title": "AI Architectures"}'
```

### Test Image Generation (Polls MuAPI until Completed)
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/images/generate" -Method POST `
  -ContentType "application/json" `
  -Body '{"prompt": "A modern glass architecture building at dusk, 8k", "aspect_ratio": "16:9"}'
```
