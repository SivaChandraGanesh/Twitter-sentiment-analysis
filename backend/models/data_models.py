"""
SQLModel database models for the sentiment analysis application.
"""
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class Record(SQLModel, table=True):
    """
    Represents one row of analyzed text data.
    Matches the blueprint schema: id, text, clean_text, sentiment, emotion,
    confidence, created_at.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    text: str = Field(index=False)
    clean_text: Optional[str] = None
    sentiment: Optional[str] = None          # Positive / Neutral / Negative
    emotion: Optional[str] = None            # Joy / Anger / Sadness / Fear / Surprise
    confidence: Optional[float] = None       # 0.0 – 1.0
    created_at: datetime = Field(default_factory=datetime.utcnow)
