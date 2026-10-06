import os
import json
import re
import httpx
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.config import settings

router = APIRouter(prefix="/chat", tags=["Open Spaces AI Chat"])

class ChatRequest(BaseModel):
    prompt: str
    model: str = "gpt-6-1-sol"
    project: Optional[str] = "General"
    system_prompt: Optional[str] = None
    history: Optional[List[Dict[str, Any]]] = []
    image_url: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    model: str
    project: Optional[str] = None

# Comprehensive catalog of all models supporting prompt, system_prompt, and image_url
# Across the 6 requested families:
# 1. Abliterated / Low-Refusal / Uncensored LLMs
# 2. OpenAI GPT Family
# 3. Anthropic Claude Family
# 4. Google Gemini Family
# 5. xAI Grok Family
# 6. Moonshot Kimi & DeepSeek Family
SUPPORTED_MODELS: Dict[str, Dict[str, str]] = {
    # --- 1. Abliterated / Low-Refusal / Uncensored LLMs ---
    "mimo-v2-6-flash-abliterated": {
        "name": "MiMo V2.6 Flash Abliterated",
        "family": "Abliterated / Uncensored",
        "tag": "Vision & Fast",
        "icon": "🔓",
    },
    "abliterated-model": {
        "name": "Abliterated Model Base",
        "family": "Abliterated / Uncensored",
        "tag": "Vision & Uncensored",
        "icon": "🔓",
    },
    "qwen-3-8-27b-obliterated": {
        "name": "Qwen 3.8 27B Obliterated",
        "family": "Abliterated / Uncensored",
        "tag": "Vision & Reasoning",
        "icon": "🔥",
    },
    "qwen-3-8-27b-abliterated": {
        "name": "Qwen 3.8 27B Abliterated",
        "family": "Abliterated / Uncensored",
        "tag": "Vision & Low Refusal",
        "icon": "🔥",
    },
    "qwen-3-5-27b-queen-derestricted": {
        "name": "Qwen 3.5 27B Queen Derestricted",
        "family": "Abliterated / Uncensored",
        "tag": "Vision & 262k ctx",
        "icon": "👑",
    },
    "qwen-3-5-27b-blossom-derestricted": {
        "name": "Qwen 3.5 27B Blossom Derestricted",
        "family": "Abliterated / Uncensored",
        "tag": "Vision & 262k ctx",
        "icon": "🌸",
    },
    "qwen-3-5-27b-opus-distilled-derestricted": {
        "name": "Qwen 3.5 27B Opus-Distilled Derestricted",
        "family": "Abliterated / Uncensored",
        "tag": "Vision & 262k ctx",
        "icon": "⚡",
    },
    "glm-5-3-flash-abliterated": {
        "name": "GLM 5.3 Flash Abliterated",
        "family": "Abliterated / Uncensored",
        "tag": "Vision & Fast",
        "icon": "⚡",
    },
    "gemma-4-31b-gembrain-abliterated": {
        "name": "Gemma 4 31B Gembrain Abliterated",
        "family": "Abliterated / Uncensored",
        "tag": "Vision & Creative",
        "icon": "💎",
    },
    "gemma-4-31b-sdft-abliterated": {
        "name": "Gemma 4 31B SDFT Abliterated",
        "family": "Abliterated / Uncensored",
        "tag": "Vision & 262k ctx",
        "icon": "💎",
    },
    "qwen-3-8-27b-queen": {
        "name": "Qwen 3.8 27B Queen",
        "family": "Abliterated / Uncensored",
        "tag": "Vision & 524k ctx",
        "icon": "👑",
    },
    "qwen-3-8-27b-fable": {
        "name": "Qwen 3.8 27B Fable",
        "family": "Abliterated / Uncensored",
        "tag": "Vision & Storytelling",
        "icon": "📖",
    },

    # --- 2. OpenAI GPT Family ---
    "gpt-5-nano": {
        "name": "GPT-5 Nano",
        "family": "OpenAI GPT",
        "tag": "High-Speed Vision",
        "icon": "⚡",
    },
    "gpt-5-2": {
        "name": "GPT-5.2",
        "family": "OpenAI GPT",
        "tag": "General Purpose",
        "icon": "✨",
    },
    "gpt-5-5": {
        "name": "GPT-5.5",
        "family": "OpenAI GPT",
        "tag": "Advanced Reasoning",
        "icon": "🧠",
    },
    "gpt-5-6-luna": {
        "name": "GPT-5.6 Luna",
        "family": "OpenAI GPT",
        "tag": "High-Efficiency",
        "icon": "🌙",
    },
    "gpt-5-6-terra": {
        "name": "GPT-5.6 Terra",
        "family": "OpenAI GPT",
        "tag": "Balanced",
        "icon": "🌍",
    },
    "gpt-5-6-sol": {
        "name": "GPT-5.6 Sol",
        "family": "OpenAI GPT",
        "tag": "Flagship",
        "icon": "☀️",
    },
    "gpt-6-astra": {
        "name": "GPT-6 Astra",
        "family": "OpenAI GPT",
        "tag": "Frontier Reasoning",
        "icon": "🧠",
    },
    "gpt-6-1-sol": {
        "name": "GPT-6.1 Sol Light",
        "family": "OpenAI GPT",
        "tag": "Fast & Capable",
        "icon": "⚡",
    },

    # --- 3. Anthropic Claude Family ---
    "claude-haiku-4-5": {
        "name": "Claude Haiku 4.5",
        "family": "Anthropic Claude",
        "tag": "Fast Vision",
        "icon": "⚡",
    },
    "claude-sonnet-4-5": {
        "name": "Claude Sonnet 4.5",
        "family": "Anthropic Claude",
        "tag": "Balanced",
        "icon": "🎭",
    },
    "claude-sonnet-4-6": {
        "name": "Claude Sonnet 4.6",
        "family": "Anthropic Claude",
        "tag": "Coding & Vision",
        "icon": "💻",
    },
    "claude-sonnet-5": {
        "name": "Claude Sonnet 5",
        "family": "Anthropic Claude",
        "tag": "Flagship",
        "icon": "⭐",
    },
    "claude-sonnet-5-5": {
        "name": "Claude Sonnet 5.5",
        "family": "Anthropic Claude",
        "tag": "High-Capacity",
        "icon": "🌟",
    },
    "claude-opus-4-5": {
        "name": "Claude Opus 4.5",
        "family": "Anthropic Claude",
        "tag": "Reasoning",
        "icon": "🔮",
    },
    "claude-opus-4-6": {
        "name": "Claude Opus 4.6",
        "family": "Anthropic Claude",
        "tag": "Deep Thinker",
        "icon": "🔮",
    },
    "claude-opus-4-7": {
        "name": "Claude Opus 4.7",
        "family": "Anthropic Claude",
        "tag": "Multi-Modal",
        "icon": "🔮",
    },
    "claude-opus-4-8": {
        "name": "Claude Opus 4.8",
        "family": "Anthropic Claude",
        "tag": "Long Context",
        "icon": "🔮",
    },
    "claude-opus-5": {
        "name": "Claude Opus 5",
        "family": "Anthropic Claude",
        "tag": "Premier",
        "icon": "👑",
    },
    "claude-opus-5-5": {
        "name": "Claude Opus 5.5",
        "family": "Anthropic Claude",
        "tag": "Next-Gen",
        "icon": "👑",
    },
    "claude-fable-5": {
        "name": "Claude Fable 5",
        "family": "Anthropic Claude",
        "tag": "Creative Writing",
        "icon": "📖",
    },
    "claude-fable-5-1": {
        "name": "Claude Fable 5.1",
        "family": "Anthropic Claude",
        "tag": "Long Storytelling",
        "icon": "📖",
    },

    # --- 4. Google Gemini Family ---
    "gemini-2-5-flash": {
        "name": "Gemini 2.5 Flash",
        "family": "Google Gemini",
        "tag": "Ultra-Fast",
        "icon": "⚡",
    },
    "gemini-2-5-pro": {
        "name": "Gemini 2.5 Pro",
        "family": "Google Gemini",
        "tag": "Multimodal Pro",
        "icon": "💠",
    },
    "gemini-3-flash": {
        "name": "Gemini 3 Flash",
        "family": "Google Gemini",
        "tag": "Low-Latency",
        "icon": "⚡",
    },
    "gemini-3-pro": {
        "name": "Gemini 3 Pro",
        "family": "Google Gemini",
        "tag": "Deep Analysis",
        "icon": "💠",
    },
    "gemini-3-1-pro": {
        "name": "Gemini 3.1 Pro",
        "family": "Google Gemini",
        "tag": "MoE Flagship",
        "icon": "💠",
    },
    "gemini-3-5-flash": {
        "name": "Gemini 3.5 Flash",
        "family": "Google Gemini",
        "tag": "High Speed",
        "icon": "⚡",
    },
    "gemini-3-5-flash-openai": {
        "name": "Gemini 3.5 Flash (OpenAI fmt)",
        "family": "Google Gemini",
        "tag": "OpenAI Format",
        "icon": "⚡",
    },
    "gemini-3-6-flash": {
        "name": "Gemini 3.6 Flash",
        "family": "Google Gemini",
        "tag": "Fast Vision",
        "icon": "⚡",
    },
    "gemini-3-6-flash-openai": {
        "name": "Gemini 3.6 Flash (OpenAI fmt)",
        "family": "Google Gemini",
        "tag": "OpenAI Format",
        "icon": "⚡",
    },
    "gemini-3-7-flash": {
        "name": "Gemini 3.7 Flash",
        "family": "Google Gemini",
        "tag": "Hybrid Reasoner",
        "icon": "🧠",
    },
    "gemini-3-7-flash-openai": {
        "name": "Gemini 3.7 Flash (OpenAI fmt)",
        "family": "Google Gemini",
        "tag": "OpenAI Format",
        "icon": "🧠",
    },
    "gemini-3-8-flash": {
        "name": "Gemini 3.8 Flash",
        "family": "Google Gemini",
        "tag": "Advanced Vision",
        "icon": "⚡",
    },

    # --- 5. xAI Grok Family ---
    "grok-4-3": {
        "name": "Grok 4.3",
        "family": "xAI Grok",
        "tag": "Conversational",
        "icon": "🚀",
    },
    "grok-4-5": {
        "name": "Grok 4.5",
        "family": "xAI Grok",
        "tag": "Real-Time Vision",
        "icon": "🚀",
    },
    "grok-4-6": {
        "name": "Grok 4.6",
        "family": "xAI Grok",
        "tag": "Coding & Logic",
        "icon": "🚀",
    },
    "grok-4-7": {
        "name": "Grok 4.7",
        "family": "xAI Grok",
        "tag": "Flagship Multimodal",
        "icon": "🚀",
    },

    # --- 6. Moonshot Kimi & DeepSeek Family ---
    "kimi-k3": {
        "name": "Moonshot Kimi K3",
        "family": "Moonshot Kimi & DeepSeek",
        "tag": "2.8T MoE / 1M ctx",
        "icon": "🌙",
    },
    "deepseek-v4-flash": {
        "name": "DeepSeek V4 Flash",
        "family": "Moonshot Kimi & DeepSeek",
        "tag": "Fast Vision",
        "icon": "🐋",
    },
    "deepseek-v4-1-flash": {
        "name": "DeepSeek V4.1 Flash",
        "family": "Moonshot Kimi & DeepSeek",
        "tag": "Reasoning Vision",
        "icon": "🐋",
    },
    "deepseek-v4-pro": {
        "name": "DeepSeek V4 Pro",
        "family": "Moonshot Kimi & DeepSeek",
        "tag": "Pro Reasoning",
        "icon": "🐋",
    },
}

