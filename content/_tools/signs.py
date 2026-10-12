# -*- coding: utf-8 -*-
"""Official letter/sign order of فارسی اول دبستان (1404), research §2.1, encoded as data,
plus a rule-based tokenizer that maps written Persian to the signs a reader needs.
A sign = (grapheme, sound) pair (research §2.1 notes / §5.7). Shared by build.py and validate.py."""
import re

# (textbook lesson, title, [sign ids in the order the book lists them])
ORDER = [
    (1, "آب – باران", ["A_LONG", "B"]),          # آ ا ، بـ ب
    (2, "ابر – باد", ["FATHA", "D"]),            # اَ ـَ ، د
    (3, "مدرسه – کلاس", ["M", "S"]),             # مـ م ، سـ س
    (4, "توت – تاب", ["U", "T"]),                # او و (long u) ، تـ ت
    (5, "مادر – نان", ["R", "N"]),               # ر ، نـ ن
    (6, "ایران – سرباز", ["I", "Z"]),            # ایـ یـ ی ای (long i) ، ز
    (7, "استخر – گوش شنوا", ["KASRA", "E_FINAL", "SH"]),  # اِ ـِ ـه ، شـ ش
    (8, "دریا – اردک", ["Y", "DAMMA"]),          # یـ ی (consonant y) ، اُ ـُ
    (9, "لک‌لک – ورزش", ["K", "V"]),             # کـ ک ، و (consonant v)
    (10, "پرواز – جنگل", ["P", "G"]),
    (11, "روز برفی – درخت", ["F", "KH"]),
    (12, "همکاری – گل", ["Q", "L"]),
    (13, "نارنج و برنج – خروس", ["J", "KHO"]),   # جـ ج ، ـُ استثنا (خو = xo)
    (14, "مهتاب – چشمه", ["H", "CH"]),           # هـ ـهـ ـه ه (consonant h) ، چـ چ
    (15, "ژاله – کتاب‌خوانی", ["ZH", "KHA"]),     # ژ ، خوا (silent و)
    (16, "در بازار", ["SHADDA"]),
    (17, "صدای موج – سفر دل‌پذیر", ["S2", "Z2"]),  # ص ، ذ
    (18, "علی و معصومه – مثل خورشید", ["AYN", "S3"]),  # ع ، ث
    (19, "حلزون", ["H2"]),                      # ح
    (20, "رضا – خاطرات انقلاب", ["Z3", "T2"]),  # ض ، ط
    (21, "لاک‌پشت و مرغابی‌ها", ["GH"]),          # غ
    (22, "پیامبر مهربان", ["Z4"]),              # ظ
]
SIGN_LESSON = {s: n for n, _, ss in ORDER for s in ss}
ALL_SIGNS = [s for _, _, ss in ORDER for s in ss]

SIMPLE = {"ب": "B", "د": "D", "م": "M", "س": "S", "ت": "T", "ر": "R", "ن": "N", "ز": "Z", "ش": "SH",
          "ک": "K", "پ": "P", "گ": "G", "ف": "F", "ق": "Q", "ل": "L", "ج": "J", "چ": "CH", "ژ": "ZH",
          "ص": "S2", "ذ": "Z2", "ع": "AYN", "ث": "S3", "ح": "H2", "ض": "Z3", "ط": "T2", "غ": "GH",
          "ظ": "Z4", "خ": "KH"}
# A letter shown on its own (a form, a tile) needs any one of the signs written with it.
LETTER_SIGNS = {**{k: {v} for k, v in SIMPLE.items()}, "آ": {"A_LONG"}, "ا": {"A_LONG"},
                "و": {"U", "V"}, "ی": {"I", "Y"}, "ه": {"H", "E_FINAL"}}
LETTER_OF_SIGN = {}
for _l, _ss in LETTER_SIGNS.items():
    for _s in _ss: LETTER_OF_SIGN.setdefault(_s, set()).add(_l)
ALPHABET = set("ابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی") | {"آ"}
NONCONN = set("اآدذرزژو")
MARKS = {"\u064e": "FATHA", "\u0650": "KASRA", "\u064f": "DAMMA", "\u0651": "SHADDA", "\u0654": "KASRA"}
IGNORE = {"\u0640", "\u0652"}   # tatweel, sukun
WORD_RE = re.compile(r"[\u0621-\u063A\u0641-\u064A\u064B-\u0655\u067E\u0686\u0698\u06A9\u06AF\u06CC\u0640]+")


def groups(word):
    out = []
    for ch in word:
        if ch in IGNORE: continue
        if ch in MARKS:
            if out: out[-1][1].append(ch)
            continue
        out.append([ch, []])
    return out


def word_requirements(word):
    """List of requirement sets; each set is satisfied if ANY sign in it has been taught."""
    g = groups(word)
    req = []
    if not g: return req
    if len(g) == 1:                          # an isolated letter / form / tile
        l, mk = g[0]
        if l not in LETTER_SIGNS: raise ValueError(f"unknown letter {l!r} in {word!r}")
        req.append(set(LETTER_SIGNS[l]))
        req += [{MARKS[m]} for m in mk]
        return req
    i, n = 0, len(g)
    while i < n:
        l, mk = g[i]
        prev = g[i - 1][0] if i > 0 else None
        nxt = g[i + 1] if i + 1 < n else None
        skip = 0
        if l == "آ": req.append({"A_LONG"})
        elif l == "ا":
            if i == 0:
                if mk: pass                                   # silent carrier of اَ اِ اُ
                elif nxt and nxt[0] == "ی": req.append({"I"}); skip = 1
                elif nxt and nxt[0] == "و": req.append({"U"}); skip = 1
                else: req += [{"FATHA"}, {"KASRA"}, {"DAMMA"}]   # unvowelled: needs all short vowels
            else: req.append({"A_LONG"})
        elif l == "و":
            if i == 0 or mk or (nxt and nxt[0] in "اه") or (prev in ("ا", "آ", "و")): req.append({"V"})
            else: req.append({"U"})
        elif l == "ی":
            if i == 0 or mk or (nxt and nxt[0] in "او") or (prev in ("ا", "آ", "و")): req.append({"Y"})
            else: req.append({"I"})
        elif l == "ه":
            if nxt is None and prev not in ("ا", "آ", "و") and not mk: req.append({"E_FINAL"})
            else: req.append({"H"})
        elif l == "خ":
            req.append({"KH"})
            if nxt and nxt[0] == "و" and not mk and not nxt[1]:
                if i + 2 < n and g[i + 2][0] == "ا": req.append({"KHA"})
                else: req.append({"KHO"})
                skip = 1
        elif l in SIMPLE: req.append({SIMPLE[l]})
        else: raise ValueError(f"unknown letter {l!r} in {word!r}")
        req += [{MARKS[m]} for m in mk]
        if skip:
            req += [{MARKS[m]} for m in g[i + 1][1]]
        i += 1 + skip
    return req


def text_requirements(text):
    req = []
    for w in WORD_RE.findall(text):
        req += word_requirements(w)
    return req


def missing(text, taught):
    """Requirement sets in `text` not satisfied by the taught sign set."""
    return [r for r in text_requirements(text) if not (r & taught)]


def segments(word):
    """Pieces of a word split after each non-connecting letter (research §2.3)."""
    pieces, cur = [], ""
    for l, mk in groups(word):
        cur += l + "".join(mk)
        if l in NONCONN:
            pieces.append(cur); cur = ""
    if cur: pieces.append(cur)
    return pieces
