import os
import httpx
import logging
from fastapi import HTTPException
from typing import Optional
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MU_API_KEY = os.getenv("MU_API_KEY")
API_SUFFIX = os.getenv("API_SUFFIX", "https://api.muapi.ai").rstrip("/")

async def get_api_key():
    api_key = os.getenv("MU_API_KEY")
    if not api_key:
        raise HTTPException(status_code=400, detail="Setup MU_API_KEY in server/.env to be able to use the Creative Agent")
    return api_key

async def proxy_request_helper(method: str, url: str, payload: Optional[dict] = None):
    api_key = await get_api_key()
    headers = {
        "Content-Type": "application/json",
        "x-api-key": api_key,
    }

    async with httpx.AsyncClient() as client:
        try:
            if method.upper() == "GET":
                response = await client.get(url, headers=headers, timeout=60.0)
            elif method.upper() == "POST":
                response = await client.post(url, json=payload, headers=headers, timeout=60.0)
            elif method.upper() == "DELETE":
                response = await client.delete(url, headers=headers, timeout=60.0)
            elif method.upper() == "PATCH":
                response = await client.patch(url, json=payload, headers=headers, timeout=60.0)
            elif method.upper() == "PUT":
                response = await client.put(url, json=payload, headers=headers, timeout=60.0)
            else:
                raise HTTPException(status_code=405, detail=f"Method {method} not supported in proxy")

        except httpx.RequestError as e:
            logger.error(f"HTTPExt Request Error for {method} {url}: {e}")
            raise HTTPException(status_code=500, detail=f"Error contacting remote server: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error in proxy_request_helper for {method} {url}: {e}")
            raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

    try:
        if response.content:
            resp_json = response.json()
        else:
            resp_json = {}
    except ValueError:
        resp_json = {"detail": response.text or "Unknown error from remote server"}

    if 200 <= response.status_code < 300:
        return resp_json
    else:
        error_detail = resp_json.get("detail", "Something went wrong")
        logger.warning(f"Remote server returned {response.status_code}: {error_detail}")
        raise HTTPException(status_code=response.status_code, detail=error_detail)

async def proxy_s3_upload(target_url: str, form_data: dict, file_bytes: bytes, file_name: str, content_type: str):
    """
    Bypass browser CORS by uploading to S3 from the server.
    """
    try:
        print(f"Uploading file {file_name} to S3...")
        async with httpx.AsyncClient() as client:
            # S3 pre-signed POST requires the 'file' field to be the LAST field in the form
            fields = []
            for k, v in form_data.items():
                fields.append((k, (None, str(v))))
            fields.append(("file", (file_name, file_bytes, content_type)))
            
            response = await client.post(target_url, files=fields, timeout=120.0)
            
            if response.status_code == 204 or response.status_code == 200:
                return {"status": "success"}
            else:
                logger.error(f"S3 Proxy Error: {response.text}")
                raise HTTPException(status_code=response.status_code, detail="S3 upload failed")
    except Exception as e:
        logger.error(f"Upload Proxy Exception: {e}")
        raise HTTPException(status_code=500, detail=str(e))
