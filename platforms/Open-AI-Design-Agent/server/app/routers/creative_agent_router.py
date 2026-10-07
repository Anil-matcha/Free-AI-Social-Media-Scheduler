from fastapi import APIRouter, Request, HTTPException, Form, UploadFile, File
from app.utils.muapi_helper import proxy_request_helper, proxy_s3_upload, API_SUFFIX
from typing import Any

router = APIRouter()
app_router = APIRouter()

# ---------------------------------------------------------
# /api/v1/creative-agent endpoints (via router)
# ---------------------------------------------------------

@router.get("/sessions")
async def get_sessions():
    url = f"{API_SUFFIX}/api/v1/creative-agent/sessions"
    return await proxy_request_helper("GET", url)

@router.post("/sessions")
async def create_session(request: Request):
    try:
        payload = await request.json()
    except:
        payload = {}
    url = f"{API_SUFFIX}/api/v1/creative-agent/sessions"
    return await proxy_request_helper("POST", url, payload)

@router.patch("/sessions/{session_id}")
async def update_session(session_id: str, request: Request):
    payload = await request.json()
    url = f"{API_SUFFIX}/api/v1/creative-agent/sessions/{session_id}"
    return await proxy_request_helper("PATCH", url, payload)

@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    url = f"{API_SUFFIX}/api/v1/creative-agent/sessions/{session_id}"
    return await proxy_request_helper("DELETE", url)

@router.get("/sessions/{session_id}/messages")
async def get_session_messages(session_id: str):
    url = f"{API_SUFFIX}/api/v1/creative-agent/sessions/{session_id}/messages"
    return await proxy_request_helper("GET", url)

@router.patch("/sessions/{session_id}/messages")
async def update_session_messages(session_id: str, request: Request):
    payload = await request.json()
    url = f"{API_SUFFIX}/api/v1/creative-agent/sessions/{session_id}/messages"
    return await proxy_request_helper("PATCH", url, payload)

@router.post("/sessions/{session_id}/chat")
async def chat(session_id: str, request: Request):
    payload = await request.json()
    url = f"{API_SUFFIX}/api/v1/creative-agent/sessions/{session_id}/chat"
    return await proxy_request_helper("POST", url, payload)

@router.get("/sessions/{session_id}/assets")
async def get_session_assets(session_id: str):
    url = f"{API_SUFFIX}/api/v1/creative-agent/sessions/{session_id}/assets"
    return await proxy_request_helper("GET", url)

@router.post("/sessions/{session_id}/assets")
async def register_session_asset(session_id: str, request: Request):
    payload = await request.json()
    url = f"{API_SUFFIX}/api/v1/creative-agent/sessions/{session_id}/assets"
    return await proxy_request_helper("POST", url, payload)

@router.post("/jobs/{job_id}/approve")
async def approve_job(job_id: str, request: Request):
    try:
        payload = await request.json()
    except:
        payload = {}
    url = f"{API_SUFFIX}/api/v1/creative-agent/jobs/{job_id}/approve"
    return await proxy_request_helper("POST", url, payload)

@router.post("/jobs/{job_id}/reject")
async def reject_job(job_id: str, request: Request):
    try:
        payload = await request.json()
    except:
        payload = {}
    url = f"{API_SUFFIX}/api/v1/creative-agent/jobs/{job_id}/reject"
    return await proxy_request_helper("POST", url, payload)

@router.post("/jobs/{job_id}/cancel")
async def cancel_job(job_id: str, request: Request):
    try:
        payload = await request.json()
    except:
        payload = {}
    url = f"{API_SUFFIX}/api/v1/creative-agent/jobs/{job_id}/cancel"
    return await proxy_request_helper("POST", url, payload)

@router.get("/jobs/{job_id}/status")
async def get_job_status(job_id: str):
    url = f"{API_SUFFIX}/api/v1/creative-agent/jobs/{job_id}/status"
    return await proxy_request_helper("GET", url)

@router.get("/jobs/{job_id}/events")
async def get_job_events(job_id: str, request: Request):
    import urllib.parse
    params = dict(request.query_params)
    query_string = urllib.parse.urlencode(params)
    url = f"{API_SUFFIX}/api/v1/creative-agent/jobs/{job_id}/events"
    if query_string:
        url += f"?{query_string}"
    return await proxy_request_helper("GET", url)

@router.get("/sessions/{session_id}/jobs")
async def get_session_jobs(session_id: str):
    url = f"{API_SUFFIX}/api/v1/creative-agent/sessions/{session_id}/jobs"
    return await proxy_request_helper("GET", url)

@router.get("/agent-skills")
async def get_agent_skills():
    url = f"{API_SUFFIX}/api/v1/creative-agent/agent-skills"
    return await proxy_request_helper("GET", url)

@router.post("/sessions/{session_id}/run-skill")
async def run_skill(session_id: str, request: Request):
    payload = await request.json()
    url = f"{API_SUFFIX}/api/v1/creative-agent/sessions/{session_id}/run-skill"
    return await proxy_request_helper("POST", url, payload)

# Account balance endpoint
@router.get("/account/balance")
async def get_account_balance():
    # It might be located at /api/v1/account/balance on the upstream
    url = f"{API_SUFFIX}/api/v1/account/balance"
    return await proxy_request_helper("GET", url)

# ---------------------------------------------------------
# /api/app endpoints (via app_router)
# ---------------------------------------------------------

@app_router.get("/get_upload_url")
async def get_upload_url(request: Request):
    import urllib.parse
    params = dict(request.query_params)
    query_string = urllib.parse.urlencode(params)
    url = f"{API_SUFFIX}/api/v1/get_upload_url?{query_string}"
    return await proxy_request_helper("GET", url)

@app_router.post("/upload-binary")
async def upload_binary(
    request: Request,
):
    try:
        form = await request.form()
        print(f"DEBUG: Received upload-binary request. Fields: {list(form.keys())}")
        target_url = form.get("x-proxy-target-url")
        
        if not target_url:
            print("DEBUG: x-proxy-target-url NOT FOUND in form.get()")
            raise HTTPException(status_code=400, detail="Missing x-proxy-target-url in form data")

        # Build S3 form data
        s3_form_data = {}
        file_bytes = None
        file_name = "file"
        content_type = "application/octet-stream"

        for key, value in form.items():
            if key == "x-proxy-target-url":
                continue
            
            # Check if this is the file field
            if key == "file":
                print(f"DEBUG: Processing 'file' field. Type: {type(value)}")
                if hasattr(value, "read") and hasattr(value, "filename"):
                    file_bytes = await value.read()
                    file_name = value.filename
                    content_type = value.content_type
                    print(f"DEBUG: Successfully read UploadFile: {file_name} ({len(file_bytes)} bytes)")
                else:
                    # Fallback for unexpected types
                    file_bytes = value if isinstance(value, bytes) else str(value).encode()
                    print(f"DEBUG: Read file as fallback bytes: {len(file_bytes)} bytes")
            else:
                s3_form_data[key] = value

        if not file_bytes:
             print("DEBUG: UPLOAD FAILED - No file_bytes found after loop")
             raise HTTPException(status_code=400, detail="Missing file in form data")

        return await proxy_s3_upload(target_url, s3_form_data, file_bytes, file_name, content_type)
    except Exception as e:
        print(f"DEBUG: upload_binary exception: {type(e).__name__}: {e}")
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=400, detail=str(e))
