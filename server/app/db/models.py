from datetime import datetime
from sqlalchemy import Column, String, Text, Boolean, Integer, DateTime, JSON, ForeignKey, UniqueConstraint
from app.db.session import Base

class UserDB(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=True)
    avatar = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class OpenSpaceDB(Base):
    __tablename__ = "open_spaces"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, default="")
    icon = Column(String(32), default="📁")
    color = Column(String(32), default="indigo")
    pinned = Column(Boolean, default=False)
    owner_id = Column(String(64), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    members = Column(JSON, default=list)  # cached/denormalized member list for fast sidebar hydration
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class SpaceMemberDB(Base):
    __tablename__ = "space_members"

    id = Column(String(64), primary_key=True, index=True)
    space_id = Column(String(64), ForeignKey("open_spaces.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(32), default="editor", nullable=False)  # "owner", "editor", "commenter", "viewer"
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("space_id", "user_id", name="uq_space_user"),
    )

class OpenPageDB(Base):
    __tablename__ = "open_pages"

    id = Column(String(64), primary_key=True, index=True)
    space_id = Column(String(64), ForeignKey("open_spaces.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_id = Column(String(64), ForeignKey("open_pages.id", ondelete="SET NULL"), nullable=True, index=True)
    order = Column(Integer, default=0, nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text, default="")
    icon = Column(String(32), default="📄")
    status = Column(String(32), default="draft")
    author = Column(String(100), default="You")
    version = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PageRevisionDB(Base):
    __tablename__ = "page_revisions"

    id = Column(String(64), primary_key=True, index=True)
    page_id = Column(String(64), ForeignKey("open_pages.id", ondelete="CASCADE"), nullable=False, index=True)
    space_id = Column(String(64), ForeignKey("open_spaces.id", ondelete="CASCADE"), nullable=False, index=True)
    version = Column(Integer, nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text, default="")
    author = Column(String(100), default="You")
    created_at = Column(DateTime, default=datetime.utcnow)

class OpenAgentDB(Base):
    __tablename__ = "open_agents"

    id = Column(String(64), primary_key=True, index=True)
    space_id = Column(String(64), ForeignKey("open_spaces.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    role = Column(String(100), default="Assistant")
    avatar = Column(String(32), default="🤖")
    status = Column(String(32), default="idle")
    capabilities = Column(JSON, default=list)
    current_task = Column(Text, nullable=True)

class OpenMessageDB(Base):
    __tablename__ = "open_messages"

    id = Column(String(64), primary_key=True, index=True)
    space_id = Column(String(64), ForeignKey("open_spaces.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_type = Column(String(32), default="user")
    sender_name = Column(String(100), default="You")
    sender_avatar = Column(String(64), nullable=True)
    content = Column(Text, nullable=False)
    referenced_page_id = Column(String(64), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

class OpenMeetingDB(Base):
    __tablename__ = "open_meetings"

    id = Column(String(64), primary_key=True, index=True)
    space_id = Column(String(64), ForeignKey("open_spaces.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    summary = Column(Text, default="")
    transcript = Column(Text, nullable=True)
    action_items = Column(JSON, default=list)
    duration_seconds = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

class OpenCommentDB(Base):
    __tablename__ = "open_comments"

    id = Column(String(64), primary_key=True, index=True)
    page_id = Column(String(64), ForeignKey("open_pages.id", ondelete="CASCADE"), nullable=False, index=True)
    space_id = Column(String(64), ForeignKey("open_spaces.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    user_name = Column(String(100), default="You")
    user_avatar = Column(String(255), nullable=True)
    content = Column(Text, nullable=False)
    parent_id = Column(String(64), ForeignKey("open_comments.id", ondelete="CASCADE"), nullable=True)
    resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class OpenActivityDB(Base):
    __tablename__ = "open_activities"

    id = Column(String(64), primary_key=True, index=True)
    space_id = Column(String(64), ForeignKey("open_spaces.id", ondelete="CASCADE"), nullable=False, index=True)
    page_id = Column(String(64), ForeignKey("open_pages.id", ondelete="CASCADE"), nullable=True, index=True)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    user_name = Column(String(100), default="You")
    action_type = Column(String(64), nullable=False)
    summary = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class OpenSpaceFileDB(Base):
    __tablename__ = "open_space_files"

    id = Column(String(64), primary_key=True, index=True)
    space_id = Column(String(64), ForeignKey("open_spaces.id", ondelete="CASCADE"), nullable=True, index=True)
    name = Column(String(255), nullable=False)
    url = Column(Text, nullable=False)
    size = Column(Integer, default=0)
    content_type = Column(String(128), default="application/octet-stream")
    uploader_id = Column(String(64), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
