# OpenSpaces Client

Modern frontend application for OpenSpaces, built with **Next.js 16 (App Router)**, **Tailwind CSS v4**, and **TipTap**.

## Features Included

- **OpenDots Living Document Editor**: TipTap powered rich document canvas with full Markdown round-tripping.
- **Slash Commands Menu (`/`)**: Keyboard-first insertion menu for blocks, headings, lists, tables, and AI tools.
- **Inline AI Writing Assistant (`AiPromptView.js`)**: Context-aware document section writer with in-place shimmering loader.
- **Inline Image Generation (`AiImageView.js`)**: High-res image generation via MuAPI `gpt-image-2-text-to-image` with aspect ratio options and smart prompt suggestions.
- **Spaces & Discussion**: Multi-workspace sidebar, discussion threads with agent mentions, and meeting transcription intelligence.
- **Theme Support**: Seamless Light and Dark mode using `next-themes`.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Build

```bash
npm run build
```
