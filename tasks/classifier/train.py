#!/usr/bin/env python3
"""
Train compact per-language authorship classifiers.

Each language gets its own character n-gram TF-IDF vocabulary and logistic-regression weights.
Only numpy is required.
"""

import json
import math
import os
import random
from collections import Counter

import numpy as np

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
MAX_FEATURES = 2500
NGRAM_RANGE = (2, 5)
MAX_SAMPLES_PER_CLASS = 600
LR = 1.0
EPOCHS = 500
L2 = 0.01


def load_jsonl(path: str) -> list[dict]:
    rows = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                rows.append(json.loads(line))
    return rows


def char_ngrams(text: str, min_n: int, max_n: int) -> list[str]:
    text = text.lower()
    grams = []
    for n in range(min_n, max_n + 1):
        if len(text) < n:
            continue
        for i in range(len(text) - n + 1):
            grams.append(text[i : i + n])
    return grams


def build_vocab(texts: list[str], max_features: int, min_df: int = 2) -> list[str]:
    df = Counter()
    for text in texts:
        unique_grams = set(char_ngrams(text, *NGRAM_RANGE))
        for g in unique_grams:
            df[g] += 1
    filtered = [(g, c) for g, c in df.items() if c >= min_df]
    filtered.sort(key=lambda x: x[1], reverse=True)
    return [g for g, c in filtered[:max_features]]


def compute_tfidf(texts: list[str], vocab: list[str], idf: np.ndarray | None = None) -> np.ndarray:
    """Sub-linear TF-IDF on character n-grams: tf = log(1 + count)."""
    vocab_index = {g: i for i, g in enumerate(vocab)}
    V = len(vocab)
    N = len(texts)
    X = np.zeros((N, V), dtype=np.float32)
    if idf is None:
        df = np.zeros(V, dtype=np.float32)
        for i, text in enumerate(texts):
            unique_grams = set(char_ngrams(text, *NGRAM_RANGE))
            for g in unique_grams:
                idx = vocab_index.get(g)
                if idx is not None:
                    df[idx] += 1
        idf = np.log((N + 1) / (1 + df)) + 1.0
    for i, text in enumerate(texts):
        counts = Counter(char_ngrams(text, *NGRAM_RANGE))
        for g, c in counts.items():
            idx = vocab_index.get(g)
            if idx is not None:
                tf = math.log(1 + c)
                X[i, idx] = tf * idf[idx]
    return X, idf


def sigmoid(z: np.ndarray) -> np.ndarray:
    out = np.zeros_like(z, dtype=np.float32)
    pos = z >= 0
    neg = ~pos
    out[pos] = 1 / (1 + np.exp(-z[pos]))
    exp_z = np.exp(z[neg])
    out[neg] = exp_z / (1 + exp_z)
    return out


def train_logistic_regression(X: np.ndarray, y: np.ndarray, lr: float, epochs: int, l2: float, seed: int = 42) -> tuple[np.ndarray, float]:
    rng = np.random.default_rng(seed)
    N, V = X.shape
    w = rng.normal(0, 0.01, size=V).astype(np.float32)
    b = 0.0
    for epoch in range(epochs):
        z = X @ w + b
        p = sigmoid(z)
        error = p - y
        grad_w = (X.T @ error) / N + l2 * w
        grad_b = error.mean()
        w -= lr * grad_w
        b -= lr * grad_b
        if (epoch + 1) % 50 == 0:
            loss = -(y * np.log(p + 1e-8) + (1 - y) * np.log(1 - p + 1e-8)).mean() + 0.5 * l2 * (w @ w)
            print(f"  epoch {epoch + 1}/{epochs} loss={loss:.4f}")
    return w, float(b)


def subsample_balanced(records: list[dict], seed: int = 42) -> list[dict]:
    random.seed(seed)
    human = [r for r in records if r["origin"] == "human"]
    ai = [r for r in records if r["origin"] == "ai"]
    cap = min(MAX_SAMPLES_PER_CLASS, len(human), len(ai))
    if cap <= 0:
        return records
    human = random.sample(human, cap)
    ai = random.sample(ai, cap)
    combined = human + ai
    random.shuffle(combined)
    return combined


