// Accessible data table. columns: [{key, label, align?: 'text', format?: fn}]. `caption` is plain
// text (it also names the scroll region); `captionNode`, if given, is shown instead (formulas).
// `className` is added to the scroll box (e.g. 'wrap-head': headers wrap, text columns keep room).
import { h, scrollableWhenNeeded } from '../core/dom.js';

export function dataTable({ caption, captionNode, columns, rows, rowHeader = true, className = '' }) {
  const head = h('tr', null, columns.map((c) => h('th', { scope: 'col', class: c.align === 'text' ? 'text' : null }, c.label)));
  const body = rows.map((row) =>
    h('tr', null, columns.map((c, i) => {
      const value = c.format ? c.format(row[c.key], row) : row[c.key];
      const attrs = { class: c.align === 'text' ? 'text' : null };
      return i === 0 && rowHeader ? h('th', { ...attrs, scope: 'row' }, value) : h('td', attrs, value);
    })),
  );
  const wrap = h('div', { class: `table-wrap ${className}`.trim() },
    h('table', null, caption ? h('caption', null, captionNode ?? caption) : null, h('thead', null, head), h('tbody', null, body)));
  return scrollableWhenNeeded(wrap, caption ? `Table: ${caption.slice(0, 80)}` : 'Table');
}

/** A table hidden in <details>, used under every chart so the data is readable as text. */
export function detailsTable(summary, tableSpec) {
  return h('details', null, h('summary', null, summary), dataTable(tableSpec));
}
