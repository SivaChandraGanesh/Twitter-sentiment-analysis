"""
FastAPI backend for Twitter Sentiment Analysis – Data Driven Emotion.
Endpoints: upload CSV, preprocess, sentiment, emotion, dashboard data, export.
"""
import io
import json
from typing import Any, List, Optional

import pandas as pd
from fastapi import File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi import FastAPI

from nlp_pipeline import (
    add_emotion_to_df,
    add_sentiment_to_df,
    clean_text,
    generate_visualization_data,
    load_data_from_df,
    preprocess_dataframe,
    tokenization,
    export_report_summary,
)

app = FastAPI(title="Data Driven Emotion API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store for current dataset (replace with DB in production)
_store: dict = {"df": None, "preprocessed": None, "with_sentiment": None, "with_emotion": None}


def _get_df() -> pd.DataFrame:
    if _store["df"] is None:
        raise HTTPException(status_code=400, detail="No dataset loaded. Upload a CSV first.")
    return _store["df"]


@app.post("/api/upload")
async def upload_csv(file: UploadFile = File(...)):
    """Upload CSV; store and return row count and preview."""
    if not file.filename or not file.filename.lower().endswith((".csv", ".xlsx")):
        raise HTTPException(status_code=400, detail="File must be CSV or XLSX")
    try:
        content = await file.read()
        if file.filename.lower().endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content), encoding="utf-8", on_bad_lines="skip")
        else:
            df = pd.read_excel(io.BytesIO(content))
        df = load_data_from_df(df)
        _store["df"] = df
        _store["preprocessed"] = None
        _store["with_sentiment"] = None
        _store["with_emotion"] = None
        preview = df.head(20).to_dict(orient="records")
        # Ensure content/tweet_id/timestamp/handle for frontend
        for r in preview:
            r.setdefault("tweet_id", "")
            r.setdefault("timestamp", "")
            r.setdefault("handle", "")
            r.setdefault("content", r.get("text", ""))
        return {
            "rows": len(df),
            "file_size_mb": round(len(content) / (1024 * 1024), 2),
            "status": "Ready to Process",
            "preview": preview,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/dataset/preview")
def get_preview(limit: int = 50):
    """Return current dataset preview."""
    df = _get_df()
    rows = df.head(limit).to_dict(orient="records")
    for r in rows:
        r.setdefault("tweet_id", "")
        r.setdefault("timestamp", "")
        r.setdefault("handle", "")
        r.setdefault("content", r.get("text", ""))
    return {"preview": rows, "total": len(df)}


@app.post("/api/preprocess")
def preprocess():
    """Run preprocessing; return before/after samples."""
    df = _get_df()
    df = preprocess_dataframe(df)
    _store["preprocessed"] = df
    before_after = []
    for i, row in df.head(10).iterrows():
        before_after.append({
            "raw": row.get("content", ""),
            "cleaned_tokens": row.get("tokens", []),
            "cleaned_text": row.get("cleaned_text", ""),
        })
    return {"message": "Preprocessing complete", "before_after": before_after, "total": len(df)}


@app.post("/api/analyze/sentiment")
def run_sentiment():
    """Run sentiment analysis on preprocessed data."""
    df = _store.get("preprocessed") or _get_df()
    if "cleaned_text" not in df.columns:
        df = preprocess_dataframe(df)
    df = add_sentiment_to_df(df)
    _store["with_sentiment"] = df
    _store["with_emotion"] = None
    counts = df["sentiment"].value_counts().to_dict()
    table = df.head(100).to_dict(orient="records")
    for r in table:
        r["tokens"] = r.get("tokens", []) if isinstance(r.get("tokens"), list) else []
    return {
        "total": len(df),
        "counts": counts,
        "table": table,
    }


@app.post("/api/analyze/emotion")
def run_emotion():
    """Run emotion detection on data that has sentiment."""
    df = _store.get("with_sentiment") or _store.get("preprocessed") or _get_df()
    if "cleaned_text" not in df.columns:
        df = preprocess_dataframe(df)
    if "sentiment" not in df.columns:
        df = add_sentiment_to_df(df)
    df = add_emotion_to_df(df)
    _store["with_emotion"] = df
    counts = df["emotion"].value_counts().to_dict()
    table = df.head(100).to_dict(orient="records")
    for r in table:
        r["tokens"] = r.get("tokens", []) if isinstance(r.get("tokens"), list) else []
    return {"total": len(df), "emotion_counts": counts, "table": table}


@app.get("/api/dashboard")
def get_dashboard_data(
    by_candidate: Optional[str] = None,
    sentiment_filter: Optional[str] = None,
):
    """Return visualization data (sentiment counts, emotion counts, time series, top words)."""
    df = _store.get("with_emotion") or _store.get("with_sentiment") or _store.get("preprocessed") or _get_df()
    if df is None or df.empty:
        return {
            "sentiment_counts": {"Positive": 0, "Negative": 0, "Neutral": 0},
            "emotion_counts": {},
            "sentiment_over_time": [],
            "top_words": [],
        }
    if sentiment_filter and sentiment_filter != "all" and "sentiment" in df.columns:
        df = df[df["sentiment"] == sentiment_filter]
    data = generate_visualization_data(df)
    return data


@app.get("/api/insights/summary")
def get_insights_summary():
    """Return text summary for report page."""
    df = _store.get("with_emotion") or _store.get("with_sentiment") or _get_df()
    if df is None or df.empty:
        return {"summary": "No data analyzed yet. Upload and run analysis first."}
    summary = export_report_summary(df)
    counts = {}
    if "sentiment" in df.columns:
        counts["sentiment"] = df["sentiment"].value_counts().to_dict()
    if "emotion" in df.columns:
        counts["emotion"] = df["emotion"].value_counts().to_dict()
    return {"summary": summary, "counts": counts}


@app.get("/api/export/csv")
def export_csv():
    """Export full dataset as CSV."""
    df = _store.get("with_emotion") or _store.get("with_sentiment") or _store.get("preprocessed") or _get_df()
    if df is None or df.empty:
        raise HTTPException(status_code=400, detail="No data to export")
    buf = io.StringIO()
    df.to_csv(buf, index=False)
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sentiment_report.csv"},
    )


