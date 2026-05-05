from flask import Flask, request, jsonify
import sys
import os
import json

import faiss  # type: ignore
import numpy as np
from keybert import KeyBERT
from sentence_transformers import SentenceTransformer

# Make sure Python can find sentiment_analyzer.py
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sentiment_analyzer import analyze_sentiment, load_models

app = Flask(__name__)

MODEL_NAME = "all-MiniLM-L6-v2"
MAX_TEXT_LENGTH = 3000
EMBEDDING_DIM = 384

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

FAISS_INDEX_PATH = os.path.join(BASE_DIR, "faiss_index.bin")
FAISS_META_PATH = os.path.join(BASE_DIR, "faiss_meta.json")

CATEGORY_INDEX_PATH = os.path.join(BASE_DIR, "faiss_categories.bin")
CATEGORY_META_PATH = os.path.join(BASE_DIR, "faiss_categories_meta.json")

BAD_TAGS = {
    "issue",
    "problem",
    "bad service",
    "poor service",
    "bad",
    "poor",
    "slow",
    "late",
    "comes",
}

print("Loading sentiment/emotion model...", flush=True)
load_models()

print("Loading embedding + keyword models...", flush=True)
embedding_model = SentenceTransformer(MODEL_NAME)
kw_model = KeyBERT(model=embedding_model)

faiss_index = faiss.IndexFlatIP(EMBEDDING_DIM)
faiss_metadata = []

category_index = faiss.IndexFlatIP(EMBEDDING_DIM)
category_metadata = []


def save_faiss_state():
    faiss.write_index(faiss_index, FAISS_INDEX_PATH)

    with open(FAISS_META_PATH, "w", encoding="utf-8") as f:
        json.dump(faiss_metadata, f, ensure_ascii=False, indent=2)


def load_faiss_state():
    global faiss_index, faiss_metadata

    if os.path.exists(FAISS_INDEX_PATH):
        faiss_index = faiss.read_index(FAISS_INDEX_PATH)
        print(f"Loaded FAISS index from {FAISS_INDEX_PATH}", flush=True)

    if os.path.exists(FAISS_META_PATH):
        with open(FAISS_META_PATH, "r", encoding="utf-8") as f:
            faiss_metadata = json.load(f)
        print(f"Loaded FAISS metadata from {FAISS_META_PATH}", flush=True)


def save_category_state():
    faiss.write_index(category_index, CATEGORY_INDEX_PATH)

    with open(CATEGORY_META_PATH, "w", encoding="utf-8") as f:
        json.dump(category_metadata, f, ensure_ascii=False, indent=2)


def load_category_state():
    global category_index, category_metadata

    if os.path.exists(CATEGORY_INDEX_PATH):
        category_index = faiss.read_index(CATEGORY_INDEX_PATH)
        print(f"Loaded category FAISS index from {CATEGORY_INDEX_PATH}", flush=True)

    if os.path.exists(CATEGORY_META_PATH):
        with open(CATEGORY_META_PATH, "r", encoding="utf-8") as f:
            category_metadata = json.load(f)
        print(f"Loaded category FAISS metadata from {CATEGORY_META_PATH}", flush=True)


load_faiss_state()
load_category_state()

print("Combined sentiment + NLP + FAISS server ready.", flush=True)


def clean_text(text: str) -> str:
    return " ".join((text or "").split())[:MAX_TEXT_LENGTH]


def improve_tags(text: str, raw_tags: list[str]) -> list[str]:
    tags = []
    seen = set()

    for tag in raw_tags:
        tag = tag.strip().lower()

        if not tag:
            continue
        if len(tag) < 4:
            continue
        if tag in BAD_TAGS:
            continue
        if tag not in seen:
            seen.add(tag)
            tags.append(tag)

    text_lower = text.lower()

    if "lecturer" in text_lower and "late" in text_lower and "late lecturer" not in seen:
        tags.insert(0, "late lecturer")
        seen.add("late lecturer")

    if "wifi" in text_lower and "slow" in text_lower and "slow wifi" not in seen:
        tags.insert(0, "slow wifi")
        seen.add("slow wifi")

    if "explain" in text_lower and "poor explanation" not in seen:
        tags.append("poor explanation")
        seen.add("poor explanation")

    if "marks" in text_lower and "missing marks" not in seen:
        tags.append("missing marks")
        seen.add("missing marks")

    if "dirty" in text_lower and ("compound" in text_lower or "campus" in text_lower):
        if "campus cleanliness" not in seen:
            tags.append("campus cleanliness")
            seen.add("campus cleanliness")

    return tags[:5]


def create_embedding(text: str) -> list[float]:
    cleaned = clean_text(text)

    if not cleaned:
        return []

    embedding = embedding_model.encode(cleaned, normalize_embeddings=True)
    return embedding.tolist()


@app.get("/health")
def health():
    return jsonify({
        "status": "ok",
        "service": "combined_sentiment_nlp_faiss_server",
        "model": MODEL_NAME,
        "faiss_index_size": faiss_index.ntotal,
        "category_index_size": category_index.ntotal,
    })


