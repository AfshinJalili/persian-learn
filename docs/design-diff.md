# Design diff — implemented app vs approved mockups

Captured 2026-10-12 with Playwright at **390×844**, `deviceScaleFactor: 2`.

Before shots live in `docs/screenshots/design-match/before/`. Mockups are `persian-learn-design/mockups/*.png` (and the HTML/CSS sources next to them).

The real PWA does **not** draw the mockups’ fake iOS status bar (9:41 + signal/battery). That 44px chrome is a mockup-frame only; every screen below is compared in the content area under it.

## Global tokens and chrome (every screen)

| Token / part | Mockup | App before |
|---|---|---|
| Page background | `#FFFBF2` warm cream | Close (`#fffbf2`) but Tailwind `cream-50` (`#fffef7`) still in theme |
| Ink / secondary | `#1B2A22` / `#4A5A51` | Same variables exist; many surfaces use generic Tailwind gray |
| Type scale | 22 / 24 / 26 / 32 / 40 / 72, weights 400–900, lh 36–56 | Mixed `text-sm` (14), `text-xl`, `text-2xl`; nav labels ~14px (below the 22px floor) |
| Radii | 12 / 20 / 28 / pill | `rounded-2xl` / `rounded-3xl` / `rounded-full`, not the token set |
| Elevation | 6px solid 3D edge (`--edge-btn`) | Soft `shadow-lg` / `shadow-xl`, no pressable edge |
| Primary button | 64px, `#1F6408`, 6px `#164A05` edge, 24/700, trailing RTL arrow | 64px-ish green, no 3D edge, no arrow (or a text `←`) |
| Speaker | 80px `#0D4F9E` circle, 6px `#083A76` edge, custom glyph | 80–128px circle, Material-style speaker, drop shadow |
| Progress | 20px pill, fill `#3E9A00` from the **right**, inset highlight, 2px `#D5DCD7` border | 16px track, fill from the left, extra `۱/۹` caption |
| Close (X) | 56px white icon-btn, 3px `#D5DCD7`, 20px radius | 48px circle, 2px strong border (under 56px) |
| Bottom tab bar | 72px items, 34px Lucide icons, 22/700 labels, active `#E8F7D6` pill | 80px bar, emoji icons, ~14px labels, active is green text only |
| Mascot | Exact hoopoe SVG from the HTML | Same bird family, but welcome/path/complete do not use the mockup framing, cheer pose, or path companion |
| Icons | Lucide-like stroke 2.6 (home, bars, user, x, check, star, lock, pencil) | Emoji (🏠🔥🌷✓⭐🔒) |

---

## 01 — Onboarding welcome

Mockup: step dots, speech bubble «سلام! من هُدی هستم.», 230px hoopoe, «خوش آمدید», 24px subtitle, 80px speaker + «دوباره گوش کنید», full-width «شروع کنیم ←».

App: giant hoopoe + 128px speaker + «برای شنیدن، اینجا بزنید». No dots, bubble, title, subtitle, or primary button. Extra **sound-check** screen (01b) does not exist in the mockups.

## 02 — Avatar and name (one screen)

Mockup: dots on step 2; speaker + «یک تصویر برای خودتان انتخاب کنید»; 3×2 **illustrated** cards (tulip/tea/cypress/pomegranate/sun/moon) with 3px `#D5DCD7` + 5px edge, selected `#E3EEFB`/`#0D4F9E`; second speaker + «شما را چه صدا کنیم؟»; **chip pills** (مادر جان selected); «ادامه ←» + ghost «بعداً».

App: avatar and name are **two screens**. Emoji tiles (including grapes instead of pomegranate), 48px circular back, no speaker, no dots, no chips, no continue. Name is a stack of full-width bordered rows.

## 03 — Track picker

Mockup: dots on step 3; speaker + prompt; two **row-cards** with 3D teal/plum edges, preview tiles (three pomegranates + «۱ ۲ ۳», «ا ب پ»), titles 26/800, muted one-liners «شمردن، پول، ساعت» / «حرف‌ها و کلمه‌های ساده», inline 56px speaker + «این را می‌خواهم»; footer «هر وقت خواستید، می‌توانید عوض کنید.»

App: two flat tinted panels, apple emoji / letter «ب», different body copy, no speakers, no CTA buttons, circular back only.

## 04 — Lesson path

