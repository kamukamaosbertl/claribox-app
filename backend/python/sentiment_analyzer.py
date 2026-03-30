# backend/python/sentiment_analyzer.py
# ─────────────────────────────────────────────────────────────────
# VERSION 3 — VADER + NRCLex (refined + override rules)
#
# Why VADER over TextBlob?
#   VADER is purpose-built for short social/app feedback. It handles
#   slang, emphasis ("LOVE it"), punctuation ("bad!!!"), and negation
#   ("not good") better than TextBlob's older pattern-based approach.
#
# Why keep NRCLex for emotion?
#   NRCLex uses the NRC Emotion Lexicon — lightweight and workable on
#   Render free tier, unlike transformer models.
#
# Output shape (unchanged — fully compatible with existing routes/models):
#   label           — positive | negative | neutral
#   score           — compound score (-1.0 to +1.0)
#   emotion         — excited | satisfied | hopeful | angry |
#                     disappointed | confused | neutral_emotion
#   emotion_trigger — trigger source/category for the emotion
#   reason          — (optional) explains any neutral override
# ─────────────────────────────────────────────────────────────────

import re
import json
import sys
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from nrclex import NRCLex

# ── Shared analyser instance (avoid re-init on every call) ───────
_vader = SentimentIntensityAnalyzer()

# ── Emotion map: NRC categories → our system labels ─────────────
EMOTION_MAP = {
    'joy':          'excited',
    'trust':        'satisfied',
    'anticipation': 'hopeful',
    'anger':        'angry',
    'disgust':      'angry',
    'sadness':      'disappointed',
    'fear':         'disappointed',
    'surprise':     'confused'
}

# ── Contrast words — triggers mixed/neutral override ────────────
CONTRAST_WORDS = [
    'but', 'however', 'although', 'though', 'yet',
    'on the other hand', 'not always', 'other times',
    'it depends', 'depends', 'varies'
]

# ── Phrase rules — applied BEFORE/alongside VADER scoring ───────
# Each tuple:
#   (pattern, score, emotion, mode)
#
# mode:
#   - "override" → trust the rule score directly
#   - "blend"    → average the rule score with VADER
#
# This lets us stop polite criticism like "could be better" from being
# incorrectly rescued into positive territory by VADER.
PHRASE_RULES = [
    # Negation/common polarity flips
    (r'\bnot bad\b',             0.30, 'satisfied',      'blend'),
    (r'\bnot terrible\b',        0.25, 'satisfied',      'blend'),
    (r'\bnot awful\b',           0.25, 'satisfied',      'blend'),
    (r'\bnot good\b',           -0.35, 'disappointed',   'override'),
    (r'\bnot great\b',          -0.30, 'disappointed',   'override'),
    (r'\bnot helpful\b',        -0.35, 'disappointed',   'override'),
    (r'\bnot intuitive\b',      -0.40, 'confused',       'override'),
    (r'\bnot clear\b',          -0.35, 'confused',       'override'),
    (r'\bnot easy to use\b',    -0.45, 'confused',       'override'),
    (r'\bnot slow\b',            0.08, 'satisfied',      'override'),

    # Negative phrases
    (r'\btoo slow\b',            -0.50, 'disappointed',  'override'),
    (r'\btakes forever\b',       -0.50, 'angry',         'override'),
    (r'\bnever works\b',         -0.60, 'angry',         'override'),
    (r'\balways broken\b',       -0.60, 'angry',         'override'),
    (r'\bnot working\b',         -0.50, 'angry',         'override'),
    (r'\bkeeps failing\b',       -0.50, 'angry',         'override'),
    (r'\bcould be better\b',     -0.25, 'disappointed',  'override'),
    (r'\bexpected more\b',       -0.35, 'disappointed',  'override'),
    (r'\bwaste of time\b',       -0.60, 'angry',         'override'),
    (r'\bso confusing\b',        -0.40, 'confused',      'override'),
    (r'\bhard to use\b',         -0.40, 'confused',      'override'),
    (r'\bdifficult to use\b',    -0.40, 'confused',      'override'),
    (r'\bnot sure how to use\b', -0.35, 'confused',      'override'),
    (r'\bi hate this\b',         -0.70, 'angry',         'override'),
    (r'\bi hate\b',              -0.65, 'angry',         'override'),

    # Neutral / soft-improvement phrases
    (r'\bokay i guess\b',         0.00, 'neutral_emotion', 'override'),
    (r'\bi hope they improve\b',  0.00, 'hopeful',         'override'),
    (r'\bhope they improve\b',    0.00, 'hopeful',         'override'),
    (r'\bcould improve\b',       -0.05, 'hopeful',         'override'),

    # Positive phrases
    (r'\beasy to use\b',          0.50, 'satisfied',     'blend'),
    (r'\blove it\b',              0.70, 'excited',       'blend'),
    (r'\bworks great\b',          0.60, 'satisfied',     'blend'),
    (r'\bworks perfectly\b',      0.60, 'satisfied',     'blend'),
    (r'\bhighly recommend\b',     0.70, 'excited',       'blend'),
    (r'\bgreat experience\b',     0.70, 'excited',       'blend'),
    (r'\bso helpful\b',           0.60, 'satisfied',     'blend'),
]

