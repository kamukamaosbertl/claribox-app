# backend/python/sentiment_analyzer.py
# ─────────────────────────────────────────────────────────────────
# VERSION 3 — VADER + NRCLex (refined + override rules)
# ─────────────────────────────────────────────────────────────────

# ── Render NLTK fix — MUST be first, before any other imports ────
import os
import sys
import warnings
import io

warnings.filterwarnings('ignore')
_old_stderr = sys.stderr
_old_stdout = sys.stdout
#sys.stderr = io.StringIO()
#sys.stdout = io.StringIO()

import nltk
nltk.data.path.insert(0, '/opt/render/nltk_data')
nltk.data.path.insert(0, '/opt/render/project/src/.venv/nltk_data')

for _resource, _path in [
    ('punkt',     'tokenizers/punkt'),
    ('punkt_tab', 'tokenizers/punkt_tab'),
    ('wordnet',   'corpora/wordnet'),
    ('omw-1.4',   'corpora/omw-1.4'),
]:
    try:
        nltk.data.find(_path)
    except (LookupError, OSError):   # ← add OSError here
        nltk.download(_resource, download_dir='/opt/render/nltk_data', quiet=True)

sys.stderr = _old_stderr
sys.stdout = _old_stdout 
# ── End Render NLTK fix ──────────────────────────────────────────

# ── Debug — confirm wordnet path at runtime ───────────────────
import sys as _sys
_wordnet_path = '/opt/render/nltk_data/corpora/wordnet'
_wordnet_found = os.path.exists(_wordnet_path)
print(f"[DEBUG] wordnet found at {_wordnet_path}: {_wordnet_found}", file=_sys.stderr)
# ── End debug ─────────────────────────────────────────────────

import re
import json
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

# ── Phrase rules ─────────────────────────────────────────────────
PHRASE_RULES = [
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
    (r'\bokay i guess\b',         0.00, 'neutral_emotion', 'override'),
    (r'\bi hope they improve\b',  0.00, 'hopeful',         'override'),
    (r'\bhope they improve\b',    0.00, 'hopeful',         'override'),
    (r'\bcould improve\b',       -0.05, 'hopeful',         'override'),
    (r'\beasy to use\b',          0.50, 'satisfied',     'blend'),
    (r'\blove it\b',              0.70, 'excited',       'blend'),
    (r'\bworks great\b',          0.60, 'satisfied',     'blend'),
    (r'\bworks perfectly\b',      0.60, 'satisfied',     'blend'),
    (r'\bhighly recommend\b',     0.70, 'excited',       'blend'),
    (r'\bgreat experience\b',     0.70, 'excited',       'blend'),
    (r'\bso helpful\b',           0.60, 'satisfied',     'blend'),
]

# ── Single-word rules ────────────────────────────────────────────
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
    counts = {}
    for emotion in matched_emotions:
        counts[emotion] = counts.get(emotion, 0) + 1
    dominant_emotion = max(matched_emotions, key=lambda e: counts[e])
    final_mode = 'override' if 'override' in matched_modes else 'blend'
    return avg_score, dominant_emotion, 'phrase_rule', final_mode


def check_single_word(text_lower):
    stripped = text_lower.strip()
    if stripped in SINGLE_WORD_RULES:
        score, emotion = SINGLE_WORD_RULES[stripped]
        return score, emotion, 'single_word_rule'
    return None, None, None


def has_contrast(text_lower):
    for word in CONTRAST_WORDS:
        pattern = r'\b' + re.escape(word) + r'\b'
        if re.search(pattern, text_lower):
            return True
    return False


def detect_emotion(text):
    try:
        try:
            e = NRCLex(text)
        except TypeError:
            e = NRCLex('')
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
    if score > 0.10:
        return 'positive'
    elif score < -0.10:
        return 'negative'
    return 'neutral'


def build_result(label, score, emotion, trigger, reason=None):
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
    if not text or len(text.strip()) < 2:
        return build_result('neutral', 0.0, 'neutral_emotion', None)

    text_lower = text.lower().strip()

    sw_score, sw_emotion, sw_trigger = check_single_word(text_lower)
    if sw_score is not None:
        label = classify_label(sw_score)
        return build_result(label, sw_score, sw_emotion, sw_trigger)

    phrase_score, phrase_emotion, phrase_trigger, phrase_mode = check_phrase_rules(text_lower)

    vader_scores = _vader.polarity_scores(text)
    compound_score = vader_scores['compound']

    if phrase_score is not None:
        if phrase_mode == 'override':
            final_score = phrase_score
        elif compound_score != 0.0:
            final_score = (phrase_score + compound_score) / 2
        else:
            final_score = phrase_score
    else:
        final_score = compound_score

    if phrase_emotion is not None:
        final_emotion = phrase_emotion
        final_trigger = phrase_trigger
    else:
        nrc_emotion, nrc_trigger = detect_emotion(text)
        final_emotion = nrc_emotion
        final_trigger = nrc_trigger

    if has_contrast(text_lower) and abs(final_score) < 0.3:
        return build_result(
            'neutral', final_score, final_emotion, final_trigger,
            reason='contrast_detected'
        )

    label = classify_label(final_score)
    return build_result(label, final_score, final_emotion, final_trigger)


# ═══════════════════════════════════════════════════════════════
# ENTRY POINT — reads from stdin, prints JSON to stdout
# ═══════════════════════════════════════════════════════════════

if __name__ == '__main__':
    if not sys.stdin.isatty():
        try:
            text = sys.stdin.read().strip()
            print(json.dumps(analyze_sentiment(text)))
        except Exception as e:
            print(json.dumps({
                'label': 'neutral',
                'score': 0.0,
                'emotion': 'neutral_emotion',
                'emotion_trigger': None,
                'error': str(e)
            }))
        sys.exit(0)

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