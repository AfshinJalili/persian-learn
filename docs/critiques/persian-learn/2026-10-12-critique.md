# Critique: persian-learn design package v1 (15 screens + flows)

Critic: Critiquito · 2026-10-12 · Files reviewed: `mockups/*.png` + `.html`, `wireframes/`, `flows.md`, both sets of `flows/*.png`/`.mmd`, `design-system.md/.png`, `tokens.css`, `components.css`, `README.md`, `tools/qa-report.json`, `tools/contrast.py`, `tools/render.js`. Sizes were measured from the rendered DOM at 390×844. Contrast was recomputed with the WCAG formula in `tools/contrast.py`.

## 1. Who she is

She is a 50-year-old Iranian woman who has never been to school and cannot read. She opens this app alone on her phone to learn to count and to recognise Persian letters. Everything has to reach her through sound, pictures and gestures, never through words on the screen.

## 2. Verdict

**Not ready to ship.** The visual base is strong: large type, AAA text contrast, correct RTL, Persian digits, no hearts and a warm palette. But the package still assumes a reader in many places. Profile and settings have no audio, many instructions and buttons exist only as text, there is no designed fallback for when audio doesn't play, and lessons test a letter or number before ever teaching it. **The biggest risk:** on the first launch, or the first time audio fails or autoplay gets switched off, she is left with a silent screen of text she can't read and no way to get her voice guide back.

---

## 3. Ranked fixes

