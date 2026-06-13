import os
import tempfile
from pathlib import Path
from typing import Optional

import httpx


MUAPI_BASE = "https://api.muapi.ai/api/v1"


async def upload_image_from_url(url: str, api_key: Optional[str] = None) -> str:
    """Download an image from a URL and re-upload it to MuAPI. Returns MuAPI-hosted URL."""
    key = api_key or os.environ["MUAPI_KEY"]

    # Download the image
    async with httpx.AsyncClient(timeout=60, follow_redirects=True) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        content = resp.content
        content_type = resp.headers.get("content-type", "image/jpeg")

    # Determine extension from content type
    ext_map = {
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
    }
    ext = ext_map.get(content_type.split(";")[0].strip(), ".jpg")

    # Write to temp file and upload
    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        result = await upload_image_from_path(tmp_path, key)
        return result
    finally:
        Path(tmp_path).unlink(missing_ok=True)


async def upload_image_from_path(path: str, api_key: Optional[str] = None) -> str:
    """Upload a local image file to MuAPI. Returns MuAPI-hosted URL."""
    key = api_key or os.environ["MUAPI_KEY"]
    headers = {"x-api-key": key}

    with open(path, "rb") as f:
        file_content = f.read()

    filename = Path(path).name
    content_type = _guess_content_type(filename)

    async with httpx.AsyncClient(timeout=120) as client:
        try:
            resp = await client.post(
                f"{MUAPI_BASE}/upload_file",
                headers=headers,
                files={"file": (filename, file_content, content_type)},
            )
            resp.raise_for_status()
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code in (401, 403):
                print("[Sandbox] File upload not available — returning original path as URL.")
                return path
            raise
        data = resp.json()

    url = data.get("url") or data.get("file_url") or data.get("data", {}).get("url")
    if not url:
        raise ValueError(f"No URL in upload response: {data}")
    return url


def _guess_content_type(filename: str) -> str:
    ext = Path(filename).suffix.lower()
    types = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".gif": "image/gif",
    }
    return types.get(ext, "image/jpeg")
