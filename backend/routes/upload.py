"""
Route: /api/upload
Handles large file ingestion via background tasks.
Returns a job_id immediately, frontend polls /api/upload/status/{job_id}
"""
import asyncio
import uuid
from concurrent.futures import ThreadPoolExecutor

from fastapi import APIRouter, BackgroundTasks, File, HTTPException, UploadFile
from sqlmodel import Session

from database.db import engine
from services.file_service import ingest_file

router = APIRouter(prefix="/api", tags=["Upload"])

# In-memory job store  { job_id: { status, progress, result, error } }
_jobs: dict[str, dict] = {}
_executor = ThreadPoolExecutor(max_workers=2)


def _run_ingest(job_id: str, content: bytes, filename: str):
    """Runs in a thread pool — performs the full NLP analysis and saves to DB."""
    try:
        _jobs[job_id]["status"] = "processing"
        with Session(engine) as session:
            result = ingest_file(content, filename, session, progress_cb=lambda pct: _update_progress(job_id, pct))
        _jobs[job_id]["status"] = "done"
        _jobs[job_id]["result"] = result
    except Exception as e:
        _jobs[job_id]["status"] = "error"
        _jobs[job_id]["error"] = str(e)


def _update_progress(job_id: str, pct: int):
    if job_id in _jobs:
        _jobs[job_id]["progress"] = pct


@router.post("/upload")
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    """
    Accept a CSV/XLSX file, start async NLP analysis in background,
    return a job_id to poll for progress.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided.")
    if not file.filename.lower().endswith((".csv", ".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="File must be CSV or XLSX.")

    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read file: {e}")

    job_id = str(uuid.uuid4())
    _jobs[job_id] = {"status": "queued", "progress": 0, "result": None, "error": None}

    # Run analysis in thread pool so the HTTP response is immediate
    loop = asyncio.get_event_loop()
    loop.run_in_executor(_executor, _run_ingest, job_id, content, file.filename)

    return {"job_id": job_id, "status": "queued"}


@router.get("/upload/status/{job_id}")
def upload_status(job_id: str):
    """Poll for background job status."""
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    return {
        "job_id": job_id,
        "status": job["status"],        # queued | processing | done | error
        "progress": job["progress"],    # 0-100
        "result": job["result"],        # populated when done
        "error": job["error"],
    }
