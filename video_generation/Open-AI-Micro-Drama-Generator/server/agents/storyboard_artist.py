import json
import os
from typing import List

from interfaces.character import CharacterInScene
from interfaces.shot import ShotBriefDescription
from tools.muapi_llm import MuAPILLM

_FALLBACK_STORYBOARD = json.dumps({
    "shots": [
        {
            "idx": 0,
            "visual_desc": (
                "Wide establishing shot of a remote arctic research base at night. "
                "The base is a cluster of illuminated prefab modules half-buried in snow. "
                "A fierce blizzard swirls around the structure. Warm amber light spills from porthole windows. "
                "The sky above shows faint aurora borealis through breaks in the storm clouds. "
                "Camera is positioned low, looking slightly upward at the base."
            ),
            "motion_desc": "Slow drone pull-back revealing the isolation of the base, snowflakes streaking past the lens.",
            "audio_desc": "[Sound Effect] Howling arctic wind, distant electrical hum of generators."
        },
        {
            "idx": 1,
            "visual_desc": (
                "Medium close-up inside the communications room. Maya sits at a multi-screen console, "
                "her face lit by cool blue monitor glow. Equipment racks fill the background. "
                "On screen: waveform visualisers spike rhythmically. Her expression shifts from boredom to sharp focus. "
                "She reaches for her headset slowly, eyes locked on the screen."
            ),
            "motion_desc": "Slow push-in toward Maya's face as she leans forward, shallow depth of field.",
            "audio_desc": "[Sound Effect] Electronic beeping, rhythmic pulse signal. [Speaker] Maya (hushed): That's not random noise."
        },
        {
            "idx": 2,
            "visual_desc": (
                "Extreme wide shot of the arctic tundra at dawn after the storm. "
                "The landscape is vast, flat, blinding white. A tiny figure — Maya — trudges through knee-deep snow "
                "toward a faint rectangular outline partially buried ahead. "
                "Long blue shadows stretch across the snow. The sky is pale gold and pink."
            ),
            "motion_desc": "Aerial wide shot slowly tilting down toward Maya as she approaches the buried structure.",
            "audio_desc": "[Sound Effect] Soft wind, crunching snow footsteps, quiet orchestral swell."
        }
    ]
})


class StoryboardArtist:
    def __init__(self):
        self.llm = MuAPILLM()

    async def design_storyboard(
        self,
        script: str,
        characters: List[CharacterInScene],
        user_requirement: str,
    ) -> List[ShotBriefDescription]:
        system_prompt = (
            "You are a professional storyboard artist and cinematographer. "
            "Your task is to break a scene script into individual shots suitable for AI video generation. "
            "Each shot should have a clear visual description, camera movement, and audio description. "
            "Keep shots between 3-6 seconds each (they will be 5-second video clips). "
            "Respond ONLY with valid JSON — no markdown, no explanation, just JSON."
        )

        character_descriptions = "\n".join([
            f"- {c.name}: {c.static_features}. Wearing: {c.dynamic_features}"
            for c in characters if c.is_visible
        ])

        prompt = f"""Design a storyboard for this scene script by breaking it into individual shots.

Scene Script:
{script}

Characters in this scene:
{character_descriptions if character_descriptions else "No named characters"}

Style requirement: {user_requirement if user_requirement else "Cinematic, professional"}

Return a JSON object with this exact structure:
{{
  "shots": [
    {{
      "idx": 0,
      "visual_desc": "Detailed visual description of what is seen — location, lighting, characters, composition (100-150 words)",
      "motion_desc": "Camera movement and action for the video prompt (20-50 words)",
      "audio_desc": "Sound design: ambient sounds, music mood, dialogue if any"
    }}
  ]
}}

Rules:
- Create 3-5 shots per scene
- Start with an establishing shot, include action shots, end with a closing shot"""

        raw = await self.llm.complete(
            prompt, system_prompt=system_prompt, timeout=120, fallback=_FALLBACK_STORYBOARD
        )
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        data = json.loads(raw)
        return [ShotBriefDescription(**s) for s in data.get("shots", [])]
