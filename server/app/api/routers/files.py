import os
import uuid
import httpx
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, Header, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.auth import get_current_user, require_space_access
from app.db.session import get_db
from app.db.models import UserDB, OpenSpaceDB, OpenSpaceFileDB, OpenActivityDB
from app.models.schemas import FileUploadResponse, SpaceFileItem

router = APIRouter(tags=["Files & Media Uploads"])

MUAPI_UPLOAD_URL = "https://api.muapi.ai/api/v1/upload_file"

def get_uploader_identity(
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    authorization: Optional[str] = Header(None),
    x_api_key: Optional[str] = Header(None, alias="x-api-key"),
    db: Session = Depends(get_db)
) -> Optional[UserDB]:
    """
    Flexible identity resolver:
    1. If X-User-Id or Authorization provided, resolves verified UserDB.
    2. If x-api-key header provided matching configured MUAPI key, grants service access.
    3. Defaults to None if called anonymously.
    """
    if x_user_id or (authorization and authorization.startswith("Bearer ")):
        try:
            return get_current_user(x_user_id=x_user_id, authorization=authorization, db=db)
        except HTTPException:
            pass

    key_candidate = x_api_key or (authorization[7:].strip() if authorization and authorization.startswith("Bearer ") else None)
    if key_candidate and settings.MUAPI_API_KEY and key_candidate == settings.MUAPI_API_KEY:
        # Verified via API key directly
        return db.query(UserDB).first()

    return None

async def _forward_upload_to_muapi(
    file: UploadFile,
    space_id: Optional[str] = None,
    current_user: Optional[UserDB] = None,
    db: Optional[Session] = None
) -> dict:
    """
    Validates file payload size and forwards multipart upload directly to MuAPI upload_file endpoint.
    """
    # 1. Read file contents
    contents = await file.read()
    file_size = len(contents)

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty"
        )

    # 2. Check size limits per MuAPI documentation:
    #    - Images: 10MB
    #    - Videos: 50MB
    #    - Others: 10MB
    content_type = file.content_type or "application/octet-stream"
    is_video = content_type.startswith("video/")
    max_bytes = 50 * 1024 * 1024 if is_video else 10 * 1024 * 1024

    if file_size > max_bytes:
        limit_desc = "50MB" if is_video else "10MB"
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds the {limit_desc} limit ({file_size / (1024 * 1024):.2f}MB)"
        )

    # 3. Retrieve MuAPI Key strictly from environment configuration
    from dotenv import load_dotenv
    load_dotenv(override=True)
    muapi_key = os.getenv("MUAPI_API_KEY") or settings.MUAPI_API_KEY
    if not muapi_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="MUAPI_API_KEY is not configured in environment"
        )

    # 4. Stream multipart form data to MuAPI upload_file
    files_payload = {
        "file": (file.filename or "upload.bin", contents, content_type)
    }
    req_headers = {
        "x-api-key": muapi_key,
        "Authorization": f"Bearer {muapi_key}",
    }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(MUAPI_UPLOAD_URL, headers=req_headers, files=files_payload)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to connect to MuAPI upload service: {str(e)}"
        )

    if resp.status_code not in (200, 201):
        err_msg = resp.text
        try:
            err_json = resp.json()
            err_msg = err_json.get("error", {}).get("message") or err_json.get("detail") or resp.text
        except Exception:
            pass
        raise HTTPException(
            status_code=resp.status_code if resp.status_code < 500 else status.HTTP_502_BAD_GATEWAY,
            detail=f"MuAPI upload failed (HTTP {resp.status_code}): {err_msg}"
        )

    data = resp.json()
    hosted_url = data.get("url") or data.get("file_url") or (data.get("data") or {}).get("url")
    if not hosted_url:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"MuAPI upload response missing 'url' key: {data}"
        )

    # 5. If space_id provided and db available, persist file record and log audit activity
    if space_id and db:
        space = db.query(OpenSpaceDB).filter(OpenSpaceDB.id == space_id).first()
        if space:
            file_id = f"file-{uuid.uuid4().hex[:8]}"
            file_record = OpenSpaceFileDB(
                id=file_id,
                space_id=space_id,
                name=file.filename or "uploaded_file",
                url=hosted_url,
                size=file_size,
                content_type=content_type,
                uploader_id=current_user.id if current_user else None,
            )
            db.add(file_record)

            activity = OpenActivityDB(
                id=f"act-{uuid.uuid4().hex[:8]}",
                space_id=space_id,
                user_id=current_user.id if current_user else "usr-1",
                user_name=current_user.name if current_user else "You",
                action_type="file_uploaded",
                summary=f"Uploaded file '{file.filename}' ({content_type})",
            )
            db.add(activity)
            db.commit()

    return {
        "url": hosted_url,
        "filename": file.filename or "upload.bin",
        "size": file_size,
        "content_type": content_type,
    }


# -------------------------------------------------------------
# 1. Direct File Upload (POST /upload_file & POST /upload)
# -------------------------------------------------------------
@router.post("/upload_file", response_model=FileUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_file_direct(
    file: UploadFile = File(...),
    space_id: Optional[str] = Form(None),
    current_user: Optional[UserDB] = Depends(get_uploader_identity),
    db: Session = Depends(get_db)
):
    """
    Direct file upload endpoint conforming to MuAPI documentation:
    POST /upload_file
    Accepts multipart/form-data with 'file'.
    Returns { "url": "https://..." }
    """
    return await _forward_upload_to_muapi(file=file, space_id=space_id, current_user=current_user, db=db)


@router.post("/upload", response_model=FileUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_file_alias(
    file: UploadFile = File(...),
    space_id: Optional[str] = Form(None),
    current_user: Optional[UserDB] = Depends(get_uploader_identity),
    db: Session = Depends(get_db)
):
    """
    RESTful alias: POST /api/upload
    """
    return await _forward_upload_to_muapi(file=file, space_id=space_id, current_user=current_user, db=db)


# -------------------------------------------------------------
# 2. Space-Scoped File Endpoints
# -------------------------------------------------------------
@router.post(
    "/spaces/{space_id}/files/upload",
    response_model=FileUploadResponse,
    status_code=status.HTTP_201_CREATED
)
async def upload_space_file(
    space_id: str,
    file: UploadFile = File(...),
    _role: str = Depends(require_space_access(["editor", "owner"])),
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a media asset or attachment directly into a Space with role validation.
    """
    return await _forward_upload_to_muapi(file=file, space_id=space_id, current_user=current_user, db=db)


@router.get(
    "/spaces/{space_id}/files",
    response_model=List[SpaceFileItem]
)
def list_space_files(
    space_id: str,
    _role: str = Depends(require_space_access(["viewer", "commenter", "editor", "owner"])),
    db: Session = Depends(get_db)
):
    """
    List all uploaded files attached to a Space.
    """
    files = db.query(OpenSpaceFileDB).filter(OpenSpaceFileDB.space_id == space_id).order_by(OpenSpaceFileDB.created_at.desc()).all()
    return files


@router.delete(
    "/spaces/{space_id}/files/{file_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_space_file(
    space_id: str,
    file_id: str,
    _role: str = Depends(require_space_access(["editor", "owner"])),
    db: Session = Depends(get_db)
):
    """
    Remove an uploaded file record from a Space.
    """
    file_record = db.query(OpenSpaceFileDB).filter(
        OpenSpaceFileDB.id == file_id,
        OpenSpaceFileDB.space_id == space_id
    ).first()
    if not file_record:
        raise HTTPException(status_code=404, detail="File record not found")
    db.delete(file_record)
    db.commit()
    return None