Mockup: three 56px chips (حساب+pomegranate, flame+۵, star+۱۲۰); green-700 unit banner with **white** speaker, «بخش ۱» 22/700, title 26/800, 6px `#164A05` edge; dotted bezier path; nodes 84px (current 100px + 10px glow); done = `#3E9A00` + check; current = `#1F6408` + star + «شروع» tooltip; locked grey lock; review saffron lock; hoopoe sitting on the path; tab bar as specified.

App: header is avatar + name + «۰ روز این هفته» + yellow streak pill; unit banner speaker is blue-on-white; title is the live unit («یک، دو، سه») not «شمردن از ۱ تا ۵»; vertical grey spine, 72px nodes, emoji glyphs, «شروع» as a separate pill under the current node; no hoopoe; emoji tab bar.

## 05 — Tap picture

Mockup: X + 20px progress only; speaker + ««سیب» کدام است؟»; 2×2 **172px** illustrated cards; selected blue; bottom «بررسی».

App: X + thin bar + `۱/۹` (intro still showing in the capture — heading is missing); vertical **emoji** stack; «ادامه» on intro instead of the check bar; no 2×2 illustrated grid.

## 06 — Listen and choose letter

Mockup: prompt only (no inline speaker); **136px** hero speaker; «آهسته‌تر» turtle pill; 3× **150px** glyph cards at 84px; «بررسی».

App: 128px speaker + «گوش کنید»; stacked 128px-tall letter rows; no slow-audio pill; no 3-up glyph grid.

## 07 — Trace letter

Mockup: speaker + «حرف «ب» را با انگشت بکشید»; 380px stroke card with green start circle «۱», dashed grey path, blue arrow, hand cue, «از دایرهٔ سبز شروع کنید»; secondary «دوباره نشانم بده» + eraser; disabled «بررسی».

App: giant grey letter + bouncing 👆; «روی حرف بزنید تا ادامه دهید»; auto-advances on tap; no stroke guide, no secondary actions, no disabled check.

## 08 — Count objects

Mockup: speaker + «چند تا انار هست؟»; 250px cream tray, 2×2 pomegranate illustrations; 3× **120px** digit cards (۳ ۴ ۵), ۴ selected; «بررسی».

App: after a full reload the audio-unlock overlay covers the lesson (session audio flag is not persisted). When the overlay is dismissed the live UI is still emoji objects + small digit buttons, heading «چند؟», no cream tray.

## 09 — Match

Mockup: speaker + «هر عدد را به سیب‌هایش ببرید»; object rows with dashed 84px slots; one correct green row; tray of number tiles; dragged «۳» + hand; disabled «بررسی».

App: two text columns, tap-left-then-right, blue pair chips, no illustrations, no slots, no drag treatment.

## 10 — Number line

Mockup: speaker + «عدد «۳» کجاست؟»; helper line; 300px card with RTL line ۰–۵, green pin, blue arrow, «کمتر / بیشتر ←»; «۳ = •••» pomegranates; «بررسی» (no extra choice row).

App: brown-bordered scroller, tiny ticks, «شروع / حرکت» caption, 3-up choice grid, Tailwind `brown-*` colors that are not in the design tokens.

## 11 — Correct feedback sheet

Mockup: dimmed cards (correct apple stays green + check); sheet `#E8F7D6`, 28px top radii, elev-3; 72px white check tile; «آفرین!» 32/800; 24px subtitle; 56px speaker; «۱۰+ امتیاز» + saffron star; «ادامه ←».

App: full-width green sheet, emoji ✓, title only, no subtitle / XP / speaker, generic shadow, no card-state change behind the sheet.

## 12 — Retry feedback sheet

Mockup: clay `#FFF1E6` sheet; hoopoe in 72px tile; «نزدیک بود!»; «با هم دوباره بشماریم.»; speaker; dashed hint + bulb; clay-800 «دوباره امتحان کنیم» with replay icon; objects get count badges.

App: clay sheet, flamingo emoji, title only, no hint box, no hoopoe, no badges.

## 13 — Lesson complete

Mockup: confetti shapes, **cheer** hoopoe (wings up, smiling eyes), «آفرین، مادر جان!» 40/900, speaker + «درس «شمردن تا ۵» تمام شد.»; three stat tiles (saffron امتیاز ۲۰+, blue زمان ۴ دقیقه, green روز پیاپی ۵); «ادامه ←» + ghost «همین درس را دوباره بخوانیم».

App: idle hoopoe, «آفرین، مادر جان!» 36-ish, «درس تمام شد», emoji stat cards, single continue, no ghost replay, no speaker.

