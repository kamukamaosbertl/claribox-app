# =============================================================================
# sentiment_analyzer.py
#
# Purpose:
#   Analyze student feedback and return:
#     1. sentiment: positive / negative / neutral
#     2. sentiment confidence score
#     3. emotion: joy / anger / sadness / fear / surprise / disgust / neutral
#
# Why this version is corrected:
#   - The actual sentiment model is tabularisai/robust-sentiment-analysis.
#   - That model may return labels like:
#       LABEL_0, LABEL_1, LABEL_2, LABEL_3, LABEL_4
#     OR text labels like:
#       Very Negative, Negative, Neutral, Positive, Very Positive
#   - The previous code only handled text labels.
#   - So when the model returned LABEL_3 or LABEL_4, your code failed to recognize it
#     and defaulted to neutral.
#   - That is why clearly positive feedback showed as Neutral.
#
# Install:
#   pip install transformers torch
# =============================================================================

import json
import os
import sys
import warnings

warnings.filterwarnings("ignore")
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")

# =============================================================================
# MODEL NAMES
# =============================================================================

_SENTIMENT_MODEL = "tabularisai/robust-sentiment-analysis"
_EMOTION_MODEL = "j-hartmann/emotion-english-distilroberta-base"

_SENTIMENT_FALLBACK = "neutral"
_EMOTION_FALLBACK = "neutral"

_sentiment_pipeline = None
_emotion_pipeline = None


def load_models() -> None:
    """
    Load both models once and reuse them.

    Reason:
        Loading transformer models is expensive.
        If we load them on every request, the app becomes painfully slow.
    """
    global _sentiment_pipeline, _emotion_pipeline

    try:
        from transformers import pipeline

        print("[sentiment_analyzer] Loading sentiment model...", file=sys.stderr)

        _sentiment_pipeline = pipeline(
            "sentiment-analysis",
            model=_SENTIMENT_MODEL,
            top_k=None,
        )

        print("[sentiment_analyzer] Sentiment model loaded.", file=sys.stderr)

    except Exception as exc:
        print(
            f"[sentiment_analyzer] WARNING: sentiment model failed to load: {exc}",
            file=sys.stderr,
        )
        _sentiment_pipeline = None

    try:
        from transformers import pipeline

        print("[sentiment_analyzer] Loading emotion model...", file=sys.stderr)

        _emotion_pipeline = pipeline(
            "text-classification",
            model=_EMOTION_MODEL,
            top_k=None,
        )

        print("[sentiment_analyzer] Emotion model loaded.", file=sys.stderr)

    except Exception as exc:
        print(
            f"[sentiment_analyzer] WARNING: emotion model failed to load: {exc}",
            file=sys.stderr,
        )
        _emotion_pipeline = None


def normalize_sentiment_label(raw_label: str) -> str:
    """
    Convert model-specific labels into app labels.

    Reason:
        Different Hugging Face models return different label formats.
        This function protects your dashboard from showing wrong values.

    Examples:
        LABEL_0         -> negative
        LABEL_1         -> negative
        LABEL_2         -> neutral
        LABEL_3         -> positive
        LABEL_4         -> positive
        Very Positive   -> positive
        Positive        -> positive
    """
    if not raw_label:
        return _SENTIMENT_FALLBACK

    cleaned = raw_label.strip().lower().replace("_", " ")

    label_map = {
        # Numeric labels used by some 5-class sentiment models
        "label 0": "negative",
        "label 1": "negative",
        "label 2": "neutral",
        "label 3": "positive",
        "label 4": "positive",

        # Text labels used by tabularisai-style sentiment models
        "very negative": "negative",
        "negative": "negative",
        "neutral": "neutral",
        "positive": "positive",
        "very positive": "positive",

        # Extra common variants
        "neg": "negative",
        "neu": "neutral",
        "pos": "positive",
    }

    return label_map.get(cleaned, _SENTIMENT_FALLBACK)


