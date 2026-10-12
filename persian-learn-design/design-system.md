# persian-learn: design system v1

Rendered sheet: `design-system.png` (source `design-system.html`). Tokens: `tokens.css`. Shared components: `components.css`. Low-fi override: `wireframe.css`.

**Character:** warm, adult, and calm. It uses the Duolingo-style friendly green and chunky 3D buttons, with a cream background instead of stark white, everyday Iranian objects in the illustrations, and no cartoon children or baby-talk. Everything is large, everything can speak, and only one thing happens on a screen at a time.

## 1. Color

### Palette

| Token | Hex | Role |
|---|---|---|
| `--bg` | `#FFFBF2` | Page background (warm cream) |
| `--surface` | `#FFFFFF` | Cards, sheets |
| `--surface-2` | `#F3F1EA` | Progress track, trays |
| `--ink` | `#1B2A22` | Primary text |
| `--ink-2` | `#4A5A51` | Secondary text |
| `--line` | `#D5DCD7` | Decorative dividers, card edges |
| `--line-strong` | `#767F7A` | Meaningful borders (secondary button, segmented) |
| `--green-500` | `#58CC02` | Decorative: progress fill, done nodes, confetti |
| `--green-600` | `#3E9A00` | Progress fill, done path nodes |
| `--green-700` | `#1F6408` | Primary buttons, current node, unit banner |
| `--green-800` | `#164A05` | Button 3D edge |
| `--green-100` | `#E8F7D6` | Correct sheet / card bg |
| `--green-900` | `#1A4F06` | Text on green-100 |
| `--blue-700` | `#0D4F9E` | Speaker (audio) buttons, selection |
| `--blue-100` | `#E3EEFB` | Selected card bg, slow-audio pill |
| `--clay-100` | `#FFF1E6` | Gentle retry sheet bg |
| `--clay-400` | `#F0A36B` | Retry card border (with icon) |
| `--clay-800` | `#7A3410` | Retry text / retry button |
| `--saffron-400` | `#FFC83D` | Streak, XP, review node |
| `--teal-700` | `#0E6E78` | Math track accent |
| `--plum-700` | `#7B2A55` | Alphabet track accent |

### Contrast pairs (computed, WCAG 2.x relative luminance)

| Pair | FG / BG | Ratio | Grade | Used for |
|---|---|---|---|---|
| ink on bg | `#1B2A22` / `#FFFBF2` | **14.51:1** | AAA | Body text |
| ink on surface | `#1B2A22` / `#FFFFFF` | **14.99:1** | AAA | Card text |
| ink-2 on bg | `#4A5A51` / `#FFFBF2` | **7.08:1** | AAA | Secondary text |
| disabled-ink on disabled-bg | `#4A5A51` / `#E6E9E7` | **5.98:1** | AA (AAA for large text) | Disabled button label |
| white on green-700 | `#FFFFFF` / `#1F6408` | **7.28:1** | AAA | Primary button label |
| green-900 on green-100 | `#1A4F06` / `#E8F7D6` | **8.64:1** | AAA | Correct sheet text |
| white on blue-700 | `#FFFFFF` / `#0D4F9E` | **7.99:1** | AAA | Speaker glyph |
| blue-800 on blue-100 | `#083A76` / `#E3EEFB` | **9.53:1** | AAA | Slow-audio pill / selected chip |
| clay-800 on clay-100 | `#7A3410` / `#FFF1E6` | **8.16:1** | AAA | Retry sheet text |
| white on clay-800 | `#FFFFFF` / `#7A3410` | **9.03:1** | AAA | Retry button label |
| ink on saffron-400 | `#1B2A22` / `#FFC83D` | **9.69:1** | AAA | XP / streak tiles |
| white on teal-700 | `#FFFFFF` / `#0E6E78` | **5.97:1** | AA (AAA for large text) | Math track button (24px bold = large text) |
| white on plum-700 | `#FFFFFF` / `#7B2A55` | **9.11:1** | AAA | Alphabet track button |
| plum-700 on plum tint | `#7B2A55` / `#F6E6EF` | **7.59:1** | AAA | Learned-letter tiles |
| teal-700 on teal tint | `#0E6E78` / `#E1F2F3` | **5.17:1** | AA (AAA for large text) | Math card digits |
| line-strong on bg | `#767F7A` / `#FFFBF2` | **4.00:1** | PASS (non-text ≥3:1) | Non-text: meaningful borders (needs ≥3:1) |
| green-600 on surface-2 | `#3E9A00` / `#F3F1EA` | **3.19:1** | PASS (non-text ≥3:1) | Non-text: progress fill vs track (needs ≥3:1) |
| white on green-600 | `#FFFFFF` / `#3E9A00` | **3.60:1** | PASS (non-text ≥3:1) | Non-text: check icon on done node (needs ≥3:1) |
| lock icon on locked node | `#6B7570` / `#E3E6E4` | **3.79:1** | PASS (non-text ≥3:1) | Non-text: lock glyph (needs ≥3:1) |
| green-500 on bg | `#58CC02` / `#FFFBF2` | **2.02:1** | below 3:1 → decorative use only | Non-text: decorative only (confetti, borders paired with icon) |
| green-700 on bg | `#1F6408` / `#FFFBF2` | **7.05:1** | PASS (non-text ≥3:1) | Non-text: primary button shape vs page |