Severity: **P0** = blocker (she can't go on or will be misled) · **P1** = worth fixing (costs her real effort, confidence or trust) · **P2** = minor polish. Each group is ordered by how much the problem costs her.

### P0: Blockers

**P0-1 · Lessons test before they teach** · `flows.md` §3 / `flows/03-lesson-loop.png`; `05`–`10`
- **What's wrong:** The lesson loop goes straight from "Load 8–10 exercises (new items + 2–3 review items)" into questions. No exercise type introduces a new item. Screen 06 asks «گوش کنید. کدام حرف است؟» about ب/م/س, and screen 10 asks «عدد «۳» کجاست؟», but nothing in the package shows her ب or ۳ beforehand. The alt-b flow (`flows/02-lesson-loop.mmd`) has an "Intro card: new letter/number, big glyph + audio + everyday picture" step. The package does not.
- **Why it costs her:** Starting from zero, her first contact with each letter is a guess, followed by a "wrong" sheet. For an adult who never went to school, being tested on something she was never taught feels like school failure all over again, and that is the reason she would quit.
- **Fix:**
  - Add an **intro card** exercise type, and show it before the first question on any new item:
    - glyph at 160px/800, or the object picture at 200px
    - autoplay «این «ب» است. «ب» مثل «بابا».»
    - tapping the glyph replays the clip
    - one full-width «ادامه» button
  - Show 2 intro cards per new item: the glyph, then the glyph with a picture.
  - The first question on a new item uses only 2 options, one of which she has already seen.
  - Add this step to flows §3 between "Next exercise" and "Exercise type", and mock it as screen 05a.

**P0-2 · No designed state for "audio didn't play"** · `01-onboarding-welcome`, `flows/01-onboarding.png`, and in effect every screen
- **What's wrong:** On first launch, no user gesture has happened yet, so browsers block the autoplay that 01 depends on. Screen 01 still shows the speaker in its `.playing` state with the caption «دوباره گوش کنید» ("listen again") for a sound she never heard.
  - The "blocked" branch in flows.md («برای شنیدن، اینجا بزنید») and the sound-check step («صدا را می‌شنوید؟») have no mockups. The onboarding dots show only 3 steps, so the sound check is missing from the plan.
  - No state exists for audio still loading, audio failing to load, the device being offline, or the phone being on silent.
- **Why it costs her:** The first thing she sees is a bird and three lines of text she can't read, in silence. Nothing tells her to tap the blue circle. The same thing happens mid-lesson if a clip fails or she is offline. For a non-reader, a silent screen is a dead end.
- **Fix:**
  1. **First-launch gate (new screen 00):** cream background, Hoda at 230px, and a centred 136px `.speaker.xl` pulsing continuously. Any tap anywhere on the screen unlocks audio and plays «سلام! من هُدی هستم.». No text is needed.
  2. **Sound check (new screen 01b):** two 120×120 picture buttons, a green ear with a check and a clay ear with a cross. The prompt is spoken and repeats every 6s until she answers. Two crosses show the volume-up picture (a phone with an arrow on the side button), as the flow describes.
  3. **Loading:** if a clip hasn't started 300ms after the screen settles, show a spinning 4px ring on the speaker.
  4. **Failure:** the speaker swaps to a reload glyph, retries automatically once, and shows Hoda's head with a "?" pose.
  5. **Offline:** the service worker pre-caches all audio for the current and next lesson. A lesson whose audio isn't cached cannot start. Its node shows a cloud-with-slash icon instead of opening silently.
  6. Change the 01 caption to «گوش کنید» until playback has actually finished once.

**P0-3 · Profile has no audio, and one tap there can silence the whole app** · `15-profile`
- **What's wrong:** The screen has no speaker button at all. «سرعت صدا», «پخش خودکار صدا», the stat labels, «از مهر ۱۴۰۵ با ما» and «۸ حرف از ۳۲» exist only as text.
  - The autoplay toggle (96×56, `aria-pressed="true"`) sits 107px above the bottom nav. On/off is shown only by knob position and colour.
  - The flow (§5) puts "Autoplay audio on/off" in her own settings rather than behind the family-helper long-press.
- **Why it costs her:** If she pokes the toggle while exploring, every prompt in every lesson goes silent. She can't read what she changed or find her way back, so the app becomes unusable for her. It is the worst failure in the package and it takes one tap.
- **Fix:**
  - Move **autoplay** and **audio speed** into the family-helper area (3-second long-press).
  - Keep only things that are safe for her on this screen: picture, name, streak and letters.
  - If any setting stays here:
    - put a 56px speaker at the start of each row that reads the row label and its current state
    - put icons inside the segments (a turtle in «آهسته», a walking figure in «عادی»)
    - turning autoplay off asks for a spoken confirmation with two picture buttons
  - App-wide safeguard: when autoplay is off and nothing has been tapped for 8s, the prompt speaker pulses.

**P0-4 · Matching works only by dragging** · `09-ex-drag-match`
- **What's wrong:** The only input is dragging a number tile from the tray (88×88) up to the drop zones (84×84). In the mockup the dragged «۳» is still 100px or more away from its target row.
  - «بررسی» stays disabled (`aria-disabled="true"`) until every tile is placed, so if she can't drag, she can't go on. The wrong-answer retry flow never triggers, because she never submits anything.
  - Separately, the «۱» row has already turned green before she taps «بررسی». That gives away the answer, contradicts the "tap, then «بررسی»" model, and shows correctness by colour alone: a green-500 border at 1.96:1 against `#F1FBE7`, with no check icon.
- **Why it costs her:** Press, hold and move is the hardest gesture for a first-time smartphone user with little fine-motor practice. Her finger also covers the tile she is moving. If she can't do it, she is stuck with no way forward.
- **Fix:**
  - Add **tap-to-place**:
    - tapping a tile lifts it (blue border, scale 1.06) and speaks «سه»
    - tapping a row drops it there
    - tapping a placed tile sends it back to the tray
  - Keep dragging as an option.
  - Make drop zones 96×96, and make the whole row (342px wide) a drop target.
  - Placed tiles stay neutral (blue "selected" style) until «بررسی». After the check, show a 36px check badge on correct rows and the clay retry style on wrong ones.
  - After 2 failed drags in a row (released on no target), spoken help says «روی عدد بزنید، بعد روی سیب‌ها».

### P1: Worth fixing

**P1-1 · Instructions and status that exist only as text** · `03`, `04`, `07`, `10`, `12`, `13`, `14`, `15`
- **What's wrong:** None of these lines has its own speaker, and none of them is in the screen's prompt `h2` that the main speaker reads:

  | Screen | Text-only line |
  |---|---|
  | 03 | «هر وقت خواستید، می‌توانید عوض کنید.» |
  | 07 | «از دایرهٔ سبز شروع کنید» |
  | 10 | «علامت سبز را روی ۳ بگذارید.», «کمتر», «بیشتر ←» |
  | 12 | The hint box «انگشت‌تان را روی هر انار بگذارید…» |
  | 13 | Stat labels «امتیاز» «زمان» «روز پیاپی» |
  | 14 | «هدف امروز: ۲ درس», «یک درس دیگر مانده.» and the rest-day card |
  | 04 | Top-bar chips («حساب», «۵», «۱۲۰») |

  The mockups can't show whether the main speaker's clip covers these lines. flows.md says only that the "prompt autoplays".
- **Why it costs her:** Every one of these lines is either an instruction she needs or reassurance she was meant to get. The rest-day card, for example, exists to stop her worrying, and she can't read it.
- **Fix:**
  - Rule for `design-system.md` §5: every visible sentence is either part of the screen's autoplay clip (list each clip's script per screen in a new `audio-script.md`) or sits next to its own 56px `.speaker.sm`.
  - Every chip and stat tile speaks itself when tapped, for example «پنج روز پشت سر هم».
  - Make the 07 and 10 secondary instructions part of the prompt clip.

