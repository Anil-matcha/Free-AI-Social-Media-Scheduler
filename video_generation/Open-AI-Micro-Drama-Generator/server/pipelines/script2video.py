import asyncio
import os
from pathlib import Path
from typing import Callable, Awaitable, List, Optional

from agents.storyboard_artist import StoryboardArtist
from interfaces.character import CharacterInScene
from interfaces.shot import ShotDescription
from tools.muapi_image_generator import MuAPIImageGenerator
from tools.muapi_video_generator import MuAPIVideoGenerator
from tools.muapi_uploader import upload_image_from_url
from utils.video import concatenate_videos, download_video


ProgressCallback = Callable[[str, str, int], Awaitable[None]]


class Script2VideoPipeline:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ["MUAPI_KEY"]
        self.storyboard_artist = StoryboardArtist()
        self.image_gen = MuAPIImageGenerator(api_key=self.api_key)
        self.video_gen = MuAPIVideoGenerator(api_key=self.api_key)

    async def run(
        self,
        script: str,
        characters: List[CharacterInScene],
        user_requirement: str,
        style: str,
        working_dir: str,
        progress_callback: ProgressCallback,
        scene_idx: int = 0,
        base_progress: int = 30,
        progress_range: int = 60,
    ) -> str:
        """
        Run the script-to-video pipeline for a single scene.
        Returns the path to the final scene video.
        """
        Path(working_dir).mkdir(parents=True, exist_ok=True)

        # Step 1: Generate character portraits in parallel
        await progress_callback(
            "portraits",
            f"Generating character portraits for scene {scene_idx + 1}...",
            base_progress + int(progress_range * 0.05),
        )
        character_portrait_urls: dict[str, str] = {}
        if characters:
            portrait_tasks = {
                c.name: self._generate_portrait(c, style)
                for c in characters
                if c.is_visible
            }
            results = await asyncio.gather(*portrait_tasks.values(), return_exceptions=True)
            for name, result in zip(portrait_tasks.keys(), results):
                if isinstance(result, Exception):
                    # Non-fatal: continue without portrait
                    print(f"Warning: portrait generation failed for {name}: {result}")
                else:
                    character_portrait_urls[name] = result

        # Step 2: Design storyboard
        await progress_callback(
            "storyboard",
            f"Designing storyboard for scene {scene_idx + 1}...",
            base_progress + int(progress_range * 0.15),
        )
        shots_brief = await self.storyboard_artist.design_storyboard(
            script, characters, f"{user_requirement}. Style: {style}"
        )

        shots: List[ShotDescription] = [
            ShotDescription(**s.model_dump()) for s in shots_brief
        ]

        # Step 3: Generate first frames sequentially (to maintain visual order)
        frame_progress_step = int(progress_range * 0.35 / max(len(shots), 1))
        for i, shot in enumerate(shots):
            await progress_callback(
                "frames",
                f"Generating frame for shot {i + 1}/{len(shots)} (scene {scene_idx + 1})...",
                base_progress + int(progress_range * 0.20) + i * frame_progress_step,
            )
            frame_url = await self._generate_first_frame(
                shot, characters, character_portrait_urls, style
            )
            shot.first_frame_url = frame_url

        # Step 4: Generate videos in parallel
        await progress_callback(
            "video",
            f"Generating videos for scene {scene_idx + 1}...",
            base_progress + int(progress_range * 0.60),
        )
        video_tasks = [
            self._generate_shot_video(shot, i, working_dir)
            for i, shot in enumerate(shots)
            if shot.first_frame_url
        ]
        video_results = await asyncio.gather(*video_tasks, return_exceptions=True)

        shot_video_paths = []
        for i, result in enumerate(video_results):
            if isinstance(result, Exception):
                print(f"Warning: video generation failed for shot {i}: {result}")
            else:
                shot_video_paths.append(result)
                shots[i].video_url = result

        if not shot_video_paths:
            raise RuntimeError(f"All video generation failed for scene {scene_idx + 1}")

        # Step 5: Concatenate shot videos
        await progress_callback(
            "concat",
            f"Combining shots for scene {scene_idx + 1}...",
            base_progress + int(progress_range * 0.90),
        )
        scene_video_path = str(Path(working_dir) / "scene_video.mp4")
        await concatenate_videos(shot_video_paths, scene_video_path)

        return scene_video_path

    async def _generate_portrait(self, character: CharacterInScene, style: str) -> str:
        """Generate a character portrait image."""
        prompt = (
            f"Professional portrait photo of {character.name}. "
            f"{character.static_features}. "
            f"Wearing {character.dynamic_features}. "
            f"Style: {style}. "
            "High quality, detailed face, neutral background, studio lighting, "
            "character reference sheet, full face visible."
        )
        return await self.image_gen.generate_image(prompt, aspect_ratio="2:3")

    async def _generate_first_frame(
        self,
        shot: ShotDescription,
        characters: List[CharacterInScene],
        portrait_urls: dict,
        style: str,
    ) -> str:
        """Generate the first frame for a shot, using character references if available."""
        # Find which characters appear in this shot
        mentioned_chars = [
            c for c in characters if c.name.lower() in shot.visual_desc.lower()
        ]

        reference_url = None
        if mentioned_chars and portrait_urls.get(mentioned_chars[0].name):
            reference_url = portrait_urls[mentioned_chars[0].name]

        char_desc = ""
        if mentioned_chars:
            char_desc = " ".join(
                [
                    f"{c.name} ({c.dynamic_features})"
                    for c in mentioned_chars
                ]
            )

        full_prompt = (
            f"{shot.visual_desc}. "
            f"{char_desc}. "
            f"Style: {style}. "
            "Cinematic composition, 16:9 aspect ratio, high quality, detailed."
        )

        if reference_url:
            try:
                return await self.image_gen.generate_image_with_reference(
                    full_prompt, reference_url, aspect_ratio="16:9"
                )
            except Exception as e:
                print(f"Warning: reference image generation failed, falling back to T2I: {e}")

        # Fallback to regular T2I
        return await self.image_gen.generate_image(full_prompt, aspect_ratio="16:9")

    async def _generate_shot_video(
        self, shot: ShotDescription, shot_idx: int, working_dir: str
    ) -> str:
        """Generate a video clip for a shot. Returns local file path."""
        if not shot.first_frame_url:
            raise ValueError(f"Shot {shot_idx} has no first_frame_url")

        # Build video prompt from motion + audio descriptions
        video_prompt = f"{shot.motion_desc}. {shot.audio_desc}"

        # Upload the first frame to get a stable MuAPI URL if needed
        frame_url = shot.first_frame_url
        if not frame_url.startswith("https://api.muapi.ai"):
            try:
                frame_url = await upload_image_from_url(frame_url, self.api_key)
            except Exception as e:
                print(f"Warning: re-upload failed, using original URL: {e}")

        video_url = await self.video_gen.generate_video_from_image(
            video_prompt, frame_url, duration=5, aspect_ratio="16:9"
        )

        # Download the video locally
        local_path = str(Path(working_dir) / f"shot_{shot_idx:03d}.mp4")
        await download_video(video_url, local_path)
        return local_path
