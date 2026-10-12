import json, re, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import signs as S
from itertools import combinations
BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
PD = "۰۱۲۳۴۵۶۷۸۹"
def D(n): return "".join(PD[int(c)] for c in str(n))
def N(s): return int("".join(str(PD.index(c)) for c in s))
TYPES = {"intro","tap_picture","listen_choose","count_objects","choose_digit","match_pairs",
         "trace_letter","compare_more_less","number_line","build_word",
         "equation","count_money","pay_amount","make_change","read_clock","ten_frame","break_points"}
UK = ["id","title","emoji","goal","lessons"]; LK = ["id","title","exercises"]
EK = ["id","type","prompt","audio_script","payload","answer","distractors","feedback_correct","feedback_wrong"]
SHAPES = {"intro":{"display","visual","teaches"},"tap_picture":{"display"},"listen_choose":{"choice_kind"},
          "count_objects":{"objects","count"},"choose_digit":{"display"},"match_pairs":{"pairs"},
          "trace_letter":{"letter","forms"},"compare_more_less":{"left","right","ask"},
          "number_line":{"min","max","start","move"},"build_word":{"picture","letters"},
          "equation":{"a","op","b","objects"},"count_money":{"items"},
          "pay_amount":{"item","price","wallet"},"make_change":{"item","price","paid"},
          "read_clock":{"hour","minute","style"},
          "ten_frame":{"count","objects"},"break_points":{"word"}}
CHOICE_KINDS = {"digit","letter","word","money","time","claps","same","picture"}
DENOMS = {10000, 50000, 100000}   # 10k note + 50k/100k Iran Cheques (§4.2 B10)
CLOCK_EMOJI = {(h, 0): e for h, e in zip(range(1, 13), "🕐🕑🕒🕓🕔🕕🕖🕗🕘🕙🕚🕛")}
CLOCK_EMOJI.update({(h, 30): e for h, e in zip(range(1, 13), "🕜🕝🕞🕟🕠🕡🕢🕣🕤🕥🕦🕧")})
def cphrase(h, m):
    return {0: f"ساعت {D(h)}", 30: f"ساعت {D(h)} و نیم", 15: f"ساعت {D(h)} و ربع", 45: f"یک ربع به {D(h % 12 + 1)}"}.get(m)
def parse_clock(s):
    for h in range(1, 13):
        for m in (0, 15, 30, 45):
            if cphrase(h, m) == s: return (h, m)
    return None

ALPHABET = S.ALPHABET
BAD = re.compile(r"[~^_@#$يك٠-٩0-9]")
STRIP = re.compile(r"[\u064B-\u0652\u0654\u0640\u200c ]")

def fmt_money(v):
    k, r = divmod(v, 1000)
    if v >= 1000 and r == 0: return "هزار تومان" if k == 1 else f"{D(k)} هزار تومان"
    return f"{D(v)} تومان"

def value(s):
    """Numeric value of a compare side, or None if not computable."""
    s = s.strip()
    m = re.fullmatch(r"(?:([۰-۹]+) )?هزار تومان", s)
    if m: return (N(m.group(1)) if m.group(1) else 1) * 1000
    m = re.fullmatch(r"([۰-۹]+) تومان", s)
    if m: return N(m.group(1))
    if re.fullmatch(r"[۰-۹]+( [+-] [۰-۹]+)*", s):
        tok = s.split(); v = N(tok[0])
        for op, x in zip(tok[1::2], tok[2::2]): v = v + N(x) if op == "+" else v - N(x)
        return v
    if s == "🍽️": return 0
    c = s.replace("\ufe0f", "")
    if c and len(set(c)) == 1 and ord(c[0]) > 0x2000: return (c[0], len(c))
    return None

