# persian-learn — User flows

All flows are written for an RTL, Persian-only UI. Labels below are in English for engineers; quoted strings are the actual Persian UI copy. Each diagram is also rendered to `flows/*.png` (generated with `@mermaid-js/mermaid-cli` from this file; regenerate with `node tools/render-flows.js`).

Principles that every flow obeys:
- **No typing anywhere.** Every input is a tap, a drag, or a trace.
- **Audio first.** Every screen autoplays its prompt once; a large speaker button replays it; a slower replay is always available.
- **One task per screen.**
- **No penalties.** No lives or hearts. A mistake leads to a hint and a retry, never to losing something.

## 1. Onboarding (first launch)

```mermaid
flowchart TD
  A([App opened for the first time]) --> B["Welcome screen<br/>Mascot Hoda says hello (autoplay audio)<br/>«سلام! من هُدی هستم.»"]
  B --> C{Did audio play?}
  C -- "Blocked by browser" --> C1["Show giant pulsing speaker<br/>«برای شنیدن، اینجا بزنید»"] --> C2[User taps speaker; audio unlocked for the session]
  C -- Yes --> D
  C2 --> D["Sound check<br/>«صدا را می‌شنوید؟» ✓ / replay louder"]
  D -- "Can't hear (tap ✗ twice)" --> D1["Show volume illustration + raise device volume hint<br/>(picture-only)"] --> D
  D -- "Hears it ✓" --> E["Pick a picture for yourself<br/>(6 adult, non-childish avatars: tulip, tea, cypress, pomegranate, sun, moon)"]
  E --> F{Optional: what should we call you?}
  F -- "Taps a name chip<br/>«مادر جان» «خانم جان» «مامان» «بانو»" --> G[Name stored; every chip speaks itself when tapped]
  F -- "«بعداً» (later)" --> G0[Default greeting without a name]
  G --> H
  G0 --> H["Track picker<br/>«امروز چه یاد بگیریم؟»"]
  H -- "Numbers & math" --> I[Math path, Unit 1]
  H -- "Alphabet & reading" --> J[Alphabet path, Unit 1]
  I --> K["Daily goal preset = 1 lesson<br/>(changeable later in Profile; no question asked now)"]
  J --> K
  K --> L([First lesson starts immediately])
```

## 2. Home and the lesson path

```mermaid
flowchart TD
  A([Open app]) --> B{Returning user?}
  B -- No --> OB[[Onboarding]]
  B -- Yes --> C["Home = lesson path of current track<br/>Top bar: track chip · streak · XP"]
  C --> D["Unit banner: «بخش ۱ — شمردن از ۱ تا ۵»<br/>speaker reads the unit title"]
  C --> E{Tap a path node}
  E -- "Done ✓" --> E1["Replay lesson (practice; XP ×½)"]
  E -- "Current ★ (pulsing, «شروع»)" --> E2[[Lesson loop]]
  E -- "Locked 🔒" --> E3["Gentle shake + audio: «اول درس قبلی را تمام کنیم»<br/>Path auto-scrolls to the current node"]
  E -- "Review node (saffron)" --> E4["Mixed review of the unit's items<br/>(spaced repetition queue)"]
  E2 --> F{Unit finished?}
  F -- No --> C
  F -- Yes --> G["Unit celebration + next unit unlocks<br/>path scrolls down to the next banner"] --> C
  C --> H["Track chip → switch track<br/>(two big cards, no menus)"] --> C
  C --> N{Bottom nav}
  N -- "«خانه»" --> C
  N -- "«پیشرفت»" --> S[[Streak & daily goal]]
  N -- "«من»" --> P[[Profile & progress]]
```

Path layout: the path starts at the top and winds downward in an S curve. The first zig goes toward the right side, which is the reading start in RTL. Nodes alternate between center, right, center, and left. Each unit has about 5 lessons and 1 review node.

## 3. The lesson loop (question types, feedback, gentle retry)

