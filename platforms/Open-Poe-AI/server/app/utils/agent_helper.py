import os
import httpx
import logging
from fastapi import HTTPException
from typing import Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MUAPI_BASE_URL = os.getenv("MUAPI_BASE_URL", "https://api.muapi.ai")

async def get_api_key():
    api_key = os.getenv("MU_API_KEY")
    if not api_key:
        raise HTTPException(status_code=400, detail="Setup MU_API_KEY in .env to be able to use the agent library")
    return api_key

async def proxy_request(method: str, path: str, payload: Optional[dict] = None, params: Optional[dict] = None):
    api_key = await get_api_key()
    url = f"{MUAPI_BASE_URL}/{path.lstrip('/')}"
    
    headers = {
        "Content-Type": "application/json",
        "x-api-key": api_key,
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.request(
                method=method,
                url=url,
                json=payload,
                params=params,
                headers=headers,
                timeout=60.0
            )
            
            # For JSON responses, return the parsed data
            if "application/json" in response.headers.get("content-type", ""):
                return response.json()
            else:
                # Fallback for other content types
                return response.content
                
        except httpx.RequestError as e:
            logger.error(f"Request error: {e}")
            raise HTTPException(status_code=500, detail=f"Error contacting MuAPI: {e}")
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            raise HTTPException(status_code=500, detail=str(e))
