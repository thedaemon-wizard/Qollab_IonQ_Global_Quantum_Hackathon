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
| Text alternative | The SVG has a title and a description that names the current stage and its numbers (S with its interval, Q_Z, Q_X, the certificates that hold); the stepper and the status line give the same in text |
| 320 px | No horizontal page scroll; the diagram scrolls inside a box that becomes focusable (`role="region"`, "Protocol diagram") |
