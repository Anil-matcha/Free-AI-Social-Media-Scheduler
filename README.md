# 🌌 OpenSpaces

> An open-source, self-hostable **Open Spaces** collaborative AI workspace built with Next.js (App Router, JavaScript), Tailwind CSS v4, FastAPI, Supabase PostgreSQL, and native **MuAPI** model intelligence.

OpenSpaces bridges the gap between static documents and collaborative intelligence. It provides persistent shared workspaces where human teams, living editable **Pages (Canvas)**, autonomous **Dot Agents**, and inline **AI Generators** collaborate in real-time.

---

## 🎥 Walkthrough & Demo

https://github.com/user-attachments/assets/3823b656-c8c2-4912-9b31-6db7f438dd2c

---

## 🌟 Key Features & Updates

### 1. 🧠 Comprehensive Multimodal Model Intelligence (53 Models Across 6 Families)
OpenSpaces supports 53 frontier and uncensored multimodal models via native MuAPI streaming endpoints (`POST /api/v1/{model}/stream`). Every model accepts `prompt`, `system_prompt`, and `image_url`:
- **🔓 Abliterated / Low-Refusal / Uncensored (12 Models)**: `mimo-v2-6-flash-abliterated`, `abliterated-model`, `qwen-3-8-27b-obliterated`, `qwen-3-8-27b-abliterated`, `qwen-3-5-27b-queen-derestricted`, `qwen-3-5-27b-blossom-derestricted`, `qwen-3-5-27b-opus-distilled-derestricted`, `glm-5-3-flash-abliterated`, `gemma-4-31b-gembrain-abliterated`, `gemma-4-31b-sdft-abliterated`, `qwen-3-8-27b-queen`, `qwen-3-8-27b-fable`.
- **⚡ OpenAI GPT Family (8 Models)**: `gpt-5-nano`, `gpt-5-2`, `gpt-5-5`, `gpt-5-6-luna`, `gpt-5-6-terra`, `gpt-5-6-sol`, `gpt-6-astra`, `gpt-6-1-sol`.
- **🎭 Anthropic Claude Family (13 Models)**: `claude-haiku-4-5`, `claude-sonnet-4-5`, `claude-sonnet-4-6`, `claude-sonnet-5`, `claude-sonnet-5-5`, `claude-opus-4-5`, `claude-opus-4-6`, `claude-opus-4-7`, `claude-opus-4-8`, `claude-opus-5`, `claude-opus-5-5`, `claude-fable-5`, `claude-fable-5-1`.
- **🌐 Google Gemini Family (12 Models)**: `gemini-2-5-flash`, `gemini-2-5-pro`, `gemini-3-flash`, `gemini-3-pro`, `gemini-3-1-pro`, `gemini-3-5-flash`, `gemini-3-5-flash-openai`, `gemini-3-6-flash`, `gemini-3-6-flash-openai`, `gemini-3-7-flash`, `gemini-3-7-flash-openai`, `gemini-3-8-flash`.
- **🚀 xAI Grok Family (4 Models)**: `grok-4-3`, `grok-4-5`, `grok-4-6`, `grok-4-7`.
- **🌙 Moonshot Kimi & DeepSeek Family (4 Models)**: `kimi-k3`, `deepseek-v4-flash`, `deepseek-v4-1-flash`, `deepseek-v4-pro`.

### 2. 💬 Clean Prompt & History Architecture
- **Isolated User Prompt**: The `prompt` parameter receives strictly the current user prompt.
- **Contextual System Prompt**: Base system instructions plus the last 10 messages of conversation history are formatted and passed via `system_prompt`, maintaining clean token budgeting and model coherence.

### 3. 📎 Native Media Upload & Hosted CDN Pipeline (`/api/upload_file`)
- **Direct MuAPI File Proxy**: Backend endpoint `POST /api/upload_file` receives multipart uploads, forwards them to `https://api.muapi.ai/api/v1/upload_file`, and returns persistent CDN links (`https://cdn.muapi.ai/...`).
- **No Blob Leaks**: Frontend uploads files immediately upon selection, displays a local thumbnail preview with a removal button, and enforces that only verified public CDN URLs are dispatched to AI models.
- **Send Guard**: The send button is disabled while an upload is in progress to prevent sending prematurely.

### 4. 🎨 Open Spaces Native UI & Interaction Design
- **Input Card Layout**: Floating, rounded card design with embedded auto-resizing textarea, paperclip attachment button, and dynamic send pill button.
- **Custom Model Selector Dropdown**: Custom dropdown showcasing model icons, titles, and capability tags (`Fast & Capable`, `Deep Reasoning`, `Balanced`, `Ultra Light`).
- **Workspace Navigation & Sidebar**: Space switching, search, and page grouping matching modern Open Spaces.

### 5. 📜 Living Document Versioning & Collaboration
- **Revision History Drawer**: Version history tracking page revisions with one-click restore and timestamps.
- **Space Members & Permissions**: Modal to manage space members, roles (`Owner`, `Admin`, `Member`, `Viewer`), and invite links.
- **Space Activity Logs**: Real-time auditing of document edits, agent executions, and membership updates.
- **Dual Storage Persistence**: In-memory store with automated fallback to Supabase PostgreSQL for seamless local development and production persistence.

