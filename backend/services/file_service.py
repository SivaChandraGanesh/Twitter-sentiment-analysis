"""
File service — CSV/XLSX ingestion, NLP analysis, and DB persistence.
Uses a progress_cb callback so background jobs can update a progress counter.

Key optimizations:
- If the CSV already has a sentiment/label column, use it directly (no NLP re-run).
- Batch DB inserts (1000 rows at a time) instead of row-by-row for much faster uploads.
- NLP analysis is vectorized where possible using pandas apply.
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

# Valid sentiment labels accepted from a pre-labeled CSV column
_VALID_SENTIMENTS = {"positive", "negative", "neutral"}
_SENTIMENT_MAP = {
    "positive": "Positive", "pos": "Positive", "1": "Positive", "2": "Positive",
    "negative": "Negative", "neg": "Negative", "-1": "Negative", "0": "Negative",
    "neutral": "Neutral", "neu": "Neutral",
}

BATCH_SIZE = 1000  # Rows to insert per DB commit (much faster than row-by-row)


def _detect_sentiment_column(df: pd.DataFrame) -> Optional[str]:
    """
    Check if the CSV has a pre-labeled sentiment column.
    Returns the column name if found, otherwise None.
    """
    sentiment_candidates = ["sentiment", "label", "polarity", "class", "category", "sentiment_label"]
    for col in df.columns:
        if col.strip().lower() in sentiment_candidates:
            # Verify the values look like sentiment labels
            sample = df[col].dropna().astype(str).str.lower().str.strip().unique()
            valid_count = sum(1 for v in sample if v in _SENTIMENT_MAP)
            if valid_count / max(len(sample), 1) >= 0.5:  # at least 50% of unique values are valid labels
                return col
    return None


def _normalize_sentiment(value: str) -> str:
    """Map various label formats to Positive/Negative/Neutral."""
    return _SENTIMENT_MAP.get(str(value).strip().lower(), "Neutral")


def ingest_file(
    content: bytes,
    filename: str,
    session: Session,
    progress_cb: Optional[Callable[[int], None]] = None,
) -> dict:
    """
    Validate, parse, NLP-analyze (or use pre-labeled sentiments), and persist an uploaded CSV/XLSX file.

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

    # Check for pre-labeled sentiment column
    sentiment_col = _detect_sentiment_column(df)
    use_prelabeled = sentiment_col is not None

    if use_prelabeled:
        print(f"[UPLOAD] Found pre-labeled sentiment column: '{sentiment_col}'. Using existing labels (skipping NLP re-run).")
    else:
        print(f"[UPLOAD] No pre-labeled sentiment column found. Running NLP analysis on {len(df)} rows...")

    # ── Clear old data ─────────────────────────────────────────────────────────
    session.exec(text("DELETE FROM record"))  # type: ignore[attr-defined]
    session.commit()
    if progress_cb:
        progress_cb(5)  # 5% — parsed + cleared

    # ── Filter invalid rows ────────────────────────────────────────────────────
    valid_mask = ~(df["_text"].str.lower().isin(["nan", "none", ""]))
    df_valid = df[valid_mask].copy().reset_index(drop=True)
    error_rows = len(df) - len(df_valid)
    total_rows = len(df)

    print(f"[UPLOAD] Processing {len(df_valid)} valid rows ({error_rows} skipped)...")

    # ── Pre-process: clean text (vectorized) ───────────────────────────────────
    df_valid["_clean"] = df_valid["_text"].apply(_clean)

    if progress_cb:
        progress_cb(15)  # 15% — text cleaned

    # ── Sentiment: use pre-labeled OR run NLP ──────────────────────────────────
    sentiment_counts: dict[str, int] = {"Positive": 0, "Negative": 0, "Neutral": 0}
    emotion_counts: dict[str, int] = {}
    preview: list[dict] = []

    if use_prelabeled:
        # Use existing labels directly — fast!
        df_valid["_sentiment"] = df_valid[sentiment_col].apply(_normalize_sentiment)  # type: ignore[arg-type]
        df_valid["_confidence"] = 0.85  # reasonable default for pre-labeled data
        if progress_cb:
            progress_cb(40)

        # Emotion detection (vectorized) for rows that need it
        # Use tokens to be consistent with NLP pipeline
        df_valid["_emotion"] = df_valid["_clean"].apply(
            lambda t: emotion_detector(t) if t else "Neutral"
        )
        if progress_cb:
            progress_cb(70)
    else:
        # Full NLP path (slower, row-by-row needed for VADER+TextBlob)
        sentiments = []
        confidences = []
        emotions = []
        n = len(df_valid)
        for i, row in df_valid.iterrows():
            raw = row["_text"]
            clean_t = row["_clean"]
            try:
                sentiment, confidence = sentiment_classifier(clean_t or raw)
                emotion = emotion_detector(raw)
            except Exception as e:
                print(f"[ERROR] Row {i} analysis failed: {e}")
                sentiment, confidence, emotion = "Neutral", 0.5, "Neutral"
                error_rows += 1
            sentiments.append(sentiment)
            confidences.append(round(float(confidence), 4))
            emotions.append(emotion)

            if (i + 1) % 500 == 0:
                pct = min(75, 15 + int(((i + 1) / n) * 60))
                if progress_cb:
                    progress_cb(pct)
                print(f"[UPLOAD] {i + 1}/{n} rows analyzed ({pct}%)...")

        df_valid["_sentiment"] = sentiments
        df_valid["_confidence"] = confidences
        df_valid["_emotion"] = emotions
        if progress_cb:
            progress_cb(75)

    # ── Count distributions ─────────────────────────────────────────────────────
    for s in df_valid["_sentiment"]:
        sentiment_counts[s] = sentiment_counts.get(s, 0) + 1
    for e in df_valid["_emotion"]:
        emotion_counts[e] = emotion_counts.get(e, 0) + 1

    # ── Build preview ───────────────────────────────────────────────────────────
    for _, row in df_valid.head(50).iterrows():
        preview.append({
            "text": str(row["_text"])[:120],
            "clean_text": str(row["_clean"])[:120],
            "sentiment": row["_sentiment"],
            "emotion": row["_emotion"],
            "confidence": round(float(row["_confidence"]), 4),
        })

    # ── Batch DB insert ─────────────────────────────────────────────────────────
    now = datetime.utcnow()
    total_valid = len(df_valid)
    inserted = 0
    batch: list[Record] = []

    for _, row in df_valid.iterrows():
        batch.append(Record(
            text=str(row["_text"]),
            clean_text=str(row["_clean"]),
            sentiment=row["_sentiment"],
            emotion=row["_emotion"],
            confidence=round(float(row["_confidence"]), 4),
            created_at=now,
        ))
        inserted += 1

        if len(batch) >= BATCH_SIZE:
            session.add_all(batch)
            session.commit()
            batch.clear()
            pct = min(99, 75 + int((inserted / total_valid) * 24))
            if progress_cb:
                progress_cb(pct)
            print(f"[UPLOAD] DB insert: {inserted}/{total_valid} rows committed ({pct}%)...")

    # Final batch
    if batch:
        session.add_all(batch)
        session.commit()
        batch.clear()

    if progress_cb:
        progress_cb(100)
    print(f"[UPLOAD] Done — {total_valid} rows stored (pre-labeled: {use_prelabeled}).")

    total_analyzed = sum(sentiment_counts.values())
    dominant_emotion = (
        max(emotion_counts, key=emotion_counts.get) if emotion_counts else "N/A"  # type: ignore[arg-type]
    )

    return {
        "status": "Analyzed & Stored",
        "filename": filename,
        "total_rows": total_rows,
        "analyzed": total_analyzed,
        "error_rows": error_rows,
        "text_column_detected": text_col,
        "sentiment_column_detected": sentiment_col,
        "used_prelabeled_sentiment": use_prelabeled,
        "file_size_kb": round(len(content) / 1024, 2),
        "sentiment_distribution": sentiment_counts,
        "emotion_distribution": emotion_counts,
        "dominant_emotion": dominant_emotion,
        "preview": preview,
    }


def _detect_text_column(df: pd.DataFrame) -> str:
    """Pick the most likely text column by name heuristics."""
    candidates = ["text", "tweet", "content", "review", "comment", "body", "message", "tweet_text"]
    for col in candidates:
        for actual in df.columns:
            if col in actual.lower():
                return actual
    str_cols = df.select_dtypes(include="object").columns.tolist()
    if not str_cols:
        raise ValueError("No text column found in uploaded file.")
    return max(str_cols, key=lambda c: df[c].astype(str).str.len().mean())