```mermaid
flowchart TD
  A([Lesson start]) --> B["Load 8–10 exercises<br/>(new items + 2–3 review items)"]
  B --> C[Next exercise]
  C --> T{Exercise type}
  T --> T1["Tap the right picture<br/>«سیب کدام است؟»"]
  T --> T2["Listen & choose the letter<br/>«گوش کنید. کدام حرف است؟»"]
  T --> T3["Trace the letter<br/>«حرف «ب» را با انگشت بکشید»"]
  T --> T4["Count the objects<br/>«چند تا انار هست؟»"]
  T --> T5["Drag to match<br/>digit ↔ group of objects / letter ↔ picture"]
  T --> T6["Number line<br/>«عدد «۳» کجاست؟» (۰ at right)"]
  T --> T7["Later units: money (coins/notes), clock faces,<br/>add/take away with objects, read a word"]
  T1 & T2 & T3 & T4 & T5 & T6 & T7 --> P["Prompt autoplays · tapping any option speaks it"]
  P --> S["User selects / drags / traces → «بررسی» (check) enabled"]
  S --> V{Correct?}
  V -- Yes --> OK["Correct sheet (green): «آفرین!»<br/>+10 XP, happy chime, light haptic, mascot nods"]
  OK --> NX{More exercises?}
  V -- "No (try 1)" --> R1["Gentle sheet (warm clay, never red): «نزدیک بود!»<br/>Hint: audio + visual (e.g. numbers appear on each pomegranate)<br/>«دوباره امتحان کنیم» — nothing is lost"]
  R1 --> P
  V -- "No (try 2)" --> R2["Show the answer: correct option glows, audio says it<br/>«این «۴» است. بعداً دوباره می‌بینیم.»"]
  R2 --> Q["Item re-queued at end of lesson<br/>+ added to spaced review"]
  Q --> NX
  NX -- Yes --> C
  NX -- No --> DONE["Lesson complete<br/>confetti + mascot cheer + XP total + time + streak"]
  DONE --> G{Daily goal reached now?}
  G -- Yes --> GS["Daily-goal celebration (once per day)"] --> H([Back to path; next node pulses])
  G -- No --> H
  C -. "✕ close" .-> X["«مطمئنید؟» with two big picture buttons:<br/>continue (green) / leave (outline)<br/>Progress inside the lesson is kept for 24 h"]
```

**Gentle alternative to hearts (assumed):** there are no lives or energy. A wrong answer costs nothing. The first miss gives a hint and a retry. The second miss shows and speaks the answer, and that item comes back later in the lesson and again in review. The progress bar never moves backward. XP is earned only for correct answers, and a correct answer on the retry still earns full XP. Mistakes are visible to the system (they feed spaced repetition) but carry no punishment the learner can see.

## 4. Streak and daily goal

```mermaid
flowchart TD
  A([Lesson completed]) --> B{First lesson today?}
  B -- Yes --> C["Streak +1 → flame grows, «۵ روز پشت سر هم!»<br/>(spoken)"]
  B -- No --> D[Streak unchanged]
  C --> E{Daily goal met?}
  D --> E
  E -- Yes --> F["Goal ring completes, chime, «هدف امروز انجام شد!»"]
  E -- No --> F2["Ring shows «۱ از ۲», «یک درس دیگر مانده»"]
  F & F2 --> G([Path])
  M([Midnight local time, day missed]) --> R{Rest days left this week?}
  R -- "Yes (2 per week, automatic)" --> R1["Rest day used silently; streak kept<br/>Next open: moon icon «دیروز روز استراحت بود»"]
  R -- No --> R2["Streak resets softly: «دوباره شروع می‌کنیم. بهترین رکورد شما: ۱۲ روز» <br/>(best streak never lost)"]
  N([Optional reminder]) --> N1["One gentle notification at the time she usually practices<br/>with a mascot voice note; never more than 1 per day"]
```

## 5. Profile and progress

```mermaid
flowchart TD
  A([Tap «من» in bottom nav]) --> B["Profile: avatar + chosen name<br/>«از مهر ۱۴۰۵ با ما»"]
  B --> C["Stat tiles: streak · XP · letters learned"]
  B --> D["Track progress bars (fill right→left)<br/>Math: unit 2 of 6 · Alphabet: 8 of 32 letters"]
  D --> D1["Letter grid: learned letters colored, tap → hear letter + example word"]
  B --> E[Settings — all toggles/segmented, no typing]
  E --> E1["Audio speed: «آهسته» / «عادی»"]
  E --> E2["Autoplay audio on/off"]
  E --> E3["Text size: large / extra large"]
  E --> E4["Daily goal: 1 / 2 / 3 lessons (picture of 1-3 stars)"]
  E --> E5["Reminder time (clock-face picker)"]
  B --> F["✏️ Change picture/name → onboarding avatar screen"]
  B --> G["Family helper area (behind a 3-second long-press)<br/>for Afshin: reset, export progress, switch device"]
```
