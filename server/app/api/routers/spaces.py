from typing import List
from fastapi import APIRouter, HTTPException, status
from app.models.schemas import Space, SpaceCreate, SpaceUpdate, Message, MessageCreate
from app.services.space_store import store

router = APIRouter(prefix="/spaces", tags=["Spaces"])

@router.get("", response_model=List[Space])
def get_spaces():
    return store.get_all_spaces()

@router.post("", response_model=Space, status_code=status.HTTP_201_CREATED)
def create_space(payload: SpaceCreate):
    return store.create_space(payload)

@router.get("/{space_id}", response_model=Space)
def get_space(space_id: str):
    space = store.get_space(space_id)
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    return space

@router.patch("/{space_id}", response_model=Space)
def update_space(space_id: str, payload: SpaceUpdate):
    space = store.update_space(space_id, payload)
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    return space

@router.delete("/{space_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_space(space_id: str):
    success = store.delete_space(space_id)
    if not success:
        raise HTTPException(status_code=404, detail="Space not found")
    return None

# --- Messages in Space ---
@router.get("/{space_id}/messages", response_model=List[Message])
def get_space_messages(space_id: str):
    space = store.get_space(space_id)
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    return store.get_messages(space_id)

@router.post("/{space_id}/messages", response_model=Message, status_code=status.HTTP_201_CREATED)
def create_space_message(space_id: str, payload: MessageCreate):
    msg = store.add_message(space_id, payload)
    if not msg:
        raise HTTPException(status_code=404, detail="Space not found")
    return msg