# ── Single-word rules — for very short inputs like "bad", "slow" ─
SINGLE_WORD_RULES = {
    'slow':       (-0.4, 'disappointed'),
    'broken':     (-0.5, 'angry'),
    'confusing':  (-0.3, 'confused'),
    'confused':   (-0.3, 'confused'),
    'unclear':    (-0.3, 'confused'),
    'laggy':      (-0.4, 'disappointed'),
    'buggy':      (-0.4, 'disappointed'),
    'useless':    (-0.6, 'angry'),
    'terrible':   (-0.6, 'angry'),
    'awful':      (-0.6, 'angry'),
    'bad':        (-0.5, 'disappointed'),
    'poor':       (-0.4, 'disappointed'),
    'love':       ( 0.6, 'excited'),
    'perfect':    ( 0.7, 'excited'),
    'excellent':  ( 0.6, 'excited'),
    'amazing':    ( 0.7, 'excited'),
    'awesome':    ( 0.7, 'excited'),
    'great':      ( 0.5, 'satisfied'),
    'good':       ( 0.4, 'satisfied'),
    'clean':      ( 0.3, 'satisfied'),
    'helpful':    ( 0.4, 'satisfied'),
    'fast':       ( 0.3, 'satisfied'),
}


# ═══════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════

def check_phrase_rules(text_lower):
    """
    Scan text against PHRASE_RULES using regex.

    Returns:
        (score_override, emotion_override, trigger_override, mode)
        or (None, None, None, None)

    If multiple phrases match:
    - average scores to keep mixed phrases near neutral
    - if any matched rule uses "override", final mode becomes override
    """
    matched_scores = []
    matched_emotions = []
    matched_modes = []

    for pattern, score, emotion, mode in PHRASE_RULES:
        if re.search(pattern, text_lower):
            matched_scores.append(score)
            matched_emotions.append(emotion)
            matched_modes.append(mode)

    if not matched_scores:
        return None, None, None, None

    avg_score = sum(matched_scores) / len(matched_scores)

    # Stable "most common" pick for emotion.
    counts = {}
    for emotion in matched_emotions:
        counts[emotion] = counts.get(emotion, 0) + 1
    dominant_emotion = max(matched_emotions, key=lambda e: counts[e])

    final_mode = 'override' if 'override' in matched_modes else 'blend'
    return avg_score, dominant_emotion, 'phrase_rule', final_mode


def check_single_word(text_lower):
    """
    For very short inputs, check single-word rules.

    Only applies when the entire stripped text is exactly one known word.
    Returns (score, emotion, trigger) or (None, None, None).
    """
    stripped = text_lower.strip()
    if stripped in SINGLE_WORD_RULES:
        score, emotion = SINGLE_WORD_RULES[stripped]
        return score, emotion, 'single_word_rule'
    return None, None, None


def has_contrast(text_lower):
    """
    Check if text contains a contrast/concession word using word
    boundaries. Prevents false matches like "butler" → "but".
    """
    for word in CONTRAST_WORDS:
        pattern = r'\b' + re.escape(word) + r'\b'
        if re.search(pattern, text_lower):
            return True
    return False


def detect_emotion(text):
    """
    Detect dominant emotion using NRCLex 4.x API.
    Returns (emotion_label, trigger_category).
    Falls back gracefully to neutral_emotion on any error.
    """
    try:
        e = NRCLex()
        e.load_raw_text(text)

        freqs = {
            emo: score
            for emo, score in e.affect_frequencies.items()
            if emo not in ('positive', 'negative') and score > 0
        }

        if not freqs:
            return 'neutral_emotion', None

        dominant_nrc = max(freqs, key=freqs.get)
        mapped_emotion = EMOTION_MAP.get(dominant_nrc, 'neutral_emotion')
        return mapped_emotion, dominant_nrc

    except Exception:
        return 'neutral_emotion', None


def classify_label(score):
    """
    Convert a numeric score to a sentiment label.

    Slightly wider neutral band than raw VADER defaults, because
    product feedback often contains mild or mixed sentiment.
      > 0.10  = positive
      < -0.10 = negative
      else    = neutral
    """
    if score > 0.10:
        return 'positive'
    elif score < -0.10:
        return 'negative'
    return 'neutral'


def build_result(label, score, emotion, trigger, reason=None):
    """Build the standard output dict. reason is omitted if None."""
    result = {
        'label':           label,
        'score':           round(score, 3),
        'emotion':         emotion,
        'emotion_trigger': trigger
    }
    if reason:
        result['reason'] = reason
    return result


