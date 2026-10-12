# persian-learn: design package v1

A Duolingo/Brilliant-style PWA for an adult beginner. The learner is 50, Persian-speaking, has never been to school, and is starting from zero. There are two tracks: **numbers and simple math**, and **the Persian alphabet and beginner reading**. The whole UI is Persian, RTL, set in Vazirmatn, with audio first.

Created 2026-10-12 (۲۰ مهر ۱۴۰۵) on the box at `/workspace/persian-learn-design/`. Open `index.html` for the gallery.

## Files

| Path | What it is |
|---|---|
| `README.md` | This file |
| `index.html` | Gallery of every screen (wireframe + mockup pairs, linked to HTML) and every flow |
| `index-preview.png` | Full-page render of the gallery |
| `flows.md` | 5 Mermaid flowcharts + the gentle-retry rules |
| `flows/01-onboarding.png` | Onboarding (no typing, avatar + optional name chip, sound check, track pick) |
| `flows/02-home-path.png` | Home and the winding lesson path with units |
| `flows/03-lesson-loop.png` | Lesson loop: 6+ exercise types, correct and try-again feedback, no hearts, lesson complete with XP |
| `flows/04-streak-goal.png` | Streak, daily goal, rest days, reminders |
| `flows/05-profile-progress.png` | Profile, progress and settings |
| `design-system.md` | Palette with **computed** contrast ratios, type scale, spacing, radii, elevation, components, mascot, motion/sound/haptics |
| `design-system.html` / `design-system.png` | Rendered design-system sheet (1280px wide) |
| `tokens.css` | Design tokens (CSS custom properties, @font-face, reduced-motion overrides) |
| `components.css` | Shared component styles used by every mockup |
| `wireframe.css` | Low-fi layer: same markup, grayscale tokens, crossed placeholder boxes for images |
| `fonts/Vazirmatn-*.woff2` | Self-hosted Vazirmatn v33.003 (400/500/700/800/900) |
| `tools/build.py` | Generates all 15 screens × 2 layers from one source (`python3 tools/build.py`) |
| `tools/art.py` | All inline SVG icons, illustrations and the mascot |
| `tools/build_ds.py`, `tools/contrast.py` | Design-system sheet + WCAG contrast calculator |
| `tools/render.js` | Playwright render (390×844 @2x) **and automated QA** → `tools/qa-report.json` |
| `tools/render-flows.js` | Extracts Mermaid blocks from `flows.md` → `flows/*.png` (mermaid-cli) |
| `tools/render-sheets.js` | Renders `design-system.png` and `index-preview.png` |

### Screens (390×844, device scale factor 2 → PNGs are 780×1688)

| # | Name | Screen | Wireframe | Mockup |
|---|---|---|---|---|
| 1 | `01-onboarding-welcome` | خوش‌آمدگویی | `wireframes/01-onboarding-welcome.html` · `.png` | `mockups/01-onboarding-welcome.html` · `.png` |
| 2 | `02-onboarding-avatar` | انتخاب تصویر و نام | `wireframes/02-onboarding-avatar.html` · `.png` | `mockups/02-onboarding-avatar.html` · `.png` |
| 3 | `03-track-picker` | انتخاب مسیر | `wireframes/03-track-picker.html` · `.png` | `mockups/03-track-picker.html` · `.png` |
| 4 | `04-lesson-path` | مسیر درس | `wireframes/04-lesson-path.html` · `.png` | `mockups/04-lesson-path.html` · `.png` |
| 5 | `05-ex-tap-picture` | تمرین: تصویر درست | `wireframes/05-ex-tap-picture.html` · `.png` | `mockups/05-ex-tap-picture.html` · `.png` |
| 6 | `06-ex-listen-letter` | تمرین: گوش کن و حرف را پیدا کن | `wireframes/06-ex-listen-letter.html` · `.png` | `mockups/06-ex-listen-letter.html` · `.png` |
| 7 | `07-ex-trace-letter` | تمرین: حرف را بکش | `wireframes/07-ex-trace-letter.html` · `.png` | `mockups/07-ex-trace-letter.html` · `.png` |
| 8 | `08-ex-count-objects` | تمرین: بشمار | `wireframes/08-ex-count-objects.html` · `.png` | `mockups/08-ex-count-objects.html` · `.png` |
| 9 | `09-ex-drag-match` | تمرین: جفت کن | `wireframes/09-ex-drag-match.html` · `.png` | `mockups/09-ex-drag-match.html` · `.png` |
| 10 | `10-ex-number-line` | تمرین: خط عدد | `wireframes/10-ex-number-line.html` · `.png` | `mockups/10-ex-number-line.html` · `.png` |
| 11 | `11-feedback-correct` | بازخورد: درست | `wireframes/11-feedback-correct.html` · `.png` | `mockups/11-feedback-correct.html` · `.png` |
| 12 | `12-feedback-retry` | بازخورد: دوباره امتحان | `wireframes/12-feedback-retry.html` · `.png` | `mockups/12-feedback-retry.html` · `.png` |
| 13 | `13-lesson-complete` | درس تمام شد | `wireframes/13-lesson-complete.html` · `.png` | `mockups/13-lesson-complete.html` · `.png` |
| 14 | `14-streak` | رشته روزها و هدف روزانه | `wireframes/14-streak.html` · `.png` | `mockups/14-streak.html` · `.png` |
| 15 | `15-profile` | نمایه و پیشرفت | `wireframes/15-profile.html` · `.png` | `mockups/15-profile.html` · `.png` |

Rebuild everything:
```
cd tools && python3 build.py && python3 build_ds.py && node render.js && node render-flows.js && node render-sheets.js
```

