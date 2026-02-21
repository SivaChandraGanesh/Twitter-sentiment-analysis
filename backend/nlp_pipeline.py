"""
NLP pipeline for Twitter Sentiment Analysis - Data Driven Emotion.
Functions: clean_text, remove_stopwords, tokenization, sentiment, emotion detection.
"""
import re
import string
from typing import List, Tuple

import nltk
import pandas as pd
from textblob import TextBlob
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

# Ensure NLTK data is available (run once)
try:
    nltk.data.find("corpora/stopwords")
except LookupError:
    nltk.download("stopwords", quiet=True)
try:
    nltk.data.find("tokenizers/punkt")
except LookupError:
    nltk.download("punkt", quiet=True)

STOP_WORDS = set(nltk.corpus.stopwords.words("english"))
VADER = SentimentIntensityAnalyzer()

# Emotion keywords (simplified multi-class for Happy, Angry, Sad, Fear, Neutral)
EMOTION_LEXICON = {
    "happy": [
        "happy", "joy", "love", "great", "amazing", "excited", "hope", "win",
        "best", "wonderful", "fantastic", "proud", "optimistic", "celebrate",
    ],
    "angry": [
        "angry", "mad", "hate", "outrage", "furious", "disgust", "wrong",
        "terrible", "awful", "disappointed", "corrupt", "lie", "cheat",
    ],
    "sad": [
        "sad", "depressed", "loss", "cry", "grief", "sorry", "regret",
        "worried", "concern", "unfortunate", "tragic", "miss",
    ],
    "fear": [
        "fear", "scared", "afraid", "anxious", "panic", "threat", "danger",
        "crisis", "collapse", "uncertain", "nervous", "terror",
    ],
}


def clean_text(text: str) -> str:
    """Remove URLs, hashtags, @mentions, special chars; lowercase."""
    if not isinstance(text, str) or not text.strip():
        return ""
    t = text.lower().strip()
    t = re.sub(r"https?://\S+|www\.\S+", "", t)
    t = re.sub(r"@\w+", "", t)
    t = re.sub(r"#\w+", "", t)
    t = re.sub(r"rt\s*:", "", t, flags=re.I)
    t = re.sub(r"[^\w\s]", " ", t)
    t = re.sub(r"\s+", " ", t)
    return t.strip()


def remove_stopwords(tokens: List[str]) -> List[str]:
    """Remove stopwords from token list."""
    return [w for w in tokens if w.lower() not in STOP_WORDS and len(w) > 1]


def tokenization(text: str) -> List[str]:
    """Tokenize and optionally remove stopwords for display; returns words only."""
    cleaned = clean_text(text)
    tokens = nltk.word_tokenize(cleaned)
    return remove_stopwords(tokens)


def sentiment_classifier(text: str) -> Tuple[str, float]:
    """Classify sentiment: Positive, Negative, Neutral. Returns (label, confidence)."""
    if not text or not str(text).strip():
        return "Neutral", 0.5
    text = str(text)
    # VADER for social media; blend with TextBlob for robustness
    vs = VADER.polarity_scores(text)
    compound = vs["compound"]
    blob = TextBlob(text)
    polarity = blob.sentiment.polarity
    # Blend: VADER compound and TextBlob polarity
    score = 0.6 * compound + 0.4 * polarity
    if score > 0.15:
        label = "Positive"
        conf = min(0.99, 0.5 + abs(score))
    elif score < -0.15:
        label = "Negative"
        conf = min(0.99, 0.5 + abs(score))
    else:
        label = "Neutral"
        conf = 0.5 + (0.3 - abs(score))
    return label, round(conf, 2)


def emotion_detector(text: str) -> str:
    """Multi-class emotion: Happy, Angry, Sad, Fear, Neutral."""
    if not text or not str(text).strip():
        return "Neutral"
    tokens = tokenization(str(text))
    if not tokens:
        return "Neutral"
    counts = {e: 0 for e in EMOTION_LEXICON}
    for word in tokens:
        for emotion, keywords in EMOTION_LEXICON.items():
            if word in keywords:
                counts[emotion] += 1
    best = max(counts, key=counts.get)
    if counts[best] == 0:
        return "Neutral"
    return best.capitalize()