**P1-2 · Buttons she can tell apart only by reading** · `02`, `03`, `05`–`10`, `13`
- **What's wrong:**
  - «بررسی» (check) has no icon and sits in exactly the same place, colour and size (342×64 green-700) as «ادامه» (continue). The only difference is a small arrow on «ادامه».
  - «این را می‌خواهم» is identical on both track cards.
  - «بعداً» and «همین درس را دوباره بخوانیم» are underlined text links, with no icon and no button shape.
  - Only «دوباره امتحان کنیم» and «دوباره نشانم بده» carry icons.
- **Why it costs her:** She learns buttons by shape, colour and icon. Two identical green bars that mean different things (commit an answer vs. move on), plus links that don't look like buttons, push her to guess.
- **Fix:**
  - «بررسی»: add a 32px check icon at the start.
  - «ادامه»: keep the left-pointing arrow.
  - Track buttons: a 32px pomegranate on the math button, a 32px «ب» tile on the letters button.
  - «بعداً»: becomes `.btn-secondary` (64px) with a clock icon.
  - Replay-lesson link: becomes `.btn-secondary` with a replay icon.
  - Every button speaks its label on a 500ms long-press. Disabled buttons already speak on tap, per spec.

**P1-3 · "Slower" replay is on one screen only, and isn't a button** · `05`, `07`, `08`, `09`, `10`, `11`, `12` (missing); `06` (present)
- **What's wrong:** README §9 and the design system promise "a slow (0.75×) replay is available everywhere". Only 06 has «آهسته‌تر», and there it is a `<span class="slow-btn">`, so it isn't focusable or announced. The turtle glyph is 30px and reads as a blob or a car at phone distance.
- **Why it costs her:** Hearing a new word again more slowly is her main study tool. Without it on most screens, she replays at full speed and still doesn't catch it.
- **Fix:**
  - Put the slow control on every exercise and feedback sheet as a `<button>` at least 56px tall, directly under or next to the prompt speaker. It must use the same component and the same position (the start side, under the speaker) on all screens.
  - Redraw the turtle at 34px with a clear shell pattern and head, facing left.
  - Option: drop the label and use only the turtle plus speaker icon, because the text «آهسته‌تر» doesn't help her.

**P1-4 · She can barely see the letter shape she is meant to trace** · `07-ex-trace-letter`
- **What's wrong:**
  - The ghost ب is `#E6E9E7` on white, **1.22:1**. Its dashed centre line `#9AA59F` is **2.54:1**. Both fail even the 3:1 non-text minimum, so the letter she must follow is the faintest thing on the screen.
  - The guide hand is an open palm (a "stop" or "hi" gesture), not a pointing finger.
  - The dot stroke (a dashed circle) has no number, while the main stroke has «۱».
  - The eraser icon (64×64) means nothing to someone who never used a pencil eraser, and it sits 12px from «دوباره نشانم بده».
  - The package doesn't define a "wrong trace" state or how close she has to be.
- **Why it costs her:** At 50, with presbyopia, the low-contrast path melts into the white card. She can't tell where to go after the green start, and she doesn't know what counts as success.
- **Fix:**
  - Draw the guide as a `#E6E9E7` fill with a 3px `#878F8B` outline (3.32:1), and the centre dashes in `#767F7A` (4.0:1).
  - Use a pointing-index-finger hand.
  - Number the dot «۲» in the same 40px green-700 disc once stroke 1 is done.
  - Replace the eraser with a 64px "start over" icon: a counter-clockwise arrow around a small ب.
  - Accept any trace within 24px of the centre line that covers at least 80% of it, in the right direction (right to left).
  - After 2 failed attempts, play the stroke animation and accept the next attempt that covers at least 60%.
  - Spoken feedback when she lifts off the path: «از اینجا ادامه دهید», and the stopping point pulses.

**P1-5 · The number line mockup shows an ambiguous starting state** · `10-ex-number-line`
- **What's wrong:**
  - The direction is correct: «۰» sits at x=300, at the right; «۵» at x=20, at the left; the arrowhead points left.
  - But the pin rests on «۲» (x=188) while the prompt asks for «۳», and «بررسی» is enabled (green-700). It's unclear whether this is the starting position, and if so she could submit "۲" without touching anything.
  - The only way to move the pin appears to be dragging.
  - «کمتر» / «بیشتر ←» are text.
  - The scaffold «۳ =» with three pomegranates uses "=", a symbol she has never learned.
  - The SVG has dot-count circles above each tick at `r="0"`, an aid that was planned but renders invisibly.
