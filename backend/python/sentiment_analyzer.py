# backend/python/sentiment_analyzer.py
from textblob import TextBlob
import json
import sys

# ─────────────────────────────────────────────
# WHAT WAS WRONG (previous version):
#   1. CONTRAST_WORDS included neutral-opinion words like "okay", "decent",
#      "acceptable", "average" — these are mild sentiments, not mixed signals.
#      This caused genuine positive/negative feedback to be overridden to neutral.
#
#   2. Contrast threshold was 0.35 — too high. It was neutralizing sentences
#      with a clear lean just because they contained a common word like "but".
#
#   3. Subjectivity cutoff was 0.25 — too high. Real opinions like
#      "The lectures are boring" score around 0.3–0.5 and were being
#      misclassified as factual/neutral.
#
#   4. Polarity band was ±0.15 — too wide for TextBlob, which rarely
#      exceeds ±0.5 even for strongly worded text. This ate up too much signal.
#
# WHAT IS FIXED NOW:
#   1. CONTRAST_WORDS trimmed to only true contrast/concession words.
#      Mild opinions (okay, decent, average) removed — they carry real sentiment.
#
#   2. Contrast threshold tightened to 0.15 — only neutralize if polarity
#      is genuinely ambiguous, not just mildly leaning.
#
#   3. Subjectivity cutoff dropped to 0.10 — only catches robotic/factual
#      text, not everyday opinion language.
#
#   4. Polarity band narrowed to ±0.05 — restores TextBlob's natural range
#      so weak-but-real sentiments are correctly labelled positive/negative.
# ─────────────────────────────────────────────

# Only true contrast/concession words — NOT mild opinions
CONTRAST_WORDS = [
    'but', 'however', 'although', 'though', 'yet',
    'on the other hand', 'not always', 'other times',
    'it depends', 'depends', 'varies'
]

def analyze_sentiment(text):
    """
    Analyze sentiment using TextBlob with corrected contrast and subjectivity checks.

    Returns a dict with:
        label  — "positive", "negative", or "neutral"
        score  — raw TextBlob polarity (-1.0 to +1.0)
        reason — (optional) explains why a neutral override was applied
    """

    # Guard: too short to analyze meaningfully
    if not text or len(text.strip()) < 5:
        return {"label": "neutral", "score": 0}

    blob         = TextBlob(text)
    polarity     = blob.sentiment.polarity      # -1.0 (very negative) → +1.0 (very positive)
    subjectivity = blob.sentiment.subjectivity  #  0.0 (objective)     →  1.0 (subjective)

    text_lower = text.lower()

    # ── Check 1: Contrast words + genuinely weak score = neutral ────────
    # Only override when the sentence has a true contrast word AND the
    # polarity is so close to zero it has no clear direction.
    has_contrast = any(word in text_lower for word in CONTRAST_WORDS)
    if has_contrast and abs(polarity) < 0.15:
        return {
            "label": "neutral",
            "score": round(polarity, 2),
            "reason": "contrast_detected"
        }

    # ── Check 2: Truly objective/factual sentence = neutral ─────────────
    # Only catches robotic or purely factual statements (subjectivity < 0.10).
    # Regular opinion language (e.g. "boring", "great") scores 0.3–0.8 and
    # will NOT be caught here.
    if subjectivity < 0.10:
        return {
            "label": "neutral",
            "score": round(polarity, 2),
            "reason": "low_subjectivity"
        }

    # ── Check 3: Polarity classification — narrow neutral band ──────────
    # ±0.05 keeps the neutral zone tight so weak-but-real sentiments
    # are correctly labelled instead of being swallowed by a wide dead-zone.
    if polarity > 0.05:
        label = "positive"
    elif polarity < -0.05:
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