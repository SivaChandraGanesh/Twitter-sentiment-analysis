"""
NLP text cleaning utilities.
Handles: lowercase, URL removal, mention/hashtag removal,
punctuation removal, stopword removal, lemmatization.
"""
import re
import string
from typing import List

import nltk

# Download required NLTK resources (only on first run)
try:
    from nltk.corpus import stopwords
    from nltk.stem import WordNetLemmatizer
    STOP_WORDS = set(stopwords.words("english"))
    LEMMATIZER = WordNetLemmatizer()
except LookupError:
    nltk.download("stopwords", quiet=True)
    nltk.download("wordnet", quiet=True)
    nltk.download("omw-1.4", quiet=True)
    from nltk.corpus import stopwords
    from nltk.stem import WordNetLemmatizer
    STOP_WORDS = set(stopwords.words("english"))
    LEMMATIZER = WordNetLemmatizer()


def clean_text(
    text: str,
    *,
    lowercase: bool = True,
    remove_urls: bool = True,
    remove_mentions: bool = True,
    remove_hashtags: bool = False,
    remove_stopwords: bool = True,
    lemmatize: bool = True,
) -> str:
    """
    Apply configurable NLP preprocessing to a single text string.

    Returns the cleaned text as a single space-joined string.
    """
    if not isinstance(text, str):
        text = str(text)

    if lowercase:
        text = text.lower()

    if remove_urls:
        text = re.sub(r"http\S+|www\.\S+", "", text)

    if remove_mentions:
        text = re.sub(r"@\w+", "", text)

    if remove_hashtags:
        text = re.sub(r"#\w+", "", text)

    # Remove punctuation and digits
    text = text.translate(str.maketrans("", "", string.punctuation + string.digits))

    # Tokenize
    tokens: List[str] = text.split()

    if remove_stopwords:
        tokens = [t for t in tokens if t not in STOP_WORDS]

    if lemmatize:
        tokens = [LEMMATIZER.lemmatize(t) for t in tokens]

    return " ".join(tokens)


def tokenize(text: str) -> List[str]:
    """Return a list of cleaned tokens from a text string."""
    return clean_text(text).split()
