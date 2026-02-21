"""
Report service — generates CSV and PDF exports from the database.
"""
import io
from collections import Counter

from sqlmodel import Session, select

from models.data_models import Record


def generate_summary_text(records: list[Record]) -> str:
    """Build a plain-text report summary."""
    total = len(records)
    analyzed = sum(1 for r in records if r.sentiment)
    sentiment_counts = Counter(r.sentiment for r in records if r.sentiment)
    emotion_counts = Counter(r.emotion for r in records if r.emotion)
    dominant_sentiment = sentiment_counts.most_common(1)[0][0] if sentiment_counts else "N/A"
    dominant_emotion = emotion_counts.most_common(1)[0][0] if emotion_counts else "N/A"
    avg_conf = (
        sum(r.confidence for r in records if r.confidence) / max(analyzed, 1)
    )

    lines = [
        "=" * 50,
        "  TWITTER SENTIMENT ANALYSIS — DATA DRIVEN EMOTION",
        "  Automated Report",
        "=" * 50,
        f"  Total Records     : {total}",
        f"  Analyzed Records  : {analyzed}",
        "",
        "  SENTIMENT DISTRIBUTION",
        f"  Positive  : {sentiment_counts.get('Positive', 0)}",
        f"  Neutral   : {sentiment_counts.get('Neutral', 0)}",
        f"  Negative  : {sentiment_counts.get('Negative', 0)}",
        f"  Dominant  : {dominant_sentiment}",
        "",
        "  EMOTION DISTRIBUTION",
        *[f"  {e:12}: {c}" for e, c in emotion_counts.most_common()],
        f"  Dominant  : {dominant_emotion}",
        "",
        f"  AVG CONFIDENCE    : {avg_conf:.2%}",
        "=" * 50,
    ]
    return "\n".join(lines)


def export_csv(session: Session) -> io.StringIO:
    """Return a CSV StringIO of all records."""
    import csv

    records = session.exec(select(Record)).all()
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["id", "text", "clean_text", "sentiment", "emotion", "confidence", "created_at"])
    for r in records:
        writer.writerow([r.id, r.text, r.clean_text, r.sentiment, r.emotion, r.confidence, r.created_at])
    buf.seek(0)
    return buf


def export_pdf(session: Session) -> io.BytesIO:
    """Return a PDF BytesIO report."""
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib import colors

    records = session.exec(select(Record)).all()
    summary = generate_summary_text(records)
    sentiment_counts = Counter(r.sentiment for r in records if r.sentiment)
    emotion_counts = Counter(r.emotion for r in records if r.emotion)

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("Twitter Sentiment Analysis — Data Driven Emotion", styles["Title"]))
    story.append(Spacer(1, 12))
    story.append(Paragraph("Executive Summary", styles["Heading2"]))

    for line in summary.split("\n"):
        clean = line.strip().replace("<", "&lt;").replace(">", "&gt;")
        if clean:
            story.append(Paragraph(clean, styles["Normal"]))

    story.append(Spacer(1, 16))
    story.append(Paragraph("Sentiment Breakdown", styles["Heading2"]))
    table_data = [["Sentiment", "Count"]] + [[k, v] for k, v in sentiment_counts.items()]
    t = Table(table_data)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#3b82f6")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
    ]))
    story.append(t)

    story.append(Spacer(1, 16))
    story.append(Paragraph("Emotion Breakdown", styles["Heading2"]))
    emo_data = [["Emotion", "Count"]] + [[k, v] for k, v in emotion_counts.items()]
    e = Table(emo_data)
    e.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#8b5cf6")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
    ]))
    story.append(e)

    doc.build(story)
    buf.seek(0)
    return buf


def get_summary(session: Session) -> dict:
    """Return summary text + counts for the reports page."""
    records = session.exec(select(Record)).all()
    if not records:
        return {"summary": "No data analyzed yet. Upload and run analysis first.", "counts": {}}
    sentiment_counts = Counter(r.sentiment for r in records if r.sentiment)
    emotion_counts = Counter(r.emotion for r in records if r.emotion)
    return {
        "summary": generate_summary_text(records),
        "counts": {
            "sentiment": dict(sentiment_counts),
            "emotion": dict(emotion_counts),
        },
    }
