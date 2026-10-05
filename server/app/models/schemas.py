from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

# --- Member & Agent Models ---
class SpaceMember(BaseModel):
    id: str
    name: str
    avatar: Optional[str] = None
    role: str = "editor"  # "owner", "editor", "viewer"

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

class PageCreate(PageBase):
    pass

class PageUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    icon: Optional[str] = None
    status: Optional[str] = None

class Page(PageBase):
    id: str
    space_id: str
    author: str = "User"
    version: int = 1
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

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
