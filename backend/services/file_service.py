"""
File service — CSV/XLSX ingestion, validation, and DB persistence.
"""
import io
from typing import List

import pandas as pd
from sqlmodel import Session

from models.data_models import Record


def ingest_file(content: bytes, filename: str, session: Session) -> dict:
    """
    Validate and parse an uploaded file.
    Store each row's raw text as a Record in the database.

    Returns a summary dict with row count, columns, and a preview.
    """
    if filename.lower().endswith(".csv"):
        df = pd.read_csv(io.BytesIO(content), encoding="utf-8", on_bad_lines="skip")
    elif filename.lower().endswith((".xlsx", ".xls")):
        df = pd.read_excel(io.BytesIO(content))
    else:
        raise ValueError("Unsupported file format. Please upload CSV or XLSX.")

    # Detect the text column
    text_col = _detect_text_column(df)
    df["_text"] = df[text_col].astype(str).str.strip()

    # Persist records to DB (clear previous data first)
    session.exec(  # type: ignore[attr-defined]
        Record.__table__.delete()  # type: ignore[attr-defined]
    )
    for _, row in df.iterrows():
        record = Record(text=row["_text"])
        session.add(record)
    session.commit()

    preview = _build_preview(df, text_col)
    return {
        "rows": len(df),
        "columns": df.columns.tolist(),
        "text_column_detected": text_col,
        "file_size_kb": round(len(content) / 1024, 2),
        "status": "Uploaded & Stored",
        "preview": preview,
    }


def _detect_text_column(df: pd.DataFrame) -> str:
    """Pick the most likely text column by name heuristics."""
    candidates = ["text", "tweet", "content", "review", "comment", "body", "message"]
    for col in candidates:
        for actual in df.columns:
            if col in actual.lower():
                return actual
    # Fall back to the column with the longest average string
    str_cols = df.select_dtypes(include="object").columns.tolist()
    if not str_cols:
        raise ValueError("No text column found in uploaded file.")
    return max(str_cols, key=lambda c: df[c].astype(str).str.len().mean())


def _build_preview(df: pd.DataFrame, text_col: str, n: int = 20) -> List[dict]:
    preview = df.head(n).to_dict(orient="records")
    for row in preview:
        row.setdefault("content", row.get(text_col, ""))
    return preview