- **Why it costs her:** If the pin starts next to the right answer and the check is already live, she can "answer" by accident and doesn't learn from it. The text labels and "=" mean nothing to her.
- **Fix:**
  - Starting state: the pin floats above the line beside «۰» (x=300, y=46), and «بررسی» is disabled until the pin moves.
  - Tapping a tick moves the pin there and speaks the number. Tick hit areas are 56px wide, which the current 56px spacing allows. Dragging still works.
  - Replace «کمتر»/«بیشتر» with pictures: 1 pomegranate under the right end and 5 small pomegranates under the left end.
  - Remove «=». Put the 3 pomegranates in a row on the right of the card instead.
  - Either render the per-tick dots (r=6, ink-2) or delete the dead elements.

**P1-6 · On the track picker, "listen" sits inside "choose", and there is no clear way back** · `03-track-picker`, `04-lesson-path`
- **What's wrong:**
  - Each track card is a `role="button"` div that contains its own `<button class="speaker sm">` (56px), with only 12px between the speaker and the commit bar. When she taps the speaker to listen first, which is exactly what she is taught to do, the tap can also select the card.
  - The commit "button" is a `<span>`.
  - The screen has no back control and no confirmation.
  - The only way to switch later is the top-bar chip «حساب» on 04, which is a non-interactive `<span class="chip">` with no chevron and is identified only by the text plus a 32px pomegranate.
- **Why it costs her:** If she's dropped into the wrong course by accident, she doesn't know how to get out. «هر وقت خواستید، می‌توانید عوض کنید» is text she can't read.
- **Fix:**
  - Make the card non-interactive. Only the 64px commit bar commits.
  - Move the speaker to the card's top-start corner, at least 24px from the commit bar.
  - After choosing, play a 2s spoken confirmation «عددها را شروع می‌کنیم» with Hoda, and show a 56px back arrow at top-start for 5s.
  - On 04, make the track chip a `<button>` with a down-chevron and the track's own icon (pomegranate or ب tile). Tapping it opens the two-card switcher and speaks.

**P1-7 · Key lesson moments exist only in the flow, not as screens** · `04`–`13`, flows §2–§4
- **What's wrong:** None of these flow states has a mockup:
  - the second-miss "show the answer" state («این «۴» است. بعداً دوباره می‌بینیم.»)
  - the ✕ exit confirmation («مطمئنید؟», continue/leave)
  - the locked-node tap («اول درس قبلی را تمام کنیم»)
  - the daily-goal celebration
  - the unit celebration
  - the rest-day message («دیروز روز استراحت بود»)
  - the soft streak reset («دوباره شروع می‌کنیم. بهترین رکورد شما: ۱۲ روز»)
  - a disabled «بررسی» being tapped
  - loading between exercises
- **Why it costs her:** These are the moments where she is most unsure: leaving, getting it wrong twice, coming back after a gap. Left undesigned, they'll be built as text dialogs.
- **Fix:** Mock each one. In particular:
  - **Exit confirm:** two 140×140 picture buttons: Hoda with a book = stay (green-700, on the start side), a door = leave (outline). The question is spoken. No body text.
  - **Second miss:** the correct card gets a green-500 border and a check badge, the sheet turns neutral cream (not clay), and the button reads «ادامه» with an arrow.
  - **Streak reset:** Hoda with a tea glass. Lead with the best streak, spoken. Never show a "0".

**P1-8 · Repeated failure and endless re-queuing are undefined** · flows §3, `12-feedback-retry`
- **What's wrong:** A second miss re-queues the item "at end of lesson". The flows don't say what happens if she misses the re-queued item again, if one item fails 3 or more times, or if she misses most of a lesson. A trace exercise has no "wrong" path at all.
- **Why it costs her:** A lesson that keeps sending back the item she can't do turns "4–5 minutes" into an exam she can't finish.
- **Fix:**
  - Re-queue an item **at most once** per lesson.
  - On its third miss, show the answer, move it to tomorrow's review, and continue.
  - If at least 50% of a lesson's first attempts are wrong, end it early on a warm screen («امروز خوب تمرین کردیم») and mark the next session as a review of the same lesson.
  - Write these rules into flows.md §3.

**P1-9 · Coming back the next day, nothing tells her where to tap** · `04-lesson-path`, flows §2
- **What's wrong:**
  - The home screen has no greeting or prompt clip. The only speaker reads the unit banner.
  - The current node is 100px, but «شروع» is a separate `<div class="tooltip">` (97×54) that isn't tappable, so tapping the word "start" does nothing.
  - Today's goal progress doesn't appear on home.
  - All 5 nodes have the same `aria-label="درس"`, whatever their state.