@app.get("/api/export/report-text")
def export_report_text():
    """Return report as plain text (frontend can convert to PDF or show)."""
    df = _store.get("with_emotion") or _store.get("with_sentiment") or _get_df()
    if df is None or df.empty:
        raise HTTPException(status_code=400, detail="No data to export")
    text = export_report_summary(df)
    return {"report": text}


@app.post("/api/analyze/single")
def analyze_single_tweet(body: dict):
    """Analyze one tweet text; return sentiment and confidence."""
    tweet = body.get("tweet", "")
    if not tweet or not str(tweet).strip():
        raise HTTPException(status_code=400, detail="tweet is required")
    from nlp_pipeline import sentiment_classifier, emotion_detector
    label, conf = sentiment_classifier(tweet)
    emotion = emotion_detector(tweet)
    return {"sentiment": label, "confidence": conf, "emotion": emotion}


@app.get("/api/export/pdf")
def export_pdf():
    """Generate and return PDF report."""
    df = _store.get("with_emotion") or _store.get("with_sentiment") or _store.get("preprocessed") or _get_df()
    if df is None or df.empty:
        raise HTTPException(status_code=400, detail="No data to export")
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib import colors
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []
    story.append(Paragraph("Twitter Sentiment Analysis – Data Driven Emotion", styles["Title"]))
    story.append(Spacer(1, 12))
    for line in export_report_summary(df).split("\n"):
        story.append(Paragraph(line.replace("<", "&lt;").replace(">", "&gt;"), styles["Normal"]))
    doc.build(story)
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=report.pdf"},
    )


@app.get("/api/health")
def health():
    return {"status": "ok"}
