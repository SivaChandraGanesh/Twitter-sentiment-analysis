import sqlite3
from nlp_pipeline import sentiment_classifier, clean_text

def test_on_db_data():
    conn = sqlite3.connect('database/db.sqlite')
    c = conn.cursor()
    c.execute('SELECT text FROM record LIMIT 5')
    rows = c.fetchall()
    conn.close()
    
    for row in rows:
        text = row[0]
        cleaned = clean_text(text)
        try:
            res = sentiment_classifier(cleaned or text)
            print(f"TEXT: {text[:50]}...")
            print(f"CLEANED: {cleaned[:50]}...")
            print(f"RESULT: {res}")
        except Exception as e:
            print(f"ERROR on text: {e}")
        print("-" * 20)

if __name__ == "__main__":
    test_on_db_data()