- **Why it costs her:** Opening the app every day is the habit the product depends on, and on day 2 she meets a busy map of circles with no voice telling her what to do.
- **Fix:**
  - When home opens (once per day), autoplay «سلام مادر جان! بیایید درس امروز را شروع کنیم.» while Hoda turns toward the current node. The node pulses (scale 1→1.06, 1.2s loop).
  - Merge the node and the «شروع» bubble into one hit target. Tapping either starts the lesson.
  - Add today's-goal pips to the top bar (one dot per goal lesson).
  - Give nodes labels such as «درس ۳، شروع»/«درس ۱، تمام شده»/«قفل».

**P1-10 · The streak screen relies on letters she is still learning** · `14-streak`
- **What's wrong:**
  - The week row is labelled with single letters «ش ی د س چ پ ج», which are the very letters she is studying. To her it looks like an alphabet exercise, not days.
  - The day circles are 44×44 `<span>`s, too small if they are tappable.
  - The goal ring reads «۱ از ۲» in text.
  - The flame number «۵» is white on the inner saffron `#FFC83D` at **1.55:1**. The `#B85A00` text-shadow doesn't fix the contrast.
- **Why it costs her:** She can't read the week. She may also start to recognise «ش» as "Saturday" rather than as a letter, which actively interferes with the alphabet track.
- **Fix:**
  - Drop the letters. Show 7 circles, 56×56: today has a 4px saffron ring and a small sun above it, and tapping any circle speaks the day name («شنبه»).
  - Replace «۱ از ۲» with two 40px lesson pips (filled with a check vs. empty) inside the ring.
  - Put the flame digit in ink `#1B2A22` (9.69:1 on `#FFC83D`).
  - Show rest days in the row as a moon in the circle.

**P1-11 · The same icon means different things** · `04`, `11`, `13`, `14`, `15`
- **What's wrong:**
  - A saffron/ink star is used for XP (04 chip, 11 «۱۰+ امتیاز», 13 stat), for the current lesson node (04), and for the review node (the design-system spec).
  - The «پیشرفت» nav tab uses a bar-chart icon but opens the flame/streak screen, while the actual progress bars live under «من».
- **Why it costs her:** Icons are her vocabulary, and one picture meaning three things breaks that.
- **Fix:**
  - Use a «▶»-style start disc on the current node, a stacked-cards "review" icon on review nodes, and keep the star only for XP.
  - Better still, hide XP from her UI entirely (README open question 10) and show it only in the family-helper area.
  - Rename the tab to «روزها» with the flame icon. Keep progress bars and the letter grid under «من».

**P1-12 · The two exits on lesson complete are 8px apart** · `13-lesson-complete`
- **What's wrong:**
  - «ادامه» spans y 696–760, and the ghost link «همین درس را دوباره بخوانیم» starts at y 768, an **8px** gap.
  - The link is underlined text with no icon.
  - Its verb «بخوانیم» ("let's read") makes no sense to a non-reader.
- **Why it costs her:** A slip of the thumb sends her through the same lesson again when she meant to leave, which feels like being made to repeat a lesson.
- **Fix:**
  - Gap of 24px or more.
  - Replay becomes `.btn-secondary` (64px, 3px `#767F7A` border) with a replay icon and the copy «این درس را دوباره تمرین کنیم».
  - Optional: add «برای امروز کافی است» with a house icon, as the alt-b flow does.

**P1-13 · Targets under 48px, and states shown by colour alone** · `15-profile`, `09-ex-drag-match`
- **What's wrong:**
  - The letter grid tiles are **44×46** with 6px gaps. Flow §5 says "tap → hear letter + example word", so they are targets.
  - They are `<span>`s, which is why `render.js` missed them: it checks only `button,a,.chip,.speaker,…`. So README's claim of "0 interactive elements under 56px" is not accurate.
  - Learned vs not learned is shown only by colour: plum `#7B2A55` on `#F6E6EF` vs ink-2 on `#F3F1EA`. In `wireframes/15-profile.png` the two are indistinguishable.
  - The 09 green row is colour-only as well (see P0-4).
- **Why it costs her:** Tiles that small with 6px gaps mean frequent mis-taps. If the colour difference doesn't register for her, the grid says nothing.
- **Fix:**
  - Use 4 tiles per row at 64×64 with 12px gaps (292px, which fits the 304px inner width), as `<button>`s.
  - Learned tiles get a 20px check badge at the top start. Unlearned tiles get a dashed `#767F7A` border.
  - Extend `render.js` to check `[role=button]`, `span[onclick]` and anything marked `data-tap`.

