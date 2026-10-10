# Accessibility checks (2026-10-10)

Run against the local harness (`tools/devserver/`), which serves the same `index.html`,
`main.js`, `main.css` and `ui/` as the Qollab project.

| Check | Result |
|---|---|
| axe-core 4.14.0, tags wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa, best-practice; all 8 views (Bell Lab after a run), dark and light schemes | 0 violations in all 16 combinations (`axe_20261010.json`). The first pass found one best-practice issue (no `<h1>`), fixed by making the app title the `<h1>`. axe leaves colour contrast "incomplete" where text sits on translucent fills; the colour tokens were checked directly (below). |
| Lighthouse 13 (Chrome DevTools), desktop dark and mobile light | Accessibility 100, Best Practices 100 (`lighthouse_*`). The two other flags are the harness page's missing meta description and a layout shift while views load. |
| Colour tokens (WCAG 2.2 contrast against all three background tokens) | Dark: text 13.0, muted 7.3, accent 7.4, series colours 5.9–11.6. Light: text 15.8, muted 7.0, accent 5.6, series colours 4.6–5.9 (orange darkened to #a35600 after this check; it was 4.1). Every series also differs by line style or marker shape. |
| 320 px wide viewport | No horizontal page scroll on any view after fixing three spots (nested grid, slider row, wide formulas, which now scroll inside their own box). `narrow_320_method.png`. |
| Keyboard | Skip link, visible focus ring, navigation buttons with `aria-current`, guided tour with Enter/→/←/Esc and focus returned to the opener, 3D view operable by buttons, all charts with `<title>`/`<desc>` and a data table. |
| Motion | `prefers-reduced-motion`: the Bell Lab replay jumps to the result and the 3D view does not rotate. |
