# Accessibility checks (2026-10-10)

Run against the local harness (`tools/devserver/`), which serves the same `index.html`,
`main.js`, `main.css` and `ui/` as the Qollab project.

| Check | Result |
|---|---|
| axe-core 4.14.0, tags wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa, best-practice; all 8 views (Bell Lab after a run), dark and light schemes | 0 violations in all 16 combinations (`axe_20261010.json`). The first pass found one best-practice issue (no `<h1>`), fixed by making the app title the `<h1>`. axe leaves colour contrast "incomplete" where text sits on translucent fills; the colour tokens were checked directly (below). |
| Lighthouse 13 (Chrome DevTools), desktop dark and mobile light | Accessibility 100, Best Practices 100 (`lighthouse_20261010.json`). The two other flags are the harness page's missing meta description and a layout shift while views load. |
| Colour tokens (WCAG 2.2 contrast against all three background tokens) | Dark: text 13.0, muted 7.3, accent 7.4, series colours 5.9–11.6. Light: text 15.8, muted 7.0, accent 5.6, series colours 4.6–5.9 (orange darkened to #a35600 after this check; it was 4.1). Every series also differs by line style or marker shape. |
| 320 px wide viewport | No horizontal page scroll on any view after fixing three spots (nested grid, slider row, wide formulas, which now scroll inside their own box). `narrow_320_method.png`. |
| Keyboard | Skip link, visible focus ring, navigation buttons with `aria-current`, guided tour with Enter/→/←/Esc and focus returned to the opener, 3D view operable by buttons, all charts with `<title>`/`<desc>` and a data table. |
| Motion | `prefers-reduced-motion`: the Bell Lab replay jumps to the result and the 3D view does not rotate. |

## Second review (2026-10-10, afternoon)

An independent review of the code and a live check on the harness found issues that the
automated tools do not test. Fixed, then axe-core 4.14.0 was run again on all 8 views (Bell Lab
after a run, Repeater after a chain run, the circuits view in Qiskit-text mode) in both schemes:
0 violations in all 16 combinations (`axe_20261010_round2.json`). Lighthouse 13.5.0 (desktop) still scores accessibility 100.

| Issue (WCAG 2.2) | Fix | Checked |
|---|---|---|
| Tour box cut off at 400 % zoom (1.4.10 Reflow) and left off-screen after a resize | Box limited to the viewport height and scrolls inside; repositioned on resize | 320 × 256 px: box from y = 8 to 240, close button visible |
| Keyboard focus dropped to the page when a focused button became disabled (2.4.3) | Focus moves to the tour title or to the status line first | After pressing Run or Next, focus is on the status line / tour title |
| Input borders 1.5:1 (1.4.11 Non-text contrast) | Separate control-border colour: 3.6–4.0:1 dark, 3.4–3.8:1 light | Computed from the tokens |
| Correlation-space points: dark-theme colours in light mode, and told apart by colour only in 3D (1.4.1) | Points use the theme's series colours and the same marker shape in 3D, the 2D slice and the legend | Light mode: legend and slice markers |
| Sideways-scrolling tables and circuit diagrams not reachable by keyboard in Safari (2.1.1) | Such boxes get `tabindex="0"`, `role="region"` and a name while they overflow | 320 px: overflowing tables become focusable |
| Header 8 px too wide at 320 px | Root grid column `minmax(0, 1fr)`, backend chip may wrap | No horizontal page scroll at 320 px |
| Repeater charts without a data table; active protocol stage not exposed | Data tables (predicted, this session, recorded, with intervals); `aria-current="step"` | Live |
| Jargon (QBER, Werner, i.i.d., TLM) not defined | "Terms used in this lab" in the Method view; QBER spelled out in the Certificates view | Live |

## Third check (2026-10-10, evening): the Bell Lab protocol diagram

The Bell Lab got a protocol diagram that follows the replay (decision D11). Checked after the
change on the local harness:

| Check | Result |
|---|---|
| axe-core 4.14.0, same tags, all 8 views (Bell Lab after a run), dark and light | 0 violations in all 16 combinations (`axe_20261010_round3.json`) |
| Lighthouse 13.5.0, snapshot of the Bell Lab after a run, dark and light | Accessibility 100, Best Practices 100 (`lighthouse_20261010_round3.json`) |
| Diagram follows the stepper (Pause after the first stage, then Step four times) | Every box's state equals its stage's state in the stepper at each step; the certificate boxes say the same as the ladder table (`protocol_diagram_checks_20261010.json`, 17 of 17 checks) |
| Motion (2.2.2 Pause, Stop, Hide; 2.3.3) | The highlight moves only while the replay plays (about 5.5 s); paused or done, no animation runs; with reduced motion all stages are shown done at once |
| Text alternative | The SVG has a title and a description that names the current stage and its numbers ($`S`$ with its interval, $`Q_Z`$, $`Q_X`$, the certificates that hold); the stepper and the status line give the same in text |
| 320 px | No horizontal page scroll; the diagram scrolls inside a box that becomes focusable (`role="region"`, "Protocol diagram") |

## Fourth check (2026-10-11): formulas typeset as math

The formulas in the views are native MathML now (Temml 0.14.0 from jsDelivr, Latin Modern Math;
the seven hand-built Method formulas use the same font).

| Check | Result |
|---|---|
| Formulas rendered (local harness, all 8 views, then a Bell Lab run) | 113 MathML formulas over the views, 0 Temml errors, no TeX left visible (`math_checks_20261011.json`). The re-run after the fallback fixes below counts the same 113, and 130 after one Bell Lab run (17 more: ladder, error rates, correlators) (`math_checks_20261011b.json`). |
| jsDelivr blocked | The same views show the formulas as Unicode text; only the 7 hand-built MathML formulas stay MathML. The console shows no new errors besides the two blocked requests (a 404 for the harness's missing `/favicon.ico` appears in both modes). A review found three flaws in the Unicode spelling: `\bigl`/`\bigr` printed as words, the space after every control word swallowed, and `^\circ` shown as `^°`. They were fixed, and the re-run finds none of them in any view (`math_checks_20261011b.json`, `fallbackArtifacts`). |
| Lighthouse 13.5.0, Bell Lab after a run, dark and light (re-run after the formula change) | Accessibility 100, Best Practices 100 (`lighthouse_20261011_math.json`) |
| axe-core 4.14.0, all 8 views, dark and light | 0 violations in all 16 combinations (`axe_20261011_math.json`). |
| 320 px wide viewport | No horizontal page scroll on any view. Two spots were fixed: term lists go to one column below 480 px (a formula cannot break inside), and the Repeater's rotation menu now shrinks with its column (it was 35 px too wide before this round). |
| Guided tour | Every step renders; steps 2–5, 7 and 8 contain typeset formulas, none shows a raw `$`. |
| Plain text kept | SVG text and titles, `<option>`, ARIA labels, `announce()` messages, `role="status"` lines and exports. The Bell Lab's prediction box (a polite live region) has MathML term labels; Temml annotates each with its TeX source. |

## Fifth check (2026-10-11, final): states beyond the default views

A final review found problems that appear only after runs, on Shift+Tab or at Qollab's
Fullscreen width (1014 px). They were fixed in the interface, then checked on the local harness
(`basic_simulator`, Chrome headless). The axe claim now covers exactly the states listed here.

| Check | Result |
|---|---|
| axe-core 4.14.0, tags wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa, best-practice; at 1280 × 900 and 1014 × 720, dark and light: all 8 views before any run, then the Bell Lab after a run, Certificates after that run, the Repeater after a chain run and after a purification run, Backends after the runs (Last run table filled) and Backends showing the repeater-chain circuits; at 375 × 812, dark and light: the Bell Lab after a run, the Repeater after a chain run and a purification run, Backends showing the chain circuits | 0 violations in all 62 runs (`axe_20261011_final.json`). Before the fixes, two best-practice rules failed in these states: a circuit `<figure>` with a caption took `role="region"` when it overflowed, and at 375 px the chain and purification ladders were two regions with the same name. The scroll region is now a box inside the figure, and each ladder names its run. |
| Lighthouse 13.5.0, snapshot of the Bell Lab after one run, 1280 × 900, dark and light | Accessibility 100, Best Practices 100 (`lighthouse_20261011_final.json`) |
| Focus not obscured (2.4.11), Shift+Tab from the end of the Bell Lab and of the Repeater after a run, at 1014 × 720, 900 × 700 and 375 × 812 | 0 of 66 focus stops under the sticky header or below the frame. The page's `scroll-padding-top` follows the header's height (a `ResizeObserver` sets `--hdr`); the sticky navigation uses the same offset. The review had found the shots and seed fields hidden under the header at 1014 px. |
| Guided tour with the keyboard (Enter, then → on each of the 10 steps) at 1014 × 720, 1280 × 900, 768 × 1024, 375 × 812 and 320 × 640 | In all 50 steps the top of the highlighted target is at or below the header and focus stays in the tour. At 1014 and 1280 px the box covers at most 12 % of a target; on a 320 × 640 screen it covers up to 77 %. After the tour the Bell Lab status shows its own last message, not the "job already running" notice of another view. |
| Text size in figures (font size × on-screen scale) | Protocol diagram (Bell Lab), the Overview diagrams, the repeater topology and the circuit diagram: at least 10 px on screen at 1280, 1014, 375 and 320 px. Below the width that allows this they scroll sideways in a named, focusable box. Gate angles in the circuit diagram are 10 px (were 8.5). Not changed: the timeline and the charts, whose labels stay below 10 px at 320–375 px. |
| Header at narrow widths | When idle, one row (52 px) at 1280, 1014, 900 and 768 px (the brand's subtitle is hidden below 1000 px) and two rows (91 and 83 px, were 124) at 375 and 320 px (the tour button shows its icon and the chip the backend name; the hidden texts remain in the accessibility tree). While "Python is working…" shows, the header wraps to two rows (90 px) at 1014 and 768 px; the scroll padding and the navigation offset follow it. |
| Legends | A hollow marker (the conservative end) is hollow in the legend too. A point outside the axes is pinned to the edge with a small arrow; it is no longer drawn hollow. |

## Sixth check (2026-10-12 JST = 2026-10-11 16:37–16:43 UTC): charts on phones, the section strip, the busy header

Two items left open by the fifth check (text size in the charts and the timeline, and the header
while Python works), the section menu on a phone and the legend swatches were fixed in the
interface, then checked on the local harness (`basic_simulator`, Chrome headless).

| Check | Result |
|---|---|
| Text size in figures (font size × on-screen scale), every figure SVG of the 8 views (20 per width) after a Bell Lab run, a chain run and a purification run, dark, at 1280 × 900, 1014 × 720, 768 × 1024, 375 × 812 and 320 × 640 | Before: labels below 10 px in 0, 4, 0, 13 and 14 of the 20 figures (smallest 8.5 px at 1014, 5.9 px at 375, 4.9 px at 320). After: 0 at every width; the smallest label is 10.0 px. The line charts, the counts chart, the $`S`$ gauge and the Repeater timeline now work like the diagrams: below the width that keeps their labels at 10 px they scroll sideways in their own box, which is a named, focusable region while it overflows, and below 768 px a short note under the drawing says that it scrolls sideways. At 1280 and 768 px all 20 figures keep their widths and sizes. At 1014 px the noise-sweep charts (8.5 px) take the card's full width, and the gauge and counts chart (9.6 px) use slightly larger labels while they are narrower than 367 px, so neither scrolls there. |
| Section navigation on a phone (≤ 600 px) | The strip of sections stays under the header while the page scrolls (measured after scrolling 1500 px at 600, 375 and 320 px). It scrolls sideways by itself; a fade at the left or right edge shows that more sections follow on that side, and the current section's button is scrolled into the strip. It is still a `nav` with buttons in document order and `aria-current="page"`. The page's `scroll-padding-top` adds the strip's height (`--navh`): 149, 150 and 142 px at 600, 375 and 320 px. The guided tour treats the strip as part of the header. |
| Header while "Python is working…" shows | One row (52 px) at 1280, 1099, 1014, 900 and 768 px (it wrapped to 90 px at 1014 and 768 px). Below 1100 px the indicator shows its spinner and keeps its text for screen readers; its status region is unchanged. |
| Chart legends on a phone | Legend swatches keep their 28 × 12 px size; at 375 px they had grown to as much as 140 × 60 px. |
| axe-core 4.14.0, tags wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa, best-practice; at 1280 × 900 and 1014 × 720 (dark and light), 375 × 812 (dark and light) and 320 × 640 (light): all 8 views before any run, then the Bell Lab, Certificates and Correlation space after a Bell Lab run, the Repeater after a chain run and after a purification run, Backends after the runs and Backends showing the repeater-chain circuits | 0 violations in all 105 runs, and no horizontal page scroll in any of them (`axe_20261012_final.json`). |
| Lighthouse 13.5.0, snapshot of the Bell Lab after one run, 1280 × 900, dark and light | Accessibility 100, Best Practices 100 (`lighthouse_20261012_final.json`) |
| Focus not obscured (2.4.11), Shift+Tab from the end of the Bell Lab and of the Repeater after a run, at 1014 × 720, 900 × 700, 375 × 812 and 320 × 640 | 0 of 103 focus stops under the sticky header (on a phone: under the header or the section strip) or below the frame. |
| Guided tour with the keyboard (Enter, then → on each of the 10 steps) at 1014 × 720, 375 × 812 and 320 × 640 | In all 30 steps the top of the highlighted target is at or below the header (on a phone: below the section strip) and focus stays in the tour. The box covers at most 12 % of a target at 1014 px, 51 % at 375 × 812 and 85 % at 320 × 640 (77 % in the fifth check; the strip now takes 49 px of the short screen). |
| README screenshots (`docs/img/screen_*.png`, 1280 × 760, dark) | Retaken with the current interface; the Overview and Real data images now show the current wording. |
