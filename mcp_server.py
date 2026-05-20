"""
Gemini Omni MCP Server — exposes the Gemini Omni API as MCP tools.
Run with: python mcp_server.py
"""

import json
from mcp.server.fastmcp import FastMCP
from gemini_omni_api import GeminiOmniAPI

mcp = FastMCP("gemini-omni")
api = GeminiOmniAPI()


@mcp.tool()
def text_to_video(
    prompt: str,
    duration: int = 8,
    aspect_ratio: str = "16:9",
    audio_id: str = None,
    seed: int = None,
) -> str:
    """Generate a video from a text prompt using Gemini Omni.

    Args:
        prompt: Description of the desired video content.
        duration: Output length — one of 4, 6, 8, 10 seconds.
        aspect_ratio: "16:9" or "9:16".
        audio_id: Optional voice ID for synchronized audio.
        seed: Optional random seed (0–2147483647) for reproducibility.
    """
    result = api.text_to_video(
        prompt=prompt,
        duration=duration,
        aspect_ratio=aspect_ratio,
        audio_id=audio_id,
        seed=seed,
    )
    return json.dumps(result)


@mcp.tool()
def image_to_video(
    prompt: str,
    image_urls: list,
    duration: int = 8,
    aspect_ratio: str = "16:9",
    audio_id: str = None,
    seed: int = None,
) -> str:
    """Animate one or more reference images with a text prompt.

    Args:
        prompt: Description of the desired motion and scene.
        image_urls: List of 1–7 publicly accessible image URLs (each ≤20 MB).
        duration: Output length — one of 4, 6, 8, 10 seconds.
        aspect_ratio: "16:9" or "9:16".
        audio_id: Optional voice ID.
        seed: Optional random seed.
    """
    result = api.image_to_video(
        prompt=prompt,
        image_urls=image_urls,
        duration=duration,
        aspect_ratio=aspect_ratio,
        audio_id=audio_id,
        seed=seed,
    )
    return json.dumps(result)


@mcp.tool()
def video_edit(
    prompt: str,
    video_url: str = None,
    image_urls: list = None,
    trim_start: float = 0,
    trim_end: float = 10,
    duration: int = 8,
    aspect_ratio: str = "16:9",
    audio_id: str = None,
    seed: int = None,
) -> str:
    """Edit or restyle a source video and/or reference images.

    At least one of video_url or image_urls must be provided.

    Args:
        prompt: Edit instruction (e.g. "restyle as Studio Ghibli animation").
        video_url: Source video URL (max 100 MB, max 30 s).
        image_urls: Optional reference images (1–7, or 1–5 if video_url is set).
        trim_start: Start of the clip window in seconds.
        trim_end: End of the clip window in seconds (max 10 s window).
        duration: Output length — one of 4, 6, 8, 10 seconds.
        aspect_ratio: "16:9" or "9:16".
        audio_id: Optional voice ID.
        seed: Optional random seed.
    """
    result = api.video_edit(
        prompt=prompt,
        video_url=video_url,
        image_urls=image_urls,
        trim_start=trim_start,
        trim_end=trim_end,
        duration=duration,
        aspect_ratio=aspect_ratio,
        audio_id=audio_id,
        seed=seed,
    )
    return json.dumps(result)


@mcp.tool()
def upload_file(file_path: str) -> str:
    """Upload a local image or video file and return its public URL.

    Args:
        file_path: Absolute or relative path to the file.
    """
    url = api.upload_file(file_path)
    return json.dumps({"url": url})


@mcp.tool()
def get_task_status(request_id: str) -> str:
    """Get the current status and outputs for a generation request.

    Args:
        request_id: The request_id returned by a generation endpoint.
    """
    result = api.get_result(request_id)
    return json.dumps(result)


@mcp.tool()
def wait_for_completion(
    request_id: str,
    poll_interval: int = 5,
    timeout: int = 600,
) -> str:
    """Block until a generation request completes and return the final result.

    Args:
        request_id: The request_id returned by a generation endpoint.
        poll_interval: Seconds between polls (default 5).
        timeout: Maximum wait time in seconds (default 600).
    """
    result = api.wait_for_completion(
        request_id=request_id,
        poll_interval=poll_interval,
        timeout=timeout,
    )
    return json.dumps(result)


if __name__ == "__main__":
    mcp.run()
