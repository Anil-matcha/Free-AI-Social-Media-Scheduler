from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List

from app.core.config import settings
from app.api.routers import spaces, pages, agents, meetings, chat, images

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="OpenSpaces: An Open-Source ChatGPT Spaces Replication with Pages, Dots (Agents), and Meeting Notes."
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="https?://.*",
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

# --- WebSocket Connection Manager for Real-Time Collaboration ---
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
            self.active_connections[space_id].remove(websocket)
            if not self.active_connections[space_id]:
                del self.active_connections[space_id]

    async def broadcast(self, space_id: str, message: dict):
        if space_id in self.active_connections:
            for connection in self.active_connections[space_id]:
                await connection.send_json(message)

manager = ConnectionManager()

@app.websocket("/ws/spaces/{space_id}")
async def websocket_endpoint(websocket: WebSocket, space_id: str):
    await manager.connect(space_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            # Broadcast to all other collaborators in the space
            await manager.broadcast(space_id, data)
    except WebSocketDisconnect:
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
