from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, status, Query
from app.models.schemas import (
    Space, SpaceCreate, SpaceUpdate, Message, MessageCreate,
    SpaceMemberDetail, SpaceMemberAdd, ActivityItem, ScopedSearchResult
)
from app.services.space_store import store
from app.core.auth import get_current_user, get_optional_current_user, require_space_access
from app.db.models import UserDB

router = APIRouter(prefix="/spaces", tags=["Spaces"])

@router.get("/search", response_model=ScopedSearchResult)
def search_scoped(
    q: str = Query(..., min_length=1),
    current_user: UserDB = Depends(get_current_user)
):
    return store.search_scoped(user_id=current_user.id, query=q)

@router.get("", response_model=List[Space])
def get_spaces(current_user: Optional[UserDB] = Depends(get_optional_current_user)):
    return store.get_all_spaces(user_id=current_user.id if current_user else None)

@router.post("", response_model=Space, status_code=status.HTTP_201_CREATED)
def create_space(payload: SpaceCreate, current_user: UserDB = Depends(get_current_user)):
    return store.create_space(payload, owner_id=current_user.id, owner_name=current_user.name)

@router.get("/{space_id}", response_model=Space)
def get_space(space_id: str, _role: str = Depends(require_space_access(["viewer", "commenter", "editor", "owner"]))):
    space = store.get_space(space_id)
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    return space

@router.patch("/{space_id}", response_model=Space)
def update_space(space_id: str, payload: SpaceUpdate, _role: str = Depends(require_space_access(["editor", "owner"]))):
    space = store.update_space(space_id, payload)
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    return space

@router.delete("/{space_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_space(space_id: str, _role: str = Depends(require_space_access(["owner"]))):
    success = store.delete_space(space_id)
    if not success:
        raise HTTPException(status_code=404, detail="Space not found")
    return None

# --- Members in Space ---
@router.get("/{space_id}/members", response_model=List[SpaceMemberDetail])
def list_space_members(space_id: str, _role: str = Depends(require_space_access(["viewer", "commenter", "editor", "owner"]))):
    return store.get_space_members(space_id)

@router.post("/{space_id}/members", response_model=SpaceMemberDetail, status_code=status.HTTP_201_CREATED)
def add_space_member(
    space_id: str,
    payload: SpaceMemberAdd,
    _role: str = Depends(require_space_access(["editor", "owner"]))
):
    member = store.add_space_member(
        space_id,
        user_id=payload.user_id,
        email=payload.email,
        role=payload.role
    )
    if not member:
        raise HTTPException(status_code=400, detail="Could not add member: user ID or valid email required")
    return member

@router.delete("/{space_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_space_member(
    space_id: str,
    user_id: str,
    _role: str = Depends(require_space_access(["owner"]))
):
    success = store.remove_space_member(space_id, user_id)
    if not success:
        raise HTTPException(status_code=400, detail="Cannot remove space owner or member not found")
    return None

# --- Space Activity Log ---
@router.get("/{space_id}/activity", response_model=List[ActivityItem])
def get_space_activity(
    space_id: str,
    limit: int = Query(50, ge=1, le=100),
    _role: str = Depends(require_space_access(["viewer", "commenter", "editor", "owner"]))
):
    return store.get_space_activities(space_id, limit=limit)

# --- Messages in Space ---
@router.get("/{space_id}/messages", response_model=List[Message])
def get_space_messages(space_id: str, _role: str = Depends(require_space_access(["viewer", "commenter", "editor", "owner"]))):
    return store.get_messages(space_id)

@router.post("/{space_id}/messages", response_model=Message, status_code=status.HTTP_201_CREATED)
def create_space_message(
    space_id: str,
    payload: MessageCreate,
    _role: str = Depends(require_space_access(["commenter", "editor", "owner"]))
):
    msg = store.add_message(space_id, payload)
    if not msg:
        raise HTTPException(status_code=404, detail="Space not found")
    return msg