def get_muapi_key() -> str:
    from dotenv import load_dotenv
    load_dotenv(override=True)
    return os.getenv("MUAPI_API_KEY") or settings.MUAPI_API_KEY or ""

@router.get("/models")
def list_models():
    """Return all supported LLM models grouped across the 6 families."""
    return [
        {
            "id": slug,
            "name": meta["name"],
            "family": meta["family"],
            "tag": meta["tag"],
            "icon": meta["icon"],
        }
        for slug, meta in SUPPORTED_MODELS.items()
    ]

@router.post("", response_model=ChatResponse)
async def generate_chat(payload: ChatRequest):
    prompt = payload.prompt.strip()
    if not prompt and not payload.image_url:
        raise HTTPException(status_code=400, detail="Prompt or image_url is required")

    # If image_url is not set explicitly, extract any markdown/bracketed image url from prompt
    active_image_url = payload.image_url
    if not active_image_url:
        media_match = re.search(r'\[Attached Media:[^\]]*\((https?://[^\)]+)\)\]', prompt)
        if media_match:
            active_image_url = media_match.group(1)
        else:
            img_match = re.search(r'!\[[^\]]*\]\((https?://[^\)]+)\)', prompt)
            if img_match:
                active_image_url = img_match.group(1)

    # Validate model slug
    requested_model = (payload.model or "gpt-6-1-sol").strip().lower()
    if requested_model not in SUPPORTED_MODELS:
        requested_model = "gpt-6-1-sol"

    model_meta = SUPPORTED_MODELS[requested_model]
    model_display = model_meta["name"]
    target_model = requested_model

    muapi_key = get_muapi_key()
    if not muapi_key:
        raise HTTPException(
            status_code=500,
            detail="MUAPI_API_KEY is not configured in environment"
        )

    # Build system instructions
    if payload.system_prompt and payload.system_prompt.strip():
        system_instruction = payload.system_prompt.strip()
    else:
        system_instruction = (
            f"You are {model_display} in Open Spaces. "
            f"Active project: {payload.project or 'General'}. "
            "Help the user plan, write, code, brainstorm, analyze uploaded images/documents, and create living documents. "
            "Format your answers with clean markdown headings, bullet points, and actionable steps."
        )

    # Append last 10 chat history messages into system_prompt
    if payload.history and len(payload.history) > 0:
        history_lines = []
        for m in (payload.history or [])[-10:]:
            role_label = "User" if m.get("role") == "user" else "Assistant"
            content = (m.get("content") or "").strip()
            if content:
                history_lines.append(f"{role_label}: {content}")
        if history_lines:
            system_instruction += "\n\nChat History (last 10 messages):\n" + "\n".join(history_lines)

    # Prompt parameter receives purely user prompt
    user_prompt = prompt or "Please analyze the uploaded image."

    # Native streaming endpoint
    endpoint_url = f"https://api.muapi.ai/api/v1/{target_model}/stream"

    # Only pass prompt, system_prompt, and optionally image_url (ignore all other parameters)
    request_payload: Dict[str, Any] = {
        "prompt": user_prompt,
        "system_prompt": system_instruction,
    }
    if active_image_url:
        request_payload["image_url"] = active_image_url

    headers = {
        "x-api-key": muapi_key,
        "Content-Type": "application/json",
    }

    try:
        collected_chunks: List[str] = []
        timeout_settings = httpx.Timeout(120.0, connect=60.0)

        async with httpx.AsyncClient(timeout=timeout_settings) as client:
            async with client.stream("POST", endpoint_url, headers=headers, json=request_payload) as response:
                if response.status_code != 200:
                    raw_err = await response.aread()
                    err_msg = raw_err.decode("utf-8", errors="ignore")
                    try:
                        err_json = json.loads(err_msg)
                        err_msg = err_json.get("error") or err_json.get("detail") or err_msg
                    except Exception:
                        pass
                    raise HTTPException(
                        status_code=502,
                        detail=f"MuAPI provider error: HTTP {response.status_code} - {err_msg}"
                    )

                async for line in response.aiter_lines():
                    if not line:
                        continue
                    if line.startswith("data:"):
                        data_str = line[5:].strip()
                        if not data_str:
                            continue
                        if data_str == "[DONE]":
                            break
                        try:
                            event = json.loads(data_str)
                            if "error" in event:
                                raise HTTPException(
                                    status_code=502,
                                    detail=f"MuAPI provider error: {event['error']}"
                                )
                            choices = event.get("choices")
                            if choices and len(choices) > 0:
                                delta = choices[0].get("delta")
                                if isinstance(delta, dict):
                                    piece = delta.get("content")
                                    if piece:
                                        collected_chunks.append(piece)
                                elif isinstance(delta, str):
                                    collected_chunks.append(delta)
                                elif "text" in choices[0]:
                                    collected_chunks.append(choices[0]["text"])
                            elif "output" in event:
                                collected_chunks.append(str(event["output"]))
                            elif "text" in event:
                                collected_chunks.append(str(event["text"]))
                            elif "content" in event:
                                collected_chunks.append(str(event["content"]))
                        except json.JSONDecodeError:
                            continue

        final_reply = "".join(collected_chunks).strip()
        if not final_reply:
            raise HTTPException(
                status_code=502,
                detail=f"Model {model_display} returned an empty response. Please try again."
            )

        return ChatResponse(
            reply=final_reply,
            model=model_display,
            project=payload.project
        )

    except HTTPException:
        raise
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail=f"Request to {model_display} timed out. Deep reasoning models may take longer to respond."
        )
    except Exception as e:
        print(f"Error calling MuAPI endpoint for {target_model}: {e}")
        raise HTTPException(
            status_code=502,
            detail=f"MuAPI chat service error: {str(e)}"
        )
