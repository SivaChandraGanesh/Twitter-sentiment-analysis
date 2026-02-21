"""
Sentiment service — loads the NLP pipeline and runs inference on DB records.
Uses the existing nlp_pipeline module so model weights are reused.
"""
from sqlmodel import Session, select

from models.data_models import Record
from utils.text_cleaner import clean_text as _clean

# Import classifier from existing pipeline (avoids rewriting the model)
try:
    from nlp_pipeline import sentiment_classifier
except ImportError:
    # Fallback stub for testing without the full model
    def sentiment_classifier(text: str):  # type: ignore
        return ("Neutral", 0.5)


def run_sentiment_analysis(session: Session) -> dict:
    """
    Run sentiment inference on all Records and persist labels + confidence.
    Preprocessing is run inline if clean_text is missing.
    """
    records = session.exec(select(Record)).all()
    if not records:
        return {"message": "No records. Upload and preprocess first.", "total": 0}

    counts: dict[str, int] = {}
    table = []
    for record in records:
        text = record.clean_text or _clean(record.text)
        label, confidence = sentiment_classifier(text)
        record.sentiment = label
        record.confidence = round(float(confidence), 4)
        session.add(record)
        counts[label] = counts.get(label, 0) + 1
        if len(table) < 100:
            table.append({
                "id": record.id,
                "text": record.text,
                "clean_text": record.clean_text,
                "sentiment": label,
                "confidence": round(float(confidence), 4),
            })

    session.commit()
    return {"total": len(records), "counts": counts, "table": table}


def analyze_single(text: str) -> dict:
    """Analyze a single piece of text and return sentiment + confidence."""
    label, confidence = sentiment_classifier(text)
    return {"text": text, "sentiment": label, "confidence": round(float(confidence), 4)}
