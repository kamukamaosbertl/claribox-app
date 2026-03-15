# backend/python/sentiment_analyzer.py
from textblob import TextBlob
import json
import sys

def analyze_sentiment(text):
    """Analyze sentiment using TextBlob"""
    if not text or len(text.strip()) < 5:
        return {"label": "neutral", "score": 0}
    
    blob = TextBlob(text)
    polarity = blob.sentiment.polarity
    
    # 🔹 More sensitive thresholds
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
    # Read text from stdin
    text = sys.stdin.read().strip()
    result = analyze_sentiment(text)
    print(json.dumps(result))