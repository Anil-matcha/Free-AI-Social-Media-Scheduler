from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

# --- User & Member Models ---
class UserBase(BaseModel):
    name: str
    email: str
    avatar: Optional[str] = None

class User(UserBase):
    id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SpaceMember(BaseModel):
    id: str
    name: str
    avatar: Optional[str] = None
    role: str = "editor"  # "owner", "editor", "commenter", "viewer"

class SpaceMemberDetail(BaseModel):
    id: str
    space_id: str
    user_id: str
    name: str
    email: str
    avatar: Optional[str] = None
    role: str = "editor"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SpaceMemberAdd(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None
    role: str = "editor"

class AgentDot(BaseModel):
    id: str
    name: str
    role: str = "Research & Synthesis"
    avatar: str = "🤖"
    status: str = "idle"  # "idle", "working", "completed", "error"
    capabilities: List[str] = []
    current_task: Optional[str] = None

# --- Page (Living Document) Models ---
class PageBase(BaseModel):
    title: str
    content: str = ""
    icon: Optional[str] = "📄"
    status: str = "draft"  # "draft", "in_review", "published"
    parent_id: Optional[str] = None
    order: Optional[int] = 0

class PageCreate(PageBase):
    pass

class PageUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    icon: Optional[str] = None
    status: Optional[str] = None
    parent_id: Optional[str] = None
    order: Optional[int] = None
    expected_revision: Optional[int] = None

class Page(PageBase):
    id: str
    space_id: str
    author: str = "User"
    version: int = 1
    parent_id: Optional[str] = None
    order: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class PageRevision(BaseModel):
    id: str
    page_id: str
    space_id: str
    version: int
    title: str
    content: str = ""
    author: str = "You"
    created_at: datetime = Field(default_factory=datetime.utcnow)

# --- Chat & Context Threads ---
class MessageBase(BaseModel):
    content: str
    sender_type: str = "user"  # "user", "agent", "assistant"
    sender_name: str = "You"
    sender_avatar: Optional[str] = None
    referenced_page_id: Optional[str] = None

class MessageCreate(MessageBase):
    pass

class Message(MessageBase):
    id: str
    space_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# --- Meeting Recording / Notes ---
class MeetingNoteBase(BaseModel):
    title: str
    summary: str
    transcript: Optional[str] = None
    action_items: List[str] = []
    duration_seconds: int = 0

class MeetingNoteCreate(MeetingNoteBase):
    pass

class MeetingNote(MeetingNoteBase):
    id: str
    space_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

# --- Space Models ---
class SpaceBase(BaseModel):
    name: str
    description: Optional[str] = ""
    icon: str = "📁"
    color: str = "indigo"  # "indigo", "emerald", "amber", "rose", "sky", "violet"
    pinned: bool = False

class SpaceCreate(SpaceBase):
    pass

class SpaceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    pinned: Optional[bool] = None

class Space(SpaceBase):
    id: str
    owner_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    members: List[SpaceMember] = []
    agents: List[AgentDot] = []
    pages_count: int = 0
    messages_count: int = 0

# --- Agent Run Request ---
class AgentRunRequest(BaseModel):
    agent_id: Optional[str] = None
    prompt: str
    target_page_id: Optional[str] = None
    context_data: Optional[Dict[str, Any]] = None

# --- Comments & Activity ---
class CommentBase(BaseModel):
    content: str
    parent_id: Optional[str] = None

class CommentCreate(CommentBase):
    pass

class CommentUpdate(BaseModel):
    content: Optional[str] = None
    resolved: Optional[bool] = None

class Comment(CommentBase):
    id: str
    page_id: str
    space_id: str
    user_id: str
    user_name: str
    user_avatar: Optional[str] = None
    resolved: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ActivityItem(BaseModel):
    id: str
    space_id: str
    page_id: Optional[str] = None
    user_id: str
    user_name: str
    action_type: str
    summary: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ScopedSearchResult(BaseModel):
    spaces: List[Space] = []
    pages: List[Page] = []

class FileUploadResponse(BaseModel):
    url: str
    filename: Optional[str] = None
    size: Optional[int] = None
    content_type: Optional[str] = None

class SpaceFileItem(BaseModel):
    id: str
    space_id: Optional[str] = None
    name: str
    url: str
    size: int
    content_type: str
    uploader_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
