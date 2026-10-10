"""Copy the Tabler icons the UI uses into ui/core/icons.js.

Usage:
    npm pack @tabler/icons@3.49.0 && tar xzf tabler-icons-3.49.0.tgz
    python tools/vendor_icons.py package/

Only the inner SVG elements of each outline icon are kept (the 24x24 frame, stroke and
line-cap attributes are the same for every icon and are set by ``icon()`` in icons.js).
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NAMES = [
    "adjustments-horizontal",
    "alert-triangle",
    "arrow-down",
    "arrow-left",
    "arrow-right",
    "arrow-up",
    "arrows-exchange",
    "arrows-split",
    "atom",
    "binary",
    "book",
    "books",
    "building-broadcast-tower",
    "certificate",
    "chart-dots",
    "chart-histogram",
    "chart-line",
    "chart-scatter",
    "check",
    "chevron-left",
    "chevron-right",
    "circuit-switch-open",
    "compass",
    "cpu",
    "cube",
    "cube-3d-sphere",
    "database",
    "device-desktop",
    "dice-5",
    "download",
    "eye",
    "eye-off",
    "file-export",
    "filter",
    "fingerprint",
    "flask",
    "git-merge",
    "grid-dots",
    "help",
    "hierarchy",
    "home",
    "info-circle",
    "key",
    "layout-dashboard",
    "link",
    "list-check",
    "list-details",
    "lock",
    "math-function",
    "menu-2",
    "microscope",
    "moon",
    "photo",
    "player-pause",
    "player-play",
    "player-stop",
    "player-track-next",
    "refresh",
    "repeat",
    "rotate",
    "rotate-clockwise",
    "route",
    "ruler-measure",
    "school",
    "server",
    "settings",
    "shield-check",
    "shield-lock",
    "sparkles",
    "stack-2",
    "sun",
    "table",
    "target",
    "timeline",
    "topology-ring",
    "user",
    "users",
    "wave-sine",
    "world",
    "x",
    "zoom-reset",
]


def inner(svg: str) -> str:
    body = re.search(r"<svg[^>]*>(.*)</svg>", svg, re.S).group(1)
    parts = [p.strip() for p in re.findall(r"<[^>]+/>", body)]
    return "".join(p.replace(" />", "/>") for p in parts if 'stroke="none"' not in p)


def main(package: Path) -> None:
    meta = json.loads((package / "package.json").read_text(encoding="utf-8"))
    icons = {
        n: inner((package / "icons" / "outline" / f"{n}.svg").read_text(encoding="utf-8")) for n in NAMES
    }
    lines = [
        f"// Tabler Icons {meta['version']} (outline), MIT License, Copyright (c) 2020-2026 Paweł Kuna.",
        "// https://tabler.io/icons - subset copied by tools/vendor_icons.py; see THIRD_PARTY_NOTICES.md.",
        "const PATHS = {",
        *[f"  {json.dumps(k)}: {json.dumps(v)}," for k, v in icons.items()],
        "};",
        "",
        "const NS = 'http://www.w3.org/2000/svg';",
        "",
        "/** An inline SVG icon. Decorative (aria-hidden) unless a label is given. */",
        "export function icon(name, { label = '', size = 20, className = '' } = {}) {",
        "  const markup = PATHS[name];",
        "  if (markup === undefined) throw new Error(`unknown icon ${name}`);",
        "  const svg = document.createElementNS(NS, 'svg');",
        "  for (const [k, v] of Object.entries({",
        "    viewBox: '0 0 24 24', width: size, height: size, fill: 'none', stroke: 'currentColor',",
        "    'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',",
        "  })) svg.setAttribute(k, String(v));",
        "  svg.setAttribute('class', `icon ${className}`.trim());",
        "  svg.innerHTML = markup;",
        "  if (label) {",
        "    svg.setAttribute('role', 'img');",
        "    svg.setAttribute('aria-label', label);",
        "  } else {",
        "    svg.setAttribute('aria-hidden', 'true');",
        "  }",
        "  svg.setAttribute('focusable', 'false');",
        "  return svg;",
        "}",
        "",
        "/** The raw inner markup, for embedding an icon inside a larger SVG diagram. */",
        "export function iconMarkup(name) {",
        "  const markup = PATHS[name];",
        "  if (markup === undefined) throw new Error(`unknown icon ${name}`);",
        "  return markup;",
        "}",
        "",
        "export const ICON_NAMES = Object.keys(PATHS);",
        "",
    ]
    (ROOT / "ui" / "core" / "icons.js").write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {len(icons)} icons")


if __name__ == "__main__":
    main(Path(sys.argv[1]))
