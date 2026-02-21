"""
Visualization service — aggregates DB data for frontend charts.
No ML here, pure data aggregation.
"""
from collections import Counter
from datetime import timezone

from sqlmodel import Session, select

from models.data_models import Record


def get_visualization_data(session: Session) -> dict:
    """
    Return aggregated chart data for the Visualizations page.
    Matches frontend Recharts expectations.
    """
    records = session.exec(select(Record)).all()

    if not records:
        return {
            "sentiment_distribution": {"Positive": 0, "Neutral": 0, "Negative": 0},
            "emotion_distribution": {},
            "sentiment_over_time": [],
            "top_words": [],
            "total": 0,
        }

    # Sentiment distribution
    sentiment_counts = dict(Counter(r.sentiment for r in records if r.sentiment))

    # Emotion distribution
    emotion_counts = dict(Counter(r.emotion for r in records if r.emotion))

    # Sentiment over time (group by date)
    time_series: dict[str, dict[str, int]] = {}
    for r in records:
        if not r.sentiment:
            continue
        date_key = r.created_at.strftime("%b %d") if r.created_at else "Unknown"
        if date_key not in time_series:
            time_series[date_key] = {"Positive": 0, "Neutral": 0, "Negative": 0}
        time_series[date_key][r.sentiment] = time_series[date_key].get(r.sentiment, 0) + 1

    time_series_list = [{"date": k, **v} for k, v in time_series.items()]

    # Top words from clean_text
    word_counter: Counter = Counter()
    for r in records:
        if r.clean_text:
            word_counter.update(r.clean_text.split())
    top_words = [{"word": w, "count": c} for w, c in word_counter.most_common(20)]

    return {
        "sentiment_distribution": sentiment_counts,
        "emotion_distribution": emotion_counts,
        "sentiment_over_time": time_series_list,
        "top_words": top_words,
        "total": len(records),
    }


def get_dashboard_summary(session: Session) -> dict:
    """
    Return a quick summary for the Dashboard Overview page.
    """
    records = session.exec(select(Record)).all()

    if not records:
        return {
            "total_records": 0, "positive": 0, "neutral": 0,
            "negative": 0, "dominant_emotion": "N/A",
        }

    total = len(records)
    sentiment_counts = Counter(r.sentiment for r in records if r.sentiment)
    emotion_counts = Counter(r.emotion for r in records if r.emotion)
    dominant_emotion = emotion_counts.most_common(1)[0][0] if emotion_counts else "N/A"

    return {
        "total_records": total,
        "positive": sentiment_counts.get("Positive", 0),
        "neutral": sentiment_counts.get("Neutral", 0),
        "negative": sentiment_counts.get("Negative", 0),
        "dominant_emotion": dominant_emotion,
    }
