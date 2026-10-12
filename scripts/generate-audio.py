#!/usr/bin/env python3
"""Pre-generate Persian MP3s with edge-tts (fa-IR-DilaraNeural)."""

from __future__ import annotations

import asyncio
import hashlib
import json
import re
import sys
from pathlib import Path

VOICE_PRIMARY = "fa-IR-DilaraNeural"
VOICE_FALLBACK = "fa-IR-FaridNeural"
PERSIAN_RE = re.compile(r"[\u0600-\u06FF]")

# Microsoft moved synthesis off speech.platform.bing.com in Oct 2026 (edge-tts#490).
# Stock edge-tts 7.2.8 still points at the legacy host, which now 403s.

ROOT = Path(__file__).resolve().parents[1]
CONTENT_DIR = ROOT / "public" / "content"
AUDIO_DIR = ROOT / "public" / "audio"
MANIFEST_PATH = AUDIO_DIR / "manifest.json"

UI_PHRASES = [
    "سلام! من هُدی هستم. خوش آمدید.",
    "عالی! حالا بیایید شروع کنیم.",
    "لطفاً صدای گوشی خود را بلند کنید.",
    "خوب انتخاب کردید!",
    "عددها را شروع می‌کنیم!",
    "حروف الفبا را شروع می‌کنیم!",
    "سلام! بیایید درس امروز را شروع کنیم.",
    "اول درس قبلی را تمام کنیم",
    "عددها و حساب",
    "الفبا و خواندن",
    "آفرین!",
    "آفرین! درس تمام شد.",
    "نزدیک بود! دوباره امتحان کنید.",
    "یکسان هستند",
    "این",
]

NAME_TEMPLATES = [
    "سلام {name}! بیایید درس امروز را شروع کنیم.",
    "خوشحالم که شما را می‌شناسم، {name}!",
]
NAMES = ["مادر جان", "خانم جان", "مامان", "بانو"]


def normalize(text: str) -> str:
    return text.replace("\u064a", "\u06cc").replace("\u0643", "\u06a9").strip()


def content_hash(text: str) -> str:
    return hashlib.sha256(normalize(text).encode("utf-8")).hexdigest()[:32]


def should_speak(text: str) -> bool:
    key = normalize(text)
    return bool(key) and bool(PERSIAN_RE.search(key))


def collect_texts() -> set[str]:
    texts: set[str] = set()
    for name in ("math.json", "alphabet.json"):
        data = json.loads((CONTENT_DIR / name).read_text(encoding="utf-8"))
        for unit in data["units"]:
            if should_speak(unit.get("title", "")):
                texts.add(normalize(unit["title"]))
            for lesson in unit["lessons"]:
                if should_speak(lesson.get("title", "")):
                    texts.add(normalize(lesson["title"]))
                for exercise in lesson["exercises"]:
                    for field in ("audio_script", "prompt", "feedback_correct", "feedback_wrong"):
                        value = exercise.get(field) or ""
                        if should_speak(value):
                            texts.add(normalize(value))
                    answer = exercise.get("answer") or ""
                    if should_speak(answer):
                        texts.add(normalize(answer))
                        texts.add(normalize(f"این {answer} است. بعداً دوباره می‌بینیم."))
                    for option in exercise.get("distractors") or []:
                        if should_speak(str(option)):
                            texts.add(normalize(str(option)))

    for phrase in UI_PHRASES:
        if should_speak(phrase):
            texts.add(normalize(phrase))
    for template in NAME_TEMPLATES:
        for name in NAMES:
            texts.add(normalize(template.format(name=name)))
    return texts


def patch_edge_tts_host() -> None:
    import edge_tts.communicate as communicate
    from edge_tts.constants import TRUSTED_CLIENT_TOKEN

    communicate.WSS_URL = (
        "wss://api.msedgeservices.com/tts/cognitiveservices/websocket/v1"
        f"?Ocp-Apim-Subscription-Key={TRUSTED_CLIENT_TOKEN}"
    )


async def synthesize(text: str, dest: Path, sem: asyncio.Semaphore) -> tuple[str, bool, str]:
    import edge_tts

    key = content_hash(text)
    path = dest / f"{key}.mp3"
    if path.exists() and path.stat().st_size > 0:
        return key, True, "cached"
    if path.exists():
        path.unlink()

    async with sem:
        last_error = ""
        for voice in (VOICE_PRIMARY, VOICE_FALLBACK):
            for attempt in range(3):
                try:
                    communicate = edge_tts.Communicate(text, voice)
                    await communicate.save(str(path))
                    if path.exists() and path.stat().st_size > 0:
                        return key, True, voice
                except Exception as exc:  # noqa: BLE001
                    last_error = f"{voice}: {exc}"
                    await asyncio.sleep(1.5 * (attempt + 1))
        return key, False, last_error


async def main() -> int:
    patch_edge_tts_host()
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    texts = sorted(collect_texts())
    print(f"Generating {len(texts)} clips → {AUDIO_DIR}", flush=True)

    sem = asyncio.Semaphore(8)
    results: dict[str, tuple[str, bool, str]] = {}
    done = 0
    pending = [asyncio.create_task(_run_one(text, sem, results)) for text in texts]
    for task in asyncio.as_completed(pending):
        await task
        done += 1
        if done % 25 == 0 or done == len(texts):
            print(f"{done}/{len(texts)}", flush=True)

    manifest = {
        "voice": VOICE_PRIMARY,
        "fallbackVoice": VOICE_FALLBACK,
        "count": 0,
        "items": [],
    }
    failed = 0
    for text in texts:
        key, ok, info = results[text]
        if ok:
            manifest["items"].append({"hash": key, "text": text})
        else:
            failed += 1
            print(f"FAIL {key} {info} :: {text[:80]}", file=sys.stderr)

    manifest["count"] = len(manifest["items"])
    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {manifest['count']} files, {failed} failures", flush=True)
    return 1 if failed else 0


async def _run_one(
    text: str,
    sem: asyncio.Semaphore,
    results: dict[str, tuple[str, bool, str]],
) -> None:
    results[text] = await synthesize(text, AUDIO_DIR, sem)


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
