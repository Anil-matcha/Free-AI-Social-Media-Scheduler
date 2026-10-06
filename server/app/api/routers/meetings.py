from typing import List
from fastapi import APIRouter, HTTPException, Depends, status
from app.models.schemas import MeetingNote, MeetingNoteCreate
from app.services.space_store import store
from app.core.auth import require_space_access

router = APIRouter(prefix="/spaces/{space_id}/meetings", tags=["Meeting Audio & Notes"])

@router.get("", response_model=List[MeetingNote])
def get_meetings(
    space_id: str,
    _role: str = Depends(require_space_access(["viewer", "commenter", "editor", "owner"]))
):
    space = store.get_space(space_id)
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    return store.get_meetings(space_id)

@router.post("", response_model=MeetingNote, status_code=status.HTTP_201_CREATED)
def create_meeting(
    space_id: str,
    payload: MeetingNoteCreate,
    _role: str = Depends(require_space_access(["editor", "owner"]))
):
    note = store.create_meeting(space_id, payload)
    if not note:
        raise HTTPException(status_code=404, detail="Space not found")
    return note