## 14 — Streak

Mockup: 132px flame with white ۵; speaker + «۵ روز پشت سر هم!»; week row ش ی د س چ پ ج (filled orange checks + today ring); circular «۱ از ۲» + «هدف امروز: ۲ درس»; rest-day moon card; tab bar with پیشرفت active.

App: «پیشرفت شما» header + circular back; 🔥 + big number + «روز این هفته»; unlabeled day dots; large ring «۰ از ۲»; no rest-day card; emoji tab bar.

## 15 — Profile

Mockup: 80px tulip avatar + «مادر جان» + «از مهر ۱۴۰۵ با ما» + pencil; three stat tiles (streak 5, XP ۳۴۰, letters ۸); stacked progress «عددها و حساب / بخش ۲ از ۶» teal, «الفبا و خواندن / ۸ حرف از ۳۲» plum + learned-letter tiles; segmented «آهسته / عادی»; autoplay toggle 96×56; tab bar من active.

App: «من» header + back; huge emoji; three emoji stat cards; 🍎 عددها / ب الفبا switches; thin progress bars; no speed or autoplay; emoji tab bar.

---

## Highest-impact fix order

1. Port `tokens.css` + `components.css` into the Tailwind theme and global CSS (type, color, radius, edge, targets).
2. App shell + Lucide tab bar.
3. Lesson path (chips, unit, nodes, hoopoe).
4. Exercise frame (X, 20px RTL progress, speaker, «بررسی»).
5. Feedback sheets.
6. Each exercise + remaining screens, using mockup hoopoe SVG and object art.

---

## After (this branch)

Playwright 390×844, `deviceScaleFactor: 2`. Shots in `docs/screenshots/design-match/after/`. Tokens, 3D edges, Lucide nav, hoopoe SVG, and object art now match the mockup system. Remaining gaps are almost all **live lesson copy** (the mockups used sample prompts) plus the mockup-only iOS status bar.

| Screen | After vs mockup |
|---|---|
| 01 welcome | Matches: dots, bubble, hoopoe, type, speaker + «دوباره گوش کنید», 3D «شروع کنیم ←». No fake status bar. |
| 02 avatar+name | Matches: 3×2 illustrated cards, chips, speakers, «ادامه ←» + «بعداً». Extra RTL back control (kept from review). |
| 03 tracks | Matches: teal/plum 3D row-cards, preview tiles, «این را می‌خواهم», footer. Extra back control. |
| 04 path | Matches: chips (حساب / ۵ / ۱۲۰), unit banner, 84/100 nodes, checks/star/locks, hoopoe, Lucide tab bar. Unit title is live («یک، دو، سه») not the mockup sample «شمردن از ۱ تا ۵». |
| 05 tap | Same frame (X, RTL 20px bar, speaker, 3D cards, «بررسی»). Live content is a 3-option «س» word, not the 2×2 «سیب» sample. |
| 06 listen | Hero speaker + «آهسته‌تر» + glyph cards + «بررسی». Live «ب / آ» (2 options) vs mockup 3. |
| 07 trace | Matches: prompt, 380px stroke card, green start «۱», dashed path, arrow, hand, replay + eraser, disabled «بررسی». |
| 08 count | Same tray + 120px digits + «بررسی». Live 4 keys, not 4 pomegranates. |
| 09 match | Object rows, dashed 84px slots, number tray, «بررسی». Live apple rows vs mockup sample. |
| 10 number line | Pin, RTL ticks, کمتر/بیشتر, pomegranate legend. Live 0–10 two-step prompt vs mockup 0–۵ «عدد ۳». |
| 11 correct | Green sheet, check tile, speaker, «آفرین!», +۱۰ امتیاز, «ادامه ←», dimmed unselected cards. |
| 12 retry | Clay sheet, hoopoe, speaker, hint + bulb, «دوباره امتحان کنیم». |
| 13 complete | Cheer hoopoe, confetti, «آفرین، مادر جان!», lesson title, three stat tiles, «ادامه ←» + ghost replay. |
| 14 streak | Flame+۵, week ش…ج with checks, ۱ از ۲ ring, rest-day card, پیشرفت tab. |
| 15 profile | Tulip + name + مهر ۱۴۰۵, streak/XP/letters, teal/plum bars, letter tiles, speed + autoplay, من tab. |

Intentional: no fake 9:41 status bar in the PWA. A11y floors kept (56px targets, 22px body, audio on every prompt).