**Rules**
- Text pairs are AAA (7:1 or better), with two exceptions. White on teal-700 (5.97:1) and the disabled label (5.98:1) are used only for 24px bold labels, which count as large text, so they reach AAA large (4.5:1 or better).
- `--green-500` (#58CC02, the classic Duolingo green) is **decorative only**: confetti, the correct-card border paired with a check, and highlights. Its contrast against cream is only 2.02:1, so it never carries text or meaning alone. Buttons use the darker `--green-700`. The progress fill and done nodes use `--green-600` (3.19:1 against the track, which passes the 3:1 non-text rule).
- **Wrong is never red.** "Try again" uses warm clay (`--clay-*`) so a mistake reads as "almost", not "error". Red appears only in illustrations such as the apple and pomegranate.
- State is never shown by color alone. Every state also has an icon (check, bulb, or the mascot), a spoken line, and a shape change.
- Track colors: math is teal `#0E6E78`, and the alphabet track is plum `#7B2A55`.

## 2. Typography: Vazirmatn

| Token | Size / line height | Weight | Use |
|---|---|---|---|
| `--fs-numeral` | 72px / 1.1 | 800 | Digits and letters on answer cards (84px for the listen-letter cards) |
| `--fs-display` | 40px / 56px | 900 | Celebration titles («آفرین، مادر جان!») |
| `--fs-h1` | 32px / 48px | 800 | Screen titles, feedback-sheet titles |
| `--fs-h2` | 26px / 40px | 700 | Exercise prompts, card titles |
| `--fs-body-lg` | 24px / 40px | 700 for buttons, 500 for body | Button labels, key sentences |
| `--fs-body` | 22px / 36px | 400–500 | **Minimum size anywhere in the app** (including nav labels and captions) |

- The font is self-hosted from `fonts/` (Vazirmatn v33.003 woff2: 400, 500, 700, 800, 900), with Google Fonts as an alternative URL noted in `tokens.css`.
- Line height is about 1.6 or more, which leaves room for Persian ascenders and descenders and for diacritics such as «هُدی».
- **Always Persian digits** (۰–۹). Numbers inside sentences stay as Persian digits («۵ روز»).
- Use ZWNJ (نیم‌فاصله) correctly: «می‌گیریم», «حرف‌ها», «انگشت‌تان».
- No italics, no all-caps equivalents, and no text in images. Emphasis comes from weight only.
- The user can switch text size to "extra large" in settings, which applies ×1.15 to every token.

## 3. Spacing, radii, elevation

- **Spacing (4-point base):** s-1 4 · s-2 8 · s-3 12 · s-4 16 · **s-5 24** (screen gutter) · s-6 32 · s-7 40 · s-8 56 · s-9 72.
- **Radii:** r-sm 12 (small tiles) · r-md 20 (buttons, icon buttons) · r-lg 28 (cards, sheets) · pill 999 (chips, progress, toggles).
- **Elevation:**
  - `edge-btn` is a 6px solid bottom edge in a darker shade. This is the "pressable" 3D look. On press, the element moves translateY(4px) and the edge drops to 2px.
  - `elev-1` is used for cards.
  - `elev-2` is used for tooltips and the dragged tile.
  - `elev-3` is used for bottom sheets.

## 4. Touch targets and layout
- Every interactive element is **56×56px or larger**. Primary buttons are 64px tall and full width. The speaker is 80px (136px hero, 56px inline). Nav items are 72px tall. The toggle is 96×56px and segmented options are 56px tall.
  - All 15 screens were checked automatically (`tools/render.js` → `tools/qa-report.json`): no target is under 56px, nothing overflows 390px, and no text is under 22px.
- The main action sits in the bottom thumb zone. The close (✕) button sits at the top start, which is the right side in RTL, far from the primary action.
- One task per screen. At most 4 answer options, and 3 by default for brand-new content.

## 5. Components (see `components.css`)
| Component | Spec |
|---|---|
| **Primary button** `.btn-primary` | Green-700 background, white 24px/700 label, 64px tall, r-md, 6px green-800 edge. A trailing arrow points **left** (forward in RTL). |
| **Secondary button** `.btn-secondary` | White background, 3px line-strong border (4.0:1), ink label. Used for "show me again" and other non-committing actions. |
| **Disabled button** `.btn-disabled` | #E6E9E7 background, ink-2 label (5.98:1). It is still readable, and tapping it speaks what is missing («اول یک جواب انتخاب کنید»). |
| **Retry button** `.btn-retry` | Clay-800 background, white label (9.03:1), replay icon. |
| **Ghost / text button** `.btn-ghost` | Underlined green-900 text, 56px tall hit area. Used for "later" and "do this lesson again". |
| **Speaker** `.speaker` | Blue-700 circle. 80px default, `.xl` 136px, `.sm` 56px. A pulsing ring (`.playing`) shows while audio plays. It is always at the start (right) of the prompt row. |
| **Slow audio** `.slow-btn` | Pill with a turtle icon and «آهسته‌تر». Replays at 0.75× speed. |
| **Answer card** `.card` | White, 3px border, r-lg, 5px bottom edge. States: `selected` (blue), `correct` (green plus a check), `wrong` (clay, labeled "try again"), `dim` (45% opacity after the answer). Picture cards are 172px tall, digit and letter cards are 120–150px. Tapping a card **speaks its content**. |
| **Progress bar** `.progress` | 20px pill. The fill grows from the **right** edge (RTL) and never moves backward. |
| **Feedback sheet** `.sheet.correct` / `.sheet.retry` | Bottom sheet over a 28% scrim. Contents: icon tile (check, or the mascot for retry), h1 title, 24px subtitle, inline speaker, optional hint box (dashed clay with a bulb), and a full-width button. |
| **Path nodes** `.node` | 84px circles (current node 100px). **done** = green-600 with a white check. **current** = green-700 with a star, a 10px glow ring, and a «شروع» tooltip. **locked** = grey with a lock. **review** = saffron with a star. |
| **Streak badge** `.chip` | A flame icon plus a Persian digit in a 56px pill, shown in the home top bar. The streak screen shows a 132px flame with the number inside. |
| **Unit banner** `.unit` | Green-700 card with a white inline speaker, «بخش ۱», and the unit title. |
| **Bottom nav** `.nav` | 3 items: خانه / پیشرفت / من. Each has a 34px icon and a 22px label, and the active item gets a green-100 pill. |
| **Chips, segmented control, toggle** | 56px tall. The toggle knob sits at the inline-end (left) when on, mirrored for RTL. |

**RTL rules**
- Use `dir="rtl"` on `<html>` and logical CSS properties (`inset-inline-*`, `margin-inline-*`).
- Mirror directional icons (arrows, the slow-audio turtle faces the reading direction). Do not mirror the speaker, check, clock, star, or lock icons.
- Progress, the path's first zig, onboarding dots, and answer-option order (۳ ۴ ۵) all run right to left.

## 6. Mascot: «هُدی» (Hoda) the hoopoe

- **What:** a warm, round hoopoe (هُدهُد) with a saffron-and-black crest, a striped wing, and a gentle smile. The SVG is in `tools/art.py`, `hoopoe()` and `hoopoe(cheer=True)`, and is shown in `design-system.png`.
- **Why:** in Attar's «منطق‌الطیر» (*The Conference of the Birds*), the hoopoe is the wise bird that guides the others on their journey. That fits a learning path well, and the reference is instantly familiar and dignified for an Iranian adult. The name «هُدی» means "guidance" and echoes «هُدهُد». It reads as a respectful companion, not a cartoon for children. The hoopoe is also a common Iranian bird and has been proposed as the national bird.
- **Voice:** a warm adult female voice that speaks slowly. Hoda always addresses the learner with the plural/polite form «شما» and the chosen name («مادر جان»).
- **Poses for v1:**
  - idle (path, onboarding)
  - cheer (wings up, smiling eyes) for lesson complete
  - small head in the retry sheet as an encouraging "let's try together"
  - Later poses: pointing (hints), sleeping (rest day), holding a tea glass (daily goal met).

## 7. Motion, sound, haptics

| Moment | Motion | Duration / easing | Sound | Haptic |
|---|---|---|---|---|
| Button press | translateY(4px), edge 6→2px | 90ms `--ease-out` | soft tick (optional) | light |
| Tap answer card | scale 0.97→1, selected border | 160ms `--ease-spring` | the option is **spoken** | light |
| Correct | card pops (scale 1→1.06→1); sheet slides up | 240ms spring; sheet 320ms `--ease-out` | warm two-note chime (major third) | success (2 short) |
| Try again | card does a gentle 2-cycle sway (**not** a shake); sheet slides up; hint numbers fade in one by one | sway 400ms; hints 300ms staggered | soft low "hmm" tone (never a buzzer) + Hoda speaks the hint | single soft |
| Progress bar | width eases to the new value; a small sparkle travels right→left | 400ms `--ease-out` | none | none |
| Lesson complete | confetti burst from the top (40 pieces, about 1.2s), Hoda cheers, stat tiles count up | 1200ms; tiles staggered 120ms | celebratory 2s flourish (santur/tar timbre, not arcade) | success |
| Streak +1 | flame grows from 0.6→1 and the digit flips | 600ms spring | crackle chime | medium |
| Path: next node unlocks | lock fades out, node pops, path auto-scrolls | 500ms | soft chime | light |
| Locked node tapped | 3px nudge left/right ×2 | 240ms | spoken: «اول درس قبلی را تمام کنیم» | none |

- **What celebrates:** every correct answer gets a small celebration. Finishing a lesson gets a big one. Reaching the daily goal and completing a unit also celebrate, and new streak milestones (۳, ۷, ۳۰ days) get a special Hoda pose. Mistakes are never animated harshly.
- **Autoplay:**
  - Each screen's prompt autoplays **once**, 300ms after the screen settles.
  - Browsers block audio until the first user gesture, so the welcome screen's big «شروع کنیم» tap unlocks audio for the session. If autoplay is still blocked, the speaker pulses and the caption says to tap it.
  - Audio never overlaps itself: a new clip stops the previous one.
  - Autoplay can be turned off in Profile; it is on by default.
  - The speed setting (آهسته 0.8× / عادی 1×) applies everywhere, and «آهسته‌تر» gives a one-off 0.75× replay.
- **Reduced motion:** `prefers-reduced-motion: reduce` sets every duration token to 0. Confetti becomes a static badge, the sway becomes a color change, and the auto-scroll jumps instead of animating. Sound and haptics remain because they carry meaning; both can be turned off separately.
- **Haptics** use `navigator.vibrate` where supported (Android). iOS PWAs have no vibration API, so audio carries the feedback there.
- **Audio assets:** human-recorded by a native Tehrani-accent female speaker, with one clip per prompt, option, letter name, letter sound, and number. Use a 48 kHz Opus/AAC source with normalized loudness (−16 LUFS). Do not use TTS for letter sounds.
