from typing import List
from fastapi import APIRouter, HTTPException, status
from app.models.schemas import MeetingNote, MeetingNoteCreate
from app.services.space_store import store

router = APIRouter(prefix="/spaces/{space_id}/meetings", tags=["Meeting Audio & Notes"])

@router.get("", response_model=List[MeetingNote])
def get_meetings(space_id: str):
    space = store.get_space(space_id)
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    return store.get_meetings(space_id)

@router.post("", response_model=MeetingNote, status_code=status.HTTP_201_CREATED)
def create_meeting(space_id: str, payload: MeetingNoteCreate):
    note = store.create_meeting(space_id, payload)
    if not note:
        raise HTTPException(status_code=404, detail="Space not found")
    return note
