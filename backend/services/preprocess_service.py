"""
Preprocessing service — applies the NLP pipeline to all DB records.
"""
from sqlmodel import Session, select

from models.data_models import Record
from utils.text_cleaner import clean_text


def run_preprocessing(session: Session, options: dict | None = None) -> dict:
    """
    Load all Records from DB, clean their text, and persist clean_text back.
    Returns before/after samples plus total processed count.
    """
    opts = options or {}
    records = session.exec(select(Record)).all()
    if not records:
        return {"message": "No records found. Please upload a dataset first.", "total": 0}

    samples = []
    for i, record in enumerate(records):
        cleaned = clean_text(
            record.text,
            lowercase=opts.get("lowercase", True),
            remove_urls=opts.get("remove_urls", True),
            remove_mentions=opts.get("remove_mentions", True),
            remove_stopwords=opts.get("remove_stopwords", True),
            lemmatize=opts.get("lemmatize", True),
        )
        record.clean_text = cleaned
        session.add(record)
        if i < 10:
            samples.append({"before": record.text, "after": cleaned})

    session.commit()
    return {
        "message": "Preprocessing complete",
        "total": len(records),
        "before_after": samples,
    }