**P1-14 · Reminders, installing and permissions all assume a reader** · flows §4, §5
- **What's wrong:**
  - The reminder is "a gentle notification … with a mascot voice note". A web push notification shows text, and a voice note can't play inside the notification itself, only after she opens the app.
  - The browser's notification-permission prompt and "Add to Home Screen" are system text dialogs.
  - No flow covers installing the PWA or who sets the reminder. Flow 5 puts the reminder time in her settings, whereas the alt-b flow has a family helper do it.
- **Why it costs her:** She'll get a line of text she can't read, or she'll accidentally block notifications. Without an icon on her home screen she may not find the app again tomorrow.
- **Fix:**
  - Add a **family-helper setup flow** (for Afshin): install to home screen, allow notifications, set the reminder time, and pick the voice.
  - The notification content should be the app icon (Hoda) plus a short title that she will learn to recognise by shape; don't rely on the text.
  - On opening from a notification, Hoda's voice note plays at once.

**P1-15 · Two conflicting flow sets and a mixed contact sheet sit in the package** · `flows/01-first-run|02-lesson-loop|03-review-and-streak.*`, `mockups/_contact-sheet.png`, `wireframes/_contact-sheet.png`
- **What's wrong:** README says these are a parallel "alt-b" exploration and "not part of this package". They still sit beside the real files and contradict them:

  | Topic | alt-b | Package |
  |---|---|---|
  | Onboarding (01-first-run) | Asks for the daily goal, preselects the alphabet track, no avatar/name | Avatar/name, track picker, "no question asked now" |
  | First wrong answer | «اشکالی ندارد» shows the answer at once, no hint/retry | Hint and retry first |
  | Lesson complete | «خسته نباشید!» with a stop option | «آفرین، مادر جان!» |
  | Review | A home card «مرور ۵ دقیقه‌ای» | A saffron path node |

  Both contact sheets show 10 tiles, not 15. Half are alt-b screens (tea-glass welcome, an «الفبا / اعداد» path with a «مرور» nav tab, «این کلمه کدام است؟» with bread, counting tea glasses, «د ب آ» letters). Package screens 06–15 are missing, and the track-picker tile renders with overlapping cards.
- **Why it costs her:** Engineering may build the wrong onboarding or retry logic, and she ends up with mixed rules.
- **Fix:**
  - Move the alt-b files into `/workspace/persian-learn-design/_alt-b/`, or delete them after confirming with their owner (not done here).
  - Regenerate `_contact-sheet.png` from the 15 package mockups.
  - Separately, decide whether to adopt two alt-b ideas: the intro card (see P0-1) and the «برای امروز کافی است» exit.

### P2: Minor polish

**P2-1 · The retry sheet hides what she picked, and «نزدیک بود!» doesn't always fit** · `12-feedback-retry`
- **What's wrong:**
  - The sheet starts at about y 470, which fully covers the answer row (y 502–622), so the wrong «۵» she chose is invisible.
  - «نزدیک بود!» ("close!") will be wrong for far misses, such as ب vs س.
  - The hint box has no replay of its own.
- **Fix:**
  - Show her pick inside the sheet as a 56px tile with a clay border, next to the title.
  - Use «نزدیک بود!» only for numbers ±1. Otherwise use «بیایید با هم ببینیم».
  - Add a 56px speaker to the hint box.

**P2-2 · Repeated «آفرین» can feel like a teacher talking to a child** · `11`, `13`
- **What's wrong:** «آفرین!» appears after every correct answer and again as the lesson-complete headline.
- **Fix:**
  - Rotate adult phrasing: «درست است»، «عالی بود»، «خسته نباشید»، «دستتان درد نکند». Keep the name only on the big moments («خسته نباشید، مادر جان!»).
  - Limit «آفرین» to at most 1 in 4 correct answers.

**P2-3 · Avatar and name share one screen, with answers already chosen** · `02-onboarding-avatar`
- **What's wrong:**
  - Two tasks on one screen break the package's own rule "one task per screen".
  - The tulip and «مادر جان» are already selected, so «بعداً» does nothing.
  - The name chips are `<span>`s.
- **Fix:**
  - Split into 02a (avatar) and 02b (name), with nothing preselected.
  - «ادامه» stays disabled until she picks, or until she taps the «بعداً» secondary button.
  - Make the chips `<button>`s.

**P2-4 · Speakers change position and colour** · `04`, `11`, `12`
- **What's wrong:**
  - The feedback-sheet speakers sit at the inline end (x=24, left), while every prompt speaker is at the start (right). The spec says "always at the start".
  - The unit-banner speaker is white on green, which breaks "audio is always blue".
