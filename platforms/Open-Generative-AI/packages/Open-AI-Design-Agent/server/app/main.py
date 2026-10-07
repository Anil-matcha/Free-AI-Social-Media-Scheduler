import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import creative_agent_router

app = FastAPI(title="Creative Agent Proxy API", version="1.0.0")

app.include_router(creative_agent_router.router, prefix="/api/v1/creative-agent", tags=["creative-agent"])
app.include_router(creative_agent_router.app_router, prefix="/api/v1", tags=["app"])

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to Creative Agent Proxy API"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}
