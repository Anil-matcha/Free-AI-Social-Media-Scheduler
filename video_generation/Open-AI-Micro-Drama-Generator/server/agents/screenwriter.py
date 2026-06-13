import json
import os
from typing import List

from tools.muapi_llm import MuAPILLM

_FALLBACK_STORY = """
Title: The Last Signal

A lone engineer named Maya, stationed at a remote arctic research base, intercepts a mysterious transmission.
The signal pulses with an unknown pattern — not noise, but intent. As a blizzard closes in and communication
with the outside world fails, Maya decodes the message piece by piece, racing against time and the elements.
The climax reveals the signal is a beacon left by an earlier expedition — a warning, and a map.
She follows it into the ice and uncovers a buried chamber, its contents changing everything she thought she knew.
"""

_FALLBACK_SCENES = json.dumps({
    "scenes": [
        {
            "scene_number": 1,
            "title": "The Transmission",
            "script": (
                "INT. ARCTIC RESEARCH BASE - COMMUNICATIONS ROOM - NIGHT\n"
                "Maya sits at her console, surrounded by flickering monitors. Snow hammers the windows. "
                "A burst of static, then a rhythmic pulse fills the speakers. "
                "MAYA (leaning forward): That's not random noise. She grabs her headset and starts recording.\n"
                "The pulse repeats — three long, two short. Her fingers fly across the keyboard."
            )
        },
        {
            "scene_number": 2,
            "title": "Into the Ice",
            "script": (
                "EXT. ARCTIC TUNDRA - DAWN\n"
                "The blizzard has passed. Maya trudges through knee-deep snow, GPS in hand, following the decoded coordinates. "
                "The landscape is vast and white. A faint rectangular outline breaks the snow ahead — "
                "something buried, geometric. She kneels and brushes the surface. "
                "MAYA (whispering): It's a door."
            )
        }
    ]
})


class Screenwriter:
    def __init__(self):
        self.llm = MuAPILLM()

    async def develop_story(self, idea: str, user_requirement: str) -> str:
        system_prompt = (
            "You are a professional screenwriter and story developer. "
            "Your task is to expand a brief idea into a compelling story outline. "
            "Include premise, protagonist, conflict, rising action, climax, and resolution. "
            "Keep it suitable for a short video (1-3 minutes). "
            "Write in clear prose, focusing on visual storytelling."
        )
        prompt = f"""Develop a story based on this idea:

Idea: {idea}

Additional requirements: {user_requirement if user_requirement else "None"}

Write a detailed story outline that can be translated into a short video. Include:
- Setting and atmosphere
- Main character(s) and their goal
- The conflict or journey
- Emotional arc
- Visual climax moment
- Resolution

Write the story outline as flowing prose."""

        return await self.llm.complete(
            prompt, system_prompt=system_prompt, timeout=120, fallback=_FALLBACK_STORY
        )

    async def write_script_based_on_story(self, story: str, user_requirement: str) -> List[str]:
        system_prompt = (
            "You are a professional screenwriter. "
            "Your task is to break a story outline into individual scene scripts. "
            "Each scene should be self-contained, visually rich, and suitable for video generation. "
            "Write 2-4 scenes maximum. "
            "Respond ONLY with valid JSON — no markdown, no explanation, just JSON."
        )
        prompt = f"""Based on this story outline, write individual scene scripts for a short video.

Story Outline:
{story}

Additional requirements: {user_requirement if user_requirement else "None"}

Return a JSON object with this exact structure:
{{
  "scenes": [
    {{
      "scene_number": 1,
      "title": "Scene title",
      "script": "Full scene script with action lines, dialogue, and scene description."
    }}
  ]
}}

Rules:
- Create 2-4 scenes that together tell the complete story
- Each scene script should be visually descriptive and filmable
- Include character actions, dialogue, and environmental details"""

        raw = await self.llm.complete(
            prompt, system_prompt=system_prompt, timeout=120, fallback=_FALLBACK_SCENES
        )
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        data = json.loads(raw)
        return [scene["script"] for scene in data.get("scenes", [])]
