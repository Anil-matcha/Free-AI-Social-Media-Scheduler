from typing import List
from fastapi import APIRouter, HTTPException, status
from app.models.schemas import Page, PageCreate, PageUpdate
from app.services.space_store import store

router = APIRouter(prefix="/spaces/{space_id}/pages", tags=["Pages (Living Documents)"])

@router.get("", response_model=List[Page])
def list_pages(space_id: str):
    if not store.get_space(space_id):
        raise HTTPException(status_code=404, detail="Space not found")
    return store.get_pages(space_id)

@router.post("", response_model=Page, status_code=status.HTTP_201_CREATED)
def create_page(space_id: str, payload: PageCreate):
    page = store.create_page(space_id, payload)
    if not page:
        raise HTTPException(status_code=404, detail="Space not found")
    return page

@router.get("/{page_id}", response_model=Page)
def get_page(space_id: str, page_id: str):
    page = store.get_page(space_id, page_id)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page

@router.patch("/{page_id}", response_model=Page)
def update_page(space_id: str, page_id: str, payload: PageUpdate):
    page = store.update_page(space_id, page_id, payload)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page

@router.delete("/{page_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_page(space_id: str, page_id: str):
    success = store.delete_page(space_id, page_id)
    if not success:
        raise HTTPException(status_code=404, detail="Page not found")
    return None