- **Fix:**
  - Put sheet speakers at the start: swap them with the icon tile, or put them right after it.
  - Make the banner speaker a blue-700 disc with a 3px white ring.

**P2-5 · Faint card edges for aging eyes** · `02`, `05`, `06`, `08`
- **What's wrong:** Unselected answer cards are white on cream (1.03:1), with a `#D5DCD7` border at 1.35:1.
- **Fix:** Use a `#8A938E` 3px border (3.06:1 on `#FFFBF2`) for unselected tappable cards. Keep `--line` for decorative containers only.

**P2-6 · The numbers don't add up** · `13`, `14`
- **What's wrong:**
  - 13 shows «۲۰+» امتیاز for a lesson of 8–10 exercises, yet the flow and screen 11 give «۱۰+» per correct answer. That would total 80–100.
  - 14 shows «هدف امروز: ۲ درس», while the default goal is 1 and no mockup shows it being changed.
- **Fix:**
  - Make the stats consistent: show the real total, or drop XP (see P1-11).
  - Either mock 14 with «۱» or add a note that the goal was changed in the helper area.

**P2-7 · Apple and pomegranate are too alike for a first word** · `05-ex-tap-picture`
- **What's wrong:** Both are round, red fruit of similar size.
- **Fix:** For new vocabulary, choose distractors that differ in colour and outline (tea glass, bread, cypress). Save the apple vs pomegranate contrast for review.

**P2-8 · Counting help arrives only after a mistake** · `08-ex-count-objects`
- **What's wrong:** The count-with-me badges appear only on the retry sheet (12).
- **Fix:** Let her tap each pomegranate before answering. Each tap shows the next Persian numeral badge (40px, clay-800) and speaks it («یک», «دو»…). Teach this on the intro card.

**P2-9 · Path node meanings are muddled** · `04-lesson-path`
- **What's wrong:** The review node renders as saffron with a **lock**, class `review locked`, where the spec says saffron with a star. A saffron lock looks like a premium or paid item.
- **Fix:** Locked review nodes use the grey locked style, and turn saffron with the review icon only once unlocked.

**P2-10 · The alphabet order shown contradicts the stated plan** · `03`, `15`
- **What's wrong:**
  - README decision 11 says early letters are visually distinct (ب/م/س), not ب/پ/ت/ث.
  - Profile shows the first 8 learned as «آ ب پ ت ث ج چ ح», which includes the look-alike group.
  - The track card glyph is «ا ب پ».
- **Fix:** Make the mockups match whichever order the pedagogy research chooses (open question 2). Until then, show «آ ب د م س» (the textbook-style start that README itself cites) on both screens.

**P2-11 · The number-line direction is still an open question** · `10-ex-number-line`
- **What's wrong:** The RTL line is internally consistent and correct as drawn. README open question 1 flags a possible clash with how textbooks draw it, which I can't verify from the files.
- **Fix:** Decide before build. Whichever way it goes, keep ۰ at the "start" side and the arrowhead pointing toward larger numbers.

**P2-12 · Onboarding dots don't match the steps** · `01`, `02`, `03`
- **What's wrong:** There are 3 dots, but the flow has 5 steps: welcome, sound check, avatar, name, track. The dots also mean little to her.
- **Fix:** Use one dot per real step, with the current dot at 36×14 as now, or replace them with Hoda moving along a short 5-stone path.

**P2-13 · The rendered flow images garble Persian** · `flows/*.png` (both sets)
- **What's wrong:** Mermaid's bidi handling moves the «» quotes and splits phrases. Examples: `04-streak-goal.png` «۵ روز پشت سر هم!» and `01-first-run.png` "'سلام، خوش' آمدید".
- **Fix:** Wrap the Persian strings in `<span dir="rtl">` inside the node labels, or render the strings as images. Then re-check every PNG.

**P2-14 · The streak flame looks flat** · `14-streak`
- **What's wrong:** At 132px the flame is the hero, but its inner shape is low-contrast and static in the mockup.
- **Fix:** Apply the spec's "grow 0.6→1 + digit flip" animation and the crackle chime. Pair it with a new Hoda pose (holding a tea glass) at the ۳/۷/۳۰-day milestones, so the screen celebrates instead of just reporting.

---

## 4. Flow findings (summary)

