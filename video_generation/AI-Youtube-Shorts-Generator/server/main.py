import asyncio
import os
import sys
import uuid
import json
import subprocess
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

app = FastAPI()

# Enable CORS for Next.js frontend (localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure the output directory exists
OUTPUT_DIR = "output"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Mount the output directory to serve completed MP4s as static assets
app.mount("/output", StaticFiles(directory=OUTPUT_DIR), name="output")

# In-memory job registry
jobs = {}

class GenerateRequest(BaseModel):
    url: str
    mode: str = "api"  # api or local
    num_clips: int = 3
    aspect_ratio: str = "9:16"
    language: str = None

async def run_shorts_pipeline(job_id: str, request: GenerateRequest):
    jobs[job_id]["status"] = "processing"
    
    # We will output results to a specific JSON file in the output directory
    output_json_path = os.path.join(OUTPUT_DIR, f"job_{job_id}.json")
    
    # Command to execute main.py in a separate process
    cmd = [
        sys.executable,
        "main.py",
        request.url,
        "--mode", request.mode,
        "--num-clips", str(request.num_clips),
        "--aspect-ratio", request.aspect_ratio,
        "--output-json", output_json_path
    ]
    if request.language and request.language.strip() != "" and request.language.strip() != "auto":
        cmd.extend(["--language", request.language.strip()])
    
    jobs[job_id]["logs"].append(f"Running command: {' '.join(cmd)}")
    
    try:
        # Start the subprocess
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Helper to read stdout/stderr concurrently
        async def read_stream(stream, log_prefix=""):
            while True:
                line = await stream.readline()
                if not line:
                    break
                decoded_line = line.decode('utf-8', errors='replace').strip()
                if decoded_line:
                    jobs[job_id]["logs"].append(decoded_line)
                    print(f"[{job_id}] {decoded_line}")

        # Read stdout and stderr concurrently
        await asyncio.gather(
            read_stream(process.stdout),
            read_stream(process.stderr)
        )
        
        # Wait for the process to complete
        returncode = await process.wait()
        
        if returncode == 0:
            # Read output JSON
            if os.path.exists(output_json_path):
                with open(output_json_path, "r", encoding="utf-8") as f:
                    result_data = json.load(f)
                
                # In local mode, let's map file paths of shorts to web URLs
                # For example, if it generated "output\short_01.mp4", we convert it to "/output/short_01.mp4"
                if request.mode == "local" and "shorts" in result_data:
                    for short in result_data["shorts"]:
                        # Convert local absolute/relative path to hosted /output/ relative URL path
                        clip_path = short.get("clip_url", "")
                        if clip_path and not clip_path.startswith("http"):
                            # Get filename
                            filename = os.path.basename(clip_path)
                            short["clip_url"] = f"http://localhost:8000/output/{filename}"
                
                jobs[job_id]["result"] = result_data
                jobs[job_id]["status"] = "completed"
                jobs[job_id]["logs"].append("Pipeline finished successfully!")
            else:
                jobs[job_id]["status"] = "failed"
                jobs[job_id]["error"] = "Output JSON file was not generated."
                jobs[job_id]["logs"].append("Error: Output JSON file was not generated.")
        else:
            jobs[job_id]["status"] = "failed"
            jobs[job_id]["error"] = f"Subprocess exited with code {returncode}"
            jobs[job_id]["logs"].append(f"Error: Subprocess exited with code {returncode}")
            
    except Exception as e:
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["error"] = str(e)
        jobs[job_id]["logs"].append(f"Exception: {str(e)}")

@app.post("/api/generate")
async def generate_shorts_endpoint(request: GenerateRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4().hex[:8])
    jobs[job_id] = {
        "id": job_id,
        "status": "pending",
        "logs": ["Job submitted. Preparing to run AI pipeline..."],
        "result": None,
        "error": None
    }
    
    # Run the process in the background
    background_tasks.add_task(run_shorts_pipeline, job_id, request)
    
    return {"job_id": job_id, "status": "pending"}

@app.get("/api/jobs/{job_id}")
async def get_job_status(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return jobs[job_id]

@app.get("/api/jobs")
async def list_jobs():
    return list(jobs.values())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
