import asyncio
import os
from typing import Optional

import httpx


MUAPI_BASE = "https://api.muapi.ai/api/v1"
POLL_INTERVAL = 3  # seconds

# Placeholder returned when a sandbox/demo key has no image-generation access.
# A freely-available 16:9 grey placeholder that is always reachable.
_SANDBOX_IMAGE_URL = "https://placehold.co/1280x720/1a1a2e/ffffff.png?text=Sandbox+Mode"


class MuAPIImageGenerator:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ["MUAPI_KEY"]
        self.headers = {"x-api-key": self.api_key, "Content-Type": "application/json"}

    async def generate_image(self, prompt: str, aspect_ratio: str = "1:1") -> str:
        """Generate a photorealistic character portrait.

        Uses Seedream v4.5 (high quality) — purpose-built for photorealistic
        human portraits with accurate skin tones, facial detail, and dramatic
        lighting. Superior to flux-dev for micro-drama character sheets.
        Returns URL of generated image.
        """
        model = os.environ.get("PORTRAIT_MODEL", "bytedance-seedream-v4.5")
        async with httpx.AsyncClient(timeout=60) as client:
            try:
                resp = await client.post(
                    f"{MUAPI_BASE}/{model}",
                    headers=self.headers,
                    json={
                        "prompt": prompt,
                        "aspect_ratio": aspect_ratio,
                        "quality": "high",
                    },
                )
                resp.raise_for_status()
            except httpx.HTTPStatusError as exc:
                if exc.response.status_code in (401, 403):
                    print("[Sandbox] Image generation not available — returning placeholder.")
                    return _SANDBOX_IMAGE_URL
                raise
            data = resp.json()

        request_id = data.get("request_id") or data.get("id")
        if not request_id:
            raise ValueError(f"No request_id in response: {data}")

        result = await self._poll_until_done(request_id, timeout=300)
        return self._extract_url(result)

    async def generate_image_with_reference(
        self,
        prompt: str,
        reference_url: str,
        aspect_ratio: str = "16:9",
    ) -> str:
        """Generate a scene frame using a character reference image.

        Uses Nano Banana 2 Edit (Google Imagen 4) — excellent at preserving
        character appearance from a reference while composing a new scene,
        giving strong visual consistency across shots.
        Returns URL of generated image.
        """
        model = os.environ.get("FRAME_MODEL", "nano-banana-2-edit")
        async with httpx.AsyncClient(timeout=60) as client:
            try:
                resp = await client.post(
                    f"{MUAPI_BASE}/{model}",
                    headers=self.headers,
                    json={
                        "prompt": prompt,
                        "images_list": [reference_url],
                        "aspect_ratio": aspect_ratio,
                        "resolution": "2k",
                    },
                )
                resp.raise_for_status()
            except httpx.HTTPStatusError as exc:
                if exc.response.status_code in (401, 403):
                    print("[Sandbox] Reference image generation not available — returning placeholder.")
                    return _SANDBOX_IMAGE_URL
                raise
            data = resp.json()

        request_id = data.get("request_id") or data.get("id")
        if not request_id:
            raise ValueError(f"No request_id in response: {data}")

        result = await self._poll_until_done(request_id, timeout=300)
        return self._extract_url(result)

    def _extract_url(self, result: dict) -> str:
        outputs = result.get("outputs", [])
        if not outputs:
            raise ValueError(f"No outputs in result: {result}")
        output = outputs[0]
        if isinstance(output, dict):
            return output.get("url") or output.get("image_url") or str(output)
        return str(output)

    async def _poll_until_done(self, request_id: str, timeout: int = 300) -> dict:
        elapsed = 0
        async with httpx.AsyncClient(timeout=30) as client:
            while elapsed < timeout:
                await asyncio.sleep(POLL_INTERVAL)
                elapsed += POLL_INTERVAL

                resp = await client.get(
                    f"{MUAPI_BASE}/predictions/{request_id}/result",
                    headers=self.headers,
                )
                resp.raise_for_status()
                data = resp.json()

                status = data.get("status", "")
                if status == "completed":
                    return data
                elif status == "failed":
                    raise RuntimeError(
                        f"MuAPI image job {request_id} failed: {data.get('error', 'unknown error')}"
                    )
                elif status == "cancelled":
                    raise RuntimeError(f"MuAPI image job {request_id} was cancelled")

        raise TimeoutError(
            f"MuAPI image job {request_id} did not complete within {timeout}s"
        )
