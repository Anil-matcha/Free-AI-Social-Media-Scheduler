from pydantic import BaseModel


class CharacterInScene(BaseModel):
    idx: int
    name: str              # e.g. "Alice"
    static_features: str   # hair, build, face — unchanging
    dynamic_features: str  # clothing, accessories for this scene
    is_visible: bool = True
