"""
Emotion service — runs emotion detection on all DB records.
"""
from sqlmodel import Session, select

from models.data_models import Record
from utils.text_cleaner import clean_text as _clean

try:
    from nlp_pipeline import emotion_detector
except ImportError:
    def emotion_detector(text: str) -> str:  # type: ignore
        return "Joy"


def run_emotion_analysis(session: Session) -> dict:
    """
    Run emotion detection on all Records. Persists emotion label.
    """
    records = session.exec(select(Record)).all()
    if not records:
        return {"message": "No records. Upload, preprocess and run sentiment first.", "total": 0}

    emotion_counts: dict[str, int] = {}
    table = []
    for record in records:
        text = record.clean_text or _clean(record.text)
        emotion = emotion_detector(text)
        record.emotion = emotion
        session.add(record)
        emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
        if len(table) < 100:
            table.append({
                "id": record.id,
                "text": record.text,
                "sentiment": record.sentiment,
                "emotion": emotion,
                "confidence": record.confidence,
            })

    session.commit()
    return {"total": len(records), "emotion_counts": emotion_counts, "table": table}


def analyze_single_emotion(text: str) -> dict:
    """Detect emotion for a single piece of text."""
    emotion = emotion_detector(text)
    return {"text": text, "emotion": emotion}