# ═══════════════════════════════════════════════════════════════
# MAIN FUNCTION
# ═══════════════════════════════════════════════════════════════

def analyze_sentiment(text):
    """
    Full pipeline:
      1. Single-word shortcut  — handles "bad", "slow", etc.
      2. Phrase rules          — handles "too slow", "not bad", etc.
      3. VADER scoring         — main sentiment engine
      4. Blend/override rules  — smoother or stricter phrase behavior
      5. Emotion selection     — rule emotion first, NRCLex fallback
      6. Contrast detection    — mixed sentences → neutral override
      7. Label classification  — score → positive/negative/neutral
    """

    if not text or len(text.strip()) < 2:
        return build_result('neutral', 0.0, 'neutral_emotion', None)

    text_lower = text.lower().strip()

    # ── Step 1: Single-word shortcut ────────────────────────────
    sw_score, sw_emotion, sw_trigger = check_single_word(text_lower)
    if sw_score is not None:
        label = classify_label(sw_score)
        return build_result(label, sw_score, sw_emotion, sw_trigger)

    # ── Step 2: Phrase rules ─────────────────────────────────────
    phrase_score, phrase_emotion, phrase_trigger, phrase_mode = check_phrase_rules(text_lower)

    # ── Step 3: VADER scoring ────────────────────────────────────
    vader_scores = _vader.polarity_scores(text)
    compound_score = vader_scores['compound']

    # ── Step 4: Blend or override based on phrase rule mode ─────
    if phrase_score is not None:
        if phrase_mode == 'override':
            final_score = phrase_score
        elif compound_score != 0.0:
            final_score = (phrase_score + compound_score) / 2
        else:
            final_score = phrase_score
    else:
        final_score = compound_score

    # ── Step 5: Emotion selection priority ───────────────────────
    # Rule-based emotion wins when we explicitly matched a phrase.
    if phrase_emotion is not None:
        final_emotion = phrase_emotion
        final_trigger = phrase_trigger
    else:
        nrc_emotion, nrc_trigger = detect_emotion(text)
        final_emotion = nrc_emotion
        final_trigger = nrc_trigger

    # ── Step 6: Contrast override ────────────────────────────────
    # Mixed sentences should not be confidently labeled when the
    # final score is weak/moderate.
    if has_contrast(text_lower) and abs(final_score) < 0.3:
        return build_result(
            'neutral',
            final_score,
            final_emotion,
            final_trigger,
            reason='contrast_detected'
        )

    # ── Step 7: Final label ──────────────────────────────────────
    label = classify_label(final_score)
    return build_result(label, final_score, final_emotion, final_trigger)


# ═══════════════════════════════════════════════════════════════
# TEST BLOCK
# ═══════════════════════════════════════════════════════════════

if __name__ == '__main__':
    # If piped input, analyze it directly
    if not sys.stdin.isatty():
        text = sys.stdin.read().strip()
        print(json.dumps(analyze_sentiment(text)))
        sys.exit(0)

    # Otherwise run built-in test cases
    TEST_CASES = [
        ('I like the design but it feels slow',     'neutral'),
        ('bad',                                     'negative'),
        ('love it',                                 'positive'),
        ('slow',                                    'negative'),
        ('confusing',                               'negative'),
        ('too slow',                                'negative'),
        ('takes forever',                           'negative'),
        ('easy to use',                             'positive'),
        ('could be better',                         'negative'),
        ('expected more',                           'negative'),
        ('The facilities are excellent',            'positive'),
        ('I hate this completely',                  'negative'),
        ('okay i guess',                            'neutral'),
        ('The class runs on Mondays',               'neutral'),
        ('I am so frustrated the wifi never works', 'negative'),
        ('I hope they improve the cafeteria',       'neutral'),
        ('This is absolutely amazing',              'positive'),
        ('disappointed with the service',           'negative'),
        ('not sure how to use this feature',        'negative'),
        ('easy to use but takes forever to load',   'neutral'),
        ('not bad',                                 'positive'),
        ('not good',                                'negative'),
        ('not slow',                                'neutral'),
        ('not clear',                               'negative'),
    ]

    passed = 0
    print(f'\n{"Input":<45} {"Expected":<10} {"Got":<10} {"Score":<8} {"Emotion":<15} {"Status"}')
    print('─' * 105)

    for text, expected in TEST_CASES:
        result = analyze_sentiment(text)
        got = result['label']
        status = '✅ PASS' if got == expected else '❌ FAIL'
        if got == expected:
            passed += 1
        print(f'{text[:44]:<45} {expected:<10} {got:<10} {result["score"]:<8} {result["emotion"]:<15} {status}')

    print(f'\nResult: {passed}/{len(TEST_CASES)} passed')