def load_data_from_df(df: pd.DataFrame) -> pd.DataFrame:
    """Normalize dataframe: expect columns like tweet_id, timestamp, handle, content or text."""
    df = df.copy()
    text_col = None
    for c in ["content", "text", "tweet", "tweet_text", "body"]:
        if c in df.columns:
            text_col = c
            break
    if text_col is None and len(df.columns) > 0:
        text_col = df.columns[-1]
    if text_col:
        df["content"] = df[text_col].astype(str)
    if "tweet_id" not in df.columns and "id" in df.columns:
        df["tweet_id"] = df["id"]
    elif "tweet_id" not in df.columns:
        df["tweet_id"] = df.index.astype(str)
    if "timestamp" not in df.columns and "created_at" in df.columns:
        df["timestamp"] = df["created_at"]
    elif "timestamp" not in df.columns:
        df["timestamp"] = ""
    if "handle" not in df.columns and "username" in df.columns:
        df["handle"] = df["username"]
    elif "handle" not in df.columns:
        df["handle"] = ""
    return df


def preprocess_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Add cleaned text and tokens columns."""
    df = df.copy()
    if "content" not in df.columns:
        return df
    df["cleaned_text"] = df["content"].apply(clean_text)
    df["tokens"] = df["content"].apply(lambda x: tokenization(str(x)))
    return df


def add_sentiment_to_df(df: pd.DataFrame) -> pd.DataFrame:
    """Add sentiment and confidence columns."""
    df = df.copy()
    if "cleaned_text" not in df.columns:
        df["cleaned_text"] = df["content"].apply(clean_text)
    out = []
    for _, row in df.iterrows():
        label, conf = sentiment_classifier(row.get("cleaned_text", row.get("content", "")))
        out.append({"sentiment": label, "confidence": conf})
    res = pd.DataFrame(out)
    df["sentiment"] = res["sentiment"]
    df["confidence"] = res["confidence"]
    return df


def add_emotion_to_df(df: pd.DataFrame) -> pd.DataFrame:
    """Add emotion column."""
    df = df.copy()
    if "cleaned_text" not in df.columns:
        df["cleaned_text"] = df["content"].apply(clean_text)
    df["emotion"] = df["cleaned_text"].apply(emotion_detector)
    return df


def generate_visualization_data(df: pd.DataFrame) -> dict:
    """Produce aggregates for pie, bar, line, word cloud."""
    if df.empty or "sentiment" not in df.columns:
        return {
            "sentiment_counts": {"Positive": 0, "Negative": 0, "Neutral": 0},
            "emotion_counts": {},
            "sentiment_over_time": [],
            "top_words": [],
            "candidate_comparison": [],
        }
    sentiment_counts = df["sentiment"].value_counts().to_dict()
    for k in ["Positive", "Negative", "Neutral"]:
        sentiment_counts.setdefault(k, 0)
    emotion_counts = df["emotion"].value_counts().to_dict() if "emotion" in df.columns else {}
    # Time series: by date if timestamp exists
    sentiment_over_time = []
    if "timestamp" in df.columns and pd.notna(df["timestamp"]).any():
        try:
            df["_date"] = pd.to_datetime(df["timestamp"], errors="coerce").dt.date
            for d in df["_date"].dropna().unique():
                sub = df[df["_date"] == d]
                sentiment_over_time.append({
                    "date": str(d),
                    "Positive": (sub["sentiment"] == "Positive").sum(),
                    "Negative": (sub["sentiment"] == "Negative").sum(),
                    "Neutral": (sub["sentiment"] == "Neutral").sum(),
                })
        except Exception:
            pass
    # Top words from tokens
    from collections import Counter
    all_tokens = []
    for t in df.get("tokens", []) if "tokens" in df.columns else []:
        all_tokens.extend(t if isinstance(t, list) else [])
    top_words = [{"word": w, "count": c} for w, c in Counter(all_tokens).most_common(50)]
    return {
        "sentiment_counts": sentiment_counts,
        "emotion_counts": emotion_counts,
        "sentiment_over_time": sentiment_over_time[:31],
        "top_words": top_words,
        "candidate_comparison": [],
    }


def export_report_summary(df: pd.DataFrame) -> str:
    """Generate text summary for report."""
    if df.empty:
        return "No data analyzed yet."
    lines = []
    lines.append("Twitter Sentiment Analysis – Data Driven Emotion")
    lines.append("=" * 50)
    lines.append(f"Total tweets analyzed: {len(df)}")
    if "sentiment" in df.columns:
        for label in ["Positive", "Negative", "Neutral"]:
            c = (df["sentiment"] == label).sum()
            pct = round(100 * c / len(df), 1)
            lines.append(f"  {label}: {c} ({pct}%)")
    if "emotion" in df.columns:
        lines.append("\nEmotion distribution:")
        for e, c in df["emotion"].value_counts().items():
            lines.append(f"  {e}: {c}")
    return "\n".join(lines)
