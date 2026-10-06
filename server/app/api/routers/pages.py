from typing import List
from fastapi import APIRouter, HTTPException, Depends, status
from app.models.schemas import Page, PageCreate, PageUpdate, PageRevision, Comment, CommentCreate, CommentUpdate
from app.services.space_store import store, PageConflictError
from app.core.auth import require_space_access, get_current_user

router = APIRouter(prefix="/spaces/{space_id}/pages", tags=["Pages (Living Documents)"])

@router.get("", response_model=List[Page])
def list_pages(
    space_id: str,
    _role: str = Depends(require_space_access(["viewer", "commenter", "editor", "owner"]))
):
    return store.get_pages(space_id)

@router.post("", response_model=Page, status_code=status.HTTP_201_CREATED)
def create_page(
    space_id: str,
    payload: PageCreate,
    user = Depends(get_current_user),
    _role: str = Depends(require_space_access(["editor", "owner"]))
):
    try:
        page = store.create_page(space_id, payload, author=user.name)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    if not page:
        raise HTTPException(status_code=404, detail="Space not found")
    return page

@router.get("/{page_id}", response_model=Page)
def get_page(
    space_id: str,
    page_id: str,
    _role: str = Depends(require_space_access(["viewer", "commenter", "editor", "owner"]))
):
    page = store.get_page(space_id, page_id)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page

@router.patch("/{page_id}", response_model=Page)
def update_page(
    space_id: str,
    page_id: str,
    payload: PageUpdate,
    user = Depends(get_current_user),
    _role: str = Depends(require_space_access(["editor", "owner"]))
):
    try:
        page = store.update_page(space_id, page_id, payload, author=user.name)
    except PageConflictError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": "Edit conflict: this page was modified elsewhere.",
                "current_version": e.current_version,
                "current_page": e.page.model_dump(mode="json"),
            }
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page

@router.get("/{page_id}/revisions", response_model=List[PageRevision])
def get_page_revisions(
    space_id: str,
    page_id: str,
    _role: str = Depends(require_space_access(["viewer", "commenter", "editor", "owner"]))
):
    return store.get_page_revisions(space_id, page_id)

@router.post("/{page_id}/revisions/{version}/restore", response_model=Page)
def restore_page_revision(
    space_id: str,
    page_id: str,
    version: int,
    user = Depends(get_current_user),
    _role: str = Depends(require_space_access(["editor", "owner"]))
):
    page = store.restore_page_revision(space_id, page_id, version, author=user.name)
    if not page:
        raise HTTPException(status_code=404, detail="Page or target revision not found")
    return page

@router.delete("/{page_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_page(
    space_id: str,
    page_id: str,
    _role: str = Depends(require_space_access(["editor", "owner"]))
):
    success = store.delete_page(space_id, page_id)
    if not success:
        raise HTTPException(status_code=404, detail="Page not found")
    return None

# --- Comments on Page ---
@router.get("/{page_id}/comments", response_model=List[Comment])
def get_page_comments(
    space_id: str,
    page_id: str,
    _role: str = Depends(require_space_access(["viewer", "commenter", "editor", "owner"]))
):
    return store.get_page_comments(space_id, page_id)

@router.post("/{page_id}/comments", response_model=Comment, status_code=status.HTTP_201_CREATED)
def add_page_comment(
    space_id: str,
    page_id: str,
    payload: CommentCreate,
    user = Depends(get_current_user),
    _role: str = Depends(require_space_access(["commenter", "editor", "owner"]))
):
    comment = store.add_comment(space_id, page_id, user, payload)
    if not comment:
        raise HTTPException(status_code=404, detail="Page not found")
    return comment

@router.patch("/{page_id}/comments/{comment_id}", response_model=Comment)
def update_page_comment(
    space_id: str,
    page_id: str,
    comment_id: str,
    payload: CommentUpdate,
    user = Depends(get_current_user),
    _role: str = Depends(require_space_access(["commenter", "editor", "owner"]))
):
    comment = store.update_comment(space_id, page_id, comment_id, payload, user_id=user.id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    return comment

@router.delete("/{page_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_page_comment(
    space_id: str,
    page_id: str,
    comment_id: str,
    user = Depends(get_current_user),
    _role: str = Depends(require_space_access(["commenter", "editor", "owner"]))
):
    success = store.delete_comment(space_id, page_id, comment_id, user_id=user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Comment not found")
    return None
