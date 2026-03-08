"""
fix_db_sentiment.py â€” Direct DB repair script.

Uses TextBlob-only polarity classification (matching the original Google Colab notebook approach)
to give results consistent with Positive~10290, Neutral~10217, Negative~5918.

Run from the backend directory:
    python fix_db_sentiment.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import pandas as pd
import sqlite3
from datetime import datetime
from textblob import TextBlob

# â”€â”€ Config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CSV_PATH = r"C:\Users\manna\Downloads\archive\final_raw.csv"
DB_PATH = os.path.join(os.path.dirname(__file__), "database", "db.sqlite")
BATCH_SIZE = 1000
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

print("=" * 60)
print("  DB Repair â€” TextBlob Sentiment (Colab-matched)")
print("=" * 60)


def classify_sentiment(text: str):
    """TextBlob polarity â€” matches the original Colab notebook approach."""
    try:
        polarity = TextBlob(str(text)).sentiment.polarity
        subjectivity = TextBlob(str(text)).sentiment.subjectivity
        if polarity > 0:
            return "Positive", round(0.5 + polarity * 0.5, 4)
        elif polarity < 0:
            return "Negative", round(0.5 + abs(polarity) * 0.5, 4)
        else:
            return "Neutral", 0.5
    except Exception:
        return "Neutral", 0.5


def detect_emotion(text: str) -> str:
    """Simple keyword emotion detection."""
    EMOTION_LEXICON = {
        "Happy":   ["happy", "joy", "love", "great", "amazing", "excited", "hope", "win", "best", "wonderful", "fantastic", "proud", "celebrate"],
        "Angry":   ["angry", "mad", "hate", "outrage", "furious", "disgust", "wrong", "terrible", "awful", "corrupt", "lie", "cheat"],
        "Sad":     ["sad", "depressed", "loss", "cry", "grief", "sorry", "regret", "worried", "concern", "tragic", "miss"],
        "Fear":    ["fear", "scared", "afraid", "anxious", "panic", "threat", "danger", "crisis", "uncertain", "terror"],
    }
    words = str(text).lower().split()
    word_set = set(words)
    scores = {emo: sum(1 for kw in kws if kw in word_set) for emo, kws in EMOTION_LEXICON.items()}
    best_emo = max(scores, key=scores.get)
    return best_emo if scores[best_emo] > 0 else "Neutral"


def clean_text(text: str) -> str:
    import re
    t = str(text).lower().strip()
    t = re.sub(r"https?://\S+|www\.\S+", "", t)
    t = re.sub(r"@\w+", "", t)
    t = re.sub(r"#\w+", "", t)
    t = re.sub(r"[^\w\s]", " ", t)
    t = re.sub(r"\s+", " ", t)
    return t.strip()


# â”€â”€ Read CSV â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
print(f"[1/4] Reading CSV: {CSV_PATH}")
df = pd.read_csv(CSV_PATH, encoding="utf-8", on_bad_lines="skip")
print(f"      Columns: {list(df.columns)}")
print(f"      Total rows: {len(df)}")

# Text column detection
text_col = None
for c in ["Text", "text", "Tweet", "tweet", "content", "Content"]:
    if c in df.columns:
        text_col = c
        break
if text_col is None:
    str_cols = df.select_dtypes(include="object").columns.tolist()
    text_col = max(str_cols, key=lambda c: df[c].astype(str).str.len().mean())

print(f"      Text column: '{text_col}'")
df["_text"] = df[text_col].astype(str).str.strip()
df_valid = df[~df["_text"].str.lower().isin(["nan", "none", ""])].copy().reset_index(drop=True)
print(f"      Valid rows: {len(df_valid)}")

# â”€â”€ Run TextBlob Sentiment â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
print(f"\n[2/4] Running TextBlob sentiment analysis on {len(df_valid)} tweets...")
sentiments, confidences, emotions, clean_texts = [], [], [], []
counts = {"Positive": 0, "Negative": 0, "Neutral": 0}
n = len(df_valid)

for i, row in df_valid.iterrows():
    raw = row["_text"]
    sent, conf = classify_sentiment(raw)
    emo = detect_emotion(raw)
    clean = clean_text(raw)

    sentiments.append(sent)
    confidences.append(conf)
    emotions.append(emo)
    clean_texts.append(clean)
    counts[sent] = counts.get(sent, 0) + 1

    if (i + 1) % 2000 == 0:
        pct = round(100 * (i + 1) / n, 1)
        print(f"      {i+1:,}/{n:,} ({pct}%) â†’ Pos:{counts['Positive']:,} Neg:{counts['Negative']:,} Neu:{counts['Neutral']:,}")

df_valid["_sentiment"] = sentiments
df_valid["_confidence"] = confidences
df_valid["_emotion"] = emotions
df_valid["_clean"] = clean_texts

total = len(sentiments)
print(f"\n[3/4] Results:")
print(f"      Positive : {counts['Positive']:6,}  ({100*counts['Positive']/total:.1f}%)")
print(f"      Negative : {counts['Negative']:6,}  ({100*counts['Negative']/total:.1f}%)")
print(f"      Neutral  : {counts['Neutral']:6,}  ({100*counts['Neutral']/total:.1f}%)")

# â”€â”€ Write to SQLite â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
print(f"\n[4/4] Writing {len(df_valid):,} rows to SQLite: {DB_PATH}")
conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()
cur.execute("DELETE FROM record")
conn.commit()
print(f"      Cleared old records.")

now = datetime.utcnow().isoformat()
batch = []
inserted = 0

for _, row in df_valid.iterrows():
    batch.append((
        str(row["_text"]),
        str(row["_clean"]),
        row["_sentiment"],
        row["_emotion"],
        float(row["_confidence"]),
        now,
    ))
    if len(batch) >= BATCH_SIZE:
        cur.executemany(
            "INSERT INTO record (text, clean_text, sentiment, emotion, confidence, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            batch
        )
        conn.commit()
        inserted += len(batch)
        print(f"      {inserted:,}/{len(df_valid):,} rows inserted...")
        batch.clear()

if batch:
    cur.executemany(
        "INSERT INTO record (text, clean_text, sentiment, emotion, confidence, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        batch
    )
    conn.commit()
    inserted += len(batch)
    batch.clear()

conn.close()

print(f"\n{'='*60}")
print(f"  DONE! {inserted:,} rows written to DB.")
print(f"  Positive: {counts['Positive']:,}  Negative: {counts['Negative']:,}  Neutral: {counts['Neutral']:,}")
print(f"  Refresh your dashboard â€” no restart needed!")
print(f"{'='*60}")
