import torch
from transformers import pipeline
from functools import lru_cache
from .schemas import RedactSettings

MODEL_ID = "openai/privacy-filter"


@lru_cache(maxsize=1)
def _load_pipeline():
    device = 0 if torch.cuda.is_available() else -1
    print(f"[PII] Cargando modelo en {'GPU:0' if device == 0 else 'CPU'}...")
    return pipeline(
        task="token-classification",
        model=MODEL_ID,
        device=device,
        aggregation_strategy="simple",
    )


def detect_pii(text: str, settings: RedactSettings) -> list[dict]:
    if not text.strip():
        return []

    clf = _load_pipeline()

    CHUNK_WORDS = 3000
    OVERLAP_WORDS = 50
    words = text.split()

    if len(words) <= CHUNK_WORDS:
        results = clf(text)
        return _filter(results, settings)

    all_entities = []
    word_pos = 0
    while word_pos < len(words):
        chunk_words = words[word_pos:word_pos + CHUNK_WORDS]
        chunk_text = " ".join(chunk_words)

        char_offset = _word_index_to_char_offset(text, word_pos)

        chunk_results = clf(chunk_text)
        for entity in chunk_results:
            entity["start"] += char_offset
            entity["end"] += char_offset
        all_entities.extend(chunk_results)

        word_pos += CHUNK_WORDS - OVERLAP_WORDS

    all_entities = _deduplicate(all_entities)
    return _filter(all_entities, settings)


def _word_index_to_char_offset(text: str, word_index: int) -> int:
    if word_index == 0:
        return 0
    count = 0
    in_word = False
    for i, c in enumerate(text):
        if c.isspace():
            in_word = False
        elif not in_word:
            in_word = True
            if count == word_index:
                return i
            count += 1
    return len(text)


def _deduplicate(entities: list[dict]) -> list[dict]:
    if not entities:
        return entities
    entities.sort(key=lambda e: (e["start"], -e["end"]))
    deduped = [entities[0]]
    for e in entities[1:]:
        prev = deduped[-1]
        if e["start"] >= prev["end"]:
            deduped.append(e)
        elif e["score"] > prev["score"]:
            deduped[-1] = e
    return deduped


def _filter(entities: list[dict], settings: RedactSettings) -> list[dict]:
    return [
        e for e in entities
        if e["score"] >= settings.confidence_threshold
        and e["entity_group"] in settings.categories
    ]