def evaluate(model: dict, records: list[dict], lang: str) -> dict:
    vocab = model["vocab"]
    idf = np.array(model["idf"], dtype=np.float32)
    coef = np.array(model["coef"], dtype=np.float32)
    intercept = model["intercept"]
    texts = [r["text"] for r in records]
    X, _ = compute_tfidf(texts, vocab, idf)
    probs = sigmoid(X @ coef + intercept)
    preds = (probs >= 0.5).astype(int)
    labels = np.array([1 if r["origin"] == "ai" else 0 for r in records], dtype=np.int32)
    tp = int(((preds == 1) & (labels == 1)).sum())
    fp = int(((preds == 1) & (labels == 0)).sum())
    tn = int(((preds == 0) & (labels == 0)).sum())
    fn = int(((preds == 0) & (labels == 1)).sum())
    precision = tp / (tp + fp) if (tp + fp) else 0
    recall = tp / (tp + fn) if (tp + fn) else 0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) else 0
    specificity = tn / (tn + fp) if (tn + fp) else 0
    return {
        "language": lang,
        "samples": len(records),
        "ai_samples": int(labels.sum()),
        "human_samples": int((1 - labels).sum()),
        "accuracy": (tp + tn) / len(records),
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "specificity": specificity,
        "false_positive_rate": fp / (fp + tn) if (fp + tn) else 0,
        "false_negative_rate": fn / (fn + tp) if (fn + tp) else 0,
        "confusion": {"TP": tp, "FP": fp, "TN": tn, "FN": fn},
    }


def main():
    os.makedirs(MODEL_DIR, exist_ok=True)
    languages = ["en", "es", "ar"]
    all_models: dict[str, dict] = {}
    evaluation: dict[str, list[dict]] = {}

    for lang in languages:
        print(f"\nTraining {lang} model...")
        train_records = load_jsonl(os.path.join(DATA_DIR, "splits", "train", f"{lang}.jsonl"))
        balanced = subsample_balanced(train_records)
        print(f"  balanced training: {len(balanced)} (ai={sum(1 for r in balanced if r['origin']=='ai')})")

        texts = [r["text"] for r in balanced]
        y = np.array([1 if r["origin"] == "ai" else 0 for r in balanced], dtype=np.float32)
        ai_count = int(y.sum())
        human_count = int((1 - y).sum())
        if ai_count < 30 or human_count < 30:
            print(f"  Skipping {lang}: insufficient samples (ai={ai_count}, human={human_count})")
            continue

        vocab = build_vocab(texts, MAX_FEATURES)
        print(f"  vocab size: {len(vocab)}")
        X, idf = compute_tfidf(texts, vocab)
        w, b = train_logistic_regression(X, y, LR, EPOCHS, L2)

        all_models[lang] = {
            "vocab": vocab,
            "idf": idf.astype(float).tolist(),
            "coef": w.astype(float).tolist(),
            "intercept": float(b),
            "maxFeatures": len(vocab),
            "ngramRange": list(NGRAM_RANGE),
            "trainingSamples": len(balanced),
        }

        evaluation[lang] = []
        for split in ["validation", "holdout"]:
            records = load_jsonl(os.path.join(DATA_DIR, "splits", split, f"{lang}.jsonl"))
            metrics = evaluate(all_models[lang], records, lang)
            metrics["split"] = split
            evaluation[lang].append(metrics)
            print(f"  {split}: acc={metrics['accuracy']:.3f} prec={metrics['precision']:.3f} rec={metrics['recall']:.3f} f1={metrics['f1']:.3f} (ai={metrics['ai_samples']})")

    model_package = {
        "version": "classifier-v1.0.0",
        "type": "per-language-character-ngram-logistic-regression",
        "languages": list(all_models.keys()),
        "languageModels": all_models,
    }
    model_path = os.path.join(MODEL_DIR, "authorship_classifier_v1.json")
    with open(model_path, "w", encoding="utf-8") as f:
        json.dump(model_package, f, ensure_ascii=False)
    print(f"\nModel saved to {model_path}")

    eval_path = os.path.join(MODEL_DIR, "evaluation.json")
    with open(eval_path, "w", encoding="utf-8") as f:
        json.dump(evaluation, f, ensure_ascii=False, indent=2)
    print(f"Evaluation metrics saved to {eval_path}")


if __name__ == "__main__":
    main()
