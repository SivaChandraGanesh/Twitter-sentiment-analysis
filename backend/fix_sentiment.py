import sqlite3
from nlp_pipeline import sentiment_classifier, emotion_detector, tokenization, clean_text
from models.data_models import Record
from datetime import datetime

def fix_neutral_bias():
    conn = sqlite3.connect('database/db.sqlite')
    c = conn.cursor()
    c.execute('SELECT id, text FROM record WHERE sentiment = "Neutral" AND confidence = 0.5')
    rows = c.fetchall()
    
    total = len(rows)
    print(f"Found {total} potentially stuck Neutral records. Re-analyzing...")
    
    updates = []
    chunk_size = 500
    
    for i, (rid, raw) in enumerate(rows):
        try:
            cleaned = clean_text(raw)
            tokens = tokenization(raw)
            sentiment, confidence = sentiment_classifier(cleaned or raw)
            emotion = emotion_detector(raw, tokens=tokens)
            
            updates.append((sentiment, emotion, round(float(confidence), 4), rid))
        except Exception as e:
            if i < 10: # Only print first few errors
                print(f"Error on row {rid}: {e}")
            continue
            
        if (i + 1) % chunk_size == 0:
            c.executemany('UPDATE record SET sentiment=?, emotion=?, confidence=? WHERE id=?', updates)
            conn.commit()
            updates = []
            print(f"Processed {i + 1}/{total}...")
            
    if updates:
        c.executemany('UPDATE record SET sentiment=?, emotion=?, confidence=? WHERE id=?', updates)
        conn.commit()
        
    print("Re-analysis complete.")
    
    c.execute('SELECT sentiment, count(*) FROM record GROUP BY sentiment')
    print(f"New Distribution: {c.fetchall()}")
    conn.close()

if __name__ == "__main__":
    fix_neutral_bias()
