import os
import urllib.parse
import httpx
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.core.config import settings

router = APIRouter(prefix="/images", tags=["Image Generation (GPT-Image-2)"])

MUAPI_KEY = settings.MUAPI_API_KEY or os.getenv("MUAPI_API_KEY", "")

class ImageGenerateRequest(BaseModel):
    prompt: str
    aspect_ratio: Optional[str] = "1:1"
    resolution: Optional[str] = "2K"
    model: Optional[str] = "gpt-image-2-text-to-image"

class ImageGenerateResponse(BaseModel):
    image_url: str
    model: str
    prompt: str

class SuggestPromptRequest(BaseModel):
    context: str
    title: Optional[str] = None

class SuggestPromptResponse(BaseModel):
    suggested_prompt: str

@router.post("/generate", response_model=ImageGenerateResponse)
async def generate_image(payload: ImageGenerateRequest):
    prompt = payload.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")

    aspect_ratio = payload.aspect_ratio or "1:1"
    width, height = 1024, 1024
    if aspect_ratio == "16:9":
        width, height = 1280, 720
    elif aspect_ratio == "9:16":
        width, height = 720, 1280
    elif aspect_ratio == "4:3":
        width, height = 1024, 768

    # 1. Generation via MuAPI (gpt-image-2-text-to-image)
    submit_url = "https://api.muapi.ai/api/v1/gpt-image-2-text-to-image"
    headers = {
        "x-api-key": MUAPI_KEY,
        "Authorization": f"Bearer {MUAPI_KEY}",
        "Content-Type": "application/json"
    }
    muapi_payload = {
        "prompt": prompt,
        "aspect_ratio": aspect_ratio,
        "resolution": payload.resolution or "2K"
    }

    try:
        async with httpx.AsyncClient(timeout=None) as client:
            res = await client.post(submit_url, headers=headers, json=muapi_payload)
            if res.status_code not in [200, 201]:
                raise HTTPException(
                    status_code=res.status_code,
                    detail=f"MuAPI submission failed: {res.text}"
                )

            res_data = res.json()
            # If synchronous output directly available
            if res_data.get("outputs") or res_data.get("output") or res_data.get("url"):
                out = res_data.get("outputs") or res_data.get("output") or res_data.get("url")
                out_url = out[0] if isinstance(out, list) else out
                return ImageGenerateResponse(
                    image_url=str(out_url),
                    model="gpt-image-2-text-to-image",
                    prompt=prompt
                )

            req_id = res_data.get("request_id") or res_data.get("id")
            if not req_id:
                raise HTTPException(status_code=502, detail="No request_id returned by MuAPI")

            # Poll MuAPI predictions endpoint until completed or failed (no timeout cutoff)
            import asyncio
            poll_url = f"https://api.muapi.ai/api/v1/predictions/{req_id}/result"
            poll_headers = {
                "x-api-key": MUAPI_KEY,
                "Authorization": f"Bearer {MUAPI_KEY}"
            }

            while True:
                await asyncio.sleep(2)
                try:
                    p_res = await client.get(poll_url, headers=poll_headers)
                except Exception as net_err:
                    print(f"Transient polling error, retrying: {net_err}")
                    continue

                if p_res.status_code == 200:
                    p_data = p_res.json()
                    status = p_data.get("status") or p_data.get("state")

                    if status in ["completed", "succeeded"]:
                        outputs = p_data.get("outputs") or p_data.get("output") or []
                        out_url = outputs[0] if isinstance(outputs, list) and outputs else outputs
                        if out_url and isinstance(out_url, str):
                            return ImageGenerateResponse(
                                image_url=out_url,
                                model="gpt-image-2-text-to-image",
                                prompt=prompt
                            )
                        raise HTTPException(status_code=502, detail="Completed status received but no image output found.")

                    elif status in ["failed", "error", "canceled"]:
                        err_msg = p_data.get("error") or f"MuAPI generation failed with status: {status}"
                        raise HTTPException(status_code=502, detail=str(err_msg))

    except HTTPException:
        raise
    except Exception as e:
        print(f"MuAPI generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")

@router.post("/suggest-prompt", response_model=SuggestPromptResponse)
async def suggest_image_prompt(payload: SuggestPromptRequest):
    context = payload.context.strip()
    if not context:
        return SuggestPromptResponse(suggested_prompt="Modern abstract tech visualization with glowing nodes and clean geometric composition")

    try:
        url = "https://api.muapi.ai/v1/chat/completions"
        system_instruction = (
            "You are a specialized prompt designer for the GPT-Image-2 text-to-image model in ChatGPT Spaces. "
            "Analyze the provided document context and formulate ONE single, vivid, professional image generation prompt "
            "(maximum 25 words). The prompt must describe an aesthetic, high-concept illustration, diagram, or architectural visual "
            "that visually elevates this content. "
            "CRITICAL: Output ONLY the prompt text, no quotes, no conversational intro."
        )

        messages = [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": f"Document Title: {payload.title or 'Living Document'}\nContext:\n{context[:1200]}"}
        ]

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                url,
                headers={
                    "Authorization": f"Bearer {MUAPI_KEY}",
                    "x-api-key": MUAPI_KEY,
                    "Content-Type": "application/json"
                },
                json={
                    "model": "mimo-v2-6-flash-abliterated",
                    "messages": messages,
                    "temperature": 0.7
                }
            )
            if resp.status_code == 200:
                data = resp.json()
                text = data["choices"][0]["message"]["content"].strip()
                cleaned = text.strip('"\'`').replace("\n", " ")
                return SuggestPromptResponse(suggested_prompt=cleaned)
    except Exception as e:
        print(f"Error suggesting image prompt: {e}")

    # Fallback contextual prompt
    snippet = context.split("\n")[0][:60]
    return SuggestPromptResponse(
        suggested_prompt=f"Minimalist editorial 3D concept render illustrating {snippet}, soft studio lighting, high resolution"
    )