def check_eq_display(disp, ans):
    """'a op b = c' with exactly one ؟; substitute answer and verify."""
    tok = disp.split()
    if "=" not in tok or tok.count("؟") != 1 or len(tok) != 5: return None
    tok = [ans if x == "؟" else x for x in tok]
    a, op, b, _, c = tok
    if op not in "+-": return False
    try: a, b, c = N(a), N(b), N(c)
    except Exception: return False
    return (a + b if op == "+" else a - b) == c

errs = []
def E(m): errs.append(m)
summary = []
for track, pre in (("math","m"),("alphabet","a")):
    p = os.path.join(BASE, f"{track}.json")
    try: d = json.load(open(p, encoding="utf-8"))
    except Exception as e: E(f"{p}: parse error {e}"); continue
    if d.get("track") != track: E(f"{track}: bad track field")
    units = d.get("units", [])
    if len(units) != 12: E(f"{track}: {len(units)} units, expected 12")
    ids = set(); nl = ne = 0; types = {}; traced = set(); recomputed = 0
    taught = set(); teach_seq = []; sign_checks = 0
    for ui, u in enumerate(units, 1):
        for k in UK:
            if k not in u: E(f"{track} unit {ui}: missing {k}")
        if u.get("id") != f"{pre}{ui}": E(f"{track}: unit id {u.get('id')} != {pre}{ui}")
        for k in ("title","emoji","goal"):
            if not u.get(k): E(f"{u.get('id')}: empty {k}")
        ls = u.get("lessons", [])
        if not 3 <= len(ls) <= 5: E(f"{u['id']}: {len(ls)} lessons (need 3-5)")
        if ls and "مرور" not in ls[-1].get("title", ""): E(f"{u['id']}: last lesson is not a review (مرور)")
        for li, l in enumerate(ls, 1):
            nl += 1
            for k in LK:
                if k not in l: E(f"{u['id']} lesson {li}: missing {k}")
            if l.get("id") != f"{u['id']}l{li}": E(f"bad lesson id {l.get('id')}")
            exs = l.get("exercises", [])
            if not 8 <= len(exs) <= 12: E(f"{l['id']}: {len(exs)} exercises")
            if not exs or exs[0].get("type") != "intro": E(f"{l['id']}: does not start with intro")
            for ei, x in enumerate(exs, 1):
                ne += 1
                for k in EK:
                    if k not in x: E(f"{l['id']} ex {ei}: missing {k}")
                xid = x.get("id")
                if xid != f"{l['id']}e{ei}": E(f"bad exercise id {xid}")
                if xid in ids: E(f"dup id {xid}")
                ids.add(xid)
                ty = x.get("type"); types[ty] = types.get(ty, 0) + 1
                if ty not in TYPES: E(f"{xid}: bad type {ty}"); continue
                pl = x["payload"]; a = x["answer"]
                if set(pl) != SHAPES[ty]: E(f"{xid}: payload keys {set(pl)} != {SHAPES[ty]}"); continue
                if ty == "intro":
                    th = pl["teaches"]
                    if not isinstance(th, list) or any(s_ not in S.SIGN_LESSON for s_ in th): E(f"{xid}: bad teaches {th}")
                    elif th and track == "math": E(f"{xid}: math intro teaches signs")
                    else:
                        for s_ in th:
                            if s_ in taught: E(f"{xid}: sign {s_} taught twice")
                            if teach_seq and S.SIGN_LESSON[s_] < S.SIGN_LESSON[teach_seq[-1]]:
                                E(f"{xid}: sign {s_} (book lesson {S.SIGN_LESSON[s_]}) taught after {teach_seq[-1]} (lesson {S.SIGN_LESSON[teach_seq[-1]]}) - breaks §2.1 order")
                            taught.add(s_); teach_seq.append(s_)
                if not x["prompt"] or not x["audio_script"] or not x["feedback_correct"]: E(f"{xid}: empty text field")
                if not isinstance(x["distractors"], list): E(f"{xid}: distractors not list")
                if ty == "intro":
                    if a != "" or x["distractors"]: E(f"{xid}: intro must have empty answer/distractors")
                else:
                    if not a: E(f"{xid}: empty answer")
                    if a in x["distractors"]: E(f"{xid}: answer in distractors")
                    if len(set(x["distractors"])) != len(x["distractors"]): E(f"{xid}: duplicate distractors")
                    if not x["feedback_wrong"]: E(f"{xid}: empty feedback_wrong")
                    if ty not in ("match_pairs","trace_letter") and not x["distractors"]: E(f"{xid}: no distractors")
                # ---- recompute answers ----
                ok = None
                if ty == "count_objects": ok = a == D(pl["count"])
                elif ty == "number_line":
                    v = pl["start"] + pl["move"]; ok = pl["min"] <= v <= pl["max"] and a == D(v)
                elif ty == "build_word": ok = a == "".join(pl["letters"])
                elif ty == "match_pairs":
                    ok = a == "|".join(f"{p}={q}" for p, q in pl["pairs"]) and \
                         len({q for _, q in pl["pairs"]}) == len(pl["pairs"]) and len({p for p, _ in pl["pairs"]}) == len(pl["pairs"])
                elif ty == "trace_letter": ok = a == pl["letter"] and len(pl["forms"]) == 4
                elif ty == "equation":
                    ok = pl["op"] in "+-" and a == D(pl["a"] + pl["b"] if pl["op"] == "+" else pl["a"] - pl["b"]) \
                         and 0 <= (pl["a"] + pl["b"] if pl["op"] == "+" else pl["a"] - pl["b"]) <= 10 \
                         and x["prompt"] == f'{D(pl["a"])} {pl["op"]} {D(pl["b"])} = ؟'
                elif ty == "count_money":
                    ok = set(pl["items"]) <= DENOMS and a == fmt_money(sum(pl["items"]))
                elif ty == "pay_amount":
                    w = pl["wallet"]
                    can = any(sum(c) == pl["price"] for r in range(1, len(w) + 1) for c in combinations(w, r))
                    ok = set(w) <= DENOMS and can and a == fmt_money(pl["price"])
                elif ty == "make_change":
                    ok = pl["paid"] > pl["price"] and a == fmt_money(pl["paid"] - pl["price"])
                elif ty == "read_clock":
                    ok = 1 <= pl["hour"] <= 12 and pl["minute"] in (0, 15, 30, 45) and pl["style"] in ("analog","digital") \
                         and a == cphrase(pl["hour"], pl["minute"])
                elif ty == "ten_frame":
                    ok = isinstance(pl["count"], int) and 0 <= pl["count"] <= 10 and isinstance(pl["objects"], str) \
                         and pl["objects"] != "" and a == D(pl["count"])
                elif ty == "break_points":
                    ok = a == "|".join(S.segments(pl["word"])) and a.replace("|", "") == pl["word"] \
                         and all(dd.replace("|", "") == pl["word"] for dd in x["distractors"])
                elif ty == "listen_choose":
                    if pl["choice_kind"] not in CHOICE_KINDS: E(f"{xid}: bad choice_kind")
                elif ty == "choose_digit":
                    dsp = pl["display"]; r = check_eq_display(dsp, a)
                    if r is not None: ok = r
                    elif dsp and set(dsp) <= set("🔴⚪"): ok = a == D(dsp.count("⚪"))
                    elif re.fullmatch(r"[۰-۹؟]+( [۰-۹؟]+)+", dsp):
                        tok = dsp.split()
                        if " " in a:   # ordering task: answer is the display sorted
                            vals = [N(v) for v in tok]; at = [N(v) for v in a.split()]
                            ok = "؟" not in tok and at in (sorted(vals), sorted(vals, reverse=True))
                        elif tok.count("؟") == 1:   # fill the gap in an evenly spaced sequence
                            vals = [N(a if v == "؟" else v) for v in tok]
                            ok = len({b - c for b, c in zip(vals[1:], vals)}) == 1
                elif ty == "compare_more_less":
                    if pl["ask"] not in ("more","less") or a not in ("left","right","equal"): ok = False
                    else:
                        L, R = value(pl["left"]), value(pl["right"])
                        if isinstance(L, tuple) or isinstance(R, tuple):
                            # emoji groups: only comparable when both sides use the same emoji
                            if isinstance(L, tuple) and isinstance(R, tuple) and L[0] == R[0]: L, R = L[1], R[1]
                            elif L == 0 and isinstance(R, tuple): R = R[1]
                            elif R == 0 and isinstance(L, tuple): L = L[1]
                            else: L = R = None
                        if L is not None and R is not None:
                            exp = "equal" if L == R else (("left" if L > R else "right") if pl["ask"] == "more" else ("left" if L < R else "right"))
                            ok = a == exp
                elif ty == "tap_picture" and parse_clock(pl["display"]):
                    ok = a == CLOCK_EMOJI.get(parse_clock(pl["display"]))
                if ok is False: E(f"{xid}: answer does not recompute ({ty}: {pl} -> {a})")
                if ok: recomputed += 1
                # ---- alphabet: every on-screen Persian string uses only signs taught so far (§2.1/§2.4) ----
                if track == "alphabet":
                    if ty == "trace_letter":
                        if not (S.LETTER_SIGNS[pl["letter"]] & taught): E(f"{xid}: traces {pl['letter']} before it is taught")
                        traced.add(pl["letter"])
                    cands = [x["prompt"], a] + list(x["distractors"])
                    for k_, v_ in pl.items():
                        if k_ in ("teaches", "choice_kind"): continue
                        if k_ == "pairs": cands += [q for pr in v_ for q in pr]
                        elif isinstance(v_, list): cands += [q for q in v_ if isinstance(q, str)]
                        elif isinstance(v_, str): cands.append(v_)
                    if ty == "match_pairs": cands.remove(a)   # derived from pairs
                    for c in cands:
                        c = c.replace("|", "")
                        try: miss = S.missing(c, taught)
                        except ValueError as e_: E(f"{xid}: {e_}"); continue
                        sign_checks += 1
                        if miss: E(f"{xid}: {c!r} needs untaught signs {miss}")
                # ---- text hygiene ----
                def walk(v, path):
                    if isinstance(v, str):
                        if path in ("type","id","ask","choice_kind","style","op","teaches"): return
                        if BAD.search(v): E(f"{xid}.{path}: suspicious char in {v!r}")
                    elif isinstance(v, list): [walk(i, path) for i in v]
                    elif isinstance(v, dict): [walk(i, k) for k, i in v.items()]
                for k in ("prompt","audio_script","feedback_correct","feedback_wrong"): walk(x[k], k)
                walk(pl, "payload")
                if ty != "compare_more_less": walk(a, "answer"); walk(x["distractors"], "distractors")
    if track == "alphabet":
        if teach_seq != S.ALL_SIGNS: E(f"alphabet: taught sequence differs from §2.1 order; missing={[s_ for s_ in S.ALL_SIGNS if s_ not in teach_seq]}")
        summary.append(f"alphabet: signs taught {len(teach_seq)}/{len(S.ALL_SIGNS)} in §2.1 order: {teach_seq == S.ALL_SIGNS}; on-screen strings sign-checked: {sign_checks}")
        missing = ALPHABET - traced
        if missing: E(f"alphabet: letters never traced: {sorted(missing)}")
        summary.append(f"alphabet: letters traced {len(traced)}/{len(ALPHABET)}; uncovered: {sorted(missing) or 'none'}")
    print(f"{track}: units={len(units)} lessons={nl} exercises={ne} answers_recomputed={recomputed}")
    print(f"  types={dict(sorted(types.items()))}")
for s in summary: print(s)
if errs:
    print(f"FAIL: {len(errs)} problems"); [print(" -", e) for e in errs]; sys.exit(1)
print("OK: all checks passed")
