import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from app.db.session import SessionLocal, Base, engine
from app.db.models import OpenSpaceDB, OpenPageDB, OpenAgentDB, OpenMessageDB, OpenMeetingDB
from app.models.schemas import Space, Page, AgentDot, SpaceMember, Message, MeetingNote, SpaceCreate, SpaceUpdate, PageCreate, PageUpdate, MessageCreate, MeetingNoteCreate

class SupabaseSpaceService:
    def __init__(self):
        # Ensure tables exist
        Base.metadata.create_all(bind=engine)
        self._seed_default_data_if_empty()

    def _seed_default_data_if_empty(self):
        db: Session = SessionLocal()
        try:
            count = db.query(OpenSpaceDB).count()
            if count > 0:
                return

            space1_id = "space-product-launch"
            space2_id = "space-ai-agents-research"

            # Space 1
            s1 = OpenSpaceDB(
                id=space1_id,
                name="Q4 Product Launch & Strategy",
                description="Collaborative roadmap, competitive research, and live marketing copies with Dot agents.",
                icon="🚀",
                color="indigo",
                pinned=True,
                members=[
                    {"id": "usr-1", "name": "Alex Morgan", "role": "owner"},
                    {"id": "usr-2", "name": "Jordan Lee", "role": "editor"},
                ],
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            # Space 2
            s2 = OpenSpaceDB(
                id=space2_id,
                name="Autonomous Agent Architecture",
                description="Exploration of memory models, tool use, and multi-agent coordination.",
                icon="brain",
                color="emerald",
                pinned=False,
                members=[{"id": "usr-1", "name": "Alex Morgan", "role": "owner"}],
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )

            # Commit spaces first to satisfy foreign key constraints
            db.add(s1)
            db.add(s2)
            db.commit()

            # Space 1 Agents
            dot1 = OpenAgentDB(
                id="dot-1",
                space_id=space1_id,
                name="Synthesizer Dot",
                role="Research & Synthesis",
                avatar="agent-bolt",
                status="idle",
                capabilities=["Web Search", "Competitive Analysis", "Doc Synthesis"],
            )
            dot2 = OpenAgentDB(
                id="dot-2",
                space_id=space1_id,
                name="Copywriter Dot",
                role="Drafting & Tone Polish",
                avatar="agent-pen",
                status="idle",
                capabilities=["Headline Generation", "Technical Copy", "Social Snippets"],
            )
            db.add(dot1)
            db.add(dot2)

            # Pages for Space 1
            p1 = OpenPageDB(
                id="page-101",
                space_id=space1_id,
                title="Executive Launch Plan & Go-To-Market",
                icon="pin",
                status="published",
                author="Alex Morgan",
                version=3,
                content="""# Q4 Executive Launch Plan

## 1. Vision & Strategic Goals
Our objective with **OpenSpaces** is to bridge the gap between static documents and collaborative intelligence. With dedicated **Dots (Autonomous Agents)** working alongside human teams on shared **Pages**, project velocity increases 5x.

### Core Deliverables
- **Live Collaborative Pages**: Real-time editable canvas supporting markdown, tables, and AI inline actions.
- **Autonomous Dot Agents**: Agents that can actively review, draft, cite sources, and update pages.
- **Persistent Knowledge Graph**: Threads and documents retained in context.

## 2. Milestone Timeline
| Milestone | Target Date | Owner | Status |
| :--- | :--- | :--- | :--- |
| Supabase Database Integration | Week 1 | Team Alpha | Completed |
| Next.js App Router UI | Week 1 | Frontend | In Progress |
| Dot Agent Event Loop | Week 2 | AI Core | Scheduled |
| Beta Community Launch | Week 3 | All | Upcoming |
""",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            p2 = OpenPageDB(
                id="page-102",
                space_id=space1_id,
                title="Competitive Analysis & Benchmarks",
                icon="chart",
                status="in_review",
                author="Synthesizer Dot",
                version=1,
                content="""# Competitive Landscape: Spaces & Agent Workspaces

### Key Market Players
1. **ChatGPT Spaces (OpenAI DevDay)**: Deep agent integration ("Dots"), living Pages, meeting voice notes.
2. **Notion AI Workspace**: Database-centric, document-first, limited autonomous background workers.
3. **OpenSpaces**: 100% Open-source, Supabase-backed, self-hostable, Next.js + FastAPI.
""",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(p1)
            db.add(p2)

            # Messages for Space 1
            m1 = OpenMessageDB(
                id="msg-1",
                space_id=space1_id,
                sender_type="user",
                sender_name="Alex Morgan",
                content="Hey team! I started the Q4 Launch Plan page. Let's populate the milestones.",
                timestamp=datetime.utcnow(),
            )
            m2 = OpenMessageDB(
                id="msg-2",
                space_id=space1_id,
                sender_type="agent",
                sender_name="Synthesizer Dot",
                sender_avatar="agent-bolt",
                content="I've analyzed the initial timeline and populated the 'Competitive Analysis & Benchmarks' page for your review.",
                referenced_page_id="page-102",
                timestamp=datetime.utcnow(),
            )
            db.add(m1)
            db.add(m2)

            # Meeting for Space 1
            meet1 = OpenMeetingDB(
                id="meet-1",
                space_id=space1_id,
                title="Q4 Kickoff & Feature Prioritization",
                duration_seconds=1420,
                summary="Discussed the ChatGPT Spaces feature parity: Pages canvas, Dot autonomous agents, meeting audio ingestion, and multiplayer collaboration.",
                action_items=[
                    "Configure Next.js App Router + Tailwind CSS frontend",
                    "Connect FastAPI backend with Supabase PostgreSQL",
                    "Enable live Dot Agent task orchestration",
                ],
                transcript="Alex: Welcome team. Today we are launching OpenSpaces on top of Supabase...",
                created_at=datetime.utcnow(),
            )
            db.add(meet1)

            # Space 2 Agents and Pages
            dot3 = OpenAgentDB(
                id="dot-3",
                space_id=space2_id,
                name="Architect Dot",
                role="Systems Design",
                avatar="agent-ruler",
                status="idle",
                capabilities=["UML Diagramming", "API Spec", "Security Audits"],
            )
            db.add(dot3)

            p3 = OpenPageDB(
                id="page-201",
                space_id=space2_id,
                title="Multi-Agent Memory & Protocol Spec",
                icon="ruler",
                status="draft",
                author="Architect Dot",
                version=1,
                content="""# Multi-Agent Memory & Protocol Spec

## Overview
How Dot agents communicate within a shared Space:
1. **Shared Workspace Context**: Global space state (Pages + Chat history + File attachments).
2. **Agent Event Loop**: Listen to page edit deltas or explicit @mentions.
3. **Database Persistence**: Supabase PostgreSQL handles durable state.
""",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(p3)

            db.commit()
            print("Successfully seeded initial OpenSpaces data into Supabase PostgreSQL!")
        except Exception as e:
            db.rollback()
            print(f"Error seeding Supabase data: {str(e).encode('ascii', 'ignore').decode('ascii')}")
        finally:
            db.close()

    # --- Space Operations ---
    def get_all_spaces(self) -> List[Space]:
        db: Session = SessionLocal()
        try:
            records = db.query(OpenSpaceDB).order_by(OpenSpaceDB.pinned.desc(), OpenSpaceDB.updated_at.desc()).all()
            result = []
            for r in records:
                pages_cnt = db.query(OpenPageDB).filter(OpenPageDB.space_id == r.id).count()
                msgs_cnt = db.query(OpenMessageDB).filter(OpenMessageDB.space_id == r.id).count()
                agent_records = db.query(OpenAgentDB).filter(OpenAgentDB.space_id == r.id).all()
                agents = [
                    AgentDot(
                        id=a.id,
                        name=a.name,
                        role=a.role,
                        avatar=a.avatar,
                        status=a.status,
                        capabilities=a.capabilities or [],
                        current_task=a.current_task,
                    )
                    for a in agent_records
                ]
                members = [SpaceMember(**m) for m in (r.members or [])]

                result.append(
                    Space(
                        id=r.id,
                        name=r.name,
                        description=r.description,
                        icon=r.icon,
                        color=r.color,
                        pinned=r.pinned,
                        members=members,
                        agents=agents,
                        created_at=r.created_at,
                        updated_at=r.updated_at,
                        pages_count=pages_cnt,
                        messages_count=msgs_cnt,
                    )
                )
            return result
        finally:
            db.close()

    def get_space(self, space_id: str) -> Optional[Space]:
        db: Session = SessionLocal()
        try:
            r = db.query(OpenSpaceDB).filter(OpenSpaceDB.id == space_id).first()
            if not r:
                return None
            pages_cnt = db.query(OpenPageDB).filter(OpenPageDB.space_id == r.id).count()
            msgs_cnt = db.query(OpenMessageDB).filter(OpenMessageDB.space_id == r.id).count()
            agent_records = db.query(OpenAgentDB).filter(OpenAgentDB.space_id == r.id).all()
            agents = [
                AgentDot(
                    id=a.id,
                    name=a.name,
                    role=a.role,
                    avatar=a.avatar,
                    status=a.status,
                    capabilities=a.capabilities or [],
                    current_task=a.current_task,
                )
                for a in agent_records
            ]
            members = [SpaceMember(**m) for m in (r.members or [])]
            return Space(
                id=r.id,
                name=r.name,
                description=r.description,
                icon=r.icon,
                color=r.color,
                pinned=r.pinned,
                members=members,
                agents=agents,
                created_at=r.created_at,
                updated_at=r.updated_at,
                pages_count=pages_cnt,
                messages_count=msgs_cnt,
            )
        finally:
            db.close()

    def create_space(self, space_data: SpaceCreate) -> Space:
        db: Session = SessionLocal()
        try:
            space_id = f"space-{uuid.uuid4().hex[:8]}"
            r = OpenSpaceDB(
                id=space_id,
                name=space_data.name,
                description=space_data.description or "",
                icon=space_data.icon or "📁",
                color=space_data.color or "indigo",
                pinned=space_data.pinned or False,
                members=[{"id": "usr-1", "name": "You", "role": "owner"}],
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(r)
            default_agent = OpenAgentDB(
                id=f"dot-{uuid.uuid4().hex[:4]}",
                space_id=space_id,
                name="Synthesizer Dot",
                role="Workspace Assistant",
                avatar="🤖",
                status="idle",
                capabilities=["Document Editing", "Summarization", "Idea Generation"],
            )
            db.add(default_agent)
            db.commit()
            db.refresh(r)
            return self.get_space(space_id)
        finally:
            db.close()

    def update_space(self, space_id: str, update_data: SpaceUpdate) -> Optional[Space]:
        db: Session = SessionLocal()
        try:
            r = db.query(OpenSpaceDB).filter(OpenSpaceDB.id == space_id).first()
            if not r:
                return None
            data = update_data.model_dump(exclude_unset=True)
            for k, v in data.items():
                setattr(r, k, v)
            r.updated_at = datetime.utcnow()
            db.commit()
            return self.get_space(space_id)
        finally:
            db.close()

    def delete_space(self, space_id: str) -> bool:
        db: Session = SessionLocal()
        try:
            r = db.query(OpenSpaceDB).filter(OpenSpaceDB.id == space_id).first()
            if not r:
                return False
            db.delete(r)
            db.commit()
            return True
        finally:
            db.close()

    # --- Page Operations ---
    def get_pages(self, space_id: str) -> List[Page]:
        db: Session = SessionLocal()
        try:
            records = db.query(OpenPageDB).filter(OpenPageDB.space_id == space_id).order_by(OpenPageDB.updated_at.desc()).all()
            return [
                Page(
                    id=p.id,
                    space_id=p.space_id,
                    title=p.title,
                    content=p.content,
                    icon=p.icon,
                    status=p.status,
                    author=p.author,
                    version=p.version,
                    created_at=p.created_at,
                    updated_at=p.updated_at,
                )
                for p in records
            ]
        finally:
            db.close()

    def get_page(self, space_id: str, page_id: str) -> Optional[Page]:
        db: Session = SessionLocal()
        try:
            p = db.query(OpenPageDB).filter(OpenPageDB.space_id == space_id, OpenPageDB.id == page_id).first()
            if not p:
                return None
            return Page(
                id=p.id,
                space_id=p.space_id,
                title=p.title,
                content=p.content,
                icon=p.icon,
                status=p.status,
                author=p.author,
                version=p.version,
                created_at=p.created_at,
                updated_at=p.updated_at,
            )
        finally:
            db.close()

    def create_page(self, space_id: str, page_data: PageCreate) -> Optional[Page]:
        db: Session = SessionLocal()
        try:
            space = db.query(OpenSpaceDB).filter(OpenSpaceDB.id == space_id).first()
            if not space:
                return None
            page_id = f"page-{uuid.uuid4().hex[:8]}"
            
            raw_title = (page_data.title or "Untitled page").strip()
            if len(raw_title) > 200 or "\n" in raw_title:
                first_line = raw_title.split("\n")[0].lstrip("#").strip()
                clean_title = (first_line or "Untitled page")[:200]
            else:
                clean_title = raw_title[:200]

            p = OpenPageDB(
                id=page_id,
                space_id=space_id,
                title=clean_title,
                content=page_data.content or "",
                icon=(page_data.icon or "📄")[:10],
                status=page_data.status or "draft",
                author="You",
                version=1,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(p)
            db.commit()
            db.refresh(p)
            return Page(
                id=p.id,
                space_id=p.space_id,
                title=p.title,
                content=p.content,
                icon=p.icon,
                status=p.status,
                author=p.author,
                version=p.version,
                created_at=p.created_at,
                updated_at=p.updated_at,
            )
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

    def update_page(self, space_id: str, page_id: str, update_data: PageUpdate) -> Optional[Page]:
        db: Session = SessionLocal()
        try:
            p = db.query(OpenPageDB).filter(OpenPageDB.space_id == space_id, OpenPageDB.id == page_id).first()
            if not p:
                return None
            data = update_data.model_dump(exclude_unset=True)
            if "title" in data and data["title"] is not None:
                t = str(data["title"]).strip()
                if len(t) > 200 or "\n" in t:
                    t = t.split("\n")[0].lstrip("#").strip()[:200]
                data["title"] = t or "Untitled page"
            if "icon" in data and data["icon"] is not None:
                data["icon"] = str(data["icon"])[:10]
            for k, v in data.items():
                setattr(p, k, v)
            p.version = (p.version or 1) + 1
            p.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(p)
            return Page(
                id=p.id,
                space_id=p.space_id,
                title=p.title,
                content=p.content,
                icon=p.icon,
                status=p.status,
                author=p.author,
                version=p.version,
                created_at=p.created_at,
                updated_at=p.updated_at,
            )
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

    def delete_page(self, space_id: str, page_id: str) -> bool:
        db: Session = SessionLocal()
        try:
            p = db.query(OpenPageDB).filter(OpenPageDB.space_id == space_id, OpenPageDB.id == page_id).first()
            if not p:
                return False
            db.delete(p)
            db.commit()
            return True
        finally:
            db.close()

    # --- Message Operations ---
    def get_messages(self, space_id: str) -> List[Message]:
        db: Session = SessionLocal()
        try:
            records = db.query(OpenMessageDB).filter(OpenMessageDB.space_id == space_id).order_by(OpenMessageDB.timestamp.asc()).all()
            return [
                Message(
                    id=m.id,
                    space_id=m.space_id,
                    sender_type=m.sender_type,
                    sender_name=m.sender_name,
                    sender_avatar=m.sender_avatar,
                    content=m.content,
                    referenced_page_id=m.referenced_page_id,
                    timestamp=m.timestamp,
                )
                for m in records
            ]
        finally:
            db.close()

    def add_message(self, space_id: str, msg_data: MessageCreate) -> Optional[Message]:
        db: Session = SessionLocal()
        try:
            space = db.query(OpenSpaceDB).filter(OpenSpaceDB.id == space_id).first()
            if not space:
                return None
            msg_id = f"msg-{uuid.uuid4().hex[:8]}"
            m = OpenMessageDB(
                id=msg_id,
                space_id=space_id,
                sender_type=msg_data.sender_type,
                sender_name=msg_data.sender_name,
                sender_avatar=msg_data.sender_avatar,
                content=msg_data.content,
                referenced_page_id=msg_data.referenced_page_id,
                timestamp=datetime.utcnow(),
            )
            db.add(m)
            space.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(m)
            return Message(
                id=m.id,
                space_id=m.space_id,
                sender_type=m.sender_type,
                sender_name=m.sender_name,
                sender_avatar=m.sender_avatar,
                content=m.content,
                referenced_page_id=m.referenced_page_id,
                timestamp=m.timestamp,
            )
        finally:
            db.close()

    # --- Meeting Operations ---
    def get_meetings(self, space_id: str) -> List[MeetingNote]:
        db: Session = SessionLocal()
        try:
            records = db.query(OpenMeetingDB).filter(OpenMeetingDB.space_id == space_id).order_by(OpenMeetingDB.created_at.desc()).all()
            return [
                MeetingNote(
                    id=mt.id,
                    space_id=mt.space_id,
                    title=mt.title,
                    summary=mt.summary,
                    transcript=mt.transcript,
                    action_items=mt.action_items or [],
                    duration_seconds=mt.duration_seconds,
                    created_at=mt.created_at,
                )
                for mt in records
            ]
        finally:
            db.close()

    def create_meeting(self, space_id: str, meeting_data: MeetingNoteCreate) -> Optional[MeetingNote]:
        db: Session = SessionLocal()
        try:
            space = db.query(OpenSpaceDB).filter(OpenSpaceDB.id == space_id).first()
            if not space:
                return None
            meet_id = f"meet-{uuid.uuid4().hex[:8]}"
            mt = OpenMeetingDB(
                id=meet_id,
                space_id=space_id,
                title=meeting_data.title,
                summary=meeting_data.summary,
                transcript=meeting_data.transcript,
                action_items=meeting_data.action_items or [],
                duration_seconds=meeting_data.duration_seconds,
                created_at=datetime.utcnow(),
            )
            db.add(mt)
            space.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(mt)
            return MeetingNote(
                id=mt.id,
                space_id=mt.space_id,
                title=mt.title,
                summary=mt.summary,
                transcript=mt.transcript,
                action_items=mt.action_items or [],
                duration_seconds=mt.duration_seconds,
                created_at=mt.created_at,
            )
        finally:
            db.close()

store = SupabaseSpaceService()
