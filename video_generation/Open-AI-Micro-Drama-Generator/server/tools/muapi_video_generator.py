import asyncio
import os
from typing import Optional

import httpx


MUAPI_BASE = "https://api.muapi.ai/api/v1"
POLL_INTERVAL = 3  # seconds

# Short royalty-free placeholder video returned in sandbox mode.
_SANDBOX_VIDEO_URL = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"


class MuAPIVideoGenerator:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ["MUAPI_KEY"]
        self.headers = {"x-api-key": self.api_key, "Content-Type": "application/json"}

    async def generate_video_from_image(
        self,
        prompt: str,
        image_url: str,
        duration: int = 5,
        aspect_ratio: str = "16:9",
    ) -> str:
        """Generate a cinematic video clip from an image + motion prompt.

        Primary: Seedance 2 VIP I2V — the highest quality Seedance model,
        with cinematic motion, strong temporal consistency, and excellent
        dramatic scene handling. Supports 4–15 second clips at 16:9.

        Fallback: Kling v2.1 Master I2V — master-tier Kling with superior
        motion quality vs Standard, used if Seedance 2 VIP fails.

        Returns URL of generated video.
        """
        # Seedance 2 VIP supports 4-15s; clamp to valid range
        sd2_duration = max(4, min(15, duration))

        try:
            return await self._seedance2_vip(prompt, image_url, sd2_duration, aspect_ratio)
        except Exception as e:
            print(f"Seedance 2 VIP failed ({e}), falling back to Kling Master...")
            # Kling supports 5 or 10s
            kling_duration = 5 if duration <= 7 else 10
            return await self._kling_master(prompt, image_url, kling_duration, aspect_ratio)

    async def _seedance2_vip(
        self, prompt: str, image_url: str, duration: int, aspect_ratio: str
    ) -> str:
        async with httpx.AsyncClient(timeout=60) as client:
            try:
                resp = await client.post(
                    f"{MUAPI_BASE}/seedance-2-vip-image-to-video",
                    headers=self.headers,
                    json={
                        "prompt": prompt,
                        "images_list": [image_url],
                        "duration": duration,
                        "aspect_ratio": aspect_ratio,
                    },
                )
                resp.raise_for_status()
            except httpx.HTTPStatusError as exc:
                if exc.response.status_code in (401, 403):
                    print("[Sandbox] Video generation (Seedance 2) not available — returning placeholder.")
                    return _SANDBOX_VIDEO_URL
                raise
            data = resp.json()

        request_id = data.get("request_id") or data.get("id")
        if not request_id:
            raise ValueError(f"No request_id in Seedance 2 VIP response: {data}")

        result = await self._poll_until_done(request_id, timeout=600)
        return self._extract_url(result)

    async def _kling_master(
        self, prompt: str, image_url: str, duration: int, aspect_ratio: str
    ) -> str:
        async with httpx.AsyncClient(timeout=60) as client:
            try:
                resp = await client.post(
                    f"{MUAPI_BASE}/kling-v2.1-master-i2v",
                    headers=self.headers,
                    json={
                        "prompt": prompt,
                        "image_url": image_url,
                        "duration": duration,
                        "aspect_ratio": aspect_ratio,
                    },
                )
                resp.raise_for_status()
            except httpx.HTTPStatusError as exc:
                if exc.response.status_code in (401, 403):
                    print("[Sandbox] Video generation (Kling Master) not available — returning placeholder.")
                    return _SANDBOX_VIDEO_URL
                raise
            data = resp.json()

        request_id = data.get("request_id") or data.get("id")
        if not request_id:
            raise ValueError(f"No request_id in Kling Master response: {data}")

        result = await self._poll_until_done(request_id, timeout=600)
        return self._extract_url(result)

    def _extract_url(self, result: dict) -> str:
        outputs = result.get("outputs", [])
        if not outputs:
            raise ValueError(f"No outputs in result: {result}")
        output = outputs[0]
        if isinstance(output, dict):
            return output.get("url") or output.get("video_url") or str(output)
        return str(output)

    async def _poll_until_done(self, request_id: str, timeout: int = 600) -> dict:
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
                        f"MuAPI video job {request_id} failed: {data.get('error', 'unknown error')}"
                    )
                elif status == "cancelled":
                    raise RuntimeError(f"MuAPI video job {request_id} was cancelled")

        raise TimeoutError(
            f"MuAPI video job {request_id} did not complete within {timeout}s"
        )
