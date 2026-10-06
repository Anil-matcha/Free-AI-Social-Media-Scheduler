import uuid
import hashlib
import secrets
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import UserDB, OpenSpaceDB, SpaceMemberDB, OpenPageDB
from app.core.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
    return f"{salt}:{key.hex()}"

def verify_password(password: str, hashed: Optional[str]) -> bool:
    if not hashed:
        return False
    try:
        salt, key_hex = hashed.split(":", 1)
        key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
        return secrets.compare_digest(key.hex(), key_hex)
    except Exception:
        return False

class SignUpRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class UserProfile(BaseModel):
    id: str
    name: str
    email: str
    avatar: Optional[str] = None

class AuthResponse(BaseModel):
    token: str
    user: UserProfile

@router.post("/signup", response_model=AuthResponse)
def signup(payload: SignUpRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    name = payload.name.strip()
    password = payload.password.strip()

    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="A valid email address is required")
    if not name:
        raise HTTPException(status_code=400, detail="Name is required")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    existing = db.query(UserDB).filter(UserDB.email == email).first()
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    user_id = f"usr-{uuid.uuid4().hex[:8]}"
    hashed = hash_password(password)

    # Generate initials-based avatar
    avatar_color = secrets.choice(["6366f1", "8b5cf6", "ec4899", "10b981", "3b82f6", "f59e0b"])
    avatar = f"https://api.dicebear.com/7.x/initials/svg?seed={name}&backgroundColor={avatar_color}"

    new_user = UserDB(
        id=user_id,
        name=name,
        email=email,
        password_hash=hashed,
        avatar=avatar,
        created_at=datetime.utcnow(),
    )
    db.add(new_user)
    db.flush()

    # Create a personal default workspace for the new user
    space_id = f"space-{uuid.uuid4().hex[:8]}"
    default_space = OpenSpaceDB(
        id=space_id,
        name=f"{name}'s Space",
        description="Your personal collaborative AI workspace.",
        icon="🚀",
        color="indigo",
        pinned=True,
        owner_id=user_id,
        members=[{"id": user_id, "name": name, "role": "owner"}],
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(default_space)
    db.flush()

    # Add space membership
    membership = SpaceMemberDB(
        id=f"mem-{uuid.uuid4().hex[:8]}",
        space_id=space_id,
        user_id=user_id,
        role="owner",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(membership)

    # Create a Welcome Page
    welcome_page = OpenPageDB(
        id=f"page-{uuid.uuid4().hex[:8]}",
        space_id=space_id,
        title="Getting Started with OpenSpaces",
        content="""# Welcome to OpenSpaces! 🌌

This is your living collaborative document canvas.

### Quick Tips:
- Press **`/`** anywhere in this editor to invoke slash commands, create tables, or generate text and images.
- Use **Discussion** in the top bar to collaborate with team members and AI assistants.
- Invite teammates via the **Space Members** button in your Space Library.
""",
        icon="✨",
        status="published",
        author=name,
        version=1,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(welcome_page)

    db.commit()
    db.refresh(new_user)

    return AuthResponse(
        token=new_user.id,
        user=UserProfile(
            id=new_user.id,
            name=new_user.name,
            email=new_user.email,
            avatar=new_user.avatar
        )
    )

@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    password = payload.password.strip()

    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    user = db.query(UserDB).filter(UserDB.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return AuthResponse(
        token=user.id,
        user=UserProfile(
            id=user.id,
            name=user.name,
            email=user.email,
            avatar=user.avatar
        )
    )

@router.get("/me", response_model=UserProfile)
def get_me(user: UserDB = Depends(get_current_user)):
    return UserProfile(
        id=user.id,
        name=user.name,
        email=user.email,
        avatar=user.avatar
    )
