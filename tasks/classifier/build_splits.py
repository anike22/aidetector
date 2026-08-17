#!/usr/bin/env python3
"""Rebuild train/calibration/validation/holdout splits from collected raw files."""

import json
import os
import random
import re

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
RAW_DIR = os.path.join(DATA_DIR, "raw")
SPLIT_DIR = os.path.join(DATA_DIR, "splits")


def load_jsonl(path: str) -> list[dict]:
    rows = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                rows.append(json.loads(line))
    return rows


def write_jsonl(path: str, rows: list[dict]):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")


def split_by_source(records: list[dict], train_ratio=0.55, cal_ratio=0.15, val_ratio=0.15):
    """Group by 'source' then shuffle groups to avoid same article/question in multiple splits."""
    groups: dict[str, list[dict]] = {}
    for rec in records:
        groups.setdefault(rec["source"], []).append(rec)
    keys = list(groups.keys())
    random.shuffle(keys)
    n = len(keys)
    n_train = int(n * train_ratio)
    n_cal = int(n * cal_ratio)
    n_val = int(n * val_ratio)
    train_keys = set(keys[:n_train])
    cal_keys = set(keys[n_train : n_train + n_cal])
    val_keys = set(keys[n_train + n_cal : n_train + n_cal + n_val])
    hold_keys = set(keys[n_train + n_cal + n_val :])
    splits = {"train": [], "calibration": [], "validation": [], "holdout": []}
    for k, v in groups.items():
        if k in train_keys:
            splits["train"].extend(v)
        elif k in cal_keys:
            splits["calibration"].extend(v)
        elif k in val_keys:
            splits["validation"].extend(v)
        else:
            splits["holdout"].extend(v)
    return splits


def load_ai_texts(*paths: str) -> list[str]:
    texts = []
    for path in paths:
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                texts.extend(json.load(f))
    return texts


def build_english_splits():
    """English uses the pre-split HC3 data plus additional AI-generated prose."""
    extra_ai_texts = load_ai_texts(
        os.path.join(DATA_DIR, "ai_formal_en.json"),
        os.path.join(DATA_DIR, "ai_diverse_en.json"),
    )

    for split_name in ["train", "calibration", "validation", "holdout"]:
        src = os.path.join(SPLIT_DIR, split_name, "en_hc3.jsonl")
        dst = os.path.join(SPLIT_DIR, split_name, "en.jsonl")
        if not os.path.exists(src):
            print(f"Warning: {src} not found")
            continue
        rows = load_jsonl(src)
        # Add extra AI samples to the training split only to avoid leakage.
        if split_name == "train" and extra_ai_texts:
            for i, text in enumerate(extra_ai_texts):
                rows.append({
                    "text": text,
                    "language": "en",
                    "region": "general",
                    "content_type": "general",
                    "origin": "ai",
                    "source": f"extra-ai-en:{i}",
                    "word_count": len(text.split()),
                    "model_family": "llm-gateway",
                    "generation_date": None,
                    "editing_status": "original",
                    "translation_status": "original",
                })
            random.shuffle(rows)
        write_jsonl(dst, rows)
        print(f"  en {split_name}: {len(rows)}")


def split_ai_randomly(records: list[dict]) -> dict[str, list[dict]]:
    """Distribute AI samples randomly across splits to ensure balanced presence."""
    random.shuffle(records)
    n = len(records)
    n_train = int(n * 0.55)
    n_cal = int(n * 0.15)
    n_val = int(n * 0.15)
    return {
        "train": records[:n_train],
        "calibration": records[n_train : n_train + n_cal],
        "validation": records[n_train + n_cal : n_train + n_cal + n_val],
        "holdout": records[n_train + n_cal + n_val :],
    }


def build_language_splits(lang: str):
    """Spanish/Arabic use Wikipedia human passages + synthetic AI samples + formal AI prose."""
    human = load_jsonl(os.path.join(RAW_DIR, f"{lang}_human.jsonl"))
    ai = load_jsonl(os.path.join(RAW_DIR, f"{lang}_ai.jsonl"))
    formal_ai_path = os.path.join(DATA_DIR, f"ai_formal_{lang}.json")
    if os.path.exists(formal_ai_path):
        with open(formal_ai_path, "r", encoding="utf-8") as f:
            formal_texts = json.load(f)
        for i, text in enumerate(formal_texts):
            ai.append({
                "text": text,
                "language": lang,
                "region": "general",
                "content_type": "general",
                "origin": "ai",
                "source": f"formal-ai-{lang}:{i}",
                "word_count": len(text.split()),
                "model_family": "llm-gateway",
                "generation_date": None,
                "editing_status": "original",
                "translation_status": "original",
            })
    print(f"{lang}: {len(human)} human passages, {len(ai)} AI samples")

    # Human split by article source to avoid leakage; AI split randomly across splits.
    human_splits = split_by_source(human)
    ai_splits = split_ai_randomly(ai)

    for split_name in ["train", "calibration", "validation", "holdout"]:
        rows = human_splits[split_name] + ai_splits[split_name]
        random.shuffle(rows)
        dst = os.path.join(SPLIT_DIR, split_name, f"{lang}.jsonl")
        write_jsonl(dst, rows)
        ai_count = sum(1 for r in ai_splits[split_name] if r["origin"] == "ai")
        print(f"  {lang} {split_name}: {len(rows)} (AI={ai_count})")


def main():
    random.seed(42)
    os.makedirs(SPLIT_DIR, exist_ok=True)
    for split_name in ["train", "calibration", "validation", "holdout"]:
        os.makedirs(os.path.join(SPLIT_DIR, split_name), exist_ok=True)

    build_english_splits()
    build_language_splits("es")
    build_language_splits("ar")


if __name__ == "__main__":
    main()
