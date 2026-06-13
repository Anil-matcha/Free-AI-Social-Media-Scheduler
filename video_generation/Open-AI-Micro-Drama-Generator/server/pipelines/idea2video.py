import os
from pathlib import Path
from typing import Callable, Awaitable, Optional

from agents.screenwriter import Screenwriter
from agents.character_extractor import CharacterExtractor
from pipelines.script2video import Script2VideoPipeline
from utils.video import concatenate_videos


ProgressCallback = Callable[[str, str, int], Awaitable[None]]


class Idea2VideoPipeline:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ["MUAPI_KEY"]
        self.screenwriter = Screenwriter()
        self.character_extractor = CharacterExtractor()
        self.script2video = Script2VideoPipeline(api_key=self.api_key)

    async def run(
        self,
        idea: str,
        user_requirement: str,
        style: str,
        job_id: str,
        progress_callback: ProgressCallback,
    ) -> str:
        """
        Full pipeline: idea → story → scenes → videos → final concatenated video.
        Returns the path to the final video.
        """
        outputs_dir = Path("outputs") / job_id
        outputs_dir.mkdir(parents=True, exist_ok=True)

        # Stage 1: Develop story
        await progress_callback(
            "screenwriter", "Developing story...", 10
        )
        story = await self.screenwriter.develop_story(idea, user_requirement)

        # Stage 2: Extract characters from story
        await progress_callback(
            "characters", "Extracting characters...", 20
        )
        characters = await self.character_extractor.extract_characters(story)

        # Stage 3: Write scene scripts
        await progress_callback(
            "screenwriter", "Writing scene scripts...", 25
        )
        scene_scripts = await self.screenwriter.write_script_based_on_story(
            story, user_requirement
        )

        if not scene_scripts:
            raise RuntimeError("Screenwriter produced no scene scripts")

        # Stage 4: Generate video for each scene
        scene_video_paths = []
        num_scenes = len(scene_scripts)

        # Distribute progress range 30-88 across scenes
        progress_per_scene = int(58 / max(num_scenes, 1))

        for scene_idx, scene_script in enumerate(scene_scripts):
            scene_dir = str(outputs_dir / f"scene_{scene_idx:02d}")
            base_progress = 30 + scene_idx * progress_per_scene

            try:
                scene_video = await self.script2video.run(
                    script=scene_script,
                    characters=characters,
                    user_requirement=user_requirement,
                    style=style,
                    working_dir=scene_dir,
                    progress_callback=progress_callback,
                    scene_idx=scene_idx,
                    base_progress=base_progress,
                    progress_range=progress_per_scene,
                )
                scene_video_paths.append(scene_video)
            except Exception as e:
                # Log but continue with remaining scenes
                print(f"Warning: scene {scene_idx} failed: {e}")
                await progress_callback(
                    "video",
                    f"Scene {scene_idx + 1} failed, continuing...",
                    base_progress + progress_per_scene,
                )

        if not scene_video_paths:
            raise RuntimeError("All scenes failed to generate")

        # Stage 5: Concatenate all scene videos
        await progress_callback(
            "concat", "Combining all scenes into final video...", 90
        )
        final_video_path = str(outputs_dir / "final_video.mp4")
        await concatenate_videos(scene_video_paths, final_video_path)

        await progress_callback(
            "concat", "Video generation complete!", 100
        )
        return final_video_path
