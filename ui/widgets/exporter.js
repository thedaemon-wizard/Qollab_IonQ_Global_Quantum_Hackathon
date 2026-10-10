// Export buttons. The project frame cannot download files (its sandbox has no
// allow-downloads), so every export goes through Qollab's sendFile, which lists the file in the
// run console with a download button. In other hosts the same call is answered by the host.
import { h } from '../core/dom.js';
import { icon } from '../core/icons.js';

function toBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

export function csv(rows, columns) {
  const esc = (v) => {
    const t = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  return [columns.join(','), ...rows.map((r) => columns.map((c) => esc(r[c])).join(','))].join('\n');
}

const STYLE_PROPS = ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'opacity', 'fill-opacity', 'font-size', 'font-family', 'font-weight', 'text-anchor'];

/** Rasterise an inline SVG (with CSS variables resolved) to a PNG data URL. */
async function svgToPngBase64(svg, background) {
  const clone = svg.cloneNode(true);
  const src = svg.querySelectorAll('*');
  const dst = clone.querySelectorAll('*');
  src.forEach((el, i) => {
    const cs = getComputedStyle(el);
    const parts = STYLE_PROPS.map((p) => `${p}:${cs.getPropertyValue(p)}`).join(';');
    dst[i].setAttribute('style', parts);
  });
  const vb = svg.viewBox.baseVal;
  const scale = 2;
  clone.setAttribute('width', vb.width * scale);
  clone.setAttribute('height', vb.height * scale);
  const xml = new XMLSerializer().serializeToString(clone);
  const img = new Image();
  img.src = `data:image/svg+xml;base64,${toBase64(xml)}`;
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = vb.width * scale;
  canvas.height = vb.height * scale;
  const g = canvas.getContext('2d');
  g.fillStyle = background;
  g.fillRect(0, 0, canvas.width, canvas.height);
  g.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png').split(',')[1];
}

export function exportBar(ctx, items, status) {
  // items: [{label, kind: 'json'|'csv'|'png', name, get: () => data | SVGElement}]
  const bar = h('div', { class: 'toolbar', role: 'group', 'aria-label': 'Export' });
  for (const item of items) {
    const btn = h('button', { class: 'btn', type: 'button' }, icon(item.kind === 'png' ? 'photo' : 'file-export'), item.label);
    btn.addEventListener('click', async () => {
      try {
        const data = item.get();
        if (!data) throw new Error('nothing to export yet - run the lab first');
        let b64;
        let mime;
        if (item.kind === 'png') {
          b64 = await svgToPngBase64(data, getComputedStyle(ctx.root).getPropertyValue('--surface').trim() || '#fff');
          mime = 'image/png';
        } else if (item.kind === 'csv') {
          b64 = toBase64(data);
          mime = 'text/csv';
        } else {
          b64 = toBase64(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
          mime = 'application/json';
        }
        await ctx.api.sendFile(item.name, mime, b64);
        status(`${item.name} was sent to the run console; download it there.`);
      } catch (err) {
        status(`Export failed: ${err.message || err}`, true);
      }
    });
    bar.append(btn);
  }
  return bar;
}
