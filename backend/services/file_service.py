"""
File service — CSV/XLSX ingestion, NLP analysis, and DB persistence.
Uses a progress_cb callback so background jobs can update a progress counter.
"""
import io
from datetime import datetime
from typing import Callable, List, Optional

import pandas as pd
from sqlmodel import Session, text

from models.data_models import Record
from utils.text_cleaner import clean_text as _clean

try:
    from nlp_pipeline import sentiment_classifier, emotion_detector, tokenization
except ImportError:
    def sentiment_classifier(t: str):   # type: ignore
        return ("Neutral", 0.5)
    def emotion_detector(t: str, tokens=None) -> str:  # type: ignore
        return "Neutral"
    def tokenization(t: str) -> list:  # type: ignore
        return t.split()


def ingest_file(
    content: bytes,
    filename: str,
    session: Session,
    progress_cb: Optional[Callable[[int], None]] = None,
) -> dict:
    """
    Validate, parse, NLP-analyze, and persist an uploaded CSV/XLSX file.

    progress_cb is called with integers 0-100 as processing advances.
    Returns a rich summary dict with distribution counts and a row preview.
    """
    # ── Parse ─────────────────────────────────────────────────────────────────
    if filename.lower().endswith(".csv"):
        df = pd.read_csv(io.BytesIO(content), encoding="utf-8", on_bad_lines="skip")
    elif filename.lower().endswith((".xlsx", ".xls")):
        df = pd.read_excel(io.BytesIO(content))
    else:
        raise ValueError("Unsupported format. Please upload CSV or XLSX.")

    text_col = _detect_text_column(df)
    df["_text"] = df[text_col].astype(str).str.strip()

    # ── Clear old data ─────────────────────────────────────────────────────────
    session.exec(text("DELETE FROM record"))  # type: ignore[attr-defined]
    session.commit()
    if progress_cb:
        progress_cb(5)  # 5% — parsed + cleared

    # ── Analyze each row ───────────────────────────────────────────────────────
    sentiment_counts: dict[str, int] = {"Positive": 0, "Negative": 0, "Neutral": 0}
    emotion_counts: dict[str, int] = {}
    preview: list[dict] = []
    error_rows = 0
    total_rows = len(df)

    print(f"[UPLOAD] Starting analysis of {total_rows} rows from '{filename}'...")

    for i, (_, row) in enumerate(df.iterrows()):
        raw = row["_text"]
        if not raw or raw.lower() in ("nan", "none", ""):
            error_rows += 1
            continue

        cleaned = ""
        try:
            cleaned = _clean(raw)
            tokens = tokenization(raw)
            sentiment, confidence = sentiment_classifier(cleaned or raw)
            emotion = emotion_detector(raw, tokens=tokens)
        except Exception as e:
            print(f"[ERROR] Row {i} analysis failed: {e}")
            sentiment, confidence, emotion = "Neutral", 0.5, "Neutral"
            error_rows += 1

        record = Record(
            text=raw,
            clean_text=cleaned,
            sentiment=sentiment,
            emotion=emotion,
            confidence=round(float(confidence), 4),
            created_at=datetime.utcnow(),
        )
        session.add(record)

        sentiment_counts[sentiment] = sentiment_counts.get(sentiment, 0) + 1
        emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1

        if len(preview) < 50:
            preview.append({
                "text": raw[:120],
                "clean_text": cleaned[:120],
                "sentiment": sentiment,
                "emotion": emotion,
                "confidence": round(float(confidence), 4),
            })

        # Chunked commit + progress
        if (i + 1) % 500 == 0:
            session.commit()
            pct = min(95, 5 + int(((i + 1) / total_rows) * 90))
            if progress_cb:
                progress_cb(pct)
            print(f"[UPLOAD] {i + 1}/{total_rows} rows processed ({pct}%)...")

    session.commit()
    if progress_cb:
        progress_cb(100)
    print(f"[UPLOAD] Done — {total_rows} rows analyzed.")

    total_analyzed = sum(sentiment_counts.values())
    dominant_emotion = (
        max(emotion_counts, key=emotion_counts.get) if emotion_counts else "N/A"
    )

    return {
        "status": "Analyzed & Stored",
        "filename": filename,
        "total_rows": total_rows,
        "analyzed": total_analyzed,
        "error_rows": error_rows,
        "text_column_detected": text_col,
        "file_size_kb": round(len(content) / 1024, 2),
        "sentiment_distribution": sentiment_counts,
        "emotion_distribution": emotion_counts,
        "dominant_emotion": dominant_emotion,
        "preview": preview,
    }


def _detect_text_column(df: pd.DataFrame) -> str:
    """Pick the most likely text column by name heuristics."""
    candidates = ["text", "tweet", "content", "review", "comment", "body", "message"]
    for col in candidates:
        for actual in df.columns:
            if col in actual.lower():
                return actual
    str_cols = df.select_dtypes(include="object").columns.tolist()
    if not str_cols:
        raise ValueError("No text column found in uploaded file.")
    return max(str_cols, key=lambda c: df[c].astype(str).str.len().mean())
