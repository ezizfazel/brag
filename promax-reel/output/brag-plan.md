# PROMAX MOBILE — Reel: «با یک کلمه آیفونت رو باز کن»

## Source analysis
- File: iPhone camera recording (not a screen recording) of an iPhone on a desk, **720×1280, 25 fps, HEVC, 58.9 s**, with the presenter's own narration (AAC stereo).
- Phone screen sits at roughly x 225–505, y 620–1110 (source px) and stays still the whole time, so zooms are keyed to fixed screen coordinates.
- The trick shown: **Voice Control + Custom Gesture**. Phrase typed and spoken: **"promax"**.

| Source time | What happens |
|---|---|
| 0–5 | Lock screen, opens passcode keypad |
| 5–12.6 | Marks each passcode digit position on the glass with a whiteboard marker |
| 12.6–15 | Settings → Accessibility |
| 15–21.3 | Scrolls, taps Voice Control |
| 21.3–25.8 | Commands → Create New Command |
| 25.8–31 | Phrase: types "promax" |
| 31–34 | Action → Run Custom Gesture |
| 34–41 | New Gesture: taps the marked dots in passcode order, Save |
| 41–47 | Saves command, back, turns Voice Control ON |
| 47–54 | Locks phone, wakes it, says "promax" (≈54.1) |
| 54.2–56 | Passcode auto-taps → home screen at 56.0 |
| 56–58.9 | Home screen, closing words |

## Decisions
- **Length ≈ 62.6 s.** The brief says no step may be cut and the narration must stay intact, so the edit runs 1:1 against the narration. Extras: a 1.2 s speed ramp on the unlock and a 2.5 s branded outro. That's longer than the usual 15–25 s, on purpose.
- **25 fps** = the source rate. Converting to 30 would add judder.
- **Privacy:** the Apple account name (Settings, 12.6–15 s) and the Notification Center previews showing other people's names (52.2–53 s) are blurred.
- Text over the footage is Persian. iOS menu names stay in English exactly as they appear on screen (Accessibility, Voice Control, Commands…), so viewers can find them.

## Storyboard (output time)
| Out | Scene | Text | Visual | Sound |
|---|---|---|---|---|
| 0–2.6 | Hook | «فقط با گفتن یک کلمه، آیفونت رو باز کن!» | dark bg, electric-blue light lines, motion-blur type-in | bass hit |
| 2.6–5 | Intro | «بدون لمس گوشی!» | footage reveal, soft push, thin blue guide frame round the screen | whoosh |
| 5–12.7 | Step ۱ | محل اعداد رمز رو روی صفحه علامت بزن | zoom on keypad, glow | UI click |
| 12.7–19 | Step ۲ | تنظیمات › Accessibility | zoom + highlight row (account blurred) | click |
| 19–21.3 | Step ۳ | Voice Control رو باز کن | zoom + highlight | click |
| 21.3–26 | Step ۴ | Commands › Create New Command | highlight both rows in turn | click |
| 26–31 | Step ۵ | عبارت رو بنویس: promax | highlight phrase field | click |
| 31–34.5 | Step ۶ | Action › Run Custom Gesture | highlight | click |
| 34.5–41 | Step ۷ | روی نقطه‌ها به ترتیب رمز بزن و Save | highlight dots, then Save | click |
| 41–47.5 | Step ۸ | ذخیره کن و Voice Control رو روشن کن | Save, then the toggle | click |
| 47.5–54.8 | Step ۹ | گوشی رو قفل کن و بگو «promax» | overview, highlight the "promax" bubble | — |
| 54.8–57.2 | Unlock | «باز شد!» | speed ramp 0.5×, blue flash as home screen lands | riser → cinematic hit |
| 57.2–62.6 | Outro | PROMAX MOBILE · «ترفندهای جذاب آیفون رو با پرومکس یاد بگیر!» · «این ترفند رو امتحان کن و برای دوستت بفرست.» | blurred home screen, logo lockup, light lines | whoosh, luxury impact, final chord |

## Sound
Original narration is the lead (cleaned and normalised). An original synthesized electronic-cinematic bed runs underneath, side-chain ducked under the voice. SFX: bass hits, whooshes, soft UI clicks for each step, and a riser + hit on the unlock.
