import nltk
try:
    from nlp_pipeline import sentiment_classifier
    sentiment_classifier("test text")
    print("ALL_GOOD")
except LookupError as e:
    print(f"MISSING_RESOURCE: {e}")
except Exception as e:
    print(f"OTHER_ERROR: {e}")