| Flow | Finding | ID |
|---|---|---|
| Onboarding (`01-onboarding.png`) | The blocked-audio and sound-check steps have no screens. The first screen is silent on first launch. | P0-2 |
| Onboarding | No back control; a mis-tap on the track picker is hard to undo | P1-6 |
| Onboarding vs alt-b `01-first-run` | Contradicts it on track pick, avatar and daily goal | P1-15 |
| Home/path (`02-home-path.png`) | No daily greeting or pointer; «شروع» can't be tapped; the track chip isn't a button | P1-9, P1-6 |
| Lesson loop (`03-lesson-loop.png`) | No intro/teach step | P0-1 |
| Lesson loop | Second miss, exit confirm and locked tap aren't designed | P1-7 |
| Lesson loop | No cap on re-queuing; no rule for many failures; no wrong-trace path | P1-8 |
| Lesson loop | The drag exercise has no fallback, so she can't reach «بررسی» | P0-4 |
| Streak (`04-streak-goal.png`) | The rest-day and reset messages have no screens; the reminder is text-only; no install or permission flow | P1-7, P1-14 |
| Profile (`05-profile-progress.png`) | Autoplay is in her own settings; the family-helper long-press target isn't defined (on which element?); the mockup lacks text size, daily goal and reminder settings | P0-3 |
| Dead ends | A silent app (audio off or failed); being unable to drag; the wrong track | P0-2, P0-3, P0-4, P1-6 |
| Re-entry after a gap | The soft streak reset copy is good, but unmocked; the rest-day moon is not shown on 14 | P1-7, P1-10 |

## 5. What's working

- **RTL is right where it matters.** The progress fill grows from the right on 05–12. The number line has ۰ at the right and the arrowhead toward ۵ on the left. Answer order is «۳ ۴ ۵» from the right. The close ✕ sits at the top start. The forward arrows point left. The trace stroke for ب starts at the right tip and runs leftward. Toggles are mirrored.
- **Persian digits everywhere in the app UI**, including SVG labels («۰»…«۵») and stats. Only the device status bar ("9:41") is Latin, and that is OS chrome.
- **Size and contrast:** the smallest text is 22px, prompts are 26px, and answer glyphs are 72–84px. Body text measures 14.51:1 and secondary text 7.08:1. Primary buttons are 64px, prompt speakers 80–136px, and the bottom nav 72px tall.
- **No punishment:** no hearts or timers, the progress bar never goes backward, wrong answers use clay instead of red, and the count-with-me hint on 12 (numbered badges ۱–۴) is exactly the right kind of help.
- **Tone foundations:** Hoda the hoopoe, a mascot with cultural depth, the polite «شما», adult avatar objects and everyday Iranian items. The mockups contain no baby cartoons.

## 6. Per-screen index

| Screen | Findings |
|---|---|
| `01-onboarding-welcome` | P0-2, P2-12 |
| `02-onboarding-avatar` | P1-2, P2-3, P2-5, P2-12 |
| `03-track-picker` | P1-1, P1-2, P1-6, P2-10, P2-12 |
| `04-lesson-path` | P1-1, P1-6, P1-7, P1-9, P1-11, P2-4, P2-9 |
| `05-ex-tap-picture` | P0-1, P1-2, P1-3, P1-7, P2-5, P2-7 |
| `06-ex-listen-letter` | P0-1, P1-2, P1-3, P1-7, P2-5 |
| `07-ex-trace-letter` | P0-1, P1-1, P1-2, P1-3, P1-4, P1-7 |
| `08-ex-count-objects` | P0-1, P1-2, P1-3, P1-7, P2-5, P2-8 |
| `09-ex-drag-match` | P0-1, P0-4, P1-2, P1-3, P1-7, P1-13 |
| `10-ex-number-line` | P0-1, P1-1, P1-2, P1-3, P1-5, P1-7, P2-11 |
| `11-feedback-correct` | P1-3, P1-7, P1-11, P2-2, P2-4 |
| `12-feedback-retry` | P1-1, P1-3, P1-7, P1-8, P2-1, P2-4 |
| `13-lesson-complete` | P1-1, P1-2, P1-7, P1-11, P1-12, P2-2, P2-6 |
| `14-streak` | P1-1, P1-10, P1-11, P2-6, P2-14 |
| `15-profile` | P0-3, P1-1, P1-11, P1-13, P2-10 |
| Flows | P0-1, P0-2, P0-4, P1-6, P1-7, P1-8, P1-9, P1-14, P1-15, P2-13 |

### Can't be judged from static files

These should be true, but the files can't confirm them:
- Audio clips exist and play in the Tehrani female voice at −16 LUFS.
- The correct chime and the soft retry "hmm" are clearly different.
- Haptics fire on Android. iOS PWAs have none, per spec, so sound has to carry the feedback there.
- Reduced-motion swaps work.
- Each screen's autoplay clip covers every visible sentence (see P1-1).
