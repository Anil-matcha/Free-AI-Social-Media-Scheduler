import os
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(env_path)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import agent_proxy

app = FastAPI(title="Vibe-Agents API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(agent_proxy.router, prefix="/api", tags=["proxy"])

@app.get("/")
async def root():
    return {"message": "Welcome to Vibe-Agents API"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}
