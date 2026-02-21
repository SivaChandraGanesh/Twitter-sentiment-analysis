import nltk
import ssl

try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

print("Downloading NLTK resources...")
resources = [
    'stopwords',
    'punkt',
    'punkt_tab',
    'brown',
    'wordnet',
    'averaged_perceptron_tagger',
    'averaged_perceptron_tagger_eng',
    'vader_lexicon',
    'omw-1.4'
]

for res in resources:
    try:
        nltk.download(res, quiet=True)
        print(f"  ✓ {res}")
    except Exception as e:
        print(f"  ✗ {res}: {e}")

print("Done.")
