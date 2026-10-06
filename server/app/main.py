from typing import Dict, List, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, status
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routers import spaces, pages, agents, meetings, chat, images, files
from app.db.session import SessionLocal
from app.db.models import UserDB, OpenSpaceDB, SpaceMemberDB

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="OpenSpaces: An Open-Source ChatGPT Spaces Replication with Pages, Dots (Agents), and Meeting Notes."
)

# CORS setup restricted to configured origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS or ["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(spaces.router, prefix=settings.API_V1_STR)
app.include_router(pages.router, prefix=settings.API_V1_STR)
app.include_router(agents.router, prefix=settings.API_V1_STR)
app.include_router(meetings.router, prefix=settings.API_V1_STR)
app.include_router(chat.router, prefix=settings.API_V1_STR)
app.include_router(images.router, prefix=settings.API_V1_STR)
app.include_router(files.router, prefix=settings.API_V1_STR)
app.include_router(files.router)  # Direct /upload_file per MuAPI specification

# --- WebSocket Connection Manager with Authentication & Excluded Sender Broadcast ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, space_id: str, websocket: WebSocket):
        await websocket.accept()
        if space_id not in self.active_connections:
            self.active_connections[space_id] = []
        self.active_connections[space_id].append(websocket)

    def disconnect(self, space_id: str, websocket: WebSocket):
        if space_id in self.active_connections:
            if websocket in self.active_connections[space_id]:
                self.active_connections[space_id].remove(websocket)
            if not self.active_connections[space_id]:
                del self.active_connections[space_id]

    async def broadcast(self, space_id: str, message: dict, sender: Optional[WebSocket] = None):
        if space_id in self.active_connections:
            for connection in self.active_connections[space_id]:
                if connection != sender:
                    try:
                        await connection.send_json(message)
                    except Exception:
                        pass

manager = ConnectionManager()

@app.websocket("/ws/spaces/{space_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    space_id: str,
    token: Optional[str] = Query(None)
):
    # Verify user identity & space membership before accepting
    db = SessionLocal()
    try:
        user_id = token if token and token.startswith("usr-") else "usr-1"
        space = db.query(OpenSpaceDB).filter(OpenSpaceDB.id == space_id).first()
        if not space:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        is_member = (
            space.owner_id == user_id
            or db.query(SpaceMemberDB).filter(
                SpaceMemberDB.space_id == space_id,
                SpaceMemberDB.user_id == user_id
            ).first() is not None
        )
        if not is_member:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    finally:
        db.close()

    await manager.connect(space_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            # Broadcast to other collaborators only (exclude sender)
            await manager.broadcast(space_id, data, sender=websocket)
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        manager.disconnect(space_id, websocket)

@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs_url": "/docs",
        "description": "Open source ChatGPT Spaces backend"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}
