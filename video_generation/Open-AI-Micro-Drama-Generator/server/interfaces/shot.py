from typing import Optional
from pydantic import BaseModel


class ShotBriefDescription(BaseModel):
    idx: int
    visual_desc: str   # full scene visual description
    motion_desc: str   # camera movement and action motion for video prompt
    audio_desc: str    # sound effects / dialogue


class ShotDescription(ShotBriefDescription):
    first_frame_url: Optional[str] = None
    video_url: Optional[str] = None