@app.post("/analyze")
@app.post("/analyse")
def analyze():
    try:
        data = request.get_json(silent=True) or {}
        text = clean_text(data.get("text", ""))

        if not text:
            return jsonify({
                "success": True,
                "label": "neutral",
                "score": 0,
                "emotion": "neutral",
                "tags": [],
                "embedding": [],
            })

        sentiment_result = analyze_sentiment(text)

        keywords = kw_model.extract_keywords(
            text,
            keyphrase_ngram_range=(2, 3),
            stop_words="english",
            top_n=8,
            use_mmr=True,
            diversity=0.7,
        )

        raw_tags = [kw[0] for kw in keywords if kw and kw[0]]
        tags = improve_tags(text, raw_tags)

        embedding = create_embedding(text)

        result = {
            "success": True,
            "label": sentiment_result.get("label", "neutral"),
            "score": sentiment_result.get("score", 0),
            "emotion": sentiment_result.get("emotion", "neutral"),
            "tags": tags,
            "embedding": embedding,
        }

        print(
            f'Analyzed: "{text[:80]}" -> '
            f'label={result["label"]}, emotion={result["emotion"]}, tags={tags}',
            flush=True,
        )

        return jsonify(result)

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e),
            "label": "neutral",
            "score": 0,
            "emotion": "neutral",
            "tags": [],
            "embedding": [],
        }), 500


@app.post("/embed")
def embed():
    try:
        data = request.get_json(silent=True) or {}
        text = data.get("text", "")

        embedding = create_embedding(text)

        return jsonify({
            "success": True,
            "embedding": embedding,
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e),
            "embedding": [],
        }), 500


@app.post("/faiss/add")
def faiss_add():
    try:
        global faiss_metadata

        data = request.get_json(silent=True) or {}
        embedding = data.get("embedding", [])
        metadata = data.get("metadata", {})

        if not embedding or not isinstance(embedding, list):
            return jsonify({
                "success": False,
                "message": "Embedding is required",
            }), 400

        vector = np.array([embedding], dtype="float32")

        if vector.shape[1] != EMBEDDING_DIM:
            return jsonify({
                "success": False,
                "message": f"Expected embedding dimension {EMBEDDING_DIM}, got {vector.shape[1]}",
            }), 400

        faiss_index.add(vector)
        faiss_id = faiss_index.ntotal - 1

        faiss_metadata.append({
            "faissId": int(faiss_id),
            "metadata": metadata,
        })

        save_faiss_state()

        return jsonify({
            "success": True,
            "faissId": int(faiss_id),
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e),
        }), 500


@app.post("/faiss/category/add")
def category_add():
    try:
        global category_metadata

        data = request.get_json(silent=True) or {}
        embedding = data.get("embedding", [])
        metadata = data.get("metadata", {})

        if not embedding or not isinstance(embedding, list):
            return jsonify({
                "success": False,
                "message": "Embedding is required",
            }), 400

        vector = np.array([embedding], dtype="float32")

        if vector.shape[1] != EMBEDDING_DIM:
            return jsonify({
                "success": False,
                "message": f"Expected embedding dimension {EMBEDDING_DIM}, got {vector.shape[1]}",
            }), 400

        category_index.add(vector)
        faiss_id = category_index.ntotal - 1

        category_metadata.append({
            "faissId": int(faiss_id),
            "metadata": metadata,
        })

        save_category_state()

        return jsonify({
            "success": True,
            "faissId": int(faiss_id),
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e),
        }), 500


@app.post("/faiss/category/search")
def category_search():
    try:
        data = request.get_json(silent=True) or {}
        embedding = data.get("embedding", [])
        top_k = int(data.get("topK", 3))

        if not embedding or not isinstance(embedding, list):
            return jsonify({
                "success": False,
                "message": "Embedding is required",
                "results": [],
            }), 400

        if category_index.ntotal == 0:
            return jsonify({
                "success": True,
                "results": [],
            })

        query_vector = np.array([embedding], dtype="float32")

        if query_vector.shape[1] != EMBEDDING_DIM:
            return jsonify({
                "success": False,
                "message": f"Expected embedding dimension {EMBEDDING_DIM}, got {query_vector.shape[1]}",
                "results": [],
            }), 400

        scores, indices = category_index.search(query_vector, top_k)

        results = []

        for score, idx in zip(scores[0], indices[0]):
            if idx == -1:
                continue

            meta = next(
                (item for item in category_metadata if item["faissId"] == int(idx)),
                None,
            )

            results.append({
                "faissId": int(idx),
                "score": float(score),
                "metadata": meta["metadata"] if meta else {},
            })

        return jsonify({
            "success": True,
            "results": results,
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e),
            "results": [],
        }), 500


@app.post("/faiss/search")
def faiss_search():
    try:
        data = request.get_json(silent=True) or {}
        embedding = data.get("embedding", [])
        top_k = int(data.get("topK", 5))

        if not embedding or not isinstance(embedding, list):
            return jsonify({
                "success": False,
                "message": "Embedding is required",
                "results": [],
            }), 400

        if faiss_index.ntotal == 0:
            return jsonify({
                "success": True,
                "results": [],
            })

        query_vector = np.array([embedding], dtype="float32")

        if query_vector.shape[1] != EMBEDDING_DIM:
            return jsonify({
                "success": False,
                "message": f"Expected embedding dimension {EMBEDDING_DIM}, got {query_vector.shape[1]}",
                "results": [],
            }), 400

        scores, indices = faiss_index.search(query_vector, top_k)

        results = []

        for score, idx in zip(scores[0], indices[0]):
            if idx == -1:
                continue

            meta = next(
                (item for item in faiss_metadata if item["faissId"] == int(idx)),
                None,
            )

            results.append({
                "faissId": int(idx),
                "score": float(score),
                "metadata": meta["metadata"] if meta else {},
            })

        return jsonify({
            "success": True,
            "results": results,
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e),
            "results": [],
        }), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, debug=False, threaded=True)