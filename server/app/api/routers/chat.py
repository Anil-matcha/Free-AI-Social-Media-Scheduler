import os
import json
import re
import httpx
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.config import settings

router = APIRouter(prefix="/chat", tags=["Open Spaces 6 Series"])

class ChatRequest(BaseModel):
    prompt: str
    model: str = "gpt-6-1-sol"
    project: Optional[str] = "Clawdia"
    system_prompt: Optional[str] = None
    history: Optional[List[Dict[str, Any]]] = []
    image_url: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    model: str
    project: Optional[str] = None

# GPT-6 Series Models and Display Labels
GPT6_MODELS = {
    "gpt-6-1-sol": "GPT-6.1 Sol Light",
    "gpt-6-astra": "GPT-6 Astra",
    "gpt-6-sol": "GPT-6 Sol",
    "gpt-6-luna": "GPT-6 Luna",
}

# GPT-6 Vision-capable models
GPT6_VISION_MODELS = {
    "gpt-6-1-sol",
    "gpt-6-astra",
}

def get_muapi_key() -> str:
    from dotenv import load_dotenv
    load_dotenv(override=True)
    return os.getenv("MUAPI_API_KEY") or settings.MUAPI_API_KEY or ""

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

    # Validate and select GPT-6 series model
    requested_model = (payload.model or "gpt-6-1-sol").strip().lower()
    if requested_model not in GPT6_MODELS:
        requested_model = "gpt-6-1-sol"

    model_display = GPT6_MODELS[requested_model]
    target_model = requested_model

    # If an image is attached and the user selected a text-only GPT-6 model (gpt-6-sol or gpt-6-luna),
    # route to gpt-6-1-sol (the vision-enabled flagship in the GPT-6 series) so image analysis succeeds.
    if active_image_url and target_model not in GPT6_VISION_MODELS:
        target_model = "gpt-6-1-sol"

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

    # Prompt parameter receives purely the user prompt
    user_prompt = prompt or "Please analyze the uploaded image."

    # MuAPI endpoint for this GPT-6 model
    endpoint_url = f"https://api.muapi.ai/api/v1/{target_model}/stream"

    request_payload: Dict[str, Any] = {
        "prompt": user_prompt,
        "system_prompt": system_instruction,
    }
    if active_image_url and target_model in GPT6_VISION_MODELS:
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
