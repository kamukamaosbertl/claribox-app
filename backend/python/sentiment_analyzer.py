# backend/python/sentiment_analyzer.py
from textblob import TextBlob
import json
import sys

# ─────────────────────────────────────────────
# WHAT WAS WRONG:
#   TextBlob picks the dominant polarity and labels it — so a sentence like
#   "Some lecturers are good but others just read from slides" scores positive
#   because "good" outweighs "read from slides". The mixed/contrast nature
#   of the sentence is completely ignored.
#
# WHAT WE FIXED:
#   1. Contrast word detection — if the text contains words like "but",
#      "however", "sometimes", "depends", "varies" AND the score is low
#      (below 0.35), we override the label to neutral. Mixed sentences
#      should never be confidently positive or negative.
#
#   2. Tightened the neutral band — old thresholds were ±0.05 which is
#      too narrow. TextBlob scores most sentences between -0.3 and 0.3.
#      New thresholds are ±0.15 so weak positive/negative scores that
#      don't reflect strong sentiment land in neutral correctly.
#
#   3. Subjectivity check — TextBlob also gives a subjectivity score.
#      Very objective sentences (subjectivity < 0.3) tend to be factual
#      observations, not strong opinions — we treat these as neutral
#      regardless of polarity.
# ─────────────────────────────────────────────

# Words that signal a mixed or contrasting sentence
CONTRAST_WORDS = [
    'but', 'however', 'sometimes', 'depends', 'varies', 'other times',
    'not always', 'though', 'although', 'except', 'unless', 'yet',
    'on the other hand', 'mixed', 'average', 'okay', 'ok', 'decent',
    'acceptable', 'manageable', 'could be better', 'could use',
    'not bad', 'not great', 'it depends', 'most of the time'
]

def analyze_sentiment(text):
    """Analyze sentiment using TextBlob with contrast and subjectivity awareness"""

    # Guard: too short to analyze meaningfully
    if not text or len(text.strip()) < 5:
        return {"label": "neutral", "score": 0}

    blob     = TextBlob(text)
    polarity    = blob.sentiment.polarity      # -1.0 (negative) to +1.0 (positive)
    subjectivity = blob.sentiment.subjectivity # 0.0 (objective) to 1.0 (subjective)

    text_lower = text.lower()

    # ── Check 1: Contrast words present + weak score = neutral ──────────
    # If the sentence contains contrasting language AND the polarity is not
    # strong enough to be clearly positive or negative, call it neutral
    has_contrast = any(word in text_lower for word in CONTRAST_WORDS)
    if has_contrast and abs(polarity) < 0.35:
        return {
            "label": "neutral",
            "score": round(polarity, 2),
            "reason": "contrast_detected"
        }

    # ── Check 2: Very objective sentence = neutral ───────────────────────
    # Factual statements like "The bus runs on weekdays" have low subjectivity
    # They are observations, not opinions — treat them as neutral
    if subjectivity < 0.25:
        return {
            "label": "neutral",
            "score": round(polarity, 2),
            "reason": "low_subjectivity"
        }

    # ── Check 3: Tightened polarity thresholds ───────────────────────────
    # OLD: ±0.05 — too narrow, almost everything became positive or negative
    # NEW: ±0.15 — weak scores that don't reflect clear sentiment = neutral
    if polarity > 0.15:
        label = "positive"
    elif polarity < -0.15:
        label = "negative"
    else:
        label = "neutral"

    return {
        "label": label,
        "score": round(polarity, 2)
    }

if __name__ == "__main__":
    text = sys.stdin.read().strip()
    result = analyze_sentiment(text)
    print(json.dumps(result))