import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.db.session import SessionLocal, Base, engine
from app.db.models import (
    OpenSpaceDB, OpenPageDB, OpenAgentDB, OpenMessageDB, OpenMeetingDB,
    UserDB, SpaceMemberDB, PageRevisionDB, OpenCommentDB, OpenActivityDB
)
from app.models.schemas import (
    Space, Page, AgentDot, SpaceMember, Message, MeetingNote,
    SpaceCreate, SpaceUpdate, PageCreate, PageUpdate, MessageCreate, MeetingNoteCreate,
    SpaceMemberDetail, User, PageRevision, Comment, CommentCreate, CommentUpdate,
    ActivityItem, ScopedSearchResult
)

MAX_PAGE_CONTENT_LENGTH = 500_000

class PageConflictError(Exception):
    def __init__(self, current_version: int, page: Page):
        super().__init__(f"Edit conflict: current version is {current_version}")
        self.current_version = current_version
        self.page = page

def check_page_cycle(db: Session, page_id: str, new_parent_id: Optional[str]) -> bool:
    """Returns True if assigning new_parent_id to page_id creates a cycle."""
    if not new_parent_id:
        return False
    if page_id == new_parent_id:
        return True
    current = new_parent_id
    visited = {page_id}
    while current:
        if current in visited:
            return True
        visited.add(current)
        parent_row = db.query(OpenPageDB).filter(OpenPageDB.id == current).first()
        if not parent_row:
            break
        current = parent_row.parent_id
    return False

