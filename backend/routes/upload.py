"""
Route: /api/upload
Handles file ingestion via the FileService.
"""
from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.params import Depends
from sqlmodel import Session

from database.db import get_session
from services.file_service import ingest_file

router = APIRouter(prefix="/api", tags=["Upload"])


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
):
    """
    Upload a CSV or XLSX file.
    Validates format, extracts text column, and stores records in the database.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided.")
    if not file.filename.lower().endswith((".csv", ".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="File must be CSV or XLSX.")

    try:
        content = await file.read()
        result = ingest_file(content, file.filename, session)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {e}")
