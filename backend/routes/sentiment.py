"""
Route: /api/sentiment
Runs sentiment inference on records and supports single-text analysis.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session

from database.db import get_session
from services.sentiment_service import run_sentiment_analysis, analyze_single

router = APIRouter(prefix="/api", tags=["Sentiment"])


class SingleTextRequest(BaseModel):
    text: str


@router.post("/analyze/sentiment")
def run_sentiment(session: Session = Depends(get_session)):
    """
    Run sentiment classification on all database records.
    Returns counts per label and a preview table.
    """
    try:
        return run_sentiment_analysis(session)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sentiment analysis failed: {e}")


@router.post("/analyze/single")
def analyze_text(body: SingleTextRequest):
    """
    Analyze a single text and return sentiment + confidence score.
    """
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="text is required.")
    try:
        from nlp_pipeline import emotion_detector
        sentiment_result = analyze_single(body.text)
        sentiment_result["emotion"] = emotion_detector(body.text)
        return sentiment_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {e}")
