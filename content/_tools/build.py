# -*- coding: utf-8 -*-
"""Builds math.json and alphabet.json for persian-learn (research-aligned v3).
Content lives in math_content.py and alphabet_content.py (exec'd here, sharing these helpers).
Placeholders in string VALUES (replaced at the end):
  ~ ZWNJ   ^ hamza above (کلمهٔ)   _ tatweel   @ fatha (زبر)   # kasra (زیر)   $ damma (پیش)   * shadda (تشدید)"""
import json, os, sys, unicodedata
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..")
sys.path.insert(0, HERE)
import signs as SG

P = "۰۱۲۳۴۵۶۷۸۹"
def D(n): return "".join(P[int(c)] for c in str(n))
W = ["صفر", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه", "ده", "یازده", "دوازده"]
WT = {10: "ده", 20: "بیست", 30: "سی", 40: "چهل", 50: "پنجاه", 60: "شصت", 70: "هفتاد", 80: "هشتاد",
      90: "نود", 100: "صد"}

FC = ["آفرین!", "عالی بود!", "درست است، آفرین بر شما!", "بسیار خوب!", "احسنت!",
      "خسته نباشید، کاملاً درست بود.", "دقیقاً همین است!", "عالی، همین~طور ادامه بدهید.",
      "آفرین، خیلی خوب پیش می~روید."]
INTRO_FC = ["خب، حالا تمرین کنیم.", "آماده~اید؟ برویم سراغ تمرین.", "بسیار خوب، حالا امتحانش کنیم."]
FW = {
    "count": ["با دقت یکی~یکی بشمارید و دوباره امتحان کنید.",
              "اشکالی ندارد؛ انگشتتان را روی هر کدام بگذارید و دوباره بشمارید.",
              "نزدیک بود! یک بار دیگر آرام بشمارید."],
    "listen": ["دوباره گوش کنیم؛ بعد انتخاب کنید.",
               "اشکالی ندارد؛ دکمه^ صدا را بزنید و دوباره گوش کنید.",
               "دقت کنید و دوباره امتحان کنید."],
    "compare": ["دو طرف را دوباره با دقت نگاه کنید.",
                "اشکالی ندارد؛ هر طرف را جدا بشمارید و دوباره امتحان کنید."],
    "build": ["ترتیب حرف~ها را دوباره نگاه کنید؛ از راست شروع کنید.",
              "اشکالی ندارد؛ کلمه را آرام بگویید و حرف~ها را به ترتیب بچینید."],
    "trace": ["دوباره از نقطه^ شروع، آرام و با حوصله بکشید.",
              "اشکالی ندارد؛ یک بار دیگر روی خط~ها بکشید."],
    "line": ["قدم~ها را یکی~یکی بشمارید و دوباره امتحان کنید.",
             "اشکالی ندارد؛ از اول، آرام جلو بروید."],
    "match": ["یکی از جفت~ها درست نیست؛ دوباره نگاه کنید.",
              "اشکالی ندارد؛ با حوصله دوباره وصل کنید."],
    "calc": ["دوباره با دقت حساب کنید؛ می~توانید با انگشت بشمارید.",
             "اشکالی ندارد؛ یک بار دیگر آرام حساب کنید."],
    "money": ["اسکناس~ها را یکی~یکی دوباره بشمارید.",
              "اشکالی ندارد؛ مبلغ هر اسکناس را دوباره نگاه کنید."],
    "clock": ["به عقربه^ کوتاه نگاه کنید؛ روی کدام عدد است؟",
              "اشکالی ندارد؛ دوباره به ساعت نگاه کنید. عقربه^ کوتاه ساعت را نشان می~دهد."],
    "break": ["دوباره نگاه کنید: بعد از «ا»، «د»، «ر»، «ز»، «ژ» و «و» کلمه باز می~شود.",
              "اشکالی ندارد؛ حرف~هایی را پیدا کنید که به بعدی نمی~چسبند."],
    "gen": ["دوباره امتحان کنید.", "اشکالی ندارد؛ یک بار دیگر امتحان کنید.",
            "نزدیک بود! دوباره نگاه کنید.", "عجله نکنید؛ با حوصله دوباره امتحان کنید."],
}
FWKIND = {"equation": "calc", "count_money": "money", "pay_amount": "money", "make_change": "money",
          "read_clock": "clock", "count_objects": "count", "ten_frame": "count", "listen_choose": "listen",
          "compare_more_less": "compare", "build_word": "build", "trace_letter": "trace",
          "number_line": "line", "match_pairs": "match", "break_points": "break"}


class Track:
    def __init__(self, name, prefix):
        self.name, self.prefix, self.units, self.c = name, prefix, [], {}

    def _rot(self, key, lst):
        i = self.c.get(key, 0); self.c[key] = i + 1
        return lst[i % len(lst)]

    def unit(self, title, emoji, goal):
        self.u = {"id": f"{self.prefix}{len(self.units)+1}", "title": title, "emoji": emoji,
                  "goal": goal, "lessons": []}
        self.units.append(self.u)

    def lesson(self, title):
        self.l = {"id": f'{self.u["id"]}l{len(self.u["lessons"])+1}', "title": title, "exercises": []}
        self.u["lessons"].append(self.l)

    def ex(self, type, prompt, audio, payload, answer="", distractors=(), fc=None, fw=None):
        if type == "intro":
            fc = fc or self._rot("ifc", INTRO_FC); fw = fw or ""
        else:
            fc = fc or self._rot("fc", FC)
            k = FWKIND.get(type, "gen")
            fw = fw or self._rot("fw_" + k, FW[k])
        self.l["exercises"].append({
            "id": f'{self.l["id"]}e{len(self.l["exercises"])+1}', "type": type, "prompt": prompt,
            "audio_script": audio, "payload": payload, "answer": answer,
            "distractors": list(distractors), "feedback_correct": fc, "feedback_wrong": fw})

    # ---- generic exercise helpers (on-screen prompts are icons/symbols, research §5.3) ----
    def intro(self, display, audio, visual="", teaches=(), prompt=None, labels=None, variant=None):
        payload = {"display": display, "visual": visual, "teaches": list(teaches)}
        # Explicit opt-in for the tappable count-card intro; never inferred from the display.
        if variant is not None:
            payload["variant"] = variant
        if labels is not None:
            payload["labels"] = list(labels)
        self.ex("intro", prompt or display, audio, payload)

    def listen(self, audio, answer, distractors, kind, prompt="🔊", fw=None):
        self.ex("listen_choose", prompt, audio, {"choice_kind": kind}, answer, distractors, fw=fw)

    def tap(self, display, audio, answer, distractors, prompt=None):
        self.ex("tap_picture", prompt or display, audio, {"display": display}, answer, distractors)

    def match(self, pairs, audio, prompt="🔗"):
        self.ex("match_pairs", prompt, audio, {"pairs": [list(p) for p in pairs]},
                "|".join(f"{a}={b}" for a, b in pairs), [])

    def choose_digit(self, display, audio, answer, distractors, prompt="؟"):
        self.ex("choose_digit", prompt, audio, {"display": display}, answer, distractors)

    def compare(self, left, right, ask, audio, answer, prompt="⚖️"):
        self.ex("compare_more_less", prompt, audio, {"left": left, "right": right, "ask": ask},
                answer, [o for o in ("left", "right", "equal") if o != answer])

    def numline(self, start, move, audio, pool=None, mx=10, step=1):
        """Hop on a 0..mx line; `step` is the spacing of marks (1, or 10 for counting by tens)."""
        ans = start + move
        if step == 1:
            d = [D(x) for x in near(ans, pool or set(range(mx + 1)), lo=0, hi=mx)]
        else:
            c = [x for x in (ans - step, ans + step, ans - 2 * step, ans + 2 * step) if 0 <= x <= mx]
            d = [D(x) for x in c[:2]]
        self.ex("number_line", "؟", audio, {"min": 0, "max": mx, "start": start, "move": move}, D(ans), d)

    def trace(self, letter, audio, forms):
        self.ex("trace_letter", letter, audio, {"letter": letter, "forms": forms}, letter, [])

    def build(self, picture, letters, extra, audio, prompt="🧩"):
        self.ex("build_word", prompt, audio, {"picture": picture, "letters": letters}, "".join(letters), extra)


def near(n, pool, k=2, lo=0, hi=10):
    c = [x for x in range(lo, hi + 1) if x != n]
    c.sort(key=lambda x: (abs(x - n) + (0 if x in pool else 3), x))
    return c[:k]

def rep(e, n): return e * n if n > 0 else "🍽️"


for _f in ("math_content.py", "alphabet_content.py"):
    exec(open(os.path.join(HERE, _f), encoding="utf-8").read())

# =========================== finalize ===========================
REPL = {"~": "\u200c", "^": "\u0654", "_": "\u0640", "@": "\u064e", "#": "\u0650", "$": "\u064f",
        "*": "\u0651", "ي": "ی", "ك": "ک"}
RAW_KEYS = {"type", "id", "ask", "choice_kind", "teaches", "style", "op", "variant"}

def fix(v, key=None):
    if isinstance(v, str) and key in RAW_KEYS: return v
    if isinstance(v, str):
        for a, b in REPL.items(): v = v.replace(a, b)
        return unicodedata.normalize("NFC", v)
    if isinstance(v, list): return [fix(x, key) for x in v]
    if isinstance(v, dict): return {k: fix(x, k) for k, x in v.items()}
    return v

if __name__ == "__main__":
    for t in (build_math(), build_alphabet()):
        data = fix({"track": t.name, "units": t.units})
        with open(os.path.join(OUT, f"{t.name}.json"), "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print("wrote", t.name)