def predict_sentiment(text: str) -> tuple[str, float, str]:
    """
    Run sentiment prediction.

    Returns:
        label:
            positive / negative / neutral

        score:
            confidence score from the model

        trigger:
            transformer = model worked
            fallback    = model failed
    """
    if _sentiment_pipeline is None:
        return _SENTIMENT_FALLBACK, 0.0, "fallback"

    try:
        results = _sentiment_pipeline(text)

        # Some pipelines return [[{...}, {...}]]
        # Others return [{...}, {...}]
        # This makes both formats safe.
        if results and isinstance(results[0], list):
            results = results[0]

        best = max(results, key=lambda item: item["score"])

        raw_label = str(best.get("label", ""))
        score = round(float(best.get("score", 0.0)), 3)

        label = normalize_sentiment_label(raw_label)

        # Helpful debug log.
        # This goes to stderr, so it should not break JSON output.
        print(
            f"[sentiment_analyzer] sentiment raw={raw_label}, normalized={label}, score={score}",
            file=sys.stderr,
        )

        return label, score, "transformer"

    except Exception as exc:
        print(
            f"[sentiment_analyzer] WARNING: sentiment prediction failed: {exc}",
            file=sys.stderr,
        )
        return _SENTIMENT_FALLBACK, 0.0, "fallback"


def normalize_emotion_label(raw_label: str) -> str:
    """
    Normalize emotion labels.

    Reason:
        Keeps output clean and predictable for frontend/dashboard.
    """
    if not raw_label:
        return _EMOTION_FALLBACK

    cleaned = raw_label.strip().lower().replace("_", " ")

    valid_emotions = {
        "joy",
        "anger",
        "sadness",
        "fear",
        "surprise",
        "disgust",
        "neutral",
    }

    return cleaned if cleaned in valid_emotions else _EMOTION_FALLBACK


def predict_emotion(text: str) -> tuple[str, str]:
    """
    Run emotion prediction.

    Returns:
        emotion:
            joy / anger / sadness / fear / surprise / disgust / neutral

        trigger:
            transformer = model worked
            fallback    = model failed
    """
    if _emotion_pipeline is None:
        return _EMOTION_FALLBACK, "fallback"

    try:
        results = _emotion_pipeline(text)

        if results and isinstance(results[0], list):
            results = results[0]

        best = max(results, key=lambda item: item["score"])

        raw_emotion = str(best.get("label", ""))
        emotion = normalize_emotion_label(raw_emotion)

        print(
            f"[sentiment_analyzer] emotion raw={raw_emotion}, normalized={emotion}",
            file=sys.stderr,
        )

        return emotion, "transformer"

    except Exception as exc:
        print(
            f"[sentiment_analyzer] WARNING: emotion prediction failed: {exc}",
            file=sys.stderr,
        )
        return _EMOTION_FALLBACK, "fallback"


def analyze_sentiment(text: str) -> dict:
    """
    Main function used by the backend.

    Reason:
        Keeps one clean output shape for the Node/Express side.
    """
    if not text or len(text.strip()) < 2:
        return {
            "label": "neutral",
            "score": 0.0,
            "sentiment_trigger": "fallback",
            "emotion": "neutral",
            "emotion_trigger": "fallback",
        }

    label, score, sentiment_trigger = predict_sentiment(text)
    emotion, emotion_trigger = predict_emotion(text)

    return {
        "label": label,
        "score": score,
        "sentiment_trigger": sentiment_trigger,
        "emotion": emotion,
        "emotion_trigger": emotion_trigger,
    }


if __name__ == "__main__":
    load_models()

    try:
        # 1. Prefer command-line argument:
        # python sentiment_analyzer.py "feedback text here"
        if len(sys.argv) > 1:
            input_text = " ".join(sys.argv[1:]).strip()

        # 2. Otherwise read from stdin:
        # echo "feedback text here" | python sentiment_analyzer.py
        else:
            input_text = sys.stdin.read().strip()

        result = analyze_sentiment(input_text)
        print(json.dumps(result))

    except Exception as exc:
        print(
            json.dumps({
                "label": "neutral",
                "score": 0.0,
                "sentiment_trigger": "fallback",
                "emotion": _EMOTION_FALLBACK,
                "emotion_trigger": "fallback",
                "error": str(exc),
            })
        )