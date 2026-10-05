import asyncio
from typing import List
from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.models.schemas import AgentDot, AgentRunRequest, MessageCreate
from app.services.space_store import store

router = APIRouter(prefix="/spaces/{space_id}/agents", tags=["Dots (AI Agents)"])

@router.get("", response_model=List[AgentDot])
def list_agents(space_id: str):
    space = store.get_space(space_id)
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    return space.agents

async def _simulate_agent_execution(space_id: str, agent_name: str, prompt: str, target_page_id: str = None):
    """Simulates background agent autonomous execution."""
    await asyncio.sleep(2)
    
    # If target page provided, append or update content
    if target_page_id:
        page = store.get_page(space_id, target_page_id)
        if page:
            addition = f"\n\n### 🤖 Agent Contribution ({agent_name})\n> **Instruction**: {prompt}\n\n*Analysis completed with real-time workspace context. Proposed updates integrated.*"
            page.content += addition
            page.version += 1
            
    # Post a message back to space
    store.add_message(
        space_id,
        MessageCreate(
            content=f"Completed task: '{prompt}' on {f'page {target_page_id}' if target_page_id else 'the space'}.",
            sender_type="agent",
            sender_name=agent_name,
            sender_avatar="⚡",
            referenced_page_id=target_page_id,
        )
    )

@router.post("/run")
async def run_agent_task(
    space_id: str,
    payload: AgentRunRequest,
    background_tasks: BackgroundTasks
):
    space = store.get_space(space_id)
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    
    agent = None
    if payload.agent_id:
        agent = next((a for a in space.agents if a.id == payload.agent_id), None)
    if not agent:
        agent = space.agents[0] if space.agents else AgentDot(id="dot-default", name="Assistant Dot")

    # Post initial acknowledgment message
    store.add_message(
        space_id,
        MessageCreate(
            content=f"🤖 **{agent.name}** accepted task: '{payload.prompt}'",
            sender_type="agent",
            sender_name=agent.name,
            sender_avatar="⚡",
            referenced_page_id=payload.target_page_id,
        )
    )

    background_tasks.add_task(
        _simulate_agent_execution,
        space_id,
        agent.name,
        payload.prompt,
        payload.target_page_id
    )

    return {
        "status": "started",
        "agent": agent.name,
        "task": payload.prompt,
        "target_page_id": payload.target_page_id
    }