class SupabaseSpaceService:
    def __init__(self):
        # Ensure schema migrations & tables exist
        try:
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE open_spaces ADD COLUMN IF NOT EXISTS owner_id VARCHAR(64);"))
                conn.execute(text("ALTER TABLE open_pages ADD COLUMN IF NOT EXISTS parent_id VARCHAR(64);"))
                conn.execute(text('ALTER TABLE open_pages ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;'))
                conn.commit()
        except Exception as e:
            print(f"Migration note: {e}")
        Base.metadata.create_all(bind=engine)
        self._seed_default_data_if_empty()

    def _seed_default_data_if_empty(self):
        db: Session = SessionLocal()
        try:
            # 1. Ensure baseline users exist
            u1 = db.query(UserDB).filter(UserDB.id == "usr-1").first()
            if not u1:
                u1 = UserDB(
                    id="usr-1",
                    name="Alex Morgan",
                    email="alex@openspaces.local",
                    avatar="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                )
                db.add(u1)
            u2 = db.query(UserDB).filter(UserDB.id == "usr-2").first()
            if not u2:
                u2 = UserDB(
                    id="usr-2",
                    name="Jordan Lee",
                    email="jordan@openspaces.local",
                    avatar="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                )
                db.add(u2)
            db.commit()

            count = db.query(OpenSpaceDB).count()
            if count > 0:
                # Backfill space_members for existing spaces if needed
                for s in db.query(OpenSpaceDB).all():
                    if not s.owner_id:
                        s.owner_id = "usr-1"
                    m_count = db.query(SpaceMemberDB).filter(SpaceMemberDB.space_id == s.id).count()
                    if m_count == 0:
                        db.add(SpaceMemberDB(
                            id=f"mem-{uuid.uuid4().hex[:8]}",
                            space_id=s.id,
                            user_id="usr-1",
                            role="owner"
                        ))
                db.commit()
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
                owner_id="usr-1",
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
                owner_id="usr-1",
                members=[{"id": "usr-1", "name": "Alex Morgan", "role": "owner"}],
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )

            # Commit spaces first to satisfy foreign key constraints
            db.add(s1)
            db.add(s2)
            db.commit()

            # Seed normalized space members
            db.add(SpaceMemberDB(id=f"mem-{uuid.uuid4().hex[:8]}", space_id=space1_id, user_id="usr-1", role="owner"))
            db.add(SpaceMemberDB(id=f"mem-{uuid.uuid4().hex[:8]}", space_id=space1_id, user_id="usr-2", role="editor"))
            db.add(SpaceMemberDB(id=f"mem-{uuid.uuid4().hex[:8]}", space_id=space2_id, user_id="usr-1", role="owner"))
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
                owner_id=r.owner_id,
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

    def create_space(self, space_data: SpaceCreate, owner_id: str = "usr-1", owner_name: str = "You") -> Space:
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
                owner_id=owner_id,
                members=[{"id": owner_id, "name": owner_name, "role": "owner"}],
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(r)
            # Add normalized membership
            db.add(SpaceMemberDB(
                id=f"mem-{uuid.uuid4().hex[:8]}",
                space_id=space_id,
                user_id=owner_id,
                role="owner"
            ))
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

    def get_space_members(self, space_id: str) -> List[SpaceMemberDetail]:
        db: Session = SessionLocal()
        try:
            records = (
                db.query(SpaceMemberDB, UserDB)
                .join(UserDB, SpaceMemberDB.user_id == UserDB.id)
                .filter(SpaceMemberDB.space_id == space_id)
                .all()
            )
            return [
                SpaceMemberDetail(
                    id=m.id,
                    space_id=m.space_id,
                    user_id=u.id,
                    name=u.name,
                    email=u.email,
                    avatar=u.avatar,
                    role=m.role,
                    created_at=m.created_at,
                )
                for m, u in records
            ]
        finally:
            db.close()

    def add_space_member(self, space_id: str, user_id: Optional[str] = None, email: Optional[str] = None, role: str = "editor") -> Optional[SpaceMemberDetail]:
        db: Session = SessionLocal()
        try:
            user = None
            if user_id:
                user = db.query(UserDB).filter(UserDB.id == user_id).first()
            if not user and email:
                clean_email = email.strip().lower()
                user = db.query(UserDB).filter(UserDB.email == clean_email).first()
                if not user:
                    display_name = clean_email.split("@")[0].replace(".", " ").capitalize()
                    user = UserDB(
                        id=f"usr-{uuid.uuid4().hex[:6]}",
                        name=display_name,
                        email=clean_email,
                        avatar=f"https://api.dicebear.com/7.x/initials/svg?seed={display_name}"
                    )
                    db.add(user)
                    db.flush()
            if not user:
                return None
            space = db.query(OpenSpaceDB).filter(OpenSpaceDB.id == space_id).first()
            if not space:
                return None

            member = db.query(SpaceMemberDB).filter(
                SpaceMemberDB.space_id == space_id,
                SpaceMemberDB.user_id == user.id
            ).first()

            if member:
                member.role = role
                member.updated_at = datetime.utcnow()
            else:
                member = SpaceMemberDB(
                    id=f"mem-{uuid.uuid4().hex[:8]}",
                    space_id=space_id,
                    user_id=user.id,
                    role=role
                )
                db.add(member)

            # Sync cached members list on OpenSpaceDB
            cached = [m for m in (space.members or []) if m.get("id") != user.id]
            cached.append({"id": user.id, "name": user.name, "role": role})
            space.members = cached

            self.record_activity(
                db,
                space_id=space_id,
                user_id=user.id,
                user_name=user.name,
                action_type="member_joined",
                summary=f"{user.name} joined as {role}"
            )

            db.commit()

            return SpaceMemberDetail(
                id=member.id,
                space_id=space_id,
                user_id=user.id,
                name=user.name,
                email=user.email,
                avatar=user.avatar,
                role=role,
                created_at=member.created_at,
            )
        finally:
            db.close()

    def remove_space_member(self, space_id: str, user_id: str) -> bool:
        db: Session = SessionLocal()
        try:
            space = db.query(OpenSpaceDB).filter(OpenSpaceDB.id == space_id).first()
            if not space or space.owner_id == user_id:
                return False  # Cannot remove space owner

            member = db.query(SpaceMemberDB).filter(
                SpaceMemberDB.space_id == space_id,
                SpaceMemberDB.user_id == user_id
            ).first()
            if not member:
                return False

            user = db.query(UserDB).filter(UserDB.id == user_id).first()
            user_name = user.name if user else "Member"

            db.delete(member)
            space.members = [m for m in (space.members or []) if m.get("id") != user_id]

            self.record_activity(
                db,
                space_id=space_id,
                user_id=user_id,
                user_name=user_name,
                action_type="member_removed",
                summary=f"{user_name} was removed from the space"
            )

            db.commit()
            return True
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
            records = db.query(OpenPageDB).filter(OpenPageDB.space_id == space_id).order_by(OpenPageDB.order.asc(), OpenPageDB.created_at.asc()).all()
            return [
                Page(
                    id=p.id,
                    space_id=p.space_id,
                    title=p.title,
                    content=p.content,
                    icon=p.icon,
                    status=p.status,
                    author=p.author,
                    version=p.version or 1,
                    parent_id=p.parent_id,
                    order=p.order or 0,
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
                version=p.version or 1,
                parent_id=p.parent_id,
                order=p.order or 0,
                created_at=p.created_at,
                updated_at=p.updated_at,
            )
        finally:
            db.close()

    def create_page(self, space_id: str, page_data: PageCreate, author: str = "You") -> Optional[Page]:
        db: Session = SessionLocal()
        try:
            space = db.query(OpenSpaceDB).filter(OpenSpaceDB.id == space_id).first()
            if not space:
                return None
            
            if len(page_data.content or "") > MAX_PAGE_CONTENT_LENGTH:
                raise ValueError("Page content exceeds the maximum limit of 500,000 characters.")

            if page_data.parent_id:
                parent_page = db.query(OpenPageDB).filter(OpenPageDB.space_id == space_id, OpenPageDB.id == page_data.parent_id).first()
                if not parent_page:
                    raise ValueError("Specified parent page does not exist in this space.")

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
                parent_id=page_data.parent_id,
                order=page_data.order or 0,
                title=clean_title,
                content=page_data.content or "",
                icon=(page_data.icon or "📄")[:10],
                status=page_data.status or "draft",
                author=author,
                version=1,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(p)

            # Record initial revision snapshot
            rev = PageRevisionDB(
                id=f"rev-{uuid.uuid4().hex[:8]}",
                page_id=page_id,
                space_id=space_id,
                version=1,
                title=clean_title,
                content=page_data.content or "",
                author=author,
                created_at=p.created_at
            )
            db.add(rev)

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
                version=p.version or 1,
                parent_id=p.parent_id,
                order=p.order or 0,
                created_at=p.created_at,
                updated_at=p.updated_at,
            )
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

    def update_page(self, space_id: str, page_id: str, update_data: PageUpdate, author: str = "You") -> Optional[Page]:
        db: Session = SessionLocal()
        try:
            p = db.query(OpenPageDB).filter(OpenPageDB.space_id == space_id, OpenPageDB.id == page_id).first()
            if not p:
                return None

            current_ver = p.version or 1

            # Optimistic Concurrency check
            if update_data.expected_revision is not None and update_data.expected_revision != current_ver:
                current_page = Page(
                    id=p.id,
                    space_id=p.space_id,
                    title=p.title,
                    content=p.content,
                    icon=p.icon,
                    status=p.status,
                    author=p.author,
                    version=current_ver,
                    parent_id=p.parent_id,
                    order=p.order or 0,
                    created_at=p.created_at,
                    updated_at=p.updated_at,
                )
                raise PageConflictError(current_version=current_ver, page=current_page)

            # Content length check
            if update_data.content is not None and len(update_data.content) > MAX_PAGE_CONTENT_LENGTH:
                raise ValueError("Page content exceeds the maximum limit of 500,000 characters.")

            # Hierarchy cycle check
            if update_data.parent_id is not None:
                if update_data.parent_id == "":
                    p.parent_id = None
                elif update_data.parent_id != p.parent_id:
                    parent_page = db.query(OpenPageDB).filter(OpenPageDB.space_id == space_id, OpenPageDB.id == update_data.parent_id).first()
                    if not parent_page:
                        raise ValueError("Target parent page does not exist in this space.")
                    if check_page_cycle(db, page_id, update_data.parent_id):
                        raise ValueError("Hierarchy cycle detected: a page cannot be made a child of itself or its descendants.")
                    p.parent_id = update_data.parent_id

            data = update_data.model_dump(exclude_unset=True)
            data.pop("expected_revision", None)
            data.pop("parent_id", None)

            if "title" in data and data["title"] is not None:
                t = str(data["title"]).strip()
                if len(t) > 200 or "\n" in t:
                    t = t.split("\n")[0].lstrip("#").strip()[:200]
                data["title"] = t or "Untitled page"
            if "icon" in data and data["icon"] is not None:
                data["icon"] = str(data["icon"])[:10]

            for k, v in data.items():
                setattr(p, k, v)

            p.version = current_ver + 1
            p.updated_at = datetime.utcnow()

            # Record revision snapshot
            rev = PageRevisionDB(
                id=f"rev-{uuid.uuid4().hex[:8]}",
                page_id=p.id,
                space_id=space_id,
                version=p.version,
                title=p.title,
                content=p.content,
                author=author or p.author or "You",
                created_at=p.updated_at
            )
            db.add(rev)

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
                parent_id=p.parent_id,
                order=p.order or 0,
                created_at=p.created_at,
                updated_at=p.updated_at,
            )
        except (PageConflictError, ValueError):
            db.rollback()
            raise
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

    def get_page_revisions(self, space_id: str, page_id: str) -> List[PageRevision]:
        db: Session = SessionLocal()
        try:
            revs = db.query(PageRevisionDB).filter(
                PageRevisionDB.space_id == space_id,
                PageRevisionDB.page_id == page_id
            ).order_by(PageRevisionDB.version.desc()).all()
            return [
                PageRevision(
                    id=r.id,
                    page_id=r.page_id,
                    space_id=r.space_id,
                    version=r.version,
                    title=r.title,
                    content=r.content,
                    author=r.author,
                    created_at=r.created_at,
                )
                for r in revs
            ]
        finally:
            db.close()

    def restore_page_revision(self, space_id: str, page_id: str, target_version: int, author: str = "You") -> Optional[Page]:
        db: Session = SessionLocal()
        try:
            p = db.query(OpenPageDB).filter(OpenPageDB.space_id == space_id, OpenPageDB.id == page_id).first()
            if not p:
                return None
            rev = db.query(PageRevisionDB).filter(
                PageRevisionDB.space_id == space_id,
                PageRevisionDB.page_id == page_id,
                PageRevisionDB.version == target_version
            ).first()
            if not rev:
                return None

            p.title = rev.title
            p.content = rev.content
            p.version = (p.version or 1) + 1
            p.updated_at = datetime.utcnow()

            new_rev = PageRevisionDB(
                id=f"rev-{uuid.uuid4().hex[:8]}",
                page_id=p.id,
                space_id=space_id,
                version=p.version,
                title=p.title,
                content=p.content,
                author=f"{author} (restored v{target_version})",
                created_at=p.updated_at
            )
            db.add(new_rev)
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
                parent_id=p.parent_id,
                order=p.order or 0,
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

    # --- Activity Log ---
    def record_activity(
        self,
        db: Session,
        space_id: str,
        user_id: str,
        user_name: str,
        action_type: str,
        summary: str,
        page_id: Optional[str] = None
    ) -> OpenActivityDB:
        act = OpenActivityDB(
            id=f"act-{uuid.uuid4().hex[:8]}",
            space_id=space_id,
            page_id=page_id,
            user_id=user_id,
            user_name=user_name,
            action_type=action_type,
            summary=summary,
            created_at=datetime.utcnow()
        )
        db.add(act)
        return act

    def get_space_activities(self, space_id: str, limit: int = 50) -> List[ActivityItem]:
        db: Session = SessionLocal()
        try:
            records = db.query(OpenActivityDB).filter(
                OpenActivityDB.space_id == space_id
            ).order_by(OpenActivityDB.created_at.desc()).limit(limit).all()
            return [
                ActivityItem(
                    id=a.id,
                    space_id=a.space_id,
                    page_id=a.page_id,
                    user_id=a.user_id,
                    user_name=a.user_name,
                    action_type=a.action_type,
                    summary=a.summary,
                    created_at=a.created_at,
                )
                for a in records
            ]
        finally:
            db.close()

    # --- Comments ---
    def get_page_comments(self, space_id: str, page_id: str) -> List[Comment]:
        db: Session = SessionLocal()
        try:
            records = db.query(OpenCommentDB).filter(
                OpenCommentDB.space_id == space_id,
                OpenCommentDB.page_id == page_id
            ).order_by(OpenCommentDB.created_at.asc()).all()
            return [
                Comment(
                    id=c.id,
                    page_id=c.page_id,
                    space_id=c.space_id,
                    user_id=c.user_id,
                    user_name=c.user_name,
                    user_avatar=c.user_avatar,
                    content=c.content,
                    parent_id=c.parent_id,
                    resolved=c.resolved,
                    created_at=c.created_at,
                    updated_at=c.updated_at,
                )
                for c in records
            ]
        finally:
            db.close()

    def add_comment(
        self,
        space_id: str,
        page_id: str,
        user: User,
        payload: CommentCreate
    ) -> Optional[Comment]:
        db: Session = SessionLocal()
        try:
            page = db.query(OpenPageDB).filter(OpenPageDB.space_id == space_id, OpenPageDB.id == page_id).first()
            if not page:
                return None

            comm = OpenCommentDB(
                id=f"cmt-{uuid.uuid4().hex[:8]}",
                space_id=space_id,
                page_id=page_id,
                user_id=user.id,
                user_name=user.name,
                user_avatar=user.avatar,
                content=payload.content,
                parent_id=payload.parent_id,
                resolved=False,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(comm)

            self.record_activity(
                db,
                space_id=space_id,
                page_id=page_id,
                user_id=user.id,
                user_name=user.name,
                action_type="comment_added",
                summary=f"{user.name} commented on '{page.title}'"
            )
            db.commit()
            db.refresh(comm)
            return Comment(
                id=comm.id,
                page_id=comm.page_id,
                space_id=comm.space_id,
                user_id=comm.user_id,
                user_name=comm.user_name,
                user_avatar=comm.user_avatar,
                content=comm.content,
                parent_id=comm.parent_id,
                resolved=comm.resolved,
                created_at=comm.created_at,
                updated_at=comm.updated_at,
            )
        finally:
            db.close()

    def update_comment(
        self,
        space_id: str,
        page_id: str,
        comment_id: str,
        payload: CommentUpdate,
        user_id: str
    ) -> Optional[Comment]:
        db: Session = SessionLocal()
        try:
            comm = db.query(OpenCommentDB).filter(
                OpenCommentDB.space_id == space_id,
                OpenCommentDB.page_id == page_id,
                OpenCommentDB.id == comment_id
            ).first()
            if not comm:
                return None
            if payload.content is not None and comm.user_id == user_id:
                comm.content = payload.content
            if payload.resolved is not None:
                comm.resolved = payload.resolved
            comm.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(comm)
            return Comment(
                id=comm.id,
                page_id=comm.page_id,
                space_id=comm.space_id,
                user_id=comm.user_id,
                user_name=comm.user_name,
                user_avatar=comm.user_avatar,
                content=comm.content,
                parent_id=comm.parent_id,
                resolved=comm.resolved,
                created_at=comm.created_at,
                updated_at=comm.updated_at,
            )
        finally:
            db.close()

    def delete_comment(
        self,
        space_id: str,
        page_id: str,
        comment_id: str,
        user_id: str
    ) -> bool:
        db: Session = SessionLocal()
        try:
            comm = db.query(OpenCommentDB).filter(
                OpenCommentDB.space_id == space_id,
                OpenCommentDB.page_id == page_id,
                OpenCommentDB.id == comment_id
            ).first()
            if not comm:
                return False
            db.delete(comm)
            db.commit()
            return True
        finally:
            db.close()

    # --- Scoped Search ---
    def search_scoped(self, user_id: str, query: str) -> ScopedSearchResult:
        db: Session = SessionLocal()
        try:
            q = (query or "").strip().lower()
            if not q:
                return ScopedSearchResult(spaces=[], pages=[])

            member_spaces = db.query(SpaceMemberDB.space_id).filter(SpaceMemberDB.user_id == user_id).all()
            allowed_ids = {s[0] for s in member_spaces}

            if not allowed_ids:
                all_s = db.query(OpenSpaceDB.id).all()
                allowed_ids = {s[0] for s in all_s}

            matching_spaces = db.query(OpenSpaceDB).filter(
                OpenSpaceDB.id.in_(allowed_ids),
                (OpenSpaceDB.name.ilike(f"%{q}%") | OpenSpaceDB.description.ilike(f"%{q}%"))
            ).all()

            matching_pages = db.query(OpenPageDB).filter(
                OpenPageDB.space_id.in_(allowed_ids),
                (OpenPageDB.title.ilike(f"%{q}%") | OpenPageDB.content.ilike(f"%{q}%"))
            ).limit(20).all()

            spaces_res = [
                Space(
                    id=s.id,
                    name=s.name,
                    description=s.description,
                    icon=s.icon,
                    color=s.color,
                    pinned=s.pinned,
                    owner_id=s.owner_id,
                    created_at=s.created_at,
                    updated_at=s.updated_at,
                )
                for s in matching_spaces
            ]

            pages_res = [
                Page(
                    id=p.id,
                    space_id=p.space_id,
                    title=p.title,
                    content=p.content,
                    icon=p.icon,
                    status=p.status,
                    author=p.author,
                    version=p.version,
                    parent_id=p.parent_id,
                    order=p.order or 0,
                    created_at=p.created_at,
                    updated_at=p.updated_at,
                )
                for p in matching_pages
            ]

            return ScopedSearchResult(spaces=spaces_res, pages=pages_res)
        finally:
            db.close()

store = SupabaseSpaceService()