### 6. ✍️ OpenDots Living Document Canvas (TipTap)
- **Rich Document Editor**: Powered by TipTap, supporting Markdown, multi-level headings, tables, task lists, and custom code blocks.
- **Slash Commands Menu (`/`)**: Compact keyboard-first menu to insert blocks, lists, and AI generators on the fly.
- **Inline AI Writing Assistant**: Context-aware in-place generation gathering surrounding document context with shimmering skeleton loader.
- **AI Image Generation**: Inline `/` -> **🖼️ Generate Image** powered by `gpt-image-2-text-to-image` with aspect ratio controls and smart prompt suggestion.

### 7. 🔒 Security & Key Isolation
- **Zero API Key Leakage**: API keys reside strictly on the backend (`server/.env`).
- **Dynamic Environment Loading**: Backend dynamically loads keys using `load_dotenv(override=True)` and `os.getenv("MUAPI_API_KEY")`.
- **Zero Client Footprint**: No sensitive credentials are ever embedded in frontend bundles or client network requests.

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
│   │       ├── CanvasPage.js    # Living canvas page with revision history drawer & source mode
│   │       ├── OpenSpacesApp.js # Primary router, space switcher, and state management
│   │       ├── OpenSpacesSidebar.js # Persistent conversation history & search sidebar
│   │       ├── HomeWorkView.js  # Open Spaces card input, attachment preview & GPT-6 selector
│   │       ├── CustomDropdown.js# Custom accessible dropdown with capability tags
│   │       ├── SpaceSidebar.js  # Spaces navigation, search, and space management
│   │       ├── SpaceLibrary.js  # Living pages library & document browser
│   │       ├── SpaceChat.js     # Space chat with agent mentions & living page citations
│   │       ├── ChatDrawer.js    # Slide-out assistant chat drawer with multi-turn memory
│   │       └── editor/          # TipTap Rich Document Editor
│   │           ├── RichEditor.js    # TipTap editor with toolbar and slash command trigger
│   │           ├── AiPromptView.js  # Inline AI text generation node with local shimmering loader
│   │           ├── AiImageView.js   # Inline image generation node with aspect ratios & prompt helper
│   │           ├── slash-commands.js # Slash command definitions and fuzzy search
│   │           └── markdown.js      # TipTap extension registry & MarkdownManager
│   └── package.json
│
└── server/                      # Backend (FastAPI, SQLAlchemy, Supabase PostgreSQL, MuAPI Gateway)
    ├── app/
    │   ├── main.py              # FastAPI app setup, CORS, and router registration
    │   ├── core/
    │   │   ├── config.py        # Settings and environment variables
    │   │   └── auth.py          # User authentication and token helpers
    │   ├── db/
    │   │   ├── session.py       # SQLAlchemy engine with SSL pooling for Supabase
    │   │   └── models.py        # Database models (Spaces, Pages, Revisions, Activity, Members)
    │   ├── models/schemas.py    # Pydantic request/response schemas
    │   ├── services/
    │   │   └── space_store.py   # Dual-storage layer (Supabase + In-Memory Fallback)
    │   └── api/routers/
    │       ├── chat.py          # GPT-6 series chat completions router (/api/v1/{model}/stream)
    │       ├── files.py         # File & image upload router proxying to MuAPI CDN
    │       ├── images.py        # gpt-image-2 generation & prompt suggestion via MuAPI
    │       ├── spaces.py        # Spaces CRUD, members, and activity log endpoints
    │       ├── pages.py         # Living pages CRUD and revision history endpoints
    │       ├── agents.py        # Dot agent execution endpoints
    │       └── meetings.py      # Meeting audio notes & intelligence
    ├── run.py                   # Server runner on port 8000
    ├── requirements.txt
    └── .env                     # Server environment variables & MUAPI_API_KEY
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

## 🧪 Testing Endpoints

### 1. Test GPT-6 Series Chat Completions
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/chat" -Method POST `
  -ContentType "application/json" `
  -Body '{"model": "gpt-6-1-sol", "prompt": "Summarize vector search in 2 sentences"}'
```

### 2. Test Multimodal Image Analysis
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/chat" -Method POST `
  -ContentType "application/json" `
  -Body '{"model": "gpt-6-1-sol", "prompt": "Describe this image", "image_url": "https://cdn.muapi.ai/outputs/sample.png"}'
```

### 3. Test Direct Media Upload
```powershell
$form = @{ file = Get-Item "sample.jpg" }
Invoke-RestMethod -Uri "http://localhost:8000/api/upload_file" -Method POST -Form $form
```

---

- **Expanded Multimodal Model Catalog**: Added 53 models across 6 families (Abliterated/Uncensored, OpenAI GPT, Anthropic Claude, Google Gemini, xAI Grok, Moonshot Kimi & DeepSeek) with full vision support and searchable dropdown navigation.
- **System Prompt & History Refactor**: Formatted last 10 messages chat history into `system_prompt` while maintaining purely user input in `prompt`.
- **Media Upload Pipeline**: Implemented `POST /api/upload_file` forwarding to `https://api.muapi.ai/api/v1/upload_file` returning CDN URLs.
- **Open Spaces Native Input Card**: Rebuilt prompt bar with attachment preview thumbnail, remove button, and upload guard.
- **Document History & Collaboration**: Added revision history drawer, activity logging, and space membership management.
- **Tutorial & Walkthrough Video**: Embedded high-resolution demo walkthrough highlighting Open Spaces UI, living canvas, and model integration.
- **API Key Security**: Purged all hardcoded keys and enforced dynamic `.env` loading.
