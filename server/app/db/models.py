from datetime import datetime
from sqlalchemy import Column, String, Text, Boolean, Integer, DateTime, JSON, ForeignKey
from app.db.session import Base

class OpenSpaceDB(Base):
    __tablename__ = "open_spaces"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, default="")
    icon = Column(String(32), default="📁")
    color = Column(String(32), default="indigo")
    pinned = Column(Boolean, default=False)
    members = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class OpenPageDB(Base):
    __tablename__ = "open_pages"

    id = Column(String(64), primary_key=True, index=True)
    space_id = Column(String(64), ForeignKey("open_spaces.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, default="")
    icon = Column(String(32), default="📄")
    status = Column(String(32), default="draft")
    author = Column(String(100), default="You")
    version = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

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
