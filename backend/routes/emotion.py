"""
Route: /api/emotion
Runs emotion detection on all records.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from database.db import get_session
from services.emotion_service import run_emotion_analysis

router = APIRouter(prefix="/api", tags=["Emotion"])


@router.post("/analyze/emotion")
def run_emotion(session: Session = Depends(get_session)):
    """
    Run emotion detection on all database records.
    Returns emotion counts and a preview table.
    """
    try:
        return run_emotion_analysis(session)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Emotion detection failed: {e}")
