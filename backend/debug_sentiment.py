import sqlite3
import re
from nlp_pipeline import VADER, TextBlob, clean_text, sentiment_classifier

def analyze_db():
    conn = sqlite3.connect('database/db.sqlite')
    c = conn.cursor()
    c.execute('SELECT text FROM record LIMIT 10')
    rows = c.fetchall()
    
    print("Dataset Sentiment Review:")
    print("-" * 50)
    for row in rows:
        text = row[0]
        cleaned = clean_text(text)
        vader_scores = VADER.polarity_scores(cleaned)
        blob_score = TextBlob(cleaned).sentiment.polarity
        label, conf = sentiment_classifier(text)
        
        print(f"Original: {text[:80]}...")
        print(f"Cleaned:  {cleaned[:80]}...")
        print(f"VADER Compound: {vader_scores['compound']:.4f}")
        print(f"TextBlob Polarity: {blob_score:.4f}")
        print(f"Final Label: {label} ({conf})")
        print("-" * 50)
        
    c.execute('SELECT sentiment, count(*) FROM record GROUP BY sentiment')
    print(f"Total Counts: {c.fetchall()}")
    conn.close()

if __name__ == "__main__":
    analyze_db()
