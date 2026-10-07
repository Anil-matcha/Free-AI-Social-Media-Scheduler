import asyncio
import os
import tempfile
from pathlib import Path
from typing import List

import httpx


async def download_video(url: str, dest_path: str) -> str:
    """Download a video from a URL to a local path. Returns the path."""
    async with httpx.AsyncClient(timeout=120, follow_redirects=True) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        with open(dest_path, "wb") as f:
            f.write(resp.content)
    return dest_path


async def concatenate_videos(video_paths: List[str], output_path: str) -> str:
    """
    Concatenate multiple video files into one using moviepy.
    video_paths: list of local file paths or URLs
    output_path: local path for the output video
    Returns the output_path.
    """
    # Resolve URLs to local paths
    local_paths = []
    temp_files = []

    for i, vp in enumerate(video_paths):
        if vp.startswith("http://") or vp.startswith("https://"):
            tmp = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False)
            tmp.close()
            await download_video(vp, tmp.name)
            local_paths.append(tmp.name)
            temp_files.append(tmp.name)
        else:
            local_paths.append(vp)

    # Run moviepy concatenation in a thread executor to avoid blocking
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _concat_sync, local_paths, output_path)

    # Clean up temp files
    for tf in temp_files:
        Path(tf).unlink(missing_ok=True)

    return output_path


def _concat_sync(video_paths: List[str], output_path: str) -> None:
    """Synchronous moviepy concatenation (runs in thread executor)."""
    try:
        from moviepy.editor import VideoFileClip, concatenate_videoclips
    except ImportError:
        from moviepy import VideoFileClip, concatenate_videoclips

    clips = []
    try:
        for path in video_paths:
            clip = VideoFileClip(path)
            clips.append(clip)

        if not clips:
            raise ValueError("No video clips to concatenate")

        if len(clips) == 1:
            # Just copy
            clips[0].write_videofile(
                output_path,
                codec="libx264",
                audio_codec="aac",
                logger=None,
            )
        else:
            final = concatenate_videoclips(clips, method="compose")
            final.write_videofile(
                output_path,
                codec="libx264",
                audio_codec="aac",
                logger=None,
            )
            final.close()
    finally:
        for clip in clips:
            clip.close()
