# Open-Poe-AI

Open-source, self-hosted alternative to [Poe AI](https://poe.com) — chat with multiple large language models from a single interface, on your own infrastructure.

Poe (by Quora) is a hosted aggregator that puts GPT, Claude, Gemini, Grok, DeepSeek, Llama, Mistral and image/video models behind one chat UI. **Open-Poe-AI** is the self-hosted version: bring your own API keys, run it on your own server, and keep full control of prompts, conversations, and data.

## Features

- **Multi-model chat** — unified interface for OpenAI, Anthropic, Google, Mistral, DeepSeek, xAI, Meta Llama, and any OpenAI-compatible endpoint (including local models via Ollama / vLLM / LM Studio).
- **Multi-bot conversations** — query several models in the same thread and compare answers side by side.
- **Custom bots** — build and share bots with their own system prompts, tools, and knowledge bases.
- **Group chat** — multiple users and multiple AI models in one shared conversation.
- **Multimodal** — text, image generation, vision, and audio; pluggable adapters for image/video model providers.
- **Bring your own keys** — no subscription, no rate caps beyond the providers you use.
- **Self-hosted** — Docker Compose for one-command deploy; works on a laptop, VPS, or Kubernetes.
- **Open protocol** — bot server API so anyone can host their own bot and plug it in.

## Status

Early work in progress. Contributions welcome.

## Quick start

```bash
git clone https://github.com/Anil-matcha/Open-Poe-AI.git
cd Open-Poe-AI
cp .env.example .env   # add your provider API keys
docker compose up -d
```

Then open http://localhost:3000.

## License

MIT
