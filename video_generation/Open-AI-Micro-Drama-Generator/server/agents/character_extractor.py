import json
import os
from typing import List

from interfaces.character import CharacterInScene
from tools.muapi_llm import MuAPILLM

_FALLBACK_CHARACTERS = json.dumps({
    "characters": [
        {
            "idx": 0,
            "name": "Maya",
            "static_features": (
                "Woman, early 30s, East Asian descent. Sharp dark eyes, straight black hair pulled back "
                "in a practical ponytail, high cheekbones, lean and athletic build from years of field work."
            ),
            "dynamic_features": (
                "Heavy insulated arctic parka in navy blue, thermal base layers, snow goggles pushed up "
                "on her forehead, worn leather gloves, a satellite communicator clipped to her chest."
            ),
            "is_visible": True
        }
    ]
})


class CharacterExtractor:
    def __init__(self):
        self.llm = MuAPILLM()

    async def extract_characters(self, script: str) -> List[CharacterInScene]:
        system_prompt = (
            "You are a casting director and character designer. "
            "Your task is to extract all visible characters from a script and provide detailed visual descriptions. "
            "Focus on characteristics that remain consistent (static) and scene-specific details (dynamic). "
            "Respond ONLY with valid JSON — no markdown, no explanation, just JSON."
        )
        prompt = f"""Extract all characters from this script and provide visual descriptions for AI image generation.

Script:
{script}

Return a JSON object with this exact structure:
{{
  "characters": [
    {{
      "idx": 0,
      "name": "Character Name",
      "static_features": "Detailed physical description: age, gender, ethnicity, hair, eyes, build, distinctive features",
      "dynamic_features": "Exact outfit and accessories in this scene",
      "is_visible": true
    }}
  ]
}}

Rules:
- Only include characters who are visually present (not just mentioned)
- static_features must be detailed enough for consistent portrait generation
- If no appearance is described, invent plausible details"""

        raw = await self.llm.complete(
            prompt, system_prompt=system_prompt, timeout=120, fallback=_FALLBACK_CHARACTERS
        )
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        data = json.loads(raw)
        return [CharacterInScene(**c) for c in data.get("characters", [])]
