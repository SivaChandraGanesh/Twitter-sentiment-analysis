"""
Route: /api/preprocess
Runs NLP preprocessing pipeline on stored records.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from typing import Optional
from pydantic import BaseModel

from database.db import get_session
from services.preprocess_service import run_preprocessing

router = APIRouter(prefix="/api", tags=["Preprocessing"])


class PreprocessOptions(BaseModel):
    lowercase: bool = True
    remove_urls: bool = True
    remove_mentions: bool = True
    remove_stopwords: bool = True
    lemmatize: bool = True


@router.post("/preprocess")
def preprocess(
    options: Optional[PreprocessOptions] = None,
    session: Session = Depends(get_session),
):
    """
    Apply NLP cleaning pipeline to all records in the database.
    Returns before/after samples and total count.
    """
    try:
        opts = options.model_dump() if options else {}
        result = run_preprocessing(session, opts)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Preprocessing failed: {e}")
