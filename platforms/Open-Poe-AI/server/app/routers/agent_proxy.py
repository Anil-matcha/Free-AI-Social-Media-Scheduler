from fastapi import APIRouter, Request, HTTPException
from app.utils.agent_helper import proxy_request
from typing import Optional
import os

router = APIRouter()
MUAPI_BASE_URL = os.getenv("MUAPI_BASE_URL", "https://api.muapi.ai")
# --- Agent Library Endpoints ---

@router.get("/agents/user/agents")
async def get_user_agents():
    return await proxy_request("GET", "/agents/user/agents")

@router.get("/agents/templates/agents")
async def get_template_agents():
    return await proxy_request("GET", "/agents/templates/agents")

@router.get("/agents/featured/agents")
async def get_featured_agents():
    return await proxy_request("GET", "/agents/featured/agents")

@router.post("/agents/suggest")
async def get_suggested_agents(request: Request):
    payload = await request.json()
    return await proxy_request("POST", "/agents/suggest", payload=payload)

@router.post("/agents")
async def create_agent(request: Request):
    payload = await request.json()
    return await proxy_request("POST", "/agents", payload=payload)

# --- Agent Detail & Chat Endpoints ---
@router.get("/agents/skills")
async def get_agent_skills():
    return await proxy_request("GET", f"/agents/skills")

@router.get("/agents/by-slug/{slug}")
async def get_agent_by_slug(slug: str):
    return await proxy_request("GET", f"/agents/by-slug/{slug}")

@router.get("/agents/{slug}/profile")
async def get_agent_profile(slug: str):
    return await proxy_request("GET", f"/agents/{slug}/profile")

@router.put("/agents/by-slug/{slug}")
async def update_agent_by_slug(slug: str, request: Request):
    payload = await request.json()
    return await proxy_request("PUT", f"/agents/by-slug/{slug}", payload=payload)

@router.post("/agents/by-slug/{slug}/chat")
async def agent_chat(slug: str, request: Request):
    payload = await request.json()
    return await proxy_request("POST", f"/agents/by-slug/{slug}/chat", payload=payload)

@router.post("/agents/by-slug/{slug}/like")
async def like_agent(slug: str, request: Request):
    params = dict(request.query_params)
    return await proxy_request("POST", f"/agents/by-slug/{slug}/like", params=params)

@router.get("/agents/by-slug/{slug}/{conv_id}")
async def get_conversation_history(slug: str, conv_id: str):
    return await proxy_request("GET", f"/agents/by-slug/{slug}/{conv_id}")

@router.post("/agents/by-slug/{slug}/preview-realign")
async def get_agent_preview(slug: str, request: Request):
    payload = await request.json()
    return await proxy_request("POST", f"/agents/by-slug/{slug}/preview-realign", payload=payload)

# --- Prediction & Image Gen Endpoints ---

@router.get("/api/v1/predictions/{request_id}/result")
async def get_prediction_result(request_id: str):
    return await proxy_request("GET", f"/api/v1/predictions/{request_id}/result")

@router.post("/api/v1/flux-schnell-image")
async def generate_flux_image(request: Request):
    payload = await request.json()
    return await proxy_request("POST", "/api/v1/flux-schnell-image", payload=payload)

# --- App & Workflow Utilities ---

@router.get("/app/get_file_upload_url")
async def get_upload_url(request: Request):
    params = dict(request.query_params)
    return await proxy_request("GET", "/app/get_file_upload_url", params=params)

@router.post("/workflow/cloudfront-signed-url")
async def get_signed_url(request: Request):
    payload = await request.json()
    return await proxy_request("POST", "/workflow/cloudfront-signed-url", payload=payload)