> Note: `flows/01-first-run.*`, `flows/02-lesson-loop.*`, `flows/03-review-and-streak.*`, `mockups/_contact-sheet.png`, `wireframes/_contact-sheet.png` and `tools/mm.json` were written into this folder at 04:51 by a different agent on the shared box (a parallel "alt-b" exploration). They are **not part of this package**, so I left them alone.

## QA performed
- Every PNG was opened and inspected visually. The Persian is shaped and joined, runs RTL, and the ZWNJs are correct. Digits are Persian.
- `tools/render.js` checked all 30 renders automatically (15 screens × 2 layers):
  - 0 elements overflow 390px
  - 0 interactive elements under 56px (buttons, links, chips, speaker, toggles, segmented options)
  - 0 text nodes under 22px (status bar excluded)
- Contrast ratios were computed with the WCAG relative-luminance formula. The table is in `design-system.md`.

## Key design decisions and assumptions
1. **Gentle alternative to hearts: none are lost.**
   - The first wrong answer opens a warm-clay sheet («نزدیک بود!»). It gives a spoken plus visual hint, such as numbers appearing on each pomegranate, and offers a retry.
   - The second wrong answer shows and speaks the correct answer, re-queues the item at the end of the lesson, and adds it to spaced review.
   - The progress bar never moves backward, and wrong answers are never shown in red.
2. **Tap = hear, then «بررسی» (check).** Tapping any option speaks it first, so she can explore by ear before committing. Committing is a separate large button. Assumed to be better than instant-submit for a non-reader.
3. **Number line runs right to left (۰ at the right, larger numbers to the left)**, labeled «کمتر» on the right and «بیشتر ←» on the left. Reasons:
   - It matches her reading direction and every other "forward" in the app (progress bar, path, option order ۳ ۴ ۵, onboarding dots).
   - She has no prior schooling to conflict with it.
   - It is a single CSS/SVG flip if pedagogy research says otherwise (see open questions).
4. **No typing anywhere.** The name is optional and picked from chips («مادر جان», «خانم جان», «مامان», «بانو»). The avatar is one of 6 adult, culturally familiar images (tulip, tea glass, cypress, pomegranate, sun, moon), not cartoon faces.
5. **Mascot «هُدی» (Hoda), a hoopoe.** It is the guide bird of Attar's *Conference of the Birds*, and «هُدی» means "guidance". It is warm, dignified and adult, and speaks with the polite «شما».
6. **Color.**
   - Duolingo green #58CC02 is kept for decoration only (2.0:1 on cream).
   - Interactive green is #1F6408: white text on it is 7.28:1, which is AAA.
   - Body text is 14.5:1 and secondary text is 7.08:1.
   - Audio is always blue, so "blue circle = listen" is learnable.
7. **Streak with 2 automatic rest days per week.** The best-ever streak is never lost. There is at most one reminder per day.
8. **Daily goal default = 1 lesson** of about 8–10 exercises (~4–5 min). Changeable in Profile.
9. **Audio** is human-recorded (Tehrani accent, warm female voice). Each prompt autoplays once, and the first tap unlocks browser audio. A slow (0.75×) replay is available everywhere.
10. **Illustrations** are flat and rounded and show everyday Iranian objects (pomegranate, istekan tea, bread). There is no emoji in the UI.
11. **The letters track begins with isolated forms and sounds** (ب، م، س…). Letter cards in listen-and-choose use visually distinct letters early on (ب / م / س), not ب / پ / ت / ث.
12. Copy uses the respectful plural («بکشید», «انتخاب کنید») and short sentences. Every line is also spoken.
13. Out of scope for v1 mockups, but present in the flows: money, clock, add/subtract-with-objects, and read-a-word exercises. They reuse the same exercise shell.

## Open questions for the pedagogy research
1. **Number-line direction.** Iranian grade-1 math textbooks (کتاب ریاضی اول دبستان) may draw number lines left-to-right like international math. Should we match the textbook (useful if she later helps grandchildren) or keep RTL for consistency with reading?
2. **Alphabet order.** Should letters be taught in textbook order (the «بابا آب داد» sequence of the Iranian first-grade «فارسی» book: آ، ب، د، م، س…), alphabetical order, or by frequency/visual distinctness? Should letters be taught with their joined forms from day one?
3. **Letter names vs letter sounds.** Do we teach «ب» as "be" (name) or /b/ (sound) first? Phonics-first is common for adult literacy, but needs confirmation for Persian.
4. **Short vowels and diacritics** (ـَ ـِ ـُ). When should they be introduced, and should beginner words be fully vocalized?
5. **Tracing.** How strict should stroke-order and direction checking be for a 50-year-old with possibly limited fine-motor practice, and should tracing come before or after recognition?
6. **Math sequencing.** Should the order be counting 1–5 → 0 → 6–10, or 0–10 together? Is subitizing (instant recognition of dot patterns) worth its own exercise? When should money be introduced (rial vs toman), given she may already be fluent with real money?
7. **Telling time.** Does she already read analog clocks by position? If so, should the time unit build on existing skill rather than start from zero?
8. **Session length and spacing** for older adult learners. Is 8–10 items / ~5 minutes right? What is the right review interval?
9. **Feedback.** Is a second-miss "show the answer" better than unlimited retries for confidence and retention? Should we ever show a score?
10. **Adult dignity.** Are XP, streaks and confetti motivating or patronizing for this learner? Would she prefer family-visible progress (sharing a weekly summary with Afshin)?
11. **Dialect and voice.** Which accent and voice does she find clearest (Tehrani vs her regional accent)? Does she prefer a male or female narrator?
12. **Device and context.** Phone or tablet, her eyesight (presbyopia, so is 22px still too small?), hearing, and whether she'll practice alone or with someone nearby.
